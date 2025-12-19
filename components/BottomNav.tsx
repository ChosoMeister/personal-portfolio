import React from 'react';
import { LayoutDashboard, PieChart, History } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const tabs = [
    { id: 'overview', label: 'نگاه کلی', icon: LayoutDashboard },
    { id: 'holdings', label: 'دارایی‌ها', icon: PieChart },
    { id: 'transactions', label: 'تراکنش‌ها', icon: History },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-6 z-[60] pb-safe">
      <div className="rounded-3xl flex justify-around items-center py-4 px-2 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-[32px] saturate-150 bg-white/55 dark:bg-white/10 border border-white/50 dark:border-white/10 ring-1 ring-white/40 dark:ring-white/5 glass-strong">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 relative px-4 ${isActive ? 'text-blue-600 dark:text-blue-400 scale-110' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
            >
              <div className={`p-1.5 rounded-full transition-all duration-500 ${isActive ? 'bg-blue-100 dark:bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-transparent'}`}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[9px] font-black tracking-wide ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
