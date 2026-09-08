/**
 * Main App component - Bangladesh Civic Complaint Management System
 */
import { useState, useEffect } from 'react';
import { complaintApi } from './services/api';
import type { Complaint, ComplaintCreate } from './types';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import ComplaintCard from './components/ComplaintCard';
import ComplaintForm from './components/ComplaintForm';
import Dashboard from './components/Dashboard';

function App() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch complaints on mount
  useEffect(() => {
    fetchComplaints();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [allComplaints, categoryFilter, statusFilter]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await complaintApi.getComplaints();
      setAllComplaints(data);
    } catch (err) {
      setError('Failed to load complaints. Please check your connection and try again.');
      console.error('Error fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = allComplaints;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((c) => c.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    setComplaints(filtered);
  };

  const handleCreateComplaint = async (complaintData: ComplaintCreate, mediaFile?: File) => {
    try {
      setIsSubmitting(true);
      const newComplaint = await complaintApi.createComplaint(complaintData);
      
      // Upload media if provided
      if (mediaFile) {
        await complaintApi.uploadMedia(newComplaint.id, mediaFile);
        // Refresh to get updated complaint with media
        const updated = await complaintApi.getComplaint(newComplaint.id);
        setAllComplaints([updated, ...allComplaints]);
      } else {
        setAllComplaints([newComplaint, ...allComplaints]);
      }
      
      setShowForm(false);
      alert('Complaint submitted successfully!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to create complaint. Please try again.';
      alert(errorMessage);
      console.error('Error creating complaint:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
  };

  const complaintCounts = {
    total: allComplaints.length,
    filtered: complaints.length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onCreateComplaint={() => setShowForm(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Dashboard Statistics */}
        <Dashboard />

        {/* Filters */}
        <FilterBar
          categoryFilter={categoryFilter}
          statusFilter={statusFilter}
          onCategoryChange={setCategoryFilter}
          onStatusChange={setStatusFilter}
          complaintCounts={complaintCounts}
        />

        {/* Complaints List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={fetchComplaints}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No complaints found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {allComplaints.length === 0
                ? 'Get started by reporting your first civic issue.'
                : 'No complaints match the selected filters.'}
            </p>
            {allComplaints.length === 0 && (
              <button onClick={() => setShowForm(true)} className="btn-primary mt-4">
                Report First Issue
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
            {complaints.map((complaint) => (
              <ComplaintCard
                key={complaint.id}
                complaint={complaint}
              />
            ))}
          </div>
        )}
      </main>

      {/* Complaint Form Modal */}
      {showForm && (
        <ComplaintForm
          onSubmit={handleCreateComplaint}
          onCancel={handleCancelForm}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

export default App;
