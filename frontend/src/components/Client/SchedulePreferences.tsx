'use client';

import { useState, useEffect } from 'react';

/**
 * Schedule preferences component for customers
 */
export default function SchedulePreferences() {
  const [preferences, setPreferences] = useState({
    timeZone: 'UTC-5',
    workingHours: {
      start: '09:00',
      end: '17:00'
    },
    lunchBreak: {
      start: '12:00',
      end: '13:00'
    },
    notifications: {
      email: true,
      sms: false,
      push: true
    },
    schedulingRules: {
      minAdvanceNotice: 24, // hours
      maxAdvanceBooking: 30, // days
      allowWeekendSessions: true,
      allowEveningSessions: true
    }
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

  const timeZones = [
    'UTC-8 (Pacific)',
    'UTC-7 (Mountain)',
    'UTC-6 (Central)',
    'UTC-5 (Eastern)',
    'UTC+0 (GMT)',
    'UTC+1 (Central Europe)',
    'UTC+8 (Asia)'
  ];

  const handleSave = () => {
    console.log('Saving preferences:', preferences);
    // Here you would save to backend
  };

  return (
    <div className="space-y-8">
      {/* Time Zone & Working Hours */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i data-feather="clock" className="h-5 w-5 mr-2 text-indigo-600"></i>
          Time & Availability
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Zone
            </label>
            <select
              value={preferences.timeZone}
              onChange={(e) => setPreferences(prev => ({ ...prev, timeZone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {timeZones.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Working Hours
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="time"
                  value={preferences.workingHours.start}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    workingHours: { ...prev.workingHours, start: e.target.value }
                  }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="time"
                  value={preferences.workingHours.end}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    workingHours: { ...prev.workingHours, end: e.target.value }
                  }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lunch Break
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="time"
                  value={preferences.lunchBreak.start}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    lunchBreak: { ...prev.lunchBreak, start: e.target.value }
                  }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="time"
                  value={preferences.lunchBreak.end}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    lunchBreak: { ...prev.lunchBreak, end: e.target.value }
                  }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i data-feather="bell" className="h-5 w-5 mr-2 text-indigo-600"></i>
          Notification Preferences
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <i data-feather="mail" className="h-5 w-5 text-gray-600"></i>
              <div>
                <div className="font-medium text-gray-900">Email Notifications</div>
                <div className="text-sm text-gray-600">Receive session reminders and updates via email</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notifications.email}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, email: e.target.checked }
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <i data-feather="smartphone" className="h-5 w-5 text-gray-600"></i>
              <div>
                <div className="font-medium text-gray-900">SMS Notifications</div>
                <div className="text-sm text-gray-600">Receive text message reminders</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notifications.sms}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, sms: e.target.checked }
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <i data-feather="bell" className="h-5 w-5 text-gray-600"></i>
              <div>
                <div className="font-medium text-gray-900">Push Notifications</div>
                <div className="text-sm text-gray-600">Receive app notifications</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notifications.push}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, push: e.target.checked }
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Scheduling Rules */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i data-feather="settings" className="h-5 w-5 mr-2 text-indigo-600"></i>
          Scheduling Rules
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Advance Notice (hours)
            </label>
            <select
              value={preferences.schedulingRules.minAdvanceNotice}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                schedulingRules: { ...prev.schedulingRules, minAdvanceNotice: parseInt(e.target.value) }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value={1}>1 hour</option>
              <option value={2}>2 hours</option>
              <option value={6}>6 hours</option>
              <option value={12}>12 hours</option>
              <option value={24}>24 hours</option>
              <option value={48}>48 hours</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Advance Booking (days)
            </label>
            <select
              value={preferences.schedulingRules.maxAdvanceBooking}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                schedulingRules: { ...prev.schedulingRules, maxAdvanceBooking: parseInt(e.target.value) }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <i data-feather="calendar" className="h-5 w-5 text-gray-600"></i>
              <div>
                <div className="font-medium text-gray-900">Allow Weekend Sessions</div>
                <div className="text-sm text-gray-600">Book sessions on Saturdays and Sundays</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.schedulingRules.allowWeekendSessions}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  schedulingRules: { ...prev.schedulingRules, allowWeekendSessions: e.target.checked }
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <i data-feather="moon" className="h-5 w-5 text-gray-600"></i>
              <div>
                <div className="font-medium text-gray-900">Allow Evening Sessions</div>
                <div className="text-sm text-gray-600">Book sessions after 6 PM</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.schedulingRules.allowEveningSessions}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  schedulingRules: { ...prev.schedulingRules, allowEveningSessions: e.target.checked }
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus-ring transition-smooth"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
}









