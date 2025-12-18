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
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-[60] pb-safe">
      <div className="bg-[color:var(--card-bg)]/85 backdrop-blur-md border-t border-[color:var(--border-color)] flex justify-around items-center px-4 py-4 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center space-y-1.5 transition-all duration-300 relative group ${
                isActive ? 'text-blue-600 scale-110' : 'text-[color:var(--text-muted)]'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] font-bold ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute -top-1 w-1 h-1 bg-blue-600 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
