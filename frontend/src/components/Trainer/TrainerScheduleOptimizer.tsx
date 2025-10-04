'use client';

import { useState, useEffect } from 'react';

interface TrainerScheduleOptimizerProps {
  isOptimizing: boolean;
}

/**
 * Trainer schedule optimizer component
 */
export default function TrainerScheduleOptimizer({ isOptimizing }: TrainerScheduleOptimizerProps) {
  const [optimizationSettings, setOptimizationSettings] = useState({
    maxSessionsPerDay: 8,
    minBreakBetweenSessions: 15, // minutes
    preferredWorkHours: {
      start: '08:00',
      end: '20:00'
    },
    optimizationGoals: ['maximize_client_satisfaction', 'minimize_travel_time', 'balance_workload'],
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    clientPriority: 'balanced' // 'premium_first', 'balanced', 'new_clients_first'
  });

  const [currentSchedule, setCurrentSchedule] = useState([
    {
      id: '1',
      time: '09:00',
      client: 'John Smith',
      sessionType: 'Strength Training',
      duration: 60,
      location: 'Studio A',
      status: 'confirmed'
    },
    {
      id: '2',
      time: '11:00',
      client: 'Sarah Johnson',
      sessionType: 'Cardio HIIT',
      duration: 45,
      location: 'Studio B',
      status: 'confirmed'
    },
    {
      id: '3',
      time: '14:00',
      client: 'Mike Chen',
      sessionType: 'Weight Loss',
      duration: 60,
      location: 'Studio A',
      status: 'pending'
    }
  ]);

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

  const optimizationGoals = [
    { id: 'maximize_client_satisfaction', label: 'Maximize Client Satisfaction', description: 'Prioritize client preferences and optimal training times' },
    { id: 'minimize_travel_time', label: 'Minimize Travel Time', description: 'Reduce travel between sessions and locations' },
    { id: 'balance_workload', label: 'Balance Workload', description: 'Distribute sessions evenly throughout the week' },
    { id: 'maximize_revenue', label: 'Maximize Revenue', description: 'Optimize for highest-paying sessions' },
    { id: 'reduce_fatigue', label: 'Reduce Fatigue', description: 'Schedule breaks and avoid back-to-back intense sessions' }
  ];

  const workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleGoalToggle = (goalId: string) => {
    setOptimizationSettings(prev => ({
      ...prev,
      optimizationGoals: prev.optimizationGoals.includes(goalId)
        ? prev.optimizationGoals.filter(g => g !== goalId)
        : [...prev.optimizationGoals, goalId]
    }));
  };

  const handleDayToggle = (day: string) => {
    setOptimizationSettings(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day]
    }));
  };

  if (isOptimizing) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <i data-feather="zap" className="h-8 w-8 text-indigo-600"></i>
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-2">
          Optimizing Your Schedule...
        </h3>
        <p className="text-gray-600 text-center max-w-md">
          Our algorithm is analyzing your client preferences, availability, and optimization goals to create the perfect schedule.
        </p>
        <div className="mt-6 w-full max-w-md">
          <div className="bg-gray-200 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
          <p className="text-sm text-gray-500 mt-2 text-center">Analyzing client preferences and scheduling constraints...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Current Schedule Overview */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i data-feather="calendar" className="h-5 w-5 mr-2 text-indigo-600"></i>
          Current Schedule Overview
        </h3>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{currentSchedule.length}</div>
              <div className="text-sm text-gray-600">Sessions Scheduled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {currentSchedule.filter(s => s.status === 'confirmed').length}
              </div>
              <div className="text-sm text-gray-600">Confirmed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {currentSchedule.filter(s => s.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </div>
        </div>
      </div>

      {/* Optimization Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i data-feather="settings" className="h-5 w-5 mr-2 text-indigo-600"></i>
          Optimization Settings
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Settings */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Sessions Per Day
              </label>
              <select
                value={optimizationSettings.maxSessionsPerDay}
                onChange={(e) => setOptimizationSettings(prev => ({ 
                  ...prev, 
                  maxSessionsPerDay: parseInt(e.target.value) 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value={6}>6 sessions</option>
                <option value={8}>8 sessions</option>
                <option value={10}>10 sessions</option>
                <option value={12}>12 sessions</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Break Between Sessions (minutes)
              </label>
              <select
                value={optimizationSettings.minBreakBetweenSessions}
                onChange={(e) => setOptimizationSettings(prev => ({ 
                  ...prev, 
                  minBreakBetweenSessions: parseInt(e.target.value) 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Work Hours
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="time"
                  value={optimizationSettings.preferredWorkHours.start}
                  onChange={(e) => setOptimizationSettings(prev => ({
                    ...prev,
                    preferredWorkHours: { ...prev.preferredWorkHours, start: e.target.value }
                  }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="time"
                  value={optimizationSettings.preferredWorkHours.end}
                  onChange={(e) => setOptimizationSettings(prev => ({
                    ...prev,
                    preferredWorkHours: { ...prev.preferredWorkHours, end: e.target.value }
                  }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Priority
              </label>
              <select
                value={optimizationSettings.clientPriority}
                onChange={(e) => setOptimizationSettings(prev => ({ 
                  ...prev, 
                  clientPriority: e.target.value 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="premium_first">Premium Clients First</option>
                <option value="balanced">Balanced Approach</option>
                <option value="new_clients_first">New Clients First</option>
              </select>
            </div>
          </div>

          {/* Working Days */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Working Days
              </label>
              <div className="grid grid-cols-2 gap-2">
                {workingDays.map((day) => (
                  <button
                    key={day}
                    onClick={() => handleDayToggle(day)}
                    className={`p-2 text-sm rounded-md border transition-smooth ${
                      optimizationSettings.workingDays.includes(day)
                        ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Optimization Goals */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i data-feather="target" className="h-5 w-5 mr-2 text-indigo-600"></i>
          Optimization Goals
        </h3>
        
        <div className="space-y-4">
          {optimizationGoals.map((goal) => (
            <div
              key={goal.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-smooth ${
                optimizationSettings.optimizationGoals.includes(goal.id)
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => handleGoalToggle(goal.id)}
            >
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={optimizationSettings.optimizationGoals.includes(goal.id)}
                  onChange={() => handleGoalToggle(goal.id)}
                  className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{goal.label}</h4>
                  <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                </div>
                {optimizationSettings.optimizationGoals.includes(goal.id) && (
                  <i data-feather="check" className="h-5 w-5 text-indigo-600"></i>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Quick Actions</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-smooth text-left">
            <div className="flex items-center space-x-3">
              <i data-feather="shuffle" className="h-5 w-5 text-indigo-600"></i>
              <div>
                <div className="font-medium text-gray-900">Auto-Reschedule</div>
                <div className="text-sm text-gray-600">Automatically reschedule conflicts</div>
              </div>
            </div>
          </button>

          <button className="p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-smooth text-left">
            <div className="flex items-center space-x-3">
              <i data-feather="users" className="h-5 w-5 text-indigo-600"></i>
              <div>
                <div className="font-medium text-gray-900">Client Preferences</div>
                <div className="text-sm text-gray-600">View all client scheduling preferences</div>
              </div>
            </div>
          </button>

          <button className="p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-smooth text-left">
            <div className="flex items-center space-x-3">
              <i data-feather="bar-chart" className="h-5 w-5 text-indigo-600"></i>
              <div>
                <div className="font-medium text-gray-900">Schedule Analytics</div>
                <div className="text-sm text-gray-600">View optimization insights and trends</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}









