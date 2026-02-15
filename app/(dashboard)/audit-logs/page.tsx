'use client';

import { useState } from 'react';
import { useGetAuditLogsQuery } from '@/lib/api/auditLogApi';
import { formatDateTime } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import { ScrollText, Filter } from 'lucide-react';
import clsx from 'clsx';

const ITEMS_PER_PAGE = 15;

export default function AuditLogsPage() {
  const [entityType, setEntityType] = useState<string>('');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useGetAuditLogsQuery(entityType || undefined);

  const logs = data?.data || [];
  const paginatedLogs = logs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-blue-50 text-blue-700';
      case 'UPDATE':
        return 'bg-amber-50 text-amber-700';
      case 'DELETE':
        return 'bg-red-50 text-red-700';
      case 'APPROVE':
        return 'bg-emerald-50 text-emerald-700';
      case 'REJECT':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-slate-50 text-slate-700';
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <EmptyState title="Gagal memuat audit log" description="Pastikan backend berjalan dan coba refresh" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Audit Log</h2>
          <p className="text-sm text-slate-500 mt-1">{logs.length} log ditemukan</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select
            value={entityType}
            onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="">Semua Tipe</option>
            <option value="invoice">Invoice</option>
            <option value="expense">Expense</option>
            <option value="budget_request">Budget Request</option>
            <option value="project">Project</option>
          </select>
        </div>
      </div>

      {logs.length === 0 ? (
        <EmptyState title="Belum ada audit log" description="Aktivitas sistem akan tercatat di sini" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Waktu</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">User</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Aksi</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Entitas</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-semibold">
                          {log.user?.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="text-sm text-slate-700">{log.user?.full_name || `User #${log.user_id}`}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx('text-xs font-semibold px-2.5 py-1 rounded-lg', getActionColor(log.action))}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <ScrollText size={14} className="text-slate-400" />
                        <span className="text-sm text-slate-700">{log.entity_type} #{log.entity_id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={page}
            totalItems={logs.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
