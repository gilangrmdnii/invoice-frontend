'use client';

import { useState, useEffect } from 'react';
import { useGetProjectPlanQuery, useUpdateProjectPlanMutation } from '@/lib/api/projectApi';
import { useAppSelector } from '@/lib/hooks';
import { formatCurrency } from '@/lib/utils';
import LabelGroupEditor, {
  buildPlanPayload,
  planItemsToLabelGroups,
  EMPTY_FORM_ITEM,
} from '@/components/ui/LabelGroupEditor';
import type { LabelGroup } from '@/components/ui/LabelGroupEditor';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { Pencil, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface PlanTabProps {
  projectId: number;
}

export default function PlanTab({ projectId }: PlanTabProps) {
  const user = useAppSelector((s) => s.auth.user);
  const { data, isLoading, isError } = useGetProjectPlanQuery(projectId);
  const [updatePlan, { isLoading: saving }] = useUpdateProjectPlanMutation();

  const [editing, setEditing] = useState(false);
  const [labelGroups, setLabelGroups] = useState<LabelGroup[]>([
    { label: '', items: [{ ...EMPTY_FORM_ITEM }] },
  ]);

  const canEdit = user?.role === 'FINANCE' || user?.role === 'OWNER';
  const planItems = data?.data || [];

  useEffect(() => {
    if (editing && planItems) {
      setLabelGroups(planItemsToLabelGroups(planItems));
    }
  }, [editing]);

  const handleSave = async () => {
    const { labels, items } = buildPlanPayload(labelGroups);

    if (labels.length === 0 && items.length === 0) {
      toast.error('Tambahkan minimal 1 item rencana');
      return;
    }

    try {
      await updatePlan({
        id: projectId,
        body: {
          labels: labels.length > 0 ? labels : undefined,
          items: items.length > 0 ? items : undefined,
        },
      }).unwrap();
      toast.success('Rencana anggaran berhasil diperbarui!');
      setEditing(false);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal memperbarui rencana');
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <EmptyState title="Gagal memuat rencana" description="Pastikan backend berjalan dan coba refresh" />;

  // Build grouped view for read-only display
  const labelRows = planItems.filter((i) => i.is_label);
  const standaloneRows = planItems.filter((i) => !i.is_label && !i.parent_id);
  const totalAnggaran = planItems
    .filter((i) => !i.is_label)
    .reduce((sum, i) => sum + i.subtotal, 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Rencana Anggaran</h2>
          <p className="text-sm text-slate-500 mt-1">
            Total: <span className="font-semibold text-indigo-600">{formatCurrency(totalAnggaran)}</span>
          </p>
        </div>
        {canEdit && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Pencil size={16} />
            Edit Rencana
          </button>
        )}
        {editing && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              <X size={16} />
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <LabelGroupEditor
          labelGroups={labelGroups}
          setLabelGroups={setLabelGroups}
          title="Item Rencana Anggaran *"
          addLabelText="+ Tambah Label"
        />
      ) : planItems.length === 0 ? (
        <EmptyState
          title="Belum ada rencana anggaran"
          description="Tambahkan item rencana anggaran untuk proyek ini"
          action={
            canEdit ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <Pencil size={16} />
                Buat Rencana
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Keterangan</th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4 w-20">Qty</th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4 w-20">Unit</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4 w-36">Harga Satuan</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4 w-36">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {labelRows.map((label) => {
                  const children = planItems.filter((i) => i.parent_id === label.id);
                  return (
                    <LabelGroupRows key={label.id} label={label.description} children={children} />
                  );
                })}
                {standaloneRows.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3 text-sm text-slate-900">{item.description}</td>
                    <td className="px-6 py-3 text-sm text-slate-600 text-center">{item.quantity}</td>
                    <td className="px-6 py-3 text-sm text-slate-600 text-center">{item.unit}</td>
                    <td className="px-6 py-3 text-sm text-slate-600 text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="px-6 py-3 text-sm font-medium text-slate-900 text-right">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50">
                  <td colSpan={4} className="px-6 py-4 text-sm font-semibold text-slate-700 text-right">Total Anggaran</td>
                  <td className="px-6 py-4 text-base font-bold text-indigo-600 text-right">{formatCurrency(totalAnggaran)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function LabelGroupRows({ label, children }: { label: string; children: { id: number; description: string; quantity: number; unit: string; unit_price: number; subtotal: number }[] }) {
  return (
    <>
      <tr className="bg-slate-50/80">
        <td colSpan={5} className="px-6 py-3 text-sm font-semibold text-slate-800">{label}</td>
      </tr>
      {children.map((item) => (
        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
          <td className="px-6 py-3 text-sm text-slate-900 pl-10">{item.description}</td>
          <td className="px-6 py-3 text-sm text-slate-600 text-center">{item.quantity}</td>
          <td className="px-6 py-3 text-sm text-slate-600 text-center">{item.unit}</td>
          <td className="px-6 py-3 text-sm text-slate-600 text-right">{formatCurrency(item.unit_price)}</td>
          <td className="px-6 py-3 text-sm font-medium text-slate-900 text-right">{formatCurrency(item.subtotal)}</td>
        </tr>
      ))}
    </>
  );
}
