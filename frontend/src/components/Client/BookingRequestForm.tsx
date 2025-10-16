'use client';

import { useState, useEffect } from 'react';
import { bookingManagement } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface Trainer {
  id: number;
  name: string;
  specialty: string;
  rating: number;
  price_per_hour: number;
  training_types: string[];
  gym_name: string;
  gym_address: string;
}

interface AvailableSlot {
  id: number;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  date: string;
}

interface BookingRequestFormProps {
  trainer: Trainer;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TRAINING_TYPES = [
  'Calisthenics', 'Gym Weights', 'Cardio', 'Yoga', 'Pilates', 'CrossFit',
  'Functional Training', 'Strength Training', 'Endurance Training', 'Flexibility Training',
  'Sports Specific', 'Rehabilitation', 'Nutrition Coaching', 'Mental Health Coaching'
];

const LOCATION_TYPES = [
  { value: 'gym', label: 'Gym' },
  { value: 'home', label: 'Home' },
  { value: 'online', label: 'Online' }
];

export default function BookingRequestForm({ trainer, onSuccess, onCancel }: BookingRequestFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Form state
  const [sessionType, setSessionType] = useState('');
  const [duration, setDuration] = useState(60);
  const [locationType, setLocationType] = useState('gym');
  const [locationAddress, setLocationAddress] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // Calculate estimated cost
  const estimatedCost = trainer.price_per_hour * (duration / 60);

  useEffect(() => {
    // Set default location address
    if (trainer.gym_address) {
      setLocationAddress(trainer.gym_address);
    }
  }, [trainer]);

  useEffect(() => {
    // Load available slots when duration or date range changes
    if (sessionType && duration) {
      loadAvailableSlots();
    }
  }, [sessionType, duration, dateRange]);

  const loadAvailableSlots = async () => {
    if (!sessionType || !duration) return;
    
    setLoadingSlots(true);
    setError(null);
    
    try {
      const slots = await bookingManagement.getAvailableSlots(
        trainer.id,
        dateRange.start,
        dateRange.end,
        duration
      );
      
      setAvailableSlots(slots.available_slots || []);
    } catch (err: any) {
      console.error('Failed to load available slots:', err);
      setError('Failed to load available time slots');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const formatSlotTime = (slot: AvailableSlot) => {
    const startTime = new Date(slot.start_time);
    const endTime = new Date(slot.end_time);
    
    return {
      date: startTime.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: `${startTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })} - ${endTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionType) {
      setError('Please select a training type');
      return;
    }

    if (!selectedSlot) {
      setError('Please select an available time slot');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const requestData = {
        trainer_id: trainer.id,
        session_type: sessionType,
        duration_minutes: duration,
        location: locationType === 'gym' ? trainer.gym_name : locationAddress,
        special_requests: specialRequests,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        slot_id: selectedSlot.id
      };

      const result = await bookingManagement.createBookingRequest(requestData);
      
      setSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (err: any) {
      console.error('Booking request failed:', err);
      setError(err.message || 'Failed to send booking request');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Request Sent!</h3>
          <p className="text-gray-600 mb-4">
            Your booking request has been sent to {trainer.name}. 
            They will review it and get back to you within 24 hours.
          </p>
          <button
            onClick={onCancel}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Request Training Session</h2>
        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{trainer.name}</h3>
            <p className="text-sm text-gray-600">{trainer.specialty}</p>
            <p className="text-sm text-gray-600">${trainer.price_per_hour}/hour</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Training Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Training Type *
          </label>
          <select
            value={sessionType}
            onChange={(e) => setSessionType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="">Select training type</option>
            {TRAINING_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Duration
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={60}>60 minutes</option>
            <option value={90}>90 minutes</option>
            <option value={120}>120 minutes</option>
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location Type
          </label>
          <select
            value={locationType}
            onChange={(e) => setLocationType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {LOCATION_TYPES.map(loc => (
              <option key={loc.value} value={loc.value}>{loc.label}</option>
            ))}
          </select>
        </div>

        {locationType !== 'gym' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location Address
            </label>
            <input
              type="text"
              value={locationAddress}
              onChange={(e) => setLocationAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter address or meeting details"
            />
          </div>
        )}

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              min={getTodayDate()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              min={dateRange.start || getTodayDate()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Available Time Slots */}
        {sessionType && duration && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Time Slots
            </label>
            
            {loadingSlots ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading available slots...</p>
              </div>
            ) : availableSlots.length > 0 ? (
              <div className="grid gap-3 max-h-64 overflow-y-auto">
                {availableSlots.map((slot) => {
                  const formatted = formatSlotTime(slot);
                  const isSelected = selectedSlot?.id === slot.id;
                  
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-4 text-left border rounded-lg transition-colors ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{formatted.date}</div>
                      <div className="text-sm text-gray-600">{formatted.time}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {slot.duration_minutes} minutes • ${trainer.price_per_hour}/hour
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600 mb-2">No available time slots found</p>
                <p className="text-sm text-gray-500">
                  Try adjusting the date range or duration
                </p>
                <button
                  type="button"
                  onClick={loadAvailableSlots}
                  className="mt-3 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Refresh
                </button>
              </div>
            )}
          </div>
        )}

        {/* Special Requests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Special Requests
          </label>
          <textarea
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Any specific requirements or notes..."
          />
        </div>

        {/* Estimated Cost */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Estimated Cost:</span>
            <span className="text-lg font-semibold text-gray-900">${estimatedCost.toFixed(2)}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Based on {duration} minutes at ${trainer.price_per_hour}/hour
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending Request...' : 'Send Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
