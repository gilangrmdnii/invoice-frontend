'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import AuthGuard from '@/components/layout/AuthGuard';
import { useSSE } from '@/lib/hooks/useSSE';
import clsx from 'clsx';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  useSSE();

  // Auto-close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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
        <div className={clsx('lg:hidden fixed left-0 top-0 z-40 transition-transform duration-300', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
          <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
        </div>

        {/* Sidebar - desktop */}
        <div className="hidden lg:block">
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        </div>

        {/* Main Content */}
        <div className={clsx('transition-all duration-300', collapsed ? 'lg:ml-[72px]' : 'lg:ml-64')}>
          <Header onMenuClick={() => setMobileOpen(true)} />
          <main className="px-4 py-5 sm:p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
