'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useCreateQCReportMutation,
  useUpdateQCReportMutation,
} from '@/lib/api/qcReportApi';
import { useGetUsersQuery } from '@/lib/api/userApi';
import { formatCurrency } from '@/lib/utils';
import CurrencyInput from '@/components/ui/CurrencyInput';
import type {
  QCReport,
  QCProjectType,
  QCMethodology,
  QCArea,
  QCItemCategory,
  QCItemStatus,
} from '@/lib/types';
import {
  QC_CATEGORY_LABELS,
  QC_METHODOLOGY_LABELS,
  QC_PROJECT_TYPE_LABELS,
  QC_AREA_LABELS,
} from '@/lib/types';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface ItemFormRow {
  id?: number;
  category: QCItemCategory;
  status: QCItemStatus;
  label: string;
  quantity: number;
  unit_price: number;
}

interface RecruiterFormRow {
  id?: number;
  recruiter_name: string;
  total: number;
  ok_perpi: number;
  do_perpi: number;
  ok_qc: number;
  do_qc: number;
  notes: string;
}

// Default structure mimicking the form layout in Image 2
const DEFAULT_ITEMS: ItemFormRow[] = [
  { category: 'VISIT_URBAN', status: 'OK', label: '', quantity: 0, unit_price: 20000 },
  { category: 'VISIT_URBAN', status: 'DO', label: '', quantity: 0, unit_price: 20000 },
  { category: 'VISIT_RURAL', status: 'OK', label: '', quantity: 0, unit_price: 25000 },
  { category: 'VISIT_RURAL', status: 'DO', label: '', quantity: 0, unit_price: 25000 },
  { category: 'TELP_QUAL', status: 'OK', label: '', quantity: 0, unit_price: 30000 },
  { category: 'TELP_QUAL', status: 'DO', label: '', quantity: 0, unit_price: 15000 },
  { category: 'TELP_QUANT', status: 'OK', label: '', quantity: 0, unit_price: 20000 },
  { category: 'CLT_TIMESHEET', status: 'NONE', label: '', quantity: 0, unit_price: 150000 },
  { category: 'RECORDING', status: 'NONE', label: '', quantity: 0, unit_price: 30000 },
  { category: 'UANG_MAKAN', status: 'NONE', label: '', quantity: 0, unit_price: 5000 },
  { category: 'INPUT_PERPI', status: 'NONE', label: '', quantity: 0, unit_price: 5000 },
  { category: 'PARKIR', status: 'NONE', label: '', quantity: 0, unit_price: 15000 },
  { category: 'BENSIN', status: 'NONE', label: '', quantity: 0, unit_price: 20000 },
];

interface QCReportFormProps {
  projectId: number;
  initial?: QCReport;
}

function toDateInput(s: string | null | undefined): string {
  if (!s) return '';
  return s.slice(0, 10);
}

export default function QCReportForm({ projectId, initial }: QCReportFormProps) {
  const router = useRouter();
  const [createReport, { isLoading: creating }] = useCreateQCReportMutation();
  const [updateReport, { isLoading: updating }] = useUpdateQCReportMutation();
  const { data: usersData } = useGetUsersQuery(undefined);

  const users = usersData?.data || [];
  const qcUsers = users.filter((u) => u.role === 'QC' || u.role === 'QC_COORDINATOR');

  const [form, setForm] = useState({
    qc_user_id: initial?.qc_user_id ? String(initial.qc_user_id) : '',
    spv_names: initial?.spv_names || '',
    project_type: (initial?.project_type || 'KUALITATIF') as QCProjectType,
    methodology: (initial?.methodology || 'IDI') as QCMethodology,
    city: initial?.city || '',
    area: (initial?.area || 'URBAN') as QCArea,
    execution_start_date: toDateInput(initial?.execution_start_date),
    execution_end_date: toDateInput(initial?.execution_end_date),
    briefing_date: toDateInput(initial?.briefing_date),
    work_start_date: toDateInput(initial?.work_start_date),
    work_end_date: toDateInput(initial?.work_end_date),
    visit_target: initial?.visit_target || 0,
    visit_ok: initial?.visit_ok || 0,
    telp_target: initial?.telp_target || 0,
    telp_ok: initial?.telp_ok || 0,
    location: initial?.location || 'Jakarta',
    report_date: toDateInput(initial?.report_date) || new Date().toISOString().slice(0, 10),
    qc_signatory_name: initial?.qc_signatory_name || '',
    qc_signatory_title: initial?.qc_signatory_title || 'Quality Control',
    coordinator_signatory_name: initial?.coordinator_signatory_name || '',
    coordinator_signatory_title: initial?.coordinator_signatory_title || 'Koordinator QC',
    note: initial?.note || '',
  });

  const [items, setItems] = useState<ItemFormRow[]>(
    initial?.items && initial.items.length > 0
      ? initial.items.map((it) => ({
          id: it.id,
          category: it.category,
          status: it.status,
          label: it.label,
          quantity: it.quantity,
          unit_price: it.unit_price,
        }))
      : DEFAULT_ITEMS
  );

  const [recruiters, setRecruiters] = useState<RecruiterFormRow[]>(
    initial?.recruiters && initial.recruiters.length > 0
      ? initial.recruiters.map((r) => ({
          id: r.id,
          recruiter_name: r.recruiter_name,
          total: r.total,
          ok_perpi: r.ok_perpi,
          do_perpi: r.do_perpi,
          ok_qc: r.ok_qc,
          do_qc: r.do_qc,
          notes: r.notes,
        }))
      : []
  );

  const total = items.reduce(
    (sum, it) => sum + Number(it.quantity) * Number(it.unit_price),
    0
  );

  const addItem = () => {
    setItems([
      ...items,
      { category: 'LAIN_LAIN', status: 'NONE', label: '', quantity: 0, unit_price: 0 },
    ]);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, patch: Partial<ItemFormRow>) => {
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const addRecruiter = () => {
    setRecruiters([
      ...recruiters,
      {
        recruiter_name: '',
        total: 0,
        ok_perpi: 0,
        do_perpi: 0,
        ok_qc: 0,
        do_qc: 0,
        notes: '',
      },
    ]);
  };

  const removeRecruiter = (idx: number) => {
    setRecruiters(recruiters.filter((_, i) => i !== idx));
  };

  const updateRecruiter = (idx: number, patch: Partial<RecruiterFormRow>) => {
    setRecruiters(recruiters.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.qc_user_id) {
      toast.error('Nama QC wajib dipilih');
      return;
    }

    const payload = {
      project_id: projectId,
      qc_user_id: Number(form.qc_user_id),
      spv_names: form.spv_names,
      project_type: form.project_type,
      methodology: form.methodology,
      city: form.city,
      area: form.area,
      execution_start_date: form.execution_start_date || null,
      execution_end_date: form.execution_end_date || null,
      briefing_date: form.briefing_date || null,
      work_start_date: form.work_start_date || null,
      work_end_date: form.work_end_date || null,
      visit_target: Number(form.visit_target) || 0,
      visit_ok: Number(form.visit_ok) || 0,
      telp_target: Number(form.telp_target) || 0,
      telp_ok: Number(form.telp_ok) || 0,
      location: form.location,
      report_date: form.report_date || null,
      qc_signatory_name: form.qc_signatory_name,
      qc_signatory_title: form.qc_signatory_title,
      coordinator_signatory_name: form.coordinator_signatory_name,
      coordinator_signatory_title: form.coordinator_signatory_title,
      note: form.note,
      items: items
        .filter((it) => it.quantity > 0 || it.unit_price > 0)
        .map((it, i) => ({
          category: it.category,
          status: it.status,
          label: it.label,
          quantity: Number(it.quantity) || 0,
          unit_price: Number(it.unit_price) || 0,
          sort_order: i,
        })),
      recruiters: recruiters
        .filter((r) => r.recruiter_name.trim().length > 0)
        .map((r, i) => ({
          recruiter_name: r.recruiter_name,
          total: Number(r.total) || 0,
          ok_perpi: Number(r.ok_perpi) || 0,
          do_perpi: Number(r.do_perpi) || 0,
          ok_qc: Number(r.ok_qc) || 0,
          do_qc: Number(r.do_qc) || 0,
          notes: r.notes,
          sort_order: i,
        })),
    };

    try {
      if (initial) {
        await updateReport({ id: initial.id, body: payload }).unwrap();
        toast.success('Laporan berhasil diperbarui!');
      } else {
        await createReport(payload).unwrap();
        toast.success('Laporan berhasil dibuat!');
      }
      router.push(`/projects/${projectId}?tab=qc-reports`);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal menyimpan laporan');
    }
  };

  const isSaving = creating || updating;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {initial ? 'Edit Laporan Keuangan QC' : 'Buat Laporan Keuangan QC'}
          </h1>
          <p className="text-sm text-slate-500">
            Laporan Keuangan QC per Project
          </p>
        </div>
      </div>

      {/* Identitas */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Identitas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nama QC *
            </label>
            <select
              required
              value={form.qc_user_id}
              onChange={(e) => {
                const u = qcUsers.find((x) => String(x.id) === e.target.value);
                setForm({
                  ...form,
                  qc_user_id: e.target.value,
                  qc_signatory_name: u?.full_name || form.qc_signatory_name,
                });
              }}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">Pilih QC...</option>
              {qcUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nama SPV
            </label>
            <input
              value={form.spv_names}
              onChange={(e) => setForm({ ...form, spv_names: e.target.value })}
              placeholder="Suhendra / Sri Retno Dewi"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tipe Proyek *
            </label>
            <div className="flex gap-2">
              {(Object.keys(QC_PROJECT_TYPE_LABELS) as QCProjectType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, project_type: t })}
                  className={clsx(
                    'flex-1 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all',
                    form.project_type === t
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  )}
                >
                  {QC_PROJECT_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Metodologi *
            </label>
            <select
              value={form.methodology}
              onChange={(e) =>
                setForm({ ...form, methodology: e.target.value as QCMethodology })
              }
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {(Object.keys(QC_METHODOLOGY_LABELS) as QCMethodology[]).map((m) => (
                <option key={m} value={m}>
                  {QC_METHODOLOGY_LABELS[m]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Kota
            </label>
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Jabodetabek"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Area *
            </label>
            <div className="flex gap-2">
              {(Object.keys(QC_AREA_LABELS) as QCArea[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setForm({ ...form, area: a })}
                  className={clsx(
                    'flex-1 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all',
                    form.area === a
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  )}
                >
                  {QC_AREA_LABELS[a]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tanggal */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Tanggal Pelaksanaan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={form.execution_start_date}
              onChange={(e) =>
                setForm({ ...form, execution_start_date: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tanggal Selesai
            </label>
            <input
              type="date"
              value={form.execution_end_date}
              onChange={(e) =>
                setForm({ ...form, execution_end_date: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Briefing
            </label>
            <input
              type="date"
              value={form.briefing_date}
              onChange={(e) =>
                setForm({ ...form, briefing_date: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Waktu Kerja Mulai
            </label>
            <input
              type="date"
              value={form.work_start_date}
              onChange={(e) =>
                setForm({ ...form, work_start_date: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Waktu Kerja Selesai
            </label>
            <input
              type="date"
              value={form.work_end_date}
              onChange={(e) =>
                setForm({ ...form, work_end_date: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Target */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Target QC (100%)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Visit Total
            </label>
            <input
              type="number"
              min={0}
              value={form.visit_target}
              onChange={(e) =>
                setForm({ ...form, visit_target: Number(e.target.value) })
              }
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Visit OK
            </label>
            <input
              type="number"
              min={0}
              value={form.visit_ok}
              onChange={(e) =>
                setForm({ ...form, visit_ok: Number(e.target.value) })
              }
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Telp Total
            </label>
            <input
              type="number"
              min={0}
              value={form.telp_target}
              onChange={(e) =>
                setForm({ ...form, telp_target: Number(e.target.value) })
              }
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Telp OK
            </label>
            <input
              type="number"
              min={0}
              value={form.telp_ok}
              onChange={(e) =>
                setForm({ ...form, telp_ok: Number(e.target.value) })
              }
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800">
            Perhitungan Harga QC
          </h3>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <Plus size={14} />
            Tambah Item
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="text-left px-2 py-2 w-48">Kategori</th>
                <th className="text-left px-2 py-2 w-24">Status</th>
                <th className="text-left px-2 py-2">Label</th>
                <th className="text-center px-2 py-2 w-20">Qty</th>
                <th className="text-right px-2 py-2 w-36">Harga Satuan</th>
                <th className="text-right px-2 py-2 w-36">Subtotal</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => {
                const subtotal = Number(it.quantity) * Number(it.unit_price);
                return (
                  <tr key={idx} className="border-b border-slate-50">
                    <td className="px-2 py-2">
                      <select
                        value={it.category}
                        onChange={(e) =>
                          updateItem(idx, {
                            category: e.target.value as QCItemCategory,
                          })
                        }
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      >
                        {(
                          Object.keys(QC_CATEGORY_LABELS) as QCItemCategory[]
                        ).map((c) => (
                          <option key={c} value={c}>
                            {QC_CATEGORY_LABELS[c]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <select
                        value={it.status}
                        onChange={(e) =>
                          updateItem(idx, {
                            status: e.target.value as QCItemStatus,
                          })
                        }
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      >
                        <option value="NONE">-</option>
                        <option value="OK">OK</option>
                        <option value="DO">DO</option>
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        value={it.label}
                        onChange={(e) =>
                          updateItem(idx, { label: e.target.value })
                        }
                        placeholder="Opsional"
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min={0}
                        value={it.quantity}
                        onChange={(e) =>
                          updateItem(idx, { quantity: Number(e.target.value) })
                        }
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-900 text-center focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <CurrencyInput
                        value={it.unit_price}
                        onChange={(val) => updateItem(idx, { unit_price: val })}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-900 text-right focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </td>
                    <td className="px-2 py-2 text-right text-xs font-semibold text-slate-900">
                      {formatCurrency(subtotal)}
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td
                  colSpan={5}
                  className="px-2 py-3 text-right text-sm font-semibold text-slate-700"
                >
                  Total Biaya
                </td>
                <td className="px-2 py-3 text-right text-base font-bold text-indigo-600">
                  {formatCurrency(total)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Recruiter Performance */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800">
            Perolehan Recruiter
          </h3>
          <button
            type="button"
            onClick={addRecruiter}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <Plus size={14} />
            Tambah Recruiter
          </button>
        </div>
        {recruiters.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">
            Belum ada recruiter. Klik "Tambah Recruiter" untuk mulai.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-2 py-2 w-10">No</th>
                  <th className="text-left px-2 py-2">Nama Rekuter</th>
                  <th className="text-center px-2 py-2 w-16">Total</th>
                  <th className="text-center px-2 py-2 w-20">OK Perpi</th>
                  <th className="text-center px-2 py-2 w-20">DO Perpi</th>
                  <th className="text-center px-2 py-2 w-20">OK QC</th>
                  <th className="text-center px-2 py-2 w-20">DO QC</th>
                  <th className="text-left px-2 py-2">Keterangan</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {recruiters.map((r, idx) => (
                  <tr key={idx} className="border-b border-slate-50">
                    <td className="px-2 py-2 text-sm text-slate-600">
                      {idx + 1}
                    </td>
                    <td className="px-2 py-2">
                      <input
                        required
                        value={r.recruiter_name}
                        onChange={(e) =>
                          updateRecruiter(idx, { recruiter_name: e.target.value })
                        }
                        placeholder="Nama"
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </td>
                    {(['total', 'ok_perpi', 'do_perpi', 'ok_qc', 'do_qc'] as const).map(
                      (field) => (
                        <td key={field} className="px-2 py-2">
                          <input
                            type="number"
                            min={0}
                            value={r[field]}
                            onChange={(e) =>
                              updateRecruiter(idx, {
                                [field]: Number(e.target.value),
                              })
                            }
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-900 text-center focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </td>
                      )
                    )}
                    <td className="px-2 py-2">
                      <input
                        value={r.notes}
                        onChange={(e) =>
                          updateRecruiter(idx, { notes: e.target.value })
                        }
                        placeholder="Keterangan"
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => removeRecruiter(idx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tanda Tangan */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">
          Tanda Tangan & Lokasi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Lokasi
            </label>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Jakarta"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tanggal Laporan
            </label>
            <input
              type="date"
              value={form.report_date}
              onChange={(e) => setForm({ ...form, report_date: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nama Yang Membuat (QC)
            </label>
            <input
              value={form.qc_signatory_name}
              onChange={(e) =>
                setForm({ ...form, qc_signatory_name: e.target.value })
              }
              placeholder="Muhammad Royhan"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Jabatan QC
            </label>
            <input
              value={form.qc_signatory_title}
              onChange={(e) =>
                setForm({ ...form, qc_signatory_title: e.target.value })
              }
              placeholder="Quality Control"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nama Yang Mengetahui (Koordinator)
            </label>
            <input
              value={form.coordinator_signatory_name}
              onChange={(e) =>
                setForm({ ...form, coordinator_signatory_name: e.target.value })
              }
              placeholder="Muhammad Royhan"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Jabatan Koordinator
            </label>
            <input
              value={form.coordinator_signatory_title}
              onChange={(e) =>
                setForm({ ...form, coordinator_signatory_title: e.target.value })
              }
              placeholder="Koordinator QC"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Catatan
            </label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={2}
              placeholder="Catatan tambahan..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Save size={16} />
          {isSaving ? 'Menyimpan...' : initial ? 'Simpan Perubahan' : 'Simpan Laporan'}
        </button>
      </div>
    </form>
  );
}
