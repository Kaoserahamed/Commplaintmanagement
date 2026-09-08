/**
 * ComplaintForm component - Create/Edit complaint form with media upload
 */
import { useState, useEffect, useRef } from 'react';
import type { Complaint, ComplaintCreate, ComplaintCategory, ComplaintPriority } from '../types';
import { CATEGORY_LABELS, PRIORITY_LABELS } from '../types';

interface ComplaintFormProps {
  complaint?: Complaint | null;
  onSubmit: (complaint: ComplaintCreate, mediaFile?: File) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function ComplaintForm({ complaint, onSubmit, onCancel, isSubmitting }: ComplaintFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('other');
  const [priority, setPriority] = useState<ComplaintPriority>('medium');
  const [location, setLocation] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (complaint) {
      setTitle(complaint.title);
      setDescription(complaint.description);
      setCategory(complaint.category);
      setPriority(complaint.priority);
      setLocation(complaint.location || '');
      setMediaPreview(complaint.media_url);
    } else {
      setTitle('');
      setDescription('');
      setCategory('other');
      setPriority('medium');
      setLocation('');
      setMediaFile(null);
      setMediaPreview(null);
    }
  }, [complaint]);

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
    
    if (title.trim() && description.trim().length >= 10) {
      onSubmit(
        {
          title: title.trim(),
          description: description.trim(),
          category,
          priority,
          location: location.trim() || undefined,
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full my-8">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {complaint ? 'Edit Complaint' : 'Report New Complaint'}
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

            {/* Category and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                  className="input-field"
                >
                  {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
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

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="input-field"
                placeholder="e.g., Main Street near City Hall, Ward 5"
                maxLength={500}
              />
            </div>

            {/* Media Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo/Video Evidence
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
                disabled={isSubmitting}
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
                  complaint ? 'Update Complaint' : 'Submit Complaint'
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
