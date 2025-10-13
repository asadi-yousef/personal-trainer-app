'use client';

import { useState, useEffect } from 'react';
import { programs } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface Program {
  id: number;
  name: string;
  description: string;
  program_type: string;
  duration_weeks: number;
  difficulty_level: string;
  price: number;
  is_public: boolean;
  trainer_id: number;
  workouts?: any[];
}

export default function ProgramManager() {
  const [programs_list, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newProgram, setNewProgram] = useState<Partial<Program>>({
    name: '',
    description: '',
    program_type: 'Strength Training',
    duration_weeks: 4,
    difficulty_level: 'Beginner',
    price: 0,
    is_public: true
  });
  const { user } = useAuth();

  const programTypes = [
    'Strength Training',
    'Cardio HIIT',
    'Weight Loss',
    'Muscle Building',
    'Endurance Training',
    'Flexibility & Mobility',
    'Sports Performance',
    'Rehabilitation'
  ];

  const difficultyLevels = ['Beginner', 'Intermediate', 'Advanced'];

  // Fetch trainer's programs
  useEffect(() => {
    const fetchPrograms = async () => {
      if (!user?.trainer_profile) return;
      
      try {
        setLoading(true);
        const data = await programs.getAll({ trainer_id: user.trainer_profile.id });
        setPrograms(data || []);
      } catch (error) {
        console.error('Failed to fetch programs:', error);
        setPrograms([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrograms();
  }, [user]);

  const handleCreateProgram = async () => {
    if (!newProgram.name || !newProgram.description) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const createdProgram = await programs.create({
        ...newProgram,
        trainer_id: user?.trainer_profile?.id
      });
      setPrograms([...programs_list, createdProgram]);
      setNewProgram({
        name: '',
        description: '',
        program_type: 'Strength Training',
        duration_weeks: 4,
        difficulty_level: 'Beginner',
        price: 0,
        is_public: true
      });
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create program:', error);
      alert('Failed to create program');
    }
  };

  const handleDeleteProgram = async (programId: number) => {
    if (!confirm('Are you sure you want to delete this program?')) return;
    
    try {
      await programs.delete(programId);
      setPrograms(programs_list.filter(program => program.id !== programId));
    } catch (error) {
      console.error('Failed to delete program:', error);
      alert('Failed to delete program');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">My Programs</h3>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {isCreating ? 'Cancel' : 'Create New Program'}
        </button>
      </div>

      {/* Create New Program Form */}
      {isCreating && (
        <div className="bg-gray-50 p-6 rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-4">Create New Program</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program Name *</label>
                <input
                  type="text"
                  value={newProgram.name}
                  onChange={(e) => setNewProgram({ ...newProgram, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter program name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program Type</label>
                <select
                  value={newProgram.program_type}
                  onChange={(e) => setNewProgram({ ...newProgram, program_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {programTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                value={newProgram.description}
                onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Describe the program goals and structure"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (weeks)</label>
                <input
                  type="number"
                  value={newProgram.duration_weeks}
                  onChange={(e) => setNewProgram({ ...newProgram, duration_weeks: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="1"
                  max="52"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
                <select
                  value={newProgram.difficulty_level}
                  onChange={(e) => setNewProgram({ ...newProgram, difficulty_level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {difficultyLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                <input
                  type="number"
                  value={newProgram.price}
                  onChange={(e) => setNewProgram({ ...newProgram, price: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_public"
                checked={newProgram.is_public}
                onChange={(e) => setNewProgram({ ...newProgram, is_public: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="is_public" className="ml-2 block text-sm text-gray-900">
                Make this program public (visible to all clients)
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProgram}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Create Program
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Programs List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs_list.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No programs created yet. Create your first program above.
          </div>
        ) : (
          programs_list.map((program) => (
            <div key={program.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-medium text-gray-900">{program.name}</h4>
                <button
                  onClick={() => handleDeleteProgram(program.id)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Delete
                </button>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{program.description}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type:</span>
                  <span className="font-medium">{program.program_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Duration:</span>
                  <span className="font-medium">{program.duration_weeks} weeks</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Difficulty:</span>
                  <span className="font-medium">{program.difficulty_level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Price:</span>
                  <span className="font-medium">${program.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    program.is_public 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {program.is_public ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {programs_list.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Program Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Total Programs:</span>
              <p className="font-medium text-blue-900">{programs_list.length}</p>
            </div>
            <div>
              <span className="text-blue-700">Public:</span>
              <p className="font-medium text-blue-900">{programs_list.filter(p => p.is_public).length}</p>
            </div>
            <div>
              <span className="text-blue-700">Private:</span>
              <p className="font-medium text-blue-900">{programs_list.filter(p => !p.is_public).length}</p>
            </div>
            <div>
              <span className="text-blue-700">Avg. Duration:</span>
              <p className="font-medium text-blue-900">
                {Math.round(programs_list.reduce((acc, p) => acc + p.duration_weeks, 0) / programs_list.length)} weeks
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

















