'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function SimpleProfileCheck({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('SimpleProfileCheck: User data:', user);
    console.log('SimpleProfileCheck: Token exists:', !!token);
    
    if (user && user.role === 'trainer') {
      console.log('SimpleProfileCheck: User is a trainer, redirecting to completion page');
      router.push('/trainer/complete-registration');
    } else {
      console.log('SimpleProfileCheck: User is not a trainer or not logged in');
    }
  }, [user, token, router]);

  return <>{children}</>;
}



























