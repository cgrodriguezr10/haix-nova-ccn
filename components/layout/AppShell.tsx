'use client';

import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAppStore } from '@/store/useAppStore';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useAppStore();

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#0D1B2A' }}>
      <Sidebar />
      <div
        className="flex flex-col flex-1 overflow-hidden transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? '64px' : '240px' }}
      >
        <TopBar />
        <main
          className="flex-1 overflow-y-auto p-6"
          style={{ backgroundColor: '#0D1B2A' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
