'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import { exportToExcel, exportToPDF } from '@/lib/utils';
import type { ExportHeader } from '@/lib/utils';

interface ExportDropdownProps {
  filename: string;
  headers: ExportHeader[];
  rows: Record<string, unknown>[];
}

export default function ExportDropdown({ filename, headers, rows }: ExportDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const base = filename.replace(/\.[^.]+$/, '');

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
      >
        <Download size={16} />
        Export
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
          <button
            onClick={() => { exportToExcel(`${base}.xlsx`, headers, rows); setOpen(false); }}
            className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Excel (.xlsx)
          </button>
          <button
            onClick={() => { exportToPDF(`${base}.pdf`, headers, rows); setOpen(false); }}
            className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100"
          >
            PDF (.pdf)
          </button>
        </div>
      )}
    </div>
  );
}
