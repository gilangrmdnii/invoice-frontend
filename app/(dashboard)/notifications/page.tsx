'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from '@/lib/api/notificationApi';
import { formatDateTime } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import {
  Bell,
  CheckCheck,
  FileText,
  Receipt,
  Wallet,
  AlertCircle,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 15;

export default function NotificationsPage() {
  const router = useRouter();
  const { data, isLoading, isError } = useGetNotificationsQuery();
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [page, setPage] = useState(1);

  const notifications = data?.data || [];
  const hasUnread = notifications.some((n) => !n.is_read);
  const paginated = notifications.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleClick = async (notif: typeof notifications[0]) => {
    if (!notif.is_read) {
      try {
        await markAsRead(notif.id).unwrap();
      } catch {
        // silently fail mark-as-read
      }
    }

    // Navigate to related resource
    const type = notif.type.toUpperCase();
    if (type.includes('INVOICE') && notif.reference_id) {
      router.push(`/invoices/${notif.reference_id}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap();
      toast.success('Semua notifikasi sudah dibaca');
    } catch {
      toast.error('Gagal menandai semua');
    }
  };

  const getIcon = (type: string) => {
    if (type.includes('INVOICE')) return <FileText size={18} className="text-indigo-500" />;
    if (type.includes('EXPENSE')) return <Receipt size={18} className="text-amber-500" />;
    if (type.includes('BUDGET')) return <Wallet size={18} className="text-emerald-500" />;
    return <AlertCircle size={18} className="text-slate-400" />;
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <EmptyState title="Gagal memuat notifikasi" description="Pastikan backend berjalan dan coba refresh" />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Notifikasi</h2>
          <p className="text-sm text-slate-500 mt-1">{notifications.length} notifikasi</p>
        </div>
        {hasUnread && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
          >
            <CheckCheck size={16} />
            Tandai Semua Dibaca
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          title="Belum ada notifikasi"
          description="Notifikasi akan muncul ketika ada aktivitas terkait"
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="divide-y divide-slate-50">
            {paginated.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={clsx(
                  'flex items-start gap-3 sm:gap-4 px-4 sm:px-6 py-4 transition-colors cursor-pointer',
                  notif.is_read ? 'bg-white hover:bg-slate-50' : 'bg-indigo-50/40 hover:bg-indigo-50/60'
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={clsx('text-sm', notif.is_read ? 'text-slate-600' : 'text-slate-900 font-medium')}>
                      {notif.title}
                    </p>
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-1">{notif.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatDateTime(notif.created_at)}</p>
                </div>
                <div className="flex-shrink-0 mt-1">
                  <Bell size={14} className="text-slate-300" />
                </div>
              </div>
            ))}
          </div>
          <Pagination
            currentPage={page}
            totalItems={notifications.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
