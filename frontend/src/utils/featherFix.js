/**
 * Global feather icons fix to prevent DOM manipulation errors
 * This prevents multiple simultaneous calls and adds proper error handling
 */

let isReplacing = false;
let replaceTimeout = null;
const DEBOUNCE_MS = 150;

// DISABLED: Override the global feather.replace to add safety checks
// if (typeof window !== 'undefined') {
  // Store original replace method
  let originalReplace = null;

  // Safe wrapper around feather.replace()
  const safeReplace = async () => {
    // Prevent multiple simultaneous calls
    if (isReplacing) {
      return;
    }

    isReplacing = true;

    try {
      // Dynamically import feather-icons
      const feather = (await import('feather-icons')).default;

      // Store original replace if not already stored
      if (!originalReplace) {
        originalReplace = feather.replace.bind(feather);
      }

      // Only replace if there are icons to replace
      const featherElements = document.querySelectorAll('[data-feather]:not([data-replaced="true"])');
      if (featherElements.length > 0) {
        // Call original replace
        originalReplace();

        // Mark elements as replaced
        featherElements.forEach((el) => {
          el.setAttribute('data-replaced', 'true');
        });
      }
    } catch (error) {
      console.warn('Feather icons error:', error);
    } finally {
      isReplacing = false;
    }
  };

  // Debounced replace function
  window.safeFeatherReplace = () => {
    if (replaceTimeout) {
      clearTimeout(replaceTimeout);
    }

    replaceTimeout = setTimeout(() => {
      safeReplace();
    }, DEBOUNCE_MS);
  };

  // Manual refresh function for when icons disappear
  window.refreshFeatherIcons = () => {
    if (featherLoaded && featherInstance) {
      try {
        // Force refresh all feather icons
        const featherElements = document.querySelectorAll('[data-feather]');
        featherElements.forEach(el => {
          el.removeAttribute('data-feather-processed');
        });
        featherInstance.replace();
      } catch (error) {
        console.warn('Error refreshing feather icons:', error);
      }
    }
  };

  // Override window.feather if available
  const checkAndOverride = async () => {
    try {
      const feather = (await import('feather-icons')).default;
      const originalMethod = feather.replace.bind(feather);

      feather.replace = () => {
        window.safeFeatherReplace();
      };
    } catch (error) {
      // Feather not loaded yet
    }
  };

  // Try to override after a short delay
  setTimeout(checkAndOverride, 100);
// }

// Export for use in components
export const initFeatherFix = () => {
  if (typeof window !== 'undefined' && window.safeFeatherReplace) {
    window.safeFeatherReplace();
  }
};

export default initFeatherFix;
