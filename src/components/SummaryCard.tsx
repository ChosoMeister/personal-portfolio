
import React, { memo } from 'react';
import { PortfolioSummary } from '../types';
import { formatToman, formatPercent, formatNumber } from '../utils/formatting';
import { RefreshCw, Wallet, Clock } from 'lucide-react';
import { AnimatedToman, AnimatedPercent } from './AnimatedNumber';

interface SummaryCardProps {
  summary: PortfolioSummary;
  isRefreshing: boolean;
  lastUpdated: number;
  onRefresh: () => void;
  prices?: any;
}

const SummaryCardComponent: React.FC<SummaryCardProps> = ({ summary, isRefreshing, lastUpdated, onRefresh, prices }) => {
  const isProfit = summary.totalPnlToman >= 0;

  // Dynamic font size based on number magnitude to prevent overflow
  const getValueFontSize = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 10_000_000_000_000) return 'text-lg'; // 10+ trillion
    if (absValue >= 1_000_000_000_000) return 'text-xl';  // 1+ trillion  
    if (absValue >= 100_000_000_000) return 'text-2xl';   // 100+ billion
    if (absValue >= 10_000_000_000) return 'text-3xl';    // 10+ billion
    if (absValue >= 1_000_000_000) return 'text-4xl';     // 1+ billion
    return 'text-5xl'; // Default for smaller numbers
  };

  const valueFontSize = getValueFontSize(summary.totalValueToman);

  return (
    <div className="glass-panel mb-6 rounded-[32px] p-6 relative overflow-hidden transition-all duration-300 bg-black/5 dark:bg-black/20">

      <div className="relative z-10">
        {/* Header with Wallet Icon and PnL */}
        <div className="flex justify-between items-center mb-6">
          <div className={`p-3 rounded-2xl shadow-lg shadow-black/5 ${isProfit ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
            <Wallet size={24} />
          </div>
          <div className="text-right">
            <div className="flex flex-col items-end gap-0.5 sm:flex-row sm:items-center sm:gap-2 justify-end">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${isProfit ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                {formatPercent(summary.totalPnlPercent)} {isProfit ? '↗' : '↘'}
              </span>
              <span className={`text-lg sm:text-2xl font-black tracking-tight ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                {formatToman(Math.abs(summary.totalPnlToman))}
              </span>
            </div>
            <span className="text-[var(--text-secondary)] text-[11px] font-bold uppercase tracking-widest">ارزش فعلی سبد دارایی</span>
          </div>
        </div>

        {/* Main Value */}
        <div className="flex flex-col items-center mb-8">
          <h2 className={`${valueFontSize} font-black text-[var(--text-primary)] tracking-tighter drop-shadow-sm transition-colors duration-300`}>
            <AnimatedToman value={summary.totalValueToman} showSuffix={false} />
            <span className="text-xl sm:text-2xl text-[var(--text-secondary)] mr-2 font-bold">تومان</span>
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[var(--glass-border)]/10 rounded-2xl p-4 border border-[var(--glass-border)]">
            <p className="text-[var(--text-secondary)] text-[10px] font-bold mb-1">سرمایه‌گذاری اولیه</p>
            <p className="text-[var(--text-primary)] font-black text-lg">{formatToman(summary.totalCostBasisToman)} <span className="text-[10px] opacity-70">تومان</span></p>
          </div>
          <div className="bg-[var(--glass-border)]/10 rounded-2xl p-4 border border-[var(--glass-border)]">
            <p className="text-[var(--text-secondary)] text-[10px] font-bold mb-1">سود/ضرر کل</p>
            <p className={`${isProfit ? 'text-emerald-500' : 'text-rose-500'} font-black text-lg`} dir="ltr">{isProfit ? '+' : ''}{formatToman(summary.totalPnlToman)} <span className="text-[10px] opacity-70">تومان</span></p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] font-bold text-[var(--text-secondary)] px-2">
          <div className="flex items-center gap-1.5 bg-[var(--glass-border)]/20 px-3 py-1.5 rounded-full" dir="ltr">
            <Clock size={12} />
            <span>{new Date(lastUpdated).toLocaleTimeString('fa-IR')} • {new Date(lastUpdated).toLocaleDateString('fa-IR')}</span>
          </div>
          {prices && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400" dir="ltr">
                <span>طلای ۱۸</span>
                <span className="font-black">{formatNumber(prices.gold18ToToman || 0, 0)}</span>
              </span>
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400" dir="ltr">
                <span>دلار</span>
                <span className="font-black">{formatNumber(prices.usdToToman || 0, 0)}</span>
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export const SummaryCard = memo(SummaryCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.summary.totalValueToman === nextProps.summary.totalValueToman &&
    prevProps.summary.totalPnlToman === nextProps.summary.totalPnlToman &&
    prevProps.isRefreshing === nextProps.isRefreshing &&
    prevProps.lastUpdated === nextProps.lastUpdated
  );
});
