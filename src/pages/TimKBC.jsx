import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { PageHeader, Loading, Empty, Modal, ErrorBox } from '../components/ui';
import { Plus, Pencil, Trash2, UserCheck } from 'lucide-react';

export default function TimKBC() {
  const { profile, isAdmin, role } = useAuth();
  const [rows, setRows] = useState([]);
  const [madrasahs, setMadrasahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ madrasah_id: '' });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const canWrite = isAdmin || ['kepala_madrasah', 'pengawas'].includes(role);

  const load = async () => {
    if (!supabase) return;
    setLoading(true);
    let q = supabase.from('tim_kbc').select('*, madrasah:madrasah_id(nama_madrasah, jenjang)').order('created_at', { ascending: false });
    if (filter.madrasah_id) q = q.eq('madrasah_id', filter.madrasah_id);
    else if (role === 'kepala_madrasah' && profile?.madrasah_id) q = q.eq('madrasah_id', profile.madrasah_id);
    const { data } = await q;
    setRows(data || []);
    const { data: m } = await supabase.from('madrasah').select('id, nama_madrasah, jenjang').order('nama_madrasah');
    setMadrasahs(m || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [filter.madrasah_id, role, profile?.madrasah_id]);

  const remove = async (id) => {
    if (!confirm('Hapus anggota tim?')) return;
    await supabase.from('tim_kbc').delete().eq('id', id);
    load();
  };

  const save = async (e) => {
    e.preventDefault(); setError('');
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    if (editing.id) {
      const res = await supabase.from('tim_kbc').update(payload).eq('id', editing.id);
      if (res.error) { setError(res.error.message); return; }
    } else {
      const res = await supabase.from('tim_kbc').insert(payload);
      if (res.error) { setError(res.error.message); return; }
    }
    setEditing(null); load();
  };

  return (
    <div>
      <PageHeader title="Tim Inti KBC" subtitle="Anggota tim implementasi KBC madrasah"
        actions={canWrite && <button className="btn-primary" onClick={() => setEditing({ madrasah_id: profile?.madrasah_id || '' })}><Plus size={16} /> Tambah Anggota</button>}
      />

      {(isAdmin || role === 'pengawas') && (
        <div className="card mb-4">
          <select className="input sm:w-64" value={filter.madrasah_id} onChange={(e) => setFilter({ madrasah_id: e.target.value })}>
            <option value="">Semua Madrasah</option>
            {madrasahs.map((m) => <option key={m.id} value={m.id}>{m.jenjang} {m.nama_madrasah}</option>)}
          </select>
        </div>
      )}

      {loading ? <Loading /> : rows.length === 0 ? <Empty icon={UserCheck} label="Belum ada anggota Tim KBC" /> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Nama</th><th>Jabatan</th><th>Madrasah</th><th>Tugas</th>{canWrite && <th></th>}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="font-medium">{r.nama}</td>
                  <td>{r.jabatan || '-'}</td>
                  <td className="text-sm">{r.madrasah?.nama_madrasah || '-'}</td>
                  <td className="text-xs max-w-md">{r.tugas || '-'}</td>
                  {canWrite && (
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

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Anggota Tim' : 'Tambah Anggota Tim'} size="md">
        {editing && (
          <form onSubmit={save} className="space-y-3">
            <div>
              <label className="label">Madrasah</label>
              <select name="madrasah_id" required defaultValue={editing.madrasah_id || profile?.madrasah_id || ''} className="input">
                <option value="">— Pilih —</option>
                {madrasahs.map((m) => <option key={m.id} value={m.id}>{m.jenjang} {m.nama_madrasah}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Nama</label>
              <input name="nama" required defaultValue={editing.nama || ''} className="input" />
            </div>
            <div>
              <label className="label">Jabatan</label>
              <input name="jabatan" defaultValue={editing.jabatan || ''} className="input" placeholder="Ketua / Sekretaris / Anggota" />
            </div>
            <div>
              <label className="label">Tugas</label>
              <textarea name="tugas" rows={3} defaultValue={editing.tugas || ''} className="input" />
            </div>
            <ErrorBox message={error} />
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Batal</button>
              <button type="submit" className="btn-primary">Simpan</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
