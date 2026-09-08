/**
 * Main App component - Complaint Management System
 */
import { useState, useEffect } from 'react';
import { complaintApi } from './services/api';
import type { Complaint, ComplaintCreate } from './types';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import ComplaintCard from './components/ComplaintCard';
import ComplaintForm from './components/ComplaintForm';

function App() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Fetch complaints on mount
  useEffect(() => {
    fetchComplaints();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [allComplaints, categoryFilter, priorityFilter]);

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

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((c) => c.priority === priorityFilter);
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
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to create complaint. Please try again.';
      alert(errorMessage);
      console.error('Error creating complaint:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComplaint = async (complaintData: ComplaintCreate, mediaFile?: File) => {
    if (!editingComplaint) return;

    try {
      setIsSubmitting(true);
      const updatedComplaint = await complaintApi.updateComplaint(editingComplaint.id, complaintData);
      
      // Upload media if provided
      if (mediaFile) {
        await complaintApi.uploadMedia(updatedComplaint.id, mediaFile);
        // Refresh to get updated complaint with media
        const updated = await complaintApi.getComplaint(updatedComplaint.id);
        setAllComplaints(allComplaints.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        setAllComplaints(allComplaints.map((c) => (c.id === updatedComplaint.id ? updatedComplaint : c)));
      }
      
      setEditingComplaint(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to update complaint. Please try again.';
      alert(errorMessage);
      console.error('Error updating complaint:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComplaint = async (id: number) => {
    try {
      await complaintApi.deleteComplaint(id);
      setAllComplaints(allComplaints.filter((c) => c.id !== id));
    } catch (err) {
      alert('Failed to delete complaint. Please try again.');
      console.error('Error deleting complaint:', err);
    }
  };

  const handleEditComplaint = (complaint: Complaint) => {
    setEditingComplaint(complaint);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingComplaint(null);
  };

  const complaintCounts = {
    total: allComplaints.length,
    filtered: complaints.length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onCreateComplaint={() => setShowForm(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Filters */}
        <FilterBar
          categoryFilter={categoryFilter}
          priorityFilter={priorityFilter}
          onCategoryChange={setCategoryFilter}
          onPriorityChange={setPriorityFilter}
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
                ? 'Get started by reporting your first issue.'
                : 'No complaints match the selected filters.'}
            </p>
            {allComplaints.length === 0 && (
              <button onClick={() => setShowForm(true)} className="btn-primary mt-4">
                Report First Issue
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {complaints.map((complaint) => (
              <ComplaintCard
                key={complaint.id}
                complaint={complaint}
                onEdit={handleEditComplaint}
                onDelete={handleDeleteComplaint}
              />
            ))}
          </div>
        )}
      </main>

      {/* Complaint Form Modal */}
      {(showForm || editingComplaint) && (
        <ComplaintForm
          complaint={editingComplaint}
          onSubmit={editingComplaint ? handleUpdateComplaint : handleCreateComplaint}
          onCancel={handleCancelForm}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

export default App;
