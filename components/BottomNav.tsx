import React, { memo, useCallback } from 'react';
import { LayoutDashboard, PieChart, History, BarChart3 } from 'lucide-react';
import { useHaptics } from '../hooks/useHaptics';

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'overview', label: 'نگاه کلی', icon: LayoutDashboard },
  { id: 'holdings', label: 'دارایی‌ها', icon: PieChart },
  { id: 'analytics', label: 'تحلیل‌ها', icon: BarChart3 },
  { id: 'transactions', label: 'تراکنش‌ها', icon: History },
];

const BottomNavComponent: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const { haptic } = useHaptics();

  const handleTabChange = useCallback((tabId: string) => {
    haptic('selection');
    onTabChange(tabId);
  }, [haptic, onTabChange]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[520px] px-6 z-[60] pb-safe">
      <div className="rounded-[32px] flex justify-around items-center py-4 px-2 shadow-2xl backdrop-blur-3xl backdrop-saturate-150 bg-white/40 dark:bg-black/30 border border-white/20 dark:border-white/10 ring-1 ring-white/30 dark:ring-white/5 transition-all duration-300">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 relative px-4 ${isActive ? 'text-blue-600 dark:text-blue-300 scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.55)]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
            >
              <div className={`p-1.5 rounded-full transition-all duration-500 ${isActive ? 'bg-blue-100/90 dark:bg-blue-500/20 shadow-[0_0_25px_rgba(59,130,246,0.35)]' : 'bg-white/40 dark:bg-white/5'}`}>
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

export const BottomNav = memo(BottomNavComponent);
