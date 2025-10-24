'use client';

import { useEffect, useState } from 'react';
import { Trainer } from '../../lib/data';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface TrainerCardProps {
  trainer: Trainer;
}

// Helper function to map API trainer data to component format
const mapApiTrainerToComponent = (apiTrainer: any) => {
  // Parse training types from JSON string
  let trainingTypes = [];
  if (apiTrainer.training_types) {
    try {
      trainingTypes = typeof apiTrainer.training_types === 'string' 
        ? JSON.parse(apiTrainer.training_types) 
        : apiTrainer.training_types;
    } catch (e) {
      console.warn('Failed to parse training types:', e);
      trainingTypes = [];
    }
  }

  // Parse availability from JSON string
  let availability = ['Flexible schedule'];
  if (apiTrainer.availability) {
    try {
      availability = typeof apiTrainer.availability === 'string' 
        ? JSON.parse(apiTrainer.availability) 
        : apiTrainer.availability;
    } catch (e) {
      console.warn('Failed to parse availability:', e);
    }
  }

  return {
    id: apiTrainer.id,
    name: apiTrainer.user_name || 'Unknown Trainer',
    avatar: apiTrainer.user_avatar || 'https://i.pravatar.cc/200',
    cover: apiTrainer.cover_image || 'https://picsum.photos/400/300',
    specialty: apiTrainer.specialty,
    rating: apiTrainer.rating || 0,
    reviews: apiTrainer.reviews_count || 0,
    price: apiTrainer.price_per_hour || apiTrainer.price_per_session || 0,
    pricePerSession: apiTrainer.price_per_session || 0,
    pricePerHour: apiTrainer.price_per_hour || 0,
    blurb: apiTrainer.bio || 'No description available',
    availability,
    trainingTypes,
    // Gym information
    gymName: apiTrainer.location_preference === 'customer_choice' ? "Customer's choice" : (apiTrainer.gym_name || 'Gym'),
    gymAddress: apiTrainer.gym_address,
    gymCity: apiTrainer.gym_city,
    gymState: apiTrainer.gym_state,
    gymZipCode: apiTrainer.gym_zip_code,
    gymPhone: apiTrainer.gym_phone,
    // Profile completion
    profileComplete: apiTrainer.profile_completion_status === 'complete',
    experienceYears: apiTrainer.experience_years || 0,
    certifications: apiTrainer.certifications
  };
};

/**
 * Trainer card component displaying trainer information
 */
export default function TrainerCard({ trainer }: TrainerCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isBooking, setIsBooking] = useState(false);
  
  // Map API data to component format
  const mappedTrainer = mapApiTrainerToComponent(trainer);
  

  const getSpecialtyColor = (specialty: string) => {
    const colors = {
      'Strength Training': 'bg-red-100 text-red-800',
      'Weight Loss': 'bg-green-100 text-green-800',
      'Yoga': 'bg-purple-100 text-purple-800',
      'Rehabilitation': 'bg-blue-100 text-blue-800',
      'Sports Performance': 'bg-orange-100 text-orange-800',
      'Prenatal Fitness': 'bg-pink-100 text-pink-800',
    };
    return colors[specialty as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleFindOptimalTimes = () => {
    if (!user) {
      alert('Please log in to book sessions with trainers');
      return;
    }
    
    // Prevent trainers from booking sessions with other trainers
    if (user.role === 'trainer') {
      alert('Trainers cannot book sessions with other trainers. This feature is for clients only.');
      return;
    }
    
    // Store trainer info for optimal scheduling
    localStorage.setItem('selectedTrainer', JSON.stringify({
      id: mappedTrainer.id,
      name: mappedTrainer.name,
      specialty: mappedTrainer.specialty,
      rating: mappedTrainer.rating,
      price: mappedTrainer.pricePerHour > 0 ? mappedTrainer.pricePerHour : mappedTrainer.pricePerSession,
      price_per_hour: mappedTrainer.pricePerHour > 0 ? mappedTrainer.pricePerHour : mappedTrainer.pricePerSession
    }));
    
    // Navigate to optimal scheduling modal/page
    router.push('/optimal-scheduling');
  };

  const handleBrowseAvailable = () => {
    if (!user) {
      alert('Please log in to book sessions with trainers');
      return;
    }
    
    // Prevent trainers from booking sessions with other trainers
    if (user.role === 'trainer') {
      alert('Trainers cannot book sessions with other trainers. This feature is for clients only.');
      return;
    }
    
    // Store trainer info for direct booking
    localStorage.setItem('selectedTrainer', JSON.stringify({
      id: mappedTrainer.id,
      name: mappedTrainer.name,
      specialty: mappedTrainer.specialty,
      rating: mappedTrainer.rating,
      price_per_hour: mappedTrainer.pricePerHour,
      training_types: mappedTrainer.trainingTypes,
      gym_name: mappedTrainer.gymName || (apiTrainer.location_preference === 'customer_choice' ? "Customer's choice" : 'Gym'),
      gym_address: mappedTrainer.gymAddress || 'Address not specified'
    }));
    
    // Navigate to direct booking page
    router.push('/direct-booking');
  };

  const handleViewProfile = () => {
    // Navigate to trainer profile page
    router.push(`/trainers/${mappedTrainer.id}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden card-hover">
      {/* Cover Image */}
      <div className="relative h-48">
        <img
          src={mappedTrainer.cover}
          alt={`${mappedTrainer.name} training`}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSpecialtyColor(mappedTrainer.specialty)}`}>
            {mappedTrainer.specialty}
          </span>
          {!mappedTrainer.profileComplete && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Profile Incomplete
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Trainer Info */}
        <div className="flex items-center mb-4">
          <img
            src={mappedTrainer.avatar}
            alt={mappedTrainer.name}
            className="w-12 h-12 rounded-full mr-4"
          />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{mappedTrainer.name}</h3>
            <div className="flex items-center">
              <div className="flex text-yellow-400 mr-2">
                {'★'.repeat(Math.floor(mappedTrainer.rating))}
                {mappedTrainer.rating % 1 !== 0 && <span className="text-yellow-400">★</span>}
              </div>
              <span className="text-sm text-gray-600">
                {mappedTrainer.rating} ({mappedTrainer.reviews} reviews)
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {mappedTrainer.blurb}
        </p>

        {/* Training Types */}
        {mappedTrainer.trainingTypes && mappedTrainer.trainingTypes.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Specialties:</h4>
            <div className="flex flex-wrap gap-1">
              {mappedTrainer.trainingTypes.map((type: string) => (
                <span
                  key={type}
                  className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-md"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Gym Information */}
        {mappedTrainer.gymName && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Location:</h4>
            <div className="text-sm text-gray-600">
              <div className="font-medium">{mappedTrainer.gymName}</div>
              {mappedTrainer.gymAddress && (
                <div>{mappedTrainer.gymAddress}</div>
              )}
              {(mappedTrainer.gymCity || mappedTrainer.gymState) && (
                <div>
                  {mappedTrainer.gymCity && mappedTrainer.gymCity}
                  {mappedTrainer.gymCity && mappedTrainer.gymState && ', '}
                  {mappedTrainer.gymState && mappedTrainer.gymState}
                  {mappedTrainer.gymZipCode && ` ${mappedTrainer.gymZipCode}`}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Experience */}
        {mappedTrainer.experienceYears > 0 && (
          <div className="mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <i data-feather="award" className="h-4 w-4 mr-2"></i>
              <span>{mappedTrainer.experienceYears} years experience</span>
            </div>
          </div>
        )}

        {/* Availability */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Available:</h4>
          <div className="flex flex-wrap gap-1">
            {mappedTrainer.availability.map((time) => (
              <span
                key={time}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
              >
                {time}
              </span>
            ))}
          </div>
        </div>

        {/* Price and Actions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div>
                <span className="text-2xl font-bold text-indigo-600">${mappedTrainer.pricePerHour > 0 ? mappedTrainer.pricePerHour : mappedTrainer.pricePerSession}</span>
                <span className="text-gray-600 text-sm ml-1">/hour</span>
              </div>
            </div>
          </div>
          
          {/* Smart Scheduling Actions - Only show for clients */}
          {user?.role !== 'trainer' && (
            <div className="flex space-x-2">
              <button 
                onClick={handleFindOptimalTimes}
                disabled={isBooking}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transition-smooth focus-ring text-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i data-feather="zap" className="h-4 w-4 mr-2"></i>
                {isBooking ? 'Booking...' : 'Find Optimal Times'}
              </button>
              <button 
                onClick={handleBrowseAvailable}
                disabled={isBooking}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-smooth focus-ring text-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i data-feather="calendar" className="h-4 w-4 mr-2"></i>
                Browse Available
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
