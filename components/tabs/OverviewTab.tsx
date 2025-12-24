
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
    const cardSurface = 'bg-[var(--card-bg)] border border-[color:var(--border-color)] text-[color:var(--text-primary)]';
    const sourceContainerTone = resolvedTheme === 'dark'
        ? 'bg-gradient-to-r from-blue-950/50 via-blue-900/40 to-indigo-900/20 border-blue-900 text-blue-100'
        : 'bg-blue-50/60 border-blue-100 text-blue-600';
    const sourceBadgeTone = resolvedTheme === 'dark'
        ? 'bg-blue-900/60 border-blue-800 text-blue-100 hover:bg-blue-800'
        : 'bg-white border-blue-100 text-blue-600 hover:bg-blue-100';

    return (
        <PullToRefresh onRefresh={onRefresh} disabled={isPriceUpdating}>
            <div className="p-4 space-y-4 animate-in fade-in duration-500 pb-20">
                <div className="flex justify-between items-center mb-2 px-1">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <Shield size={16} className="text-white" />
                        </div>
                        <div>
                            <span className="font-black text-[color:var(--text-primary)] text-lg tracking-tight block leading-none">
                                {displayName || 'پنل مدیریت'}
                            </span>
                            <div className="flex items-center gap-1 mt-1">
                                <span className="text-[10px] text-blue-600 font-bold uppercase">{username}</span>
                                <span className="text-[8px] bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 px-1.5 py-0.5 rounded hidden sm:flex items-center gap-0.5 border border-violet-200 dark:border-violet-500/20">
                                    <Sparkles size={8} /> Powered by AI
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
                            className={`${cardSurface} p-2.5 rounded-xl hover:opacity-90 transition-all`}
                            aria-label="تنظیمات حساب"
                        >
                            <UserCircle size={18} />
                        </button>
                        {userIsAdmin && (
                            <button
                                onClick={onOpenAdminPanel}
                                className={`${cardSurface} p-2.5 rounded-xl text-amber-500 hover:opacity-90 transition-all`}
                            >
                                <UserCircle size={18} />
                            </button>
                        )}
                        <button
                            onClick={() => {
                                haptic('medium');
                                onRefresh();
                            }}
                            disabled={isPriceUpdating}
                            className={`relative overflow-hidden group flex items-center gap-2 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 text-white text-[10px] font-black px-4 py-2.5 rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 active:scale-95 transition-all ${isPriceUpdating ? 'animate-pulse opacity-80' : ''
                                }`}
                        >
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                            <Sparkles size={14} className={isPriceUpdating ? 'animate-spin' : ''} />
                            <span>بروزرسانی هوشمند</span>
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
                            onRefresh={onRefresh}
                            prices={prices}
                        />
                        <AllocationChart summary={portfolioSummary} />
                    </>
                )}

                {sources.length > 0 && (
                    <div className={`p-4 rounded-3xl border flex flex-col gap-3 mx-1 ${sourceContainerTone}`}>
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            منابع معتبر قیمت گذاری:
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {sources.map((s, i) => (
                                <a
                                    key={i}
                                    href={s.uri}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`px-3 py-2 rounded-xl border text-[9px] font-bold transition-colors shadow-sm ${sourceBadgeTone}`}
                                >
                                    {s.title?.slice(0, 30) || s.uri}
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <div className={`${cardSurface} p-5 rounded-[28px] shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group`}>
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
                    <div className={`${cardSurface} p-5 rounded-[28px] shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group`}>
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
