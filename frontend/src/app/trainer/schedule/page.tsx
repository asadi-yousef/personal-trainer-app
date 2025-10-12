'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import PageHeader from '../../../components/PageHeader';
import { ProtectedRoute, useAuth } from '../../../contexts/AuthContext';
import { apiClient } from '../../../lib/api';

interface SlotInfo {
  booking_request_id: number;
  client_id: number;
  client_name: string;
  session_type: string;
  training_type?: string | null;
  duration_minutes: number;
  start_time: string;
  end_time: string;
  slot_ids: number[];
  is_contiguous: boolean;
  preferred_start_date: string | null;
  special_requests: string | null;
  location: string | null;
  priority_score: number;
}

interface Statistics {
  total_requests: number;
  scheduled_requests: number;
  unscheduled_requests: number;
  total_hours: number;
  gaps_minimized: number;
  utilization_rate: number;
  scheduling_efficiency: number;
}

interface OptimalScheduleData {
  trainer_id: number;
  proposed_entries: SlotInfo[];
  statistics: Statistics;
  message: string;
}

function TrainerScheduleContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduleData, setScheduleData] = useState<OptimalScheduleData | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<Set<number>>(new Set());
  const [applying, setApplying] = useState(false);
  
  const { user } = useAuth();
  const router = useRouter();

  const fetchOptimalSchedule = async () => {
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
      setSelectedEntries(new Set()); // Clear selections when refreshing

      // Call the optimal schedule endpoint that uses saved preferences
      const response = await apiClient.get<OptimalScheduleData>('/trainer/me/optimal-schedule');
      setScheduleData(response);
    } catch (err: any) {
      console.error('Error fetching optimal schedule:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to generate optimal schedule');
    } finally {
      setLoading(false);
    }
  };

  const toggleEntrySelection = (requestId: number) => {
    const newSelection = new Set(selectedEntries);
    if (newSelection.has(requestId)) {
      newSelection.delete(requestId);
    } else {
      newSelection.add(requestId);
    }
    setSelectedEntries(newSelection);
  };

  const selectAllEntries = () => {
    if (!scheduleData) return;
    const allIds = new Set(scheduleData.proposed_entries.map(e => e.booking_request_id));
    setSelectedEntries(allIds);
  };

  const deselectAllEntries = () => {
    setSelectedEntries(new Set());
  };

  const applySelectedEntries = async () => {
    // Get trainer ID - try multiple possible locations in user object
    const trainerId = user?.trainer_profile?.id || (user as any)?.trainer_id || (user as any)?.id;
    
    if (!trainerId) {
      alert('Trainer profile not found. Please refresh the page and ensure you are logged in as a trainer.');
      return;
    }
    
    if (selectedEntries.size === 0) {
      alert('Please select at least one entry to apply.');
      return;
    }

    setApplying(true);
    setError(null);

    try {
      const entryIds = Array.from(selectedEntries);
      
      const response = await fetch(`http://127.0.0.1:8000/api/trainer/${trainerId}/optimal-schedule/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entryIds)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to apply schedule');
      }

      const data = await response.json();
      
      // Show detailed success/failure message
      let message = data.message || 'Schedule applied';
      
      if (data.applied_entries && data.applied_entries.length > 0) {
        message += '\n\nApplied bookings:';
        data.applied_entries.forEach((entry: any) => {
          message += `\n• ${entry.client_name} - ${new Date(entry.start_time).toLocaleString()}`;
        });
      }
      
      if (data.failed_entries && data.failed_entries.length > 0) {
        message += '\n\nFailed entries:';
        data.failed_entries.forEach((entry: any) => {
          message += `\n• Request #${entry.booking_request_id}: ${entry.reason}`;
        });
      }
      
      alert(message);
      
      // Clear selections and refresh schedule
      setSelectedEntries(new Set());
      await fetchOptimalSchedule();
      
    } catch (err: any) {
      console.error('Failed to apply optimal schedule:', err);
      alert(`Error: ${err.message || 'Failed to apply optimal schedule'}`);
      setError(err.message || 'Failed to apply optimal schedule');
    } finally {
      setApplying(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (priorityScore: number) => {
    if (priorityScore >= 8) return 'bg-red-100 text-red-800';
    if (priorityScore >= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getPriorityLabel = (priorityScore: number) => {
    if (priorityScore >= 8) return 'High Priority';
    if (priorityScore >= 6) return 'Medium Priority';
    return 'Normal Priority';
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <PageHeader 
          user={user}
          title="Optimal Schedule Generator"
          subtitle="AI-powered greedy algorithm to maximize consecutive sessions and minimize gaps"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Info Banner */}
          {!scheduleData && !loading && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-blue-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">How it works</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    This algorithm uses your saved scheduling preferences to automatically generate the best schedule for pending booking requests.
                  </p>
                  <button
                    onClick={() => router.push('/trainer/scheduling-preferences')}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 underline"
                  >
                    Manage scheduling preferences →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          {!scheduleData && !loading && (
            <div className="bg-white rounded-xl shadow-md p-8 text-center mb-8">
              <div className="max-w-md mx-auto">
                <svg className="w-16 h-16 text-blue-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Generate</h3>
                <p className="text-gray-600 mb-6">
                  Click below to analyze pending booking requests and generate your optimal schedule
                </p>
                <button
                  onClick={fetchOptimalSchedule}
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
          )}

          {/* Statistics Cards */}
          {scheduleData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Requests</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {scheduleData.statistics.total_requests}
                    </p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Scheduled</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      {scheduleData.statistics.scheduled_requests}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {scheduleData.statistics.scheduling_efficiency.toFixed(1)}% efficiency
                    </p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Hours</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">
                      {scheduleData.statistics.total_hours}h
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {scheduleData.statistics.utilization_rate.toFixed(1)}% utilization
                    </p>
            </div>
                  <div className="bg-purple-100 rounded-full p-3">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Gaps Minimized</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">
                      {scheduleData.statistics.gaps_minimized}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Consecutive sessions
                    </p>
            </div>
                  <div className="bg-orange-100 rounded-full p-3">
                    <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions Bar */}
          {scheduleData && scheduleData.proposed_entries.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={selectAllEntries}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAllEntries}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Deselect All
                  </button>
                  <span className="text-sm text-gray-600">
                    {selectedEntries.size} selected
                  </span>
          </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={fetchOptimalSchedule}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </div>
                  </button>
                  <button
                    onClick={applySelectedEntries}
                    disabled={selectedEntries.size === 0 || loading || applying}
                    className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {applying ? 'Applying...' : `Apply Selected (${selectedEntries.size})`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Generating optimal schedule...</p>
            </div>
          </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-6 mb-8">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && scheduleData && scheduleData.proposed_entries.length === 0 && (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Requests</h3>
              <p className="text-gray-600 mb-6">There are no pending booking requests to schedule at the moment.</p>
              <button
                onClick={() => router.push('/trainer')}
                className="px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          )}

          {/* Schedule Table */}
          {!loading && !error && scheduleData && scheduleData.proposed_entries.length > 0 && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Select
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Session / Training Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Proposed Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {scheduleData.proposed_entries.map((entry) => (
                      <tr 
                        key={entry.booking_request_id}
                        className={`hover:bg-gray-50 transition-colors ${
                          selectedEntries.has(entry.booking_request_id) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedEntries.has(entry.booking_request_id)}
                            onChange={() => toggleEntrySelection(entry.booking_request_id)}
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {entry.client_name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {entry.client_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{entry.session_type}</div>
                          {entry.training_type && (
                            <div className="text-xs text-blue-600 mt-1">
                              {entry.training_type}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDateTime(entry.start_time)}</div>
                          <div className="text-xs text-gray-500">
                            {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{entry.duration_minutes} min</span>
                          {entry.is_contiguous && (
                            <div className="text-xs text-blue-600 mt-1">
                              Multiple slots
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(entry.priority_score)}`}>
                            {getPriorityLabel(entry.priority_score)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entry.location || 'Not specified'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Algorithm Info */}
          <div className="mt-8 bg-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">How It Works</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p>• <strong>Step 1:</strong> Prioritizes requests by priority score (highest first) and duration (shortest first)</p>
              <p>• <strong>Step 2:</strong> Identifies all possible contiguous time slot combinations (60, 90, 120 minutes)</p>
              <p>• <strong>Step 3:</strong> Assigns each request to the earliest available slot closest to preferred date</p>
              <p>• <strong>Step 4:</strong> Maximizes consecutive sessions to minimize gaps in your schedule</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function TrainerSchedulePage() {
  return (
    <ProtectedRoute allowedRoles={['trainer']}>
      <TrainerScheduleContent />
    </ProtectedRoute>
  );
}
