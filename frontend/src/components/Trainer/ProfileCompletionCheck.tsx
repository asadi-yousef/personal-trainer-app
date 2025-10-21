'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { trainerRegistration } from '@/lib/api';

interface ProfileStatus {
  is_complete: boolean;
  completion_status: string;
  completion_date?: string;
  missing_fields: string[];
  completion_percentage: number;
}

interface ProfileCompletionCheckProps {
  children: React.ReactNode;
  redirectToCompletion?: boolean;
}

export default function ProfileCompletionCheck({ 
  children, 
  redirectToCompletion = true 
}: ProfileCompletionCheckProps) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('ProfileCompletionCheck: useEffect triggered', { 
      user: user ? { id: user.id, role: user.role, email: user.email } : null, 
      token: token ? 'present' : 'missing',
      redirectToCompletion 
    });
    
    if (user && token && user.role === 'trainer') {
      console.log('ProfileCompletionCheck: Starting profile completion check');
      checkProfileCompletion();
    } else {
      console.log('ProfileCompletionCheck: Skipping check - not a trainer or missing token');
      setLoading(false);
    }
  }, [user, token, redirectToCompletion]);

  const checkProfileCompletion = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('ProfileCompletionCheck: Making API call to profile-status using API client');

      const data = await trainerRegistration.getProfileStatus();
      console.log('ProfileCompletionCheck: Profile status data', data);
      setProfileStatus(data);
      
      // If profile is not complete and we should redirect, redirect to completion page
      if (!data.is_complete && redirectToCompletion) {
        console.log('ProfileCompletionCheck: Profile incomplete, redirecting to completion page');
        router.push('/trainer/complete-registration');
        return;
      }
    } catch (err) {
      console.error('ProfileCompletionCheck: Exception during check', err);
      
      // If there's an exception but we're a trainer, assume profile is incomplete and redirect
      if (redirectToCompletion) {
        console.log('ProfileCompletionCheck: Exception occurred, redirecting to completion page as fallback');
        router.push('/trainer/complete-registration');
        return;
      }
      
      setError('Error checking profile status');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking profile status...</p>
        </div>
      </div>
    );
  }

  // Show error state
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
            onClick={checkProfileCompletion}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // If profile is not complete and we're not redirecting, show completion prompt
  if (profileStatus && !profileStatus.is_complete && !redirectToCompletion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-yellow-600 mb-4">
            <i data-feather="alert-triangle" className="w-16 h-16 mx-auto"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Complete Your Profile
          </h2>
          <p className="text-gray-600 mb-6">
            You need to complete your trainer profile before you can access the dashboard.
          </p>
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${profileStatus.completion_percentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500">
              {profileStatus.completion_percentage}% complete
            </p>
          </div>
          <button
            onClick={() => router.push('/trainer/complete-registration')}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold"
          >
            Complete Profile
          </button>
        </div>
      </div>
    );
  }

  // Profile is complete or user is not a trainer, render children
  console.log('ProfileCompletionCheck: Rendering children', { 
    profileStatus, 
    isComplete: profileStatus?.is_complete,
    redirectToCompletion 
  });
  return <>{children}</>;
}