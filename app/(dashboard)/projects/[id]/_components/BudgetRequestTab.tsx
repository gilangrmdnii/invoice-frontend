'use client';

import { useState } from 'react';
import {
  useGetBudgetRequestsQuery,
  useCreateBudgetRequestMutation,
  useApproveBudgetRequestMutation,
  useRejectBudgetRequestMutation,
} from '@/lib/api/budgetRequestApi';
import { useUploadFileMutation } from '@/lib/api/uploadApi';
import { useAppSelector } from '@/lib/hooks';
import { formatCurrency, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import CurrencyInput from '@/components/ui/CurrencyInput';
import ExportDropdown from '@/components/ui/ExportDropdown';
import { Plus, Wallet, CheckCircle, XCircle, Upload, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface BudgetRequestTabProps {
  projectId: number;
}

export default function BudgetRequestTab({ projectId }: BudgetRequestTabProps) {
  const user = useAppSelector((s) => s.auth.user);
  const { data, isLoading, isError } = useGetBudgetRequestsQuery();
  const [createRequest, { isLoading: creating }] = useCreateBudgetRequestMutation();
  const [approveRequest, { isLoading: approving }] = useApproveBudgetRequestMutation();
  const [rejectRequest, { isLoading: rejecting }] = useRejectBudgetRequestMutation();
  const [uploadFile, { isLoading: uploading }] = useUploadFileMutation();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ amount: '', reason: '', proof_url: '' });
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Approve modal state
  const [approveModal, setApproveModal] = useState<number | null>(null);
  const [approveForm, setApproveForm] = useState({ notes: '', proof_url: '' });

  // Reject modal state
  const [rejectModal, setRejectModal] = useState<number | null>(null);
  const [rejectForm, setRejectForm] = useState({ notes: '', proof_url: '' });

  const canApprove = user?.role === 'FINANCE' || user?.role === 'OWNER';
  const allRequests = data?.data || [];
  const requests = allRequests.filter((r) => r.project_id === projectId);
  const filtered = filterStatus === 'ALL' ? requests : requests.filter((r) => r.status === filterStatus);

  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000';

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'create' | 'approve' | 'reject',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Ukuran file maksimal 5MB');
      e.target.value = '';
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await uploadFile(formData).unwrap();
      if (res.data?.file_url) {
        if (target === 'create') {
          setForm((prev) => ({ ...prev, proof_url: res.data.file_url }));
        } else if (target === 'approve') {
          setApproveForm((prev) => ({ ...prev, proof_url: res.data.file_url }));
        } else {
          setRejectForm((prev) => ({ ...prev, proof_url: res.data.file_url }));
        }
        toast.success('File berhasil diupload');
      }
    } catch {
      toast.error('Gagal upload file');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.proof_url) {
      toast.error('Bukti wajib diupload');
      return;
    }
    try {
      await createRequest({
        project_id: projectId,
        amount: Number(form.amount),
        reason: form.reason,
        proof_url: form.proof_url,
      }).unwrap();
      toast.success('Budget request berhasil dibuat!');
      setShowModal(false);
      setForm({ amount: '', reason: '', proof_url: '' });
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal membuat request');
    }
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (approveModal === null) return;
    if (!approveForm.proof_url) {
      toast.error('Bukti wajib diupload');
      return;
    }
    try {
      await approveRequest({
        id: approveModal,
        body: { notes: approveForm.notes, proof_url: approveForm.proof_url },
      }).unwrap();
      toast.success('Budget request disetujui!');
      setApproveModal(null);
      setApproveForm({ notes: '', proof_url: '' });
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal menyetujui');
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rejectModal === null) return;
    if (!rejectForm.proof_url) {
      toast.error('Bukti wajib diupload');
      return;
    }
    try {
      await rejectRequest({
        id: rejectModal,
        body: { notes: rejectForm.notes, proof_url: rejectForm.proof_url },
      }).unwrap();
      toast.success('Budget request ditolak');
      setRejectModal(null);
      setRejectForm({ notes: '', proof_url: '' });
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
            <ExportDropdown
              filename={`budget_request_${new Date().toISOString().slice(0, 10)}`}
              headers={[
                { label: 'Jumlah', key: 'amount' },
                { label: 'Alasan', key: 'reason' },
                { label: 'Status', key: 'status' },
                { label: 'Diajukan Oleh', key: 'requester' },
                { label: 'Tanggal', key: 'date' },
              ]}
              rows={filtered.map((r) => ({
                amount: r.amount,
                reason: r.reason,
                status: r.status,
                requester: r.requester?.full_name || '',
                date: formatDate(r.created_at),
              }))}
            />
          )}
          {user?.role === 'SPV' && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <Plus size={18} />
              Ajukan
            </button>
          )}
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
              <p className="text-sm text-slate-500 mb-3 line-clamp-2">{req.reason}</p>

              {/* Bukti pengajuan */}
              {req.proof_url && (
                <a
                  href={`${apiBase}${req.proof_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 mb-3"
                >
                  <ExternalLink size={14} />
                  Lihat Bukti Pengajuan
                </a>
              )}

              {/* Bukti approval/rejection */}
              {req.status !== 'PENDING' && (req.approval_notes || req.approval_proof_url) && (
                <div className={`p-3 rounded-xl text-xs mb-3 ${req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {req.approval_notes && <p className="mb-1"><span className="font-medium">Catatan:</span> {req.approval_notes}</p>}
                  {req.approval_proof_url && (
                    <a
                      href={`${apiBase}${req.approval_proof_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      <ExternalLink size={12} />
                      Lihat Bukti {req.status === 'APPROVED' ? 'Persetujuan' : 'Penolakan'}
                    </a>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  {req.requester?.full_name && <span>{req.requester.full_name} &middot; </span>}
                  {formatDate(req.created_at)}
                </div>
                {canApprove && req.status === 'PENDING' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setApproveModal(req.id)}
                      className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                      title="Approve"
                    >
                      <CheckCircle size={20} />
                    </button>
                    <button
                      onClick={() => setRejectModal(req.id)}
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

      {/* Create Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setForm({ amount: '', reason: '', proof_url: '' }); }} title="Ajukan Budget Request">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Jumlah (Rp)</label>
            <CurrencyInput
              required
              min={1}
              value={Number(form.amount) || 0}
              onChange={(val) => setForm({ ...form, amount: String(val) })}
              placeholder="10.000.000"
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
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Bukti <span className="text-red-500">*</span></label>
            {form.proof_url ? (
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl text-sm text-emerald-700">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle size={16} className="shrink-0" />
                  <span className="truncate">File terupload</span>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, proof_url: '' })}
                  className="text-xs text-emerald-600 hover:text-emerald-800 font-medium shrink-0 ml-2"
                >
                  Ganti
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">
                <Upload size={18} className="text-slate-400" />
                <span className="text-sm text-slate-500">{uploading ? 'Mengupload...' : 'Upload bukti (JPG, PNG, PDF max 5MB)'}</span>
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => handleFileUpload(e, 'create')} className="hidden" disabled={uploading} />
              </label>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setShowModal(false); setForm({ amount: '', reason: '', proof_url: '' }); }}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={creating || uploading}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {creating ? 'Mengirim...' : 'Ajukan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Approve Modal */}
      <Modal
        isOpen={approveModal !== null}
        onClose={() => { setApproveModal(null); setApproveForm({ notes: '', proof_url: '' }); }}
        title="Setujui Budget Request"
      >
        <form onSubmit={handleApprove} className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-xl text-sm text-amber-700">
            Budget request yang disetujui akan menambah anggaran proyek.
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Catatan</label>
            <textarea
              value={approveForm.notes}
              onChange={(e) => setApproveForm({ ...approveForm, notes: e.target.value })}
              placeholder="Catatan persetujuan (opsional)..."
              rows={2}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Bukti Persetujuan <span className="text-red-500">*</span></label>
            {approveForm.proof_url ? (
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl text-sm text-emerald-700">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle size={16} className="shrink-0" />
                  <span className="truncate">File terupload</span>
                </div>
                <button
                  type="button"
                  onClick={() => setApproveForm({ ...approveForm, proof_url: '' })}
                  className="text-xs text-emerald-600 hover:text-emerald-800 font-medium shrink-0 ml-2"
                >
                  Ganti
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">
                <Upload size={18} className="text-slate-400" />
                <span className="text-sm text-slate-500">{uploading ? 'Mengupload...' : 'Upload bukti (JPG, PNG, PDF max 5MB)'}</span>
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => handleFileUpload(e, 'approve')} className="hidden" disabled={uploading} />
              </label>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setApproveModal(null); setApproveForm({ notes: '', proof_url: '' }); }}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={approving || uploading}
              className="flex-1 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {approving ? 'Memproses...' : 'Setujui'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModal !== null}
        onClose={() => { setRejectModal(null); setRejectForm({ notes: '', proof_url: '' }); }}
        title="Tolak Budget Request"
      >
        <form onSubmit={handleReject} className="space-y-4">
          <div className="p-3 bg-red-50 rounded-xl text-sm text-red-700">
            Apakah Anda yakin ingin menolak budget request ini?
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Catatan</label>
            <textarea
              value={rejectForm.notes}
              onChange={(e) => setRejectForm({ ...rejectForm, notes: e.target.value })}
              placeholder="Alasan penolakan (opsional)..."
              rows={2}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Bukti Penolakan <span className="text-red-500">*</span></label>
            {rejectForm.proof_url ? (
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl text-sm text-emerald-700">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle size={16} className="shrink-0" />
                  <span className="truncate">File terupload</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRejectForm({ ...rejectForm, proof_url: '' })}
                  className="text-xs text-emerald-600 hover:text-emerald-800 font-medium shrink-0 ml-2"
                >
                  Ganti
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">
                <Upload size={18} className="text-slate-400" />
                <span className="text-sm text-slate-500">{uploading ? 'Mengupload...' : 'Upload bukti (JPG, PNG, PDF max 5MB)'}</span>
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => handleFileUpload(e, 'reject')} className="hidden" disabled={uploading} />
              </label>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setRejectModal(null); setRejectForm({ notes: '', proof_url: '' }); }}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={rejecting || uploading}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {rejecting ? 'Memproses...' : 'Tolak'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
