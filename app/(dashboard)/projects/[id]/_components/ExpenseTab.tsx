'use client';

import { useState } from 'react';
import {
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
  useApproveExpenseMutation,
  useRejectExpenseMutation,
} from '@/lib/api/expenseApi';
import { useUploadFileMutation } from '@/lib/api/uploadApi';
import { useAppSelector } from '@/lib/hooks';
import { formatCurrency, formatDate, exportToCSV } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import CurrencyInput from '@/components/ui/CurrencyInput';
import Badge from '@/components/ui/Badge';
import {
  Plus,
  Receipt,
  CheckCircle,
  XCircle,
  Trash2,
  Upload,
  ExternalLink,
  Download,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface ExpenseTabProps {
  projectId: number;
}

export default function ExpenseTab({ projectId }: ExpenseTabProps) {
  const user = useAppSelector((s) => s.auth.user);
  const { data, isLoading, isError } = useGetExpensesQuery();
  const [createExpense, { isLoading: creating }] = useCreateExpenseMutation();
  const [deleteExpense] = useDeleteExpenseMutation();
  const [approveExpense] = useApproveExpenseMutation();
  const [rejectExpense] = useRejectExpenseMutation();
  const [uploadFile, { isLoading: uploading }] = useUploadFileMutation();
  const [uploadProof, { isLoading: uploadingProof }] = useUploadFileMutation();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', category: '', receipt_url: '' });
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  // Approve modal state
  const [approveModal, setApproveModal] = useState<{ id: number; receipt_url?: string } | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  // Reject modal state
  const [rejectModal, setRejectModal] = useState<number | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  const canApprove = user?.role === 'FINANCE' || user?.role === 'OWNER';

  const allExpenses = data?.data || [];
  const expenses = allExpenses.filter((exp) => exp.project_id === projectId);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setForm({ ...form, receipt_url: res.data.file_url });
        toast.success('File berhasil diupload');
      }
    } catch {
      toast.error('Gagal upload file');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.receipt_url) {
      toast.error('Bukti pengeluaran wajib diupload');
      return;
    }
    try {
      await createExpense({
        project_id: projectId,
        description: form.description,
        amount: Number(form.amount),
        category: form.category,
        receipt_url: form.receipt_url,
      }).unwrap();
      toast.success('Pengeluaran berhasil ditambahkan!');
      setShowModal(false);
      setForm({ description: '', amount: '', category: '', receipt_url: '' });
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal menambahkan pengeluaran');
    }
  };

  const handleDelete = async () => {
    if (confirmDelete === null) return;
    try {
      await deleteExpense(confirmDelete).unwrap();
      toast.success('Pengeluaran dihapus');
      setConfirmDelete(null);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal menghapus');
    }
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Ukuran file maksimal 5MB');
      e.target.value = '';
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await uploadProof(fd).unwrap();
      if (res.data?.file_url) {
        setProofUrl(res.data.file_url);
        toast.success('Bukti transfer berhasil diupload');
      }
    } catch {
      toast.error('Gagal upload bukti transfer');
    }
  };

  const handleApprove = async () => {
    if (!approveModal) return;
    if (!proofUrl) {
      toast.error('Upload bukti transfer terlebih dahulu');
      return;
    }
    try {
      await approveExpense({ id: approveModal.id, body: { proof_url: proofUrl } }).unwrap();
      toast.success('Pengeluaran disetujui!');
      setApproveModal(null);
      setProofUrl('');
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal menyetujui');
    }
  };

  const handleReject = async () => {
    if (rejectModal === null) return;
    try {
      await rejectExpense({ id: rejectModal, body: { notes: rejectNotes } }).unwrap();
      toast.success('Pengeluaran ditolak');
      setRejectModal(null);
      setRejectNotes('');
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal menolak');
    }
  };

  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000';

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <EmptyState title="Gagal memuat pengeluaran" description="Pastikan backend berjalan dan coba refresh" />;

  const categories = ['Supplies', 'Equipment', 'Travel', 'Marketing', 'Office', 'Lainnya'];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Daftar Pengeluaran</h2>
          <p className="text-sm text-slate-500 mt-1">{expenses.length} pengeluaran</p>
        </div>
        <div className="flex items-center gap-3">
          {expenses.length > 0 && (
            <button
              onClick={() => {
                const rows = expenses.map((exp) => ({
                  description: exp.description,
                  category: exp.category,
                  amount: exp.amount,
                  status: exp.status,
                  created_by: exp.creator?.full_name || '',
                  date: formatDate(exp.created_at),
                }));
                exportToCSV(`pengeluaran_${new Date().toISOString().slice(0, 10)}.csv`, [
                  { label: 'Deskripsi', key: 'description' },
                  { label: 'Kategori', key: 'category' },
                  { label: 'Jumlah', key: 'amount' },
                  { label: 'Status', key: 'status' },
                  { label: 'Dibuat Oleh', key: 'created_by' },
                  { label: 'Tanggal', key: 'date' },
                ], rows);
              }}
              className="flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              <Download size={16} />
              Export CSV
            </button>
          )}
          {user?.role === 'SPV' && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <Plus size={18} />
              Tambah
            </button>
          )}
        </div>
      </div>

      {expenses.length === 0 ? (
        <EmptyState title="Belum ada pengeluaran" description="Pengeluaran yang dibuat akan muncul di sini" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Deskripsi</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Kategori</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Jumlah</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Tanggal</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Receipt size={16} className="text-amber-500" />
                        <span className="text-sm font-medium text-slate-900">{exp.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">{exp.category}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{formatCurrency(exp.amount)}</td>
                    <td className="px-6 py-4"><Badge status={exp.status} /></td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatDate(exp.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {exp.receipt_url && (
                          <a
                            href={`${apiBase}${exp.receipt_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Lihat Bukti"
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                        {canApprove && exp.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => setApproveModal({ id: exp.id, receipt_url: exp.receipt_url })}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Approve"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => setRejectModal(exp.id)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                              title="Reject"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        {exp.created_by === user?.id && exp.status === 'PENDING' && (
                          <button
                            onClick={() => setConfirmDelete(exp.id)}
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

      {/* Create Modal — no project selector */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Tambah Pengeluaran" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Kategori</label>
            <select
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              <option value="">Pilih kategori...</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Deskripsi</label>
            <input
              type="text"
              required
              minLength={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Deskripsi pengeluaran..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Jumlah (Rp)</label>
            <CurrencyInput
              required
              min={1}
              value={Number(form.amount) || 0}
              onChange={(val) => setForm({ ...form, amount: String(val) })}
              placeholder="500.000"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Bukti Pengeluaran <span className="text-red-500">*</span></label>
            {form.receipt_url ? (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl text-sm text-emerald-700">
                <CheckCircle size={16} />
                File terupload: {form.receipt_url}
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">
                <Upload size={18} className="text-slate-400" />
                <span className="text-sm text-slate-500">{uploading ? 'Mengupload...' : 'Upload bukti (JPG, PNG, PDF max 5MB)'}</span>
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
              disabled={creating}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {creating ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Hapus Pengeluaran?"
        message="Pengeluaran yang dihapus tidak bisa dikembalikan."
        confirmLabel="Hapus"
        variant="danger"
      />

      {/* Approve Modal — receipt preview + proof upload */}
      <Modal isOpen={approveModal !== null} onClose={() => { setApproveModal(null); setProofUrl(''); }} title="Setujui Pengeluaran" size="lg">
        <div className="space-y-4">
          {/* Receipt preview */}
          {approveModal?.receipt_url && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Bukti Pengeluaran</label>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                {approveModal.receipt_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img
                    src={`${apiBase}${approveModal.receipt_url}`}
                    alt="Receipt"
                    className="w-full max-h-64 object-contain bg-slate-50"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-4 bg-slate-50">
                    <Eye size={16} className="text-slate-400" />
                    <a
                      href={`${apiBase}${approveModal.receipt_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      Lihat file bukti pengeluaran
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Proof of transfer upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Bukti Transfer <span className="text-red-500">*</span>
            </label>
            {proofUrl ? (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl text-sm text-emerald-700">
                <CheckCircle size={16} />
                Bukti transfer terupload
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/30 transition-all">
                <Upload size={18} className="text-slate-400" />
                <span className="text-sm text-slate-500">{uploadingProof ? 'Mengupload...' : 'Upload bukti transfer (JPG, PNG, PDF max 5MB)'}</span>
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleProofUpload} className="hidden" />
              </label>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => { setApproveModal(null); setProofUrl(''); }}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleApprove}
              disabled={!proofUrl}
              className="flex-1 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              Setujui
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={rejectModal !== null} onClose={() => { setRejectModal(null); setRejectNotes(''); }} title="Tolak Pengeluaran" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Alasan Penolakan</label>
            <textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Alasan penolakan (opsional)..."
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setRejectModal(null); setRejectNotes(''); }}
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
