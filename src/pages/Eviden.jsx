import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { PageHeader, Loading, Empty, Modal, ErrorBox } from '../components/ui';
import { Upload as UploadIcon, Plus, Trash2, FileText, Image as ImageIcon, ExternalLink } from 'lucide-react';

const KATEGORI = ['Tata Kelola', 'Dokumen KSP', 'Perangkat Ajar', 'Praktik Pembelajaran', 'Kokurikuler', 'Ekstrakurikuler', 'Budaya Madrasah', 'Kemitraan', 'Lainnya'];

export default function Eviden() {
  const { profile, isAdmin } = useAuth();
  const [rows, setRows] = useState([]);
  const [madrasahs, setMadrasahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ madrasah_id: '', kategori: '' });
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    madrasah_id: '', kategori: '', judul: '', deskripsi: '', file: null,
  });

  const load = async () => {
    if (!supabase) return;
    setLoading(true);
    let q = supabase.from('eviden').select('*, madrasah:madrasah_id(nama_madrasah, jenjang), uploader:uploaded_by(nama, email)').order('uploaded_at', { ascending: false });
    if (filter.madrasah_id) q = q.eq('madrasah_id', filter.madrasah_id);
    if (filter.kategori) q = q.eq('kategori', filter.kategori);
    const { data } = await q;
    setRows(data || []);
    const { data: m } = await supabase.from('madrasah').select('id, nama_madrasah, jenjang').order('nama_madrasah');
    setMadrasahs(m || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [filter.madrasah_id, filter.kategori]);

  const remove = async (r) => {
    if (!confirm('Hapus eviden ini?')) return;
    if (r.file_url) {
      const path = r.file_url.split('/eviden/').pop();
      if (path) await supabase.storage.from('eviden').remove([path]);
    }
    await supabase.from('eviden').delete().eq('id', r.id);
    load();
  };

  const submit = async (e) => {
    e.preventDefault(); setError(''); setUploading(true);
    try {
      let file_url = null;
      if (form.file) {
        const ext = form.file.name.split('.').pop();
        const path = `${form.madrasah_id || 'umum'}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('eviden').upload(path, form.file, { cacheControl: '3600', upsert: false });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from('eviden').getPublicUrl(path);
        file_url = data.publicUrl;
      }
      const { error: insErr } = await supabase.from('eviden').insert({
        madrasah_id: form.madrasah_id || null,
        kategori: form.kategori,
        judul: form.judul,
        deskripsi: form.deskripsi,
        file_url,
        uploaded_by: profile?.id || null,
      });
      if (insErr) throw insErr;
      setOpen(false);
      setForm({ madrasah_id: '', kategori: '', judul: '', deskripsi: '', file: null });
      load();
    } catch (err) { setError(err.message || String(err)); }
    finally { setUploading(false); }
  };

  const isImage = (url) => url && /\.(jpg|jpeg|png|gif|webp)$/i.test(url);

  return (
    <div>
      <PageHeader title="Upload Eviden" subtitle="Bukti dukung implementasi KBC"
        actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Upload Eviden</button>}
      />

      <div className="card mb-4 grid sm:grid-cols-2 gap-2">
        <select className="input" value={filter.madrasah_id} onChange={(e) => setFilter((f) => ({ ...f, madrasah_id: e.target.value }))}>
          <option value="">Semua Madrasah</option>
          {madrasahs.map((m) => <option key={m.id} value={m.id}>{m.jenjang} {m.nama_madrasah}</option>)}
        </select>
        <select className="input" value={filter.kategori} onChange={(e) => setFilter((f) => ({ ...f, kategori: e.target.value }))}>
          <option value="">Semua Kategori</option>
          {KATEGORI.map((k) => <option key={k}>{k}</option>)}
        </select>
      </div>

      {loading ? <Loading /> : rows.length === 0 ? <Empty icon={UploadIcon} label="Belum ada eviden" /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rows.map((r) => (
            <div key={r.id} className="card !p-3 flex flex-col">
              <div className="aspect-video rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center mb-2">
                {isImage(r.file_url) ? (
                  <img src={r.file_url} alt={r.judul} className="w-full h-full object-cover" />
                ) : r.file_url ? (
                  <FileText size={42} className="text-slate-400" />
                ) : (
                  <ImageIcon size={42} className="text-slate-300" />
                )}
              </div>
              <div className="font-semibold text-slate-800 text-sm truncate">{r.judul}</div>
              <div className="text-xs text-slate-500 truncate">{r.madrasah?.nama_madrasah} · {r.kategori}</div>
              {r.deskripsi && <div className="text-xs text-slate-600 mt-1 line-clamp-2">{r.deskripsi}</div>}
              <div className="mt-auto pt-2 flex items-center justify-between">
                {r.file_url && (
                  <a href={r.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary-700 hover:underline inline-flex items-center gap-1">
                    <ExternalLink size={12} /> Buka file
                  </a>
                )}
                {(isAdmin || r.uploaded_by === profile?.id) && (
                  <button className="btn-ghost p-1 text-red-600" onClick={() => remove(r)}><Trash2 size={14} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Upload Eviden" size="md">
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Madrasah</label>
            <select required className="input" value={form.madrasah_id} onChange={(e) => setForm({ ...form, madrasah_id: e.target.value })}>
              <option value="">— Pilih —</option>
              {madrasahs.map((m) => <option key={m.id} value={m.id}>{m.jenjang} {m.nama_madrasah}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Kategori</label>
            <select required className="input" value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })}>
              <option value="">— Pilih —</option>
              {KATEGORI.map((k) => <option key={k}>{k}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Judul</label>
            <input required className="input" value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} />
          </div>
          <div>
            <label className="label">Deskripsi</label>
            <textarea className="input" rows={2} value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} />
          </div>
          <div>
            <label className="label">File (foto / PDF / dokumen)</label>
            <input type="file" required className="input" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] })} />
            <div className="text-xs text-slate-500 mt-1">Maks 10 MB. Disarankan format jpg/png/pdf.</div>
          </div>
          <ErrorBox message={error} />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Batal</button>
            <button type="submit" disabled={uploading} className="btn-primary">{uploading ? 'Mengunggah...' : 'Upload'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
