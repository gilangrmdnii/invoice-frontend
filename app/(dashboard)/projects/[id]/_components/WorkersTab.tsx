'use client';

import { useState } from 'react';
import {
  useGetWorkersQuery,
  useCreateWorkerMutation,
  useUpdateWorkerMutation,
  useDeleteWorkerMutation,
} from '@/lib/api/workerApi';
import { useAppSelector } from '@/lib/hooks';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { ProjectWorker } from '@/lib/types';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import CurrencyInput from '@/components/ui/CurrencyInput';
import ExportDropdown from '@/components/ui/ExportDropdown';
import {
  Plus,
  Pencil,
  Trash2,
  HardHat,
  Phone,
  Banknote,
  UserCheck,
  UserX,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface WorkersTabProps {
  projectId: number;
}

export default function WorkersTab({ projectId }: WorkersTabProps) {
  const user = useAppSelector((s) => s.auth.user);
  const { data, isLoading, isError } = useGetWorkersQuery(projectId);
  const [createWorker, { isLoading: creating }] = useCreateWorkerMutation();
  const [updateWorker, { isLoading: updating }] = useUpdateWorkerMutation();
  const [deleteWorker] = useDeleteWorkerMutation();

  const [showModal, setShowModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<ProjectWorker | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ProjectWorker | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [form, setForm] = useState({
    full_name: '',
    role: '',
    phone: '',
    daily_wage: '',
  });

  const allWorkers = data?.data || [];
  const workers =
    statusFilter === 'ALL'
      ? allWorkers
      : statusFilter === 'ACTIVE'
        ? allWorkers.filter((w) => w.is_active)
        : allWorkers.filter((w) => !w.is_active);

  const activeCount = allWorkers.filter((w) => w.is_active).length;
  const totalWage = allWorkers
    .filter((w) => w.is_active)
    .reduce((sum, w) => sum + w.daily_wage, 0);

  const resetForm = () => {
    setForm({ full_name: '', role: '', phone: '', daily_wage: '' });
    setEditingWorker(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (worker: ProjectWorker) => {
    setEditingWorker(worker);
    setForm({
      full_name: worker.full_name,
      role: worker.role,
      phone: worker.phone || '',
      daily_wage: String(worker.daily_wage || ''),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWorker) {
        await updateWorker({
          projectId,
          id: editingWorker.id,
          body: {
            full_name: form.full_name,
            role: form.role,
            phone: form.phone || undefined,
            daily_wage: Number(form.daily_wage) || undefined,
          },
        }).unwrap();
        toast.success('Pekerja berhasil diperbarui!');
      } else {
        await createWorker({
          projectId,
          body: {
            full_name: form.full_name,
            role: form.role,
            phone: form.phone || undefined,
            daily_wage: Number(form.daily_wage) || undefined,
          },
        }).unwrap();
        toast.success('Pekerja berhasil ditambahkan!');
      }
      setShowModal(false);
      resetForm();
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal menyimpan pekerja');
    }
  };

  const handleToggleActive = async (worker: ProjectWorker) => {
    try {
      await updateWorker({
        projectId,
        id: worker.id,
        body: { is_active: !worker.is_active },
      }).unwrap();
      toast.success(
        worker.is_active ? 'Pekerja dinonaktifkan' : 'Pekerja diaktifkan'
      );
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal mengubah status');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteWorker({ projectId, id: confirmDelete.id }).unwrap();
      toast.success('Pekerja berhasil dihapus');
      setConfirmDelete(null);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal menghapus pekerja');
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError)
    return (
      <EmptyState
        title="Gagal memuat data pekerja"
        description="Pastikan backend berjalan dan coba refresh"
      />
    );

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <HardHat size={14} />
            Total Pekerja
          </div>
          <p className="text-2xl font-bold text-slate-900">{allWorkers.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 text-emerald-500 text-xs mb-1">
            <UserCheck size={14} />
            Aktif
          </div>
          <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <Banknote size={14} />
            Total Upah Harian
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(totalWage)}
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Tim Lapangan</h2>
          <p className="text-sm text-slate-500 mt-1">{workers.length} pekerja</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Nonaktif</option>
          </select>
          {allWorkers.length > 0 && (
            <ExportDropdown
              filename={`pekerja_${new Date().toISOString().slice(0, 10)}`}
              headers={[
                { label: 'Nama', key: 'full_name' },
                { label: 'Jabatan', key: 'role' },
                { label: 'HP', key: 'phone' },
                { label: 'Upah Harian', key: 'daily_wage' },
                { label: 'Status', key: 'status' },
                { label: 'Ditambahkan', key: 'date' },
              ]}
              rows={workers.map((w) => ({
                full_name: w.full_name,
                role: w.role,
                phone: w.phone || '-',
                daily_wage: w.daily_wage,
                status: w.is_active ? 'Aktif' : 'Nonaktif',
                date: formatDate(w.created_at),
              }))}
            />
          )}
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} />
            Tambah Pekerja
          </button>
        </div>
      </div>

      {/* Table */}
      {workers.length === 0 ? (
        <EmptyState
          title="Belum ada pekerja"
          description="Tambahkan pekerja lapangan untuk proyek ini"
          action={
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <Plus size={16} />
              Tambah Pekerja
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">
                    Nama
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">
                    Jabatan
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">
                    HP
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">
                    Upah Harian
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">
                    Status
                  </th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {workers.map((w) => (
                  <tr
                    key={w.id}
                    className={clsx(
                      'hover:bg-slate-50/50 transition-colors',
                      !w.is_active && 'opacity-60'
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={clsx(
                            'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0',
                            w.is_active
                              ? 'bg-indigo-100 text-indigo-600'
                              : 'bg-slate-100 text-slate-400'
                          )}
                        >
                          {w.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-slate-900">
                          {w.full_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">
                        {w.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {w.phone ? (
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Phone size={14} className="text-slate-400" />
                          {w.phone}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      {formatCurrency(w.daily_wage)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(w)}
                        className={clsx(
                          'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors',
                          w.is_active
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        )}
                      >
                        {w.is_active ? (
                          <>
                            <UserCheck size={12} /> Aktif
                          </>
                        ) : (
                          <>
                            <UserX size={12} /> Nonaktif
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(w)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(w)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingWorker ? 'Edit Pekerja' : 'Tambah Pekerja'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nama Lengkap *
            </label>
            <input
              required
              minLength={2}
              maxLength={255}
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Budi Santoso"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Jabatan *
            </label>
            <input
              required
              minLength={2}
              maxLength={100}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="Mandor"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              No. HP
            </label>
            <input
              maxLength={50}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="081234567890"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Upah Harian (Rp)
            </label>
            <CurrencyInput
              min={0}
              value={Number(form.daily_wage) || 0}
              onChange={(val) => setForm({ ...form, daily_wage: String(val) })}
              placeholder="250.000"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={creating || updating}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {creating || updating
                ? 'Menyimpan...'
                : editingWorker
                  ? 'Simpan Perubahan'
                  : 'Tambah Pekerja'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Hapus Pekerja?"
        message={`Pekerja "${confirmDelete?.full_name}" akan dihapus permanen dari proyek ini.`}
        confirmLabel="Hapus"
        variant="danger"
      />
    </div>
  );
}
