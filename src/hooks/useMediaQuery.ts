import { useState, useEffect } from 'react';

/**
 * SSR-safe media query hook for responsive design
 * Returns false during server-side rendering to prevent hydration mismatches
 *
 * @param query - Media query string (e.g., '(max-width: 768px)')
 * @returns boolean - Whether the media query matches
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isDesktop = useMediaQuery('(min-width: 1024px)');
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const media = window.matchMedia(query);

    // Set initial state
    setMatches(media.matches);

    // Listen for changes
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);

    // Cleanup
    return () => media.removeEventListener('change', listener);
  }, [query]);

  // During SSR or before mounting, return false to avoid hydration issues
  return mounted ? matches : false;
};

/**
 * Pre-defined breakpoint hooks for common use cases
 */

/** Mobile devices: < 768px */
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');

/** Tablet devices: 768px - 1023px */
export const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

/** Desktop devices: >= 1024px */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');

/** Tablet or larger: >= 768px */
export const useIsTabletOrLarger = () => useMediaQuery('(min-width: 768px)');

/** Mobile or tablet: < 1024px */
export const useIsMobileOrTablet = () => useMediaQuery('(max-width: 1023px)');

/**
 * Get current device type
 * @returns 'mobile' | 'tablet' | 'desktop'
 */
export const useDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  return 'desktop';
};
