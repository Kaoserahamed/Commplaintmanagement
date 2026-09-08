/**
 * Dashboard component - Statistics and overview
 */
import { useEffect, useState } from 'react';
import { complaintApi } from '../services/api';
import type { DashboardStats } from '../types';
import { CATEGORY_LABELS, PRIORITY_LABELS } from '../types';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await complaintApi.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError('Failed to load statistics');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
        <p className="font-medium">Error loading dashboard</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const statusStats = [
    { label: 'Submitted', value: stats.by_status.submitted || 0, color: 'bg-blue-500', icon: '📝' },
    { label: 'In Process', value: stats.by_status.in_process || 0, color: 'bg-yellow-500', icon: '⚙️' },
    { label: 'Closed', value: stats.by_status.closed || 0, color: 'bg-green-500', icon: '✅' },
  ];

  return (
    <div className="mb-6 space-y-4">
      {/* Total Complaints Card */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-100 text-sm font-medium">Total Complaints</p>
            <h2 className="text-4xl font-bold mt-2">{stats.total_complaints}</h2>
            <p className="text-primary-100 text-xs mt-1">All time</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-full p-4">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Status Statistics */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Overview</h3>
        <div className="grid grid-cols-3 gap-4">
          {statusStats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className={`${stat.color} w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-2`}>
                {stat.icon}
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Category and Priority Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* By Category */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">By Category</h3>
          <div className="space-y-3">
            {Object.entries(stats.by_category).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
                </span>
                <div className="flex items-center gap-2">
                  <div className="bg-gray-200 rounded-full h-2 w-24">
                    <div
                      className="bg-primary-500 rounded-full h-2"
                      style={{ width: `${(count / stats.total_complaints) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Priority */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">By Priority</h3>
          <div className="space-y-3">
            {Object.entries(stats.by_priority).map(([priority, count]) => {
              const colors = {
                low: 'bg-gray-400',
                medium: 'bg-blue-500',
                high: 'bg-orange-500',
                urgent: 'bg-red-500',
              };
              return (
                <div key={priority} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    {PRIORITY_LABELS[priority as keyof typeof PRIORITY_LABELS] || priority}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="bg-gray-200 rounded-full h-2 w-24">
                      <div
                        className={`${colors[priority as keyof typeof colors]} rounded-full h-2`}
                        style={{ width: `${(count / stats.total_complaints) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-8 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
