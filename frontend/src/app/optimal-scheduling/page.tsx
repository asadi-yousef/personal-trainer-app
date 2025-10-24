'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth, ProtectedRoute } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { bookings, bookingManagement, trainers } from '../../lib/api';

interface SelectedTrainer {
  id: number;
  name: string;
  specialty: string;
  rating: number;
  price: number;
  price_per_hour?: number;
  training_types?: string[];
}

interface OptimalSlot {
  slot_id: number;
  date_str: string;
  start_time_str: string;
  end_time_str: string;
  score: number;
  priority: string;
  trainer_id?: number;
  trainer_name?: string;
  trainer_specialty?: string;
  trainer_rating?: number;
  trainer_price?: number;
}

function OptimalSchedulingPageContent() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [selectedTrainer, setSelectedTrainer] = useState<SelectedTrainer | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<OptimalSlot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [availableTrainers, setAvailableTrainers] = useState<any[]>([]);
  const [loadingTrainers, setLoadingTrainers] = useState(false);
  
  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Form state
  const [preferredTimes, setPreferredTimes] = useState<string[]>([]);
  const [avoidTimes, setAvoidTimes] = useState<string[]>([]);
  const [preferredDays, setPreferredDays] = useState<number[]>([]);
  const [allowWeekends, setAllowWeekends] = useState(true);
  const [allowEvenings, setAllowEvenings] = useState(true);
  const [duration, setDuration] = useState(60);
  const [earliestDate, setEarliestDate] = useState('');
  const [latestDate, setLatestDate] = useState('');
  const [selectedTrainingType, setSelectedTrainingType] = useState<string>('');
  
  // Enhanced optimization parameters
  const [maxBudget, setMaxBudget] = useState<number | null>(null);
  const [budgetPreference, setBudgetPreference] = useState<'low' | 'moderate' | 'premium'>('moderate');
  const [priceSensitivity, setPriceSensitivity] = useState(5);
  const [trainerExperienceMin, setTrainerExperienceMin] = useState<number | null>(null);
  const [trainerRatingMin, setTrainerRatingMin] = useState<number | null>(null);
  const [trainerSpecialtyPreference, setTrainerSpecialtyPreference] = useState<string>('');
  const [sessionIntensity, setSessionIntensity] = useState<'light' | 'moderate' | 'intense'>('moderate');
  const [equipmentPreference, setEquipmentPreference] = useState<string>('');

  // AI Assistant state
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [userProgress, setUserProgress] = useState({
    hasSelectedTimes: false,
    hasSetBudget: false,
    hasChosenTrainer: false,
    hasSetDuration: false
  });

  // Define fetchAvailableTrainers before using it
  const fetchAvailableTrainers = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (loadingTrainers) return;
    
    try {
      setLoadingTrainers(true);
      const response = await trainers.getAll();
      console.log('DEBUG: Fetched trainers:', response.trainers);
      response.trainers.forEach((trainer, index) => {
        console.log(`DEBUG: Trainer ${index}:`, {
          id: trainer.id,
          name: trainer.user_name,
          training_types: trainer.training_types
        });
      });
      setAvailableTrainers(response.trainers || []);
    } catch (err) {
      console.error('Failed to fetch trainers:', err);
      setAvailableTrainers([]); // Set empty array on error to prevent undefined issues
    } finally {
      setLoadingTrainers(false);
    }
  }, [loadingTrainers]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Load selected trainer from localStorage
    const storedTrainer = localStorage.getItem('selectedTrainer');
    if (storedTrainer) {
      setSelectedTrainer(JSON.parse(storedTrainer));
    }

    // Set default dates (next 2 weeks)
    const today = new Date();
    const twoWeeksLater = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    
    setEarliestDate(today.toISOString().split('T')[0]);
    setLatestDate(twoWeeksLater.toISOString().split('T')[0]);

    // Load available trainers
    fetchAvailableTrainers();
  }, [user, fetchAvailableTrainers]); // Include fetchAvailableTrainers in dependencies

  // Separate useEffect for progress updates
  useEffect(() => {
    if (user) {
      updateUserProgress();
      setAiSuggestions(getContextualSuggestions());
    }
  }, [preferredTimes, maxBudget, selectedTrainer, duration, user]);

  // AI Assistant functions
  const getContextualSuggestions = () => {
    const suggestions = [];
    
    // Check user progress and provide contextual help
    if (!userProgress.hasSelectedTimes && preferredTimes.length === 0) {
      suggestions.push("💡 Select 2-3 preferred times for better matches");
      suggestions.push("⏰ Morning slots (8-10 AM) often have better availability");
    }
    
    if (!userProgress.hasSetBudget && maxBudget === null) {
      suggestions.push("💰 Set a budget range to see more trainer options");
      suggestions.push("💡 Budget-friendly trainers start at $50/hour");
    }
    
    if (!userProgress.hasSetDuration) {
      suggestions.push("⏱️ 60-minute sessions are perfect for beginners");
      suggestions.push("💪 120-minute sessions provide more comprehensive training");
    }
    
    if (selectedTrainer === null && availableTrainers.length > 0) {
      suggestions.push("👨‍💼 Choose a trainer that matches your goals");
      suggestions.push("⭐ Check trainer ratings and specialties");
    }
    
    // Add general tips
    suggestions.push("📅 Try weekdays for more trainer availability");
    suggestions.push("🎯 Be specific about your fitness goals for better matches");
    
    return suggestions;
  };

  const getStepByStepGuidance = () => {
    const steps = [
      {
        title: "Choose Your Preferred Times",
        content: "Select 2-3 time slots that work best for you",
        action: "I'll help you find trainers available at these times",
        completed: userProgress.hasSelectedTimes
      },
      {
        title: "Set Your Budget",
        content: "Enter your budget range to see matching trainers",
        action: "I'll show you trainers within your budget",
        completed: userProgress.hasSetBudget
      },
      {
        title: "Select Session Duration",
        content: "Choose between 60 or 120-minute sessions",
        action: "I'll help you pick the right duration",
        completed: userProgress.hasSetDuration
      },
      {
        title: "Find Your Perfect Trainer",
        content: "Browse trainers that match your preferences",
        action: "I'll help you compare and choose",
        completed: userProgress.hasChosenTrainer
      }
    ];
    
    return steps;
  };

  const updateUserProgress = () => {
    setUserProgress({
      hasSelectedTimes: preferredTimes.length > 0,
      hasSetBudget: maxBudget !== null,
      hasChosenTrainer: selectedTrainer !== null,
      hasSetDuration: duration !== null
    });
  };

  const handleFindOptimalSchedule = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const bookingData = {
        session_type: 'Personal Training',
        preferred_times: preferredTimes,
        avoid_times: avoidTimes,
        preferred_days: preferredDays,
        allow_weekends: allowWeekends,
        allow_evenings: allowEvenings,
        duration_minutes: duration,
        earliest_date: new Date(earliestDate).toISOString(),
        latest_date: new Date(latestDate).toISOString(),
        trainer_id: selectedTrainer?.id || null,
        location: selectedTrainer ? `${selectedTrainer.name}'s Gym` : 'Gym',
        special_requests: 'Booked via optimal scheduling algorithm',
        // Enhanced optimization parameters
        trainer_experience_min: trainerExperienceMin,
        trainer_rating_min: trainerRatingMin,
        trainer_specialty_preference: trainerSpecialtyPreference || null,
        session_intensity: sessionIntensity,
        equipment_preference: equipmentPreference || null,
        // Budget optimization only applies when browsing all trainers
        ...(selectedTrainer ? {} : {
          max_budget_per_session: maxBudget,
          budget_preference: budgetPreference,
          price_sensitivity: priceSensitivity
        })
      };

      const response = await bookings.findOptimalSchedule(bookingData);
      
      if (response.suggested_slots && response.suggested_slots.length > 0) {
        setSuggestions(response.suggested_slots);
        // Store suggestions for the suggested times component
        localStorage.setItem('smartBookingSuggestions', JSON.stringify({
          suggestions: response.suggested_slots,
          confidence_score: response.confidence_score,
          message: response.message
        }));
        setError(null); // Clear any previous errors
      } else {
        // Handle empty results gracefully
        setSuggestions([]);
        setError(response.message || 'No optimal time slots found. Try adjusting your preferences.');
      }
    } catch (err: any) {
      console.error('Error finding optimal schedule:', err);
      
      // Handle "no slots found" as a normal case, not an error
      if (err.message && err.message.includes('No available slots found')) {
        setSuggestions([]);
        setError(err.message);
      } else {
        setError(err.message || 'Failed to find optimal schedule');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = async (slot: OptimalSlot) => {
    console.log('DEBUG: handleBookSlot called with slot:', slot);
    
    if (!user) {
      alert('Please log in to book sessions');
      return;
    }

    try {
      // Check for existing bookings that might conflict
      const slotStartTime = new Date(`${slot.date_str}T${slot.start_time_str}:00`);
      const slotEndTime = new Date(`${slot.date_str}T${slot.end_time_str}:00`);
      
      // Get user's existing bookings to check for conflicts
      const bookingsResponse = await bookingManagement.getMyBookings();
      const existingBookings = Array.isArray(bookingsResponse) ? bookingsResponse : (bookingsResponse?.bookings || []);
      
      // Check for time conflicts
      const hasConflict = existingBookings.some((booking: any) => {
        if (!booking.start_time || !booking.end_time || booking.status === 'cancelled') {
          return false;
        }
        
        const bookingStart = new Date(booking.start_time);
        const bookingEnd = new Date(booking.end_time);
        
        // Check if the new slot overlaps with existing booking
        return (slotStartTime < bookingEnd && slotEndTime > bookingStart);
      });
      
      if (hasConflict) {
        alert('This time slot conflicts with one of your existing bookings. Please choose a different time.');
        return;
      }

      // Reserve the time slot temporarily to prevent other clients from booking it
      try {
        console.log('DEBUG: Reserving time slot...');
        console.log('DEBUG: Token:', token);
        console.log('DEBUG: User:', user);
        const reservationResponse = await fetch('http://localhost:8000/api/booking-management/reserve-slot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            trainer_id: slot.trainer_id || selectedTrainer?.id,
            start_time: new Date(`${slot.date_str}T${slot.start_time_str}:00`).toISOString(),
            end_time: new Date(`${slot.date_str}T${slot.end_time_str}:00`).toISOString(),
            duration_minutes: duration
          })
        });

        if (!reservationResponse.ok) {
          const errorData = await reservationResponse.json();
          console.error('DEBUG: Reservation failed:', errorData);
          alert(`Time slot is no longer available: ${errorData.detail || 'Please try another time.'}`);
          return;
        }

        console.log('DEBUG: Time slot reserved successfully');
      } catch (error) {
        console.error('Failed to reserve time slot:', error);
        alert('Failed to reserve time slot. Please try again.');
        return;
      }

      // Create a booking request for the optimal slot
      const bookingRequestData = {
        trainer_id: slot.trainer_id || selectedTrainer?.id,
        session_type: selectedTrainingType || 'Personal Training',
        duration_minutes: duration,
        location: selectedTrainer ? `${selectedTrainer.name}'s Gym` : 'Gym',
        special_requests: 'Booked via optimal scheduling algorithm',
        // New format: use start_time and end_time instead of preferred dates
        start_time: new Date(`${slot.date_str}T${slot.start_time_str}:00`).toISOString(),
        end_time: new Date(`${slot.date_str}T${slot.end_time_str}:00`).toISOString(),
        training_type: selectedTrainingType || 'Personal Training',
        location_type: 'gym',
        location_address: selectedTrainer ? `${selectedTrainer.name}'s Gym` : 'Gym',
        allow_weekends: true,
        allow_evenings: true,
        is_recurring: false
      };

      console.log('DEBUG: Selected training type:', selectedTrainingType);
      console.log('DEBUG: Selected trainer:', selectedTrainer?.name);
      console.log('DEBUG: Creating booking request with data:', JSON.stringify(bookingRequestData, null, 2));
      console.log('DEBUG: About to call createBookingRequest API...');
      const result = await bookingManagement.createBookingRequest(bookingRequestData);
      console.log('DEBUG: Booking request created successfully, result:', result);
      alert('Booking request sent successfully! The trainer will review and confirm your booking.');
      
      // Clear suggestions and redirect to client dashboard
      setSuggestions([]);
      router.push('/client');
    } catch (err: any) {
      console.error('Error booking slot:', err);
      alert('Failed to send booking request: ' + (err.message || 'Unknown error'));
    }
  };

  const addTimePreference = (time: string, isPreferred: boolean = true) => {
    if (isPreferred) {
      if (!preferredTimes.includes(time)) {
        setPreferredTimes([...preferredTimes, time]);
      }
    } else {
      if (!avoidTimes.includes(time)) {
        setAvoidTimes([...avoidTimes, time]);
      }
    }
  };

  const removeTimePreference = (time: string, isPreferred: boolean = true) => {
    if (isPreferred) {
      setPreferredTimes(preferredTimes.filter(t => t !== time));
    } else {
      setAvoidTimes(avoidTimes.filter(t => t !== time));
    }
  };

  const addDayPreference = (day: number) => {
    if (!preferredDays.includes(day)) {
      setPreferredDays(prev => [...prev, day]);
    }
  };

  const removeDayPreference = (day: number) => {
    setPreferredDays(prev => prev.filter(d => d !== day));
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {selectedTrainer ? `Find Optimal Times with ${selectedTrainer.name}` : 'Browse All Optimal Times'}
          </h1>
          <p className="text-gray-600">
            {selectedTrainer 
              ? `Get the best available times for training with ${selectedTrainer.name}`
              : 'Find the best available times across all trainers based on your preferences'
            }
          </p>
        </div>

        {/* AI Assistant */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🤖</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Smart Scheduling Assistant</h3>
                  <p className="text-sm text-gray-600">I'll help you find the perfect training schedule</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiAssistant(!showAiAssistant)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {showAiAssistant ? 'Hide Tips' : 'Get Help'}
              </button>
            </div>
            
            {showAiAssistant && (
              <div className="space-y-4">
                {/* Step-by-step guidance */}
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <h4 className="font-semibold text-gray-900 mb-3">📋 Your Progress</h4>
                  <div className="space-y-2">
                    {getStepByStepGuidance().map((step, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                          step.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {step.completed ? '✓' : index + 1}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${step.completed ? 'text-green-700' : 'text-gray-700'}`}>
                            {step.title}
                          </p>
                          <p className="text-sm text-gray-600">{step.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Smart suggestions */}
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <h4 className="font-semibold text-gray-900 mb-3">💡 Smart Tips</h4>
                  <div className="space-y-2">
                    {aiSuggestions.slice(0, 4).map((suggestion, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <p className="text-sm text-gray-700">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selected Trainer Info */}
        {selectedTrainer && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Selected Trainer</h2>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{selectedTrainer.name}</h3>
                <p className="text-sm text-gray-600">{selectedTrainer.specialty}</p>
                <div className="flex items-center mt-2">
                  <div className="flex text-yellow-400 mr-2">
                    {'★'.repeat(Math.floor(selectedTrainer.rating))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {selectedTrainer.rating} • ${(selectedTrainer.price_per_hour || 0) > 0 ? selectedTrainer.price_per_hour : selectedTrainer.price}/hour
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('selectedTrainer');
                  setSelectedTrainer(null);
                }}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Browse All Trainers
              </button>
            </div>
            
            {/* Training Type Selection */}
            {selectedTrainer && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Training Type
                </label>
                <select
                  value={selectedTrainingType}
                  onChange={(e) => setSelectedTrainingType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Choose a training type...</option>
                  {selectedTrainer.training_types && selectedTrainer.training_types.length > 0 ? (
                    selectedTrainer.training_types.map((type, index) => (
                      <option key={index} value={type}>
                        {type}
                      </option>
                    ))
                  ) : (
                    <option value="Personal Training">Personal Training</option>
                  )}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Preferences Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Schedule Preferences</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trainer Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Trainer (Optional)
              </label>
              <select
                value={selectedTrainer?.id || ''}
                onChange={(e) => {
                  const trainerId = parseInt(e.target.value);
                  if (trainerId) {
                    const trainer = availableTrainers.find(t => t.id === trainerId);
                    if (trainer) {
                      setSelectedTrainer({
                        id: trainer.id,
                        name: trainer.user_name || 'Trainer',
                        specialty: trainer.specialty,
                        rating: trainer.rating || 0,
                        price: trainer.price_per_hour || trainer.price_per_session || 0,
                        price_per_hour: trainer.price_per_hour || trainer.price_per_session || 0,
                        training_types: trainer.training_types ? JSON.parse(trainer.training_types) : []
                      });
                    }
                  } else {
                    setSelectedTrainer(null);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={loadingTrainers}
              >
                <option value="">All Trainers</option>
                {availableTrainers.map((trainer) => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.user_name} - {trainer.specialty} (${trainer.price_per_hour || trainer.price_per_session}/hour)
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                {selectedTrainer 
                  ? `Finding optimal times with ${selectedTrainer.name}`
                  : 'Finding optimal times across all available trainers'
                }
              </p>
            </div>
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={earliestDate}
                  onChange={(e) => setEarliestDate(e.target.value)}
                  min={getTodayDate()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="date"
                  value={latestDate}
                  onChange={(e) => setLatestDate(e.target.value)}
                  min={earliestDate || getTodayDate()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Duration (minutes)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={60}>60 minutes</option>
                <option value={120}>120 minutes</option>
              </select>
            </div>

            {/* Preferred Times */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Times
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map(time => (
                  <button
                    key={time}
                    onClick={() => addTimePreference(time, true)}
                    className={`px-3 py-1 text-sm rounded-md border ${
                      preferredTimes.includes(time)
                        ? 'bg-indigo-100 border-indigo-300 text-indigo-800'
                        : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
              {preferredTimes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {preferredTimes.map(time => (
                    <span
                      key={time}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800"
                    >
                      {time}
                      <button
                        onClick={() => removeTimePreference(time, true)}
                        className="ml-1 text-indigo-600 hover:text-indigo-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Avoid Times */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Avoid Times
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {['08:00', '12:00', '13:00', '19:00', '20:00'].map(time => (
                  <button
                    key={time}
                    onClick={() => addTimePreference(time, false)}
                    className={`px-3 py-1 text-sm rounded-md border ${
                      avoidTimes.includes(time)
                        ? 'bg-red-100 border-red-300 text-red-800'
                        : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
              {avoidTimes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {avoidTimes.map(time => (
                    <span
                      key={time}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800"
                    >
                      {time}
                      <button
                        onClick={() => removeTimePreference(time, false)}
                        className="ml-1 text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Preferred Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Days of Week
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {[
                  { day: 0, name: 'Sunday' },
                  { day: 1, name: 'Monday' },
                  { day: 2, name: 'Tuesday' },
                  { day: 3, name: 'Wednesday' },
                  { day: 4, name: 'Thursday' },
                  { day: 5, name: 'Friday' },
                  { day: 6, name: 'Saturday' }
                ].map(({ day, name }) => (
                  <button
                    key={day}
                    onClick={() => addDayPreference(day)}
                    className={`px-3 py-1 text-sm rounded-md border ${
                      preferredDays.includes(day)
                        ? 'bg-green-100 border-green-300 text-green-800'
                        : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
              {preferredDays.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {preferredDays.map(day => {
                    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    return (
                      <span
                        key={day}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                      >
                        {dayNames[day]}
                        <button
                          onClick={() => removeDayPreference(day)}
                          className="ml-1 text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Options */}
            <div className="md:col-span-2">
              <div className="flex space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={allowWeekends}
                    onChange={(e) => setAllowWeekends(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Allow weekends</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={allowEvenings}
                    onChange={(e) => setAllowEvenings(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Allow evenings (after 6 PM)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Enhanced Optimization Parameters */}
          <div className="mt-8 space-y-6">
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Optimization</h3>
              
              {/* Pricing Preferences - Only show when browsing all trainers */}
              {!selectedTrainer && (
                <div className="bg-green-50 p-4 rounded-lg mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">💰 Pricing Preferences</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Budget optimization only applies when browsing all trainers. 
                    When selecting a specific trainer, all sessions are the same price.
                  </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Budget Limit (Optional)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <input
                        type="number"
                        placeholder="No limit"
                        value={maxBudget || ''}
                        onChange={(e) => setMaxBudget(e.target.value ? Number(e.target.value) : null)}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Budget Preference</label>
                    <select
                      value={budgetPreference}
                      onChange={(e) => setBudgetPreference(e.target.value as 'low' | 'moderate' | 'premium')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="low">Budget-Friendly</option>
                      <option value="moderate">Moderate</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Sensitivity: {priceSensitivity}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={priceSensitivity}
                    onChange={(e) => setPriceSensitivity(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Very Price Sensitive</span>
                    <span>Price Doesn't Matter</span>
                  </div>
                </div>
                </div>
              )}

              {/* Trainer Preferences */}
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">👨‍💼 Trainer Preferences</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Min Experience (Years)</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={trainerExperienceMin || ''}
                      onChange={(e) => setTrainerExperienceMin(e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Min Rating</label>
                    <select
                      value={trainerRatingMin || ''}
                      onChange={(e) => setTrainerRatingMin(e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Any Rating</option>
                      <option value="3">3+ Stars</option>
                      <option value="4">4+ Stars</option>
                      <option value="4.5">4.5+ Stars</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Specialty</label>
                    <select
                      value={trainerSpecialtyPreference}
                      onChange={(e) => setTrainerSpecialtyPreference(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Any Specialty</option>
                      <option value="Strength Training">Strength Training</option>
                      <option value="Weight Loss">Weight Loss</option>
                      <option value="Yoga">Yoga</option>
                      <option value="Cardio">Cardio</option>
                      <option value="CrossFit">CrossFit</option>
                      <option value="Functional Training">Functional Training</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Session Preferences */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="text-md font-medium text-gray-900 mb-3">🏃‍♂️ Session Preferences</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Session Intensity</label>
                    <select
                      value={sessionIntensity}
                      onChange={(e) => setSessionIntensity(e.target.value as 'light' | 'moderate' | 'intense')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="light">Light</option>
                      <option value="moderate">Moderate</option>
                      <option value="intense">Intense</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Preference</label>
                    <select
                      value={equipmentPreference}
                      onChange={(e) => setEquipmentPreference(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Any Equipment</option>
                      <option value="gym">Gym Equipment</option>
                      <option value="minimal">Minimal Equipment</option>
                      <option value="none">No Equipment</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Find Schedule Button */}
          <div className="mt-6">
            <button
              onClick={handleFindOptimalSchedule}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Finding Optimal Schedule...' : 'Find Optimal Schedule'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Optimal Schedule Suggestions</h2>
            <div className="space-y-4">
              {suggestions.map((slot, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {slot.date_str} at {slot.start_time_str} - {slot.end_time_str}
                          </h3>
                          {slot.trainer_name && (
                            <p className="text-sm text-gray-600">
                              with {slot.trainer_name} ({slot.trainer_specialty})
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            slot.priority === 'High Priority' ? 'bg-green-100 text-green-800' :
                            slot.priority === 'Medium Priority' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {slot.priority === 'High Priority' && '🔥 '}
                            {slot.priority === 'Medium Priority' && '⭐ '}
                            {slot.priority === 'Low Priority' && '📅 '}
                            {slot.priority || 'Medium Priority'}
                          </div>
                          {slot.trainer_rating && (
                            <div className="text-sm text-gray-600">
                              Rating: {slot.trainer_rating} ⭐
                            </div>
                          )}
                          {slot.trainer_price && (
                            <div className="text-sm text-gray-600">
                              ${slot.trainer_price}/hour
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleBookSlot(slot)}
                      className="ml-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                    >
                      Request This Slot
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Optimal scheduling page with role protection - only clients can access
 */
export default function OptimalSchedulingPage() {
  return (
    <ProtectedRoute requiredRole="client">
      <OptimalSchedulingPageContent />
    </ProtectedRoute>
  );
}
