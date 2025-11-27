/**
 * Responsive utilities and constants for mobile optimization
 */

/**
 * Breakpoint definitions (in pixels)
 * Based on common device sizes and Tailwind CSS defaults
 */
export const BREAKPOINTS = {
  /** Extra small devices (iPhone SE): 375px */
  xs: 375,
  /** Small devices (phones): 640px */
  sm: 640,
  /** Medium devices (tablets): 768px */
  md: 768,
  /** Large devices (small laptops): 1024px */
  lg: 1024,
  /** Extra large devices (desktops): 1280px */
  xl: 1280,
  /** 2xl devices (large desktops): 1536px */
  '2xl': 1536,
} as const;

/**
 * Custom breakpoints for this project
 */
export const CUSTOM_BREAKPOINTS = {
  /** Mobile cutoff: 768px (matches useIsMobile) */
  mobile: 768,
  /** Tablet cutoff: 1024px */
  tablet: 1024,
  /** Desktop cutoff: 1280px */
  desktop: 1280,
} as const;

/**
 * Check if current window width is mobile
 * Client-side only (returns false on server)
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < CUSTOM_BREAKPOINTS.mobile;
};

/**
 * Check if current window width is tablet
 * Client-side only (returns false on server)
 */
export const isTabletDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.innerWidth >= CUSTOM_BREAKPOINTS.mobile &&
    window.innerWidth < CUSTOM_BREAKPOINTS.tablet
  );
};

/**
 * Check if current window width is desktop
 * Client-side only (returns false on server)
 */
export const isDesktopDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= CUSTOM_BREAKPOINTS.tablet;
};

/**
 * Get current device type based on window width
 * Client-side only (returns 'desktop' on server for SSR safety)
 */
export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (typeof window === 'undefined') return 'desktop'; // SSR default

  const width = window.innerWidth;

  if (width < CUSTOM_BREAKPOINTS.mobile) return 'mobile';
  if (width < CUSTOM_BREAKPOINTS.tablet) return 'tablet';
  return 'desktop';
};

/**
 * Touch device detection (supports touch events)
 */
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - for IE11 compatibility
    navigator.msMaxTouchPoints > 0
  );
};

/**
 * Get safe area insets for devices with notches (iPhone X+)
 * Returns padding values for safe areas
 */
export const getSafeAreaInsets = () => {
  if (typeof window === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const style = getComputedStyle(document.documentElement);

  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
    right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0'),
  };
};

/**
 * Minimum touch target size (iOS/Android guidelines)
 */
export const MIN_TOUCH_TARGET = 44; // 44x44px

/**
 * Responsive font sizes
 */
export const FONT_SIZES = {
  mobile: {
    xs: '10px',
    sm: '12px',
    base: '14px',
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
  },
  desktop: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
  },
} as const;

/**
 * Responsive spacing
 */
export const SPACING = {
  mobile: {
    container: '16px', // p-4
    card: '12px', // p-3
    gap: '8px', // gap-2
  },
  desktop: {
    container: '24px', // p-6
    card: '16px', // p-4
    gap: '16px', // gap-4
  },
} as const;

/**
 * Clamp a value between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Format number for mobile display (shorten large numbers)
 * @example formatNumberForMobile(12345) => '1.23万'
 * @example formatNumberForMobile(1234567) => '123.46万'
 */
export const formatNumberForMobile = (num: number, decimals: number = 2): string => {
  if (num >= 100000000) {
    return (num / 100000000).toFixed(decimals) + '亿';
  }
  if (num >= 10000) {
    return (num / 10000).toFixed(decimals) + '万';
  }
  return num.toFixed(decimals);
};

/**
 * Truncate text with ellipsis for mobile
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Debounce function for resize events
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function for scroll events
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
