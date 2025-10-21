'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

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

interface AvailableTimeSlot {
  start_time: string;
  end_time: string;
  duration_minutes: number;
  price_per_hour: number;
  total_cost: number;
  is_available: boolean;
  location_type: string;
}

interface BookingPriceCalculation {
  trainer_id: number;
  duration_minutes: number;
  training_type: string;
  location_type: string;
  base_price_per_hour: number;
  total_hours: number;
  base_cost: number;
  location_surcharge: number;
  training_type_multiplier: number;
  total_cost: number;
  currency: string;
}

const TRAINING_TYPES = [
  { value: 'Calisthenics', label: 'Calisthenics' },
  { value: 'Gym Weights', label: 'Gym Weights' },
  { value: 'Cardio', label: 'Cardio' },
  { value: 'Yoga', label: 'Yoga' },
  { value: 'Pilates', label: 'Pilates' },
  { value: 'CrossFit', label: 'CrossFit' },
  { value: 'Functional Training', label: 'Functional Training' },
  { value: 'Strength Training', label: 'Strength Training' },
  { value: 'Endurance Training', label: 'Endurance Training' },
  { value: 'Flexibility Training', label: 'Flexibility Training' },
  { value: 'Sports Specific', label: 'Sports Specific' },
  { value: 'Rehabilitation', label: 'Rehabilitation' },
  { value: 'Nutrition Coaching', label: 'Nutrition Coaching' },
  { value: 'Mental Health Coaching', label: 'Mental Health Coaching' }
];

const DURATION_OPTIONS = [
  { value: 60, label: '1 Hour', description: 'Standard session' },
  { value: 90, label: '1.5 Hours', description: 'Extended session' },
  { value: 120, label: '2 Hours', description: 'Intensive session' }
];

const LOCATION_TYPES = [
  { value: 'gym', label: 'At Gym', description: 'Train at the gym location' },
  { value: 'home', label: 'At Your Home', description: 'Trainer comes to you (+$10 surcharge)' }
];

export default function TimeBasedBooking() {
  const { user, token } = useAuth();
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [selectedTrainingType, setSelectedTrainingType] = useState('');
  const [selectedLocationType, setSelectedLocationType] = useState('gym');
  const [selectedStartTime, setSelectedStartTime] = useState('');
  const [selectedEndTime, setSelectedEndTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<AvailableTimeSlot[]>([]);
  const [priceCalculation, setPriceCalculation] = useState<BookingPriceCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [specialRequests, setSpecialRequests] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Get selected trainer from localStorage
      const storedTrainer = localStorage.getItem('selectedTrainer');
      if (storedTrainer) {
        try {
          const trainer = JSON.parse(storedTrainer);
          setSelectedTrainer(trainer);
          // Set first available training type as default
          if (trainer.training_types && trainer.training_types.length > 0) {
            setSelectedTrainingType(trainer.training_types[0]);
          }
        } catch (error) {
          console.warn('Failed to parse stored trainer data:', error);
        }
      }
    }
  }, [mounted]);


  const fetchAvailableSlots = async (date: string, duration: number) => {
    if (!selectedTrainer || !date) return;

    console.log('Fetching available slots with:', {
      trainer_id: selectedTrainer.id,
      date,
      duration,
      training_type: selectedTrainingType,
      location_type: selectedLocationType,
      start_time: selectedStartTime
    });

    setLoading(true);
    setError(null);

    try {
      let url = `http://localhost:8000/api/trainer-registration/available-slots?trainer_id=${selectedTrainer.id}&date=${date}&duration_minutes=${duration}&training_type=${selectedTrainingType}&location_type=${selectedLocationType}`;
      
      if (selectedStartTime) {
        url += `&start_time=${selectedStartTime}`;
      }

      console.log('API URL:', url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('API Response status:', response.status);

      if (response.ok) {
        const slots = await response.json();
        console.log('Available slots:', slots);
        setAvailableSlots(slots);
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        setError(errorData.detail || 'Failed to load available time slots');
        setAvailableSlots([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch available slots:', err);
      setError('Failed to load available time slots');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = async (startTime: string, endTime: string) => {
    if (!selectedTrainer || !selectedTrainingType) return;

    try {
      const response = await fetch('/api/trainer-registration/calculate-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          trainer_id: selectedTrainer.id,
          start_time: startTime,
          end_time: endTime,
          training_type: selectedTrainingType,
          location_type: selectedLocationType
        })
      });

      if (response.ok) {
        const calculation = await response.json();
        setPriceCalculation(calculation);
      }
    } catch (err) {
      console.error('Failed to calculate price:', err);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    fetchAvailableSlots(date, selectedDuration);
  };

  const handleDurationChange = (duration: number) => {
    setSelectedDuration(duration);
    if (selectedDate) {
      fetchAvailableSlots(selectedDate, duration);
    }
  };

  const handleStartTimeChange = (startTime: string) => {
    setSelectedStartTime(startTime);
    if (selectedDate) {
      fetchAvailableSlots(selectedDate, selectedDuration);
    }
  };

  const handleTrainingTypeChange = (trainingType: string) => {
    setSelectedTrainingType(trainingType);
    if (selectedDate) {
      fetchAvailableSlots(selectedDate, selectedDuration);
    }
  };

  const handleLocationTypeChange = (locationType: string) => {
    setSelectedLocationType(locationType);
    if (selectedDate) {
      fetchAvailableSlots(selectedDate, selectedDuration);
    }
  };

  const handleBookSlot = async (slot: AvailableTimeSlot) => {
    if (!user) {
      alert('Please log in to book sessions');
      return;
    }

    if (!selectedTrainer || !selectedTrainingType) {
      alert('Please select a training type');
      return;
    }

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          trainer_id: selectedTrainer.id,
          start_time: slot.start_time,
          end_time: slot.end_time,
          training_type: selectedTrainingType,
          location_type: selectedLocationType,
          location_address: selectedLocationType === 'home' ? 'Client\'s home address' : selectedTrainer.gym_address,
          special_requests: specialRequests
        })
      });

      if (response.ok) {
        setBookingSuccess(true);
        // Refresh available slots
        fetchAvailableSlots(selectedDate, selectedDuration);
        // Clear success message after 3 seconds
        setTimeout(() => setBookingSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        alert('Failed to book session: ' + (errorData.detail || 'Unknown error'));
      }
    } catch (err: any) {
      console.error('Failed to book slot:', err);
      alert('Failed to book session: ' + (err.message || 'Unknown error'));
    }
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    return Math.round(diffMs / (1000 * 60)); // Convert to minutes
  };

  const createBooking = async (startTime: string, endTime: string) => {
    if (!user || !token || !selectedTrainer || !selectedDate) {
      alert('Please log in to book sessions');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:8000/api/booking-requests/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          trainer_id: selectedTrainer.id,
          start_time: `${selectedDate}T${startTime}:00`,
          end_time: `${selectedDate}T${endTime}:00`,
          training_type: selectedTrainingType,
          location_type: selectedLocationType,
          location_address: selectedLocationType === 'home' ? 'Client\'s home address' : selectedTrainer.gym_address,
          special_requests: specialRequests
        })
      });

      if (response.ok) {
        setBookingSuccess(true);
        // Clear the form
        setSelectedStartTime('');
        setSelectedEndTime('');
        setSpecialRequests('');
        // Clear success message after 3 seconds
        setTimeout(() => setBookingSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to create booking');
      }
    } catch (err: any) {
      console.error('Failed to create booking:', err);
      setError('Failed to create booking: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAvailability = async () => {
    if (!selectedStartTime || !selectedEndTime || !selectedDate || !selectedTrainer || !selectedTrainingType) {
      setError('Please fill in all required fields');
      return;
    }

    const duration = calculateDuration(selectedStartTime, selectedEndTime);
    
    // Validate duration (1-2 hours as per requirements)
    if (duration < 60 || duration > 120) {
      setError('Session duration must be between 1 and 2 hours');
      return;
    }

    // Calculate price
    await calculatePrice(selectedStartTime, selectedEndTime);
    
    // Create booking directly
    await createBooking(selectedStartTime, selectedEndTime);
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
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Time-Based Booking</h2>
            <p className="text-gray-600">Book a session with {selectedTrainer.name} - Choose your preferred time and duration</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Trainer</div>
            <div className="font-semibold text-gray-900">{selectedTrainer.name}</div>
            <div className="text-sm text-gray-600">{selectedTrainer.specialty}</div>
            <div className="text-sm text-gray-600">${selectedTrainer.price_per_hour}/hour</div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {bookingSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <i data-feather="check-circle" className="h-5 w-5 text-green-600 mr-2"></i>
            <p className="text-green-800 font-medium">Booking created successfully!</p>
          </div>
          <p className="text-green-700 text-sm mt-1">Your session has been booked and is pending trainer confirmation.</p>
        </div>
      )}

      {/* Session Configuration */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i data-feather="settings" className="h-5 w-5 mr-2 text-indigo-600"></i>
          Session Configuration
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Duration Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Duration
            </label>
            <div className="space-y-2">
              {DURATION_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedDuration === option.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="duration"
                    value={option.value}
                    checked={selectedDuration === option.value}
                    onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Start Time Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Time
            </label>
            <input
              type="time"
              value={selectedStartTime}
              onChange={(e) => handleStartTimeChange(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              min="06:00"
              max="22:00"
            />
            <p className="text-xs text-gray-500 mt-1">Choose your preferred start time</p>
          </div>

          {/* Training Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Training Type
            </label>
            <select
              value={selectedTrainingType}
              onChange={(e) => handleTrainingTypeChange(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select training type</option>
              {TRAINING_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Location Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <div className="space-y-2">
              {LOCATION_TYPES.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedLocationType === option.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="location"
                    value={option.value}
                    checked={selectedLocationType === option.value}
                    onChange={(e) => handleLocationTypeChange(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

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

      {/* Custom Time Selection */}
      {selectedDate && selectedTrainingType && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i data-feather="clock" className="h-5 w-5 mr-2 text-indigo-600"></i>
            Select Your Preferred Time
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={selectedStartTime}
                onChange={(e) => setSelectedStartTime(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                min="06:00"
                max="22:00"
              />
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={selectedEndTime}
                onChange={(e) => setSelectedEndTime(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                min={selectedStartTime || "06:00"}
                max="23:00"
              />
            </div>
          </div>

          {/* Duration and Price Display */}
          {selectedStartTime && selectedEndTime && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Session Duration</div>
                  <div className="font-semibold text-gray-900">
                    {calculateDuration(selectedStartTime, selectedEndTime)} minutes
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Estimated Cost</div>
                  <div className="font-semibold text-green-600">
                    ${priceCalculation?.total_cost || 'Calculating...'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Special Requests */}
          {selectedStartTime && selectedEndTime && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Requests (Optional)
              </label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Any special requirements or notes for your trainer..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
              />
            </div>
          )}

          {/* Check Availability Button */}
          {selectedStartTime && selectedEndTime && (
            <div className="mt-4">
              <button
                onClick={handleCheckAvailability}
                disabled={loading}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Checking...' : 'Check Availability & Book'}
              </button>
            </div>
          )}
        </div>
      )}

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
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-8">
              <i data-feather="calendar-x" className="h-12 w-12 mx-auto text-gray-300 mb-4"></i>
              <p className="text-gray-500">No available time slots for this date and duration.</p>
              <p className="text-gray-400 text-sm mt-1">Try selecting a different date or duration.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableSlots.map((slot, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </div>
                      <div className="text-sm text-gray-600">{slot.duration_minutes} minutes</div>
                      <div className="text-sm font-medium text-green-600">${slot.total_cost}</div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      slot.is_available
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {slot.is_available ? 'Available' : 'Booked'}
                    </div>
                  </div>
                  
                  {slot.is_available ? (
                    <button
                      onClick={() => handleBookSlot(slot)}
                      className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      Book This Slot - ${slot.total_cost}
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

      {/* Special Requests */}
      {selectedDate && selectedTrainingType && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i data-feather="message-square" className="h-5 w-5 mr-2 text-indigo-600"></i>
            Special Requests (Optional)
          </h3>
          
          <textarea
            rows={3}
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Any special requests or notes for your trainer..."
          />
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <i data-feather="info" className="h-5 w-5 text-blue-600 mr-2 mt-0.5"></i>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">How Time-Based Booking Works</h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Choose your session duration (1-2 hours)</li>
              <li>• Select your preferred training type</li>
              <li>• Pick a date and available time slot</li>
              <li>• Sessions are priced per hour with automatic calculation</li>
              <li>• Home training includes a $10 surcharge</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

