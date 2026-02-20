'use client';

import { useGetDashboardQuery } from '@/lib/api/dashboardApi';
import { formatCurrency, getBudgetPercentage } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import {
  FolderKanban,
  FileText,
  Receipt,
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const { data, isLoading, isError } = useGetDashboardQuery();

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <EmptyState title="Gagal memuat dashboard" description="Pastikan backend berjalan dan coba refresh" />;

  const d = data?.data;
  if (!d) return null;

  const budgetPct = getBudgetPercentage(d.budget.total_spent, d.budget.total_budget);

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl p-4 sm:p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-indigo-200 text-sm font-medium">Total Anggaran</p>
            <p className="text-2xl sm:text-3xl font-bold mt-1">{formatCurrency(d.budget.total_budget)}</p>
          </div>
          <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <Wallet className="w-7 h-7" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center gap-2 text-indigo-200 text-xs mb-1">
              <TrendingDown size={14} />
              Terpakai
            </div>
            <p className="text-lg font-semibold">{formatCurrency(d.budget.total_spent)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center gap-2 text-indigo-200 text-xs mb-1">
              <TrendingUp size={14} />
              Tersisa
            </div>
            <p className="text-lg font-semibold">{formatCurrency(d.budget.remaining)}</p>
          </div>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2.5">
          <div
            className="bg-white rounded-full h-2.5 transition-all duration-500"
            style={{ width: `${budgetPct}%` }}
          />
        </div>
        <p className="text-indigo-200 text-xs mt-2">{budgetPct}% anggaran terpakai</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Proyek"
          total={d.projects.total_projects}
          subtitle={`${d.projects.active_projects} aktif`}
          icon={<FolderKanban size={22} />}
          color="blue"
        />
        <StatCard
          title="Invoice"
          total={d.invoices.total_invoices}
          subtitle={formatCurrency(d.invoices.total_amount)}
          icon={<FileText size={22} />}
          color="violet"
        />
        <StatCard
          title="Pengeluaran"
          total={d.expenses.total_expenses}
          subtitle={`${d.expenses.pending_expenses} pending`}
          icon={<Receipt size={22} />}
          color="amber"
        />
        <StatCard
          title="Budget Request"
          total={d.budget_requests.total_requests}
          subtitle={`${d.budget_requests.pending_requests} pending`}
          icon={<Wallet size={22} />}
          color="emerald"
        />
      </div>

      {/* Detail Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatusBreakdown
          title="Pengeluaran"
          pending={d.expenses.pending_expenses}
          approved={d.expenses.approved_expenses}
          rejected={d.expenses.rejected_expenses}
        />
        <StatusBreakdown
          title="Budget Request"
          pending={d.budget_requests.pending_requests}
          approved={d.budget_requests.approved_requests}
          rejected={d.budget_requests.rejected_requests}
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  total,
  subtitle,
  icon,
  color,
}: {
  title: string;
  total: number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses: Record<string, { bg: string; icon: string }> = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
    violet: { bg: 'bg-violet-50', icon: 'text-violet-600' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600' },
  };

  const c = colorClasses[color] || colorClasses.blue;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center ${c.icon}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{total}</p>
      <p className="text-sm text-slate-500 mt-0.5">{title}</p>
      <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
    </div>
  );
}

function StatusBreakdown({
  title,
  pending,
  approved,
  rejected,
}: {
  title: string;
  pending: number;
  approved: number;
  rejected: number;
}) {
  const total = pending + approved + rejected;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">{title}</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-amber-600">
            <Clock size={16} />
            Pending
          </div>
          <span className="text-sm font-semibold text-slate-900">{pending}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <CheckCircle2 size={16} />
            Approved
          </div>
          <span className="text-sm font-semibold text-slate-900">{approved}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-red-500">
            <XCircle size={16} />
            Rejected
          </div>
          <span className="text-sm font-semibold text-slate-900">{rejected}</span>
        </div>
      </div>
      {total > 0 && (
        <div className="mt-4 flex gap-1 h-2 rounded-full overflow-hidden bg-slate-100">
          {approved > 0 && (
            <div className="bg-emerald-500 rounded-full" style={{ width: `${(approved / total) * 100}%` }} />
          )}
          {pending > 0 && (
            <div className="bg-amber-400 rounded-full" style={{ width: `${(pending / total) * 100}%` }} />
          )}
          {rejected > 0 && (
            <div className="bg-red-400 rounded-full" style={{ width: `${(rejected / total) * 100}%` }} />
          )}
        </div>
      )}
    </div>
  );
}
