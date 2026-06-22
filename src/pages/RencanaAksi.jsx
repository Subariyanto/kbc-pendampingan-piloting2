import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { PageHeader, Loading, Empty, Modal, Badge, ErrorBox } from '../components/ui';
import { Plus, Pencil, Trash2, Target } from 'lucide-react';
import { PANCA_CINTA } from '../lib/constants';

export default function RencanaAksi() {
  const { isAdmin, role } = useAuth();
  const [rows, setRows] = useState([]);
  const [madrasahs, setMadrasahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ madrasah_id: '' });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const canWrite = isAdmin || ['pengawas', 'kepala_madrasah'].includes(role);

  const load = async () => {
    if (!supabase) return;
    setLoading(true);
    let q = supabase.from('rencana_aksi').select('*, madrasah:madrasah_id(nama_madrasah, jenjang)').order('created_at', { ascending: false });
    if (filter.madrasah_id) q = q.eq('madrasah_id', filter.madrasah_id);
    const { data } = await q;
    setRows(data || []);
    const { data: m } = await supabase.from('madrasah').select('id, nama_madrasah, jenjang').order('nama_madrasah');
    setMadrasahs(m || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [filter.madrasah_id]);

  const remove = async (id) => {
    if (!confirm('Hapus rencana aksi ini?')) return;
    await supabase.from('rencana_aksi').delete().eq('id', id);
    load();
  };

  const save = async (e) => {
    e.preventDefault(); setError('');
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    let res;
    if (editing.id) res = await supabase.from('rencana_aksi').update(payload).eq('id', editing.id);
    else res = await supabase.from('rencana_aksi').insert(payload);
    if (res.error) { setError(res.error.message); return; }
    setEditing(null); load();
  };

  return (
    <div>
      <PageHeader title="Rencana Aksi KBC" subtitle="Program implementasi nilai-nilai Panca Cinta"
        actions={canWrite && <button className="btn-primary" onClick={() => setEditing({})}><Plus size={16} /> Tambah</button>}
      />

      <div className="card mb-4">
        <select className="input sm:w-64" value={filter.madrasah_id} onChange={(e) => setFilter({ madrasah_id: e.target.value })}>
          <option value="">Semua Madrasah</option>
          {madrasahs.map((m) => <option key={m.id} value={m.id}>{m.jenjang} {m.nama_madrasah}</option>)}
        </select>
      </div>

      {loading ? <Loading /> : rows.length === 0 ? <Empty icon={Target} label="Belum ada rencana aksi" /> : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Madrasah</th><th>Program</th><th>Panca Cinta</th><th>Target</th><th>PJ</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="font-medium text-sm">{r.madrasah?.nama_madrasah || '-'}</td>
                  <td className="font-medium">{r.program}</td>
                  <td><Badge color="info">{r.panca_cinta || '-'}</Badge></td>
                  <td className="text-xs max-w-xs">{r.target || '-'}</td>
                  <td className="text-xs">{r.penanggung_jawab || '-'}</td>
                  <td><Badge color={r.status === 'selesai' ? 'success' : r.status === 'berjalan' ? 'info' : 'warn'}>{r.status || 'rencana'}</Badge></td>
                  <td>
                    {canWrite && (
                      <div className="flex gap-1">
                        <button className="btn-ghost p-1.5" onClick={() => setEditing(r)}><Pencil size={15} /></button>
                        <button className="btn-ghost p-1.5 text-red-600" onClick={() => remove(r.id)}><Trash2 size={15} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Rencana Aksi' : 'Tambah Rencana Aksi'} size="lg">
        {editing && (
          <form onSubmit={save} className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="label">Madrasah</label>
              <select name="madrasah_id" required defaultValue={editing.madrasah_id || ''} className="input">
                <option value="">— Pilih —</option>
                {madrasahs.map((m) => <option key={m.id} value={m.id}>{m.jenjang} {m.nama_madrasah}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Program / Kegiatan</label>
              <input name="program" required defaultValue={editing.program || ''} className="input" />
            </div>
            <div>
              <label className="label">Nilai Panca Cinta</label>
              <select name="panca_cinta" defaultValue={editing.panca_cinta || ''} className="input">
                <option value="">—</option>
                {PANCA_CINTA.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select name="status" defaultValue={editing.status || 'rencana'} className="input">
                <option value="rencana">rencana</option>
                <option value="berjalan">berjalan</option>
                <option value="selesai">selesai</option>
                <option value="tertunda">tertunda</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Target</label>
              <input name="target" defaultValue={editing.target || ''} className="input" />
            </div>
            <div>
              <label className="label">Jadwal</label>
              <input name="jadwal" defaultValue={editing.jadwal || ''} className="input" placeholder="Sept – Des 2026" />
            </div>
            <div>
              <label className="label">Penanggung Jawab</label>
              <input name="penanggung_jawab" defaultValue={editing.penanggung_jawab || ''} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Indikator Keberhasilan</label>
              <input name="indikator" defaultValue={editing.indikator || ''} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Bukti / Eviden</label>
              <input name="bukti" defaultValue={editing.bukti || ''} className="input" />
            </div>
            <div className="sm:col-span-2"><ErrorBox message={error} /></div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Batal</button>
              <button type="submit" className="btn-primary">Simpan</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
