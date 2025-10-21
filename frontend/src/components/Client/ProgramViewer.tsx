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
  trainer: {
    user: {
      full_name: string;
      avatar?: string;
    };
  };
  workouts?: any[];
}

export default function ProgramViewer() {
  const [myPrograms, setMyPrograms] = useState<Program[]>([]);
  const [publicPrograms, setPublicPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my' | 'public'>('my');
  const { user } = useAuth();

  // Fetch client's assigned programs and public programs
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoading(true);
        
        // Fetch client's assigned programs
        const myProgramsData = await programs.getMyPrograms();
        setMyPrograms(myProgramsData || []);
        
        // Fetch public programs
        const publicProgramsData = await programs.getAll({ is_public: true });
        setPublicPrograms(publicProgramsData || []);
      } catch (error) {
        console.error('Failed to fetch programs:', error);
        setMyPrograms([]);
        setPublicPrograms([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrograms();
  }, [user]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
      {/* Header with Tabs */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Workout Programs</h3>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('my')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Programs ({myPrograms.length})
            </button>
            <button
              onClick={() => setActiveTab('public')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'public'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Browse Programs ({publicPrograms.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'my' ? (
        <div className="space-y-4">
          {myPrograms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="mb-4">
                <i data-feather="clipboard" className="h-12 w-12 text-gray-400 mx-auto"></i>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Programs Assigned</h4>
              <p className="text-gray-600">You don't have any programs assigned yet. Ask your trainer to assign you a program, or browse public programs.</p>
            </div>
          ) : (
            myPrograms.map((program) => (
              <div key={program.id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">{program.name}</h4>
                    <p className="text-gray-600 mb-4">{program.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <p className="font-medium">{program.program_type}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <p className="font-medium">{program.duration_weeks} weeks</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Difficulty:</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(program.difficulty_level)}`}>
                          {program.difficulty_level}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Trainer:</span>
                        <p className="font-medium">{program.trainer?.user?.full_name}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4 text-right">
                    <div className="text-2xl font-bold text-indigo-600">${program.price}</div>
                    <div className="text-sm text-gray-500">per program</div>
                  </div>
                </div>
                
                {program.workouts && program.workouts.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <h5 className="font-medium text-gray-900 mb-2">Workouts ({program.workouts.length})</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {program.workouts.map((workout: any, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <h6 className="font-medium text-gray-900">{workout.name}</h6>
                          <p className="text-sm text-gray-600">{workout.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <button className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
                    Start Program
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {publicPrograms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="mb-4">
                <i data-feather="search" className="h-12 w-12 text-gray-400 mx-auto"></i>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Public Programs</h4>
              <p className="text-gray-600">There are no public programs available at the moment.</p>
            </div>
          ) : (
            publicPrograms.map((program) => (
              <div key={program.id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <img
                        src={program.trainer?.user?.avatar || 'https://i.pravatar.cc/200'}
                        alt={program.trainer?.user?.full_name || 'Trainer'}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900">{program.name}</h4>
                        <p className="text-sm text-gray-600">by {program.trainer?.user?.full_name}</p>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{program.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <p className="font-medium">{program.program_type}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <p className="font-medium">{program.duration_weeks} weeks</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Difficulty:</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(program.difficulty_level)}`}>
                          {program.difficulty_level}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Price:</span>
                        <p className="font-medium">${program.price}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <button className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
                    Request Assignment
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
































