'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import AuthGuard from '@/components/layout/AuthGuard';
import clsx from 'clsx';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50">
        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-30 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar - mobile */}
        <div className={clsx('lg:hidden fixed z-40 transition-transform duration-300', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
          <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
        </div>

        {/* Sidebar - desktop */}
        <div className="hidden lg:block">
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        </div>

        {/* Main Content */}
        <div className={clsx('transition-all duration-300', collapsed ? 'lg:ml-[72px]' : 'lg:ml-64')}>
          <Header onMenuClick={() => setMobileOpen(true)} />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
