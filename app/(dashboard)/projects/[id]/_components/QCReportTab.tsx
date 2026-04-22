'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useGetQCReportsQuery,
  useDeleteQCReportMutation,
} from '@/lib/api/qcReportApi';
import { useAppSelector } from '@/lib/hooks';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { QCReport, QCReportStatus } from '@/lib/types';
import {
  QC_PROJECT_TYPE_LABELS,
  QC_METHODOLOGY_LABELS,
  QC_AREA_LABELS,
  QC_REPORT_STATUS_LABELS,
} from '@/lib/types';
import clsx from 'clsx';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  Plus,
  FileSpreadsheet,
  Pencil,
  Trash2,
  Printer,
  Eye,
  MapPin,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface QCReportTabProps {
  projectId: number;
}

export default function QCReportTab({ projectId }: QCReportTabProps) {
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);
  const { data, isLoading, isError } = useGetQCReportsQuery(projectId);
  const [deleteReport] = useDeleteQCReportMutation();

  const [confirmDelete, setConfirmDelete] = useState<QCReport | null>(null);

  const reports = data?.data || [];
  const isFieldRole = user?.role === 'SPV' || user?.role === 'QC';

  const canModify = (rep: QCReport) => {
    if (rep.status === 'APPROVED' && isFieldRole) return false;
    if (!isFieldRole) return true;
    return rep.created_by === user?.id;
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteReport(confirmDelete.id).unwrap();
      toast.success('Laporan berhasil dihapus');
      setConfirmDelete(null);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal menghapus laporan');
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError)
    return (
      <EmptyState
        title="Gagal memuat laporan QC"
        description="Pastikan backend berjalan dan coba refresh"
      />
    );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Laporan Keuangan QC</h2>
          <p className="text-sm text-slate-500 mt-1">
            {reports.length} laporan
          </p>
        </div>
        <button
          onClick={() => router.push(`/projects/${projectId}/qc-reports/new`)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} />
          Buat Laporan
        </button>
      </div>

      {reports.length === 0 ? (
        <EmptyState
          title="Belum ada laporan QC"
          description="Buat laporan keuangan QC per project untuk proyek ini"
          action={
            <button
              onClick={() => router.push(`/projects/${projectId}/qc-reports/new`)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <Plus size={16} />
              Buat Laporan
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((rep) => (
            <div
              key={rep.id}
              className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <FileSpreadsheet size={20} className="text-indigo-600" />
                  </div>
                  <StatusBadge status={rep.status} />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      router.push(`/projects/${projectId}/qc-reports/${rep.id}`)
                    }
                    className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="Lihat"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() =>
                      router.push(
                        `/projects/${projectId}/qc-reports/${rep.id}/print`
                      )
                    }
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                    title="Print"
                  >
                    <Printer size={18} />
                  </button>
                  {canModify(rep) && (
                    <>
                      <button
                        onClick={() =>
                          router.push(
                            `/projects/${projectId}/qc-reports/${rep.id}/edit`
                          )
                        }
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(rep)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <h3 className="text-base font-semibold text-slate-900 mb-1">
                QC: {rep.qc_user_name}
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                {rep.spv_names && `SPV: ${rep.spv_names}`}
              </p>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  {QC_PROJECT_TYPE_LABELS[rep.project_type]}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">
                  {QC_METHODOLOGY_LABELS[rep.methodology]}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                  {QC_AREA_LABELS[rep.area]}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-500 mb-3">
                {rep.city && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-slate-400" />
                    {rep.city}
                  </div>
                )}
                {rep.execution_start_date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-slate-400" />
                    {formatDate(rep.execution_start_date)}
                    {rep.execution_end_date &&
                      ` - ${formatDate(rep.execution_end_date)}`}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">Total Biaya</span>
                <span className="text-lg font-bold text-indigo-600">
                  {formatCurrency(rep.total_amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Hapus Laporan QC?"
        message={`Laporan QC oleh "${confirmDelete?.qc_user_name}" akan dihapus permanen.`}
        confirmLabel="Hapus"
        variant="danger"
      />
    </div>
  );
}

function StatusBadge({ status }: { status: QCReportStatus }) {
  const styles: Record<QCReportStatus, string> = {
    DRAFT: 'bg-slate-100 text-slate-600',
    PENDING: 'bg-amber-50 text-amber-700',
    APPROVED: 'bg-emerald-50 text-emerald-700',
    REJECTED: 'bg-red-50 text-red-700',
  };
  return (
    <span
      className={clsx(
        'text-[10px] font-semibold px-2 py-0.5 rounded-full',
        styles[status]
      )}
    >
      {QC_REPORT_STATUS_LABELS[status]}
    </span>
  );
}
