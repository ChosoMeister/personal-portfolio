
import { useCallback } from 'react';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

/**
 * Hook for providing haptic feedback on mobile devices
 * Uses the Vibration API when available
 */
export const useHaptics = () => {
    const vibrate = useCallback((pattern: number | number[]) => {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try {
                navigator.vibrate(pattern);
            } catch (e) {
                // Silently fail if vibration is not supported
            }
        }
    }, []);

    const haptic = useCallback((type: HapticType = 'light') => {
        switch (type) {
            case 'light':
                vibrate(10);
                break;
            case 'medium':
                vibrate(20);
                break;
            case 'heavy':
                vibrate(30);
                break;
            case 'success':
                vibrate([10, 50, 10]);
                break;
            case 'warning':
                vibrate([20, 100, 20]);
                break;
            case 'error':
                vibrate([50, 100, 50, 100, 50]);
                break;
            case 'selection':
                vibrate(5);
                break;
            default:
                vibrate(10);
        }
    }, [vibrate]);

    return { haptic, vibrate };
};

export default useHaptics;
