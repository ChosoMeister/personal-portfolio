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
      <div className="glass-strong rounded-3xl flex justify-around items-center py-4 px-2 shadow-2xl backdrop-blur-2xl bg-black/40 border border-white/10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 relative px-4 ${isActive ? 'text-blue-400 scale-110' : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <div className={`p-1.5 rounded-full transition-all duration-500 ${isActive ? 'bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-transparent'}`}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[9px] font-black tracking-wide ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
