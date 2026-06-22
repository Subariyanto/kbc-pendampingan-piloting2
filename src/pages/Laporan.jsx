import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { PageHeader, Loading, Empty, Modal, Badge, ErrorBox } from '../components/ui';
import { Plus, Pencil, Trash2, FileText, Printer } from 'lucide-react';
import { kategoriSkor } from '../lib/constants';

const JENIS = [
  'Laporan Pendampingan',
  'Laporan Diagnosis Awal KBC',
  'Laporan Progres Implementasi',
  'Laporan Rencana Aksi',
  'Rekap Skor Madrasah',
  'Rekomendasi Tindak Lanjut',
  'Berita Acara Pendampingan',
  'Rekap Eviden',
];

export default function Laporan() {
  const { profile, isAdmin, role } = useAuth();
  const [rows, setRows] = useState([]);
  const [madrasahs, setMadrasahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [printing, setPrinting] = useState(null);
  const [error, setError] = useState('');

  const canWrite = isAdmin || ['pengawas', 'kepala_madrasah'].includes(role);

  const load = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase.from('laporan').select('*, madrasah:madrasah_id(nama_madrasah, jenjang), creator:created_by(nama, email)').order('created_at', { ascending: false });
    setRows(data || []);
    const { data: m } = await supabase.from('madrasah').select('id, nama_madrasah, jenjang').order('nama_madrasah');
    setMadrasahs(m || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!confirm('Hapus laporan ini?')) return;
    await supabase.from('laporan').delete().eq('id', id);
    load();
  };

  const save = async (e) => {
    e.preventDefault(); setError('');
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    payload.skor_akhir = payload.skor_akhir ? Number(payload.skor_akhir) : null;
    if (editing.id) {
      const res = await supabase.from('laporan').update(payload).eq('id', editing.id);
      if (res.error) { setError(res.error.message); return; }
    } else {
      payload.created_by = profile?.id || null;
      const res = await supabase.from('laporan').insert(payload);
      if (res.error) { setError(res.error.message); return; }
    }
    setEditing(null); load();
  };

  return (
    <div>
      <PageHeader title="Laporan" subtitle="Laporan implementasi & pendampingan KBC"
        actions={canWrite && <button className="btn-primary" onClick={() => setEditing({})}><Plus size={16} /> Tambah Laporan</button>}
      />

      {loading ? <Loading /> : rows.length === 0 ? <Empty icon={FileText} label="Belum ada laporan" /> : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Jenis</th><th>Madrasah</th><th>Periode</th><th>Skor Akhir</th><th>Pembuat</th><th>Tanggal</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const k = r.skor_akhir != null ? kategoriSkor(r.skor_akhir) : null;
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="font-medium">{r.jenis_laporan}</td>
                    <td className="text-sm">{r.madrasah?.nama_madrasah || '-'}</td>
                    <td className="text-xs">{r.periode || '-'}</td>
                    <td>{k ? <Badge color={k.color}>{r.skor_akhir} · {k.label}</Badge> : '-'}</td>
                    <td className="text-xs">{r.creator?.nama || r.creator?.email || '-'}</td>
                    <td className="text-xs">{new Date(r.created_at).toLocaleDateString('id-ID')}</td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn-ghost p-1.5" onClick={() => setPrinting(r)} title="Cetak"><Printer size={15} /></button>
                        {canWrite && <>
                          <button className="btn-ghost p-1.5" onClick={() => setEditing(r)}><Pencil size={15} /></button>
                          <button className="btn-ghost p-1.5 text-red-600" onClick={() => remove(r.id)}><Trash2 size={15} /></button>
                        </>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Laporan' : 'Tambah Laporan'} size="lg">
        {editing && (
          <form onSubmit={save} className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Jenis Laporan</label>
              <select name="jenis_laporan" required defaultValue={editing.jenis_laporan || ''} className="input">
                <option value="">— Pilih —</option>
                {JENIS.map((j) => <option key={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Periode</label>
              <input name="periode" defaultValue={editing.periode || ''} className="input" placeholder="Sept – Des 2026" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Madrasah</label>
              <select name="madrasah_id" required defaultValue={editing.madrasah_id || ''} className="input">
                <option value="">— Pilih —</option>
                {madrasahs.map((m) => <option key={m.id} value={m.id}>{m.jenjang} {m.nama_madrasah}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Skor Akhir (0–100)</label>
              <input name="skor_akhir" type="number" min={0} max={100} defaultValue={editing.skor_akhir ?? ''} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Isi Laporan</label>
              <textarea name="isi_laporan" rows={6} required defaultValue={editing.isi_laporan || ''} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Rekomendasi Akhir</label>
              <textarea name="rekomendasi_akhir" rows={3} defaultValue={editing.rekomendasi_akhir || ''} className="input" />
            </div>
            <div className="sm:col-span-2"><ErrorBox message={error} /></div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Batal</button>
              <button type="submit" className="btn-primary">Simpan</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Print preview */}
      <Modal open={!!printing} onClose={() => setPrinting(null)} title="Pratinjau Laporan" size="xl"
        footer={<>
          <button className="btn-ghost" onClick={() => setPrinting(null)}>Tutup</button>
          <button className="btn-primary" onClick={() => window.print()}><Printer size={16} /> Cetak</button>
        </>}
      >
        {printing && (
          <div className="print-page bg-white text-slate-900 p-2">
            <div className="text-center mb-4 border-b-2 border-slate-800 pb-3">
              <div className="text-xs">KEMENTERIAN AGAMA REPUBLIK INDONESIA</div>
              <div className="text-sm font-bold">KANTOR KEMENTERIAN AGAMA KABUPATEN JEMBER</div>
              <div className="text-xs">Pengawas Madrasah — Pokjawas Kabupaten Jember</div>
              <div className="text-xs italic mt-1">Aplikasi Pendampingan KBC Madrasah Piloting</div>
            </div>
            <div className="text-center mb-4">
              <div className="text-base font-bold uppercase">{printing.jenis_laporan}</div>
              <div className="text-sm">{printing.madrasah?.nama_madrasah}</div>
              <div className="text-xs italic">Periode: {printing.periode || '-'}</div>
            </div>
            <div className="prose max-w-none text-sm whitespace-pre-wrap mb-4">{printing.isi_laporan}</div>
            {printing.skor_akhir != null && (
              <div className="mb-4 text-sm">
                <strong>Skor Akhir:</strong> {printing.skor_akhir} ({kategoriSkor(printing.skor_akhir).label})
              </div>
            )}
            {printing.rekomendasi_akhir && (
              <div className="mb-4 text-sm">
                <strong>Rekomendasi Tindak Lanjut:</strong>
                <div className="whitespace-pre-wrap mt-1">{printing.rekomendasi_akhir}</div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-6 mt-12 text-sm text-center">
              <div>
                <div>Mengetahui,</div>
                <div>Kepala Madrasah</div>
                <div className="h-16" />
                <div className="font-semibold border-t border-slate-700 pt-1">{printing.madrasah?.nama_madrasah || '_____________'}</div>
              </div>
              <div>
                <div>Jember, {new Date(printing.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                <div>Pengawas Madrasah</div>
                <div className="h-16" />
                <div className="font-semibold border-t border-slate-700 pt-1">{printing.creator?.nama || '_____________'}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
