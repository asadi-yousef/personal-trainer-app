'use client';

import { useEffect } from 'react';
import { Trainer } from '../../lib/data';

interface TrainerCardProps {
  trainer: Trainer;
}

// Helper function to map API trainer data to component format
const mapApiTrainerToComponent = (apiTrainer: any) => ({
  id: apiTrainer.id,
  name: apiTrainer.user_name || 'Unknown Trainer',
  avatar: apiTrainer.user_avatar || 'https://i.pravatar.cc/200',
  cover: apiTrainer.cover_image || 'https://picsum.photos/400/300',
  specialty: apiTrainer.specialty,
  rating: apiTrainer.rating || 0,
  reviews: apiTrainer.reviews_count || 0,
  price: apiTrainer.price_per_session || 0,
  blurb: apiTrainer.bio || 'No description available',
  availability: apiTrainer.availability ? 
    (typeof apiTrainer.availability === 'string' ? 
      JSON.parse(apiTrainer.availability) : 
      apiTrainer.availability) : 
    ['Flexible schedule']
});

/**
 * Trainer card component displaying trainer information
 */
export default function TrainerCard({ trainer }: TrainerCardProps) {
  // Map API data to component format
  const mappedTrainer = mapApiTrainerToComponent(trainer);
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

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden card-hover">
      {/* Cover Image */}
      <div className="relative h-48">
        <img
          src={mappedTrainer.cover}
          alt={`${mappedTrainer.name} training`}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 right-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSpecialtyColor(mappedTrainer.specialty)}`}>
            {mappedTrainer.specialty}
          </span>
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
              <span className="text-2xl font-bold text-indigo-600">${mappedTrainer.price}</span>
              <span className="text-gray-600 text-sm ml-1">/session</span>
            </div>
            <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-smooth focus-ring">
              View Profile
            </button>
          </div>
          
          {/* Smart Scheduling Actions */}
          <div className="flex space-x-2">
            <button className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transition-smooth focus-ring text-sm flex items-center justify-center">
              <i data-feather="zap" className="h-4 w-4 mr-2"></i>
              Find Optimal Times
            </button>
            <button className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-smooth focus-ring text-sm flex items-center justify-center">
              <i data-feather="calendar" className="h-4 w-4 mr-2"></i>
              Browse Available
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
