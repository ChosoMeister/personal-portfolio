
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

  return (
    <div className="relative overflow-hidden mb-4 rounded-[32px] border border-[var(--border-color)] shadow-2xl transition-colors duration-300">
      {/* Refined subtle background */}
      <div className="absolute inset-0 bg-[var(--card-bg)] transition-colors duration-300"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--accent-color)]/10 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[var(--accent-color)]/5 blur-[120px] rounded-full pointer-events-none translate-y-1/2 -translate-x-1/2"></div>

      {/* Apple Liquid Glass Overlay */}
      <div className="glass-strong relative p-6">

        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <div className={`p-3 rounded-2xl backdrop-blur-md ${isProfit ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
              <Wallet size={24} />
            </div>
            <div className="text-right">
              <div className="flex flex-col items-end gap-0.5 sm:flex-row sm:items-center sm:gap-2 justify-end">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${isProfit ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                  {formatPercent(summary.totalPnlPercent)} {isProfit ? '↗' : '↘'}
                </span>
                <span className={`text-lg sm:text-2xl font-black tracking-tight ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {formatToman(Math.abs(summary.totalPnlToman))}
                </span>
              </div>
              <span className="text-[var(--text-muted)] text-[11px] font-black uppercase tracking-widest">ارزش فعلی سبد دارایی</span>
            </div>
          </div>

          <div className="flex flex-col items-center mb-8">
            <h2 className="text-5xl font-black text-[var(--text-primary)] tracking-tighter drop-shadow-sm transition-colors duration-300">
              <AnimatedToman value={summary.totalValueToman} showSuffix={false} />
              <span className="text-2xl text-[var(--text-muted)] mr-2 font-bold">تومان</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[var(--muted-surface)] rounded-2xl p-4 border border-[var(--border-color)] backdrop-blur-sm">
              <p className="text-[var(--text-muted)] text-[10px] font-bold mb-1">سرمایه‌گذاری اولیه</p>
              <p className="text-[var(--text-primary)] font-black text-lg">{formatToman(summary.totalCostBasisToman)} <span className="text-[10px] opacity-70">تومان</span></p>
            </div>
            <div className="bg-[var(--muted-surface)] rounded-2xl p-4 border border-[var(--border-color)] backdrop-blur-sm">
              <p className="text-[var(--text-muted)] text-[10px] font-bold mb-1">سود/ضرر کل</p>
              <p className={`${isProfit ? 'text-emerald-500' : 'text-rose-500'} font-black text-lg`} dir="ltr">{isProfit ? '+' : ''}{formatToman(summary.totalPnlToman)} <span className="text-[10px] opacity-70">تومان</span></p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] font-bold text-[var(--text-muted)] px-2">
            <div className="flex items-center gap-1.5 bg-[var(--muted-surface)] px-3 py-1.5 rounded-full" dir="ltr">
              <Clock size={12} />
              <span>{new Date(lastUpdated).toLocaleTimeString('fa-IR')} • {new Date(lastUpdated).toLocaleDateString('fa-IR')}</span>
            </div>
            {prices && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 backdrop-blur-md" dir="ltr">
                  <span>طلای ۱۸ (گرم)</span>
                  <span className="font-black">ت {formatNumber(prices.gold18ToToman || 0, 0)}</span>
                </span>
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 backdrop-blur-md" dir="ltr">
                  <span>دلار آزاد</span>
                  <span className="font-black">ت {formatNumber(prices.usdToToman || 0, 0)}</span>
                </span>
              </div>
            )}
          </div>

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
