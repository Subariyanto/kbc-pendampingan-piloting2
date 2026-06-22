import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { AuthShell } from './Login';
import { ErrorBox, SuccessBox } from '../components/ui';
import { Loader2 } from 'lucide-react';

export default function LupaPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError(''); setInfo(''); setLoading(true);
    try {
      await resetPassword(email.trim());
      setInfo('Link reset password sudah dikirim ke email. Cek inbox/spam.');
    } catch (err) {
      setError(err.message || 'Gagal mengirim email reset');
    } finally { setLoading(false); }
  };

  return (
    <AuthShell title="Lupa Password" subtitle="Masukkan email untuk reset password">
      <form onSubmit={handle} className="space-y-3">
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <ErrorBox message={error} />
        <SuccessBox message={info} />
        <button disabled={loading} className="btn-primary w-full">
          {loading && <Loader2 className="animate-spin" size={16} />} Kirim Link Reset
        </button>
      </form>
      <div className="text-sm text-slate-600 mt-4 text-center">
        <Link to="/login" className="text-primary-700 hover:underline">Kembali ke Login</Link>
      </div>
    </AuthShell>
  );
}
