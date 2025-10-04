'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { timeSlots } from '../../lib/api';

interface TimeSlot {
  id: number;
  trainer_id: number;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_available: boolean;
  is_booked: boolean;
  booking_id?: number;
}

interface BulkCreateData {
  trainer_id: number;
  start_date: string;
  end_date: string;
  duration_minutes: number;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export default function TimeSlotManager() {
  const { user } = useAuth();
  const [timeSlotsData, setTimeSlotsData] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBulkCreate, setShowBulkCreate] = useState(false);
  
  // Bulk create form state
  const [bulkData, setBulkData] = useState<BulkCreateData>({
    trainer_id: 0,
    start_date: '',
    end_date: '',
    duration_minutes: 60,
    days_of_week: [0, 1, 2, 3, 4], // Monday to Friday
    start_time: '09:00',
    end_time: '18:00',
    is_available: true
  });

  useEffect(() => {
    if (user && user.role === 'trainer') {
      // Get trainer ID from user profile
      // For now, we'll use a placeholder - in real app, get from trainer profile
      bulkData.trainer_id = 1; // This should come from the trainer profile
      loadTimeSlots();
    }
  }, [user]);

  const loadTimeSlots = async () => {
    if (!user || user.role !== 'trainer') return;

    setLoading(true);
    setError(null);

    try {
      // Get time slots for the next 2 weeks
      const today = new Date();
      const twoWeeksLater = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
      
      const startDate = today.toISOString().split('T')[0];
      const endDate = twoWeeksLater.toISOString().split('T')[0];
      
      const slots = await timeSlots.getTrainerSlots(bulkData.trainer_id, startDate, endDate);
      setTimeSlotsData(slots);
    } catch (err: any) {
      console.error('Error loading time slots:', err);
      setError(err.message || 'Failed to load time slots');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkCreate = async () => {
    if (!user || user.role !== 'trainer') return;

    setLoading(true);
    setError(null);

    try {
      await timeSlots.createBulk(bulkData);
      setShowBulkCreate(false);
      await loadTimeSlots(); // Reload slots
      alert('Time slots created successfully!');
    } catch (err: any) {
      console.error('Error creating time slots:', err);
      setError(err.message || 'Failed to create time slots');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (slotId: number, isAvailable: boolean) => {
    try {
      await timeSlots.update(slotId, { is_available: !isAvailable });
      await loadTimeSlots(); // Reload slots
    } catch (err: any) {
      console.error('Error updating time slot:', err);
      alert('Failed to update time slot: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDeleteSlot = async (slotId: number) => {
    if (!confirm('Are you sure you want to delete this time slot?')) return;

    try {
      await timeSlots.delete(slotId);
      await loadTimeSlots(); // Reload slots
    } catch (err: any) {
      console.error('Error deleting time slot:', err);
      alert('Failed to delete time slot: ' + (err.message || 'Unknown error'));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  if (!user || user.role !== 'trainer') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">This page is only available for trainers.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Time Slot Management</h1>
        <p className="text-gray-600">Manage your available training time slots</p>
      </div>

      {/* Bulk Create Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Bulk Create Time Slots</h2>
          <button
            onClick={() => setShowBulkCreate(!showBulkCreate)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            {showBulkCreate ? 'Cancel' : 'Create Slots'}
          </button>
        </div>

        {showBulkCreate && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={bulkData.start_date}
                onChange={(e) => setBulkData({ ...bulkData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={bulkData.end_date}
                onChange={(e) => setBulkData({ ...bulkData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={bulkData.start_time}
                onChange={(e) => setBulkData({ ...bulkData, start_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={bulkData.end_time}
                onChange={(e) => setBulkData({ ...bulkData, end_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <select
                value={bulkData.duration_minutes}
                onChange={(e) => setBulkData({ ...bulkData, duration_minutes: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
                <option value={120}>120 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Days of Week
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 0, label: 'Mon' },
                  { value: 1, label: 'Tue' },
                  { value: 2, label: 'Wed' },
                  { value: 3, label: 'Thu' },
                  { value: 4, label: 'Fri' },
                  { value: 5, label: 'Sat' },
                  { value: 6, label: 'Sun' }
                ].map(day => (
                  <label key={day.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={bulkData.days_of_week.includes(day.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBulkData({
                            ...bulkData,
                            days_of_week: [...bulkData.days_of_week, day.value]
                          });
                        } else {
                          setBulkData({
                            ...bulkData,
                            days_of_week: bulkData.days_of_week.filter(d => d !== day.value)
                          });
                        }
                      }}
                      className="mr-1"
                    />
                    <span className="text-sm">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <button
                onClick={handleBulkCreate}
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Time Slots'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Time Slots List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Your Time Slots</h2>
          <button
            onClick={loadTimeSlots}
            disabled={loading}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading time slots...</p>
          </div>
        ) : timeSlotsData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No time slots found. Create some using the bulk create form above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timeSlotsData.map((slot) => (
                  <tr key={slot.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(slot.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {slot.duration_minutes} min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {slot.is_booked ? (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          Booked
                        </span>
                      ) : slot.is_available ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Available
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          Unavailable
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!slot.is_booked && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleToggleAvailability(slot.id, slot.is_available)}
                            className={`px-3 py-1 text-xs rounded-md ${
                              slot.is_available
                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                          >
                            {slot.is_available ? 'Make Unavailable' : 'Make Available'}
                          </button>
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
