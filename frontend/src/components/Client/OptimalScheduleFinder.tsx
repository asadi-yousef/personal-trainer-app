'use client';

import { useState, useEffect } from 'react';
import { trainers, bookings } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

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
        const trainersData = await trainers.getAll({ limit: 20 });
        // Ensure we always have an array
        setAvailableTrainers(Array.isArray(trainersData) ? trainersData : []);
      } catch (error) {
        console.error('Failed to fetch trainers:', error);
        setAvailableTrainers([]);
      } finally {
        setLoadingTrainers(false);
      }
    };
    
    fetchTrainers();
  }, []);

  useEffect(() => {
    const loadFeatherIcons = async () => {
      try {
        const feather = (await import('feather-icons')).default;
        feather.replace();
      } catch (error) {
        console.error('Failed to load feather icons:', error);
      }
    };
    loadFeatherIcons();
  }, []);

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
          Select a specific trainer to find optimal scheduling times, or leave unselected to let our algorithm find the best trainer for your needs across all available trainers.
        </p>
        
        {loadingTrainers ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : Array.isArray(availableTrainers) && availableTrainers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableTrainers.map((trainer) => (
            <div
              key={trainer.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-smooth ${
                selectedTrainer === trainer.id
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => onTrainerSelect(trainer.id)}
            >
              <div className="flex items-center space-x-3">
                <img
                  src={trainer.user_avatar || trainer.avatar || 'https://i.pravatar.cc/200'}
                  alt={trainer.user_name || trainer.name}
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{trainer.user_name || trainer.name}</h4>
                  <p className="text-sm text-gray-600">{trainer.specialty || trainer.bio || 'Personal Trainer'}</p>
                  <div className="flex items-center mt-1">
                    <div className="flex text-yellow-400 text-xs">
                      {'★'.repeat(Math.floor(trainer.rating || 5))}
                    </div>
                    <span className="text-xs text-gray-500 ml-1">
                      {trainer.rating || 5} ({trainer.reviews || 10} reviews)
                    </span>
                  </div>
                </div>
              </div>
              {selectedTrainer === trainer.id && (
                <div className="mt-3 flex items-center text-indigo-600 text-sm">
                  <i data-feather="check" className="h-4 w-4 mr-1"></i>
                  Selected
                </div>
              )}
            </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="mb-4">
              <i data-feather="users" className="h-12 w-12 text-gray-400 mx-auto"></i>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Trainers Available</h4>
            <p className="text-gray-600">There are no trainers available at the moment. Please try again later.</p>
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

          <button className="p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-smooth text-left">
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





