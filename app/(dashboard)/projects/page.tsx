'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGetProjectsQuery, useCreateProjectMutation } from '@/lib/api/projectApi';
import { useAppSelector } from '@/lib/hooks';
import { formatCurrency, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import LabelGroupEditor, { buildPlanPayload, EMPTY_FORM_ITEM } from '@/components/ui/LabelGroupEditor';
import type { LabelGroup } from '@/components/ui/LabelGroupEditor';
import { Plus, FolderKanban, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProjectsPage() {
  const user = useAppSelector((s) => s.auth.user);
  const { data, isLoading, isError } = useGetProjectsQuery();
  const [createProject, { isLoading: creating }] = useCreateProjectMutation();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [labelGroups, setLabelGroups] = useState<LabelGroup[]>([
    { label: '', items: [{ ...EMPTY_FORM_ITEM }] },
  ]);

  const canCreate = user?.role === 'FINANCE' || user?.role === 'OWNER';
  const projects = data?.data || [];

  // Calculate total budget from plan items
  const totalBudget = labelGroups
    .flatMap((g) => g.items)
    .reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price), 0);

  const resetForm = () => {
    setForm({ name: '', description: '' });
    setLabelGroups([{ label: '', items: [{ ...EMPTY_FORM_ITEM }] }]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const { labels, items } = buildPlanPayload(labelGroups);

    if (labels.length === 0 && items.length === 0) {
      toast.error('Tambahkan minimal 1 item rencana anggaran');
      return;
    }

    try {
      await createProject({
        name: form.name,
        description: form.description,
        plan_labels: labels.length > 0 ? labels : undefined,
        plan_items: items.length > 0 ? items : undefined,
      }).unwrap();
      toast.success('Proyek berhasil dibuat!');
      setShowModal(false);
      resetForm();
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal membuat proyek');
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <EmptyState title="Gagal memuat proyek" description="Pastikan backend berjalan dan coba refresh" />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Daftar Proyek</h2>
          <p className="text-sm text-slate-500 mt-1">{projects.length} proyek ditemukan</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} />
            Tambah Proyek
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="Belum ada proyek"
          description="Mulai dengan membuat proyek pertama Anda"
          action={
            canCreate ? (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <Plus size={16} />
                Buat Proyek
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const spent = project.spent_amount || 0;
            const total = project.total_budget || 0;
            const pct = total > 0 ? Math.min(Math.round((spent / total) * 100), 100) : 0;

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-lg hover:border-indigo-100 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <FolderKanban size={20} className="text-indigo-600" />
                  </div>
                  <Badge status={project.status} />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                  {project.name}
                </h3>
                <p className="text-xs text-slate-500 mb-4 line-clamp-2">{project.description || 'Tidak ada deskripsi'}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Anggaran</span>
                    <span className="font-medium text-slate-700">{formatCurrency(total)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Terpakai {pct}%</span>
                    <span>{formatDate(project.created_at)}</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center text-xs text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Lihat Detail <ArrowRight size={14} className="ml-1" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title="Buat Proyek Baru" size="lg">
        <form onSubmit={handleCreate} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Proyek</label>
            <input
              type="text"
              required
              minLength={2}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: Website Redesign"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Deskripsi</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Deskripsi proyek..."
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>

          {/* Plan Items Editor */}
          <LabelGroupEditor
            labelGroups={labelGroups}
            setLabelGroups={setLabelGroups}
            title="Rencana Anggaran *"
            addLabelText="+ Tambah Label"
          />

          {/* Auto-calculated budget */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-700">Total Anggaran</span>
              <span className="text-lg font-bold text-indigo-600">{formatCurrency(totalBudget)}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setShowModal(false); resetForm(); }}
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
    </div>
  );
}
