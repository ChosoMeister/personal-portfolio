
import React, { useState, useRef, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: ReactNode;
    disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
    onRefresh,
    children,
    disabled = false
}) => {
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const startY = useRef(0);
    const pulling = useRef(false);

    const THRESHOLD = 80;
    const MAX_PULL = 120;

    const handleTouchStart = (e: React.TouchEvent) => {
        if (disabled || isRefreshing) return;
        const scrollTop = containerRef.current?.scrollTop || 0;
        if (scrollTop === 0) {
            startY.current = e.touches[0].clientY;
            pulling.current = true;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!pulling.current || disabled || isRefreshing) return;
        const currentY = e.touches[0].clientY;
        const diff = currentY - startY.current;

        if (diff > 0) {
            // Apply resistance
            const distance = Math.min(diff * 0.5, MAX_PULL);
            setPullDistance(distance);
        }
    };

    const handleTouchEnd = async () => {
        if (!pulling.current || disabled) return;
        pulling.current = false;

        if (pullDistance >= THRESHOLD) {
            setIsRefreshing(true);
            setPullDistance(THRESHOLD / 2);
            try {
                // Add minimum delay so user sees the refresh happening
                const minDelay = new Promise(resolve => setTimeout(resolve, 500));
                await Promise.all([onRefresh(), minDelay]);
            } catch (error) {
                console.error('Pull to refresh error:', error);
            } finally {
                // Ensure cleanup happens even on error
                setIsRefreshing(false);
                setPullDistance(0);
            }
        } else {
            setPullDistance(0);
        }
    };

    const progress = Math.min(pullDistance / THRESHOLD, 1);
    const rotation = progress * 180;

    return (
        <div
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative overflow-auto"
            style={{ touchAction: pullDistance > 0 ? 'none' : 'auto' }}
        >
            {/* Pull indicator */}
            <div
                className="absolute left-1/2 -translate-x-1/2 z-50 flex items-center justify-center transition-all duration-200"
                style={{
                    top: pullDistance - 40,
                    opacity: progress,
                }}
            >
                <div className={`w-10 h-10 rounded-full bg-[var(--card-bg)] border border-[color:var(--border-color)] shadow-xl flex items-center justify-center ${isRefreshing ? 'animate-spin' : ''}`}>
                    <RefreshCw
                        size={20}
                        className="text-blue-600"
                        style={{ transform: isRefreshing ? 'none' : `rotate(${rotation}deg)` }}
                    />
                </div>
            </div>

            {/* Content */}
            <div
                style={{
                    transform: `translateY(${pullDistance}px)`,
                    transition: pulling.current ? 'none' : 'transform 0.2s ease-out',
                }}
            >
                {children}
            </div>
        </div>
    );
};
