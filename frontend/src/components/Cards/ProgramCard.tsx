'use client';

import { useEffect } from 'react';
import { Program } from '../../lib/data';

interface ProgramCardProps {
  program: Program;
}

/**
 * Program card component displaying current workout program
 */
export default function ProgramCard({ program }: ProgramCardProps) {
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

  const getStatusColor = (status: string) => {
    const colors = {
      'Active': 'bg-green-100 text-green-800',
      'Completed': 'bg-blue-100 text-blue-800',
      'Paused': 'bg-yellow-100 text-yellow-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 card-hover">
      <div className="flex items-center mb-4">
        <img
          src={program.trainerAvatar}
          alt={program.trainerName}
          className="w-10 h-10 rounded-full mr-3"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{program.title}</h3>
          <p className="text-sm text-gray-600">by {program.trainerName}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(program.status)}`}>
          {program.status}
        </span>
      </div>

      <p className="text-gray-600 text-sm mb-4">{program.description}</p>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Current Exercises:</h4>
        <ul className="space-y-1">
          {program.exercises.slice(0, 3).map((exercise, index) => (
            <li key={index} className="text-sm text-gray-600 flex items-center">
              <i data-feather="check" className="h-3 w-3 text-green-500 mr-2"></i>
              {exercise}
            </li>
          ))}
          {program.exercises.length > 3 && (
            <li className="text-sm text-gray-500">
              +{program.exercises.length - 3} more exercises
            </li>
          )}
        </ul>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          <span>Duration: {program.duration}</span>
        </div>
        <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium focus-ring rounded-md p-1">
          View Full Program
        </button>
      </div>
    </div>
  );
}
