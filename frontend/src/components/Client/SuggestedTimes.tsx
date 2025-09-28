'use client';

import { useState, useEffect } from 'react';
import { mockOptimizationResult } from '../../lib/data';

/**
 * Suggested times component for customers showing optimal scheduling results
 */
export default function SuggestedTimes() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

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

  // Mock optimal time suggestions
  const optimalSuggestions = [
    {
      id: '1',
      date: '2024-01-15',
      time: '09:00',
      endTime: '10:00',
      trainer: 'Sarah Johnson',
      sessionType: 'Strength Training',
      confidence: 95,
      reasons: ['Matches your morning preference', 'Trainer availability', 'Optimal energy levels'],
      location: 'Gym Studio A'
    },
    {
      id: '2',
      date: '2024-01-15',
      time: '17:00',
      endTime: '18:00',
      trainer: 'Sarah Johnson',
      sessionType: 'Strength Training',
      confidence: 88,
      reasons: ['After work timing', 'Good recovery time', 'Consistent schedule'],
      location: 'Gym Studio A'
    },
    {
      id: '3',
      date: '2024-01-17',
      time: '10:00',
      endTime: '11:00',
      trainer: 'Mike Chen',
      sessionType: 'Cardio HIIT',
      confidence: 92,
      reasons: ['Mid-morning energy peak', 'Trainer specialty match', 'Available slot'],
      location: 'Outdoor Area'
    }
  ];

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-100';
    if (confidence >= 80) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 90) return 'Excellent';
    if (confidence >= 80) return 'Good';
    return 'Fair';
  };

  const handleBookSession = (suggestion: any) => {
    alert(`Booking session with ${suggestion.trainer} on ${suggestion.date} at ${suggestion.time}`);
  };

  return (
    <div className="space-y-8">
      {/* Algorithm Results Summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i data-feather="brain" className="h-5 w-5 mr-2 text-indigo-600"></i>
          Optimal Schedule Results
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{optimalSuggestions.length}</div>
            <div className="text-sm text-gray-600">Optimal Times Found</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">92%</div>
            <div className="text-sm text-gray-600">Average Confidence</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">3</div>
            <div className="text-sm text-gray-600">Trainers Available</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">15min</div>
            <div className="text-sm text-gray-600">Avg Travel Time</div>
          </div>
        </div>
      </div>

      {/* Suggested Times */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <i data-feather="clock" className="h-5 w-5 mr-2 text-indigo-600"></i>
          Recommended Session Times
        </h3>

        <div className="space-y-4">
          {optimalSuggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-smooth"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {new Date(suggestion.date).getDate()}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(suggestion.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short' })}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xl font-semibold text-gray-900">
                          {suggestion.time} - {suggestion.endTime}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConfidenceColor(suggestion.confidence)}`}>
                          {suggestion.confidence}% {getConfidenceLabel(suggestion.confidence)}
                        </span>
                      </div>
                      
                      <div className="text-gray-600 mb-2">
                        <strong>{suggestion.trainer}</strong> • {suggestion.sessionType}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <i data-feather="map-pin" className="h-4 w-4 mr-1"></i>
                        {suggestion.location}
                      </div>
                    </div>
                  </div>

                  {/* Why this time is optimal */}
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Why this time works:</div>
                    <div className="flex flex-wrap gap-2">
                      {suggestion.reasons.map((reason, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col space-y-2 lg:ml-6">
                  <button
                    onClick={() => handleBookSession(suggestion)}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus-ring transition-smooth"
                  >
                    Book This Time
                  </button>
                  <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus-ring transition-smooth">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alternative Options */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i data-feather="refresh-cw" className="h-5 w-5 mr-2 text-indigo-600"></i>
          Alternative Options
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-smooth text-left">
            <div className="flex items-center space-x-3">
              <i data-feather="search" className="h-5 w-5 text-indigo-600"></i>
              <div>
                <div className="font-medium text-gray-900">Find More Times</div>
                <div className="text-sm text-gray-600">Search for additional optimal slots</div>
              </div>
            </div>
          </button>

          <button className="p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-smooth text-left">
            <div className="flex items-center space-x-3">
              <i data-feather="calendar" className="h-5 w-5 text-indigo-600"></i>
              <div>
                <div className="font-medium text-gray-900">Browse All Available</div>
                <div className="text-sm text-gray-600">See all trainer availability</div>
              </div>
            </div>
          </button>

          <button className="p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-smooth text-left">
            <div className="flex items-center space-x-3">
              <i data-feather="settings" className="h-5 w-5 text-indigo-600"></i>
              <div>
                <div className="font-medium text-gray-900">Adjust Preferences</div>
                <div className="text-sm text-gray-600">Modify your scheduling criteria</div>
              </div>
            </div>
          </button>

          <button className="p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-smooth text-left">
            <div className="flex items-center space-x-3">
              <i data-feather="zap" className="h-5 w-5 text-indigo-600"></i>
              <div>
                <div className="font-medium text-gray-900">Re-run Algorithm</div>
                <div className="text-sm text-gray-600">Get fresh optimal suggestions</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Algorithm Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">Peak Performance</div>
            <div className="text-sm text-gray-600">Morning sessions show 95% confidence</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">Trainer Match</div>
            <div className="text-sm text-gray-600">Sarah Johnson is your optimal trainer</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">Schedule Fit</div>
            <div className="text-sm text-gray-600">Perfect alignment with your preferences</div>
          </div>
        </div>
      </div>
    </div>
  );
}





