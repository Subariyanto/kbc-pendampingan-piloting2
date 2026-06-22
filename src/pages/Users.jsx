import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { PageHeader, Loading, Empty, Modal, Badge, ErrorBox } from '../components/ui';
import { Search, Pencil, Users as UsersIcon, ShieldOff } from 'lucide-react';
import { ROLE_LABEL, STATUS_LABEL } from '../lib/constants';

export default function Users() {
  const [rows, setRows] = useState([]);
  const [madrasahs, setMadrasahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase.from('profiles')
      .select('*, madrasah:madrasah_id(nama_madrasah, jenjang)')
      .order('created_at', { ascending: false });
    setRows(data || []);
    const { data: m } = await supabase.from('madrasah').select('id, nama_madrasah, jenjang').order('nama_madrasah');
    setMadrasahs(m || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) =>
    (!q || (r.nama || '').toLowerCase().includes(q.toLowerCase()) || (r.email || '').toLowerCase().includes(q.toLowerCase()))
    && (!roleFilter || r.role === roleFilter)
  ), [rows, q, roleFilter]);

  const save = async (e) => {
    e.preventDefault(); setError('');
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    if (!payload.madrasah_id) payload.madrasah_id = null;
    payload.updated_at = new Date().toISOString();
    const { error } = await supabase.from('profiles').update(payload).eq('id', editing.id);
    if (error) { setError(error.message); return; }
    setEditing(null); load();
  };

  const toggleStatus = async (r) => {
    const next = r.status === 'active' ? 'revoked' : 'active';
    if (!confirm(`Ubah status user ${r.nama || r.email} jadi "${next}"?`)) return;
    await supabase.from('profiles').update({ status: next, updated_at: new Date().toISOString() }).eq('id', r.id);
    load();
  };

  return (
    <div>
      <PageHeader title="Manajemen User" subtitle="Kelola pengguna sistem & status aktif" />

      <div className="card mb-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Cari nama / email" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input sm:w-52" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">Semua Peran</option>
          {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {loading ? <Loading /> : filtered.length === 0 ? <Empty icon={UsersIcon} /> : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nama</th><th>Email</th><th>Peran</th><th>Madrasah</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const st = STATUS_LABEL[r.status] || { label: r.status, color: 'muted' };
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="font-medium">{r.nama || '-'}</td>
                    <td className="text-xs">{r.email}</td>
                    <td><Badge color="info">{ROLE_LABEL[r.role] || r.role}</Badge></td>
                    <td>{r.madrasah?.nama_madrasah || '-'}</td>
                    <td><Badge color={st.color}>{st.label}</Badge></td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn-ghost p-1.5" onClick={() => setEditing(r)}><Pencil size={15} /></button>
                        <button className="btn-ghost p-1.5 text-red-600" onClick={() => toggleStatus(r)} title="Aktif/Revoke"><ShieldOff size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit User" size="md">
        {editing && (
          <form onSubmit={save} className="space-y-3">
            <div>
              <label className="label">Nama</label>
              <input name="nama" defaultValue={editing.nama || ''} className="input" />
            </div>
            <div>
              <label className="label">Peran</label>
              <select name="role" defaultValue={editing.role} className="input">
                {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Madrasah</label>
              <select name="madrasah_id" defaultValue={editing.madrasah_id || ''} className="input">
                <option value="">— Tidak di madrasah tertentu —</option>
                {madrasahs.map((m) => <option key={m.id} value={m.id}>{m.jenjang} {m.nama_madrasah}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select name="status" defaultValue={editing.status} className="input">
                <option value="pending">pending</option>
                <option value="active">active</option>
                <option value="revoked">revoked</option>
              </select>
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
