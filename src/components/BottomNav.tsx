import React, { memo, useCallback } from 'react';
import { LayoutDashboard, PieChart, History } from 'lucide-react';
import { useHaptics } from '../hooks/useHaptics';

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'holdings', label: 'دارایی‌ها', icon: PieChart },
  { id: 'overview', label: 'نگاه کلی', icon: LayoutDashboard },
  { id: 'transactions', label: 'تراکنش‌ها', icon: History },
];

const BottomNavComponent: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const { haptic } = useHaptics();

  const handleTabChange = useCallback((tabId: string) => {
    haptic('selection');
    onTabChange(tabId);
  }, [haptic, onTabChange]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 z-[60] pb-safe">
      <div className="rounded-[32px] flex justify-around items-center py-4 px-2 glass-panel shadow-[0_8px_32px_rgba(59,130,246,0.3)] border-t border-[var(--glass-border)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 relative px-4 ${isActive
                ? 'text-[var(--accent-color)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
            >
              <div
                className={`transition-all duration-500 rounded-full flex items-center justify-center p-2
                  ${isActive ? 'bg-[var(--accent-color)]/20 shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'bg-[var(--muted-surface)]'}
                `}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[9px] font-black tracking-wide ${isActive ? 'opacity-100 text-[var(--accent-color)]' : 'opacity-70'}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-2 w-1 h-1 bg-[var(--accent-color)] rounded-full shadow-[0_0_8px_var(--accent-color)]"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const BottomNav = memo(BottomNavComponent);
