'use client';

import { useEffect } from 'react';
import { Specialty, Availability } from '../../lib/data';

interface FiltersProps {
  selectedSpecialty: Specialty | 'All';
  selectedAvailability: Availability | 'All';
  onSpecialtyChange: (specialty: Specialty | 'All') => void;
  onAvailabilityChange: (availability: Availability | 'All') => void;
}

const specialties: (Specialty | 'All')[] = [
  'All',
  'Strength Training',
  'Weight Loss',
  'Yoga',
  'Rehabilitation',
  'Sports Performance',
  'Prenatal Fitness',
];

const availabilities: (Availability | 'All')[] = [
  'All',
  'Morning',
  'Afternoon',
  'Evening',
  'Weekends',
];

/**
 * Filters component for trainers page
 */
export default function Filters({
  selectedSpecialty,
  selectedAvailability,
  onSpecialtyChange,
  onAvailabilityChange,
}: FiltersProps) {
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

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="flex items-center space-x-2">
        <i data-feather="filter" className="h-5 w-5 text-gray-600"></i>
        <span className="text-sm font-medium text-gray-700">Filters:</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Specialty Filter */}
        <div className="flex items-center space-x-2">
          <label htmlFor="specialty-filter" className="text-sm font-medium text-gray-700">
            Specialty:
          </label>
          <select
            id="specialty-filter"
            value={selectedSpecialty}
            onChange={(e) => onSpecialtyChange(e.target.value as Specialty | 'All')}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus-ring"
          >
            {specialties.map((specialty) => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>
        </div>

        {/* Availability Filter */}
        <div className="flex items-center space-x-2">
          <label htmlFor="availability-filter" className="text-sm font-medium text-gray-700">
            Availability:
          </label>
          <select
            id="availability-filter"
            value={selectedAvailability}
            onChange={(e) => onAvailabilityChange(e.target.value as Availability | 'All')}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus-ring"
          >
            {availabilities.map((availability) => (
              <option key={availability} value={availability}>
                {availability}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
