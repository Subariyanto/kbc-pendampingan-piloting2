import { useAuth } from '../lib/AuthContext';
import { supabase, supabaseConfigured, ADMIN_EMAIL } from '../lib/supabase';
import { PageHeader } from '../components/ui';
import { Database, KeyRound, Mail, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function Pengaturan() {
  const { profile, isAdmin } = useAuth();
  const url = import.meta.env.VITE_SUPABASE_URL || '(belum diisi)';
  return (
    <div>
      <PageHeader title="Pengaturan Supabase" subtitle="Konfigurasi backend & informasi admin" />

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Database className="text-primary-700" size={20} />
            <h3 className="font-semibold text-slate-800">Koneksi Supabase</h3>
          </div>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between">
              <dt className="text-slate-500">Status</dt>
              <dd>
                {supabaseConfigured ? (
                  <span className="badge-success">Terhubung</span>
                ) : (
                  <span className="badge-warn">Belum dikonfigurasi</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Project URL</dt>
              <dd className="font-mono text-xs break-all">{url}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Anon Key</dt>
              <dd className="font-mono text-xs">{import.meta.env.VITE_SUPABASE_ANON_KEY ? '••••••••' + (import.meta.env.VITE_SUPABASE_ANON_KEY.slice(-6)) : '(belum diisi)'}</dd>
            </div>
          </dl>
          <div className="mt-3 text-xs text-slate-500">
            Untuk mengubah, edit file <code>.env</code> lalu restart dev server / redeploy.
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="text-primary-700" size={20} />
            <h3 className="font-semibold text-slate-800">Admin Utama</h3>
          </div>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd>{ADMIN_EMAIL}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Akun Anda</dt><dd>{profile?.email}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Peran</dt><dd>{isAdmin ? 'Admin' : profile?.role}</dd></div>
          </dl>
          <div className="mt-3 text-xs text-slate-500">Email admin di-hardcode di file <code>.env</code> sebagai <code>VITE_ADMIN_EMAIL</code>.</div>
        </div>

        <div className="card md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="text-primary-700" size={20} />
            <h3 className="font-semibold text-slate-800">Catatan Keamanan</h3>
          </div>
          <ul className="text-sm text-slate-700 space-y-1 list-disc pl-5">
            <li>Frontend hanya pakai <strong>anon/publishable key</strong>. Service role key tidak boleh dikirim ke client.</li>
            <li>Akses data dijaga oleh <strong>Row Level Security (RLS)</strong>. Pastikan policy di <code>supabase/schema.sql</code> sudah dijalankan.</li>
            <li>Aktivasi kode dilakukan via RPC <code>redeem_activation_code()</code> agar atomic & anti race condition.</li>
            <li>Eviden disimpan di Storage bucket <code>eviden</code>; ganti ke private bucket bila perlu kontrol akses lebih ketat.</li>
          </ul>
        </div>

        <div className="card md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-amber-600" size={20} />
            <h3 className="font-semibold text-slate-800">Reset / Migrasi</h3>
          </div>
          <p className="text-sm text-slate-700">
            Migrasi schema ada di <code>supabase/schema.sql</code>. Storage policy di <code>supabase/storage-policies.sql</code>.
            Jalankan ulang via Supabase SQL Editor kalau ada update schema.
          </p>
        </div>
      </div>
    </div>
  );
}
