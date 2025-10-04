'use client';

import { useEffect } from 'react';
import { TrainerProgram } from '../../lib/data';

interface ProgramCardProps {
  program: TrainerProgram;
}

/**
 * Program card component for trainer dashboard
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

  const progressPercentage = (program.sessionsCompleted / program.totalSessions) * 100;

  return (
    <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-smooth">
      <div className="flex items-center mb-3">
        <img
          src={program.clientAvatar}
          alt={program.clientName}
          className="w-10 h-10 rounded-full mr-3"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{program.title}</h3>
          <p className="text-sm text-gray-600">with {program.clientName}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(program.status)}`}>
          {program.status}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{program.sessionsCompleted}/{program.totalSessions} sessions</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {Math.round(progressPercentage)}% complete
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          <span>Duration: {program.duration}</span>
        </div>
        <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium focus-ring rounded-md p-1">
          View Details
        </button>
      </div>
    </div>
  );
}









