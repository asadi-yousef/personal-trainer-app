'use client';

import { useEffect, useRef } from 'react';

/**
 * Client-side wrapper to initialize AOS and feather icons
 */
export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const observerRef = useRef<MutationObserver | null>(null);
  const replaceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isReplacingRef = useRef(false);

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

        // Safe feather replace with debouncing
        const safeFeatherReplace = async () => {
          // Prevent multiple simultaneous calls
          if (isReplacingRef.current) {
            return;
          }

          // Clear any pending timeout
          if (replaceTimeoutRef.current) {
            clearTimeout(replaceTimeoutRef.current);
          }

          // Debounce the replace call
          replaceTimeoutRef.current = setTimeout(async () => {
            if (isReplacingRef.current) return;

            isReplacingRef.current = true;
            try {
              const feather = (await import('feather-icons')).default;
              
              // Only replace if there are feather icons that need replacing
              const featherElements = document.querySelectorAll('[data-feather]');
              if (featherElements.length > 0) {
                feather.replace();
              }
            } catch (error) {
              console.warn('Failed to replace feather icons:', error);
            } finally {
              isReplacingRef.current = false;
            }
          }, 150); // Debounce for 150ms
        };

        // Initial feather icons replacement
        await safeFeatherReplace();

        // Re-render feather icons when DOM changes (debounced)
        observerRef.current = new MutationObserver((mutations) => {
          // Only trigger if there are actual feather icon elements added
          const hasFeatherIcons = mutations.some((mutation) => {
            return Array.from(mutation.addedNodes).some((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                return (
                  element.hasAttribute('data-feather') ||
                  element.querySelector('[data-feather]') !== null
                );
              }
              return false;
            });
          });

          if (hasFeatherIcons) {
            safeFeatherReplace();
          }
        });

        observerRef.current.observe(document.body, {
          childList: true,
          subtree: true,
        });
      } catch (error) {
        console.error('Failed to initialize libraries:', error);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initializeLibraries, 100);

    return () => {
      clearTimeout(timer);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (replaceTimeoutRef.current) {
        clearTimeout(replaceTimeoutRef.current);
      }
    };
  }, []);

  return <>{children}</>;
}
