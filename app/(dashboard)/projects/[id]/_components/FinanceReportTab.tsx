'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  useGetFinanceReportQuery,
  useUpsertFinanceReportMutation,
} from '@/lib/api/financeReportApi';
import { useGetProjectMembersQuery } from '@/lib/api/projectApi';
import { useAppSelector } from '@/lib/hooks';
import { formatCurrency, formatDate } from '@/lib/utils';
import type {
  FinanceRecruiterFee,
  FinanceSampleEntry,
  FinanceManualExpense,
} from '@/lib/types';
import { FINANCE_EXPENSE_CATEGORIES, FINANCE_CATEGORY_LABELS } from '@/lib/types';
import CurrencyInput from '@/components/ui/CurrencyInput';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import {
  Plus,
  Trash2,
  Save,
  Printer,
  Users,
  TrendingUp,
  Banknote,
  Receipt,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface FinanceReportTabProps {
  projectId: number;
}

export default function FinanceReportTab({ projectId }: FinanceReportTabProps) {
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);
  const canAccess = user?.role === 'FINANCE' || user?.role === 'OWNER';
  const { data, isLoading, isError } = useGetFinanceReportQuery(projectId, {
    skip: !canAccess,
  });
  const [upsert, { isLoading: saving }] = useUpsertFinanceReportMutation();
  const { data: membersData } = useGetProjectMembersQuery(projectId);

  const [recruiterFees, setRecruiterFees] = useState<FinanceRecruiterFee[]>([]);
  const [sampleEntries, setSampleEntries] = useState<FinanceSampleEntry[]>([]);
  const [manualExpenses, setManualExpenses] = useState<FinanceManualExpense[]>([]);

  useEffect(() => {
    if (data?.data) {
      setRecruiterFees(data.data.recruiter_fees || []);
      setSampleEntries(data.data.sample_entries || []);
      setManualExpenses(data.data.manual_expenses || []);
    }
  }, [data]);

  if (!canAccess) {
    return (
      <EmptyState
        title="Akses Ditolak"
        description="Laporan Finance hanya dapat diakses oleh FINANCE dan OWNER"
      />
    );
  }
  if (isLoading) return <LoadingSpinner />;
  if (isError || !data?.data)
    return (
      <EmptyState
        title="Gagal memuat laporan finance"
        description="Pastikan backend berjalan dan coba refresh"
      />
    );

  const rep = data.data;
  const members = membersData?.data || [];

  const addRecruiter = () =>
    setRecruiterFees([
      ...recruiterFees,
      {
        recruiter_name: '',
        jumlah: 0,
        fee_recruiter: 0,
        insentif_responden_main: 0,
        jumlah_responden_main: 0,
        insentif_responden_backup: 0,
        jumlah_responden_backup: 0,
      },
    ]);

  const addSample = () =>
    setSampleEntries([
      ...sampleEntries,
      {
        tanggal_pelaksanaan: new Date().toISOString().slice(0, 10),
        jumlah_sample: 0,
        insentif_responden_main: 0,
        jumlah_responden_main: 0,
        insentif_responden_backup: 0,
        jumlah_responden_backup: 0,
      },
    ]);

  const addManual = () =>
    setManualExpenses([
      ...manualExpenses,
      {
        member_user_id: null,
        member_name: '',
        category: 'LAIN_LAIN',
        tanggal: null,
        description: '',
        quantity: 1,
        unit_price: 0,
      },
    ]);

  const handleSave = async () => {
    try {
      await upsert({
        projectId,
        body: {
          recruiter_fees: recruiterFees.map((f, i) => ({
            ...f,
            sort_order: i,
          })),
          sample_entries: sampleEntries.map((s, i) => ({
            ...s,
            sort_order: i,
          })),
          manual_expenses: manualExpenses.map((e, i) => ({
            ...e,
            sort_order: i,
          })),
        },
      }).unwrap();
      toast.success('Laporan finance berhasil disimpan!');
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal menyimpan');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Laporan Finance</h2>
          <p className="text-sm text-slate-500 mt-1">
            Rekapitulasi keuangan proyek
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              router.push(`/projects/${projectId}/finance-report/print`)
            }
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Printer size={16} />
            Print
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Pengeluaran"
          value={formatCurrency(rep.total_pengeluaran)}
          icon={<Receipt size={20} />}
          color="amber"
        />
        <StatCard
          title="Perolehan Recruit"
          value={formatCurrency(rep.total_perolehan_recruit)}
          icon={<Users size={20} />}
          color="blue"
        />
        <StatCard
          title="Insentif Sample"
          value={formatCurrency(rep.total_sample_incentive)}
          icon={<TrendingUp size={20} />}
          color="emerald"
        />
        <StatCard
          title="Total Dibayarkan"
          value={formatCurrency(rep.total_yang_dibayarkan)}
          icon={<Banknote size={20} />}
          color="violet"
          highlight
        />
      </div>

      {/* Project info summary */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">
          Informasi Proyek
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <InfoCell label="Proyek" value={rep.project_name} />
          <InfoCell
            label="Tanggal Pelaksanaan"
            value={
              rep.execution_start_date && rep.execution_end_date
                ? `${formatDate(rep.execution_start_date)} - ${formatDate(rep.execution_end_date)}`
                : '-'
            }
          />
          <InfoCell label="SPV" value={rep.spv_names || '-'} />
          <InfoCell label="QC" value={rep.qc_names || '-'} />
          <InfoCell
            label="Jumlah Main"
            value={String(rep.jumlah_main)}
          />
          <InfoCell
            label="Jumlah Backup"
            value={String(rep.jumlah_backup)}
          />
        </div>
      </div>

      {/* Member Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">
            Breakdown Pengeluaran per Anggota
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-aggregate dari data expenses SPV
          </p>
        </div>
        {rep.member_breakdowns.length === 0 ? (
          <p className="p-6 text-sm text-slate-400 text-center">
            Belum ada data pengeluaran
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-6 py-3">Nama</th>
                  <th className="text-left px-4 py-3">Role</th>
                  {FINANCE_EXPENSE_CATEGORIES.map((c) => (
                    <th key={c} className="text-right px-4 py-3 whitespace-nowrap">
                      {FINANCE_CATEGORY_LABELS[c]}
                    </th>
                  ))}
                  <th className="text-right px-6 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rep.member_breakdowns.map((mb) => (
                  <tr key={mb.user_id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 text-sm font-medium text-slate-900">
                      {mb.full_name || `User #${mb.user_id}`}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {mb.role}
                    </td>
                    {FINANCE_EXPENSE_CATEGORIES.map((c) => (
                      <td
                        key={c}
                        className="px-4 py-3 text-sm text-right text-slate-600"
                      >
                        {mb.categories[c]
                          ? formatCurrency(mb.categories[c])
                          : '-'}
                      </td>
                    ))}
                    <td className="px-6 py-3 text-sm text-right font-semibold text-slate-900">
                      {formatCurrency(mb.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recruiter Fees */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Perolehan Recruit
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Input manual fee recruiter + insentif responden
            </p>
          </div>
          <button
            onClick={addRecruiter}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <Plus size={14} />
            Tambah
          </button>
        </div>
        {recruiterFees.length === 0 ? (
          <p className="p-6 text-sm text-slate-400 text-center">
            Belum ada data
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-2">Nama Recruiter</th>
                  <th className="text-center px-2 py-2 w-16">Jumlah</th>
                  <th className="text-right px-2 py-2 w-32">Fee</th>
                  <th className="text-right px-2 py-2 w-32">Insentif Main</th>
                  <th className="text-center px-2 py-2 w-20">Jml Main</th>
                  <th className="text-right px-2 py-2 w-32">Insentif Backup</th>
                  <th className="text-center px-2 py-2 w-20">Jml Backup</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {recruiterFees.map((f, idx) => (
                  <tr key={idx} className="border-b border-slate-50">
                    <td className="px-4 py-2">
                      <input
                        value={f.recruiter_name}
                        onChange={(e) =>
                          setRecruiterFees(
                            recruiterFees.map((x, i) =>
                              i === idx
                                ? { ...x, recruiter_name: e.target.value }
                                : x
                            )
                          )
                        }
                        placeholder="Nama"
                        className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </td>
                    {(
                      [
                        'jumlah',
                        'fee_recruiter',
                        'insentif_responden_main',
                        'jumlah_responden_main',
                        'insentif_responden_backup',
                        'jumlah_responden_backup',
                      ] as const
                    ).map((field) => {
                      const isCurrency = field.startsWith('fee') || field.startsWith('insentif');
                      return (
                        <td key={field} className="px-2 py-2">
                          {isCurrency ? (
                            <CurrencyInput
                              value={Number(f[field]) || 0}
                              onChange={(val) =>
                                setRecruiterFees(
                                  recruiterFees.map((x, i) =>
                                    i === idx ? { ...x, [field]: val } : x
                                  )
                                )
                              }
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs text-right focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                          ) : (
                            <input
                              type="number"
                              min={0}
                              value={f[field]}
                              onChange={(e) =>
                                setRecruiterFees(
                                  recruiterFees.map((x, i) =>
                                    i === idx
                                      ? { ...x, [field]: Number(e.target.value) }
                                      : x
                                  )
                                )
                              }
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs text-center focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                          )}
                        </td>
                      );
                    })}
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() =>
                          setRecruiterFees(
                            recruiterFees.filter((_, i) => i !== idx)
                          )
                        }
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

      {/* Sample Entries */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Tabel Sample per Tanggal Pelaksanaan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Input jumlah sample + insentif responden per tanggal
            </p>
          </div>
          <button
            onClick={addSample}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <Plus size={14} />
            Tambah
          </button>
        </div>
        {sampleEntries.length === 0 ? (
          <p className="p-6 text-sm text-slate-400 text-center">
            Belum ada data
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-2 w-40">Tgl Pelaksanaan</th>
                  <th className="text-center px-2 py-2 w-24">Sample</th>
                  <th className="text-right px-2 py-2 w-32">Insentif Main</th>
                  <th className="text-center px-2 py-2 w-24">Jml Main</th>
                  <th className="text-right px-2 py-2 w-32">Insentif Backup</th>
                  <th className="text-center px-2 py-2 w-24">Jml Backup</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {sampleEntries.map((s, idx) => (
                  <tr key={idx} className="border-b border-slate-50">
                    <td className="px-4 py-2">
                      <input
                        type="date"
                        value={s.tanggal_pelaksanaan.slice(0, 10)}
                        onChange={(e) =>
                          setSampleEntries(
                            sampleEntries.map((x, i) =>
                              i === idx
                                ? { ...x, tanggal_pelaksanaan: e.target.value }
                                : x
                            )
                          )
                        }
                        className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </td>
                    {(
                      [
                        'jumlah_sample',
                        'insentif_responden_main',
                        'jumlah_responden_main',
                        'insentif_responden_backup',
                        'jumlah_responden_backup',
                      ] as const
                    ).map((field) => {
                      const isCurrency = field.startsWith('insentif');
                      return (
                        <td key={field} className="px-2 py-2">
                          {isCurrency ? (
                            <CurrencyInput
                              value={Number(s[field]) || 0}
                              onChange={(val) =>
                                setSampleEntries(
                                  sampleEntries.map((x, i) =>
                                    i === idx ? { ...x, [field]: val } : x
                                  )
                                )
                              }
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs text-right focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                          ) : (
                            <input
                              type="number"
                              min={0}
                              value={s[field]}
                              onChange={(e) =>
                                setSampleEntries(
                                  sampleEntries.map((x, i) =>
                                    i === idx
                                      ? { ...x, [field]: Number(e.target.value) }
                                      : x
                                  )
                                )
                              }
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs text-center focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                          )}
                        </td>
                      );
                    })}
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSampleEntries(
                            sampleEntries.filter((_, i) => i !== idx)
                          )
                        }
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

      {/* Manual Expenses */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Pengeluaran Tambahan (Manual)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tambahkan pengeluaran yang belum tercatat di sistem SPV
            </p>
          </div>
          <button
            onClick={addManual}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <Plus size={14} />
            Tambah
          </button>
        </div>
        {manualExpenses.length === 0 ? (
          <p className="p-6 text-sm text-slate-400 text-center">
            Belum ada data
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-2 w-40">Tanggal</th>
                  <th className="text-left px-2 py-2 w-40">Member</th>
                  <th className="text-left px-2 py-2 w-32">Kategori</th>
                  <th className="text-left px-2 py-2">Deskripsi</th>
                  <th className="text-center px-2 py-2 w-16">Qty</th>
                  <th className="text-right px-2 py-2 w-32">Harga</th>
                  <th className="text-right px-2 py-2 w-32">Jumlah</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {manualExpenses.map((e, idx) => {
                  const amount = (e.quantity || 1) * (e.unit_price || 0);
                  return (
                    <tr key={idx} className="border-b border-slate-50">
                      <td className="px-4 py-2">
                        <input
                          type="date"
                          value={e.tanggal || ''}
                          onChange={(ev) =>
                            setManualExpenses(
                              manualExpenses.map((x, i) =>
                                i === idx
                                  ? { ...x, tanggal: ev.target.value || null }
                                  : x
                              )
                            )
                          }
                          className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={e.member_user_id || ''}
                          onChange={(ev) => {
                            const id = ev.target.value
                              ? Number(ev.target.value)
                              : null;
                            const m = members.find((mm) => mm.user_id === id);
                            setManualExpenses(
                              manualExpenses.map((x, i) =>
                                i === idx
                                  ? {
                                      ...x,
                                      member_user_id: id,
                                      member_name: m?.full_name || '',
                                    }
                                  : x
                              )
                            );
                          }}
                          className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        >
                          <option value="">-</option>
                          {members.map((m) => (
                            <option key={m.user_id} value={m.user_id}>
                              {m.full_name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={e.category}
                          onChange={(ev) =>
                            setManualExpenses(
                              manualExpenses.map((x, i) =>
                                i === idx
                                  ? { ...x, category: ev.target.value }
                                  : x
                              )
                            )
                          }
                          className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        >
                          {FINANCE_EXPENSE_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {FINANCE_CATEGORY_LABELS[c]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          value={e.description}
                          onChange={(ev) =>
                            setManualExpenses(
                              manualExpenses.map((x, i) =>
                                i === idx
                                  ? { ...x, description: ev.target.value }
                                  : x
                              )
                            )
                          }
                          placeholder="Deskripsi"
                          className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min={0}
                          value={e.quantity}
                          onChange={(ev) =>
                            setManualExpenses(
                              manualExpenses.map((x, i) =>
                                i === idx
                                  ? { ...x, quantity: Number(ev.target.value) }
                                  : x
                              )
                            )
                          }
                          className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs text-center focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <CurrencyInput
                          value={e.unit_price}
                          onChange={(val) =>
                            setManualExpenses(
                              manualExpenses.map((x, i) =>
                                i === idx ? { ...x, unit_price: val } : x
                              )
                            )
                          }
                          className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs text-right focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </td>
                      <td className="px-2 py-2 text-right text-xs font-semibold text-slate-900">
                        {formatCurrency(amount)}
                      </td>
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() =>
                            setManualExpenses(
                              manualExpenses.filter((_, i) => i !== idx)
                            )
                          }
                          className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom action */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? 'Menyimpan...' : 'Simpan Laporan'}
        </button>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
  highlight,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  highlight?: boolean;
}) {
  const colors: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-600' },
  };
  const c = colors[color] || colors.blue;
  return (
    <div
      className={`bg-white rounded-2xl p-5 border ${highlight ? 'border-indigo-200 ring-2 ring-indigo-500/10' : 'border-slate-100'}`}
    >
      <div className={`w-10 h-10 ${c.bg} ${c.text} rounded-xl flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-xs text-slate-500">{title}</p>
      <p className="text-lg font-bold text-slate-900 mt-0.5">{value}</p>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-900 mt-0.5">{value}</p>
    </div>
  );
}
