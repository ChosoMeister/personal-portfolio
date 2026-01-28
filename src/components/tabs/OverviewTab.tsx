
import React, { memo } from 'react';
import { Shield, Sparkles, UserCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PullToRefresh } from '../PullToRefresh';
import { SummaryCard } from '../SummaryCard';
import { AllocationChart } from '../AllocationChart';
import { SummaryCardSkeleton } from '../Skeleton';
import { PortfolioSummary, PriceData } from '../../types';
import { formatPercent } from '../../utils/formatting';

interface OverviewTabProps {
    displayName: string;
    username: string;
    userIsAdmin: boolean;
    loading: boolean;
    isPriceUpdating: boolean;
    portfolioSummary: PortfolioSummary;
    prices: PriceData | null;
    sources: { title: string; uri: string }[];
    resolvedTheme: string;
    onRefresh: () => Promise<void>;
    onOpenSettings: () => void;
    onOpenAdminPanel: () => void;
    haptic: (style: 'medium') => void;
}

const OverviewTabComponent: React.FC<OverviewTabProps> = ({
    displayName,
    username,
    userIsAdmin,
    loading,
    isPriceUpdating,
    portfolioSummary,
    prices,
    sources,
    resolvedTheme,
    onRefresh,
    onOpenSettings,
    onOpenAdminPanel,
    haptic
}) => {
    const cardSurface = 'glass-panel text-[var(--text-primary)] transition-all hover:border-[var(--glass-border)] hover:shadow-lg';
    const sourceContainerTone = 'glass-panel mt-4';
    const sourceBadgeTone = 'bg-[var(--glass-border)]/10 border border-[var(--glass-border)] text-[var(--accent-primary)] hover:bg-[var(--glass-border)]/20';

    const [showSources, setShowSources] = React.useState(false);

    const handleRefresh = async () => {
        haptic('medium');
        setShowSources(true);
        await onRefresh();
    };

    return (
        <PullToRefresh onRefresh={handleRefresh} disabled={isPriceUpdating}>
            <div className="p-4 pb-20 space-y-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <Shield size={20} className="text-white" />
                        </div>
                        <div>
                            <span className="font-black text-[var(--text-primary)] text-xl tracking-tight block leading-none">
                                {displayName || 'پنل مدیریت'}
                            </span>
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <span className="text-[11px] text-[var(--accent-primary)] font-bold uppercase tracking-wide">{username}</span>
                                <span className="text-[9px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-lg border border-indigo-500/20 hidden sm:flex items-center gap-1">
                                    <Sparkles size={8} /> AI Powered
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                haptic('medium');
                                onOpenSettings();
                            }}
                            className="bg-[var(--glass-border)]/10 border border-[var(--glass-border)] p-2.5 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--glass-border)]/20 transition-all active:scale-95"
                            aria-label="تنظیمات حساب"
                        >
                            <UserCircle size={20} />
                        </button>
                        {userIsAdmin && (
                            <button
                                onClick={onOpenAdminPanel}
                                className="bg-[var(--glass-border)]/10 border border-[var(--glass-border)] p-2.5 rounded-xl text-amber-500 hover:bg-[var(--glass-border)]/20 transition-all active:scale-95"
                            >
                                <UserCircle size={20} />
                            </button>
                        )}
                        <button
                            onClick={handleRefresh}
                            disabled={isPriceUpdating}
                            className={`relative overflow-hidden group flex items-center gap-2 bg-[var(--accent-primary)] text-white text-[10px] font-black px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 active:scale-95 transition-all ${isPriceUpdating ? 'animate-pulse opacity-80' : ''
                                }`}
                        >
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                            <Sparkles size={14} className={isPriceUpdating ? 'animate-spin' : ''} />
                            <span>بروزرسانی</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <SummaryCardSkeleton />
                ) : (
                    <>
                        <SummaryCard
                            summary={portfolioSummary}
                            isRefreshing={isPriceUpdating}
                            lastUpdated={prices?.fetchedAt || Date.now()}
                            onRefresh={handleRefresh}
                            prices={prices}
                        />
                        <AllocationChart summary={portfolioSummary} />
                    </>
                )}

                {/* Sources: Shown when explicitly updated */}
                {showSources && sources.length > 0 && (
                    <div className={`p-4 rounded-[24px] flex flex-col gap-3 ${sourceContainerTone} animate-in slide-in-from-top-2 duration-300`}>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                            منابع معتبر قیمت گذاری:
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {sources.map((s, i) => (
                                <a
                                    key={i}
                                    href={s.uri}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all ${sourceBadgeTone}`}
                                >
                                    {s.title?.slice(0, 30) || s.uri}
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className={`${cardSurface} p-5 rounded-[28px] flex flex-col justify-between h-36 relative overflow-hidden group`}>
                        <div className="relative z-10">
                            <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-wider mb-1">
                                <ArrowUpRight size={14} />
                                <span>بهترین عملکرد</span>
                            </div>
                            {portfolioSummary.assets[0] ? (
                                <div className="mt-2">
                                    <div className="font-black text-[color:var(--text-primary)] text-sm truncate">
                                        {portfolioSummary.assets[0].name}
                                    </div>
                                    <div className="text-emerald-500 text-xs font-black mt-1" dir="ltr">
                                        {formatPercent(portfolioSummary.assets[0].pnlPercent)}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-gray-300 text-xs mt-2 font-bold">دیتا موجود نیست</div>
                            )}
                        </div>
                    </div>
                    <div className={`${cardSurface} p-5 rounded-[28px] shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group`}>
                        <div className="relative z-10">
                            <div className="flex items-center gap-1.5 text-rose-600 font-black text-[10px] uppercase tracking-wider mb-1">
                                <ArrowDownRight size={14} />
                                <span>ضعیف‌ترین عملکرد</span>
                            </div>
                            {portfolioSummary.assets.length > 1 ? (
                                <div className="mt-2">
                                    <div className="font-black text-[color:var(--text-primary)] text-sm truncate">
                                        {portfolioSummary.assets[portfolioSummary.assets.length - 1].name}
                                    </div>
                                    <div className="text-rose-500 text-xs font-black mt-1" dir="ltr">
                                        {formatPercent(
                                            portfolioSummary.assets[portfolioSummary.assets.length - 1].pnlPercent
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-gray-300 text-xs mt-2 font-bold">دیتا موجود نیست</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </PullToRefresh>
    );
};

export const OverviewTab = memo(OverviewTabComponent);
