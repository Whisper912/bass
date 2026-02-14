/**
 * useMobileLandscape Hook
 * Detects if the device is a mobile device (touch-based) and in landscape orientation.
 */
import { useState, useEffect } from 'react';

export const useMobileLandscape = () => {
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      // pointer: coarse is typical for touch devices (mobile/tablets)
      const isTouch = window.matchMedia('(pointer: coarse)').matches;
      const isLandscape = window.matchMedia('(orientation: landscape)').matches;
      setIsMobileLandscape(isTouch && isLandscape);
    };

    checkStatus();
    
    const mediaQueryLandscape = window.matchMedia('(orientation: landscape)');
    const mediaQueryTouch = window.matchMedia('(pointer: coarse)');

    // Support both older and newer listener methods
    if (mediaQueryLandscape.addEventListener) {
      mediaQueryLandscape.addEventListener('change', checkStatus);
    } else {
      mediaQueryLandscape.addListener(checkStatus);
    }

    return () => {
      if (mediaQueryLandscape.removeEventListener) {
        mediaQueryLandscape.removeEventListener('change', checkStatus);
      } else {
        mediaQueryLandscape.removeListener(checkStatus);
      }
    };
  }, []);

  return isMobileLandscape;
};
