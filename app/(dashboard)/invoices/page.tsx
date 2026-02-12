'use client';

import { useState } from 'react';
import {
  useGetInvoicesQuery,
  useCreateInvoiceMutation,
  useDeleteInvoiceMutation,
  useApproveInvoiceMutation,
  useRejectInvoiceMutation,
} from '@/lib/api/invoiceApi';
import { useUploadFileMutation } from '@/lib/api/uploadApi';
import { useGetProjectsQuery } from '@/lib/api/projectApi';
import { useAppSelector } from '@/lib/hooks';
import { formatCurrency, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import {
  Plus,
  FileText,
  CheckCircle,
  XCircle,
  Trash2,
  Upload,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function InvoicesPage() {
  const user = useAppSelector((s) => s.auth.user);
  const { data, isLoading, isError } = useGetInvoicesQuery();
  const { data: projectsData } = useGetProjectsQuery();
  const [createInvoice, { isLoading: creating }] = useCreateInvoiceMutation();
  const [deleteInvoice] = useDeleteInvoiceMutation();
  const [approveInvoice] = useApproveInvoiceMutation();
  const [rejectInvoice] = useRejectInvoiceMutation();
  const [uploadFile, { isLoading: uploading }] = useUploadFileMutation();

  const [showModal, setShowModal] = useState(false);
  const [rejectModal, setRejectModal] = useState<number | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [form, setForm] = useState({ project_id: '', amount: '', file_url: '' });
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const canCreate = user?.role === 'SPV';
  const canApprove = user?.role === 'FINANCE' || user?.role === 'OWNER';
  const invoices = data?.data || [];
  const projects = projectsData?.data || [];

  const filtered = filterStatus === 'ALL' ? invoices : invoices.filter((i) => i.status === filterStatus);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await uploadFile(formData).unwrap();
      if (res.data?.file_url) {
        setForm({ ...form, file_url: res.data.file_url });
        toast.success('File berhasil diupload');
      }
    } catch {
      toast.error('Gagal upload file');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createInvoice({
        project_id: Number(form.project_id),
        amount: Number(form.amount),
        file_url: form.file_url,
      }).unwrap();
      toast.success('Invoice berhasil dibuat!');
      setShowModal(false);
      setForm({ project_id: '', amount: '', file_url: '' });
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal membuat invoice');
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await approveInvoice({ id }).unwrap();
      toast.success('Invoice disetujui!');
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal menyetujui invoice');
    }
  };

  const handleReject = async () => {
    if (rejectModal === null) return;
    try {
      await rejectInvoice({ id: rejectModal, body: { notes: rejectNotes } }).unwrap();
      toast.success('Invoice ditolak');
      setRejectModal(null);
      setRejectNotes('');
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal menolak invoice');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteInvoice(id).unwrap();
      toast.success('Invoice dihapus');
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal menghapus invoice');
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <EmptyState title="Gagal memuat invoice" description="Pastikan backend berjalan dan coba refresh" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Daftar Invoice</h2>
          <p className="text-sm text-slate-500 mt-1">{filtered.length} invoice</p>
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
          {canCreate && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <Plus size={18} />
              Buat Invoice
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Belum ada invoice" description="Invoice yang dibuat akan muncul di sini" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Invoice #</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Proyek</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Jumlah</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Tanggal</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">File</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-indigo-500" />
                        <span className="text-sm font-medium text-slate-900">{inv.invoice_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{inv.project?.name || `Project #${inv.project_id}`}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{formatCurrency(inv.amount)}</td>
                    <td className="px-6 py-4"><Badge status={inv.status} /></td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatDate(inv.created_at)}</td>
                    <td className="px-6 py-4">
                      {inv.file_url && (
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000'}${inv.file_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-700"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {canApprove && inv.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(inv.id)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Approve"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => setRejectModal(inv.id)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                              title="Reject"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        {canCreate && inv.status === 'PENDING' && (
                          <button
                            onClick={() => handleDelete(inv.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Buat Invoice Baru">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Proyek</label>
            <select
              required
              value={form.project_id}
              onChange={(e) => setForm({ ...form, project_id: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              <option value="">Pilih proyek...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Jumlah (Rp)</label>
            <input
              type="number"
              required
              min={1}
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="5000000"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">File Invoice</label>
            {form.file_url ? (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl text-sm text-emerald-700">
                <CheckCircle size={16} />
                File terupload: {form.file_url}
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 w-full p-6 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">
                <Upload size={20} className="text-slate-400" />
                <span className="text-sm text-slate-500">{uploading ? 'Mengupload...' : 'Klik untuk upload (JPG, PNG, PDF max 5MB)'}</span>
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileUpload} className="hidden" />
              </label>
            )}
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
              disabled={creating || !form.file_url}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {creating ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={rejectModal !== null} onClose={() => setRejectModal(null)} title="Tolak Invoice" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Catatan (opsional)</label>
            <textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Alasan penolakan..."
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setRejectModal(null)}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleReject}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors"
            >
              Tolak
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
