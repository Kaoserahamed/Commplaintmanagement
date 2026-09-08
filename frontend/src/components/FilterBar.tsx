/**
 * FilterBar component - Compact filters with total count
 */
import { CATEGORY_LABELS, PRIORITY_LABELS } from '../types';

interface FilterBarProps {
  categoryFilter: string;
  priorityFilter: string;
  onCategoryChange: (category: string) => void;
  onPriorityChange: (priority: string) => void;
  complaintCounts: {
    total: number;
    filtered: number;
  };
}

export default function FilterBar({
  categoryFilter,
  priorityFilter,
  onCategoryChange,
  onPriorityChange,
  complaintCounts,
}: FilterBarProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Total Count */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg">
          <p className="text-xs font-medium opacity-90">Total</p>
          <p className="text-2xl font-bold">{complaintCounts.total}</p>
        </div>

        {/* Category Filter */}
        <div className="flex-1 min-w-[200px]">
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white"
          >
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex-1 min-w-[180px]">
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white"
          >
            <option value="all">All Priorities</option>
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Filtered Count */}
        {complaintCounts.filtered !== complaintCounts.total && (
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold text-purple-600">{complaintCounts.filtered}</span> of {complaintCounts.total}
          </div>
        )}
      </div>
    </div>
  );
}
