'use client';

import { useState, useEffect } from 'react';
import { mockTrainers } from '../../lib/data';

interface OptimalScheduleFinderProps {
  selectedTrainer: string | null;
  onTrainerSelect: (trainerId: string | null) => void;
  isFinding: boolean;
}

/**
 * Optimal schedule finder component for customers
 */
export default function OptimalScheduleFinder({ selectedTrainer, onTrainerSelect, isFinding }: OptimalScheduleFinderProps) {
  const [preferences, setPreferences] = useState({
    sessionType: '',
    duration: 60,
    preferredDays: [] as string[],
    preferredTimes: [] as string[],
    location: '',
    frequency: 'weekly'
  });

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
          Choose Your Preferred Trainer
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Select a trainer to find optimal scheduling times, or let us suggest the best trainer for your needs.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockTrainers.map((trainer) => (
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
                  src={trainer.avatar}
                  alt={trainer.name}
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{trainer.name}</h4>
                  <p className="text-sm text-gray-600">{trainer.specialty}</p>
                  <div className="flex items-center mt-1">
                    <div className="flex text-yellow-400 text-xs">
                      {'★'.repeat(Math.floor(trainer.rating))}
                    </div>
                    <span className="text-xs text-gray-500 ml-1">
                      {trainer.rating} ({trainer.reviews} reviews)
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
          <button className="p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-smooth text-left">
            <div className="flex items-center space-x-3">
              <i data-feather="zap" className="h-5 w-5 text-indigo-600"></i>
              <div>
                <div className="font-medium text-gray-900">Smart Suggestions</div>
                <div className="text-sm text-gray-600">Get AI-powered time recommendations</div>
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





