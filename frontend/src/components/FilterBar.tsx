/**
 * FilterBar component - Filter complaints by category, status, and priority
 */
import { CATEGORY_LABELS, STATUS_LABELS, PRIORITY_LABELS } from '../types';

interface FilterBarProps {
  categoryFilter: string;
  statusFilter: string;
  priorityFilter: string;
  onCategoryChange: (category: string) => void;
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: string) => void;
  complaintCounts: {
    total: number;
    filtered: number;
  };
}

export default function FilterBar({
  categoryFilter,
  statusFilter,
  priorityFilter,
  onCategoryChange,
  onStatusChange,
  onPriorityChange,
  complaintCounts,
}: FilterBarProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Category Filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
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
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
          >
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </label>
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
          >
            <option value="all">All Priorities</option>
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Results Count */}
        <div className="flex items-end">
          <div className="px-4 py-2 bg-primary-50 border border-primary-200 rounded-lg">
            <p className="text-sm text-primary-900">
              <span className="font-bold text-lg">{complaintCounts.filtered}</span>
              <span className="text-primary-700"> / {complaintCounts.total}</span>
            </p>
            <p className="text-xs text-primary-600">Complaints</p>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(categoryFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all') && (
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-600">Active filters:</span>
          {categoryFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-xs font-medium">
              {CATEGORY_LABELS[categoryFilter as keyof typeof CATEGORY_LABELS]}
              <button
                onClick={() => onCategoryChange('all')}
                className="hover:bg-primary-200 rounded-full p-0.5"
              >
                ×
              </button>
            </span>
          )}
          {statusFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              {STATUS_LABELS[statusFilter as keyof typeof STATUS_LABELS]}
              <button
                onClick={() => onStatusChange('all')}
                className="hover:bg-blue-200 rounded-full p-0.5"
              >
                ×
              </button>
            </span>
          )}
          {priorityFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
              {PRIORITY_LABELS[priorityFilter as keyof typeof PRIORITY_LABELS]}
              <button
                onClick={() => onPriorityChange('all')}
                className="hover:bg-orange-200 rounded-full p-0.5"
              >
                ×
              </button>
            </span>
          )}
          <button
            onClick={() => {
              onCategoryChange('all');
              onStatusChange('all');
              onPriorityChange('all');
            }}
            className="text-xs text-gray-600 hover:text-gray-900 underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
