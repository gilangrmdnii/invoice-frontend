'use client';

import { use, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGetInvoiceQuery, useCreatePaymentMutation, useDeletePaymentMutation } from '@/lib/api/invoiceApi';
import { useGetCompanySettingsQuery } from '@/lib/api/companySettingsApi';
import { useAppSelector } from '@/lib/hooks';
import { formatNumber, formatCurrency, formatDate, terbilang, numberToWords } from '@/lib/utils';
import { INVOICE_TYPE_LABELS, PAYMENT_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/lib/types';
import type { InvoiceItem, PaymentMethod, PaymentStatus } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { ArrowLeft, Printer, Plus, Trash2, CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// Build grouped structure: labels with children, standalone items
function buildGroupedItems(items: InvoiceItem[]) {
  const labels = items.filter((i) => i.is_label);
  const standalone = items.filter((i) => !i.is_label && !i.parent_id);

  const groups: { label: InvoiceItem | null; children: InvoiceItem[] }[] = [];

  for (const label of labels) {
    const children = items.filter((i) => i.parent_id === label.id);
    groups.push({ label, children });
  }

  if (standalone.length > 0) {
    groups.push({ label: null, children: standalone });
  }

  return groups;
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const user = useAppSelector((s) => s.auth.user);
  const { data, isLoading, isError } = useGetInvoiceQuery(Number(id));
  const { data: csData } = useGetCompanySettingsQuery();
  const [createPayment, { isLoading: creatingPayment }] = useCreatePaymentMutation();
  const [deletePayment] = useDeletePaymentMutation();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; invoiceId: number } | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().slice(0, 10),
    payment_method: 'TRANSFER' as PaymentMethod,
    notes: '',
  });

  const invoice = data?.data;
  const company = csData?.data;
  const payments = invoice?.payments || [];
  const canRecordPayment = user?.role === 'FINANCE' || user?.role === 'OWNER';

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;
    try {
      await createPayment({
        invoice_id: invoice.id,
        amount: Number(paymentForm.amount),
        payment_date: paymentForm.payment_date,
        payment_method: paymentForm.payment_method,
        notes: paymentForm.notes || undefined,
      }).unwrap();
      toast.success('Pembayaran berhasil dicatat');
      setShowPaymentModal(false);
      setPaymentForm({
        amount: '',
        payment_date: new Date().toISOString().slice(0, 10),
        payment_method: 'TRANSFER',
        notes: '',
      });
    } catch {
      toast.error('Gagal mencatat pembayaran');
    }
  };

  const handleDeletePayment = async () => {
    if (!deleteConfirm) return;
    try {
      await deletePayment({
        invoiceId: deleteConfirm.invoiceId,
        paymentId: deleteConfirm.id,
      }).unwrap();
      toast.success('Pembayaran berhasil dihapus');
      setDeleteConfirm(null);
    } catch {
      toast.error('Gagal menghapus pembayaran');
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Invoice ${invoice?.invoice_number || ''}</title>
      <style>
        @media print { @page { size: A4; margin: 12mm 15mm; } }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; font-size: 10px; color: #1a1a1a; line-height: 1.4; }
      </style>
    </head><body>${printContent}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError || !invoice) return <EmptyState title="Invoice tidak ditemukan" description="Invoice ini mungkin sudah dihapus" />;

  const isID = invoice.language === 'ID';
  const items = invoice.items || [];
  const groups = buildGroupedItems(items);
  const dpPct = invoice.dp_percentage;
  const dpAmount = dpPct ? invoice.amount * dpPct / 100 : null;
  const pelunasan = dpPct ? invoice.amount - (dpAmount || 0) : null;
  const amountInWords = isID ? terbilang(invoice.amount) : numberToWords(invoice.amount);

  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000';

  // Compute label totals (sum of children subtotals)
  const labelTotals: Record<number, number> = {};
  for (const group of groups) {
    if (group.label) {
      labelTotals[group.label.id!] = group.children.reduce((s, c) => s + c.subtotal, 0);
    }
  }

  // Colors matching the reference PDF
  const thBg = '#4a4a4a';
  const labelBg = '#e8e8e8';
  const borderColor = '#d0d0d0';

  const companyName = company?.company_name || 'Company Name';

  return (
    <div>
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft size={18} />
          Kembali
        </button>
        <div className="flex items-center gap-3">
          <Badge status={invoice.status} />
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Printer size={16} />
            <span className="hidden sm:inline">Cetak / Download PDF</span>
            <span className="sm:hidden">Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Invoice Preview */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-8 shadow-sm overflow-x-auto">
        <div ref={printRef}>
          <div style={{ maxWidth: '210mm', margin: '0 auto', fontFamily: "'Segoe UI', Arial, Helvetica, sans-serif", fontSize: 10, color: '#1a1a1a', lineHeight: 1.5, position: 'relative', minHeight: '297mm' }}>

            {/* ===== HEADER: Logo + Date/Number ===== */}
            <div style={{ marginBottom: 20 }}>
              {company?.logo_url ? (
                <img
                  src={`${apiBase}${company.logo_url}`}
                  alt="Logo"
                  style={{ height: 70, marginBottom: 6 }}
                />
              ) : (
                <div style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#222', lineHeight: 1.2 }}>
                    {companyName}
                  </div>
                </div>
              )}
              <div style={{ fontSize: 10, color: '#333' }}>
                {invoice.invoice_date && (
                  <span>
                    Jakarta, {new Date(invoice.invoice_date).toLocaleDateString(isID ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 10, color: '#333' }}>
                {invoice.invoice_number}
              </div>
            </div>

            {/* ===== KEPADA ===== */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 10, color: '#333' }}>{isID ? 'Kepada Yth.' : 'To'}</p>
              <p style={{ fontSize: 11, fontWeight: 700 }}>{invoice.recipient_name}</p>
              {invoice.attention && <p style={{ fontSize: 10 }}>{invoice.attention}</p>}
              {invoice.recipient_address && <p style={{ fontSize: 10, color: '#333' }}>{invoice.recipient_address}</p>}
            </div>

            {/* ===== INVOICE TITLE ===== */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <svg width="16" height="20" viewBox="0 0 16 20" style={{ flexShrink: 0 }}>
                <path d="M0 2 L16 10 L0 18 Z" fill="#c0392b" />
              </svg>
              <span style={{ fontSize: 18, letterSpacing: 1.5 }}>
                <span style={{ color: '#c0392b', fontWeight: 400 }}>INVOICE</span>
                <span style={{ color: '#888', fontWeight: 300 }}> - {INVOICE_TYPE_LABELS[invoice.invoice_type] || invoice.invoice_type}</span>
              </span>
            </div>

            {/* ===== PROJECT NAME ===== */}
            {invoice.project_name && (
              <p style={{ fontSize: 11, fontWeight: 700, fontStyle: 'italic', marginBottom: 8 }}>
                {invoice.project_name}
              </p>
            )}

            {/* ===== ITEMS TABLE ===== */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 0, fontSize: 10 }}>
              <thead>
                <tr>
                  <th style={{ background: thBg, color: 'white', padding: '6px 6px', textAlign: 'center', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', width: 24, borderRight: '1px solid #666' }}>&nbsp;</th>
                  <th style={{ background: thBg, color: 'white', padding: '6px 8px', textAlign: 'center', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', borderRight: '1px solid #666' }}>
                    {isID ? 'KETERANGAN' : 'DESCRIPTION'}
                  </th>
                  <th style={{ background: thBg, color: 'white', padding: '6px 8px', textAlign: 'center', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', width: 80, borderRight: '1px solid #666' }}>
                    {isID ? 'HARGA' : 'PRICE'}
                  </th>
                  <th style={{ background: thBg, color: 'white', padding: '6px 6px', textAlign: 'center', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', width: 55, borderRight: '1px solid #666' }}>
                    {isID ? 'JUMLAH' : 'QTY'}
                  </th>
                  <th style={{ background: thBg, color: 'white', padding: '6px 6px', textAlign: 'center', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', width: 45, borderRight: '1px solid #666' }}>UNIT</th>
                  <th style={{ background: thBg, color: 'white', padding: '6px 8px', textAlign: 'center', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', width: 100, borderRight: '1px solid #666' }}>SUB TOTAL (Rp)</th>
                  <th style={{ background: thBg, color: 'white', padding: '6px 8px', textAlign: 'center', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', width: 100 }}>TOTAL (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group, gIdx) => {
                  const rows: React.ReactNode[] = [];

                  // Label row (bold, grey background)
                  if (group.label) {
                    rows.push(
                      <tr key={`label-${gIdx}`}>
                        <td style={{ background: labelBg, padding: '4px 6px', borderBottom: `1px solid ${borderColor}`, borderRight: `1px solid ${borderColor}`, fontWeight: 700, fontSize: 10 }} colSpan={6}>
                          {group.label.description}
                        </td>
                        <td style={{ background: labelBg, padding: '4px 8px', borderBottom: `1px solid ${borderColor}` }}>&nbsp;</td>
                      </tr>
                    );
                  }

                  // Child items
                  group.children.forEach((child, cIdx) => {
                    const isLast = cIdx === group.children.length - 1;
                    rows.push(
                      <tr key={`item-${gIdx}-${cIdx}`}>
                        <td style={{ padding: '3px 6px', borderBottom: `1px solid ${borderColor}`, borderRight: `1px solid ${borderColor}`, textAlign: 'center', fontSize: 10 }}>&nbsp;</td>
                        <td style={{ padding: '3px 8px', borderBottom: `1px solid ${borderColor}`, borderRight: `1px solid ${borderColor}`, fontSize: 10 }}>{child.description}</td>
                        <td style={{ padding: '3px 8px', borderBottom: `1px solid ${borderColor}`, borderRight: `1px solid ${borderColor}`, fontSize: 10, textAlign: 'right' }}>
                          {child.unit_price > 0 ? formatNumber(child.unit_price) : ''}
                        </td>
                        <td style={{ padding: '3px 6px', borderBottom: `1px solid ${borderColor}`, borderRight: `1px solid ${borderColor}`, fontSize: 10, textAlign: 'center' }}>
                          {child.quantity}
                        </td>
                        <td style={{ padding: '3px 6px', borderBottom: `1px solid ${borderColor}`, borderRight: `1px solid ${borderColor}`, fontSize: 10, textAlign: 'center' }}>
                          {child.unit}
                        </td>
                        <td style={{ padding: '3px 8px', borderBottom: `1px solid ${borderColor}`, borderRight: `1px solid ${borderColor}`, fontSize: 10, textAlign: 'right' }}>
                          {formatNumber(child.subtotal)}
                        </td>
                        <td style={{ padding: '3px 8px', borderBottom: `1px solid ${borderColor}`, fontSize: 10, textAlign: 'right', fontWeight: isLast && group.label ? 700 : 'normal' }}>
                          {isLast && group.label && labelTotals[group.label.id!] !== undefined
                            ? formatNumber(labelTotals[group.label.id!])
                            : isLast && !group.label
                              ? formatNumber(child.subtotal)
                              : ''
                          }
                        </td>
                      </tr>
                    );
                  });

                  return rows;
                })}

                {/* TOTAL row */}
                <tr>
                  <td colSpan={6} style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, fontSize: 10, borderBottom: `1px solid ${borderColor}` }}>
                    TOTAL
                  </td>
                  <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, fontSize: 10, borderBottom: `1px solid ${borderColor}` }}>
                    {formatNumber(invoice.amount)}
                  </td>
                </tr>

                {/* DP row */}
                {dpPct != null && dpAmount !== null && (
                  <tr>
                    <td colSpan={6} style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 700, fontSize: 10, borderBottom: `1px solid ${borderColor}` }}>
                      {isID ? `PEMBAYARAN DP ${dpPct}%` : `DOWN PAYMENT ${dpPct}%`}
                    </td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 700, fontSize: 10, borderBottom: `1px solid ${borderColor}` }}>
                      {formatNumber(dpAmount)}
                    </td>
                  </tr>
                )}

                {/* PELUNASAN row */}
                {dpPct != null && pelunasan !== null && (
                  <tr>
                    <td colSpan={6} style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 700, fontSize: 10, borderBottom: `1px solid ${borderColor}` }}>
                      {isID ? 'PELUNASAN' : 'BALANCE DUE'}
                    </td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 700, fontSize: 10, borderBottom: `1px solid ${borderColor}` }}>
                      {formatNumber(pelunasan)}
                    </td>
                  </tr>
                )}

                {/* Tax row */}
                {invoice.tax_percentage > 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 700, fontSize: 10, borderBottom: `1px solid ${borderColor}` }}>
                      {isID ? 'PAJAK' : 'TAX'} ({invoice.tax_percentage}%)
                    </td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 700, fontSize: 10, borderBottom: `1px solid ${borderColor}` }}>
                      {formatNumber(invoice.tax_amount)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* ===== TERBILANG ===== */}
            <div style={{ marginTop: 20, marginBottom: 28, fontSize: 10 }}>
              <span>{isID ? 'Terbilang' : 'Amount in words'} : {amountInWords}</span>
            </div>

            {/* ===== SISTEM PEMBAYARAN ===== */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 18, marginBottom: 8, letterSpacing: 0.5, lineHeight: 1.2 }}>
                <span style={{ fontWeight: 300, color: '#999' }}>{isID ? 'sistem' : 'payment'}</span>
                <span style={{ fontWeight: 600, color: '#333' }}>{isID ? 'pembayaran' : ' system'}</span>
              </p>
              <p style={{ fontSize: 10, marginBottom: 2 }}>
                {isID ? 'Mohon dapat dibayarkan selambat-lambatnya 7 hari sebelum pelaksanaan' : 'Please make payment at least 7 days before execution'}
              </p>
              <p style={{ fontSize: 10, marginBottom: 4 }}>
                {isID ? 'Pembayaran dapat dilakukan secara tunai atau transfer ke :' : 'Payment can be made in cash or transfer to:'}
              </p>
              {company?.bank_name ? (
                <>
                  <p style={{ fontSize: 10, fontWeight: 700 }}>
                    {company.bank_name} {company.bank_branch ? `Cabang ${company.bank_branch}` : ''}
                  </p>
                  <p style={{ fontSize: 10 }}>
                    Rek <span style={{ fontWeight: 700 }}>{company.bank_account_number}</span>
                  </p>
                  <p style={{ fontSize: 10 }}>
                    a/n <span style={{ fontWeight: 700 }}>{company.bank_account_name}</span>
                  </p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 10, fontWeight: 700 }}>BCA Cabang -</p>
                  <p style={{ fontSize: 10 }}>Rek <span style={{ fontWeight: 700 }}>-</span></p>
                  <p style={{ fontSize: 10 }}>a/n <span style={{ fontWeight: 700 }}>-</span></p>
                </>
              )}
            </div>

            {/* ===== NOTES ===== */}
            {invoice.notes && (
              <div style={{ marginBottom: 16, fontSize: 10, color: '#555' }}>
                <p>{invoice.notes}</p>
              </div>
            )}

            {/* ===== SIGNATURE AREA ===== */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 10, marginBottom: 2 }}>{isID ? 'Terimakasih.' : 'Thank you.'}</p>
              <p style={{ fontSize: 10, marginBottom: 16 }}>{isID ? 'Hormat Kami' : 'Best regards'}</p>

              {/* E-meterai placeholder */}
              <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 8 }}>
                <div style={{
                  width: 120,
                  height: 120,
                  border: '2px dashed #ccc',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  color: '#bbb',
                  fontSize: 9,
                  textAlign: 'center',
                  background: '#fafafa',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>E-METERAI</div>
                  <div>Rp 10.000</div>
                </div>
              </div>

              <div style={{ borderBottom: '1px solid #333', width: 180, marginBottom: 4 }}></div>
              <p style={{ fontSize: 11, fontWeight: 700 }}>{company?.signatory_name || '________________'}</p>
              {company?.signatory_title && <p style={{ fontSize: 10, color: '#555' }}>{company.signatory_title}</p>}
            </div>

            {/* ===== FOOTER ===== */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderTop: '1px solid #ddd', paddingTop: 10 }}>
              <div style={{ textAlign: 'right', fontSize: 9, color: '#555', fontStyle: 'italic', lineHeight: 1.7 }}>
                {company?.address ? (
                  <p>{company.address}</p>
                ) : (
                  <>
                    <p>Jl. ____________</p>
                    <p>Kota, Provinsi, Kode Pos</p>
                  </>
                )}
                {company?.email && <p>{company.email}</p>}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Reject notes */}
      {invoice.status === 'REJECTED' && invoice.reject_notes && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm font-medium text-red-700">Alasan Penolakan:</p>
          <p className="text-sm text-red-600 mt-1">{invoice.reject_notes}</p>
        </div>
      )}

      {/* ========== PAYMENT TRACKING SECTION ========== */}
      {invoice.status === 'APPROVED' && (
        <div className="mt-6 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          {/* Payment summary header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <CreditCard size={20} className="text-indigo-500" />
                <h3 className="text-lg font-bold text-slate-900">Payment Tracking</h3>
                <PaymentStatusBadge status={invoice.payment_status} />
              </div>
              <p className="text-sm text-slate-500">
                {formatCurrency(invoice.paid_amount)} dari {formatCurrency(invoice.amount)} terbayar
              </p>
            </div>
            {canRecordPayment && invoice.payment_status !== 'PAID' && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors"
              >
                <Plus size={18} />
                Catat Pembayaran
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Terbayar: {formatCurrency(invoice.paid_amount)}</span>
              <span>Sisa: {formatCurrency(Math.max(0, invoice.amount - invoice.paid_amount))}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3">
              <div
                className={clsx('h-3 rounded-full transition-all duration-500', invoice.payment_status === 'PAID' ? 'bg-emerald-500' : 'bg-indigo-500')}
                style={{ width: `${Math.min(100, (invoice.paid_amount / invoice.amount) * 100)}%` }}
              />
            </div>
          </div>

          {/* Payment history */}
          {payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Tanggal</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Jumlah</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Metode</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Dicatat Oleh</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Catatan</th>
                    {canRecordPayment && <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 w-16"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-700">{formatDate(p.payment_date)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900">{formatCurrency(p.amount)}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium px-2 py-1 rounded-lg bg-slate-100 text-slate-700">
                          {PAYMENT_METHOD_LABELS[p.payment_method] || p.payment_method}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{p.creator_name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 max-w-xs truncate">{p.notes || '-'}</td>
                      {canRecordPayment && (
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setDeleteConfirm({ id: p.id, invoiceId: invoice.id })}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <CreditCard size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada pembayaran tercatat</p>
            </div>
          )}
        </div>
      )}

      {/* Record Payment Modal */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Catat Pembayaran">
        <form onSubmit={handleCreatePayment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Jumlah (Rp)</label>
            <input
              type="number"
              required
              min={1}
              max={invoice ? invoice.amount - invoice.paid_amount : undefined}
              step="0.01"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              placeholder={`Maks: ${invoice ? formatNumber(invoice.amount - invoice.paid_amount) : ''}`}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            {invoice && (
              <p className="text-xs text-slate-400 mt-1">Sisa tagihan: {formatCurrency(invoice.amount - invoice.paid_amount)}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tanggal Bayar</label>
              <input
                type="date"
                required
                value={paymentForm.payment_date}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Metode</label>
              <select
                value={paymentForm.payment_method}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value as PaymentMethod })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              >
                <option value="TRANSFER">Transfer</option>
                <option value="CASH">Cash</option>
                <option value="GIRO">Giro</option>
                <option value="OTHER">Lainnya</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Catatan (opsional)</label>
            <textarea
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              placeholder="Nomor referensi transfer, dll..."
              rows={2}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowPaymentModal(false)}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={creatingPayment}
              className="flex-1 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {creatingPayment ? 'Menyimpan...' : 'Simpan Pembayaran'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Payment Confirm */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeletePayment}
        title="Hapus Pembayaran?"
        message="Data pembayaran yang dihapus tidak dapat dikembalikan. Status pembayaran invoice akan diperbarui otomatis."
        confirmLabel="Hapus"
        variant="danger"
      />
    </div>
  );
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config = {
    UNPAID: { bg: 'bg-red-50', text: 'text-red-700', icon: AlertCircle },
    PARTIAL_PAID: { bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
    PAID: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle },
  };
  const c = config[status] || config.UNPAID;
  const Icon = c.icon;
  return (
    <span className={clsx('inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg', c.bg, c.text)}>
      <Icon size={12} />
      {PAYMENT_STATUS_LABELS[status] || status}
    </span>
  );
}
