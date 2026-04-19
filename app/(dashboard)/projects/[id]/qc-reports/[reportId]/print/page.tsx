'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGetQCReportQuery } from '@/lib/api/qcReportApi';
import { useGetCompanySettingsQuery } from '@/lib/api/companySettingsApi';
import { formatCurrency, formatDate, terbilang, resolveFileUrl } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import type { QCItemCategory, QCItemStatus, QCReportItem } from '@/lib/types';
import { QC_CATEGORY_LABELS } from '@/lib/types';
import { Printer, ArrowLeft } from 'lucide-react';

// Build display rows for the table (Image 2 structure)
// Table columns: Perhitungan Harga QC | Status | N QC | x Rp (unit_price) | = Rp (subtotal)
interface DisplayRow {
  label: string;
  status: QCItemStatus;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  isTotal?: boolean;
  indent?: boolean;
}

// Group items by category to create the layout seen in Image 2
function buildDisplayRows(items: QCReportItem[]): DisplayRow[] {
  const rows: DisplayRow[] = [];

  const group = (category: QCItemCategory) =>
    items.filter((it) => it.category === category);

  const pushCategory = (title: string, category: QCItemCategory) => {
    const grouped = group(category);
    if (grouped.length === 0) return;

    // Add header row (category name only, no numbers)
    const hasStatusVariants = grouped.some(
      (it) => it.status === 'OK' || it.status === 'DO'
    );

    if (hasStatusVariants) {
      // Show header then child rows with OK/DO status
      grouped.forEach((it, idx) => {
        rows.push({
          label: idx === 0 ? title : '',
          status: it.status,
          quantity: it.quantity,
          unitPrice: it.unit_price,
          subtotal: it.subtotal,
          indent: idx > 0,
        });
      });
    } else {
      grouped.forEach((it) => {
        const label = it.label ? `${title}: ${it.label}` : title;
        rows.push({
          label,
          status: it.status,
          quantity: it.quantity,
          unitPrice: it.unit_price,
          subtotal: it.subtotal,
        });
      });
    }
  };

  const ordered: Array<[string, QCItemCategory]> = [
    ['Visit Urban', 'VISIT_URBAN'],
    ['Visit Rural', 'VISIT_RURAL'],
    ['Telp Qual', 'TELP_QUAL'],
    ['Telp Quant', 'TELP_QUANT'],
    ['CLT / Time Sheet', 'CLT_TIMESHEET'],
    ['Recording', 'RECORDING'],
    ['Uang Makan', 'UANG_MAKAN'],
    ['Input Perpi', 'INPUT_PERPI'],
    ['Parkir', 'PARKIR'],
    ['Lain-lain : Bensin', 'BENSIN'],
    ['Lain-lain', 'LAIN_LAIN'],
  ];

  for (const [title, cat] of ordered) {
    pushCategory(title, cat);
  }

  return rows;
}

const METHODOLOGY_INDEX: Record<string, number> = {
  FGD_TRIAD: 1,
  HOME_VISIT: 2,
  CLT: 3,
  IDI: 4,
  RANDOM: 5,
};

const METHODOLOGY_LIST = [
  { key: 'FGD_TRIAD', label: 'FGD / Triad' },
  { key: 'HOME_VISIT', label: 'Home Visit / Ethno' },
  { key: 'CLT', label: 'CLT' },
  { key: 'IDI', label: 'IDI' },
  { key: 'RANDOM', label: 'Random' },
];

const AREA_LIST = [
  { key: 'URBAN', label: 'Urban' },
  { key: 'RURAL', label: 'Rural' },
  { key: 'URBAN_RURAL', label: 'Urban & Rural' },
];

export default function PrintQCReportPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);
  const reportId = Number(params.reportId);
  const { data, isLoading, isError } = useGetQCReportQuery(reportId);
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
  const rows = buildDisplayRows(rep.items);

  const handlePrint = () => window.print();

  const reportDateFormatted = rep.report_date
    ? new Date(rep.report_date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  const logoUrl = company?.logo_url ? resolveFileUrl(company.logo_url) : '';

  return (
    <div className="bg-slate-100 min-h-screen py-6 print-bg">
      {/* Print controls - hidden on print */}
      <div className="max-w-5xl mx-auto px-4 mb-4 flex items-center justify-between no-print">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Printer size={16} />
          Print / Simpan PDF
        </button>
      </div>

      {/* A4 paper */}
      <div className="max-w-5xl mx-auto bg-white shadow-lg print-paper">
        <div className="px-10 py-8 text-[13px] text-slate-900">
          {/* Header with logo + form code */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={company?.company_name || 'Logo'}
                  className="h-12 object-contain"
                />
              ) : (
                <div className="text-lg font-bold text-emerald-600">
                  {company?.company_name || 'CIKAL GEMILANG'}
                </div>
              )}
            </div>
            <div className="text-right text-xs text-slate-600 uppercase tracking-wider">
              FORM {company?.company_code || 'CIGA'}-QC
            </div>
          </div>

          {/* Title */}
          <h1 className="text-center text-base font-bold underline mb-6">
            LAPORAN KEUANGAN QC PER PROJECT
          </h1>

          {/* Identitas 2 columns */}
          <div className="grid grid-cols-2 gap-x-10 gap-y-1 mb-5 text-[12px]">
            <InfoRow label="Nama QC" value={rep.qc_user_name} />
            <InfoRow
              label="No Rek"
              value={company?.bank_account_number || ''}
            />
            <InfoRow label="Nama SPV" value={rep.spv_names} />
            <InfoRow label="No ID" value={''} />
            <InfoRow label="Nama Proyek" value={rep.project_name} />
            <div></div>
            <div>
              <InfoLabel label="Tipe Proyek" />
              <div className="flex gap-3 ml-28">
                <CheckOption
                  num={1}
                  label="Kualitatif"
                  active={rep.project_type === 'KUALITATIF'}
                />
                <CheckOption
                  num={2}
                  label="Kuantitatif"
                  active={rep.project_type === 'KUANTITATIF'}
                />
              </div>
            </div>
            <div></div>
            <div>
              <InfoLabel label="Metodologi" />
              <div className="ml-28 grid grid-cols-3 gap-x-2 text-[11px]">
                {METHODOLOGY_LIST.map((m) => (
                  <CheckOption
                    key={m.key}
                    num={METHODOLOGY_INDEX[m.key]}
                    label={m.label}
                    active={rep.methodology === m.key}
                  />
                ))}
              </div>
            </div>
            <div></div>
            <InfoRow label="Kota" value={rep.city} />
            <div></div>
            <div>
              <InfoLabel label="Area" />
              <div className="flex gap-3 ml-28">
                {AREA_LIST.map((a, idx) => (
                  <CheckOption
                    key={a.key}
                    num={idx + 1}
                    label={a.label}
                    active={rep.area === a.key}
                  />
                ))}
              </div>
            </div>
            <div></div>
            <InfoRow
              label="Tanggal Pelaksanaan"
              value={
                rep.execution_start_date && rep.execution_end_date
                  ? `${formatDate(rep.execution_start_date)} - ${formatDate(
                      rep.execution_end_date
                    )}`
                  : rep.execution_start_date
                    ? formatDate(rep.execution_start_date)
                    : ''
              }
            />
            <div></div>
            <InfoRow
              label="Briefing"
              value={
                rep.briefing_date ? formatDate(rep.briefing_date) : ''
              }
            />
            <div></div>
            <InfoRow
              label="Waktu Kerja"
              value={
                rep.work_start_date && rep.work_end_date
                  ? `${formatDate(rep.work_start_date)} - ${formatDate(
                      rep.work_end_date
                    )}`
                  : rep.work_start_date
                    ? formatDate(rep.work_start_date)
                    : ''
              }
            />
            <InfoRow label="Telp" value={`Total : ${rep.telp_target}`} />
            <div>
              <InfoLabel label="N Qc (Target Qc 100%)" />
              <div className="ml-28 text-[11px]">
                Visit: <strong>{rep.visit_target}</strong>
              </div>
            </div>
            <InfoRow label="OK" value={`: ${rep.telp_ok}`} />
          </div>

          {/* Perhitungan Harga QC Table */}
          <table className="w-full border-collapse text-[11px] mb-6">
            <thead>
              <tr className="border-y border-slate-800">
                <th className="text-left font-semibold py-1.5 px-2">
                  Perhitungan Harga QC
                </th>
                <th className="text-center font-semibold py-1.5 px-2 w-20">
                  Status
                </th>
                <th className="text-center font-semibold py-1.5 px-2 w-16">
                  N QC
                </th>
                <th className="text-left font-semibold py-1.5 px-2 w-32">
                  x Rp
                </th>
                <th className="text-right font-semibold py-1.5 px-2 w-32">
                  = Rp Total
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td className={`py-1 px-2 ${row.indent ? 'pl-6' : ''}`}>
                    {row.label}
                  </td>
                  <td className="py-1 px-2 text-center">
                    {row.status !== 'NONE' ? row.status : ''}
                  </td>
                  <td className="py-1 px-2 text-center">
                    {row.quantity > 0 ? row.quantity : ''}
                  </td>
                  <td className="py-1 px-2">
                    {row.unitPrice > 0 ? formatCurrency(row.unitPrice) : ''}
                  </td>
                  <td className="py-1 px-2 text-right">
                    {row.subtotal > 0 ? formatCurrency(row.subtotal) : '-'}
                  </td>
                </tr>
              ))}
              <tr className="border-t border-slate-800 font-bold">
                <td colSpan={4} className="py-1.5 px-2">
                  Total Biaya
                </td>
                <td className="py-1.5 px-2 text-right">
                  {formatCurrency(rep.total_amount)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Terbilang */}
          <div className="mb-6 text-[12px]">
            <span className="italic">Terbilang: </span>
            <span className="italic">{terbilang(rep.total_amount)}</span>
          </div>

          {/* Signatures */}
          <div className="flex items-start justify-between mt-8 text-[12px]">
            <div>
              <div>{rep.location}, {reportDateFormatted}</div>
              <div className="mt-1">Yang membuat,</div>
              <div className="h-20"></div>
              <div className="font-semibold underline">
                {rep.qc_signatory_name || rep.qc_user_name}
              </div>
              <div className="text-[11px]">( {rep.qc_signatory_title} )</div>
            </div>
            <div>
              <div>&nbsp;</div>
              <div className="mt-1">Mengetahui,</div>
              <div className="h-20"></div>
              <div className="font-semibold underline">
                {rep.coordinator_signatory_name || '-'}
              </div>
              <div className="text-[11px]">
                ( {rep.coordinator_signatory_title} )
              </div>
              <div className="text-right mt-1 text-[11px]">QC DEPT</div>
            </div>
          </div>

          {/* Note */}
          <div className="mt-8 text-[12px]">
            <div>Note:</div>
            <div className="min-h-[40px] border-b border-slate-300">
              {rep.note}
            </div>
          </div>
        </div>
      </div>

      {/* Recruiter Performance Page (Image 3) - separate printable page */}
      {rep.recruiters.length > 0 && (
        <div className="max-w-5xl mx-auto bg-white shadow-lg mt-6 print-paper print-break">
          <div className="px-10 py-8 text-[13px] text-slate-900">
            <div className="mb-6 text-[12px]">
              <div className="grid grid-cols-[120px_1fr] gap-y-1">
                <span>Nama Project</span>
                <span>: {rep.project_name}</span>
                <span>Nama Qc</span>
                <span>: {rep.qc_user_name}</span>
              </div>
            </div>

            <table className="w-full border border-slate-700 text-[11px]">
              <thead>
                <tr>
                  <th className="border border-slate-700 py-1.5 px-2 w-10">No</th>
                  <th className="border border-slate-700 py-1.5 px-2 text-left">
                    Nama Rekuter
                  </th>
                  <th className="border border-slate-700 py-1.5 px-2 w-16">
                    Total
                  </th>
                  <th className="border border-slate-700 py-1.5 px-2 w-20">
                    OK Perpi
                  </th>
                  <th className="border border-slate-700 py-1.5 px-2 w-20">
                    DO Perpi
                  </th>
                  <th className="border border-slate-700 py-1.5 px-2 w-16">
                    OK Qc
                  </th>
                  <th className="border border-slate-700 py-1.5 px-2 w-16">
                    DO Qc
                  </th>
                  <th className="border border-slate-700 py-1.5 px-2 text-left">
                    Keterangan
                  </th>
                </tr>
              </thead>
              <tbody>
                {rep.recruiters.map((r, i) => (
                  <tr key={r.id}>
                    <td className="border border-slate-700 py-1.5 px-2 text-center">
                      {i + 1}
                    </td>
                    <td className="border border-slate-700 py-1.5 px-2">
                      {r.recruiter_name}
                    </td>
                    <td className="border border-slate-700 py-1.5 px-2 text-center">
                      {r.total}
                    </td>
                    <td className="border border-slate-700 py-1.5 px-2 text-center">
                      {r.ok_perpi}
                    </td>
                    <td className="border border-slate-700 py-1.5 px-2 text-center">
                      {r.do_perpi}
                    </td>
                    <td className="border border-slate-700 py-1.5 px-2 text-center">
                      {r.ok_qc}
                    </td>
                    <td className="border border-slate-700 py-1.5 px-2 text-center">
                      {r.do_qc}
                    </td>
                    <td className="border border-slate-700 py-1.5 px-2">
                      {r.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Print-specific styles */}
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
          .print-break {
            page-break-before: always;
          }
          /* hide sidebar and app chrome */
          aside,
          header {
            display: none !important;
          }
          main {
            margin: 0 !important;
            padding: 0 !important;
          }
          /* force portrait A4 */
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
        }
      `}</style>
    </div>
  );
}

function InfoLabel({ label }: { label: string }) {
  return (
    <span className="inline-block w-28 text-[12px]">
      {label} <span className="float-right">:</span>
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex text-[12px]">
      <InfoLabel label={label} />
      <span className="ml-2 flex-1">{value || '-'}</span>
    </div>
  );
}

function CheckOption({
  num,
  label,
  active,
}: {
  num: number;
  label: string;
  active: boolean;
}) {
  return (
    <span
      className={
        active
          ? 'font-semibold bg-yellow-200 px-1 rounded'
          : 'text-slate-700'
      }
    >
      {num}. {label}
    </span>
  );
}
