'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useGetQCReportQuery,
  useSubmitQCReportMutation,
  useApproveQCReportMutation,
  useRejectQCReportMutation,
} from '@/lib/api/qcReportApi';
import { useAppSelector } from '@/lib/hooks';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import type { QCReportStatus } from '@/lib/types';
import {
  QC_CATEGORY_LABELS,
  QC_METHODOLOGY_LABELS,
  QC_PROJECT_TYPE_LABELS,
  QC_AREA_LABELS,
  QC_REPORT_STATUS_LABELS,
} from '@/lib/types';
import {
  ArrowLeft,
  Printer,
  Pencil,
  FileSpreadsheet,
  Calendar,
  MapPin,
  User,
  Send,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function QCReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);
  const projectId = Number(params.id);
  const reportId = Number(params.reportId);
  const { data, isLoading, isError } = useGetQCReportQuery(reportId);
  const [submitReport, { isLoading: submitting }] = useSubmitQCReportMutation();
  const [approveReport, { isLoading: approving }] = useApproveQCReportMutation();
  const [rejectReport, { isLoading: rejecting }] = useRejectQCReportMutation();

  const [showApprove, setShowApprove] = useState(false);
  const [approveNotes, setApproveNotes] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !data?.data)
    return <EmptyState title="Laporan tidak ditemukan" description="" />;

  const rep = data.data;
  const canApprove =
    (user?.role === 'QC_COORDINATOR' ||
      user?.role === 'FINANCE' ||
      user?.role === 'OWNER') &&
    rep.status === 'PENDING';
  const canSubmit =
    (rep.created_by === user?.id ||
      user?.role === 'QC_COORDINATOR' ||
      user?.role === 'FINANCE' ||
      user?.role === 'OWNER') &&
    (rep.status === 'DRAFT' || rep.status === 'REJECTED');
  const canEdit =
    rep.status !== 'APPROVED' &&
    (rep.created_by === user?.id ||
      user?.role === 'FINANCE' ||
      user?.role === 'OWNER' ||
      user?.role === 'QC_COORDINATOR');

  const handleSubmit = async () => {
    try {
      await submitReport(reportId).unwrap();
      toast.success('Laporan dikirim untuk approval');
      setConfirmSubmit(false);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal submit');
    }
  };

  const handleApprove = async () => {
    try {
      await approveReport({ id: reportId, notes: approveNotes }).unwrap();
      toast.success('Laporan disetujui');
      setShowApprove(false);
      setApproveNotes('');
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal approve');
    }
  };

  const handleReject = async () => {
    if (rejectNotes.trim().length < 3) {
      toast.error('Alasan penolakan minimal 3 karakter');
      return;
    }
    try {
      await rejectReport({ id: reportId, notes: rejectNotes }).unwrap();
      toast.success('Laporan ditolak');
      setShowReject(false);
      setRejectNotes('');
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal reject');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/projects/${projectId}?tab=qc-reports`)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Laporan Keuangan QC
            </h1>
            <p className="text-sm text-slate-500">{rep.project_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={rep.status} />
          {canEdit && (
            <button
              onClick={() =>
                router.push(`/projects/${projectId}/qc-reports/${reportId}/edit`)
              }
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              <Pencil size={16} />
              Edit
            </button>
          )}
          {canSubmit && (
            <button
              onClick={() => setConfirmSubmit(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white text-sm font-medium rounded-xl hover:bg-amber-600 transition-colors"
            >
              <Send size={16} />
              Submit Approval
            </button>
          )}
          {canApprove && (
            <>
              <button
                onClick={() => setShowApprove(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors"
              >
                <CheckCircle size={16} />
                Approve
              </button>
              <button
                onClick={() => setShowReject(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors"
              >
                <XCircle size={16} />
                Reject
              </button>
            </>
          )}
          <button
            onClick={() =>
              router.push(`/projects/${projectId}/qc-reports/${reportId}/print`)
            }
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Printer size={16} />
            Print
          </button>
        </div>
      </div>

      {/* Approval info banner */}
      {rep.status !== 'DRAFT' && (
        <div
          className={clsx(
            'rounded-2xl p-4 flex items-start gap-3',
            rep.status === 'PENDING' && 'bg-amber-50 border border-amber-100',
            rep.status === 'APPROVED' && 'bg-emerald-50 border border-emerald-100',
            rep.status === 'REJECTED' && 'bg-red-50 border border-red-100'
          )}
        >
          <div>
            {rep.status === 'PENDING' && (
              <p className="text-sm font-semibold text-amber-700">
                Menunggu approval dari QC Coordinator / Finance
              </p>
            )}
            {rep.status === 'APPROVED' && (
              <div className="text-sm">
                <p className="font-semibold text-emerald-700">
                  Disetujui oleh {rep.approver_name || '-'}
                </p>
                {rep.approved_at && (
                  <p className="text-xs text-emerald-600 mt-0.5">
                    {formatDateTime(rep.approved_at)}
                  </p>
                )}
                {rep.approval_notes && (
                  <p className="text-xs text-emerald-700 mt-1">
                    Catatan: {rep.approval_notes}
                  </p>
                )}
              </div>
            )}
            {rep.status === 'REJECTED' && (
              <div className="text-sm">
                <p className="font-semibold text-red-700">
                  Ditolak oleh {rep.approver_name || '-'}
                </p>
                {rep.approved_at && (
                  <p className="text-xs text-red-600 mt-0.5">
                    {formatDateTime(rep.approved_at)}
                  </p>
                )}
                {rep.approval_notes && (
                  <p className="text-xs text-red-700 mt-1">
                    Alasan: {rep.approval_notes}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <User size={14} /> Nama QC
          </div>
          <p className="text-base font-semibold text-slate-900">
            {rep.qc_user_name}
          </p>
          {rep.spv_names && (
            <p className="text-xs text-slate-500 mt-1">SPV: {rep.spv_names}</p>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <FileSpreadsheet size={14} /> Tipe
          </div>
          <p className="text-base font-semibold text-slate-900">
            {QC_PROJECT_TYPE_LABELS[rep.project_type]}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {QC_METHODOLOGY_LABELS[rep.methodology]} &middot;{' '}
            {QC_AREA_LABELS[rep.area]}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <Calendar size={14} /> Pelaksanaan
          </div>
          <p className="text-sm font-semibold text-slate-900">
            {rep.execution_start_date && formatDate(rep.execution_start_date)}
            {rep.execution_end_date &&
              ` - ${formatDate(rep.execution_end_date)}`}
          </p>
          {rep.city && (
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <MapPin size={12} />
              {rep.city}
            </p>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">
            Perhitungan Harga QC
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                  Kategori
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                  Status
                </th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                  Qty
                </th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                  Harga
                </th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rep.items.map((it) => (
                <tr key={it.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-3 text-sm text-slate-900">
                    {QC_CATEGORY_LABELS[it.category]}
                    {it.label && (
                      <span className="text-slate-400 ml-1">
                        : {it.label}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {it.status !== 'NONE' && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                        {it.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-sm text-center text-slate-600">
                    {it.quantity}
                  </td>
                  <td className="px-6 py-3 text-sm text-right text-slate-600">
                    {formatCurrency(it.unit_price)}
                  </td>
                  <td className="px-6 py-3 text-sm text-right font-semibold text-slate-900">
                    {formatCurrency(it.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td colSpan={4} className="px-6 py-4 text-right text-sm font-semibold text-slate-700">
                  Total Biaya
                </td>
                <td className="px-6 py-4 text-right text-lg font-bold text-indigo-600">
                  {formatCurrency(rep.total_amount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Recruiter Table */}
      {rep.recruiters.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">
              Perolehan Recruiter
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-6 py-3 w-12">No</th>
                  <th className="text-left px-6 py-3">Nama Rekuter</th>
                  <th className="text-center px-4 py-3">Total</th>
                  <th className="text-center px-4 py-3">OK Perpi</th>
                  <th className="text-center px-4 py-3">DO Perpi</th>
                  <th className="text-center px-4 py-3">OK QC</th>
                  <th className="text-center px-4 py-3">DO QC</th>
                  <th className="text-left px-6 py-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rep.recruiters.map((r, i) => (
                  <tr key={r.id}>
                    <td className="px-6 py-3 text-sm text-slate-500">{i + 1}</td>
                    <td className="px-6 py-3 text-sm font-medium text-slate-900">
                      {r.recruiter_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-slate-600">
                      {r.total}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-slate-600">
                      {r.ok_perpi}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-slate-600">
                      {r.do_perpi}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-slate-600">
                      {r.ok_qc}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-slate-600">
                      {r.do_qc}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-500">
                      {r.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Signatures */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4">
          Tanda Tangan
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-slate-500 mb-1">Yang membuat</p>
            <p className="text-sm font-semibold text-slate-900">
              {rep.qc_signatory_name || '-'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              ({rep.qc_signatory_title})
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Mengetahui</p>
            <p className="text-sm font-semibold text-slate-900">
              {rep.coordinator_signatory_name || '-'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              ({rep.coordinator_signatory_title})
            </p>
          </div>
        </div>
        {rep.note && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Note:</p>
            <p className="text-sm text-slate-700">{rep.note}</p>
          </div>
        )}
      </div>

      {/* Approve Modal */}
      <Modal
        isOpen={showApprove}
        onClose={() => {
          setShowApprove(false);
          setApproveNotes('');
        }}
        title="Setujui Laporan QC"
      >
        <div className="space-y-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-sm text-emerald-700">
            Laporan yang disetujui tidak dapat diubah lagi oleh QC/SPV.
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Catatan (opsional)
            </label>
            <textarea
              value={approveNotes}
              onChange={(e) => setApproveNotes(e.target.value)}
              placeholder="Catatan persetujuan..."
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowApprove(false);
                setApproveNotes('');
              }}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleApprove}
              disabled={approving}
              className="flex-1 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {approving ? 'Memproses...' : 'Setujui'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={showReject}
        onClose={() => {
          setShowReject(false);
          setRejectNotes('');
        }}
        title="Tolak Laporan QC"
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-50 rounded-xl text-sm text-red-700">
            QC akan menerima notifikasi dan bisa revisi laporan.
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Alasan Penolakan <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Jelaskan alasan penolakan (min. 3 karakter)..."
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowReject(false);
                setRejectNotes('');
              }}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleReject}
              disabled={rejecting || rejectNotes.trim().length < 3}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {rejecting ? 'Memproses...' : 'Tolak'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Submit confirm */}
      <ConfirmDialog
        isOpen={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
        onConfirm={handleSubmit}
        title="Submit Laporan untuk Approval?"
        message="Laporan akan dikirim ke QC Coordinator / Finance untuk review. Setelah submit, status menjadi PENDING."
        confirmLabel={submitting ? 'Memproses...' : 'Submit'}
        variant="warning"
      />
    </div>
  );
}

function StatusBadge({ status }: { status: QCReportStatus }) {
  const styles: Record<QCReportStatus, string> = {
    DRAFT: 'bg-slate-100 text-slate-700',
    PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
  };
  return (
    <span
      className={clsx(
        'text-xs font-semibold px-3 py-1.5 rounded-lg',
        styles[status]
      )}
    >
      {QC_REPORT_STATUS_LABELS[status]}
    </span>
  );
}
