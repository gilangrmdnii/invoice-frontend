'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGetFinanceReportQuery } from '@/lib/api/financeReportApi';
import { useGetCompanySettingsQuery } from '@/lib/api/companySettingsApi';
import { formatCurrency, formatDate, resolveFileUrl } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { FINANCE_EXPENSE_CATEGORIES, FINANCE_CATEGORY_LABELS } from '@/lib/types';
import { Printer, ArrowLeft } from 'lucide-react';

export default function PrintFinanceReportPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);
  const { data, isLoading, isError } = useGetFinanceReportQuery(projectId);
  const { data: companyData } = useGetCompanySettingsQuery();

  useEffect(() => {
    document.body.classList.add('print-mode');
    return () => {
      document.body.classList.remove('print-mode');
    };
  }, []);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !data?.data)
    return <EmptyState title="Laporan tidak ditemukan" description="" />;

  const rep = data.data;
  const company = companyData?.data;
  const logoUrl = company?.logo_url ? resolveFileUrl(company.logo_url) : '';

  // Group daily expenses by member (Image 1: BATOK 28 Jan, DEWI 28 Jan, etc.)
  // Summary per member aggregation for display
  const memberTotals = rep.member_breakdowns.reduce((acc, m) => {
    acc += m.total;
    return acc;
  }, 0);

  const handlePrint = () => window.print();

  return (
    <div className="bg-slate-100 min-h-screen py-6 print-bg">
      {/* Print controls - hidden on print */}
      <div className="max-w-6xl mx-auto px-4 mb-4 flex items-center justify-between no-print">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700"
        >
          <Printer size={16} />
          Print / Simpan PDF
        </button>
      </div>

      {/* A4 Landscape paper */}
      <div className="max-w-6xl mx-auto bg-white shadow-lg print-paper">
        <div className="px-10 py-8 text-[11px] text-slate-900">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {logoUrl && (
                <img src={logoUrl} alt="Logo" className="h-10 object-contain" />
              )}
              <div className="text-sm font-bold text-emerald-600">
                {company?.company_name || 'CIKAL GEMILANG'}
              </div>
            </div>
            <div className="text-right text-[10px] text-slate-600 uppercase tracking-wider">
              FORM {company?.company_code || 'CIGA'}-FIN
            </div>
          </div>

          {/* Project info header */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-0.5 mb-5 text-[11px]">
            <InfoRow label="Nama Project" value={rep.project_name} />
            <InfoRow
              label="Tanggal Pelaksanaan"
              value={
                rep.execution_start_date && rep.execution_end_date
                  ? `${formatDate(rep.execution_start_date)} - ${formatDate(rep.execution_end_date)}`
                  : '-'
              }
            />
            <InfoRow label="Nama SPV" value={rep.spv_names || '-'} />
            <InfoRow label="Nama QC" value={rep.qc_names || '-'} />
            <InfoRow
              label="Jumlah ID/FGD"
              value={`${rep.jumlah_main} main + ${rep.jumlah_backup} Backup`}
            />
          </div>

          {/* Pengeluaran Project + Breakdown per Member — side by side */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Left: Daily expenses */}
            <div>
              <div className="font-bold mb-1.5">Pengeluaran Project</div>
              <table className="w-full border-collapse text-[10px]">
                <thead>
                  <tr className="border-y border-slate-800">
                    <th className="text-left font-semibold py-1 px-2">
                      Uang masuk
                    </th>
                    <th className="text-right font-semibold py-1 px-2 w-28">
                      Jumlah
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rep.daily_expenses.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-2 px-2 text-slate-400">
                        -
                      </td>
                    </tr>
                  ) : (
                    rep.daily_expenses.map((d, i) => (
                      <tr key={i}>
                        <td className="py-0.5 px-2">
                          {formatDate(d.tanggal)} ({d.member_name})
                        </td>
                        <td className="py-0.5 px-2 text-right">
                          {formatCurrency(d.uang_keluar)}
                        </td>
                      </tr>
                    ))
                  )}
                  <tr className="border-t border-slate-800 font-bold">
                    <td className="py-1 px-2">Jumlah</td>
                    <td className="py-1 px-2 text-right">
                      {formatCurrency(rep.total_pengeluaran)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Right: Per-member breakdown */}
            <div>
              <div className="font-bold mb-1.5">Breakdown per Anggota</div>
              {rep.member_breakdowns.map((mb) => (
                <table
                  key={mb.user_id}
                  className="w-full border-collapse text-[10px] mb-2"
                >
                  <thead>
                    <tr className="border-y border-slate-800">
                      <th className="text-left font-semibold py-1 px-2" colSpan={2}>
                        {mb.full_name || `User #${mb.user_id}`}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {FINANCE_EXPENSE_CATEGORIES.map((cat) => {
                      const amt = mb.categories[cat];
                      if (!amt) return null;
                      return (
                        <tr key={cat}>
                          <td className="py-0.5 px-2">
                            {FINANCE_CATEGORY_LABELS[cat]}
                          </td>
                          <td className="py-0.5 px-2 text-right">
                            {formatCurrency(amt)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="border-t border-slate-400 font-bold">
                      <td className="py-0.5 px-2">Rp</td>
                      <td className="py-0.5 px-2 text-right">
                        {formatCurrency(mb.total)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              ))}
            </div>
          </div>

          {/* Perolehan Recruit */}
          <div className="mb-4 print-break-avoid">
            <div className="font-bold mb-1.5">Perolehan Recruit</div>
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="border-y border-slate-800">
                  <th className="text-left font-semibold py-1 px-2">
                    Nama Recruiter
                  </th>
                  <th className="text-center font-semibold py-1 px-2 w-16">
                    Jumlah
                  </th>
                  <th className="text-right font-semibold py-1 px-2 w-28">
                    Fee Recruiter
                  </th>
                  <th className="text-right font-semibold py-1 px-2 w-32">
                    Insentif Resp. Main
                  </th>
                  <th className="text-center font-semibold py-1 px-2 w-20">
                    Jml Main
                  </th>
                  <th className="text-right font-semibold py-1 px-2 w-32">
                    Insentif Resp. Backup
                  </th>
                  <th className="text-center font-semibold py-1 px-2 w-20">
                    Jml Backup
                  </th>
                  <th className="text-right font-semibold py-1 px-2 w-28">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {rep.recruiter_fees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-2 px-2 text-slate-400 text-center">
                      -
                    </td>
                  </tr>
                ) : (
                  rep.recruiter_fees.map((f) => (
                    <tr key={f.id}>
                      <td className="py-0.5 px-2">{f.recruiter_name}</td>
                      <td className="py-0.5 px-2 text-center">{f.jumlah}</td>
                      <td className="py-0.5 px-2 text-right">
                        {formatCurrency(f.fee_recruiter)}
                      </td>
                      <td className="py-0.5 px-2 text-right">
                        {formatCurrency(f.insentif_responden_main)}
                      </td>
                      <td className="py-0.5 px-2 text-center">
                        {f.jumlah_responden_main}
                      </td>
                      <td className="py-0.5 px-2 text-right">
                        {formatCurrency(f.insentif_responden_backup)}
                      </td>
                      <td className="py-0.5 px-2 text-center">
                        {f.jumlah_responden_backup}
                      </td>
                      <td className="py-0.5 px-2 text-right font-semibold">
                        {formatCurrency(f.total || 0)}
                      </td>
                    </tr>
                  ))
                )}
                <tr className="border-t border-slate-800 font-bold">
                  <td colSpan={7} className="py-1 px-2 text-right">
                    Total
                  </td>
                  <td className="py-1 px-2 text-right">
                    {formatCurrency(rep.total_perolehan_recruit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Sample per Tanggal */}
          <div className="mb-4 print-break-avoid">
            <div className="font-bold mb-1.5">
              Tabel Sample per Tanggal Pelaksanaan
            </div>
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="border-y border-slate-800">
                  <th className="text-left font-semibold py-1 px-2 w-32">
                    Tgl Pelaksanaan
                  </th>
                  <th className="text-center font-semibold py-1 px-2 w-20">
                    Sample
                  </th>
                  <th className="text-right font-semibold py-1 px-2 w-32">
                    Insentif Resp. Main
                  </th>
                  <th className="text-center font-semibold py-1 px-2 w-20">
                    Jml Main
                  </th>
                  <th className="text-right font-semibold py-1 px-2 w-32">
                    Insentif Backup
                  </th>
                  <th className="text-center font-semibold py-1 px-2 w-20">
                    Jml Backup
                  </th>
                  <th className="text-right font-semibold py-1 px-2 w-28">
                    Jumlah
                  </th>
                </tr>
              </thead>
              <tbody>
                {rep.sample_entries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-2 px-2 text-slate-400 text-center">
                      -
                    </td>
                  </tr>
                ) : (
                  rep.sample_entries.map((s) => (
                    <tr key={s.id}>
                      <td className="py-0.5 px-2">
                        {formatDate(s.tanggal_pelaksanaan)}
                      </td>
                      <td className="py-0.5 px-2 text-center">
                        {s.jumlah_sample}
                      </td>
                      <td className="py-0.5 px-2 text-right">
                        {formatCurrency(s.insentif_responden_main)}
                      </td>
                      <td className="py-0.5 px-2 text-center">
                        {s.jumlah_responden_main}
                      </td>
                      <td className="py-0.5 px-2 text-right">
                        {formatCurrency(s.insentif_responden_backup)}
                      </td>
                      <td className="py-0.5 px-2 text-center">
                        {s.jumlah_responden_backup}
                      </td>
                      <td className="py-0.5 px-2 text-right font-semibold">
                        {formatCurrency(s.total || 0)}
                      </td>
                    </tr>
                  ))
                )}
                <tr className="border-t border-slate-800 font-bold">
                  <td colSpan={6} className="py-1 px-2 text-right">
                    Total
                  </td>
                  <td className="py-1 px-2 text-right">
                    {formatCurrency(rep.total_sample_incentive)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Grand Total */}
          <div className="mt-6 border-2 border-slate-800 p-3 flex justify-between items-center bg-slate-50">
            <span className="text-sm font-bold">
              TOTAL YANG HARUS DIBAYARKAN
            </span>
            <span className="text-lg font-bold text-emerald-700">
              {formatCurrency(rep.total_yang_dibayarkan)}
            </span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .print-bg {
            background: white !important;
            padding: 0 !important;
          }
          .print-paper {
            box-shadow: none !important;
            max-width: 100% !important;
            margin: 0 !important;
          }
          aside,
          header {
            display: none !important;
          }
          main {
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-break-avoid {
            page-break-inside: avoid;
          }
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex">
      <span className="inline-block w-36">{label}</span>
      <span>: {value || '-'}</span>
    </div>
  );
}
