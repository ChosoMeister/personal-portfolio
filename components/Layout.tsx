import React from 'react';
import { NetworkStatus } from './NetworkStatus';

interface LayoutProps {
  children: React.ReactNode;
  theme: 'light' | 'dark' | 'amoled' | 'sunset' | 'ocean' | 'forest';
}

export const Layout: React.FC<LayoutProps> = ({ children, theme }) => {
  return (
    <div
      className="flex flex-col h-screen relative overflow-hidden transition-colors duration-300 bg-[var(--app-bg)] text-[color:var(--text-primary)]"
      data-theme={theme}
    >
      <NetworkStatus />
      <main className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        {children}
      </main>
    </div>
  );
};
