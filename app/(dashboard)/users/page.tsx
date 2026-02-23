'use client';

import { useState } from 'react';
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from '@/lib/api/userApi';
import { useAppSelector } from '@/lib/hooks';
import { formatDate } from '@/lib/utils';
import type { User } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Plus, Pencil, Trash2, Filter, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const ITEMS_PER_PAGE = 15;

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-purple-50 text-purple-700',
  FINANCE: 'bg-blue-50 text-blue-700',
  SPV: 'bg-amber-50 text-amber-700',
};

export default function UsersPage() {
  const currentUser = useAppSelector((s) => s.auth.user);
  const isOwner = currentUser?.role === 'OWNER';
  const canAccess = currentUser?.role === 'FINANCE' || currentUser?.role === 'OWNER';

  const [roleFilter, setRoleFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'SPV' as 'SPV' | 'FINANCE' | 'OWNER',
  });

  const { data, isLoading, isError } = useGetUsersQuery(roleFilter || undefined);
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  const users = data?.data || [];
  const paginatedUsers = users.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const resetForm = () => {
    setForm({ full_name: '', email: '', password: '', role: 'SPV' });
    setEditingUser(null);
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      full_name: user.full_name,
      email: user.email,
      password: '',
      role: user.role,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingUser) {
        // Update
        const body: Record<string, string> = {};
        if (form.full_name !== editingUser.full_name) body.full_name = form.full_name;
        if (form.email !== editingUser.email) body.email = form.email;
        if (form.role !== editingUser.role) body.role = form.role;
        if (form.password) body.password = form.password;

        if (Object.keys(body).length === 0) {
          toast.error('Tidak ada perubahan');
          return;
        }

        await updateUser({ id: editingUser.id, body }).unwrap();
        toast.success('Pengguna berhasil diperbarui');
      } else {
        // Create
        await createUser({
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          role: form.role,
        }).unwrap();
        toast.success('Pengguna berhasil ditambahkan');
      }
      setModalOpen(false);
      resetForm();
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal menyimpan pengguna');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser(deleteTarget.id).unwrap();
      toast.success('Pengguna berhasil dihapus');
      setDeleteTarget(null);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal menghapus pengguna');
    }
  };

  if (!canAccess) {
    return <EmptyState title="Akses Ditolak" description="Halaman ini hanya dapat diakses oleh FINANCE dan OWNER" />;
  }

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <EmptyState title="Gagal memuat data" description="Pastikan backend berjalan dan coba refresh" />;

  const isSelf = (userId: number) => currentUser?.id === userId;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Kelola Pengguna</h2>
          <p className="text-sm text-slate-500 mt-1">{users.length} pengguna</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">Semua Role</option>
              <option value="SPV">SPV</option>
              <option value="FINANCE">FINANCE</option>
              <option value="OWNER">OWNER</option>
            </select>
          </div>
          {isOwner && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <Plus size={18} />
              Tambah Pengguna
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {users.length === 0 ? (
        <EmptyState title="Belum ada pengguna" description="Pengguna yang ditambahkan akan muncul di sini" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Nama</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Email</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Role</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Tanggal Dibuat</th>
                  {isOwner && (
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-sm font-semibold shrink-0">
                          {u.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-slate-900">{u.full_name}</span>
                          {isSelf(u.id) && (
                            <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600">Anda</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={clsx('text-xs font-semibold px-2.5 py-1 rounded-lg', ROLE_COLORS[u.role] || 'bg-slate-50 text-slate-700')}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatDate(u.created_at)}</td>
                    {isOwner && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(u)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          {!isSelf(u.id) && (
                            <button
                              onClick={() => setDeleteTarget(u)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={page}
            totalItems={users.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={editingUser ? 'Edit Pengguna' : 'Tambah Pengguna'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Lengkap *</label>
            <input
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Nama lengkap"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@example.com"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Password {editingUser ? '(kosongkan jika tidak diubah)' : '*'}
            </label>
            <input
              type="password"
              required={!editingUser}
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={editingUser ? 'Kosongkan jika tidak diubah' : 'Minimal 6 karakter'}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Role *</label>
            <select
              required
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as 'SPV' | 'FINANCE' | 'OWNER' })}
              disabled={editingUser !== null && isSelf(editingUser.id)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="SPV">SPV</option>
              <option value="FINANCE">FINANCE</option>
              <option value="OWNER">OWNER</option>
            </select>
            {editingUser && isSelf(editingUser.id) && (
              <p className="text-xs text-slate-400 mt-1">Anda tidak bisa mengubah role sendiri</p>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setModalOpen(false); resetForm(); }}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={creating || updating}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {creating || updating ? 'Menyimpan...' : editingUser ? 'Simpan Perubahan' : 'Tambah Pengguna'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Pengguna?"
        message={`Pengguna "${deleteTarget?.full_name}" akan dihapus permanen. Data terkait (proyek, invoice, dll) mungkin terpengaruh.`}
        confirmLabel="Hapus"
        variant="danger"
      />
    </div>
  );
}
