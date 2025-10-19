/**
 * Navigation preloader for faster page transitions
 */
export class NavigationPreloader {
  private static preloadedPages = new Set<string>();
  private static preloadPromises = new Map<string, Promise<any>>();

  /**
   * Preload a page component before navigation
   */
  static async preloadPage(path: string, importFn: () => Promise<any>) {
    if (this.preloadedPages.has(path)) {
      return;
    }

    if (this.preloadPromises.has(path)) {
      return this.preloadPromises.get(path);
    }

    const promise = importFn().then(module => {
      this.preloadedPages.add(path);
      this.preloadPromises.delete(path);
      return module;
    });

    this.preloadPromises.set(path, promise);
    return promise;
  }

  /**
   * Preload common dashboard pages
   */
  static preloadCommonPages() {
    // Preload client dashboard components
    this.preloadPage('/client', () => import('../app/client/page'));
    this.preloadPage('/trainer', () => import('../app/trainer/page'));
    this.preloadPage('/admin', () => import('../app/admin/page'));
    
    // Preload common components
    this.preloadPage('sidebar', () => import('../components/Sidebar'));
    this.preloadPage('pageheader', () => import('../components/PageHeader'));
  }

  /**
   * Preload on hover for faster navigation
   */
  static setupHoverPreloading() {
    const links = document.querySelectorAll('a[href^="/"]');
    
    links.forEach(link => {
      link.addEventListener('mouseenter', () => {
        const href = link.getAttribute('href');
        if (href) {
          // Preload the page on hover
          this.preloadPageByPath(href);
        }
      });
    });
  }

  /**
   * Preload page by path
   */
  private static preloadPageByPath(path: string) {
    switch (path) {
      case '/client':
        this.preloadPage('client', () => import('../app/client/page'));
        break;
      case '/trainer':
        this.preloadPage('trainer', () => import('../app/trainer/page'));
        break;
      case '/admin':
        this.preloadPage('admin', () => import('../app/admin/page'));
        break;
      case '/client/schedule':
        this.preloadPage('client-schedule', () => import('../app/client/schedule/page'));
        break;
      case '/trainer/availability':
        this.preloadPage('trainer-availability', () => import('../app/trainer/availability/page'));
        break;
    }
  }
}

// Initialize preloader when app starts
if (typeof window !== 'undefined') {
  // Preload common pages after initial load
  setTimeout(() => {
    NavigationPreloader.preloadCommonPages();
    NavigationPreloader.setupHoverPreloading();
  }, 2000);
}
