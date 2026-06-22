import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { PageHeader, StatCard, Loading, Empty } from '../components/ui';
import { kategoriSkor, KBC_BOBOT } from '../lib/constants';
import { School, Users, ClipboardCheck, FileText, Upload, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#1e4fa8', '#eecb59', '#2fa295', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];

export default function Dashboard() {
  const { profile, isAdmin, role } = useAuth();
  const [stats, setStats] = useState({
    madrasah: 0, users: 0, eviden: 0, laporan: 0, diagnosis: 0, pendampingan: 0,
  });
  const [skorMadrasah, setSkorMadrasah] = useState([]);
  const [skorKomponen, setSkorKomponen] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!supabase) { setLoading(false); return; }
      const myMadrasah = profile?.madrasah_id;
      const isLimited = !isAdmin && role !== 'pengawas';

      const [
        { count: madrasahCount },
        { count: usersCount },
        { count: evidenCount },
        { count: laporanCount },
        { count: diagnosisCount },
        { count: pendampinganCount },
      ] = await Promise.all([
        supabase.from('madrasah').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('eviden').select('id', { count: 'exact', head: true }),
        supabase.from('laporan').select('id', { count: 'exact', head: true }),
        supabase.from('diagnosis_kbc').select('id', { count: 'exact', head: true }),
        supabase.from('pendampingan').select('id', { count: 'exact', head: true }),
      ]);

      // Aggregate average score per madrasah from pendampingan
      let q = supabase.from('pendampingan').select('madrasah_id, komponen, skor, madrasah:madrasah_id(nama_madrasah)');
      if (isLimited && myMadrasah) q = q.eq('madrasah_id', myMadrasah);
      const { data: pData } = await q;
      const byMadrasah = {};
      const byKomponen = {};
      (pData || []).forEach((row) => {
        const mName = row.madrasah?.nama_madrasah || row.madrasah_id;
        if (!byMadrasah[mName]) byMadrasah[mName] = { total: 0, n: 0 };
        byMadrasah[mName].total += Number(row.skor || 0);
        byMadrasah[mName].n += 1;
        if (row.komponen) {
          if (!byKomponen[row.komponen]) byKomponen[row.komponen] = { total: 0, n: 0 };
          byKomponen[row.komponen].total += Number(row.skor || 0);
          byKomponen[row.komponen].n += 1;
        }
      });

      if (!mounted) return;
      setStats({
        madrasah: madrasahCount || 0,
        users: usersCount || 0,
        eviden: evidenCount || 0,
        laporan: laporanCount || 0,
        diagnosis: diagnosisCount || 0,
        pendampingan: pendampinganCount || 0,
      });
      setSkorMadrasah(
        Object.entries(byMadrasah)
          .map(([nama, v]) => ({ nama, skor: Math.round((v.total / Math.max(v.n, 1)) * 10) / 10 }))
          .sort((a, b) => b.skor - a.skor)
          .slice(0, 8)
      );
      setSkorKomponen(
        KBC_BOBOT.map((k) => ({
          komponen: k.label.split(' ').slice(0, 2).join(' '),
          fullLabel: k.label,
          skor: byKomponen[k.label] ? Math.round((byKomponen[k.label].total / byKomponen[k.label].n) * 10) / 10 : 0,
        }))
      );
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [profile?.madrasah_id, isAdmin, role]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 11) return 'Selamat pagi';
    if (h < 15) return 'Selamat siang';
    if (h < 18) return 'Selamat sore';
    return 'Selamat malam';
  })();

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${profile?.nama || profile?.email || ''}`}
        subtitle="Ringkasan implementasi KBC di madrasah piloting"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={School} label="Madrasah" value={stats.madrasah} color="primary" />
        <StatCard icon={Users} label="Pengguna" value={stats.users} color="teal" />
        <StatCard icon={ClipboardCheck} label="Diagnosis" value={stats.diagnosis} color="info" />
        <StatCard icon={TrendingUp} label="Pendampingan" value={stats.pendampingan} color="gold" />
        <StatCard icon={Upload} label="Eviden" value={stats.eviden} color="success" />
        <StatCard icon={FileText} label="Laporan" value={stats.laporan} color="primary" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-800">Skor Rata-rata per Madrasah</h3>
          </div>
          {skorMadrasah.length === 0 ? (
            <Empty label="Belum ada data pendampingan" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={skorMadrasah} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} fontSize={12} />
                <YAxis type="category" dataKey="nama" width={140} fontSize={11} />
                <Tooltip />
                <Bar dataKey="skor" fill="#1e4fa8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-800">Skor per Komponen KBC</h3>
          </div>
          {skorKomponen.every((k) => !k.skor) ? (
            <Empty label="Belum ada data komponen" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={skorKomponen}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="komponen" fontSize={11} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis domain={[0, 100]} fontSize={12} />
                <Tooltip formatter={(v, _n, p) => [v, p?.payload?.fullLabel]} />
                <Bar dataKey="skor" radius={[4, 4, 0, 0]}>
                  {skorKomponen.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">
          <h3 className="font-semibold text-slate-800">Kategori Skor</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {[{ s: 90, label: 'Membudaya', color: 'bg-emerald-100 text-emerald-800' },
            { s: 60, label: 'Berkembang', color: 'bg-sky-100 text-sky-800' },
            { s: 40, label: 'Mulai Tumbuh', color: 'bg-amber-100 text-amber-800' },
            { s: 10, label: 'Belum Siap', color: 'bg-red-100 text-red-800' }].map((k) => (
            <div key={k.label} className={`rounded-lg px-3 py-3 ${k.color}`}>
              <div className="font-semibold">{k.label}</div>
              <div className="text-xs opacity-75 mt-0.5">
                {k.label === 'Belum Siap' && '0–25'}
                {k.label === 'Mulai Tumbuh' && '26–50'}
                {k.label === 'Berkembang' && '51–75'}
                {k.label === 'Membudaya' && '76–100'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
