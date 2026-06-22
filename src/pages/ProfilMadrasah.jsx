import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { PageHeader, Loading, ErrorBox } from '../components/ui';
import { Building2 } from 'lucide-react';

export default function ProfilMadrasah() {
  const { profile, isAdmin, role } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const canEdit = isAdmin || role === 'kepala_madrasah';

  useEffect(() => {
    (async () => {
      if (!supabase || !profile?.madrasah_id) { setLoading(false); return; }
      const { data: m } = await supabase.from('madrasah').select('*').eq('id', profile.madrasah_id).maybeSingle();
      setData(m);
      setLoading(false);
    })();
  }, [profile?.madrasah_id]);

  const save = async (e) => {
    e.preventDefault();
    setError(''); setInfo(''); setSaving(true);
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    const { error } = await supabase.from('madrasah').update(payload).eq('id', data.id);
    if (error) setError(error.message);
    else setInfo('Profil madrasah berhasil disimpan.');
    setSaving(false);
  };

  if (loading) return <Loading />;
  if (!data) return (
    <div>
      <PageHeader title="Profil Madrasah" />
      <div className="card text-center text-slate-500"><Building2 size={36} className="mx-auto mb-2 text-slate-400" />Anda belum terhubung ke madrasah. Hubungi admin.</div>
    </div>
  );

  return (
    <div>
      <PageHeader title="Profil Madrasah" subtitle="Data dasar madrasah binaan" />
      <div className="card">
        <form onSubmit={save} className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="label">Nama Madrasah</label>
            <input name="nama_madrasah" defaultValue={data.nama_madrasah} className="input" disabled={!canEdit} />
          </div>
          <div>
            <label className="label">Jenjang</label>
            <select name="jenjang" defaultValue={data.jenjang} className="input" disabled={!canEdit}>
              {['RA','MI','MTs','MA'].map((j) => <option key={j}>{j}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status Piloting</label>
            <input name="status_piloting" defaultValue={data.status_piloting || ''} className="input" disabled={!canEdit} />
          </div>
          <div>
            <label className="label">NSM</label>
            <input name="nsm" defaultValue={data.nsm || ''} className="input" disabled={!canEdit} />
          </div>
          <div>
            <label className="label">NPSN</label>
            <input name="npsn" defaultValue={data.npsn || ''} className="input" disabled={!canEdit} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Alamat</label>
            <input name="alamat" defaultValue={data.alamat || ''} className="input" disabled={!canEdit} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Kepala Madrasah</label>
            <input name="kepala_madrasah" defaultValue={data.kepala_madrasah || ''} className="input" disabled={!canEdit} />
          </div>
          <div className="sm:col-span-2"><ErrorBox message={error} />{info && <div className="text-sm text-emerald-700">{info}</div>}</div>
          {canEdit && (
            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
