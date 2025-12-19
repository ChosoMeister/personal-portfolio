
import React from 'react';
import { PortfolioSummary } from '../types';
import { formatToman, formatPercent, formatNumber } from '../utils/formatting';
import { RefreshCw, Wallet, Clock } from 'lucide-react';

interface SummaryCardProps {
  summary: PortfolioSummary;
  isRefreshing: boolean;
  lastUpdated: number;
  onRefresh: () => void;
  prices?: any;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary, isRefreshing, lastUpdated, onRefresh, prices }) => {
  const isProfit = summary.totalPnlToman >= 0;

  return (
    <div className="relative overflow-hidden mb-4 rounded-[32px] border border-black/5 dark:border-white/5 shadow-2xl transition-colors duration-300">
      {/* Refined subtle background */}
      <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/50 transition-colors duration-300"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none translate-y-1/2 -translate-x-1/2"></div>

      {/* Apple Liquid Glass Overlay */}
      <div className="glass-strong relative p-6">

        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <div className={`p-3 rounded-2xl ${isProfit ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'} backdrop-blur-md`}>
              <Wallet size={24} />
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${isProfit ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'}`}>
                  {formatPercent(summary.totalPnlPercent)} {isProfit ? '↗' : '↘'}
                </span>
                <span className={`text-2xl font-black tracking-tight ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {formatToman(Math.abs(summary.totalPnlToman))}
                </span>
              </div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] font-black uppercase tracking-widest">ارزش فعلی سبد دارایی</span>
            </div>
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`ripple p-2.5 rounded-2xl bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 border border-black/5 dark:border-white/10 transition-all active:scale-95 ${isRefreshing ? 'animate-spin opacity-50' : ''}`}
            >
              <RefreshCw size={16} className="text-slate-600 dark:text-slate-300" />
            </button>
          </div>

          <div className="flex flex-col items-center mb-8">
            <h2 className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter drop-shadow-sm transition-colors duration-300">
              {formatToman(summary.totalValueToman)}
              <span className="text-2xl text-slate-400 dark:text-slate-500 mr-2 font-bold">تومان</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/50 dark:bg-white/5 rounded-2xl p-4 border border-white/20 dark:border-white/5 backdrop-blur-sm">
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold mb-1">سرمایه‌گذاری اولیه</p>
              <p className="text-slate-700 dark:text-slate-200 font-black text-lg">{formatToman(summary.totalCostBasisToman)} <span className="text-[10px] opacity-70">تومان</span></p>
            </div>
            <div className="bg-white/50 dark:bg-white/5 rounded-2xl p-4 border border-white/20 dark:border-white/5 backdrop-blur-sm">
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold mb-1">سود/ضرر کل</p>
              <p className={`${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} font-black text-lg`} dir="ltr">{isProfit ? '+' : ''}{formatToman(summary.totalPnlToman)} <span className="text-[10px] opacity-70">تومان</span></p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 px-2">
            <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-full" dir="ltr">
              <Clock size={12} />
              <span>{new Date(lastUpdated).toLocaleTimeString('fa-IR')} • {new Date(lastUpdated).toLocaleDateString('fa-IR')}</span>
            </div>
            {prices && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 dark:text-yellow-400 dark:border-yellow-500/20 backdrop-blur-md" dir="ltr">
                  <span className="text-yellow-700 dark:text-yellow-400">طلای ۱۸ (گرم)</span>
                  <span className="font-black">ت {formatNumber(prices.gold18ToToman || 0, 0)}</span>
                </span>
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 dark:border-emerald-500/20 backdrop-blur-md" dir="ltr">
                  <span className="text-emerald-700 dark:text-emerald-400">دلار آزاد</span>
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
