'use client';

import { use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGetInvoiceQuery } from '@/lib/api/invoiceApi';
import { useGetCompanySettingsQuery } from '@/lib/api/companySettingsApi';
import { formatCurrency, formatNumber, terbilang, numberToWords } from '@/lib/utils';
import { INVOICE_TYPE_LABELS } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Badge from '@/components/ui/Badge';
import { ArrowLeft, Printer } from 'lucide-react';

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
        @media print { @page { size: A4; margin: 15mm; } }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #1a1a1a; line-height: 1.5; }
        .invoice-container { max-width: 210mm; margin: 0 auto; padding: 20px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 3px solid #1e40af; padding-bottom: 16px; }
        .company-info h1 { font-size: 20px; color: #1e40af; margin-bottom: 4px; }
        .company-info p { font-size: 10px; color: #4b5563; }
        .invoice-title { text-align: right; }
        .invoice-title h2 { font-size: 24px; color: #1e40af; font-weight: bold; }
        .invoice-title p { font-size: 11px; color: #4b5563; }
        .meta { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .meta-left, .meta-right { width: 48%; }
        .meta-label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
        .meta-value { font-size: 11px; font-weight: 600; margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        table th { background: #1e40af; color: white; padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
        table td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
        table tr:nth-child(even) { background: #f8fafc; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .totals { width: 320px; margin-left: auto; }
        .totals tr td { padding: 6px 10px; font-size: 11px; }
        .totals .total-row { background: #1e40af !important; }
        .totals .total-row td { color: white; font-weight: bold; font-size: 13px; }
        .terbilang { background: #eff6ff; border: 1px solid #bfdbfe; padding: 10px 14px; border-radius: 4px; margin-bottom: 16px; font-style: italic; font-size: 11px; }
        .payment-info { margin-bottom: 20px; }
        .payment-info h3 { font-size: 12px; font-weight: bold; margin-bottom: 6px; color: #1e40af; }
        .payment-info p { font-size: 11px; }
        .signature { display: flex; justify-content: flex-end; margin-top: 40px; }
        .signature-box { text-align: center; width: 200px; }
        .signature-box .line { border-bottom: 1px solid #1a1a1a; margin-top: 60px; margin-bottom: 4px; }
        .dp-section { margin-top: 8px; }
        .dp-section tr td { padding: 4px 10px; font-size: 11px; }
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
  const dpPct = invoice.dp_percentage;
  const dpAmount = dpPct ? invoice.amount * dpPct / 100 : null;
  const pelunasan = dpPct ? invoice.amount - (dpAmount || 0) : null;

  const amountInWords = isID ? terbilang(invoice.amount) : numberToWords(invoice.amount);

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
          <div className="invoice-container">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, borderBottom: '3px solid #1e40af', paddingBottom: 16 }}>
              <div>
                {company?.logo_url && (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000'}${company.logo_url}`}
                    alt="Logo"
                    style={{ height: 50, marginBottom: 8 }}
                  />
                )}
                <h1 style={{ fontSize: 20, color: '#1e40af', fontWeight: 'bold', margin: 0 }}>
                  {company?.company_name || 'Company Name'}
                </h1>
                {company?.address && <p style={{ fontSize: 10, color: '#4b5563', margin: 0 }}>{company.address}</p>}
                {company?.phone && <p style={{ fontSize: 10, color: '#4b5563', margin: 0 }}>Tel: {company.phone}</p>}
                {company?.email && <p style={{ fontSize: 10, color: '#4b5563', margin: 0 }}>Email: {company.email}</p>}
                {company?.npwp && <p style={{ fontSize: 10, color: '#4b5563', margin: 0 }}>NPWP: {company.npwp}</p>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ fontSize: 24, color: '#1e40af', fontWeight: 'bold', margin: 0 }}>INVOICE</h2>
                <p style={{ fontSize: 12, color: '#4b5563', margin: '4px 0', fontWeight: 600 }}>{invoice.invoice_number}</p>
                <p style={{ fontSize: 11, color: '#4b5563', margin: 0 }}>
                  {INVOICE_TYPE_LABELS[invoice.invoice_type]}
                </p>
              </div>
            </div>

            {/* Meta */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ width: '48%' }}>
                <p style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                  {isID ? 'Kepada' : 'Bill To'}
                </p>
                <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{invoice.recipient_name}</p>
                {invoice.recipient_address && <p style={{ fontSize: 11, color: '#4b5563' }}>{invoice.recipient_address}</p>}
                {invoice.attention && <p style={{ fontSize: 11, color: '#4b5563' }}>Attn: {invoice.attention}</p>}
              </div>
              <div style={{ width: '48%', textAlign: 'right' }}>
                <p style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                  {isID ? 'Tanggal' : 'Date'}
                </p>
                <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                  {new Date(invoice.invoice_date).toLocaleDateString(isID ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                {invoice.po_number && (
                  <>
                    <p style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                      {isID ? 'No. PO' : 'PO Number'}
                    </p>
                    <p style={{ fontSize: 12, fontWeight: 600 }}>{invoice.po_number}</p>
                  </>
                )}
              </div>
            </div>

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <thead>
                <tr>
                  <th style={{ background: '#1e40af', color: 'white', padding: '8px 10px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase' }}>No</th>
                  <th style={{ background: '#1e40af', color: 'white', padding: '8px 10px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase' }}>
                    {isID ? 'Keterangan' : 'Description'}
                  </th>
                  <th style={{ background: '#1e40af', color: 'white', padding: '8px 10px', textAlign: 'right', fontSize: 10, textTransform: 'uppercase' }}>
                    {isID ? 'Harga' : 'Price'}
                  </th>
                  <th style={{ background: '#1e40af', color: 'white', padding: '8px 10px', textAlign: 'center', fontSize: 10, textTransform: 'uppercase' }}>
                    {isID ? 'Jumlah' : 'Qty'}
                  </th>
                  <th style={{ background: '#1e40af', color: 'white', padding: '8px 10px', textAlign: 'center', fontSize: 10, textTransform: 'uppercase' }}>Unit</th>
                  <th style={{ background: '#1e40af', color: 'white', padding: '8px 10px', textAlign: 'right', fontSize: 10, textTransform: 'uppercase' }}>Sub Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id || idx} style={{ background: idx % 2 === 1 ? '#f8fafc' : 'white' }}>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb', fontSize: 11 }}>{idx + 1}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb', fontSize: 11 }}>{item.description}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb', fontSize: 11, textAlign: 'right' }}>{formatNumber(item.unit_price)}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb', fontSize: 11, textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb', fontSize: 11, textAlign: 'center' }}>{item.unit}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb', fontSize: 11, textAlign: 'right', fontWeight: 600 }}>{formatNumber(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <table style={{ width: 320, marginLeft: 'auto', borderCollapse: 'collapse', marginBottom: 16 }}>
              <tbody>
                <tr>
                  <td style={{ padding: '6px 10px', fontSize: 11 }}>Subtotal</td>
                  <td style={{ padding: '6px 10px', fontSize: 11, textAlign: 'right', fontWeight: 600 }}>{formatCurrency(invoice.subtotal)}</td>
                </tr>
                {invoice.tax_percentage > 0 && (
                  <tr>
                    <td style={{ padding: '6px 10px', fontSize: 11 }}>{isID ? 'Pajak' : 'Tax'} ({invoice.tax_percentage}%)</td>
                    <td style={{ padding: '6px 10px', fontSize: 11, textAlign: 'right', fontWeight: 600 }}>{formatCurrency(invoice.tax_amount)}</td>
                  </tr>
                )}
                <tr style={{ background: '#1e40af' }}>
                  <td style={{ padding: '8px 10px', fontSize: 13, color: 'white', fontWeight: 'bold' }}>TOTAL</td>
                  <td style={{ padding: '8px 10px', fontSize: 13, color: 'white', fontWeight: 'bold', textAlign: 'right' }}>{formatCurrency(invoice.amount)}</td>
                </tr>
              </tbody>
            </table>

            {/* DP breakdown */}
            {dpPct && dpAmount !== null && pelunasan !== null && (
              <table style={{ width: 320, marginLeft: 'auto', borderCollapse: 'collapse', marginBottom: 16 }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px 10px', fontSize: 11 }}>DP ({dpPct}%)</td>
                    <td style={{ padding: '4px 10px', fontSize: 11, textAlign: 'right', fontWeight: 600 }}>{formatCurrency(dpAmount)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 10px', fontSize: 11 }}>{isID ? 'Pelunasan' : 'Balance Due'}</td>
                    <td style={{ padding: '4px 10px', fontSize: 11, textAlign: 'right', fontWeight: 600 }}>{formatCurrency(pelunasan)}</td>
                  </tr>
                </tbody>
              </table>
            )}

            {/* Terbilang */}
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '10px 14px', borderRadius: 4, marginBottom: 16, fontStyle: 'italic', fontSize: 11 }}>
              <strong>{isID ? 'Terbilang' : 'Amount in Words'}:</strong> {amountInWords}
            </div>

            {/* Bank Info */}
            {company?.bank_name && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 6, color: '#1e40af' }}>
                  {isID ? 'Informasi Pembayaran' : 'Payment Information'}
                </h3>
                <p style={{ fontSize: 11 }}>{isID ? 'Bank' : 'Bank'}: {company.bank_name} {company.bank_branch ? `- ${company.bank_branch}` : ''}</p>
                <p style={{ fontSize: 11 }}>{isID ? 'No. Rekening' : 'Account No.'}: {company.bank_account_number}</p>
                <p style={{ fontSize: 11 }}>{isID ? 'Atas Nama' : 'Account Name'}: {company.bank_account_name}</p>
              </div>
            )}

            {/* Notes */}
            {invoice.notes && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4, color: '#1e40af' }}>
                  {isID ? 'Catatan' : 'Notes'}
                </h3>
                <p style={{ fontSize: 11, color: '#4b5563' }}>{invoice.notes}</p>
              </div>
            )}

            {/* Signature */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 40 }}>
              <div style={{ textAlign: 'center', width: 200 }}>
                <p style={{ fontSize: 10, color: '#6b7280', marginBottom: 60 }}>
                  {isID ? 'Hormat kami,' : 'Best regards,'}
                </p>
                <div style={{ borderBottom: '1px solid #1a1a1a', marginBottom: 4 }}></div>
                <p style={{ fontSize: 11, fontWeight: 'bold' }}>{company?.signatory_name || '________________'}</p>
                {company?.signatory_title && <p style={{ fontSize: 10, color: '#4b5563' }}>{company.signatory_title}</p>}
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
