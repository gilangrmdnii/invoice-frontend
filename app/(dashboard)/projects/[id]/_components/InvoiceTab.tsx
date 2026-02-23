'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useGetInvoicesQuery,
  useCreateInvoiceMutation,
  useDeleteInvoiceMutation,
  useApproveInvoiceMutation,
  useRejectInvoiceMutation,
} from '@/lib/api/invoiceApi';
import { useAppSelector } from '@/lib/hooks';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { InvoiceType, PaymentStatus } from '@/lib/types';
import { INVOICE_TYPE_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import {
  Plus,
  FileText,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  X,
  Tag,
  CheckCircle as CheckCircleIcon,
  Clock as ClockIcon,
  AlertCircle as AlertCircleIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// ============ Types for form state ============

interface FormItem {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
}

interface LabelGroup {
  label: string;
  items: FormItem[];
}

const EMPTY_FORM_ITEM: FormItem = {
  description: '',
  quantity: 1,
  unit: 'unit',
  unit_price: 0,
};

interface InvoiceTabProps {
  projectId: number;
}

export default function InvoiceTab({ projectId }: InvoiceTabProps) {
  const user = useAppSelector((s) => s.auth.user);
  const router = useRouter();
  const { data, isLoading, isError } = useGetInvoicesQuery();
  const [createInvoice, { isLoading: creating }] = useCreateInvoiceMutation();
  const [deleteInvoice] = useDeleteInvoiceMutation();
  const [approveInvoice] = useApproveInvoiceMutation();
  const [rejectInvoice] = useRejectInvoiceMutation();

  const [showModal, setShowModal] = useState(false);
  const [rejectModal, setRejectModal] = useState<number | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [confirmApprove, setConfirmApprove] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  // Form state
  const [form, setForm] = useState({
    invoice_type: 'DP' as InvoiceType,
    recipient_name: '',
    recipient_address: '',
    attention: '',
    po_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    dp_percentage: '',
    tax_percentage: '0',
    notes: '',
    language: 'ID' as 'ID' | 'EN',
  });

  // Label groups (each label has child items)
  const [labelGroups, setLabelGroups] = useState<LabelGroup[]>([
    { label: '', items: [{ ...EMPTY_FORM_ITEM }] },
  ]);

  const canCreate = user?.role === 'FINANCE';
  const canApprove = user?.role === 'OWNER';
  const allInvoices = data?.data || [];
  const invoices = allInvoices.filter((inv) => inv.project_id === projectId);
  const filtered = filterStatus === 'ALL' ? invoices : invoices.filter((i) => i.status === filterStatus);

  // Calculate totals from all items in all groups
  const allItems = labelGroups.flatMap((g) => g.items);
  const subtotal = allItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const taxAmount = subtotal * Number(form.tax_percentage || 0) / 100;
  const total = subtotal + taxAmount;

  // ============ Label/Item CRUD ============

  const addLabelGroup = () => {
    setLabelGroups([...labelGroups, { label: '', items: [{ ...EMPTY_FORM_ITEM }] }]);
  };

  const removeLabelGroup = (gIdx: number) => {
    if (labelGroups.length <= 1) return;
    setLabelGroups(labelGroups.filter((_, i) => i !== gIdx));
  };

  const updateLabel = (gIdx: number, value: string) => {
    const updated = [...labelGroups];
    updated[gIdx] = { ...updated[gIdx], label: value };
    setLabelGroups(updated);
  };

  const addItemToGroup = (gIdx: number) => {
    const updated = [...labelGroups];
    updated[gIdx] = { ...updated[gIdx], items: [...updated[gIdx].items, { ...EMPTY_FORM_ITEM }] };
    setLabelGroups(updated);
  };

  const removeItemFromGroup = (gIdx: number, iIdx: number) => {
    const updated = [...labelGroups];
    if (updated[gIdx].items.length <= 1) return;
    updated[gIdx] = { ...updated[gIdx], items: updated[gIdx].items.filter((_, i) => i !== iIdx) };
    setLabelGroups(updated);
  };

  const updateGroupItem = (gIdx: number, iIdx: number, field: string, value: string | number) => {
    const updated = [...labelGroups];
    const items = [...updated[gIdx].items];
    items[iIdx] = { ...items[iIdx], [field]: value };
    updated[gIdx] = { ...updated[gIdx], items };
    setLabelGroups(updated);
  };

  const resetForm = () => {
    setForm({
      invoice_type: 'DP',
      recipient_name: '',
      recipient_address: '',
      attention: '',
      po_number: '',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: '',
      dp_percentage: '',
      tax_percentage: '0',
      notes: '',
      language: 'ID',
    });
    setLabelGroups([{ label: '', items: [{ ...EMPTY_FORM_ITEM }] }]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Separate labels (groups with label text) from standalone items (groups without label)
    const labels: { description: string; items: { description: string; quantity: number; unit: string; unit_price: number; subtotal: number }[] }[] = [];
    const standaloneItems: { description: string; quantity: number; unit: string; unit_price: number; subtotal: number }[] = [];

    for (const group of labelGroups) {
      const validItems = group.items.filter((i) => i.description && i.unit_price > 0);
      if (validItems.length === 0) continue;

      const mappedItems = validItems.map((i) => ({
        description: i.description,
        quantity: Number(i.quantity),
        unit: i.unit,
        unit_price: Number(i.unit_price),
        subtotal: Number(i.quantity) * Number(i.unit_price),
      }));

      if (group.label.trim()) {
        labels.push({ description: group.label.trim(), items: mappedItems });
      } else {
        standaloneItems.push(...mappedItems);
      }
    }

    if (labels.length === 0 && standaloneItems.length === 0) {
      toast.error('Tambahkan minimal 1 item invoice');
      return;
    }

    try {
      await createInvoice({
        project_id: projectId,
        invoice_type: form.invoice_type,
        recipient_name: form.recipient_name,
        recipient_address: form.recipient_address,
        attention: form.attention,
        po_number: form.po_number,
        invoice_date: form.invoice_date,
        due_date: form.due_date || undefined,
        dp_percentage: form.dp_percentage ? Number(form.dp_percentage) : undefined,
        tax_percentage: Number(form.tax_percentage || 0),
        notes: form.notes,
        language: form.language,
        items: standaloneItems.length > 0 ? standaloneItems : undefined,
        labels: labels.length > 0 ? labels : undefined,
      }).unwrap();
      toast.success('Invoice berhasil dibuat!');
      setShowModal(false);
      resetForm();
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal membuat invoice');
    }
  };

  const handleApprove = async () => {
    if (confirmApprove === null) return;
    try {
      await approveInvoice({ id: confirmApprove }).unwrap();
      toast.success('Invoice disetujui!');
      setConfirmApprove(null);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal menyetujui invoice');
    }
  };

  const handleReject = async () => {
    if (rejectModal === null) return;
    if (rejectNotes.trim().length < 5) {
      toast.error('Alasan penolakan minimal 5 karakter');
      return;
    }
    try {
      await rejectInvoice({ id: rejectModal, body: { notes: rejectNotes } }).unwrap();
      toast.success('Invoice ditolak');
      setRejectModal(null);
      setRejectNotes('');
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal menolak invoice');
    }
  };

  const handleDelete = async () => {
    if (confirmDelete === null) return;
    try {
      await deleteInvoice(confirmDelete).unwrap();
      toast.success('Invoice dihapus');
      setConfirmDelete(null);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal menghapus invoice');
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <EmptyState title="Gagal memuat invoice" description="Pastikan backend berjalan dan coba refresh" />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Daftar Invoice</h2>
          <p className="text-sm text-slate-500 mt-1">{filtered.length} invoice</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          {canCreate && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <Plus size={18} />
              Buat Invoice
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Belum ada invoice" description="Invoice yang dibuat akan muncul di sini" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Invoice #</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Tipe</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Penerima</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Jumlah</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Pembayaran</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Tanggal</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-indigo-500" />
                        <span className="text-sm font-medium text-slate-900">{inv.invoice_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium px-2 py-1 rounded-lg bg-slate-100 text-slate-700">
                        {INVOICE_TYPE_LABELS[inv.invoice_type] || inv.invoice_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{inv.recipient_name}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{formatCurrency(inv.amount)}</td>
                    <td className="px-6 py-4"><Badge status={inv.status} /></td>
                    <td className="px-6 py-4">
                      {inv.status === 'APPROVED' ? (
                        <PaymentStatusBadge status={inv.payment_status} />
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatDate(inv.invoice_date)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => router.push(`/invoices/${inv.id}`)}
                          className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye size={18} />
                        </button>
                        {canApprove && inv.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => setConfirmApprove(inv.id)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Approve"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => setRejectModal(inv.id)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                              title="Reject"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        {canCreate && inv.status === 'PENDING' && (
                          <button
                            onClick={() => setConfirmDelete(inv.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title="Buat Invoice Baru" size="lg">
        <form onSubmit={handleCreate} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          {/* Row 1: Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipe Invoice *</label>
            <select
              required
              value={form.invoice_type}
              onChange={(e) => setForm({ ...form, invoice_type: e.target.value as InvoiceType })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              {(Object.keys(INVOICE_TYPE_LABELS) as InvoiceType[]).map((type) => (
                <option key={type} value={type}>{INVOICE_TYPE_LABELS[type]}</option>
              ))}
            </select>
          </div>

          {/* Row 2: Recipient */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Penerima *</label>
              <input
                required
                value={form.recipient_name}
                onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
                placeholder="PT. Contoh Indonesia"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Attention</label>
              <input
                value={form.attention}
                onChange={(e) => setForm({ ...form, attention: e.target.value })}
                placeholder="Bpk/Ibu ..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Alamat Penerima</label>
            <textarea
              value={form.recipient_address}
              onChange={(e) => setForm({ ...form, recipient_address: e.target.value })}
              rows={2}
              placeholder="Jl. Contoh No. 123, Jakarta"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>

          {/* Row 3: PO, Date, Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">No. PO</label>
              <input
                value={form.po_number}
                onChange={(e) => setForm({ ...form, po_number: e.target.value })}
                placeholder="PO-001"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Bahasa</label>
              <select
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value as 'ID' | 'EN' })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="ID">Indonesia</option>
                <option value="EN">English</option>
              </select>
            </div>
          </div>

          {/* Row: Invoice Date & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tanggal Invoice *</label>
              <input
                type="date"
                required
                value={form.invoice_date}
                onChange={(e) => setForm({ ...form, invoice_date: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Jatuh Tempo</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* ============ Label Groups + Items ============ */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-700">Item Invoice *</label>
              <button
                type="button"
                onClick={addLabelGroup}
                className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                <Tag size={12} />
                + Tambah Label
              </button>
            </div>

            <div className="space-y-4">
              {labelGroups.map((group, gIdx) => (
                <div key={gIdx} className="border border-slate-200 rounded-xl overflow-hidden">
                  {/* Label header */}
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 border-b border-slate-200">
                    <Tag size={14} className="text-slate-400 shrink-0" />
                    <input
                      value={group.label}
                      onChange={(e) => updateLabel(gIdx, e.target.value)}
                      placeholder="Nama label (opsional, kosongkan jika tanpa label)..."
                      className="flex-1 bg-transparent text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => addItemToGroup(gIdx)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
                    >
                      + Item
                    </button>
                    {labelGroups.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLabelGroup(gIdx)}
                        className="p-1 text-slate-400 hover:text-red-500"
                        title="Hapus label & semua item-nya"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Items table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[500px]">
                      <thead>
                        <tr className="bg-white border-b border-slate-100">
                          <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Keterangan</th>
                          <th className="text-center px-3 py-2 text-xs font-semibold text-slate-500 w-20">Qty</th>
                          <th className="text-center px-3 py-2 text-xs font-semibold text-slate-500 w-20">Unit</th>
                          <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500 w-32">Harga</th>
                          <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500 w-32">Subtotal</th>
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((item, iIdx) => (
                          <tr key={iIdx} className="border-b border-slate-100">
                            <td className="px-2 py-1.5">
                              <input
                                required
                                value={item.description}
                                onChange={(e) => updateGroupItem(gIdx, iIdx, 'description', e.target.value)}
                                placeholder="Deskripsi item..."
                                className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500"
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                type="number"
                                required
                                min={0.01}
                                step="any"
                                value={item.quantity || ''}
                                onChange={(e) => updateGroupItem(gIdx, iIdx, 'quantity', Number(e.target.value))}
                                className="w-full px-2 py-1.5 text-sm text-center border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500"
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                required
                                value={item.unit}
                                onChange={(e) => updateGroupItem(gIdx, iIdx, 'unit', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm text-center border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500"
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                type="number"
                                required
                                min={1}
                                value={item.unit_price || ''}
                                onChange={(e) => updateGroupItem(gIdx, iIdx, 'unit_price', Number(e.target.value))}
                                className="w-full px-2 py-1.5 text-sm text-right border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500"
                              />
                            </td>
                            <td className="px-3 py-1.5 text-right text-sm font-medium text-slate-700">
                              {formatCurrency(Number(item.quantity) * Number(item.unit_price))}
                            </td>
                            <td className="px-1 py-1.5">
                              {group.items.length > 1 && (
                                <button type="button" onClick={() => removeItemFromGroup(gIdx, iIdx)} className="p-1 text-slate-400 hover:text-red-500">
                                  <X size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              {(form.invoice_type === 'DP' || form.invoice_type === 'FINAL_PAYMENT') && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">DP Percentage (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="any"
                    value={form.dp_percentage}
                    onChange={(e) => setForm({ ...form, dp_percentage: e.target.value })}
                    placeholder="50"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Pajak (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="any"
                  value={form.tax_percentage}
                  onChange={(e) => setForm({ ...form, tax_percentage: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Catatan</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                />
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-900">{formatCurrency(subtotal)}</span>
              </div>
              {Number(form.tax_percentage) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Pajak ({form.tax_percentage}%)</span>
                  <span className="font-medium text-slate-900">{formatCurrency(taxAmount)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between">
                <span className="text-sm font-semibold text-slate-700">Total</span>
                <span className="text-lg font-bold text-indigo-600">{formatCurrency(total)}</span>
              </div>
              {form.dp_percentage && Number(form.dp_percentage) > 0 && (
                <>
                  <div className="border-t border-slate-200 pt-2 flex justify-between text-sm">
                    <span className="text-slate-500">DP ({form.dp_percentage}%)</span>
                    <span className="font-medium text-slate-900">{formatCurrency(total * Number(form.dp_percentage) / 100)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Pelunasan</span>
                    <span className="font-medium text-slate-900">{formatCurrency(total - total * Number(form.dp_percentage) / 100)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setShowModal(false); resetForm(); }}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {creating ? 'Menyimpan...' : 'Simpan Invoice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={rejectModal !== null} onClose={() => setRejectModal(null)} title="Tolak Invoice" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Alasan Penolakan <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Jelaskan alasan penolakan (min. 5 karakter)..."
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
            {rejectNotes.length > 0 && rejectNotes.trim().length < 5 && (
              <p className="text-xs text-red-500 mt-1">Minimal 5 karakter</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setRejectModal(null); setRejectNotes(''); }}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleReject}
              disabled={rejectNotes.trim().length < 5}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              Tolak
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmApprove !== null}
        onClose={() => setConfirmApprove(null)}
        onConfirm={handleApprove}
        title="Setujui Invoice?"
        message="Invoice yang disetujui tidak bisa dibatalkan. Pastikan data sudah benar."
        confirmLabel="Setujui"
        variant="warning"
      />
      <ConfirmDialog
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Hapus Invoice?"
        message="Invoice yang dihapus tidak bisa dikembalikan."
        confirmLabel="Hapus"
        variant="danger"
      />
    </div>
  );
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config = {
    UNPAID: { bg: 'bg-red-50', text: 'text-red-700', icon: AlertCircleIcon },
    PARTIAL_PAID: { bg: 'bg-amber-50', text: 'text-amber-700', icon: ClockIcon },
    PAID: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircleIcon },
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
