export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-50 text-amber-700 ring-amber-600/20';
    case 'APPROVED':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
    case 'REJECTED':
      return 'bg-red-50 text-red-700 ring-red-600/20';
    case 'ACTIVE':
      return 'bg-blue-50 text-blue-700 ring-blue-600/20';
    case 'COMPLETED':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
    case 'ARCHIVED':
      return 'bg-slate-50 text-slate-700 ring-slate-600/20';
    default:
      return 'bg-slate-50 text-slate-700 ring-slate-600/20';
  }
}

export function getBudgetPercentage(spent: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(Math.round((spent / total) * 100), 100);
}

// ==================== Terbilang (Number to Indonesian Words) ====================
const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

function terbilangHelper(n: number): string {
  if (n < 12) return satuan[n];
  if (n < 20) return satuan[n - 10] + ' Belas';
  if (n < 100) return satuan[Math.floor(n / 10)] + ' Puluh' + (n % 10 > 0 ? ' ' + satuan[n % 10] : '');
  if (n < 200) return 'Seratus' + (n % 100 > 0 ? ' ' + terbilangHelper(n % 100) : '');
  if (n < 1000) return satuan[Math.floor(n / 100)] + ' Ratus' + (n % 100 > 0 ? ' ' + terbilangHelper(n % 100) : '');
  if (n < 2000) return 'Seribu' + (n % 1000 > 0 ? ' ' + terbilangHelper(n % 1000) : '');
  if (n < 1_000_000) return terbilangHelper(Math.floor(n / 1000)) + ' Ribu' + (n % 1000 > 0 ? ' ' + terbilangHelper(n % 1000) : '');
  if (n < 1_000_000_000) return terbilangHelper(Math.floor(n / 1_000_000)) + ' Juta' + (n % 1_000_000 > 0 ? ' ' + terbilangHelper(n % 1_000_000) : '');
  if (n < 1_000_000_000_000) return terbilangHelper(Math.floor(n / 1_000_000_000)) + ' Miliar' + (n % 1_000_000_000 > 0 ? ' ' + terbilangHelper(n % 1_000_000_000) : '');
  return terbilangHelper(Math.floor(n / 1_000_000_000_000)) + ' Triliun' + (n % 1_000_000_000_000 > 0 ? ' ' + terbilangHelper(n % 1_000_000_000_000) : '');
}

export function terbilang(n: number): string {
  if (n === 0) return 'Nol Rupiah';
  const whole = Math.floor(Math.abs(n));
  return terbilangHelper(whole) + ' Rupiah';
}

// English version for international invoices
const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
  'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function numberToWordsHelper(n: number): string {
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 > 0 ? ' ' + ones[n % 10] : '');
  if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 > 0 ? ' ' + numberToWordsHelper(n % 100) : '');
  if (n < 1_000_000) return numberToWordsHelper(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 > 0 ? ' ' + numberToWordsHelper(n % 1000) : '');
  if (n < 1_000_000_000) return numberToWordsHelper(Math.floor(n / 1_000_000)) + ' Million' + (n % 1_000_000 > 0 ? ' ' + numberToWordsHelper(n % 1_000_000) : '');
  return numberToWordsHelper(Math.floor(n / 1_000_000_000)) + ' Billion' + (n % 1_000_000_000 > 0 ? ' ' + numberToWordsHelper(n % 1_000_000_000) : '');
}

export function numberToWords(n: number, currency = 'Rupiah'): string {
  if (n === 0) return `Zero ${currency}`;
  const whole = Math.floor(Math.abs(n));
  return numberToWordsHelper(whole) + ' ' + currency;
}

// ==================== Format Number ====================
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('id-ID').format(n);
}

// ==================== Export Helpers ====================

export type ExportHeader = { label: string; key: string };

export function exportToExcel(
  filename: string,
  headers: ExportHeader[],
  rows: Record<string, unknown>[],
) {
  import('xlsx').then((XLSX) => {
    const wsData = [
      headers.map((h) => h.label),
      ...rows.map((row) => headers.map((h) => row[h.key] ?? '')),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Auto column widths
    ws['!cols'] = headers.map((h) => {
      const maxLen = Math.max(
        h.label.length,
        ...rows.map((r) => String(r[h.key] ?? '').length),
      );
      return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, filename);
  });
}

export function exportToPDF(
  filename: string,
  headers: ExportHeader[],
  rows: Record<string, unknown>[],
) {
  import('jspdf').then(({ default: jsPDF }) => {
    import('jspdf-autotable').then(() => {
      const doc = new jsPDF({ orientation: headers.length > 6 ? 'landscape' : 'portrait' });

      doc.setFontSize(12);
      const title = filename.replace(/\.pdf$/i, '').replace(/_/g, ' ');
      doc.text(title, 14, 15);

      const head = [headers.map((h) => h.label)];
      const body = rows.map((row) =>
        headers.map((h) => {
          const val = row[h.key];
          if (typeof val === 'number') return formatNumber(val);
          return val == null ? '' : String(val);
        })
      );

      (doc as unknown as { autoTable: (opts: Record<string, unknown>) => void }).autoTable({
        head,
        body,
        startY: 22,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [74, 74, 74], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      doc.save(filename);
    });
  });
}
