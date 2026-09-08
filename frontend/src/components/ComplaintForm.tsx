/**
 * ComplaintForm component - Bangladesh Civic Complaint Submission
 */
import { useState, useEffect, useRef } from 'react';
import type { ComplaintCreate, ComplaintCategory, UpazilaAvailability } from '../types';
import { CATEGORY_LABELS } from '../types';
import { complaintApi } from '../services/api';

interface ComplaintFormProps {
  onSubmit: (complaint: ComplaintCreate, mediaFile?: File) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function ComplaintForm({ onSubmit, onCancel, isSubmitting }: ComplaintFormProps) {
  // Form fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('other');
  const [division, setDivision] = useState('');
  const [district, setDistrict] = useState('');
  const [upazila, setUpazila] = useState('');
  const [localArea, setLocalArea] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [description, setDescription] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  
  // Location data from API
  const [divisions, setDivisions] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [upazilas, setUpazilas] = useState<string[]>([]);
  
  // Upazila availability check
  const [availability, setAvailability] = useState<UpazilaAvailability | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load divisions on mount
  useEffect(() => {
    loadDivisions();
  }, []);

  // Load districts when division changes
  useEffect(() => {
    if (division) {
      loadDistricts(division);
      setDistrict('');
      setUpazila('');
      setAvailability(null);
    } else {
      setDistricts([]);
      setUpazilas([]);
    }
  }, [division]);

  // Load upazilas when district changes
  useEffect(() => {
    if (division && district) {
      loadUpazilas(division, district);
      setUpazila('');
      setAvailability(null);
    } else {
      setUpazilas([]);
    }
  }, [district, division]);

  // Check availability when upazila is selected
  useEffect(() => {
    if (division && district && upazila) {
      checkUpazilaAvailability(division, district, upazila);
    } else {
      setAvailability(null);
    }
  }, [upazila]);

  const loadDivisions = async () => {
    try {
      const data = await complaintApi.getDivisions();
      setDivisions(data);
    } catch (error) {
      console.error('Failed to load divisions:', error);
    }
  };

  const loadDistricts = async (selectedDivision: string) => {
    try {
      const data = await complaintApi.getDistricts(selectedDivision);
      setDistricts(data);
    } catch (error) {
      console.error('Failed to load districts:', error);
    }
  };

  const loadUpazilas = async (selectedDivision: string, selectedDistrict: string) => {
    try {
      const data = await complaintApi.getUpazilas(selectedDivision, selectedDistrict);
      setUpazilas(data);
    } catch (error) {
      console.error('Failed to load upazilas:', error);
    }
  };

  const checkUpazilaAvailability = async (div: string, dist: string, upz: string) => {
    setCheckingAvailability(true);
    try {
      const data = await complaintApi.checkUpazilaAvailability(div, dist, upz);
      setAvailability(data);
    } catch (error) {
      console.error('Failed to check availability:', error);
      setAvailability(null);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
                          'video/mp4', 'video/mov', 'video/avi', 'video/webm'];
      if (!validTypes.includes(file.type)) {
        alert('Invalid file type. Please upload an image (JPG, PNG, GIF, WebP) or video (MP4, MOV, AVI, WebM)');
        return;
      }

      setMediaFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if upazila is available
    if (!availability?.available) {
      alert('Please select an available upazila/thana before submitting.');
      return;
    }
    
    if (title.trim() && description.trim().length >= 10) {
      onSubmit(
        {
          title: title.trim(),
          category,
          division,
          district,
          upazila,
          local_area: localArea.trim(),
          phone_number: phoneNumber.trim(),
          description: description.trim(),
        },
        mediaFile || undefined
      );
    }
  };

  const isVideo = (url: string | null) => {
    if (!url) return false;
    return url.includes('.mp4') || url.includes('.mov') || url.includes('.avi') || url.includes('.webm') || 
           mediaFile?.type.startsWith('video/');
  };

  const canSubmit = availability?.available && title.trim() && description.trim().length >= 10 && 
                    division && district && upazila && localArea.trim() && phoneNumber.trim();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 sticky top-0 bg-white pb-2 border-b">
            Report New Complaint
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="Brief description of the issue"
                required
                maxLength={200}
                autoFocus
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                className="input-field"
                required
              >
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Hierarchy - Division, District, Upazila */}
            <div className="space-y-3 border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="font-medium text-gray-900">Location <span className="text-red-500">*</span></h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Division */}
                <div>
                  <label htmlFor="division" className="block text-sm font-medium text-gray-700 mb-1">
                    Division
                  </label>
                  <select
                    id="division"
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    className="input-field"
                    required
                  >
                    <option value="">Select Division</option>
                    {divisions.map((div) => (
                      <option key={div} value={div}>
                        {div}
                      </option>
                    ))}
                  </select>
                </div>

                {/* District */}
                <div>
                  <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
                    District
                  </label>
                  <select
                    id="district"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="input-field"
                    required
                    disabled={!division}
                  >
                    <option value="">Select District</option>
                    {districts.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Upazila/Thana */}
                <div>
                  <label htmlFor="upazila" className="block text-sm font-medium text-gray-700 mb-1">
                    Upazila/Thana
                  </label>
                  <select
                    id="upazila"
                    value={upazila}
                    onChange={(e) => setUpazila(e.target.value)}
                    className="input-field"
                    required
                    disabled={!district}
                  >
                    <option value="">Select Upazila</option>
                    {upazilas.map((upz) => (
                      <option key={upz} value={upz}>
                        {upz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Availability Status */}
              {checkingAvailability && (
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking availability...
                </div>
              )}
              {availability && !checkingAvailability && (
                <div className={`p-3 rounded-md ${availability.available ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                  <p className={`text-sm ${availability.available ? 'text-green-800' : 'text-yellow-800'}`}>
                    {availability.available ? '✓ ' : '⚠️ '}
                    {availability.message}
                  </p>
                </div>
              )}
            </div>

            {/* Specific Location */}
            <div>
              <label htmlFor="localArea" className="block text-sm font-medium text-gray-700 mb-2">
                Specific Location/Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="localArea"
                value={localArea}
                onChange={(e) => setLocalArea(e.target.value)}
                className="input-field"
                placeholder="e.g., Near City Hall, Main Road"
                required
                maxLength={200}
              />
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="input-field"
                placeholder="01XXXXXXXXX"
                required
                maxLength={20}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field resize-none"
                placeholder="Provide detailed information about the problem (minimum 10 characters)"
                rows={5}
                required
                minLength={10}
              />
              <p className="text-xs text-gray-500 mt-1">
                {description.length}/1000 characters {description.length < 10 && '(minimum 10 required)'}
              </p>
            </div>

            {/* Media Upload - Evidence */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo/Video Evidence (Optional)
              </label>
              
              {!mediaPreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="media-upload"
                  />
                  <label htmlFor="media-upload" className="cursor-pointer">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">
                      Click to upload photo or video
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      JPG, PNG, GIF, WebP, MP4, MOV (max 10MB)
                    </p>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  {isVideo(mediaPreview) ? (
                    <video
                      src={mediaPreview}
                      controls
                      className="w-full max-h-96 rounded-lg object-contain bg-gray-100"
                    />
                  ) : (
                    <img
                      src={mediaPreview}
                      alt="Preview"
                      className="w-full max-h-96 rounded-lg object-contain bg-gray-100"
                    />
                  )}
                  <button
                    type="button"
                    onClick={removeMedia}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-colors"
                    title="Remove media"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button 
                type="submit" 
                className="btn-primary flex-1"
                disabled={isSubmitting || !canSubmit}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit Complaint'
                )}
              </button>
              <button 
                type="button" 
                onClick={onCancel} 
                className="btn-secondary flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
