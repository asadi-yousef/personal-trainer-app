'use client';

import { useState, useEffect } from 'react';
import { availability } from '../../lib/api';

interface AvailabilitySlot {
  id?: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export default function AvailabilityManager() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newSlot, setNewSlot] = useState<Partial<AvailabilitySlot>>({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '10:00',
    is_available: true
  });

  const days = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  // Fetch availability slots
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        setLoading(true);
        const data = await availability.getMyAvailability();
        setSlots(data || []);
      } catch (error) {
        console.error('Failed to fetch availability:', error);
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSlots();
  }, []);

  const handleAddSlot = async () => {
    try {
      const createdSlot = await availability.create(newSlot);
      setSlots([...slots, createdSlot]);
      setNewSlot({
        day_of_week: 1,
        start_time: '09:00',
        end_time: '10:00',
        is_available: true
      });
      setIsAdding(false);
    } catch (error) {
      console.error('Failed to add slot:', error);
      alert('Failed to add availability slot');
    }
  };

  const handleDeleteSlot = async (slotId: number) => {
    if (!confirm('Are you sure you want to delete this availability slot?')) return;
    
    try {
      await availability.delete(slotId);
      setSlots(slots.filter(slot => slot.id !== slotId));
    } catch (error) {
      console.error('Failed to delete slot:', error);
      alert('Failed to delete availability slot');
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDayName = (dayOfWeek: number) => {
    return days.find(d => d.value === dayOfWeek)?.label || '';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Manage Availability</h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {isAdding ? 'Cancel' : 'Add Time Slot'}
        </button>
      </div>

      {/* Add New Slot Form */}
      {isAdding && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-4">Add New Availability Slot</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
              <select
                value={newSlot.day_of_week}
                onChange={(e) => setNewSlot({ ...newSlot, day_of_week: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {days.map(day => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={newSlot.start_time}
                onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={newSlot.end_time}
                onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddSlot}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Add Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Current Availability Slots */}
      <div className="bg-white rounded-lg border">
        <div className="px-4 py-3 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">Current Availability</h4>
        </div>
        <div className="divide-y divide-gray-200">
          {slots.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No availability slots set. Add your first time slot above.
            </div>
          ) : (
            slots.map((slot) => (
              <div key={slot.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-24">
                    <span className="font-medium text-gray-900">{getDayName(slot.day_of_week)}</span>
                  </div>
                  <div className="text-gray-600">
                    {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      slot.is_available 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {slot.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteSlot(slot.id!)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Summary */}
      {slots.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Availability Summary</h4>
          <p className="text-blue-800 text-sm">
            You have {slots.length} availability slot{slots.length !== 1 ? 's' : ''} set across {new Set(slots.map(s => s.day_of_week)).size} day{new Set(slots.map(s => s.day_of_week)).size !== 1 ? 's' : ''}.
          </p>
        </div>
      )}
    </div>
  );
}





