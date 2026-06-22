import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { PageHeader, Loading, Empty, Modal, ErrorBox } from '../components/ui';
import { Plus, Pencil, Trash2, GraduationCap, ExternalLink } from 'lucide-react';
import { PANCA_CINTA } from '../lib/constants';

const KATEGORI = ['Modul Ajar', 'RPP', 'Asesmen Diagnostik', 'Asesmen Formatif', 'Asesmen Sumatif', 'Bahan Ajar', 'LKPD'];

export default function PerangkatAjar() {
  const { profile, isAdmin, role } = useAuth();
  const [rows, setRows] = useState([]);
  const [madrasahs, setMadrasahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const canWrite = isAdmin || ['guru', 'kepala_madrasah'].includes(role);

  const load = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase.from('eviden')
      .select('*, madrasah:madrasah_id(nama_madrasah, jenjang)')
      .in('kategori', KATEGORI)
      .order('uploaded_at', { ascending: false });
    setRows(data || []);
    const { data: m } = await supabase.from('madrasah').select('id, nama_madrasah, jenjang').order('nama_madrasah');
    setMadrasahs(m || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const remove = async (r) => {
    if (!confirm('Hapus perangkat ajar ini?')) return;
    if (r.file_url) {
      const path = r.file_url.split('/eviden/').pop();
      if (path) await supabase.storage.from('eviden').remove([path]);
    }
    await supabase.from('eviden').delete().eq('id', r.id);
    load();
  };

  const save = async (e) => {
    e.preventDefault(); setError(''); setUploading(true);
    try {
      const fd = new FormData(e.target);
      const file = fd.get('file');
      const payload = {
        madrasah_id: fd.get('madrasah_id') || null,
        kategori: fd.get('kategori'),
        judul: fd.get('judul'),
        deskripsi: fd.get('deskripsi'),
        uploaded_by: profile?.id || null,
      };
      if (file && file.size > 0) {
        const ext = file.name.split('.').pop();
        const path = `${payload.madrasah_id || 'umum'}/perangkat-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('eviden').upload(path, file);
        if (upErr) throw upErr;
        payload.file_url = supabase.storage.from('eviden').getPublicUrl(path).data.publicUrl;
      }
      if (editing.id) {
        const res = await supabase.from('eviden').update(payload).eq('id', editing.id);
        if (res.error) throw res.error;
      } else {
        const res = await supabase.from('eviden').insert(payload);
        if (res.error) throw res.error;
      }
      setEditing(null); load();
    } catch (err) { setError(err.message || String(err)); }
    finally { setUploading(false); }
  };

  return (
    <div>
      <PageHeader title="Perangkat Ajar KBC" subtitle="Modul, RPP, Asesmen, dan bahan ajar berbasis Panca Cinta"
        actions={canWrite && <button className="btn-primary" onClick={() => setEditing({})}><Plus size={16} /> Tambah</button>}
      />

      {loading ? <Loading /> : rows.length === 0 ? <Empty icon={GraduationCap} label="Belum ada perangkat ajar" /> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Judul</th><th>Kategori</th><th>Madrasah</th><th>File</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="font-medium">{r.judul}</td>
                  <td className="text-xs">{r.kategori}</td>
                  <td className="text-sm">{r.madrasah?.nama_madrasah || '-'}</td>
                  <td>{r.file_url && <a href={r.file_url} target="_blank" rel="noreferrer" className="text-primary-700 hover:underline inline-flex gap-1 items-center text-xs"><ExternalLink size={12} /> Buka</a>}</td>
                  <td>
                    {(isAdmin || r.uploaded_by === profile?.id) && (
                      <div className="flex gap-1">
                        <button className="btn-ghost p-1.5" onClick={() => setEditing(r)}><Pencil size={15} /></button>
                        <button className="btn-ghost p-1.5 text-red-600" onClick={() => remove(r)}><Trash2 size={15} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Perangkat Ajar' : 'Tambah Perangkat Ajar'} size="md">
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
              <label className="label">Kategori</label>
              <select name="kategori" required defaultValue={editing.kategori || ''} className="input">
                <option value="">— Pilih —</option>
                {KATEGORI.map((k) => <option key={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Judul</label>
              <input name="judul" required defaultValue={editing.judul || ''} className="input" />
            </div>
            <div>
              <label className="label">Deskripsi (mata pelajaran, kelas, nilai Panca Cinta)</label>
              <textarea name="deskripsi" rows={2} defaultValue={editing.deskripsi || ''} className="input"
                placeholder={`Contoh: Matematika Kelas 5, terintegrasi ${PANCA_CINTA[0]}`} />
            </div>
            <div>
              <label className="label">File {editing.id && <span className="text-xs text-slate-400">(kosongkan kalau tidak ganti)</span>}</label>
              <input name="file" type="file" className="input" />
            </div>
            <ErrorBox message={error} />
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Batal</button>
              <button type="submit" disabled={uploading} className="btn-primary">{uploading ? 'Mengunggah...' : 'Simpan'}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
