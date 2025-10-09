'use client';

import { useState, useEffect } from 'react';
import { bookings } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface OptimalSchedulingRequest {
  trainer_id: number;
  duration_minutes: number;
  preferred_times: string[];
  start_date: string;
  end_date: string;
  location_preferences?: string[];
  training_types?: string[];
}

interface OptimalSlot {
  id: number;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  score: number;
  is_combined?: boolean;
  component_slots?: number[];
}

interface OptimalSchedulingResponse {
  optimal_slots: OptimalSlot[];
  total_slots_found: number;
  optimization_score: number;
  message: string;
}

export default function TrainerOptimalScheduler() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimalSchedulingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [schedulingRequest, setSchedulingRequest] = useState<OptimalSchedulingRequest>({
    trainer_id: user?.trainer_profile?.id || 0,
    duration_minutes: 60,
    preferred_times: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    location_preferences: [],
    training_types: []
  });

  useEffect(() => {
    if (user?.trainer_profile?.id) {
      setSchedulingRequest(prev => ({
        ...prev,
        trainer_id: user.trainer_profile.id
      }));
    }
  }, [user]);

  const handleOptimizeSchedule = async () => {
    if (!user?.trainer_profile?.id) {
      setError('Trainer profile not found');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await bookings.findOptimalSchedule({
        trainer_id: user.trainer_profile.id,
        duration_minutes: schedulingRequest.duration_minutes,
        preferred_times: schedulingRequest.preferred_times,
        start_date: schedulingRequest.start_date,
        end_date: schedulingRequest.end_date,
        location_preferences: schedulingRequest.location_preferences,
        training_types: schedulingRequest.training_types
      });

      setResult(response);
    } catch (err: any) {
      console.error('Failed to find optimal schedule:', err);
      setError(err.message || 'Failed to find optimal schedule');
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <i data-feather="zap" className="h-5 w-5 mr-2 text-indigo-600"></i>
            Optimal Schedule Finder
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Find the best available time slots for your clients
          </p>
        </div>
      </div>

      {/* Scheduling Parameters */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Scheduling Parameters</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <select
              value={schedulingRequest.duration_minutes}
              onChange={(e) => setSchedulingRequest(prev => ({
                ...prev,
                duration_minutes: parseInt(e.target.value)
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>120 minutes</option>
              <option value={150}>150 minutes</option>
              <option value={180}>180 minutes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={schedulingRequest.start_date}
              onChange={(e) => setSchedulingRequest(prev => ({
                ...prev,
                start_date: e.target.value
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={schedulingRequest.end_date}
              onChange={(e) => setSchedulingRequest(prev => ({
                ...prev,
                end_date: e.target.value
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Times
          </label>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map((time) => (
              <button
                key={time}
                onClick={() => {
                  setSchedulingRequest(prev => ({
                    ...prev,
                    preferred_times: prev.preferred_times.includes(time)
                      ? prev.preferred_times.filter(t => t !== time)
                      : [...prev.preferred_times, time]
                  }));
                }}
                className={`p-2 text-sm rounded-md border transition-colors ${
                  schedulingRequest.preferred_times.includes(time)
                    ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={handleOptimizeSchedule}
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Finding Optimal Slots...' : 'Find Optimal Schedule'}
          </button>
        </div>
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
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Optimization Score:</span>
              <span className={`px-2 py-1 rounded-full text-sm font-medium ${getScoreColor(result.optimization_score)}`}>
                {result.optimization_score}%
              </span>
            </div>
          </div>

          <p className="text-gray-600 mb-4">{result.message}</p>

          {result.optimal_slots.length > 0 ? (
            <div className="space-y-3">
              <h5 className="font-medium text-gray-900">Recommended Time Slots:</h5>
              {result.optimal_slots.map((slot, index) => {
                const formatted = formatDateTime(slot.start_time);
                const endFormatted = formatDateTime(slot.end_time);
                
                return (
                  <div key={slot.id || index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {formatted.date} • {formatted.time} - {endFormatted.time}
                        </div>
                        <div className="text-sm text-gray-600">
                          {slot.duration_minutes} minutes
                          {slot.is_combined && ' (Combined slots)'}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(slot.score)}`}>
                          {slot.score}% match
                        </span>
                        <button
                          onClick={() => {
                            // Copy to clipboard or save for booking
                            const slotInfo = `${formatted.date} at ${formatted.time} - ${endFormatted.time} (${slot.duration_minutes} min)`;
                            navigator.clipboard.writeText(slotInfo);
                            alert('Slot details copied to clipboard!');
                          }}
                          className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 transition-colors"
                        >
                          Use Slot
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <i data-feather="calendar" className="h-12 w-12 mx-auto mb-4 text-gray-300"></i>
              <p>No optimal slots found for the given criteria.</p>
              <p className="text-sm mt-1">Try adjusting your preferences or date range.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


