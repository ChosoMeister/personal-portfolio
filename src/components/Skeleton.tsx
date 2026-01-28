
import React, { memo } from 'react';

// Enhanced Skeleton with shimmer effect
interface SkeletonProps {
    className?: string;
    shimmer?: boolean;
}

const SkeletonComponent: React.FC<SkeletonProps> = ({ className = '', shimmer = true }) => (
    <div className={`relative overflow-hidden bg-[color:var(--muted-surface)] rounded-lg ${className}`}>
        {shimmer && (
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        )}
    </div>
);

export const Skeleton = memo(SkeletonComponent);

// Summary Card Loading State
export const SummaryCardSkeleton = memo(() => (
    <div className="bg-[var(--card-bg)] border border-[color:var(--border-color)] rounded-[32px] p-6 mb-4 h-[300px] flex flex-col justify-between overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/5 blur-[80px] rounded-full" />

        <div className="flex justify-between items-start">
            <div className="flex flex-col gap-2">
                <Skeleton className="w-32 h-5 rounded-lg" />
                <Skeleton className="w-20 h-4 rounded-md" />
            </div>
            <Skeleton className="w-12 h-12 rounded-2xl" />
        </div>

        <div className="flex flex-col items-center gap-3">
            <Skeleton className="w-56 h-12 rounded-xl" />
            <Skeleton className="w-32 h-6 rounded-lg" />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="bg-[color:var(--muted-surface)] rounded-2xl p-4 space-y-2">
                <Skeleton className="w-20 h-3 rounded-md" />
                <Skeleton className="w-28 h-5 rounded-lg" />
            </div>
            <div className="bg-[color:var(--muted-surface)] rounded-2xl p-4 space-y-2">
                <Skeleton className="w-20 h-3 rounded-md" />
                <Skeleton className="w-28 h-5 rounded-lg" />
            </div>
        </div>
    </div>
));
SummaryCardSkeleton.displayName = 'SummaryCardSkeleton';

// Asset Row Loading State
export const AssetRowSkeleton = memo(() => (
    <div className="p-5 flex items-center justify-between border-b border-[color:var(--border-color)] bg-[var(--card-bg)]">
        <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-2xl" />
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Skeleton className="w-24 h-4 rounded-md" />
                    <Skeleton className="w-10 h-4 rounded-md" />
                </div>
                <Skeleton className="w-16 h-3 rounded-md" />
                <Skeleton className="w-28 h-3 rounded-md" />
            </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
            <Skeleton className="w-24 h-4 rounded-md" />
            <Skeleton className="w-16 h-6 rounded-lg" />
            <Skeleton className="w-20 h-3 rounded-md" />
        </div>
    </div>
));
AssetRowSkeleton.displayName = 'AssetRowSkeleton';

// Transaction Row Loading State
export const TransactionRowSkeleton = memo(() => (
    <div className="bg-[var(--card-bg)] border border-[color:var(--border-color)] p-5 rounded-3xl flex justify-between items-center">
        <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-2">
                <Skeleton className="w-28 h-4 rounded-md" />
                <Skeleton className="w-20 h-3 rounded-md" />
            </div>
        </div>
        <Skeleton className="w-16 h-5 rounded-md" />
    </div>
));
TransactionRowSkeleton.displayName = 'TransactionRowSkeleton';

// Chart Loading State
export const ChartSkeleton = memo(() => (
    <div className="bg-[var(--card-bg)] border border-[color:var(--border-color)] rounded-[32px] p-5 mb-4">
        <Skeleton className="w-28 h-5 rounded-md mb-4" />
        <div className="flex items-center gap-4">
            <div className="w-1/2 flex items-center justify-center">
                <Skeleton className="w-32 h-32 rounded-full" />
            </div>
            <div className="w-1/2 space-y-3">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Skeleton className="w-3 h-3 rounded-sm" />
                            <Skeleton className="w-16 h-3 rounded-md" />
                        </div>
                        <Skeleton className="w-10 h-3 rounded-md" />
                    </div>
                ))}
            </div>
        </div>
    </div>
));
ChartSkeleton.displayName = 'ChartSkeleton';

// Multiple Skeleton Rows
interface SkeletonListProps {
    count?: number;
    type?: 'asset' | 'transaction';
}

export const SkeletonList = memo<SkeletonListProps>(({ count = 5, type = 'asset' }) => (
    <div className="space-y-0">
        {Array.from({ length: count }).map((_, i) => (
            type === 'asset' ? (
                <AssetRowSkeleton key={i} />
            ) : (
                <TransactionRowSkeleton key={i} />
            )
        ))}
    </div>
));
SkeletonList.displayName = 'SkeletonList';
