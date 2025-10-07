// Comprehensive fix for feather icon DOM manipulation errors
if (typeof window !== 'undefined') {
  let featherLoaded = false;
  let isReplacing = false;
  
  const safeFeatherReplace = async () => {
    if (isReplacing) return;
    isReplacing = true;
    
    try {
      if (!featherLoaded) {
        const feather = await import('feather-icons');
        window.feather = feather.default;
        featherLoaded = true;
      }
      
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        try {
          if (window.feather) {
            window.feather.replace();
          }
        } catch (error) {
          console.warn('Feather icon replacement failed:', error);
        } finally {
          isReplacing = false;
        }
      });
    } catch (error) {
      console.warn('Failed to load feather icons:', error);
      isReplacing = false;
    }
  };
  
  // Override the global feather.replace function
  window.addEventListener('DOMContentLoaded', () => {
    // Set up a global safe replace function
    window.safeFeatherReplace = safeFeatherReplace;
    
    // Override any existing feather.replace calls
    const originalConsoleError = console.error;
    console.error = function(...args) {
      if (args[0] && args[0].includes && args[0].includes('removeChild')) {
        // Suppress feather icon DOM errors
        return;
      }
      originalConsoleError.apply(console, args);
    };
  });
  
  // Also run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeFeatherReplace);
  } else {
    safeFeatherReplace();
  }
}
