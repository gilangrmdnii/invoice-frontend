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

// ==================== CSV Export ====================
export function exportToCSV(
  filename: string,
  headers: { label: string; key: string }[],
  rows: Record<string, unknown>[],
) {
  const escape = (val: unknown): string => {
    const str = val == null ? '' : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map((h) => escape(h.label)).join(',');
  const dataLines = rows.map((row) =>
    headers.map((h) => escape(row[h.key])).join(',')
  );
  const csv = [headerLine, ...dataLines].join('\n');

  // BOM for Excel UTF-8 compatibility
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
