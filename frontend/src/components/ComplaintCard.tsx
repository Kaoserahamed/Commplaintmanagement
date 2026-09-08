/**
 * ComplaintCard component - Displays a single complaint with media
 */
import type { Complaint } from '../types';
import { CATEGORY_LABELS, PRIORITY_LABELS } from '../types';
import { complaintApi } from '../services/api';

interface ComplaintCardProps {
  complaint: Complaint;
  onEdit: (complaint: Complaint) => void;
  onDelete: (id: number) => void;
}

const priorityConfig = {
  low: { class: 'bg-gray-100 text-gray-700', icon: '🔵' },
  medium: { class: 'bg-blue-100 text-blue-700', icon: '🟡' },
  high: { class: 'bg-orange-100 text-orange-700', icon: '🟠' },
  urgent: { class: 'bg-red-100 text-red-700', icon: '🔴' },
};

const categoryIcons: Record<string, string> = {
  road_transport: '🚗',
  electricity: '⚡',
  water_drainage: '💧',
  garbage_environment: '🗑️',
  public_safety: '🚨',
  government_services: '🏛️',
  other: '📋',
};

export default function ComplaintCard({ complaint, onEdit, onDelete }: ComplaintCardProps) {
  const priorityInfo = priorityConfig[complaint.priority];
  const categoryIcon = categoryIcons[complaint.category] || '📋';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const mediaUrl = complaintApi.getMediaUrl(complaint.media_url);
  const isVideo = complaint.media_type === 'video';

  return (
    <div className="card p-5 border-l-4 border-primary-500 hover:shadow-xl transition-all">
      {/* Header with Category and Priority */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl" title={CATEGORY_LABELS[complaint.category]}>
            {categoryIcon}
          </span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{complaint.title}</h3>
            <p className="text-xs text-gray-500">{CATEGORY_LABELS[complaint.category]}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <span className={`badge ${priorityInfo.class} text-xs`}>
            {priorityInfo.icon} {PRIORITY_LABELS[complaint.priority]}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-700 mb-3 text-sm line-clamp-3">{complaint.description}</p>

      {/* Location */}
      {complaint.location && (
        <div className="flex items-center gap-1 text-xs text-gray-600 mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{complaint.location}</span>
        </div>
      )}

      {/* Media Preview */}
      {mediaUrl && (
        <div className="mb-3">
          {isVideo ? (
            <video
              src={mediaUrl}
              controls
              className="w-full h-48 object-cover rounded-lg bg-gray-100"
            />
          ) : (
            <img
              src={mediaUrl}
              alt="Complaint evidence"
              className="w-full h-48 object-cover rounded-lg bg-gray-100"
            />
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pt-3 border-t">
        <span>ID: #{complaint.id}</span>
        <span>Reported: {formatDate(complaint.created_at)}</span>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onEdit(complaint)}
          className="flex-1 px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-200 font-medium"
        >
          Edit Details
        </button>

        <button
          onClick={() => {
            if (window.confirm(`Are you sure you want to delete complaint #${complaint.id}?\n\nThis action cannot be undone.`)) {
              onDelete(complaint.id);
            }
          }}
          className="flex-1 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 font-medium"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
