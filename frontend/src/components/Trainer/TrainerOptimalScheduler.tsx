'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';

interface ProposedEntry {
  booking_request_id: number;
  client_id: number;
  client_name: string;
  session_type: string;
  training_type: string;
  duration_minutes: number;
  start_time: string;
  end_time: string;
  slot_ids: number[];
  is_contiguous: boolean;
  location: string;
  special_requests?: string;
  priority_score: number;
}

interface OptimalScheduleStatistics {
  total_requests: number;
  scheduled_requests: number;
  unscheduled_requests: number;
  total_hours: number;
  gaps_minimized: number;
  utilization_rate: number;
  scheduling_efficiency: number;
}

interface OptimalScheduleResponse {
  trainer_id: number;
  proposed_entries: ProposedEntry[];
  statistics: OptimalScheduleStatistics;
  message: string;
}

export default function TrainerOptimalScheduler() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimalScheduleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateSchedule = async () => {
    if (!user?.trainer_profile?.id) {
      setError('Trainer profile not found');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Call the new optimal schedule endpoint that uses saved preferences
      const response = await fetch('http://127.0.0.1:8000/api/trainer/me/optimal-schedule', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate schedule');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error('Failed to generate optimal schedule:', err);
      setError(err.message || 'Failed to generate optimal schedule');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <i data-feather="zap" className="h-5 w-5 mr-2 text-indigo-600"></i>
            Optimal Schedule Generator
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Generate optimal schedule based on your preferences and pending booking requests
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <i data-feather="info" className="h-5 w-5 text-blue-600 mr-3 mt-0.5"></i>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">How it works</h4>
            <p className="text-sm text-blue-700">
              This algorithm uses your saved scheduling preferences to find the best times for pending booking requests. 
              <Link href="/trainer/scheduling-preferences" className="underline ml-1 font-medium">
                Manage preferences
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <button
          onClick={handleGenerateSchedule}
          disabled={loading}
          className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold inline-flex items-center"
        >
          <i data-feather="zap" className="h-5 w-5 mr-2"></i>
          {loading ? 'Generating Schedule...' : 'Generate Optimal Schedule'}
        </button>
        <p className="text-sm text-gray-600 mt-3">
          Click to analyze pending requests and generate the best schedule
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i data-feather="zap" className="h-6 w-6 text-indigo-600"></i>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">
            Analyzing Available Slots...
          </h3>
          <p className="text-gray-600 text-center max-w-md">
            Finding the best time slots based on your preferences and availability.
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <i data-feather="alert-triangle" className="h-5 w-5 text-red-400"></i>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Optimal Schedule Results</h4>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{result.statistics.scheduled_requests}</div>
                <div className="text-xs text-gray-600">Scheduled</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{result.statistics.scheduling_efficiency}%</div>
                <div className="text-xs text-gray-600">Efficiency</div>
              </div>
            </div>
          </div>

          <p className="text-gray-600 mb-4">{result.message}</p>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm text-gray-600">Total Requests</div>
              <div className="text-xl font-semibold text-gray-900">{result.statistics.total_requests}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Unscheduled</div>
              <div className="text-xl font-semibold text-orange-600">{result.statistics.unscheduled_requests}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Hours</div>
              <div className="text-xl font-semibold text-gray-900">{result.statistics.total_hours}h</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Gaps Minimized</div>
              <div className="text-xl font-semibold text-green-600">{result.statistics.gaps_minimized}</div>
            </div>
          </div>

          {result.proposed_entries.length > 0 ? (
            <div className="space-y-3">
              <h5 className="font-medium text-gray-900">Proposed Schedule:</h5>
              {result.proposed_entries.map((entry, index) => {
                const formatted = formatDateTime(entry.start_time);
                const endFormatted = formatDateTime(entry.end_time);
                
                return (
                  <div key={entry.booking_request_id || index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="font-semibold text-gray-900">{entry.client_name}</div>
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                            {entry.training_type || entry.session_type}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center">
                            <i data-feather="calendar" className="h-4 w-4 mr-2"></i>
                            {formatted.date} • {formatted.time} - {endFormatted.time}
                          </div>
                          <div className="flex items-center">
                            <i data-feather="clock" className="h-4 w-4 mr-2"></i>
                            {entry.duration_minutes} minutes
                            {entry.is_contiguous && ' (consecutive slots)'}
                          </div>
                          {entry.location && (
                            <div className="flex items-center">
                              <i data-feather="map-pin" className="h-4 w-4 mr-2"></i>
                              {entry.location}
                            </div>
                          )}
                          {entry.special_requests && (
                            <div className="flex items-start">
                              <i data-feather="message-circle" className="h-4 w-4 mr-2 mt-0.5"></i>
                              <span className="text-xs">{entry.special_requests}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          Priority: {entry.priority_score}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <i data-feather="calendar" className="h-12 w-12 mx-auto mb-4 text-gray-300"></i>
              <p className="font-medium">No pending booking requests found</p>
              <p className="text-sm mt-1">There are no booking requests waiting to be scheduled</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}





