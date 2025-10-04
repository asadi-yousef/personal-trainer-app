'use client';

import { useState, useEffect } from 'react';
import { availability } from '../../lib/api';

/**
 * Availability calendar component for trainer dashboard
 */
export default function AvailabilityCalendar() {
  const [trainerAvailability, setTrainerAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>('');

  // Fetch trainer availability
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setLoading(true);
        const availabilityData = await availability.getMyAvailability();
        setTrainerAvailability(availabilityData || []);
      } catch (error) {
        console.error('Failed to fetch availability:', error);
        setTrainerAvailability([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAvailability();
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

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hours = ['6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM'];
  const dayMap = {
    'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 
    'Friday': 5, 'Saturday': 6, 'Sunday': 0
  };
  
  // Process availability data from backend
  const availabilityData = trainerAvailability.reduce((acc: any, slot: any) => {
    const dayName = days[slot.day_of_week];
    if (!acc[dayName]) acc[dayName] = [];
    acc[dayName].push({
      start: slot.start_time,
      end: slot.end_time,
      id: slot.id
    });
    return acc;
  }, {});

  const handleAddAvailability = async (day: string, startTime: string, endTime: string) => {
    try {
      const dayOfWeek = dayMap[day as keyof typeof dayMap];
      await availability.create({
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        is_available: true
      });
      
      // Refresh availability data
      const availabilityData = await availability.getMyAvailability();
      setTrainerAvailability(availabilityData || []);
    } catch (error) {
      console.error('Failed to add availability:', error);
      alert('Failed to add availability slot');
    }
  };

  const handleRemoveAvailability = async (availabilityId: number) => {
    try {
      await availability.delete(availabilityId);
      
      // Refresh availability data
      const availabilityData = await availability.getMyAvailability();
      setTrainerAvailability(availabilityData || []);
    } catch (error) {
      console.error('Failed to remove availability:', error);
      alert('Failed to remove availability slot');
    }
  };

  const isAvailable = (day: string, hour: string) => {
    return availabilityData[day]?.some((slot: any) => 
      slot.start <= hour && slot.end > hour
    ) || false;
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">This Week's Availability</h3>
        <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium focus-ring rounded-md p-1">
          Edit Availability
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Days Header */}
          <div className="grid grid-cols-8 gap-1 mb-2">
            <div className="text-center text-sm font-medium text-gray-500 py-2"></div>
            {days.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Time Slots */}
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 gap-1 mb-1">
              <div className="text-sm text-gray-600 py-2 text-center">
                {hour}
              </div>
              {days.map((day) => (
                <div
                  key={`${day}-${hour}`}
                  className={`h-8 rounded border-2 flex items-center justify-center ${
                    isAvailable(day, hour)
                      ? 'bg-green-100 border-green-300'
                      : 'bg-gray-100 border-gray-200'
                  }`}
                >
                  {isAvailable(day, hour) && (
                    <i data-feather="check" className="h-3 w-3 text-green-600"></i>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
          <span className="text-gray-600">Available</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded mr-2"></div>
          <span className="text-gray-600">Unavailable</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex space-x-3 pt-4 border-t border-gray-200">
        <button className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-indigo-700 focus-ring transition-smooth">
          Set Recurring Hours
        </button>
        <button className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-50 focus-ring transition-smooth">
          Add Time Off
        </button>
      </div>
    </div>
  );
}





