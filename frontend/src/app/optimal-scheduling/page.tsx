'use client';

import { useState, useEffect } from 'react';
import { useAuth, ProtectedRoute } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { bookings, bookingManagement } from '../../lib/api';

interface SelectedTrainer {
  id: number;
  name: string;
  specialty: string;
  rating: number;
  price: number;
}

interface OptimalSlot {
  slot_id: number;
  date_str: string;
  start_time_str: string;
  end_time_str: string;
  score: number;
  trainer_id?: number;
  trainer_name?: string;
  trainer_specialty?: string;
  trainer_rating?: number;
  trainer_price?: number;
}

function OptimalSchedulingPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedTrainer, setSelectedTrainer] = useState<SelectedTrainer | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<OptimalSlot[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Form state
  const [preferredTimes, setPreferredTimes] = useState<string[]>([]);
  const [avoidTimes, setAvoidTimes] = useState<string[]>([]);
  const [allowWeekends, setAllowWeekends] = useState(true);
  const [allowEvenings, setAllowEvenings] = useState(true);
  const [duration, setDuration] = useState(60);
  const [earliestDate, setEarliestDate] = useState('');
  const [latestDate, setLatestDate] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Load selected trainer from localStorage
    const storedTrainer = localStorage.getItem('selectedTrainer');
    if (storedTrainer) {
      setSelectedTrainer(JSON.parse(storedTrainer));
    }

    // Set default dates (next 2 weeks)
    const today = new Date();
    const twoWeeksLater = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    
    setEarliestDate(today.toISOString().split('T')[0]);
    setLatestDate(twoWeeksLater.toISOString().split('T')[0]);
  }, [user, router]);

  const handleFindOptimalSchedule = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const bookingData = {
        session_type: 'Personal Training',
        preferred_times: preferredTimes,
        avoid_times: avoidTimes,
        allow_weekends: allowWeekends,
        allow_evenings: allowEvenings,
        duration_minutes: duration,
        earliest_date: new Date(earliestDate).toISOString(),
        latest_date: new Date(latestDate).toISOString(),
        trainer_id: selectedTrainer?.id || null,
        location: 'Gym',
        special_requests: 'Booked via optimal scheduling'
      };

      const response = await bookings.findOptimalSchedule(bookingData);
      
      if (response.suggested_slots && response.suggested_slots.length > 0) {
        setSuggestions(response.suggested_slots);
        // Store suggestions for the suggested times component
        localStorage.setItem('smartBookingSuggestions', JSON.stringify({
          suggestions: response.suggested_slots,
          confidence_score: response.confidence_score,
          message: response.message
        }));
        setError(null); // Clear any previous errors
      } else {
        // Handle empty results gracefully
        setSuggestions([]);
        setError(response.message || 'No optimal time slots found. Try adjusting your preferences.');
      }
    } catch (err: any) {
      console.error('Error finding optimal schedule:', err);
      
      // Handle "no slots found" as a normal case, not an error
      if (err.message && err.message.includes('No available slots found')) {
        setSuggestions([]);
        setError(err.message);
      } else {
        setError(err.message || 'Failed to find optimal schedule');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = async (slot: OptimalSlot) => {
    if (!user) {
      alert('Please log in to book sessions');
      return;
    }

    try {
      // Create a booking request for the optimal slot
      const bookingRequestData = {
        trainer_id: slot.trainer_id || selectedTrainer?.id,
        session_type: 'Personal Training',
        duration_minutes: duration,
        location: 'Gym',
        special_requests: 'Booked via optimal scheduling algorithm',
        preferred_start_date: new Date(`${slot.date_str}T${slot.start_time_str}:00`).toISOString(),
        preferred_end_date: new Date(`${slot.date_str}T${slot.end_time_str}:00`).toISOString(),
        preferred_times: [slot.start_time_str],
        allow_weekends: true,
        allow_evenings: true,
        is_recurring: false
      };

      await bookingManagement.createBookingRequest(bookingRequestData);
      alert('Booking request sent successfully! The trainer will review and confirm your booking.');
      
      // Clear suggestions and redirect to client dashboard
      setSuggestions([]);
      router.push('/client');
    } catch (err: any) {
      console.error('Error booking slot:', err);
      alert('Failed to send booking request: ' + (err.message || 'Unknown error'));
    }
  };

  const addTimePreference = (time: string, isPreferred: boolean = true) => {
    if (isPreferred) {
      if (!preferredTimes.includes(time)) {
        setPreferredTimes([...preferredTimes, time]);
      }
    } else {
      if (!avoidTimes.includes(time)) {
        setAvoidTimes([...avoidTimes, time]);
      }
    }
  };

  const removeTimePreference = (time: string, isPreferred: boolean = true) => {
    if (isPreferred) {
      setPreferredTimes(preferredTimes.filter(t => t !== time));
    } else {
      setAvoidTimes(avoidTimes.filter(t => t !== time));
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {selectedTrainer ? `Find Optimal Times with ${selectedTrainer.name}` : 'Find Optimal Training Schedule'}
          </h1>
          <p className="text-gray-600">
            {selectedTrainer 
              ? `Get the best available times for training with ${selectedTrainer.name}`
              : 'Get the best available times across all trainers'
            }
          </p>
        </div>

        {/* Selected Trainer Info */}
        {selectedTrainer && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Selected Trainer</h2>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{selectedTrainer.name}</h3>
                <p className="text-sm text-gray-600">{selectedTrainer.specialty}</p>
                <div className="flex items-center mt-2">
                  <div className="flex text-yellow-400 mr-2">
                    {'★'.repeat(Math.floor(selectedTrainer.rating))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {selectedTrainer.rating} • ${selectedTrainer.price}/session
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('selectedTrainer');
                  setSelectedTrainer(null);
                }}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Change Trainer
              </button>
            </div>
          </div>
        )}

        {/* Preferences Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Schedule Preferences</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={earliestDate}
                  onChange={(e) => setEarliestDate(e.target.value)}
                  min={getTodayDate()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="date"
                  value={latestDate}
                  onChange={(e) => setLatestDate(e.target.value)}
                  min={earliestDate || getTodayDate()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Duration (minutes)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
                <option value={120}>120 minutes</option>
              </select>
            </div>

            {/* Preferred Times */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Times
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map(time => (
                  <button
                    key={time}
                    onClick={() => addTimePreference(time, true)}
                    className={`px-3 py-1 text-sm rounded-md border ${
                      preferredTimes.includes(time)
                        ? 'bg-indigo-100 border-indigo-300 text-indigo-800'
                        : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
              {preferredTimes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {preferredTimes.map(time => (
                    <span
                      key={time}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800"
                    >
                      {time}
                      <button
                        onClick={() => removeTimePreference(time, true)}
                        className="ml-1 text-indigo-600 hover:text-indigo-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Avoid Times */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Avoid Times
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {['08:00', '12:00', '13:00', '19:00', '20:00'].map(time => (
                  <button
                    key={time}
                    onClick={() => addTimePreference(time, false)}
                    className={`px-3 py-1 text-sm rounded-md border ${
                      avoidTimes.includes(time)
                        ? 'bg-red-100 border-red-300 text-red-800'
                        : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
              {avoidTimes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {avoidTimes.map(time => (
                    <span
                      key={time}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800"
                    >
                      {time}
                      <button
                        onClick={() => removeTimePreference(time, false)}
                        className="ml-1 text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Options */}
            <div className="md:col-span-2">
              <div className="flex space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={allowWeekends}
                    onChange={(e) => setAllowWeekends(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Allow weekends</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={allowEvenings}
                    onChange={(e) => setAllowEvenings(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Allow evenings (after 6 PM)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Find Schedule Button */}
          <div className="mt-6">
            <button
              onClick={handleFindOptimalSchedule}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Finding Optimal Schedule...' : 'Find Optimal Schedule'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Optimal Schedule Suggestions</h2>
            <div className="space-y-4">
              {suggestions.map((slot, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {slot.date_str} at {slot.start_time_str} - {slot.end_time_str}
                          </h3>
                          {slot.trainer_name && (
                            <p className="text-sm text-gray-600">
                              with {slot.trainer_name} ({slot.trainer_specialty})
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            Score: {slot.score.toFixed(1)}
                          </div>
                          {slot.trainer_rating && (
                            <div className="text-sm text-gray-600">
                              Rating: {slot.trainer_rating} ⭐
                            </div>
                          )}
                          {slot.trainer_price && (
                            <div className="text-sm text-gray-600">
                              ${slot.trainer_price}/session
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleBookSlot(slot)}
                      className="ml-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                    >
                      Request This Slot
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Optimal scheduling page with role protection - only clients can access
 */
export default function OptimalSchedulingPage() {
  return (
    <ProtectedRoute requiredRole="client">
      <OptimalSchedulingPageContent />
    </ProtectedRoute>
  );
}
