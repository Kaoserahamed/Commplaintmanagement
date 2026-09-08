/**
 * TypeScript types for Bangladesh Civic Complaint Management System
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
  | 'submitted' 
  | 'in_process' 
  | 'closed';

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Complaint {
  id: number;
  title: string;
  description: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  // Bangladesh Location Hierarchy
  division: string;
  district: string;
  upazila: string;
  local_area: string;
  phone_number: string;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  admin_notes: string | null;
}

export interface ComplaintCreate {
  title: string;
  description: string;
  category: ComplaintCategory;
  division: string;
  district: string;
  upazila: string;
  local_area: string;
  phone_number: string;
}

export interface UpazilaAvailability {
  available: boolean;
  message: string;
  existing_complaint: Complaint | null;
}

export interface DashboardStats {
  total_complaints: number;
  by_status: Record<string, number>;
  by_category: Record<string, number>;
  by_priority: Record<string, number>;
  by_division: Record<string, number>;
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
  submitted: 'Submitted',
  in_process: 'In Process',
  closed: 'Closed',
};

export const PRIORITY_LABELS: Record<ComplaintPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

