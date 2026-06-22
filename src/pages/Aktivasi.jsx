import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { AuthShell } from './Login';
import { ErrorBox } from '../components/ui';
import { supabase } from '../lib/supabase';
import { ROLE_LABEL } from '../lib/constants';
import { Loader2 } from 'lucide-react';

export default function Aktivasi() {
  const { redeemCode, profile, isActive, signOut } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ kode: '', role: 'guru', madrasah_id: '' });
  const [madrasahs, setMadrasahs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.from('madrasah').select('id, nama_madrasah, jenjang').order('nama_madrasah')
      .then(({ data }) => setMadrasahs(data || []));
  }, []);

  useEffect(() => { if (isActive) navigate('/dashboard', { replace: true }); }, [isActive, navigate]);

  const onChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handle = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await redeemCode({ code: form.kode.trim(), role: form.role, madrasah_id: form.madrasah_id || null });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Aktivasi gagal');
    } finally { setLoading(false); }
  };

  return (
    <AuthShell title="Aktivasi Akun" subtitle={`Halo ${profile?.nama || profile?.email || ''}, masukkan kode aktivasi`}>
      <form onSubmit={handle} className="space-y-3">
        <div>
          <label className="label">Kode Aktivasi</label>
          <input className="input font-mono" required placeholder="KBC-JBR-2026-XXXXXX"
            value={form.kode} onChange={onChange('kode')} />
        </div>
        <div>
          <label className="label">Peran</label>
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
        <ErrorBox message={error} />
        <button disabled={loading} className="btn-primary w-full">
          {loading && <Loader2 className="animate-spin" size={16} />} Aktivasi
        </button>
      </form>
      <button onClick={async () => { await signOut(); navigate('/login'); }}
        className="mt-4 w-full text-sm text-slate-500 hover:text-slate-700">
        Keluar
      </button>
    </AuthShell>
  );
}
