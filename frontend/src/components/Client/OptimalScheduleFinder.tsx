'use client';

import { useState, useEffect } from 'react';
import { trainers, bookings } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useFeatherIcons } from '../../utils/featherIcons';

interface OptimalScheduleFinderProps {
  selectedTrainer: string | null;
  onTrainerSelect: (trainerId: string | null) => void;
  isFinding: boolean;
  onBookingComplete?: () => void;
}

/**
 * Optimal schedule finder component for customers
 */
export default function OptimalScheduleFinder({ selectedTrainer, onTrainerSelect, isFinding, onBookingComplete }: OptimalScheduleFinderProps) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    sessionType: '',
    duration: 60,
    preferredDays: [] as string[],
    preferredTimes: [] as string[],
    location: '',
    frequency: 'weekly'
  });
  
  const [availableTrainers, setAvailableTrainers] = useState<any[]>([]);
  const [loadingTrainers, setLoadingTrainers] = useState(true);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Fetch available trainers
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        setLoadingTrainers(true);
        console.log('Fetching trainers...');
        const response = await trainers.getAll({ size: 20 });
        console.log('Trainers API response:', response);
        
        // The API returns an object with trainers array, not direct array
        if (response && response.trainers && Array.isArray(response.trainers)) {
          setAvailableTrainers(response.trainers);
          console.log('Set trainers:', response.trainers.length);
        } else if (Array.isArray(response)) {
          // Fallback in case API structure changes
          setAvailableTrainers(response);
          console.log('Set trainers (fallback):', response.length);
        } else {
          console.warn('Unexpected trainers response format:', response);
          setAvailableTrainers([]);
        }
      } catch (error) {
        console.error('Failed to fetch trainers:', error);
        setAvailableTrainers([]);
      } finally {
        setLoadingTrainers(false);
      }
    };
    
    fetchTrainers();
  }, []);

  // Use safe feather icon replacement
  useFeatherIcons([]);

  const sessionTypes = [
    'Strength Training',
    'Cardio HIIT',
    'Yoga',
    'Weight Loss',
    'Rehabilitation',
    'Sports Performance'
  ];

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = [
    'Early Morning (6-9 AM)',
    'Morning (9-12 PM)',
    'Afternoon (12-5 PM)',
    'Evening (5-8 PM)',
    'Late Evening (8-10 PM)'
  ];

  const locations = [
    'Gym/Studio',
    'Home Session',
    'Outdoor',
    'Virtual/Online'
  ];

  const handleDayToggle = (day: string) => {
    setPreferences(prev => ({
      ...prev,
      preferredDays: prev.preferredDays.includes(day)
        ? prev.preferredDays.filter(d => d !== day)
        : [...prev.preferredDays, day]
    }));
  };

  const handleTimeToggle = (time: string) => {
    setPreferences(prev => ({
      ...prev,
      preferredTimes: prev.preferredTimes.includes(time)
        ? prev.preferredTimes.filter(t => t !== time)
        : [...prev.preferredTimes, time]
    }));
  };

  const handleSmartBooking = async () => {
    if (!user) {
      alert('Please log in to book sessions');
      return;
    }
    
    if (!preferences.sessionType) {
      alert('Please select a session type');
      return;
    }

    try {
      const bookingData: any = {
        session_type: preferences.sessionType,
        duration_minutes: preferences.duration,
        location: preferences.location || 'Gym',
        earliest_date: new Date().toISOString(),
        latest_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ahead
        preferred_times: preferences.preferredTimes,
        avoid_times: [], // Could be enhanced to allow users to specify times to avoid
        prioritize_convenience: true,
        prioritize_cost: false,
        allow_weekends: preferences.frequency !== 'daily', // Allow weekends unless daily frequency
        allow_evenings: true
      };

      // Only add trainer_id if a trainer is selected
      if (selectedTrainer) {
        bookingData.trainer_id = parseInt(selectedTrainer);
      }

      // Use the new optimal scheduling API
      const result = await bookings.findOptimalSchedule(bookingData);
      setBookingSuccess(true);
      
      // Store the suggestions in localStorage so SuggestedTimes can access them
      if (result && result.suggested_slots) {
        localStorage.setItem('smartBookingSuggestions', JSON.stringify({
          bookingId: result.booking_id,
          suggestions: result.suggested_slots,
          bestSlot: result.best_slot,
          confidenceScore: result.confidence_score,
          message: result.message,
          trainerName: result.best_slot?.trainer_name || 'Optimal Trainer',
          totalTrainersEvaluated: result.total_trainers_evaluated || 0,
          totalSlotsFound: result.total_slots_found || 0
        }));
      }
      
      // Redirect to suggestions tab to show results
      setTimeout(() => {
        alert(`Optimal schedule found! ${result?.message || 'Your booking request has been processed.'}`);
        // Reset form
        setPreferences({
          sessionType: '',
          duration: 60,
          preferredDays: [],
          preferredTimes: [],
          location: '',
          frequency: 'weekly'
        });
        onTrainerSelect(null);
        // Trigger tab switch to suggestions
        if (onBookingComplete) {
          onBookingComplete();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Optimal scheduling failed:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response
      });
      
      // More specific error message
      let errorMessage = 'Failed to find optimal schedule. Please try again.';
      if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to server. Please make sure the backend is running.';
      } else if (error.status === 401) {
        errorMessage = 'Please log in to book sessions.';
      } else if (error.status === 400) {
        errorMessage = error.message || 'No available time slots found for your criteria.';
      }
      
      alert(errorMessage);
    }
  };

  if (isFinding) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <i data-feather="brain" className="h-8 w-8 text-indigo-600"></i>
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-2">
          Finding Your Optimal Schedule...
        </h3>
        <p className="text-gray-600 text-center max-w-md">
          Our smart algorithm is analyzing your preferences, trainer availability, and optimal times to create your perfect schedule.
        </p>
        <div className="mt-6 w-full max-w-md">
          <div className="bg-gray-200 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
          </div>
          <p className="text-sm text-gray-500 mt-2 text-center">Analyzing your preferences and trainer availability...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Trainer Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i data-feather="user" className="h-5 w-5 mr-2 text-indigo-600"></i>
          Choose Your Preferred Trainer (Optional)
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Select a specific trainer to find optimal scheduling times, or choose "All Trainers" to let our algorithm find the best trainer for your needs across all available trainers.
        </p>
        
        {loadingTrainers ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="ml-3 text-sm text-gray-600">Loading trainers...</p>
          </div>
        ) : Array.isArray(availableTrainers) && availableTrainers.length > 0 ? (
          <div className="space-y-4">
            {/* Trainer Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Trainer ({availableTrainers.length} available)
              </label>
              <select
                value={selectedTrainer || ''}
                onChange={(e) => onTrainerSelect(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Trainers (Let AI choose the best match)</option>
                {availableTrainers
                  .sort((a, b) => {
                    // Sort by rating (highest first), then by name
                    const ratingA = a.rating || 0;
                    const ratingB = b.rating || 0;
                    if (ratingA !== ratingB) {
                      return ratingB - ratingA;
                    }
                    return (a.user_name || a.name || '').localeCompare(b.user_name || b.name || '');
                  })
                  .map((trainer) => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainer.user_name || trainer.name} - {trainer.specialty || 'Personal Trainer'} 
                      {trainer.rating ? ` (⭐ ${trainer.rating})` : ''} 
                      {trainer.price_per_session ? ` - $${trainer.price_per_session}/session` : ''}
                    </option>
                  ))}
              </select>
            </div>

            {/* Selected Trainer Info or Default Message */}
            {selectedTrainer ? (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={availableTrainers.find(t => t.id === selectedTrainer)?.user_avatar || 
                          availableTrainers.find(t => t.id === selectedTrainer)?.avatar || 
                          'https://i.pravatar.cc/200'}
                    alt={availableTrainers.find(t => t.id === selectedTrainer)?.user_name || 
                          availableTrainers.find(t => t.id === selectedTrainer)?.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {availableTrainers.find(t => t.id === selectedTrainer)?.user_name || 
                       availableTrainers.find(t => t.id === selectedTrainer)?.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {availableTrainers.find(t => t.id === selectedTrainer)?.specialty || 
                       availableTrainers.find(t => t.id === selectedTrainer)?.bio || 
                       'Personal Trainer'}
                    </p>
                    <div className="flex items-center mt-1">
                      <div className="flex text-yellow-400 text-xs">
                        {'★'.repeat(Math.floor(availableTrainers.find(t => t.id === selectedTrainer)?.rating || 5))}
                      </div>
                      <span className="text-xs text-gray-500 ml-1">
                        {availableTrainers.find(t => t.id === selectedTrainer)?.rating || 5} 
                        ({availableTrainers.find(t => t.id === selectedTrainer)?.reviews || 10} reviews)
                      </span>
                      {availableTrainers.find(t => t.id === selectedTrainer)?.price_per_session && (
                        <span className="text-xs text-indigo-600 ml-2">
                          ${availableTrainers.find(t => t.id === selectedTrainer)?.price_per_session}/session
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onTrainerSelect(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <i data-feather="x" className="h-5 w-5"></i>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <i data-feather="brain" className="h-8 w-8 text-blue-600"></i>
                  <div>
                    <h4 className="font-medium text-blue-900">AI-Powered Trainer Selection</h4>
                    <p className="text-sm text-blue-700">
                      Our algorithm will analyze all available trainers and find the best match based on your preferences, availability, and optimization criteria.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="mb-4">
              <i data-feather="users" className="h-12 w-12 text-gray-400 mx-auto"></i>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Trainers Available</h4>
            <p className="text-gray-600 mb-4">There are no trainers available at the moment. Please try again later.</p>
            <div className="text-xs text-gray-400 bg-gray-100 p-3 rounded">
              <p>Debug info:</p>
              <p>Loading: {loadingTrainers ? 'Yes' : 'No'}</p>
              <p>Available trainers: {availableTrainers.length}</p>
              <p>Trainers type: {Array.isArray(availableTrainers) ? 'Array' : typeof availableTrainers}</p>
            </div>
            <button 
              onClick={() => {
                setLoadingTrainers(true);
                // Retry fetching trainers
                const fetchTrainers = async () => {
                  try {
                    const response = await trainers.getAll({ size: 20 });
                    console.log('Retry - Trainers API response:', response);
                    if (response && response.trainers && Array.isArray(response.trainers)) {
                      setAvailableTrainers(response.trainers);
                    } else if (Array.isArray(response)) {
                      setAvailableTrainers(response);
                    } else {
                      setAvailableTrainers([]);
                    }
                  } catch (error) {
                    console.error('Retry failed:', error);
                    setAvailableTrainers([]);
                  } finally {
                    setLoadingTrainers(false);
                  }
                };
                fetchTrainers();
              }}
              className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700"
            >
              Retry Loading Trainers
            </button>
          </div>
        )}
      </div>

      {/* Session Preferences */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i data-feather="settings" className="h-5 w-5 mr-2 text-indigo-600"></i>
          Your Session Preferences
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Session Type & Duration */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Type
              </label>
              <select
                value={preferences.sessionType}
                onChange={(e) => setPreferences(prev => ({ ...prev, sessionType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select session type</option>
                {sessionTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Duration
              </label>
              <select
                value={preferences.duration}
                onChange={(e) => setPreferences(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={75}>75 minutes</option>
                <option value={90}>90 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Preference
              </label>
              <select
                value={preferences.location}
                onChange={(e) => setPreferences(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select location</option>
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Frequency
              </label>
              <select
                value={preferences.frequency}
                onChange={(e) => setPreferences(prev => ({ ...prev, frequency: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          {/* Preferred Days */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Preferred Days
              </label>
              <div className="grid grid-cols-2 gap-2">
                {daysOfWeek.map((day) => (
                  <button
                    key={day}
                    onClick={() => handleDayToggle(day)}
                    className={`p-2 text-sm rounded-md border transition-smooth ${
                      preferences.preferredDays.includes(day)
                        ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Preferred Times
              </label>
              <div className="space-y-2">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => handleTimeToggle(time)}
                    className={`w-full p-2 text-sm rounded-md border transition-smooth text-left ${
                      preferences.preferredTimes.includes(time)
                        ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Quick Actions</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={handleSmartBooking}
            disabled={!preferences.sessionType}
            className="p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-smooth text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center space-x-3">
              <i data-feather="zap" className="h-5 w-5 text-indigo-600"></i>
              <div>
                <div className="font-medium text-gray-900">Find Optimal Schedule</div>
                <div className="text-sm text-gray-600">Greedy algorithm finds best trainer & time</div>
              </div>
            </div>
          </button>

          <button 
            onClick={() => router.push('/direct-booking')}
            className="p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-smooth text-left"
          >
            <div className="flex items-center space-x-3">
              <i data-feather="calendar" className="h-5 w-5 text-indigo-600"></i>
              <div>
                <div className="font-medium text-gray-900">Browse Available</div>
                <div className="text-sm text-gray-600">See all available time slots</div>
              </div>
            </div>
          </button>

          <button className="p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-smooth text-left">
            <div className="flex items-center space-x-3">
              <i data-feather="clock" className="h-5 w-5 text-indigo-600"></i>
              <div>
                <div className="font-medium text-gray-900">Flexible Times</div>
                <div className="text-sm text-gray-600">Find times that work for both of you</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}





