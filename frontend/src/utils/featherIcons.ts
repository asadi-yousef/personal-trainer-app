import { useEffect, useRef } from 'react';

// Simple feather icon replacement utility
export const useFeatherIcons = (dependencies: any[] = []) => {
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const replaceIcons = async () => {
      if (!mounted.current || typeof window === 'undefined') return;
      
      try {
        const feather = (await import('feather-icons')).default;
        feather.replace();
      } catch (error) {
        // Silently fail - icons will just not be replaced
      }
    };

    const timeoutId = setTimeout(replaceIcons, 100);
    return () => clearTimeout(timeoutId);
  }, dependencies);
};

// Safe feather replace function
export const safeFeatherReplace = async () => {
  if (typeof window === 'undefined') return;
  
  try {
    const feather = (await import('feather-icons')).default;
    feather.replace();
  } catch (error) {
    // Silently fail
  }
};