'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDOMErrorHandler } from '@/utils/domErrorHandler';
import { apiClient, trainerRegistration } from '@/lib/api';

interface TrainingType {
  value: string;
  label: string;
  description: string;
}

interface ProfileStatus {
  is_complete: boolean;
  completion_status: string;
  completion_date?: string;
  missing_fields: string[];
  completion_percentage: number;
}

interface RegistrationStep {
  step_number: number;
  step_name: string;
  is_completed: boolean;
  is_required: boolean;
  description: string;
}

interface RegistrationProgress {
  current_step: number;
  total_steps: number;
  completed_steps: number;
  steps: RegistrationStep[];
  can_proceed: boolean;
  next_step?: string;
}

const TRAINING_TYPES: TrainingType[] = [
  { value: 'Calisthenics', label: 'Calisthenics', description: 'Bodyweight exercises and movements' },
  { value: 'Gym Weights', label: 'Gym Weights', description: 'Traditional gym equipment training' },
  { value: 'Cardio', label: 'Cardio', description: 'Running, cycling, HIIT workouts' },
  { value: 'Yoga', label: 'Yoga', description: 'Hatha, Vinyasa, Power yoga' },
  { value: 'Pilates', label: 'Pilates', description: 'Core strengthening, flexibility' },
  { value: 'CrossFit', label: 'CrossFit', description: 'High-intensity functional training' },
  { value: 'Functional Training', label: 'Functional Training', description: 'Movement patterns, daily activities' },
  { value: 'Strength Training', label: 'Strength Training', description: 'Weight lifting, resistance training' },
  { value: 'Endurance Training', label: 'Endurance Training', description: 'Long-duration fitness training' },
  { value: 'Flexibility Training', label: 'Flexibility Training', description: 'Stretching, mobility work' },
  { value: 'Sports Specific', label: 'Sports Specific', description: 'Sport-specific conditioning' },
  { value: 'Rehabilitation', label: 'Rehabilitation', description: 'Injury recovery, physical therapy' },
  { value: 'Nutrition Coaching', label: 'Nutrition Coaching', description: 'Diet planning, nutrition guidance' },
  { value: 'Mental Health Coaching', label: 'Mental Health Coaching', description: 'Mental wellness, motivation' }
];

export default function CompleteRegistrationPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [domStable, setDomStable] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus | null>(null);
  const [progress, setProgress] = useState<RegistrationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    training_types: [] as string[],
    price_per_hour: '50',  // Default to $50/hour
    location_preference: 'specific_gym',  // Default to specific gym
    gym_name: '',
    gym_address: '',
    gym_city: '',
    gym_state: '',
    gym_zip_code: '',
    gym_phone: '',
    bio: ''
  });

  useDOMErrorHandler();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkDOMStability = () => {
      if (document.readyState === 'complete' && document.body) {
        setDomStable(true);
        setTimeout(() => {
          setMounted(true);
        }, 100);
      } else {
        setTimeout(checkDOMStability, 50);
      }
    };
    checkDOMStability();
  }, []);

  useEffect(() => {
    if (mounted && user && token && domStable) {
      // Add a small delay to ensure everything is properly initialized
      const timer = setTimeout(() => {
        fetchProfileStatus();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [mounted, user, token, domStable]);


  const fetchProfileStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching profile status...', { token: token ? 'present' : 'missing' });
      
      // Ensure we have a token before making requests
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      console.log('Fetching profile status and progress using API client...');
      
      // Use API client methods instead of direct fetch
      const [statusData, progressData] = await Promise.all([
        trainerRegistration.getProfileStatus(),
        trainerRegistration.getRegistrationProgress()
      ]);
      
      console.log('Profile status data:', statusData);
      console.log('Progress data:', progressData);
      
      setProfileStatus(statusData);
      setProgress(progressData);
      
      // If profile is complete, redirect to trainer dashboard
      if (statusData.is_complete) {
        router.push('/trainer');
        return;
      }
      
      // Set current step based on progress
      setCurrentStep(progressData.current_step);
    } catch (err: any) {
      console.error('Error fetching profile status:', err);
      
      // If API fails, set default values and continue
      console.log('API failed, using default values for profile completion');
      setProfileStatus({
        is_complete: false,
        completion_status: 'INCOMPLETE',
        missing_fields: ['training_types', 'price_per_hour', 'gym_name', 'gym_address', 'bio'],
        completion_percentage: 0
      });
      setProgress({
        current_step: 1,
        total_steps: 5,
        completed_steps: 0,
        steps: [
          { step_number: 1, step_name: 'Training Types', is_completed: false, is_required: true, description: 'Select your training specialties' },
          { step_number: 2, step_name: 'Pricing', is_completed: false, is_required: true, description: 'Set your hourly rate' },
          { step_number: 3, step_name: 'Gym Information', is_completed: false, is_required: true, description: 'Provide gym details' },
          { step_number: 4, step_name: 'Bio', is_completed: false, is_required: true, description: 'Write your professional bio' },
          { step_number: 5, step_name: 'Review', is_completed: false, is_required: true, description: 'Review and complete' }
        ],
        can_proceed: false,
        next_step: 'Training Types'
      });
      setCurrentStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleTrainingTypeChange = (type: string) => {
    // Add a small delay to prevent DOM manipulation race conditions
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        training_types: prev.training_types.includes(type)
          ? prev.training_types.filter(t => t !== type)
          : [...prev.training_types, type]
      }));
    }, 10);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCompleteRegistration = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!token) {
        throw new Error('No authentication token available. Please log in again.');
      }

      // Validate form data before submitting
      if (formData.training_types.length === 0) {
        setError('Please select at least one training type.');
        setLoading(false);
        return;
      }

      // Only validate gym fields when location preference is 'specific_gym'
      if (formData.location_preference === 'specific_gym' && formData.gym_address.length < 10) {
        setError('Gym address must be at least 10 characters long.');
        setLoading(false);
        return;
      }

      if (formData.bio.length < 100) {
        setError('Bio must be at least 100 characters long.');
        setLoading(false);
        return;
      }

      if (formData.price_per_hour <= 0) {
        setError('Please set a valid hourly rate.');
        setLoading(false);
        return;
      }

      console.log('Submitting registration with token:', token ? 'present' : 'missing');
      console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'none');
      
      // Test token validity first using API client
      try {
        await apiClient.getCurrentUser();
        console.log('Token is valid, proceeding with registration...');
      } catch (error) {
        console.error('Token validation failed:', error);
        setError('Your session has expired. Please log in again.');
        setTimeout(() => {
          router.push('/auth/signin');
        }, 2000);
        return;
      }

      // Prepare form data - only include gym fields when location preference is 'specific_gym'
      const submissionData = { ...formData };
      
      if (formData.location_preference === 'customer_choice') {
        // Remove gym fields when customer's choice is selected
        delete submissionData.gym_name;
        delete submissionData.gym_address;
        delete submissionData.gym_city;
        delete submissionData.gym_state;
        delete submissionData.gym_zip_code;
        delete submissionData.gym_phone;
      }

      const data = await trainerRegistration.completeRegistration(submissionData);

      if (data.success) {
        router.push('/trainer?completed=true');
      } else {
        setError(data.message || 'Failed to complete registration');
      }
    } catch (err: any) {
      if (err.message.includes('session has expired')) {
        setError(err.message);
      } else {
        setError('Error completing registration. Please try again.');
      }
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select Your Training Specialties
              </h3>
              <p className="text-gray-600 mb-6">
                Choose 1-5 training types that you specialize in. This helps clients find the right trainer for their needs.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TRAINING_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={`relative flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.training_types.includes(type.value)
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={formData.training_types.includes(type.value)}
                    onChange={() => handleTrainingTypeChange(type.value)}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{type.label}</div>
                    <div className="text-sm text-gray-500">{type.description}</div>
                  </div>
                  {formData.training_types.includes(type.value) && (
                    <div className="w-5 h-5 text-indigo-600">
                      <i data-feather="check" className="w-5 h-5"></i>
                    </div>
                  )}
                </label>
              ))}
            </div>
            
            {formData.training_types.length > 0 && (
              <div className="text-sm text-gray-600">
                Selected: {formData.training_types.length} training type(s)
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Set Your Hourly Rate
              </h3>
              <p className="text-gray-600 mb-6">
                Set your price per hour. Sessions are 1-2 hours long, so clients will pay based on the duration they choose.
              </p>
            </div>
            
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price per Hour (USD)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  min="20"
                  max="200"
                  step="5"
                  value={formData.price_per_hour}
                  onChange={(e) => handleInputChange('price_per_hour', e.target.value)}
                  className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="50"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Minimum: $20/hour, Maximum: $200/hour
              </p>
            </div>
            
            {formData.price_per_hour && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Pricing Examples:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>1 hour session: ${formData.price_per_hour}</li>
                  <li>1.5 hour session: ${(parseFloat(formData.price_per_hour) * 1.5).toFixed(2)}</li>
                  <li>2 hour session: ${(parseFloat(formData.price_per_hour) * 2).toFixed(2)}</li>
                </ul>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Training Location
              </h3>
              <p className="text-gray-600 mb-6">
                Set your primary training location. You can choose a specific gym or allow clients to choose the location.
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Location Preference
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="location_preference"
                    value="specific_gym"
                    checked={formData.location_preference === 'specific_gym'}
                    onChange={(e) => handleInputChange('location_preference', e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Specific Gym Location</div>
                    <div className="text-sm text-gray-600">Train at a specific gym or studio</div>
                  </div>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="location_preference"
                    value="customer_choice"
                    checked={formData.location_preference === 'customer_choice'}
                    onChange={(e) => handleInputChange('location_preference', e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Customer's Choice</div>
                    <div className="text-sm text-gray-600">Let clients choose the location (gym, home, online)</div>
                  </div>
                </label>
              </div>
            </div>
            
            {formData.location_preference === 'specific_gym' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gym Name *
                  </label>
                  <input
                    type="text"
                    value={formData.gym_name}
                    onChange={(e) => handleInputChange('gym_name', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., FitLife Gym"
                  />
                </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Address *
                </label>
                <input
                  type="text"
                  value={formData.gym_address}
                  onChange={(e) => handleInputChange('gym_address', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="123 Main Street, Suite 100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.gym_city}
                  onChange={(e) => handleInputChange('gym_city', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="New York"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  value={formData.gym_state}
                  onChange={(e) => handleInputChange('gym_state', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="NY"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  value={formData.gym_zip_code}
                  onChange={(e) => handleInputChange('gym_zip_code', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="10001"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={formData.gym_phone}
                  onChange={(e) => handleInputChange('gym_phone', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            )}
            
            {formData.location_preference === 'customer_choice' && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <i data-feather="info" className="h-5 w-5 text-blue-400"></i>
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-blue-900">Customer's Choice Location</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      Clients will be able to choose from gym, home, or online sessions when booking with you.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Write Your Bio
              </h3>
              <p className="text-gray-600 mb-6">
                Tell clients about yourself, your experience, and what makes you a great trainer. This helps build trust and attract the right clients.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Professional Bio *
              </label>
              <textarea
                rows={8}
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="I'm a certified personal trainer with 5+ years of experience helping clients achieve their fitness goals. I specialize in strength training and have helped over 100 clients transform their lives..."
              />
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-gray-500">
                  Minimum 100 characters
                </span>
                <span className={formData.bio.length >= 100 ? 'text-green-600' : 'text-red-600'}>
                  {formData.bio.length}/100
                </span>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">Bio Tips:</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Mention your certifications and experience</li>
                <li>• Highlight your specialties and training style</li>
                <li>• Share success stories or client testimonials</li>
                <li>• Explain what makes you different from other trainers</li>
              </ul>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Review & Complete
              </h3>
              <p className="text-gray-600 mb-6">
                Review your information and complete your trainer registration.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Training Types:</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.training_types.map(type => (
                    <span key={type} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                      {TRAINING_TYPES.find(t => t.value === type)?.label}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Hourly Rate:</h4>
                <p className="text-gray-700">${formData.price_per_hour}/hour</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Gym Location:</h4>
                <p className="text-gray-700">
                  {formData.gym_name}<br />
                  {formData.gym_address}<br />
                  {formData.gym_city}, {formData.gym_state} {formData.gym_zip_code}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Bio:</h4>
                <p className="text-gray-700 text-sm">{formData.bio}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return formData.training_types.length >= 1 && formData.training_types.length <= 5;
      case 2:
        return formData.price_per_hour && parseFloat(formData.price_per_hour) >= 20 && parseFloat(formData.price_per_hour) <= 200;
      case 3:
        if (formData.location_preference === 'customer_choice') {
          return true; // No gym fields required for customer's choice
        }
        return formData.gym_name && formData.gym_address && formData.gym_city && formData.gym_state && formData.gym_zip_code;
      case 4:
        return formData.bio.length >= 100;
      case 5:
        return true;
      default:
        return false;
    }
  };

  if (!mounted || !domStable) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading registration status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <i data-feather="alert-circle" className="w-12 h-12 mx-auto"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchProfileStatus}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Trainer Profile
          </h1>
          <p className="text-gray-600">
            Finish setting up your profile to start accepting bookings
          </p>
        </div>

        {/* Progress Bar */}
        {progress && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Step {currentStep} of {progress.total_steps}
              </span>
              <span className="text-sm text-gray-500">
                {progress.completed_steps}/{progress.total_steps} completed
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / progress.total_steps) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex space-x-4">
            {currentStep < 5 ? (
              <button
                onClick={handleNextStep}
                disabled={!canProceedToNext()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleCompleteRegistration}
                disabled={!canProceedToNext() || loading}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Completing...' : 'Complete Registration'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

