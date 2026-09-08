/**
 * TypeScript types for Complaint Management System
 */

export type ComplaintCategory = 
  | 'road_transport' 
  | 'electricity' 
  | 'water_drainage' 
  | 'garbage_environment' 
  | 'public_safety' 
  | 'government_services' 
  | 'other';

export type ComplaintStatus = 
  | 'pending' 
  | 'in_review' 
  | 'in_progress' 
  | 'resolved' 
  | 'rejected';

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Complaint {
  id: number;
  title: string;
  description: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComplaintCreate {
  title: string;
  description: string;
  category: ComplaintCategory;
  priority?: ComplaintPriority;
  location?: string;
  latitude?: number;
  longitude?: number;
}

export interface ComplaintUpdate {
  title?: string;
  description?: string;
  category?: ComplaintCategory;
  status?: ComplaintStatus;
  priority?: ComplaintPriority;
  location?: string;
  latitude?: number;
  longitude?: number;
}

export interface DashboardStats {
  total_complaints: number;
  pending: number;
  in_review: number;
  in_progress: number;
  resolved: number;
  rejected: number;
  by_category: Record<string, number>;
  by_priority: Record<string, number>;
  recent_complaints: Complaint[];
}

export interface MediaUploadResponse {
  media_url: string;
  media_type: string;
  message: string;
}

export interface ApiError {
  detail: string;
}

export const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  road_transport: 'Road & Transport',
  electricity: 'Electricity',
  water_drainage: 'Water & Drainage',
  garbage_environment: 'Garbage & Environment',
  public_safety: 'Public Safety',
  government_services: 'Government Services',
  other: 'Other',
};

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  pending: 'Pending',
  in_review: 'In Review',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

export const PRIORITY_LABELS: Record<ComplaintPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};
