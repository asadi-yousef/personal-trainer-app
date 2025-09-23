'use client';

import { useEffect } from 'react';

/**
 * Client-side wrapper to initialize AOS and feather icons
 */
export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const initializeLibraries = async () => {
      try {
        // Initialize AOS
        const AOS = (await import('aos')).default;
        AOS.init({
          duration: 800,
          once: true,
          offset: 100,
          easing: 'ease-in-out',
        });

        // Initialize feather icons
        const feather = (await import('feather-icons')).default;
        feather.replace();

        // Re-render feather icons when needed
        const observer = new MutationObserver(() => {
          try {
            feather.replace();
          } catch (error) {
            console.error('Failed to replace feather icons:', error);
          }
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });

        return () => observer.disconnect();
      } catch (error) {
        console.error('Failed to initialize libraries:', error);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initializeLibraries, 100);
    return () => clearTimeout(timer);
  }, []);

  return <>{children}</>;
}
