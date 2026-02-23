'use client';

import { Tag, Trash2, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { ProjectPlanItem } from '@/lib/types';

// ============ Types ============

export interface FormItem {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
}

export interface LabelGroup {
  label: string;
  items: FormItem[];
}

export const EMPTY_FORM_ITEM: FormItem = {
  description: '',
  quantity: 1,
  unit: 'unit',
  unit_price: 0,
};

// ============ Helper Functions ============

export function buildPlanPayload(labelGroups: LabelGroup[]) {
  const labels: { description: string; items: { description: string; quantity: number; unit: string; unit_price: number; subtotal: number }[] }[] = [];
  const items: { description: string; quantity: number; unit: string; unit_price: number; subtotal: number }[] = [];

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
      items.push(...mappedItems);
    }
  }

  return { labels, items };
}

export function planItemsToLabelGroups(flatItems: ProjectPlanItem[]): LabelGroup[] {
  if (!flatItems || flatItems.length === 0) {
    return [{ label: '', items: [{ ...EMPTY_FORM_ITEM }] }];
  }

  const labelItems = flatItems.filter((i) => i.is_label);
  const standalone = flatItems.filter((i) => !i.is_label && !i.parent_id);

  const groups: LabelGroup[] = [];

  for (const label of labelItems) {
    const children = flatItems.filter((i) => i.parent_id === label.id);
    groups.push({
      label: label.description,
      items: children.map((c) => ({
        description: c.description,
        quantity: c.quantity,
        unit: c.unit,
        unit_price: c.unit_price,
      })),
    });
  }

  if (standalone.length > 0) {
    groups.push({
      label: '',
      items: standalone.map((c) => ({
        description: c.description,
        quantity: c.quantity,
        unit: c.unit,
        unit_price: c.unit_price,
      })),
    });
  }

  if (groups.length === 0) {
    return [{ label: '', items: [{ ...EMPTY_FORM_ITEM }] }];
  }

  return groups;
}

// ============ Component ============

interface LabelGroupEditorProps {
  labelGroups: LabelGroup[];
  setLabelGroups: (groups: LabelGroup[]) => void;
  title?: string;
  addLabelText?: string;
}

export default function LabelGroupEditor({
  labelGroups,
  setLabelGroups,
  title = 'Item *',
  addLabelText = '+ Tambah Label',
}: LabelGroupEditorProps) {
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

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-slate-700">{title}</label>
        <button
          type="button"
          onClick={addLabelGroup}
          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          <Tag size={12} />
          {addLabelText}
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
  );
}
