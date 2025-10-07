import { useEffect, useRef } from 'react';

// Safe feather icon replacement utility
export const useFeatherIcons = (dependencies: any[] = []) => {
  const isReplacing = useRef(false);

  useEffect(() => {
    const replaceIcons = async () => {
      // Prevent multiple simultaneous replacements
      if (isReplacing.current) return;
      
      isReplacing.current = true;
      
      try {
        // Only run on client side
        if (typeof window === 'undefined') return;
        
        // Import feather dynamically
        const feather = (await import('feather-icons')).default;
        
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          try {
            feather.replace();
          } catch (error) {
            console.warn('Feather icon replacement failed:', error);
          } finally {
            isReplacing.current = false;
          }
        }, 10);
      } catch (error) {
        console.warn('Failed to load feather icons:', error);
        isReplacing.current = false;
      }
    };

    replaceIcons();
  }, dependencies);
};

// Alternative: Safe feather replacement function
export const safeFeatherReplace = async () => {
  try {
    if (typeof window === 'undefined') return;
    
    const feather = (await import('feather-icons')).default;
    
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      try {
        feather.replace();
      } catch (error) {
        console.warn('Feather icon replacement failed:', error);
      }
    });
  } catch (error) {
    console.warn('Failed to load feather icons:', error);
  }
};
