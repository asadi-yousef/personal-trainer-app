'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import PageHeader from '../../../components/PageHeader';
import { ProtectedRoute, useAuth } from '../../../contexts/AuthContext';
import { bookingManagement } from '../../../lib/api';

function TrainerScheduleContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [showOptimalSchedule, setShowOptimalSchedule] = useState(false);
  const [optimalScheduleData, setOptimalScheduleData] = useState<any>(null);
  
  const { user, token } = useAuth();
  const router = useRouter();

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
      
      if (!availabilityResult.all_available) {
        throw new Error('Some time slots are no longer available. Please regenerate the schedule.');
      }
      
      // Approve each proposed entry
      let approvedCount = 0;
      let failedCount = 0;
      
      for (const entry of proposedEntries) {
        try {
          const response = await fetch(`http://localhost:8000/api/booking-management/booking-requests/${entry.booking_request_id}/status`, {
            method: 'PUT',
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

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <PageHeader 
          title="Trainer Schedule" 
          onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">AI-Powered Schedule Optimization</h1>
              <p className="text-gray-600 mt-2">
                Generate optimal schedules and manage booking requests with intelligent automation
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Optimal Schedule Display - Full Screen */}
            {!showOptimalSchedule ? (
              <div className="text-center py-16">
                <div className="mx-auto w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">AI-Powered Schedule Optimization</h3>
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                  Generate an optimal schedule that maximizes your time efficiency and client satisfaction. 
                  Our algorithm considers your preferences, client priorities, and scheduling constraints.
                </p>
                <button
                  onClick={generateOptimalSchedule}
                  disabled={loading}
                  className="px-8 py-4 text-lg text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                >
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {loading ? 'Generating Optimal Schedule...' : 'Generate Optimal Schedule'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Enhanced Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Requests</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {optimalScheduleData.statistics?.total_requests || 0}
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
                        <p className="text-sm text-gray-600">Approved</p>
                        <p className="text-3xl font-bold text-green-600 mt-2">
                          {optimalScheduleData.statistics?.scheduled_requests || 0}
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
                        <p className="text-sm text-gray-600">Declined</p>
                        <p className="text-3xl font-bold text-red-600 mt-2">
                          {optimalScheduleData.statistics?.unscheduled_requests || 0}
                        </p>
                      </div>
                      <div className="p-3 bg-red-100 rounded-full">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Efficiency</p>
                        <p className="text-3xl font-bold text-blue-600 mt-2">
                          {optimalScheduleData.statistics?.scheduling_efficiency || 0}%
                        </p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-full">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Schedule Optimization Results</h3>
                  <p className="text-gray-600 mb-6">{optimalScheduleData.message}</p>
                  
                  {/* Approved Requests */}
                  {optimalScheduleData.proposed_entries && optimalScheduleData.proposed_entries.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold text-green-700 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Approved Sessions ({optimalScheduleData.proposed_entries.length})
                      </h4>
                      <div className="space-y-4">
                        {optimalScheduleData.proposed_entries.map((entry: any, index: number) => (
                          <div key={index} className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-medium text-green-800 text-lg">{entry.client_name}</p>
                                <p className="text-sm text-green-600">{entry.session_type}</p>
                              </div>
                              <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                APPROVED
                              </span>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm text-green-700">
                                <strong>Time:</strong> {entry.start_time ? new Date(entry.start_time).toLocaleString() : 'No time specified'} - 
                                {entry.end_time ? new Date(entry.end_time).toLocaleString() : 'No time specified'}
                              </p>
                              <p className="text-sm text-green-700">
                                <strong>Duration:</strong> {entry.duration_minutes} minutes
                              </p>
                              {entry.training_type && (
                                <p className="text-sm text-green-700">
                                  <strong>Type:</strong> {entry.training_type}
                                </p>
                              )}
                              <p className="text-xs text-green-500 font-medium">✅ {entry.reason || 'Fits schedule with no conflicts'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Rejected Requests */}
                  {optimalScheduleData.rejected_entries && optimalScheduleData.rejected_entries.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold text-red-700 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Declined Sessions ({optimalScheduleData.rejected_entries.length})
                      </h4>
                      <div className="space-y-4">
                        {optimalScheduleData.rejected_entries.map((entry: any, index: number) => (
                          <div key={index} className="bg-red-50 p-4 rounded-lg border border-red-200">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-medium text-red-800 text-lg">{entry.client_name}</p>
                                <p className="text-sm text-red-600">{entry.session_type}</p>
                              </div>
                              <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                DECLINED
                              </span>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm text-red-700">
                                <strong>Requested Time:</strong> {entry.start_time ? new Date(entry.start_time).toLocaleString() : 'No time specified'} - 
                                {entry.end_time ? new Date(entry.end_time).toLocaleString() : 'No time specified'}
                              </p>
                              <p className="text-sm text-red-700">
                                <strong>Duration:</strong> {entry.duration_minutes} minutes
                              </p>
                              {entry.training_type && (
                                <p className="text-sm text-red-700">
                                  <strong>Type:</strong> {entry.training_type}
                                </p>
                              )}
                              <p className="text-xs text-red-500 font-medium">❌ {entry.reason}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setShowOptimalSchedule(false);
                        setOptimalScheduleData(null);
                      }}
                      className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Generate New Schedule
                    </button>
                    
                    {optimalScheduleData.proposed_entries && optimalScheduleData.proposed_entries.length > 0 && (
                      <button
                        onClick={applyOptimalSchedule}
                        disabled={applying}
                        className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {applying ? 'Applying...' : 'Apply Approved Sessions'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
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
