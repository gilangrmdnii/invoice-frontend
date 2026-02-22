'use client';

import { use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGetInvoiceQuery } from '@/lib/api/invoiceApi';
import { useGetCompanySettingsQuery } from '@/lib/api/companySettingsApi';
import { formatNumber, terbilang, numberToWords } from '@/lib/utils';
import { INVOICE_TYPE_LABELS } from '@/lib/types';
import type { InvoiceItem } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Badge from '@/components/ui/Badge';
import { ArrowLeft, Printer } from 'lucide-react';

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
  const { data, isLoading, isError } = useGetInvoiceQuery(Number(id));
  const { data: csData } = useGetCompanySettingsQuery();

  const invoice = data?.data;
  const company = csData?.data;

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

  // Colors from the contoh PDF
  const thBg = '#5b5b5b';
  const labelBg = '#e8e8e8';
  const borderColor = '#d0d0d0';

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
          <div style={{ maxWidth: '210mm', margin: '0 auto', fontFamily: "'Segoe UI', Arial, Helvetica, sans-serif", fontSize: 10, color: '#1a1a1a', lineHeight: 1.4 }}>

            {/* ===== HEADER: Logo + Date/Number ===== */}
            <div style={{ marginBottom: 16 }}>
              {company?.logo_url ? (
                <img
                  src={`${apiBase}${company.logo_url}`}
                  alt="Logo"
                  style={{ height: 60, marginBottom: 4 }}
                />
              ) : (
                <div style={{ fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4 }}>
                  {company?.company_name || 'Company Name'}
                </div>
              )}
              <div style={{ fontSize: 10, color: '#555' }}>
                {invoice.invoice_date && (
                  <span>
                    {new Date(invoice.invoice_date).toLocaleDateString(isID ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 10, color: '#555' }}>
                {invoice.invoice_number}
              </div>
            </div>

            {/* ===== KEPADA ===== */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 10, color: '#555' }}>{isID ? 'Kepada Yth.' : 'To'}</p>
              <p style={{ fontSize: 11, fontWeight: 700 }}>{invoice.recipient_name}</p>
              {invoice.attention && <p style={{ fontSize: 10, fontWeight: 700 }}>{invoice.attention}</p>}
              {invoice.recipient_address && <p style={{ fontSize: 10, color: '#555' }}>{invoice.recipient_address}</p>}
            </div>

            {/* ===== INVOICE TITLE BADGE ===== */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 0, height: 0, borderTop: '12px solid transparent', borderBottom: '12px solid transparent', borderLeft: '12px solid #4a4a4a' }}></div>
              <span style={{ fontSize: 16, fontWeight: 300, color: '#333', letterSpacing: 1 }}>
                INVOICE - {INVOICE_TYPE_LABELS[invoice.invoice_type] || invoice.invoice_type}
              </span>
            </div>

            {/* ===== PROJECT NAME ===== */}
            {invoice.project_name && (
              <p style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
                {invoice.project_name}
              </p>
            )}

            {/* ===== ITEMS TABLE ===== */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 0 }}>
              <thead>
                <tr>
                  <th style={{ background: thBg, color: 'white', padding: '6px 8px', textAlign: 'center', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', width: 30 }}>&nbsp;</th>
                  <th style={{ background: thBg, color: 'white', padding: '6px 8px', textAlign: 'left', fontSize: 9, fontWeight: 600, textTransform: 'uppercase' }}>
                    {isID ? 'KETERANGAN' : 'DESCRIPTION'}
                  </th>
                  <th style={{ background: thBg, color: 'white', padding: '6px 8px', textAlign: 'right', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', width: 90 }}>
                    {isID ? 'HARGA' : 'PRICE'}
                  </th>
                  <th style={{ background: thBg, color: 'white', padding: '6px 8px', textAlign: 'center', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', width: 55 }}>
                    {isID ? 'JUMLAH' : 'QTY'}
                  </th>
                  <th style={{ background: thBg, color: 'white', padding: '6px 8px', textAlign: 'center', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', width: 50 }}>UNIT</th>
                  <th style={{ background: thBg, color: 'white', padding: '6px 8px', textAlign: 'right', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', width: 100 }}>SUB TOTAL (Rp)</th>
                  <th style={{ background: thBg, color: 'white', padding: '6px 8px', textAlign: 'right', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', width: 100 }}>TOTAL (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group, gIdx) => {
                  const rows: React.ReactNode[] = [];

                  // Label row (bold, grey background)
                  if (group.label) {
                    rows.push(
                      <tr key={`label-${gIdx}`}>
                        <td style={{ background: labelBg, padding: '5px 8px', borderBottom: `1px solid ${borderColor}`, fontWeight: 700, fontSize: 10 }} colSpan={6}>
                          {group.label.description}
                        </td>
                        <td style={{ background: labelBg, padding: '5px 8px', borderBottom: `1px solid ${borderColor}` }}></td>
                      </tr>
                    );
                  }

                  // Child items
                  group.children.forEach((child, cIdx) => {
                    const isLast = cIdx === group.children.length - 1;
                    rows.push(
                      <tr key={`item-${gIdx}-${cIdx}`}>
                        <td style={{ padding: '4px 8px', borderBottom: `1px solid ${borderColor}`, fontSize: 10, textAlign: 'center' }}></td>
                        <td style={{ padding: '4px 8px', borderBottom: `1px solid ${borderColor}`, fontSize: 10 }}>{child.description}</td>
                        <td style={{ padding: '4px 8px', borderBottom: `1px solid ${borderColor}`, fontSize: 10, textAlign: 'right' }}>
                          {child.unit_price > 0 ? formatNumber(child.unit_price) : ''}
                        </td>
                        <td style={{ padding: '4px 8px', borderBottom: `1px solid ${borderColor}`, fontSize: 10, textAlign: 'center' }}>
                          {child.quantity}
                        </td>
                        <td style={{ padding: '4px 8px', borderBottom: `1px solid ${borderColor}`, fontSize: 10, textAlign: 'center' }}>
                          {child.unit}
                        </td>
                        <td style={{ padding: '4px 8px', borderBottom: `1px solid ${borderColor}`, fontSize: 10, textAlign: 'right' }}>
                          {formatNumber(child.subtotal)}
                        </td>
                        <td style={{ padding: '4px 8px', borderBottom: `1px solid ${borderColor}`, fontSize: 10, textAlign: 'right', fontWeight: isLast && group.label ? 600 : 'normal' }}>
                          {/* Show TOTAL (Rp) only on last item of a labeled group */}
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
                  <td colSpan={6} style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, fontSize: 10, borderBottom: `1px solid ${borderColor}` }}>
                    TOTAL
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, fontSize: 10, borderBottom: `1px solid ${borderColor}` }}>
                    {formatNumber(invoice.amount)}
                  </td>
                </tr>

                {/* DP row */}
                {dpPct && dpAmount !== null && (
                  <tr>
                    <td colSpan={6} style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, fontSize: 10, borderBottom: `1px solid ${borderColor}` }}>
                      {isID ? `PEMBAYARAN DP ${dpPct}%` : `DOWN PAYMENT ${dpPct}%`}
                    </td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, fontSize: 10, borderBottom: `1px solid ${borderColor}` }}>
                      {formatNumber(dpAmount)}
                    </td>
                  </tr>
                )}

                {/* PELUNASAN row */}
                {dpPct && pelunasan !== null && (
                  <tr>
                    <td colSpan={6} style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, fontSize: 10, borderBottom: `1px solid ${borderColor}` }}>
                      {isID ? 'PELUNASAN' : 'BALANCE DUE'}
                    </td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, fontSize: 10, borderBottom: `1px solid ${borderColor}` }}>
                      {formatNumber(pelunasan)}
                    </td>
                  </tr>
                )}

                {/* Tax row (if applicable) */}
                {invoice.tax_percentage > 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, fontSize: 10, borderBottom: `1px solid ${borderColor}` }}>
                      {isID ? 'PAJAK' : 'TAX'} ({invoice.tax_percentage}%)
                    </td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, fontSize: 10, borderBottom: `1px solid ${borderColor}` }}>
                      {formatNumber(invoice.tax_amount)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* ===== TERBILANG ===== */}
            <div style={{ marginTop: 16, marginBottom: 24, fontSize: 10 }}>
              <span>{isID ? 'Terbilang' : 'Amount in words'} : </span>
              <span>{amountInWords}</span>
            </div>

            {/* ===== SISTEM PEMBAYARAN ===== */}
            {company?.bank_name && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 16, fontWeight: 300, color: '#555', marginBottom: 8, letterSpacing: 0.5 }}>
                  {isID ? 'sistem' : 'payment'}<span style={{ fontWeight: 600 }}>{isID ? 'pembayaran' : ' system'}</span>
                </p>
                <p style={{ fontSize: 10, marginBottom: 2 }}>
                  {isID ? 'Mohon dapat dibayarkan selambat-lambatnya 7 hari sebelum pelaksanaan' : 'Please make payment at least 7 days before execution'}
                </p>
                <p style={{ fontSize: 10, marginBottom: 2 }}>
                  {isID ? 'Pembayaran dapat dilakukan secara tunai atau transfer ke :' : 'Payment can be made in cash or transfer to:'}
                </p>
                <p style={{ fontSize: 10, fontWeight: 700 }}>
                  {company.bank_name} {company.bank_branch ? `Cabang ${company.bank_branch}` : ''}
                </p>
                <p style={{ fontSize: 10 }}>
                  Rek <span style={{ fontWeight: 700 }}>{company.bank_account_number}</span>
                </p>
                <p style={{ fontSize: 10 }}>
                  a/n <span style={{ fontWeight: 700 }}>{company.bank_account_name}</span>
                </p>
              </div>
            )}

            {/* ===== NOTES ===== */}
            {invoice.notes && (
              <div style={{ marginBottom: 16, fontSize: 10, color: '#555' }}>
                <p>{invoice.notes}</p>
              </div>
            )}

            {/* ===== SIGNATURE ===== */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 10, marginBottom: 4 }}>{isID ? 'Terimakasih.' : 'Thank you.'}</p>
              <p style={{ fontSize: 10, marginBottom: 60 }}>{isID ? 'Hormat Kami' : 'Best regards'}</p>

              {/* Placeholder for e-meterai + stamp area */}
              <div style={{ marginBottom: 8, height: 60 }}>
                {/* e-meterai would go here */}
              </div>

              <p style={{ fontSize: 11, fontWeight: 700 }}>{company?.signatory_name || '________________'}</p>
              {company?.signatory_title && <p style={{ fontSize: 10, color: '#555' }}>{company.signatory_title}</p>}
            </div>

            {/* ===== FOOTER ===== */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', marginTop: 40, borderTop: '1px solid #e0e0e0', paddingTop: 12 }}>
              <div style={{ textAlign: 'right', fontSize: 9, color: '#555', lineHeight: 1.6 }}>
                {company?.address && <p>{company.address}</p>}
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
    </div>
  );
}
