'use client';

import { useState } from 'react';
import {
  useGetBudgetRequestsQuery,
  useCreateBudgetRequestMutation,
  useApproveBudgetRequestMutation,
  useRejectBudgetRequestMutation,
} from '@/lib/api/budgetRequestApi';
import { useAppSelector } from '@/lib/hooks';
import { formatCurrency, formatDate, exportToCSV } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { Plus, Wallet, CheckCircle, XCircle, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface BudgetRequestTabProps {
  projectId: number;
}

export default function BudgetRequestTab({ projectId }: BudgetRequestTabProps) {
  const user = useAppSelector((s) => s.auth.user);
  const { data, isLoading, isError } = useGetBudgetRequestsQuery();
  const [createRequest, { isLoading: creating }] = useCreateBudgetRequestMutation();
  const [approveRequest] = useApproveBudgetRequestMutation();
  const [rejectRequest] = useRejectBudgetRequestMutation();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ amount: '', reason: '' });
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [confirmApprove, setConfirmApprove] = useState<number | null>(null);
  const [confirmReject, setConfirmReject] = useState<number | null>(null);

  const canApprove = user?.role === 'FINANCE' || user?.role === 'OWNER';
  const allRequests = data?.data || [];
  const requests = allRequests.filter((r) => r.project_id === projectId);

  const filtered = filterStatus === 'ALL' ? requests : requests.filter((r) => r.status === filterStatus);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRequest({
        project_id: projectId,
        amount: Number(form.amount),
        reason: form.reason,
      }).unwrap();
      toast.success('Budget request berhasil dibuat!');
      setShowModal(false);
      setForm({ amount: '', reason: '' });
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal membuat request');
    }
  };

  const handleApprove = async () => {
    if (confirmApprove === null) return;
    try {
      await approveRequest(confirmApprove).unwrap();
      toast.success('Budget request disetujui!');
      setConfirmApprove(null);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal menyetujui');
    }
  };

  const handleReject = async () => {
    if (confirmReject === null) return;
    try {
      await rejectRequest(confirmReject).unwrap();
      toast.success('Budget request ditolak');
      setConfirmReject(null);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal menolak');
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <EmptyState title="Gagal memuat budget request" description="Pastikan backend berjalan dan coba refresh" />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Budget Request</h2>
          <p className="text-sm text-slate-500 mt-1">{filtered.length} request</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          {filtered.length > 0 && (
            <button
              onClick={() => {
                const rows = filtered.map((r) => ({
                  amount: r.amount,
                  reason: r.reason,
                  status: r.status,
                  requester: r.requester?.full_name || '',
                  date: formatDate(r.created_at),
                }));
                exportToCSV(`budget_request_${new Date().toISOString().slice(0, 10)}.csv`, [
                  { label: 'Jumlah', key: 'amount' },
                  { label: 'Alasan', key: 'reason' },
                  { label: 'Status', key: 'status' },
                  { label: 'Diajukan Oleh', key: 'requester' },
                  { label: 'Tanggal', key: 'date' },
                ], rows);
              }}
              className="flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              <Download size={16} />
              Export CSV
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} />
            Ajukan
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Belum ada budget request" description="Budget request yang diajukan akan muncul di sini" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((req) => (
            <div key={req.id} className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Wallet size={20} className="text-amber-600" />
                </div>
                <Badge status={req.status} />
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-2">{formatCurrency(req.amount)}</p>
              <p className="text-sm text-slate-500 mb-4 line-clamp-2">{req.reason}</p>
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  {req.requester?.full_name && <span>{req.requester.full_name} &middot; </span>}
                  {formatDate(req.created_at)}
                </div>
                {canApprove && req.status === 'PENDING' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setConfirmApprove(req.id)}
                      className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                      title="Approve"
                    >
                      <CheckCircle size={20} />
                    </button>
                    <button
                      onClick={() => setConfirmReject(req.id)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                      title="Reject"
                    >
                      <XCircle size={20} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal — no project selector */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Ajukan Budget Request">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Jumlah (Rp)</label>
            <input
              type="number"
              required
              min={1}
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="10000000"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Alasan</label>
            <textarea
              required
              minLength={2}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Jelaskan alasan pengajuan budget..."
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {creating ? 'Mengirim...' : 'Ajukan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Approve */}
      <ConfirmDialog
        isOpen={confirmApprove !== null}
        onClose={() => setConfirmApprove(null)}
        onConfirm={handleApprove}
        title="Setujui Budget Request?"
        message="Budget request yang disetujui akan menambah anggaran proyek."
        confirmLabel="Setujui"
        variant="warning"
      />

      {/* Confirm Reject */}
      <ConfirmDialog
        isOpen={confirmReject !== null}
        onClose={() => setConfirmReject(null)}
        onConfirm={handleReject}
        title="Tolak Budget Request?"
        message="Apakah Anda yakin ingin menolak budget request ini?"
        confirmLabel="Tolak"
        variant="danger"
      />
    </div>
  );
}
