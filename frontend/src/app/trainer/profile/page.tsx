'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import PageHeader from '../../../components/PageHeader';
import { ProtectedRoute, useAuth } from '../../../contexts/AuthContext';
import { trainerProfile } from '../../../lib/api';

const TRAINING_TYPES = [
  'Calisthenics', 'Gym Weights', 'Cardio', 'Yoga', 'Pilates', 'CrossFit',
  'Functional Training', 'Strength Training', 'Endurance Training',
  'Flexibility Training', 'Sports Specific', 'Rehabilitation',
  'Nutrition Coaching', 'Mental Health Coaching'
];

const SPECIALTIES = [
  'Strength Training', 'Weight Loss', 'Yoga', 'Rehabilitation',
  'Sports Performance', 'Prenatal Fitness'
];

function TrainerProfileContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();

  // Form states
  const [basicInfo, setBasicInfo] = useState({
    bio: '',
    experience_years: 0,
    certifications: ''
  });

  const [trainingInfo, setTrainingInfo] = useState({
    training_types: [] as string[],
    specialty: ''
  });

  const [gymInfo, setGymInfo] = useState({
    gym_name: '',
    gym_address: '',
    gym_city: '',
    gym_state: '',
    gym_zip_code: '',
    gym_phone: ''
  });

  const [pricing, setPricing] = useState({
    price_per_hour: 50
  });

  // Initialize feather icons
  useEffect(() => {
    const initFeather = async () => {
      try {
        const feather = (await import('feather-icons')).default;
        feather.replace();
      } catch (error) {
        console.error('Failed to load feather icons:', error);
      }
    };
    initFeather();
  }, [activeTab, success, error]);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const profile = await trainerProfile.getMyProfile();
        
        setBasicInfo({
          bio: profile.bio || '',
          experience_years: profile.experience_years || 0,
          certifications: profile.certifications || ''
        });
        
        setTrainingInfo({
          training_types: profile.training_types || [],
          specialty: profile.specialty || ''
        });
        
        setGymInfo({
          gym_name: profile.gym_name || '',
          gym_address: profile.gym_address || '',
          gym_city: profile.gym_city || '',
          gym_state: profile.gym_state || '',
          gym_zip_code: profile.gym_zip_code || '',
          gym_phone: profile.gym_phone || ''
        });
        
        setPricing({
          price_per_hour: profile.price_per_hour || 50
        });
        
      } catch (err: any) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSaveBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      await trainerProfile.updateBasicInfo(basicInfo);
      
      setSuccess('Basic information updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update basic information');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTrainingInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      await trainerProfile.updateTrainingInfo(trainingInfo);
      
      setSuccess('Training information updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update training information');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGymInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      await trainerProfile.updateGymInfo(gymInfo);
      
      setSuccess('Gym information updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update gym information');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      await trainerProfile.updatePricing(pricing);
      
      setSuccess('Pricing updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update pricing');
    } finally {
      setSaving(false);
    }
  };

  const toggleTrainingType = (type: string) => {
    setTrainingInfo(prev => ({
      ...prev,
      training_types: prev.training_types.includes(type)
        ? prev.training_types.filter(t => t !== type)
        : [...prev.training_types, type]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      <div className={`main-content transition-all duration-300 ${sidebarCollapsed ? 'content-collapsed' : 'content-expanded'}`}>
        <PageHeader user={user} />

        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-600 mt-2">Manage your trainer profile information</p>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <i data-feather="check-circle" className="h-5 w-5 text-green-500 mr-2"></i>
                <p className="text-green-700">{success}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <i data-feather="alert-circle" className="h-5 w-5 text-red-500 mr-2"></i>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('basic')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'basic'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Basic Info
                </button>
                <button
                  onClick={() => setActiveTab('training')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'training'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Training Info
                </button>
                <button
                  onClick={() => setActiveTab('gym')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'gym'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Gym Info
                </button>
                <button
                  onClick={() => setActiveTab('pricing')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'pricing'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Pricing
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <>
                  {/* Basic Info Tab */}
                  {activeTab === 'basic' && (
                    <form onSubmit={handleSaveBasicInfo} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bio (minimum 100 characters)
                        </label>
                        <textarea
                          value={basicInfo.bio}
                          onChange={(e) => setBasicInfo({ ...basicInfo, bio: e.target.value })}
                          rows={6}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Tell clients about yourself, your experience, and your training philosophy..."
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          {basicInfo.bio.length} / 100 characters
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Years of Experience
                        </label>
                        <input
                          type="number"
                          value={basicInfo.experience_years}
                          onChange={(e) => setBasicInfo({ ...basicInfo, experience_years: parseInt(e.target.value) || 0 })}
                          min="0"
                          max="50"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Certifications (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={basicInfo.certifications}
                          onChange={(e) => setBasicInfo({ ...basicInfo, certifications: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="e.g., ACE Certified, NASM-CPT, CrossFit Level 2"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={saving || basicInfo.bio.length < 100}
                        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Saving...' : 'Save Basic Info'}
                      </button>
                    </form>
                  )}

                  {/* Training Info Tab */}
                  {activeTab === 'training' && (
                    <form onSubmit={handleSaveTrainingInfo} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Training Types (select 1-5)
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {TRAINING_TYPES.map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => toggleTrainingType(type)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                trainingInfo.training_types.includes(type)
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          Selected: {trainingInfo.training_types.length} / 5
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Primary Specialty
                        </label>
                        <select
                          value={trainingInfo.specialty}
                          onChange={(e) => setTrainingInfo({ ...trainingInfo, specialty: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="">Select a specialty</option>
                          {SPECIALTIES.map((spec) => (
                            <option key={spec} value={spec}>{spec}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={saving || trainingInfo.training_types.length === 0 || trainingInfo.training_types.length > 5}
                        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Saving...' : 'Save Training Info'}
                      </button>
                    </form>
                  )}

                  {/* Gym Info Tab */}
                  {activeTab === 'gym' && (
                    <form onSubmit={handleSaveGymInfo} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Gym Name
                        </label>
                        <input
                          type="text"
                          value={gymInfo.gym_name}
                          onChange={(e) => setGymInfo({ ...gymInfo, gym_name: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="FitLife Gym"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Gym Address
                        </label>
                        <input
                          type="text"
                          value={gymInfo.gym_address}
                          onChange={(e) => setGymInfo({ ...gymInfo, gym_address: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="123 Main Street"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City
                          </label>
                          <input
                            type="text"
                            value={gymInfo.gym_city}
                            onChange={(e) => setGymInfo({ ...gymInfo, gym_city: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="New York"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State
                          </label>
                          <input
                            type="text"
                            value={gymInfo.gym_state}
                            onChange={(e) => setGymInfo({ ...gymInfo, gym_state: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="NY"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            ZIP Code
                          </label>
                          <input
                            type="text"
                            value={gymInfo.gym_zip_code}
                            onChange={(e) => setGymInfo({ ...gymInfo, gym_zip_code: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="10001"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={gymInfo.gym_phone}
                            onChange={(e) => setGymInfo({ ...gymInfo, gym_phone: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="555-0123"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Saving...' : 'Save Gym Info'}
                      </button>
                    </form>
                  )}

                  {/* Pricing Tab */}
                  {activeTab === 'pricing' && (
                    <form onSubmit={handleSavePricing} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hourly Rate ($)
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                            $
                          </span>
                          <input
                            type="number"
                            value={pricing.price_per_hour}
                            onChange={(e) => setPricing({ price_per_hour: parseFloat(e.target.value) || 0 })}
                            min="20"
                            max="500"
                            step="5"
                            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          Set your hourly training rate (minimum $20, maximum $500)
                        </p>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-blue-900 mb-2">Pricing Examples:</h3>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• 1 hour session: ${pricing.price_per_hour.toFixed(2)}</li>
                          <li>• 1.5 hour session: ${(pricing.price_per_hour * 1.5).toFixed(2)}</li>
                          <li>• 2 hour session: ${(pricing.price_per_hour * 2).toFixed(2)}</li>
                        </ul>
                      </div>

                      <button
                        type="submit"
                        disabled={saving || pricing.price_per_hour < 20 || pricing.price_per_hour > 500}
                        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Saving...' : 'Save Pricing'}
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrainerProfile() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <TrainerProfileContent />
    </ProtectedRoute>
  );
}

