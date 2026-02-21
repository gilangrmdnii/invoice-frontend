'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useGetUnreadCountQuery } from '@/lib/api/notificationApi';
import { useAppSelector } from '@/lib/hooks';
import { Bell, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/projects': 'Proyek',
  '/invoices': 'Invoice',
  '/notifications': 'Notifikasi',
  '/audit-logs': 'Audit Log',
};

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);
  const { data: unreadData } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 30000,
  });

  const unreadCount = unreadData?.data?.count || 0;

  const getTitle = () => {
    for (const [path, title] of Object.entries(pageTitles)) {
      if (pathname === path || pathname.startsWith(path + '/')) return title;
    }
    return 'Dashboard';
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-slate-900">{getTitle()}</h1>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/notifications')}
          className="relative p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
            {user?.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium text-slate-900">{user?.full_name}</div>
            <div className="text-xs text-slate-500">{user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
