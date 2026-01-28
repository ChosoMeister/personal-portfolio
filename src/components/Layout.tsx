import React from 'react';
import { NetworkStatus } from './NetworkStatus';

interface LayoutProps {
  children: React.ReactNode;
  theme: 'light' | 'dark' | 'amoled' | 'sunset' | 'ocean' | 'forest';
}

export const Layout: React.FC<LayoutProps> = ({ children, theme }) => {
  return (
    <div
      className="app-container text-[color:var(--text-primary)] transition-colors duration-300"
      data-theme={theme}
    >
      <NetworkStatus />
      <main className="tab-content no-scrollbar relative z-10">
        {children}
      </main>
    </div>
  );
};
