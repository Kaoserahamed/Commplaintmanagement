/**
 * Dashboard component - Compact statistics overview
 */
import { useEffect, useState } from 'react';
import { complaintApi } from '../services/api';
import type { DashboardStats } from '../types';

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
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 text-sm">
        {error}
      </div>
    );
  }

  const statusStats = [
    { label: 'Submitted', value: stats.by_status.submitted || 0, icon: '📝', color: 'text-blue-600' },
    { label: 'In Process', value: stats.by_status.in_process || 0, icon: '⚙️', color: 'text-yellow-600' },
    { label: 'Closed', value: stats.by_status.closed || 0, icon: '✅', color: 'text-green-600' },
  ];

  return (
    <div className="mb-4">
      {/* Compact Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg shadow p-3 text-white">
          <p className="text-xs opacity-90">Total</p>
          <p className="text-2xl font-bold">{stats.total_complaints}</p>
        </div>

        {/* Status */}
        {statusStats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-lg">{stat.icon}</span>
              <span className={`text-xl font-bold ${stat.color}`}>{stat.value}</span>
            </div>
            <p className="text-xs text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
