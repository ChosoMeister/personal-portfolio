
import React, { useState, useEffect, memo } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface NetworkStatusProps {
    className?: string;
}

const NetworkStatusComponent: React.FC<NetworkStatusProps> = ({ className = '' }) => {
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const [showReconnected, setShowReconnected] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleOnline = () => {
            setIsOnline(true);
            setShowReconnected(true);
            // Hide "reconnected" message after 3 seconds
            setTimeout(() => setShowReconnected(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowReconnected(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Don't show anything when online and not recently reconnected
    if (isOnline && !showReconnected) return null;

    return (
        <div
            className={`fixed top-0 left-0 right-0 z-[200] transition-all duration-300 ${className}`}
        >
            <div
                className={`flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-bold shadow-lg ${isOnline
                        ? 'bg-emerald-500 text-white'
                        : 'bg-amber-500 text-white animate-pulse'
                    }`}
            >
                {isOnline ? (
                    <>
                        <Wifi size={16} />
                        <span>اتصال برقرار شد</span>
                    </>
                ) : (
                    <>
                        <WifiOff size={16} />
                        <span>حالت آفلاین - تغییرات ذخیره می‌شوند</span>
                    </>
                )}
            </div>
        </div>
    );
};

export const NetworkStatus = memo(NetworkStatusComponent);
