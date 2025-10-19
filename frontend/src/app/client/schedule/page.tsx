'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Redirect from old client/schedule to new optimal-scheduling page
 */
export default function CustomerSchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Preserve any query parameters (like trainer selection)
    const queryString = searchParams.toString();
    const redirectUrl = queryString ? `/optimal-scheduling?${queryString}` : '/optimal-scheduling';
    
    // Redirect to the new optimal scheduling page
    router.replace(redirectUrl);
  }, [router, searchParams]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Redirecting...</h3>
        <p className="text-gray-600">Taking you to the new optimal scheduling page.</p>
      </div>
    </div>
  );
}







