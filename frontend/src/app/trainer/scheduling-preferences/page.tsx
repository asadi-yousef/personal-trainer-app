'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import PageHeader from '../../../components/PageHeader';
import { ProtectedRoute, useAuth } from '../../../contexts/AuthContext';
import { schedulingPreferences } from '../../../lib/api';

const TIME_BLOCKS = [
  { value: 'morning', label: 'Morning (6AM - 12PM)' },
  { value: 'afternoon', label: 'Afternoon (12PM - 6PM)' },
  { value: 'evening', label: 'Evening (6PM - 10PM)' }
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Monday' },
  { value: 1, label: 'Tuesday' },
  { value: 2, label: 'Wednesday' },
  { value: 3, label: 'Thursday' },
  { value: 4, label: 'Friday' },
  { value: 5, label: 'Saturday' },
  { value: 6, label: 'Sunday' }
];

function SchedulingPreferencesContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();

  const [preferences, setPreferences] = useState({
    max_sessions_per_day: 8,
    min_break_minutes: 15,
    prefer_consecutive_sessions: true,
    work_start_time: '08:00',
    work_end_time: '18:00',
    days_off: [] as number[],
    preferred_time_blocks: ['morning', 'afternoon'] as string[],
    prioritize_recurring_clients: true,
    prioritize_high_value_sessions: false
  });

  // Initialize feather icons
  useEffect(() => {
    const initFeather = async () => {
      try {
        const feather = (await import('feather-icons')).default;
        feather.replace();
      } catch (error) {
        console.error('Failed to load feather icons:', error);
      }
    };
    initFeather();
  }, [success, error]);

  // Load preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setLoading(true);
        const data = await schedulingPreferences.get();
        setPreferences({
          max_sessions_per_day: data.max_sessions_per_day || 8,
          min_break_minutes: data.min_break_minutes || 15,
          prefer_consecutive_sessions: data.prefer_consecutive_sessions !== false,
          work_start_time: data.work_start_time || '08:00',
          work_end_time: data.work_end_time || '18:00',
          days_off: data.days_off || [],
          preferred_time_blocks: data.preferred_time_blocks || ['morning', 'afternoon'],
          prioritize_recurring_clients: data.prioritize_recurring_clients !== false,
          prioritize_high_value_sessions: data.prioritize_high_value_sessions || false
        });
      } catch (err: any) {
        console.error('Error loading preferences:', err);
        setError('Failed to load preferences');
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await schedulingPreferences.update(preferences);

      setSuccess('Scheduling preferences updated successfully! The optimal schedule algorithm will now use your preferences.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset to default preferences?')) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const data = await schedulingPreferences.reset();
      setPreferences({
        max_sessions_per_day: data.max_sessions_per_day,
        min_break_minutes: data.min_break_minutes,
        prefer_consecutive_sessions: data.prefer_consecutive_sessions,
        work_start_time: data.work_start_time,
        work_end_time: data.work_end_time,
        days_off: data.days_off,
        preferred_time_blocks: data.preferred_time_blocks,
        prioritize_recurring_clients: data.prioritize_recurring_clients,
        prioritize_high_value_sessions: data.prioritize_high_value_sessions
      });

      setSuccess('Preferences reset to defaults!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset preferences');
    } finally {
      setSaving(false);
    }
  };

  const toggleTimeBlock = (block: string) => {
    setPreferences(prev => ({
      ...prev,
      preferred_time_blocks: prev.preferred_time_blocks.includes(block)
        ? prev.preferred_time_blocks.filter(b => b !== block)
        : [...prev.preferred_time_blocks, block]
    }));
  };

  const toggleDayOff = (day: number) => {
    setPreferences(prev => {
      const isCurrentlyOff = prev.days_off.includes(day);
      const newDaysOff = isCurrentlyOff
        ? prev.days_off.filter(d => d !== day)
        : [...prev.days_off, day];
      
      // Prevent marking all 7 days as off
      if (newDaysOff.length >= 7) {
        setError('You cannot mark all days as off. You must work at least one day.');
        setTimeout(() => setError(''), 3000);
        return prev;
      }
      
      return {
        ...prev,
        days_off: newDaysOff
      };
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={`main-content transition-all duration-300 ${sidebarCollapsed ? 'content-collapsed' : 'content-expanded'}`}>
        <PageHeader user={user} />

        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Scheduling Preferences</h1>
            <p className="text-gray-600 mt-2">
              Configure how the optimal schedule algorithm works for you
            </p>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <i data-feather="check-circle" className="h-5 w-5 text-green-500 mr-2"></i>
                <p className="text-green-700">{success}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <i data-feather="alert-circle" className="h-5 w-5 text-red-500 mr-2"></i>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              {/* Session Constraints */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Session Constraints</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Sessions Per Day
                    </label>
                    <input
                      type="number"
                      value={preferences.max_sessions_per_day}
                      onChange={(e) => setPreferences({ ...preferences, max_sessions_per_day: parseInt(e.target.value) || 1 })}
                      min="1"
                      max="15"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      The algorithm won't schedule more than this many sessions in a single day
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Break Between Sessions (minutes)
                    </label>
                    <input
                      type="number"
                      value={preferences.min_break_minutes}
                      onChange={(e) => setPreferences({ ...preferences, min_break_minutes: parseInt(e.target.value) || 0 })}
                      min="0"
                      max="60"
                      step="5"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Time needed between sessions for setup/rest
                    </p>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.prefer_consecutive_sessions}
                      onChange={(e) => setPreferences({ ...preferences, prefer_consecutive_sessions: e.target.checked })}
                      className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-3 text-sm font-medium text-gray-700">
                      Prefer Consecutive Sessions (back-to-back)
                    </label>
                  </div>
                </div>
              </div>

              {/* Working Hours */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Working Hours</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Work Start Time
                    </label>
                    <input
                      type="time"
                      value={preferences.work_start_time}
                      onChange={(e) => setPreferences({ ...preferences, work_start_time: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Work End Time
                    </label>
                    <input
                      type="time"
                      value={preferences.work_end_time}
                      onChange={(e) => setPreferences({ ...preferences, work_end_time: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Days Off */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Days Off</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Select the days you don't want to work (you must work at least 1 day)
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDayOff(day.value)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        preferences.days_off.includes(day.value)
                          ? 'bg-red-100 text-red-700 border-2 border-red-300'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred Time Blocks */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Preferred Time Blocks</h2>
                <p className="text-sm text-gray-600 mb-4">
                  When do you prefer to schedule sessions?
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {TIME_BLOCKS.map((block) => (
                    <button
                      key={block.value}
                      type="button"
                      onClick={() => toggleTimeBlock(block.value)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        preferences.preferred_time_blocks.includes(block.value)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {block.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Settings */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Priority Settings</h2>
                <p className="text-sm text-gray-600 mb-4">
                  How should the algorithm prioritize different types of sessions?
                </p>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      checked={preferences.prioritize_recurring_clients}
                      onChange={(e) => setPreferences({ ...preferences, prioritize_recurring_clients: e.target.checked })}
                      className="mt-1 h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <div className="ml-3">
                      <label className="text-sm font-medium text-gray-700">
                        Prioritize Recurring Clients
                      </label>
                      <p className="text-xs text-gray-500">
                        Give higher priority to recurring client bookings
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      checked={preferences.prioritize_high_value_sessions}
                      onChange={(e) => setPreferences({ ...preferences, prioritize_high_value_sessions: e.target.checked })}
                      className="mt-1 h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <div className="ml-3">
                      <label className="text-sm font-medium text-gray-700">
                        Prioritize High-Value Sessions
                      </label>
                      <p className="text-xs text-gray-500">
                        Schedule longer/more expensive sessions first
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Preferences'}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={saving}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Reset to Defaults
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SchedulingPreferencesPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <SchedulingPreferencesContent />
    </ProtectedRoute>
  );
}

