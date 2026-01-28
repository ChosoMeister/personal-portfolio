
import React from 'react';
import { PackageOpen, Wallet, History, PieChart, Plus } from 'lucide-react';

type EmptyStateType = 'holdings' | 'transactions' | 'chart' | 'default';

interface EmptyStateProps {
    type?: EmptyStateType;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

const iconMap: Record<EmptyStateType, React.ComponentType<{ size: number; strokeWidth: number; className?: string }>> = {
    holdings: Wallet,
    transactions: History,
    chart: PieChart,
    default: PackageOpen,
};

export const EmptyState: React.FC<EmptyStateProps> = ({
    type = 'default',
    title,
    description,
    actionLabel,
    onAction
}) => {
    const Icon = iconMap[type];

    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-in fade-in duration-500">
            {/* Animated icon container */}
            <div className="relative mb-6">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-violet-500/20 rounded-full blur-2xl scale-150 animate-pulse"></div>

                {/* Icon circle */}
                <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500/10 to-violet-500/10 rounded-full flex items-center justify-center border border-blue-500/20 shadow-xl backdrop-blur-sm">
                    <Icon size={36} strokeWidth={1.5} className="text-blue-500 dark:text-blue-400" />
                </div>

                {/* Decorative dots */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-violet-500 rounded-full animate-bounce delay-300"></div>
            </div>

            {/* Title */}
            <h3 className="text-[color:var(--text-primary)] font-black text-xl mb-3 tracking-tight">
                {title}
            </h3>

            {/* Description */}
            <p className="text-[color:var(--text-muted)] text-sm max-w-[80%] leading-relaxed mb-8">
                {description}
            </p>

            {/* CTA Button */}
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="group relative overflow-hidden flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold px-6 py-3.5 rounded-2xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-95 transition-all"
                >
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
                    <Plus size={18} strokeWidth={2.5} />
                    <span>{actionLabel}</span>
                </button>
            )}
        </div>
    );
};
