import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { PageHeader, Loading, Empty, Modal, Badge, ErrorBox } from '../components/ui';
import { Plus, Pencil, Trash2, Search, School } from 'lucide-react';

const JENJANG = ['RA', 'MI', 'MTs', 'MA'];

export default function Madrasah() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [jenjangFilter, setJenjangFilter] = useState('');
  const [pengawasList, setPengawasList] = useState([]);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from('madrasah')
      .select('*, pengawas:pengawas_id(id, nama, email)')
      .order('nama_madrasah');
    setRows(data || []);
    const { data: peng } = await supabase.from('profiles').select('id, nama, email').eq('role', 'pengawas');
    setPengawasList(peng || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) =>
    (!q || r.nama_madrasah?.toLowerCase().includes(q.toLowerCase()) || r.nsm?.includes(q) || r.npsn?.includes(q))
    && (!jenjangFilter || r.jenjang === jenjangFilter)
  ), [rows, q, jenjangFilter]);

  const remove = async (id) => {
    if (!confirm('Hapus madrasah ini?')) return;
    const { error } = await supabase.from('madrasah').delete().eq('id', id);
    if (error) alert(error.message);
    load();
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    if (!payload.pengawas_id) payload.pengawas_id = null;
    let res;
    if (editing.id) {
      res = await supabase.from('madrasah').update(payload).eq('id', editing.id);
    } else {
      res = await supabase.from('madrasah').insert(payload);
    }
    if (res.error) { setError(res.error.message); return; }
    setEditing(null); load();
  };

  return (
    <div>
      <PageHeader
        title="Data Madrasah Piloting"
        subtitle="Daftar madrasah binaan yang masuk piloting KBC"
        actions={
          isAdmin && (
            <button className="btn-primary" onClick={() => setEditing({})}>
              <Plus size={16} /> Tambah Madrasah
            </button>
          )
        }
      />

      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Cari nama / NSM / NPSN" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="input sm:w-44" value={jenjangFilter} onChange={(e) => setJenjangFilter(e.target.value)}>
            <option value="">Semua Jenjang</option>
            {JENJANG.map((j) => <option key={j}>{j}</option>)}
          </select>
        </div>
      </div>

      {loading ? <Loading /> : filtered.length === 0 ? <Empty icon={School} label="Belum ada madrasah" /> : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nama Madrasah</th><th>Jenjang</th><th>NSM</th><th>NPSN</th>
                <th>Kepala</th><th>Pengawas</th><th>Status</th>
                {isAdmin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="font-medium">{r.nama_madrasah}</td>
                  <td><Badge color="info">{r.jenjang}</Badge></td>
                  <td className="font-mono text-xs">{r.nsm || '-'}</td>
                  <td className="font-mono text-xs">{r.npsn || '-'}</td>
                  <td>{r.kepala_madrasah || '-'}</td>
                  <td>{r.pengawas?.nama || '-'}</td>
                  <td><Badge color={r.status_piloting === 'aktif' ? 'success' : 'muted'}>{r.status_piloting}</Badge></td>
                  {isAdmin && (
                    <td>
                      <div className="flex gap-1">
                        <button className="btn-ghost p-1.5" onClick={() => setEditing(r)}><Pencil size={15} /></button>
                        <button className="btn-ghost p-1.5 text-red-600" onClick={() => remove(r.id)}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit Madrasah' : 'Tambah Madrasah'}
        size="lg"
      >
        {editing && (
          <form onSubmit={save} className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="label">Nama Madrasah</label>
              <input name="nama_madrasah" required defaultValue={editing.nama_madrasah || ''} className="input" />
            </div>
            <div>
              <label className="label">Jenjang</label>
              <select name="jenjang" required defaultValue={editing.jenjang || 'MI'} className="input">
                {JENJANG.map((j) => <option key={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status Piloting</label>
              <select name="status_piloting" defaultValue={editing.status_piloting || 'aktif'} className="input">
                <option value="aktif">aktif</option>
                <option value="nonaktif">nonaktif</option>
              </select>
            </div>
            <div>
              <label className="label">NSM</label>
              <input name="nsm" defaultValue={editing.nsm || ''} className="input" />
            </div>
            <div>
              <label className="label">NPSN</label>
              <input name="npsn" defaultValue={editing.npsn || ''} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Alamat</label>
              <input name="alamat" defaultValue={editing.alamat || ''} className="input" />
            </div>
            <div>
              <label className="label">Kepala Madrasah</label>
              <input name="kepala_madrasah" defaultValue={editing.kepala_madrasah || ''} className="input" />
            </div>
            <div>
              <label className="label">Pengawas</label>
              <select name="pengawas_id" defaultValue={editing.pengawas_id || ''} className="input">
                <option value="">— Belum ditentukan —</option>
                {pengawasList.map((p) => <option key={p.id} value={p.id}>{p.nama || p.email}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2"><ErrorBox message={error} /></div>
            <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Batal</button>
              <button type="submit" className="btn-primary">Simpan</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
