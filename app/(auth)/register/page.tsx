'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRegisterMutation } from '@/lib/api/authApi';
import { useAppDispatch } from '@/lib/hooks';
import { setCredentials } from '@/lib/slices/authSlice';
import { UserPlus, Mail, Lock, User, Shield, ArrowRight, FileText, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

function getPasswordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0-5
}

const strengthLabels = ['', 'Sangat Lemah', 'Lemah', 'Cukup', 'Kuat', 'Sangat Kuat'];
const strengthColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-600'];

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [register, { isLoading }] = useRegisterMutation();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'SPV' as 'SPV' | 'FINANCE' | 'OWNER',
  });

  const passwordStrength = getPasswordStrength(form.password);
  const passwordsMatch = form.confirmPassword.length === 0 || form.password === form.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Password tidak cocok');
      return;
    }
    try {
      const res = await register({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        role: form.role,
      }).unwrap();
      if (res.success && res.data) {
        dispatch(setCredentials(res.data));
        toast.success('Registrasi berhasil!');
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Registrasi gagal');
    }
  };

  const roles = [
    { value: 'SPV', label: 'Supervisor', desc: 'Upload invoice & kelola expense' },
    { value: 'FINANCE', label: 'Finance', desc: 'Approve/reject & kelola proyek' },
    { value: 'OWNER', label: 'Owner', desc: 'Akses penuh ke semua fitur' },
  ] as const;

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">InvoiceHub</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Bergabung &<br />Mulai Kelola<br />Invoice Anda
          </h1>
          <p className="text-emerald-200 text-lg max-w-md">
            Daftar sekarang dan nikmati kemudahan mengelola invoice, pengeluaran, dan anggaran proyek.
          </p>
          <div className="mt-12 space-y-4">
            {roles.map((r) => (
              <div key={r.value} className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <Shield className="w-5 h-5 text-white" />
                <div>
                  <div className="text-white font-medium">{r.label}</div>
                  <div className="text-emerald-200 text-sm">{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-6 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">InvoiceHub</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">Buat Akun Baru</h2>
          <p className="text-slate-500 mb-8">Isi data berikut untuk mendaftar</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  required
                  minLength={2}
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="nama@email.com"
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
              {form.password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={clsx(
                          'h-1.5 flex-1 rounded-full transition-colors',
                          level <= passwordStrength ? strengthColors[passwordStrength] : 'bg-slate-100'
                        )}
                      />
                    ))}
                  </div>
                  <p className={clsx('text-xs', passwordStrength <= 2 ? 'text-red-500' : 'text-emerald-600')}>
                    {strengthLabels[passwordStrength]}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Konfirmasi Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="Ulangi password"
                  className={clsx(
                    'w-full pl-11 pr-10 py-3 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 transition-all',
                    !passwordsMatch
                      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                  )}
                />
                {form.confirmPassword.length > 0 && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    {passwordsMatch ? (
                      <Check size={16} className="text-emerald-500" />
                    ) : (
                      <X size={16} className="text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {!passwordsMatch && (
                <p className="text-xs text-red-500 mt-1">Password tidak cocok</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: r.value })}
                    className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      form.role === r.value
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !passwordsMatch || form.confirmPassword.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus size={18} />
                  Daftar
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-indigo-600 font-medium hover:text-indigo-700">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
