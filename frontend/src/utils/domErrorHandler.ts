import { useEffect } from 'react';

// Hook to handle DOM manipulation errors gracefully
export const useDOMErrorHandler = () => {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Check if it's a DOM manipulation error
      if (event.error && 
          (event.error.message?.includes('removeChild') || 
           event.error.message?.includes('Node') || 
           event.error.message?.includes('NotFoundError') ||
           event.error.message?.includes('insertBefore') ||
           event.error.message?.includes('appendChild') ||
           event.error.message?.includes('Failed to execute') ||
           event.error.message?.includes('not a child of this node') ||
           event.error.name === 'NotFoundError' ||
           event.error.name === 'DOMException')) {
        
        console.warn('DOM manipulation error caught and handled:', event.error);
        
        // Prevent the error from bubbling up
        event.preventDefault();
        event.stopPropagation();
        
        // Force a small delay to allow DOM to stabilize
        setTimeout(() => {
          // Trigger a gentle re-render by dispatching a custom event
          window.dispatchEvent(new CustomEvent('dom-stabilized'));
        }, 100);
        
        return false;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Check if it's a DOM manipulation error in a promise
      if (event.reason && 
          (event.reason.message?.includes('removeChild') || 
           event.reason.message?.includes('Node') || 
           event.reason.message?.includes('NotFoundError') ||
           event.reason.message?.includes('insertBefore') ||
           event.reason.message?.includes('appendChild') ||
           event.reason.message?.includes('Failed to execute') ||
           event.reason.message?.includes('not a child of this node') ||
           event.reason.name === 'NotFoundError' ||
           event.reason.name === 'DOMException')) {
        
        console.warn('DOM manipulation error in promise caught and handled:', event.reason);
        
        // Prevent the error from bubbling up
        event.preventDefault();
        
        // Force a small delay to allow DOM to stabilize
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('dom-stabilized'));
        }, 100);
        
        return false;
      }
    };

    // Add event listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
};

// Utility function to safely execute DOM operations
export const safeDOMOperation = <T>(operation: () => T, fallback?: T): T | undefined => {
  try {
    return operation();
  } catch (error) {
    if (error instanceof Error && 
        (error.message.includes('removeChild') || 
         error.message.includes('Node') || 
         error.message.includes('NotFoundError'))) {
      console.warn('DOM operation failed safely:', error);
      return fallback;
    }
    throw error; // Re-throw if it's not a DOM manipulation error
  }
};
