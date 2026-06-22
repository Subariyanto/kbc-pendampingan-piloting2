import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PageHeader, Loading, Empty, Badge } from '../components/ui';
import { kategoriSkor, KBC_BOBOT } from '../lib/constants';
import { TrendingUp, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarAngleAxis, PolarGrid, PolarRadiusAxis } from 'recharts';

export default function Monitoring() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!supabase) { setLoading(false); return; }
      const [{ data: madrasah }, { data: pend }, { data: diag }] = await Promise.all([
        supabase.from('madrasah').select('id, nama_madrasah, jenjang').order('nama_madrasah'),
        supabase.from('pendampingan').select('madrasah_id, komponen, skor'),
        supabase.from('diagnosis_kbc').select('madrasah_id, komponen, skor'),
      ]);

      const result = (madrasah || []).map((m) => {
        const allRows = [...(pend || []), ...(diag || [])].filter((r) => r.madrasah_id === m.id);
        // Avg per komponen
        const perKomp = {};
        allRows.forEach((r) => {
          if (!r.komponen) return;
          if (!perKomp[r.komponen]) perKomp[r.komponen] = { total: 0, n: 0 };
          perKomp[r.komponen].total += Number(r.skor || 0);
          perKomp[r.komponen].n += 1;
        });
        // Weighted score
        let totalWeighted = 0, totalBobot = 0;
        const komponenDetail = KBC_BOBOT.map((kb) => {
          const c = perKomp[kb.label];
          const avg = c ? c.total / c.n : 0;
          if (c) {
            totalWeighted += avg * (kb.bobot / 100);
            totalBobot += kb.bobot;
          }
          return { komponen: kb.label.split(' ').slice(0, 2).join(' '), full: kb.label, skor: Math.round(avg * 10) / 10, bobot: kb.bobot };
        });
        const skorAkhir = totalBobot > 0
          ? Math.round((totalWeighted * (100 / totalBobot)) * 10) / 10
          : 0;
        return { ...m, skor: skorAkhir, komponenDetail, n: allRows.length };
      });

      setRows(result);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Loading />;
  if (rows.length === 0) return <Empty icon={TrendingUp} label="Belum ada data monitoring" />;

  const ranked = [...rows].sort((a, b) => b.skor - a.skor);

  return (
    <div>
      <PageHeader title="Monitoring & Skor Progres" subtitle="Skor akhir tertimbang per madrasah" />

      <div className="card mb-4">
        <div className="card-header"><h3 className="font-semibold text-slate-800">Peringkat Madrasah</h3></div>
        <ResponsiveContainer width="100%" height={Math.max(280, ranked.length * 40)}>
          <BarChart data={ranked} layout="vertical" margin={{ left: 0, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" domain={[0, 100]} fontSize={12} />
            <YAxis type="category" dataKey="nama_madrasah" width={160} fontSize={11} />
            <Tooltip />
            <Bar dataKey="skor" fill="#1e4fa8" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 11 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {ranked.map((m, idx) => {
          const k = kategoriSkor(m.skor);
          return (
            <div key={m.id} className="card">
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${idx === 0 ? 'bg-amber-500' : idx < 3 ? 'bg-primary-700' : 'bg-slate-400'}`}>
                  {idx === 0 ? <Award size={18} /> : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 truncate">{m.nama_madrasah}</div>
                  <div className="text-xs text-slate-500">{m.jenjang} · {m.n} entri</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-700">{m.skor}</div>
                  <Badge color={k.color}>{k.label}</Badge>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={m.komponenDetail} outerRadius="75%">
                  <PolarGrid />
                  <PolarAngleAxis dataKey="komponen" fontSize={10} />
                  <PolarRadiusAxis domain={[0, 100]} fontSize={10} />
                  <Radar dataKey="skor" stroke="#1e4fa8" fill="#1e4fa8" fillOpacity={0.4} />
                  <Tooltip formatter={(v, _n, p) => [v, p?.payload?.full]} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    </div>
  );
}
