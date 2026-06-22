import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { PageHeader, Loading, Empty, Modal, Badge, ErrorBox } from '../components/ui';
import { Plus, Copy, Ban, KeyRound, Search, Trash2 } from 'lucide-react';
import { generateActivationCode, ROLE_LABEL, STATUS_LABEL } from '../lib/constants';

export default function KodeAktivasi() {
  const { profile } = useAuth();
  const [rows, setRows] = useState([]);
  const [madrasahs, setMadrasahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [bulk, setBulk] = useState({
    jumlah: 1,
    role: 'guru',
    madrasah_id: '',
    expired_at: '',
    scope: 'JBR',
  });

  const load = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase.from('activation_codes')
      .select('*, madrasah:madrasah_id(nama_madrasah, jenjang), used_by_profile:used_by(nama, email)')
      .order('created_at', { ascending: false });
    setRows(data || []);
    const { data: m } = await supabase.from('madrasah').select('id, nama_madrasah, jenjang').order('nama_madrasah');
    setMadrasahs(m || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) =>
    (!q || r.code.toLowerCase().includes(q.toLowerCase())) &&
    (!statusFilter || r.status === statusFilter)
  ), [rows, q, statusFilter]);

  const generate = async (e) => {
    e.preventDefault(); setError('');
    const payloads = [];
    for (let i = 0; i < Math.max(1, Number(bulk.jumlah)); i++) {
      payloads.push({
        code: generateActivationCode(bulk.scope),
        role: bulk.role,
        madrasah_id: bulk.madrasah_id || null,
        expired_at: bulk.expired_at || null,
        status: 'unused',
        created_by: profile?.id || null,
      });
    }
    const { error } = await supabase.from('activation_codes').insert(payloads);
    if (error) { setError(error.message); return; }
    setOpen(false); load();
  };

  const revoke = async (r) => {
    if (!confirm(`Revoke kode ${r.code}?`)) return;
    await supabase.from('activation_codes').update({ status: 'revoked' }).eq('id', r.id);
    load();
  };

  const remove = async (r) => {
    if (!confirm(`Hapus kode ${r.code}? (Permanen)`)) return;
    await supabase.from('activation_codes').delete().eq('id', r.id);
    load();
  };

  const copy = (c) => {
    navigator.clipboard.writeText(c).then(() => alert('Kode disalin: ' + c));
  };

  return (
    <div>
      <PageHeader title="Kode Aktivasi" subtitle="Generate dan kelola kode aktivasi pengguna"
        actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Generate Kode</button>}
      />

      <div className="card mb-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Cari kode" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input sm:w-52" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Semua Status</option>
          <option value="unused">Belum dipakai</option>
          <option value="used">Sudah dipakai</option>
          <option value="expired">Kedaluwarsa</option>
          <option value="revoked">Dibatalkan</option>
        </select>
      </div>

      {loading ? <Loading /> : filtered.length === 0 ? <Empty icon={KeyRound} label="Belum ada kode aktivasi" /> : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Kode</th><th>Peran</th><th>Madrasah</th><th>Expired</th>
                <th>Status</th><th>Dipakai oleh</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const st = STATUS_LABEL[r.status] || { label: r.status, color: 'muted' };
                const expired = r.expired_at && new Date(r.expired_at) < new Date() && r.status === 'unused';
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="font-mono font-semibold text-primary-700">{r.code}</td>
                    <td><Badge color="info">{ROLE_LABEL[r.role] || r.role}</Badge></td>
                    <td className="text-sm">{r.madrasah?.nama_madrasah || <span className="text-slate-400 italic">semua</span>}</td>
                    <td className="text-xs">{r.expired_at ? new Date(r.expired_at).toLocaleDateString('id-ID') : '-'}</td>
                    <td><Badge color={expired ? 'warn' : st.color}>{expired ? 'Kedaluwarsa' : st.label}</Badge></td>
                    <td className="text-xs">{r.used_by_profile?.nama || r.used_by_profile?.email || '-'}</td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn-ghost p-1.5" onClick={() => copy(r.code)} title="Salin"><Copy size={15} /></button>
                        {r.status === 'unused' && (
                          <button className="btn-ghost p-1.5 text-amber-600" onClick={() => revoke(r)} title="Revoke"><Ban size={15} /></button>
                        )}
                        <button className="btn-ghost p-1.5 text-red-600" onClick={() => remove(r)} title="Hapus"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Generate Kode Aktivasi" size="md">
        <form onSubmit={generate} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Jumlah Kode</label>
              <input type="number" min={1} max={100} className="input" value={bulk.jumlah}
                onChange={(e) => setBulk({ ...bulk, jumlah: e.target.value })} />
            </div>
            <div>
              <label className="label">Scope (3 huruf)</label>
              <input className="input uppercase" maxLength={4} value={bulk.scope}
                onChange={(e) => setBulk({ ...bulk, scope: e.target.value.toUpperCase() })} placeholder="JBR / MI / MA" />
            </div>
            <div>
              <label className="label">Peran</label>
              <select className="input" value={bulk.role} onChange={(e) => setBulk({ ...bulk, role: e.target.value })}>
                <option value="pengawas">Pengawas</option>
                <option value="kepala_madrasah">Kepala Madrasah</option>
                <option value="guru">Guru</option>
              </select>
            </div>
            <div>
              <label className="label">Madrasah (opsional)</label>
              <select className="input" value={bulk.madrasah_id} onChange={(e) => setBulk({ ...bulk, madrasah_id: e.target.value })}>
                <option value="">— Semua / Tidak terikat —</option>
                {madrasahs.map((m) => <option key={m.id} value={m.id}>{m.jenjang} {m.nama_madrasah}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Tanggal Expired (opsional)</label>
              <input type="date" className="input" value={bulk.expired_at}
                onChange={(e) => setBulk({ ...bulk, expired_at: e.target.value })} />
            </div>
          </div>
          <ErrorBox message={error} />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Batal</button>
            <button type="submit" className="btn-primary">Generate</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
