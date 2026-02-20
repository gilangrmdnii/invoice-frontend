'use client';

import { useState, useEffect } from 'react';
import {
  useGetCompanySettingsQuery,
  useUpsertCompanySettingsMutation,
} from '@/lib/api/companySettingsApi';
import { useUploadFileMutation } from '@/lib/api/uploadApi';
import { useAppSelector } from '@/lib/hooks';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { Building2, Save, Upload, Image } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const user = useAppSelector((s) => s.auth.user);
  const { data, isLoading, isError } = useGetCompanySettingsQuery();
  const [upsert, { isLoading: saving }] = useUpsertCompanySettingsMutation();
  const [uploadFile, { isLoading: uploading }] = useUploadFileMutation();

  const [form, setForm] = useState({
    company_name: '',
    company_code: '',
    address: '',
    phone: '',
    email: '',
    npwp: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
    bank_branch: '',
    logo_url: '',
    signatory_name: '',
    signatory_title: '',
  });

  const canEdit = user?.role === 'FINANCE' || user?.role === 'OWNER';

  useEffect(() => {
    if (data?.data) {
      const cs = data.data;
      setForm({
        company_name: cs.company_name || '',
        company_code: cs.company_code || '',
        address: cs.address || '',
        phone: cs.phone || '',
        email: cs.email || '',
        npwp: cs.npwp || '',
        bank_name: cs.bank_name || '',
        bank_account_number: cs.bank_account_number || '',
        bank_account_name: cs.bank_account_name || '',
        bank_branch: cs.bank_branch || '',
        logo_url: cs.logo_url || '',
        signatory_name: cs.signatory_name || '',
        signatory_title: cs.signatory_title || '',
      });
    }
  }, [data]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      e.target.value = '';
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await uploadFile(formData).unwrap();
      if (res.data?.file_url) {
        setForm({ ...form, logo_url: res.data.file_url });
        toast.success('Logo berhasil diupload');
      }
    } catch {
      toast.error('Gagal upload logo');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await upsert(form).unwrap();
      toast.success('Pengaturan perusahaan berhasil disimpan!');
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gagal menyimpan pengaturan');
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <EmptyState title="Gagal memuat pengaturan" description="Coba refresh halaman" />;

  if (!canEdit) {
    return (
      <EmptyState
        title="Akses Ditolak"
        description="Hanya FINANCE dan OWNER yang bisa mengakses pengaturan perusahaan"
      />
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000';

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Building2 size={24} className="text-indigo-600" />
          <h2 className="text-xl font-bold text-slate-900">Pengaturan Perusahaan</h2>
        </div>
        <p className="text-sm text-slate-500">Informasi perusahaan yang digunakan di invoice</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Company Info */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Informasi Perusahaan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Perusahaan *</label>
              <input
                required
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                placeholder="PT. Cikal Gemilang Abadi"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Kode Perusahaan *</label>
              <input
                required
                maxLength={10}
                value={form.company_code}
                onChange={(e) => setForm({ ...form, company_code: e.target.value.toUpperCase() })}
                placeholder="CGA"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all uppercase"
              />
              <p className="text-xs text-slate-400 mt-1">Digunakan pada nomor invoice (contoh: 001/INV/CGA/02/2026)</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Alamat</label>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows={2}
                placeholder="Jl. Contoh No. 123, Jakarta Selatan"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Telepon</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="021-12345678"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="info@company.com"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">NPWP</label>
              <input
                value={form.npwp}
                onChange={(e) => setForm({ ...form, npwp: e.target.value })}
                placeholder="00.000.000.0-000.000"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Logo Perusahaan</label>
              {form.logo_url ? (
                <div className="flex items-center gap-3">
                  <img src={`${baseUrl}${form.logo_url}`} alt="Logo" className="h-12 rounded border border-slate-200" />
                  <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg cursor-pointer hover:bg-indigo-50">
                    <Image size={14} />
                    Ganti
                    <input type="file" accept=".jpg,.jpeg,.png" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">
                  <Upload size={18} className="text-slate-400" />
                  <span className="text-sm text-slate-500">{uploading ? 'Mengupload...' : 'Upload logo (JPG, PNG)'}</span>
                  <input type="file" accept=".jpg,.jpeg,.png" onChange={handleLogoUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Bank Info */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Informasi Bank</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Bank</label>
              <input
                value={form.bank_name}
                onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                placeholder="Bank Central Asia"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Cabang</label>
              <input
                value={form.bank_branch}
                onChange={(e) => setForm({ ...form, bank_branch: e.target.value })}
                placeholder="KCP Sudirman"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nomor Rekening</label>
              <input
                value={form.bank_account_number}
                onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })}
                placeholder="1234567890"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Atas Nama</label>
              <input
                value={form.bank_account_name}
                onChange={(e) => setForm({ ...form, bank_account_name: e.target.value })}
                placeholder="PT. Cikal Gemilang Abadi"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Signatory */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Penandatangan Invoice</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama</label>
              <input
                value={form.signatory_name}
                onChange={(e) => setForm({ ...form, signatory_name: e.target.value })}
                placeholder="John Doe"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Jabatan</label>
              <input
                value={form.signatory_title}
                onChange={(e) => setForm({ ...form, signatory_title: e.target.value })}
                placeholder="Director"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </form>
    </div>
  );
}
