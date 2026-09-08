/**
 * API service for Complaint Management System backend communication
 */
import axios from 'axios';
import type { Complaint, ComplaintCreate, DashboardStats, MediaUploadResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor for logging (optional)
api.interceptors.request.use(
  (config) => {
    console.log(`🔵 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`🟢 ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`🔴 ${error.response?.status || 'Network Error'} ${error.config?.url}`);
    return Promise.reject(error);
  }
);

export const complaintApi = {
  /**
   * Get all complaints with optional filters
   */
  getComplaints: async (
    category?: string,
    status?: string,
    priority?: string
  ): Promise<Complaint[]> => {
    const params: Record<string, string> = {};
    if (category) params.category = category;
    if (status) params.status = status;
    if (priority) params.priority = priority;
    
    const response = await api.get<Complaint[]>('/api/complaints', { params });
    return response.data;
  },

  /**
   * Get a single complaint by ID
   */
  getComplaint: async (id: number): Promise<Complaint> => {
    const response = await api.get<Complaint>(`/api/complaints/${id}`);
    return response.data;
  },

  /**
   * Create a new complaint
   */
  createComplaint: async (complaint: ComplaintCreate): Promise<Complaint> => {
    const response = await api.post<Complaint>('/api/complaints', complaint);
    return response.data;
  },

  /**
   * Upload media for a complaint
   */
  uploadMedia: async (complaintId: number, file: File): Promise<MediaUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<MediaUploadResponse>(
      `/api/complaints/${complaintId}/media`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Get dashboard statistics
   */
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/api/dashboard/stats');
    return response.data;
  },

  /**
   * Get all divisions
   */
  getDivisions: async (): Promise<string[]> => {
    const response = await api.get<{ divisions: string[] }>('/api/locations/divisions');
    return response.data.divisions;
  },

  /**
   * Get districts for a division
   */
  getDistricts: async (division: string): Promise<string[]> => {
    const response = await api.get<{ districts: string[] }>(`/api/locations/districts?division=${division}`);
    return response.data.districts;
  },

  /**
   * Get upazilas for a division and district
   */
  getUpazilas: async (division: string, district: string): Promise<string[]> => {
    const response = await api.get<{ upazilas: string[] }>(
      `/api/locations/upazilas?division=${division}&district=${district}`
    );
    return response.data.upazilas;
  },

  /**
   * Check upazila availability
   */
  checkUpazilaAvailability: async (
    division: string,
    district: string,
    upazila: string
  ): Promise<any> => {
    const response = await api.get(
      `/api/upazila/availability?division=${division}&district=${district}&upazila=${upazila}`
    );
    return response.data;
  },

  /**
   * Get media URL
   */
  getMediaUrl: (mediaPath: string | null): string | null => {
    if (!mediaPath) return null;
    if (mediaPath.startsWith('http')) return mediaPath;
    return `${API_URL}${mediaPath}`;
  },

  /**
   * Health check
   */
  healthCheck: async (): Promise<{ status: string; database: string }> => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;
