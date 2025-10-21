'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import PageHeader from '../../../components/PageHeader';
import { ProtectedRoute, useAuth } from '../../../contexts/AuthContext';
import { bookingManagement } from '../../../lib/api';

interface BookingRequest {
  id: number;
  client_id: number;
  client_name: string;
  client_email: string;
  session_type: string;
  training_type?: string | null;
  duration_minutes: number;
  start_time: string | null;
  end_time: string | null;
  preferred_start_date: string | null;
  preferred_end_date: string | null;
  special_requests: string | null;
  location: string | null;
  location_type: string | null;
  location_address: string | null;
  total_cost: number | null;
  priority?: string | null;
  status: string;
  created_at: string;
  expires_at: string;
}

function TrainerScheduleContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<BookingRequest[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<Set<number>>(new Set());
  const [applying, setApplying] = useState(false);
  const [showOptimalSchedule, setShowOptimalSchedule] = useState(false);
  const [optimalScheduleData, setOptimalScheduleData] = useState<any>(null);
  const [sortBy, setSortBy] = useState<string>('priority');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  
  const { user, token } = useAuth();
  const router = useRouter();

  const fetchBookingRequests = async () => {
    if (!user) {
      setError('Please login as a trainer to view this page');
      return;
    }
    
    if (user.role !== 'trainer') {
      setError('Only trainers can access this page');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSelectedRequests(new Set());

      // Fetch booking requests for this trainer
      const response = await fetch('http://localhost:8000/api/booking-management/booking-requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch booking requests: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('DEBUG: Fetched booking requests:', data);
      
      // Handle the response format: {"booking_requests": [...]}
      const requests = data?.booking_requests || data || [];
      
      if (Array.isArray(requests)) {
        setBookingRequests(requests);
        setFilteredRequests(requests);
        console.log('DEBUG: Set booking requests:', requests);
      } else {
        console.log('DEBUG: No valid booking requests found');
        setBookingRequests([]);
        setFilteredRequests([]);
      }
      
    } catch (err: any) {
      console.error('Error fetching booking requests:', err);
      setError(err.message || 'Failed to fetch booking requests');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort requests based on selected filters
  useEffect(() => {
    let filtered = bookingRequests;
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(req => req.status === filterStatus);
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(req => req.training_type === filterType);
    }
    
    // Sort requests
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return (b.priority || 0) - (a.priority || 0); // Higher priority first
        case 'time':
          return new Date(a.start_time || 0).getTime() - new Date(b.start_time || 0).getTime(); // Earlier time first
        case 'client':
          return a.client_name.localeCompare(b.client_name); // Alphabetical
        default:
          return 0;
      }
    });
    
    setFilteredRequests(filtered);
  }, [bookingRequests, filterStatus, filterType, sortBy]);

  const generateOptimalSchedule = async () => {
    if (!user) {
      setError('Please login as a trainer to view this page');
      return;
    }
    
    if (user.role !== 'trainer') {
      setError('Only trainers can access this page');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      console.log('DEBUG: Token:', token);
      console.log('DEBUG: User:', user);

      // Call the optimal schedule endpoint
      const response = await fetch('http://localhost:8000/api/trainer/me/optimal-schedule', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(`Failed to generate optimal schedule: ${errorData.detail || response.statusText}`);
      }

      const data = await response.json();
      console.log('DEBUG: Generated optimal schedule:', data);
      
      setOptimalScheduleData(data);
      setShowOptimalSchedule(true);
      
    } catch (err: any) {
      console.error('Error generating optimal schedule:', err);
      setError(err.message || 'Failed to generate optimal schedule');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRequestSelection = (requestId: number) => {
    setSelectedRequests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(requestId)) {
        newSet.delete(requestId);
      } else {
        newSet.add(requestId);
      }
      return newSet;
    });
  };

  const applyOptimalSchedule = async () => {
    if (!optimalScheduleData || !optimalScheduleData.proposed_entries) return;
    
    try {
      setApplying(true);
      
      // Apply the optimal schedule by approving the proposed entries
      const proposedEntries = optimalScheduleData.proposed_entries;
      console.log('DEBUG: Applying optimal schedule with entries:', proposedEntries);
      
      // Check availability for all proposed entries first
      const availabilityCheckResponse = await fetch(`http://localhost:8000/api/booking-management/check-availability-batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          proposed_entries: proposedEntries
        })
      });
      
      if (!availabilityCheckResponse.ok) {
        const errorData = await availabilityCheckResponse.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(`Availability check failed: ${errorData.detail || availabilityCheckResponse.statusText}`);
      }
      
      const availabilityResult = await availabilityCheckResponse.json();
      console.log('DEBUG: Availability check result:', availabilityResult);
      
      if (availabilityResult.conflicts && availabilityResult.conflicts.length > 0) {
        const conflictDetails = availabilityResult.conflicts.map(c => {
          const reasons = c.conflict_reasons ? c.conflict_reasons.join(', ') : 'conflicts detected';
          return `- ${c.client_name}: ${c.requested_time}\n  Issues: ${reasons}`;
        }).join('\n\n');
        
        const minBreak = availabilityResult.min_break_minutes || 15;
        
        const proceed = confirm(
          `⚠️ SCHEDULING CONFLICTS DETECTED!\n\n` +
          `Minimum break time required: ${minBreak} minutes\n\n` +
          `The following sessions have conflicts:\n\n${conflictDetails}\n\n` +
          `Do you want to proceed anyway? This may cause double-booking or break time violations.`
        );
        
        if (!proceed) {
          alert('Optimal schedule application cancelled due to conflicts.');
          return;
        }
      }
      
      // Proceed with approvals
      let approvedCount = 0;
      let failedCount = 0;
      
      for (const entry of proposedEntries) {
        try {
          const response = await fetch(`http://localhost:8000/api/booking-management/approve-booking`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              booking_request_id: entry.booking_request_id,
              status: 'APPROVED',
              notes: 'Approved via optimal schedule'
            })
          });
          
          if (response.ok) {
            approvedCount++;
          } else {
            failedCount++;
            console.error(`Failed to approve booking request ${entry.booking_request_id}`);
          }
        } catch (err) {
          failedCount++;
          console.error(`Error approving booking request ${entry.booking_request_id}:`, err);
        }
      }
      
      alert(`Applied optimal schedule!\n✅ Approved: ${approvedCount} booking requests\n❌ Failed: ${failedCount} booking requests`);
      
      // Refresh the booking requests
      await fetchBookingRequests();
      
      // Hide the optimal schedule results
      setShowOptimalSchedule(false);
      setOptimalScheduleData(null);
      
    } catch (err: any) {
      console.error('Failed to apply optimal schedule:', err);
      alert(`Error: ${err.message || 'Failed to apply optimal schedule'}`);
    } finally {
      setApplying(false);
    }
  };

  const applySelectedRequests = async () => {
    if (selectedRequests.size === 0) return;
    
    try {
      setApplying(true);
      
      const selectedIds = Array.from(selectedRequests);
      console.log('DEBUG: Confirming selected requests:', selectedIds);
      
      // Confirm each selected request (this creates actual bookings)
      for (const requestId of selectedIds) {
        const response = await fetch(`http://localhost:8000/api/booking-management/approve-booking`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            booking_request_id: requestId,
            status: 'APPROVED',
            notes: 'Confirmed by trainer - session booked'
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
          throw new Error(`Failed to confirm request ${requestId}: ${errorData.detail || response.statusText}`);
        }
      }
      
      alert(`✅ Successfully confirmed ${selectedIds.length} sessions! The bookings have been created and are now in your schedule.`);
      
      // Refresh the requests
      await fetchBookingRequests();
      
      // Clear selection
      setSelectedRequests(new Set());
      
    } catch (err: any) {
      console.error('Error confirming selected requests:', err);
      alert(`❌ Error: ${err.message || 'Failed to confirm sessions'}`);
    } finally {
      setApplying(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBookingRequests();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      <div className={`main-content transition-all duration-300 ${sidebarCollapsed ? 'content-collapsed' : 'content-expanded'}`}>
        <PageHeader user={user} />

        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Trainer Schedule</h1>
            <p className="text-gray-600 mt-2">
              Generate optimal schedules and manage booking requests
            </p>
          </div>

          {/* Generate Optimal Schedule Button */}
          <div className="mb-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Optimal Schedule Generator</h2>
                  <p className="text-gray-600">
                    Use AI-powered scheduling to optimize your time slots and maximize efficiency
                  </p>
                </div>
                <button
                  onClick={generateOptimalSchedule}
                  disabled={loading}
                  className="px-8 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {loading ? 'Generating...' : 'Generate Optimal Schedule'}
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Optimal Schedule Results */}
          {showOptimalSchedule && optimalScheduleData && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-green-800">Optimal Schedule Generated</h3>
                <button
                  onClick={() => setShowOptimalSchedule(false)}
                  className="text-green-600 hover:text-green-800"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{optimalScheduleData.statistics?.total_requests || 0}</p>
                  </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Scheduled</p>
                  <p className="text-2xl font-bold text-green-600">{optimalScheduleData.statistics?.scheduled_requests || 0}</p>
                  </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Unscheduled</p>
                  <p className="text-2xl font-bold text-red-600">{optimalScheduleData.statistics?.unscheduled_requests || 0}</p>
                </div>
              </div>
              <p className="text-green-700">{optimalScheduleData.message}</p>
              
              {/* Show recommended approvals and rejections */}
              {optimalScheduleData.proposed_entries && optimalScheduleData.proposed_entries.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Recommended Approvals:</h4>
                  <div className="space-y-2">
                    {optimalScheduleData.proposed_entries.map((entry: any, index: number) => (
                      <div key={index} className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-green-800">{entry.client_name}</p>
                            <p className="text-sm text-green-600">
                              {entry.start_time ? new Date(entry.start_time).toLocaleString() : 'No time specified'} - 
                              {entry.end_time ? new Date(entry.end_time).toLocaleString() : 'No time specified'}
                            </p>
                            <p className="text-xs text-green-500">{entry.reason || 'Fits schedule with no conflicts'}</p>
                          </div>
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            APPROVE
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-4">
                <button
                  onClick={applyOptimalSchedule}
                  disabled={applying}
                  className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {applying ? 'Applying...' : 'Apply Optimal Schedule'}
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mb-6 flex justify-between items-center">
            <button
              onClick={fetchBookingRequests}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Booking Requests
              </div>
            </button>
            <button
              onClick={applySelectedRequests}
              disabled={selectedRequests.size === 0 || loading || applying}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {applying ? 'Confirming...' : `Confirm Selected (${selectedRequests.size})`}
            </button>
              </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                      <p className="text-sm text-gray-600">Total Requests</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {bookingRequests.length}
                    </p>
                  </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                      <p className="text-sm text-gray-600">Selected</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {selectedRequests.size}
                    </p>
            </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                      <p className="text-sm text-gray-600">Pending</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {bookingRequests.filter(r => r.status === 'PENDING').length}
                    </p>
            </div>
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                </div>
              </div>
            </div>

              {/* Sorting and Filtering Controls */}
              <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Sort by:</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="priority">Priority (High to Low)</option>
                      <option value="time">Time (Earliest First)</option>
                      <option value="client">Client Name (A-Z)</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Status:</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All</option>
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Type:</label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All</option>
                      <option value="Personal Training">Personal Training</option>
                      <option value="Calisthenics">Calisthenics</option>
                      <option value="Gym Weights">Gym Weights</option>
                      <option value="Cardio">Cardio</option>
                      <option value="Yoga">Yoga</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Booking Requests List */}
              {filteredRequests.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No booking requests</h3>
                  <p className="mt-1 text-sm text-gray-500">No pending booking requests found.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {filteredRequests.map((request) => (
                    <div
                      key={request.id}
                      className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                        selectedRequests.has(request.id) 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-indigo-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                          <input
                            type="checkbox"
                              checked={selectedRequests.has(request.id)}
                              onChange={() => handleRequestSelection(request.id)}
                              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <h3 className="text-lg font-semibold text-gray-900">
                              {request.client_name}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              request.status === 'PENDING' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {request.status}
                            </span>
                            {request.priority && (
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                request.priority >= 8 
                                  ? 'bg-red-100 text-red-800 border border-red-200' 
                                  : request.priority >= 5
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-gray-100 text-gray-800 border border-gray-200'
                              }`}>
                                <span className="font-bold">
                                  {request.priority >= 8 ? '🔥 HIGH' : request.priority >= 5 ? '⭐ NORMAL' : '📋 LOW'}
                                </span>
                              </span>
                            )}
                              </div>

                          {/* Session Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="bg-indigo-50 p-3 rounded-lg">
                              <p className="text-sm font-semibold text-indigo-800">
                                Session: {request.training_type || request.session_type}
                              </p>
                              <p className="text-sm text-indigo-700">
                                Duration: {request.duration_minutes} minutes
                              </p>
                            </div>
                            
                            <div className="bg-indigo-50 p-3 rounded-lg">
                              <p className="text-sm font-semibold text-indigo-800">
                                Location: {request.location_type === 'home' ? 'Client\'s home' : 'Gym'}
                              </p>
                              <p className="text-sm text-indigo-700">
                                {request.location_address || request.location}
                              </p>
                            </div>
                          </div>

                          {/* Date and Time - NEW FORMAT */}
                          <div className="bg-indigo-50 p-3 rounded-lg mb-4">
                            <p className="text-sm font-semibold text-indigo-800">
                              Date: {request.start_time ? formatDate(request.start_time) : 'Not specified'}
                            </p>
                            <p className="text-sm font-semibold text-indigo-800">
                              Time: {request.start_time && request.end_time 
                                ? `${formatTime(request.start_time)} - ${formatTime(request.end_time)}`
                                : 'Not specified'
                              }
                            </p>
                          </div>

                          {/* Special Requests */}
                          {request.special_requests && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-gray-700 mb-1">Special Requests:</p>
                              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                {request.special_requests}
                              </p>
                            </div>
                          )}

                          {/* Cost */}
                          {request.total_cost && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-gray-700">
                                Total Cost: ${request.total_cost.toFixed(2)}
                              </p>
                            </div>
                          )}

                          {/* Created Date */}
                          <div className="text-xs text-gray-500">
                            Requested: {formatDateTime(request.created_at)}
                          </div>
                            </div>
              </div>
            </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TrainerSchedulePage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <TrainerScheduleContent />
    </ProtectedRoute>
  );
}













