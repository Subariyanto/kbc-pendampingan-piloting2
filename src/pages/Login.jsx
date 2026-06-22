import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { ErrorBox, SuccessBox } from '../components/ui';
import { Loader2, School2, Mail, Lock } from 'lucide-react';

export default function Login() {
  const { signIn, configured } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Masuk" subtitle="Aplikasi Pendampingan KBC Madrasah Piloting">
      {!configured && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 text-sm mb-3">
          Supabase belum dikonfigurasi. Isi <code>.env</code> dengan URL & anon key, lalu restart dev server.
        </div>
      )}
      <form onSubmit={handle} className="space-y-3">
        <div>
          <label className="label">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input pl-9" placeholder="email@contoh.com"
              autoComplete="email"
            />
          </div>
        </div>
        <div>
          <label className="label">Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password" required value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pl-9" placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
        </div>
        <ErrorBox message={error} />
        <button disabled={loading} className="btn-primary w-full">
          {loading && <Loader2 className="animate-spin" size={16} />} Masuk
        </button>
      </form>
      <div className="text-sm text-slate-600 mt-4 flex justify-between">
        <Link to="/register" className="text-primary-700 hover:underline">Buat akun</Link>
        <Link to="/lupa-password" className="text-primary-700 hover:underline">Lupa password?</Link>
      </div>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-800 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 text-white">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gold-500 text-primary-900 items-center justify-center mb-3 shadow-lg">
            <School2 size={28} />
          </div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-primary-200 text-sm mt-1">{subtitle}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {children}
        </div>
        <div className="text-center text-primary-200 text-xs mt-4">
          © {new Date().getFullYear()} Pengawas Madrasah Kabupaten Jember
        </div>
      </div>
    </div>
  );
}
