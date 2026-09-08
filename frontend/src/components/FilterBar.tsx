/**
 * FilterBar component - Filters with location-based filtering
 */
import { useState, useEffect } from 'react';
import { CATEGORY_LABELS, STATUS_LABELS } from '../types';
import { complaintApi } from '../services/api';

interface FilterBarProps {
  categoryFilter: string;
  statusFilter: string;
  onCategoryChange: (category: string) => void;
  onStatusChange: (status: string) => void;
  onLocationChange: (division: string, district: string, upazila: string) => void;
  complaintCounts: {
    total: number;
    filtered: number;
  };
}

export default function FilterBar({
  categoryFilter,
  statusFilter,
  onCategoryChange,
  onStatusChange,
  onLocationChange,
  complaintCounts,
}: FilterBarProps) {
  const [divisions, setDivisions] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [upazilas, setUpazilas] = useState<string[]>([]);
  
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedUpazila, setSelectedUpazila] = useState('');

  useEffect(() => {
    loadDivisions();
  }, []);

  useEffect(() => {
    if (selectedDivision) {
      loadDistricts(selectedDivision);
    } else {
      setDistricts([]);
      setUpazilas([]);
    }
    setSelectedDistrict('');
    setSelectedUpazila('');
  }, [selectedDivision]);

  useEffect(() => {
    if (selectedDivision && selectedDistrict) {
      loadUpazilas(selectedDivision, selectedDistrict);
    } else {
      setUpazilas([]);
    }
    setSelectedUpazila('');
  }, [selectedDistrict]);

  useEffect(() => {
    onLocationChange(selectedDivision, selectedDistrict, selectedUpazila);
  }, [selectedDivision, selectedDistrict, selectedUpazila]);

  const loadDivisions = async () => {
    try {
      const data = await complaintApi.getDivisions();
      setDivisions(data);
    } catch (error) {
      console.error('Failed to load divisions:', error);
    }
  };

  const loadDistricts = async (division: string) => {
    try {
      const data = await complaintApi.getDistricts(division);
      setDistricts(data);
    } catch (error) {
      console.error('Failed to load districts:', error);
    }
  };

  const loadUpazilas = async (division: string, district: string) => {
    try {
      const data = await complaintApi.getUpazilas(division, district);
      setUpazilas(data);
    } catch (error) {
      console.error('Failed to load upazilas:', error);
    }
  };

  const clearLocationFilters = () => {
    setSelectedDivision('');
    setSelectedDistrict('');
    setSelectedUpazila('');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 mb-4 space-y-3">
      {/* First Row: Total, Category, Status */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Total Count */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 py-2 rounded-lg">
          <p className="text-xs font-medium opacity-90">Total</p>
          <p className="text-xl font-bold">{complaintCounts.total}</p>
        </div>

        {/* Category Filter */}
        <div className="flex-1 min-w-[140px]">
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-2 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white"
          >
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex-1 min-w-[120px]">
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-2 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white"
          >
            <option value="all">All Status</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Second Row: Location Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-600 font-medium">📍 Location:</span>
        
        {/* Division */}
        <select
          value={selectedDivision}
          onChange={(e) => setSelectedDivision(e.target.value)}
          className="flex-1 min-w-[100px] px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white"
        >
          <option value="">All Divisions</option>
          {divisions.map((div) => (
            <option key={div} value={div}>{div}</option>
          ))}
        </select>

        {/* District */}
        <select
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
          className="flex-1 min-w-[100px] px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white"
          disabled={!selectedDivision}
        >
          <option value="">All Districts</option>
          {districts.map((dist) => (
            <option key={dist} value={dist}>{dist}</option>
          ))}
        </select>

        {/* Upazila */}
        <select
          value={selectedUpazila}
          onChange={(e) => setSelectedUpazila(e.target.value)}
          className="flex-1 min-w-[100px] px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white"
          disabled={!selectedDistrict}
        >
          <option value="">All Upazilas</option>
          {upazilas.map((upz) => (
            <option key={upz} value={upz}>{upz}</option>
          ))}
        </select>

        {/* Clear Location Button */}
        {(selectedDivision || selectedDistrict || selectedUpazila) && (
          <button
            onClick={clearLocationFilters}
            className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
            title="Clear location filters"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Filtered Count */}
      {complaintCounts.filtered !== complaintCounts.total && (
        <div className="text-xs text-gray-600 text-center">
          Showing <span className="font-semibold text-purple-600">{complaintCounts.filtered}</span> of {complaintCounts.total}
        </div>
      )}
    </div>
  );
}
