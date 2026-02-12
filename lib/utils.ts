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
