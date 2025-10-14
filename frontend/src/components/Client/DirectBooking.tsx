'use client';

import { useState, useEffect } from 'react';
import { timeSlots, bookingRequests } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface TimeSlot {
  id: number;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_available: boolean;
  is_booked?: boolean;
}

interface Trainer {
  id: number;
  name: string;
  specialty: string;
  rating: number;
  price: number;
}

export default function DirectBooking() {
  const { user } = useAuth();
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Get selected trainer from localStorage
    const storedTrainer = localStorage.getItem('selectedTrainer');
    if (storedTrainer) {
      try {
        setSelectedTrainer(JSON.parse(storedTrainer));
      } catch (error) {
        console.warn('Failed to parse stored trainer data:', error);
      }
    }
  }, []);


  const fetchAvailableSlots = async (date: string) => {
    if (!selectedTrainer || !date) return;

    setLoading(true);
    setError(null);

    try {
      const response = await timeSlots.getAvailable(selectedTrainer.id, date, 60);
      console.log('API Response:', response); // Debug log
      
      // Extract available_slots from the response object
      const slots = response?.available_slots || [];
      setAvailableSlots(Array.isArray(slots) ? slots : []);
    } catch (err: any) {
      console.error('Failed to fetch available slots:', err);
      setError(err.message || 'Failed to load available time slots');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    fetchAvailableSlots(date);
  };

  const handleBookSlot = async (slot: TimeSlot) => {
    if (!user) {
      alert('Please log in to book sessions');
      return;
    }

    if (!selectedTrainer) {
      alert('No trainer selected');
      return;
    }

    try {
      // Create full datetime strings from the selected date and time
      const startDateTime = new Date(`${selectedDate}T${slot.start_time}:00`);
      const endDateTime = new Date(`${selectedDate}T${slot.end_time}:00`);
      
      // Create a booking request for the specific time slot
      const bookingRequest = {
        trainer_id: selectedTrainer.id,
        session_type: 'Personal Training',
        duration_minutes: slot.duration_minutes,
        location: 'Gym Studio',
        special_requests: 'Direct booking from available slots',
        preferred_start_date: startDateTime.toISOString(),
        preferred_end_date: endDateTime.toISOString(),
        preferred_times: [slot.start_time],
        allow_weekends: true,
        allow_evenings: true,
        is_recurring: false
      };

      await bookingRequests.create(bookingRequest);
      setBookingSuccess(true);
      
      // Refresh available slots
      fetchAvailableSlots(selectedDate);
      
      // Clear success message after 3 seconds
      setTimeout(() => setBookingSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to book slot:', err);
      alert('Failed to book session: ' + (err.message || 'Unknown error'));
    }
  };

  const formatTime = (timeString: string) => {
    // Handle both time strings (like "10:00") and datetime strings
    if (timeString.includes('T') || timeString.includes(' ')) {
      return new Date(timeString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } else {
      // Handle time strings like "10:00"
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getNextWeekDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) { // Next 2 weeks
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Use local date to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      dates.push({
        date: dateString,
        display: date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        })
      });
    }
    
    return dates;
  };

  // Show loading state until component is mounted
  if (!mounted) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h3>
        <p className="text-gray-600">Preparing booking interface...</p>
      </div>
    );
  }

  if (!selectedTrainer) {
    return (
      <div className="text-center py-16">
        <i data-feather="user-x" className="h-16 w-16 mx-auto text-gray-300 mb-4"></i>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Trainer Selected</h3>
        <p className="text-gray-600 mb-4">Please select a trainer first to view available time slots.</p>
        <button
          onClick={() => window.location.href = '/trainers'}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Browse Trainers
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Direct Booking</h2>
            <p className="text-gray-600">Book any available time slot with {selectedTrainer.name}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Trainer</div>
            <div className="font-semibold text-gray-900">{selectedTrainer.name}</div>
            <div className="text-sm text-gray-600">{selectedTrainer.specialty}</div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {bookingSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <i data-feather="check-circle" className="h-5 w-5 text-green-600 mr-2"></i>
            <p className="text-green-800 font-medium">Booking request sent successfully!</p>
          </div>
          <p className="text-green-700 text-sm mt-1">The trainer will review and confirm your booking.</p>
        </div>
      )}

      {/* Date Selection */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i data-feather="calendar" className="h-5 w-5 mr-2 text-indigo-600"></i>
          Select Date
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {getNextWeekDates().map(({ date, display }) => (
            <button
              key={date}
              onClick={() => handleDateChange(date)}
              className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                selectedDate === date
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
              }`}
            >
              {display}
            </button>
          ))}
        </div>
      </div>

      {/* Available Time Slots */}
      {selectedDate && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i data-feather="clock" className="h-5 w-5 mr-2 text-indigo-600"></i>
            Available Time Slots - {formatDate(selectedDate)}
          </h3>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Loading available slots...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <i data-feather="alert-circle" className="h-5 w-5 text-red-600 mr-2"></i>
                <p className="text-red-800 font-medium">Error loading time slots</p>
              </div>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          ) : !Array.isArray(availableSlots) || availableSlots.length === 0 ? (
            <div className="text-center py-8">
              <i data-feather="calendar-x" className="h-12 w-12 mx-auto text-gray-300 mb-4"></i>
              <p className="text-gray-500">No available time slots for this date.</p>
              <p className="text-gray-400 text-sm mt-1">Try selecting a different date.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.isArray(availableSlots) && availableSlots.map((slot) => (
                <div key={slot.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </div>
                      <div className="text-sm text-gray-600">{slot.duration_minutes} minutes</div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      slot.is_available && !slot.is_booked
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {slot.is_available && !slot.is_booked ? 'Available' : 'Booked'}
                    </div>
                  </div>
                  
                  {slot.is_available && !slot.is_booked ? (
                    <button
                      onClick={() => handleBookSlot(slot)}
                      className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      Book This Slot
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-lg cursor-not-allowed text-sm font-medium"
                    >
                      Not Available
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <i data-feather="info" className="h-5 w-5 text-blue-600 mr-2 mt-0.5"></i>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">How Direct Booking Works</h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Select a date to see all available time slots</li>
              <li>• Click "Book This Slot" to send a booking request</li>
              <li>• The trainer will review and confirm your booking</li>
              <li>• You'll receive a notification once confirmed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

