import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { PageHeader, Loading, Empty, Modal, ErrorBox, Badge } from '../components/ui';
import { Plus, Pencil, Trash2, PenSquare } from 'lucide-react';
import { PANCA_CINTA } from '../lib/constants';

export default function Jurnal() {
  const { profile, isAdmin } = useAuth();
  const [rows, setRows] = useState([]);
  const [madrasahs, setMadrasahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase.from('rencana_aksi')
      .select('*, madrasah:madrasah_id(nama_madrasah, jenjang)')
      .order('created_at', { ascending: false });
    setRows(data || []);
    const { data: m } = await supabase.from('madrasah').select('id, nama_madrasah, jenjang').order('nama_madrasah');
    setMadrasahs(m || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!confirm('Hapus jurnal ini?')) return;
    await supabase.from('rencana_aksi').delete().eq('id', id);
    load();
  };

  const save = async (e) => {
    e.preventDefault(); setError('');
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    if (editing.id) {
      const res = await supabase.from('rencana_aksi').update(payload).eq('id', editing.id);
      if (res.error) { setError(res.error.message); return; }
    } else {
      const res = await supabase.from('rencana_aksi').insert(payload);
      if (res.error) { setError(res.error.message); return; }
    }
    setEditing(null); load();
  };

  return (
    <div>
      <PageHeader title="Jurnal Implementasi" subtitle="Catatan harian guru dalam menjalankan KBC"
        actions={<button className="btn-primary" onClick={() => setEditing({ madrasah_id: profile?.madrasah_id || '' })}><Plus size={16} /> Tambah Jurnal</button>}
      />

      {loading ? <Loading /> : rows.length === 0 ? <Empty icon={PenSquare} label="Belum ada jurnal" /> : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                <div>
                  <div className="font-semibold text-slate-800">{r.program}</div>
                  <div className="text-xs text-slate-500">{r.madrasah?.nama_madrasah} · {r.jadwal || '-'}</div>
                </div>
                <div className="flex items-center gap-2">
                  {r.panca_cinta && <Badge color="info">{r.panca_cinta}</Badge>}
                  <Badge color={r.status === 'selesai' ? 'success' : 'warn'}>{r.status || 'rencana'}</Badge>
                  <button className="btn-ghost p-1.5" onClick={() => setEditing(r)}><Pencil size={15} /></button>
                  <button className="btn-ghost p-1.5 text-red-600" onClick={() => remove(r.id)}><Trash2 size={15} /></button>
                </div>
              </div>
              {r.target && <div className="text-sm text-slate-700"><strong>Target:</strong> {r.target}</div>}
              {r.indikator && <div className="text-sm text-slate-700"><strong>Indikator:</strong> {r.indikator}</div>}
              {r.bukti && <div className="text-sm text-slate-700"><strong>Refleksi/Bukti:</strong> {r.bukti}</div>}
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Jurnal' : 'Tambah Jurnal Implementasi'} size="lg">
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
              <label className="label">Kegiatan / Program</label>
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
              </select>
            </div>
            <div>
              <label className="label">Tanggal / Periode</label>
              <input name="jadwal" defaultValue={editing.jadwal || ''} className="input" placeholder={new Date().toLocaleDateString('id-ID')} />
            </div>
            <div>
              <label className="label">Penanggung Jawab</label>
              <input name="penanggung_jawab" defaultValue={editing.penanggung_jawab || profile?.nama || ''} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Target</label>
              <input name="target" defaultValue={editing.target || ''} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Indikator Keberhasilan</label>
              <input name="indikator" defaultValue={editing.indikator || ''} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Refleksi / Bukti</label>
              <textarea name="bukti" rows={3} defaultValue={editing.bukti || ''} className="input" />
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
