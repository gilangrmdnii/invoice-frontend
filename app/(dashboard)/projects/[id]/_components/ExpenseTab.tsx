'use client';

import { useState } from 'react';
import {
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
} from '@/lib/api/expenseApi';
import { useUploadFileMutation } from '@/lib/api/uploadApi';
import { useAppSelector } from '@/lib/hooks';
import { formatCurrency, formatDate } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import {
  Plus,
  Receipt,
  CheckCircle,
  Trash2,
  Upload,
  ExternalLink,
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
  const [uploadFile, { isLoading: uploading }] = useUploadFileMutation();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', category: '', receipt_url: '' });
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

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
    try {
      await createExpense({
        project_id: projectId,
        description: form.description,
        amount: Number(form.amount),
        category: form.category,
        receipt_url: form.receipt_url || undefined,
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
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} />
          Tambah
        </button>
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
                    <td className="px-6 py-4 text-sm text-slate-500">{formatDate(exp.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {exp.receipt_url && (
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000'}${exp.receipt_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                        {exp.created_by === user?.id && (
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
            <input
              type="number"
              required
              min={1}
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="500000"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Bukti (opsional)</label>
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
    </div>
  );
}
