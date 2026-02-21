'use client';

import { useState } from 'react';
import {
  useGetProjectQuery,
  useUpdateProjectMutation,
  useGetProjectMembersQuery,
  useAddProjectMemberMutation,
  useRemoveProjectMemberMutation,
} from '@/lib/api/projectApi';
import { useGetUsersQuery } from '@/lib/api/userApi';
import { useAppSelector } from '@/lib/hooks';
import { formatCurrency, formatDate, getBudgetPercentage } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Edit3, UserPlus, Trash2, Users, Wallet, Calendar, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface OverviewTabProps {
  projectId: number;
}

export default function OverviewTab({ projectId }: OverviewTabProps) {
  const user = useAppSelector((s) => s.auth.user);
  const { data } = useGetProjectQuery(projectId);
  const { data: membersData } = useGetProjectMembersQuery(projectId);
  const [updateProject, { isLoading: updating }] = useUpdateProjectMutation();
  const [addMember, { isLoading: adding }] = useAddProjectMemberMutation();
  const [removeMember] = useRemoveProjectMemberMutation();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', status: '' });
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);

  const canManage = user?.role === 'FINANCE' || user?.role === 'OWNER';
  const project = data?.data;
  const members = membersData?.data || [];

  if (!project) return null;

  const spent = project.spent_amount || 0;
  const total = project.total_budget || 0;
  const pct = getBudgetPercentage(spent, total);

  const openEditModal = () => {
    setEditForm({ name: project.name, description: project.description || '', status: project.status });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProject({
        id: projectId,
        body: {
          name: editForm.name,
          description: editForm.description,
          status: editForm.status as 'ACTIVE' | 'COMPLETED' | 'ARCHIVED',
        },
      }).unwrap();
      toast.success('Proyek berhasil diupdate!');
      setShowEditModal(false);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal mengupdate proyek');
    }
  };

  const handleRemoveMember = async () => {
    if (confirmRemove === null) return;
    try {
      await removeMember({ projectId, userId: confirmRemove }).unwrap();
      toast.success('Anggota berhasil dihapus');
      setConfirmRemove(null);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal menghapus anggota');
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Info */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-slate-900">{project.name}</h2>
              <Badge status={project.status} />
            </div>
            <p className="text-sm text-slate-500">{project.description || 'Tidak ada deskripsi'}</p>
          </div>
          {canManage && (
            <button
              onClick={openEditModal}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
            >
              <Edit3 size={16} />
              Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <Wallet size={14} />
              Total Anggaran
            </div>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(total)}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <Wallet size={14} />
              Terpakai
            </div>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(spent)}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <Calendar size={14} />
              Dibuat
            </div>
            <p className="text-lg font-bold text-slate-900">{formatDate(project.created_at)}</p>
          </div>
        </div>

        {/* Budget bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Penggunaan Anggaran</span>
            <span>{pct}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-amber-500' : 'bg-indigo-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-slate-400" />
            <h3 className="text-base font-semibold text-slate-900">Anggota Proyek</h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{members.length}</span>
          </div>
          {canManage && (
            <button
              onClick={() => setShowMemberModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
            >
              <UserPlus size={16} />
              Tambah
            </button>
          )}
        </div>

        {members.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Belum ada anggota</p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                    {m.user?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{m.user?.full_name || `User #${m.user_id}`}</p>
                    <p className="text-xs text-slate-500">{m.user?.email || ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {m.user?.role && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {m.user.role}
                    </span>
                  )}
                  {canManage && (
                    <button
                      onClick={() => setConfirmRemove(m.user_id)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Proyek">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Proyek</label>
            <input
              type="text"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Deskripsi</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
            <select
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={updating}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {updating ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Remove Member */}
      <ConfirmDialog
        isOpen={confirmRemove !== null}
        onClose={() => setConfirmRemove(null)}
        onConfirm={handleRemoveMember}
        title="Hapus Anggota?"
        message="Anggota yang dihapus tidak bisa mengakses proyek ini lagi."
        confirmLabel="Hapus"
        variant="danger"
      />

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        existingMemberIds={members.map((m) => m.user_id)}
        onAdd={async (userId) => {
          try {
            await addMember({ projectId, body: { user_id: userId } }).unwrap();
            toast.success('Anggota berhasil ditambahkan!');
            setShowMemberModal(false);
          } catch (err: unknown) {
            const error = err as { data?: { message?: string } };
            toast.error(error?.data?.message || 'Gagal menambahkan anggota');
          }
        }}
        isAdding={adding}
      />
    </div>
  );
}

function AddMemberModal({
  isOpen,
  onClose,
  existingMemberIds,
  onAdd,
  isAdding,
}: {
  isOpen: boolean;
  onClose: () => void;
  existingMemberIds: number[];
  onAdd: (userId: number) => void;
  isAdding: boolean;
}) {
  const { data: usersData, isLoading } = useGetUsersQuery('SPV', { skip: !isOpen });
  const [search, setSearch] = useState('');

  const users = (usersData?.data || []).filter(
    (u) =>
      !existingMemberIds.includes(u.id) &&
      (u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tambah Anggota">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau email..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1">
          {isLoading ? (
            <p className="text-sm text-slate-400 text-center py-6">Memuat user...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">
              {search ? 'Tidak ditemukan' : 'Semua SPV sudah menjadi anggota'}
            </p>
          ) : (
            users.map((u) => (
              <button
                key={u.id}
                onClick={() => onAdd(u.id)}
                disabled={isAdding}
                className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-indigo-50 transition-colors text-left disabled:opacity-50"
              >
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm shrink-0">
                  {u.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">{u.full_name}</p>
                  <p className="text-xs text-slate-500 truncate">{u.email}</p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 shrink-0">
                  {u.role}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
