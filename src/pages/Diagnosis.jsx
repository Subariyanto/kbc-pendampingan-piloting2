import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { PageHeader, Loading, Empty, Modal, Badge, ErrorBox } from '../components/ui';
import { Plus, Pencil, Trash2, ClipboardCheck } from 'lucide-react';
import { KOMPONEN_DIAGNOSIS, kategoriSkor, rekomendasiByKomponen, KBC_BOBOT } from '../lib/constants';

export default function Diagnosis() {
  const { profile, isAdmin, role } = useAuth();
  const [rows, setRows] = useState([]);
  const [madrasahs, setMadrasahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ madrasah_id: '' });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const canWrite = isAdmin || role === 'pengawas' || role === 'kepala_madrasah';

  const load = async () => {
    if (!supabase) return;
    setLoading(true);
    let q = supabase.from('diagnosis_kbc').select('*, madrasah:madrasah_id(nama_madrasah, jenjang)').order('created_at', { ascending: false });
    if (filter.madrasah_id) q = q.eq('madrasah_id', filter.madrasah_id);
    const { data } = await q;
    setRows(data || []);
    const { data: m } = await supabase.from('madrasah').select('id, nama_madrasah, jenjang').order('nama_madrasah');
    setMadrasahs(m || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [filter.madrasah_id]);

  const remove = async (id) => {
    if (!confirm('Hapus data diagnosis ini?')) return;
    await supabase.from('diagnosis_kbc').delete().eq('id', id);
    load();
  };

  const save = async (e) => {
    e.preventDefault(); setError('');
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    payload.skor = Number(payload.skor);
    if (!payload.rekomendasi) {
      const key = KBC_BOBOT.find((k) => k.label === payload.komponen)?.key;
      payload.rekomendasi = rekomendasiByKomponen(key, payload.skor);
    }
    if (editing.id) {
      const res = await supabase.from('diagnosis_kbc').update(payload).eq('id', editing.id);
      if (res.error) { setError(res.error.message); return; }
    } else {
      payload.created_by = profile?.id || null;
      const res = await supabase.from('diagnosis_kbc').insert(payload);
      if (res.error) { setError(res.error.message); return; }
    }
    setEditing(null); load();
  };

  return (
    <div>
      <PageHeader title="Instrumen Diagnosis KBC" subtitle="Diagnosis awal kesiapan KBC per madrasah"
        actions={canWrite && <button className="btn-primary" onClick={() => setEditing({})}><Plus size={16} /> Tambah</button>}
      />

      <div className="card mb-4">
        <select className="input sm:w-64" value={filter.madrasah_id} onChange={(e) => setFilter({ madrasah_id: e.target.value })}>
          <option value="">Semua Madrasah</option>
          {madrasahs.map((m) => <option key={m.id} value={m.id}>{m.jenjang} {m.nama_madrasah}</option>)}
        </select>
      </div>

      {loading ? <Loading /> : rows.length === 0 ? <Empty icon={ClipboardCheck} label="Belum ada diagnosis" /> : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Madrasah</th><th>Komponen</th><th>Indikator</th><th>Skor</th><th>Kategori</th><th>Catatan</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const k = kategoriSkor(r.skor);
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="font-medium">{r.madrasah?.nama_madrasah || '-'}</td>
                    <td>{r.komponen}</td>
                    <td className="text-xs max-w-xs">{r.indikator || '-'}</td>
                    <td className="font-semibold">{r.skor}</td>
                    <td><Badge color={k.color}>{k.label}</Badge></td>
                    <td className="text-xs max-w-xs">{r.catatan || '-'}</td>
                    <td>
                      {canWrite && (
                        <div className="flex gap-1">
                          <button className="btn-ghost p-1.5" onClick={() => setEditing(r)}><Pencil size={15} /></button>
                          <button className="btn-ghost p-1.5 text-red-600" onClick={() => remove(r.id)}><Trash2 size={15} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Diagnosis' : 'Tambah Diagnosis'} size="lg">
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
              <label className="label">Komponen KBC</label>
              <select name="komponen" required defaultValue={editing.komponen || ''} className="input">
                <option value="">— Pilih —</option>
                {KOMPONEN_DIAGNOSIS.map((k) => <option key={k}>{k}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Indikator</label>
              <input name="indikator" defaultValue={editing.indikator || ''} className="input" />
            </div>
            <div>
              <label className="label">Skor (0–100)</label>
              <input name="skor" type="number" min={0} max={100} required defaultValue={editing.skor ?? ''} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Catatan</label>
              <textarea name="catatan" defaultValue={editing.catatan || ''} className="input" rows={2} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Rekomendasi <span className="text-xs text-slate-400">(kosongkan untuk auto)</span></label>
              <textarea name="rekomendasi" defaultValue={editing.rekomendasi || ''} className="input" rows={2} />
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
