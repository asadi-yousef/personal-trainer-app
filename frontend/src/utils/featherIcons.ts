import { useEffect, useRef } from 'react';

// Global state to prevent multiple simultaneous calls
let isReplacing = false;
let replaceQueue: (() => void)[] = [];
let lastReplaceTime = 0;
const DEBOUNCE_MS = 100;

// Simple feather icon replacement utility with debouncing
export const useFeatherIcons = (dependencies: any[] = []) => {
  const mounted = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const replaceIcons = async () => {
      if (!mounted.current || typeof window === 'undefined') return;
      
      try {
        await safeFeatherReplace();
      } catch (error) {
        // Silently fail - icons will just not be replaced
      }
    };

    // Debounce the replacement
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(replaceIcons, DEBOUNCE_MS);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, dependencies);
};

// Safe feather replace function with queue management
export const safeFeatherReplace = async () => {
  if (typeof window === 'undefined') return;
  
  // Debounce: don't replace if we just replaced recently
  const now = Date.now();
  if (now - lastReplaceTime < DEBOUNCE_MS) {
    return;
  }
  
  // If already replacing, queue this call
  if (isReplacing) {
    return new Promise<void>((resolve) => {
      replaceQueue.push(resolve);
    });
  }
  
  isReplacing = true;
  lastReplaceTime = now;
  
  try {
    const feather = (await import('feather-icons')).default;
    
    // Only replace if there are feather icons to replace
    const featherElements = document.querySelectorAll('[data-feather]');
    if (featherElements.length > 0) {
      feather.replace();
    }
  } catch (error) {
    // Silently fail
    console.warn('Feather icons replace failed:', error);
  } finally {
    isReplacing = false;
    
    // Process queue
    const queue = [...replaceQueue];
    replaceQueue = [];
    queue.forEach(resolve => resolve());
  }
};

// Helper to check if feather icons need replacing
export const needsFeatherReplace = (): boolean => {
  if (typeof window === 'undefined') return false;
  return document.querySelectorAll('[data-feather]').length > 0;
};
