/**
 * ComplaintCard component - Displays a single complaint with Bangladesh location
 */
import type { Complaint } from '../types';
import { CATEGORY_LABELS, STATUS_LABELS, PRIORITY_LABELS } from '../types';
import { complaintApi } from '../services/api';

interface ComplaintCardProps {
  complaint: Complaint;
}

const statusConfig = {
  submitted: { class: 'bg-blue-100 text-blue-700', icon: '📝' },
  in_process: { class: 'bg-yellow-100 text-yellow-700', icon: '⚙️' },
  closed: { class: 'bg-green-100 text-green-700', icon: '✅' },
};

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

export default function ComplaintCard({ complaint }: ComplaintCardProps) {
  const statusInfo = statusConfig[complaint.status];
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
    <div className="card p-5 border-l-4 border-primary-500 hover:shadow-xl transition-all flex flex-col h-full">
      {/* Header with Category and Status */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-2xl flex-shrink-0" title={CATEGORY_LABELS[complaint.category]}>
            {categoryIcon}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{complaint.title}</h3>
            <p className="text-xs text-gray-500">{CATEGORY_LABELS[complaint.category]}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end flex-shrink-0 ml-2">
          <span className={`badge ${statusInfo.class} text-xs whitespace-nowrap flex items-center gap-1`}>
            <span>{statusInfo.icon}</span>
            <span>{STATUS_LABELS[complaint.status]}</span>
          </span>
          <span className={`badge ${priorityInfo.class} text-xs whitespace-nowrap flex items-center gap-1`}>
            <span>{priorityInfo.icon}</span>
            <span>{PRIORITY_LABELS[complaint.priority]}</span>
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-700 mb-3 text-sm line-clamp-3">{complaint.description}</p>

      {/* Location - Bangladesh Hierarchy */}
      <div className="space-y-1 mb-3">
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="font-medium">{complaint.upazila}, {complaint.district}, {complaint.division}</span>
        </div>
        <div className="text-xs text-gray-600 pl-5">
          {complaint.local_area}
        </div>
      </div>

      {/* Contact */}
      <div className="flex items-center gap-1 text-xs text-gray-600 mb-3">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        <span>{complaint.phone_number}</span>
      </div>

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

      {/* Spacer to push footer to bottom */}
      <div className="flex-1"></div>

      {/* Footer - Always at bottom */}
      <div className="pt-3 border-t mt-3">
        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>ID: #{complaint.id}</span>
          <span className="truncate ml-2">{formatDate(complaint.created_at)}</span>
        </div>
        
        {/* Admin Notes (if any) */}
        {complaint.admin_notes && (
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700">
            <strong>Admin Note:</strong> {complaint.admin_notes}
          </div>
        )}
      </div>
    </div>
  );
}
