import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { ErrorBox, SuccessBox } from '../components/ui';
import { AuthShell } from './Login';
import { supabase, ADMIN_EMAIL } from '../lib/supabase';
import { Loader2 } from 'lucide-react';
import { ROLE_LABEL } from '../lib/constants';

export default function Register() {
  const { signUp, redeemCode } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nama: '', email: '', password: '', role: 'guru',
    madrasah_id: '', kode: '',
  });
  const [madrasahs, setMadrasahs] = useState([]);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.from('madrasah').select('id, nama_madrasah, jenjang').order('nama_madrasah')
      .then(({ data }) => setMadrasahs(data || []));
  }, []);

  const isAdminEmail = form.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const onChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handle = async (e) => {
    e.preventDefault();
    setError(''); setInfo(''); setLoading(true);
    try {
      // 1) Sign up
      const { user } = await signUp({
        email: form.email.trim(),
        password: form.password,
        nama: form.nama.trim(),
        role: isAdminEmail ? 'admin' : form.role,
      });

      // 2) For non-admin: must redeem activation code (need session first)
      if (!isAdminEmail) {
        // Try sign in (works if email confirmation disabled)
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: form.email.trim(), password: form.password,
        });
        if (signInErr) {
          setInfo('Akun berhasil dibuat. Cek email untuk konfirmasi, lalu login dan buka halaman Aktivasi Akun untuk memasukkan kode.');
          setLoading(false);
          return;
        }
        await redeemCode({ code: form.kode.trim(), role: form.role, madrasah_id: form.madrasah_id || null });
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registrasi gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Buat Akun" subtitle="Daftar sebagai pengguna baru">
      <form onSubmit={handle} className="space-y-3">
        <div>
          <label className="label">Nama Lengkap</label>
          <input className="input" required value={form.nama} onChange={onChange('nama')} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" required value={form.email} onChange={onChange('email')} />
          {isAdminEmail && <div className="text-xs text-emerald-700 mt-1">Email admin utama terdeteksi — akun akan otomatis menjadi Admin (tidak perlu kode aktivasi).</div>}
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" required minLength={6} value={form.password} onChange={onChange('password')} />
        </div>
        {!isAdminEmail && (
          <>
            <div>
              <label className="label">Peran (Role)</label>
              <select className="input" value={form.role} onChange={onChange('role')}>
                <option value="pengawas">{ROLE_LABEL.pengawas}</option>
                <option value="kepala_madrasah">{ROLE_LABEL.kepala_madrasah}</option>
                <option value="guru">{ROLE_LABEL.guru}</option>
              </select>
            </div>
            <div>
              <label className="label">Madrasah</label>
              <select className="input" value={form.madrasah_id} onChange={onChange('madrasah_id')}>
                <option value="">— Pilih Madrasah —</option>
                {madrasahs.map((m) => (
                  <option key={m.id} value={m.id}>{m.jenjang} {m.nama_madrasah}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Kode Aktivasi</label>
              <input className="input font-mono" required placeholder="KBC-JBR-2026-XXXXXX"
                value={form.kode} onChange={onChange('kode')} />
            </div>
          </>
        )}
        <ErrorBox message={error} />
        <SuccessBox message={info} />
        <button disabled={loading} className="btn-primary w-full">
          {loading && <Loader2 className="animate-spin" size={16} />} Daftar
        </button>
      </form>
      <div className="text-sm text-slate-600 mt-4 text-center">
        Sudah punya akun? <Link to="/login" className="text-primary-700 hover:underline">Masuk</Link>
      </div>
    </AuthShell>
  );
}
