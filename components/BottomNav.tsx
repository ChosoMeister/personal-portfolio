import React, { memo, useCallback } from 'react';
import { LayoutDashboard, PieChart, History } from 'lucide-react';
import { useHaptics } from '../hooks/useHaptics';

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'overview', label: 'نگاه کلی', icon: LayoutDashboard },
  { id: 'holdings', label: 'دارایی‌ها', icon: PieChart },
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
      <div className="rounded-[32px] flex justify-around items-center py-4 px-2 shadow-2xl backdrop-blur-3xl backdrop-saturate-150 bg-[var(--card-bg)]/90 border border-[var(--border-color)] transition-all duration-300">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 relative px-4 ${isActive ? 'text-[var(--accent-color)] scale-110' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              style={isActive ? { filter: 'drop-shadow(0 0 8px var(--accent-color))' } : {}}
            >
              <div className={`p-1.5 rounded-full transition-all duration-500 ${isActive ? 'bg-[var(--accent-color)]/20' : 'bg-[var(--muted-surface)]'}`}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[9px] font-black tracking-wide ${isActive ? 'opacity-100 text-[var(--text-primary)]' : 'opacity-70'}`}>
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
