import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PageHeader, Loading, Empty, Badge } from '../components/ui';
import { kategoriSkor, REKOMENDASI_OTOMATIS, KBC_BOBOT } from '../lib/constants';
import { Lightbulb } from 'lucide-react';

export default function Rekomendasi() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!supabase) { setLoading(false); return; }
      const [{ data: madrasah }, { data: pend }, { data: diag }] = await Promise.all([
        supabase.from('madrasah').select('id, nama_madrasah, jenjang').order('nama_madrasah'),
        supabase.from('pendampingan').select('madrasah_id, komponen, skor, rekomendasi'),
        supabase.from('diagnosis_kbc').select('madrasah_id, komponen, skor, rekomendasi'),
      ]);
      const result = (madrasah || []).map((m) => {
        const all = [...(pend || []), ...(diag || [])].filter((r) => r.madrasah_id === m.id);
        const perK = {};
        all.forEach((r) => {
          if (!r.komponen) return;
          if (!perK[r.komponen]) perK[r.komponen] = { total: 0, n: 0 };
          perK[r.komponen].total += Number(r.skor || 0);
          perK[r.komponen].n += 1;
        });
        const lemah = Object.entries(perK)
          .map(([k, v]) => ({ komponen: k, avg: v.total / v.n }))
          .filter((x) => x.avg < 51)
          .sort((a, b) => a.avg - b.avg);
        return { ...m, lemah };
      }).filter((m) => m.lemah.length > 0);
      setData(result);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Loading />;
  if (data.length === 0) return (
    <div>
      <PageHeader title="Rekomendasi Otomatis" subtitle="Tindak lanjut berbasis skor rendah (<51)" />
      <Empty icon={Lightbulb} label="Tidak ada komponen di bawah ambang. Bagus!" />
    </div>
  );

  return (
    <div>
      <PageHeader title="Rekomendasi Otomatis" subtitle="Tindak lanjut prioritas untuk madrasah dengan skor di bawah 51" />
      <div className="space-y-3">
        {data.map((m) => (
          <div key={m.id} className="card">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="text-amber-500" size={18} />
              <div className="font-semibold text-slate-800">{m.nama_madrasah}</div>
              <Badge color="info">{m.jenjang}</Badge>
            </div>
            <div className="space-y-2">
              {m.lemah.map((l) => {
                const key = KBC_BOBOT.find((k) => k.label === l.komponen)?.key;
                const rek = key ? REKOMENDASI_OTOMATIS[key] : null;
                const k = kategoriSkor(l.avg);
                return (
                  <div key={l.komponen} className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                    <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                      <div className="font-medium text-sm text-slate-800">{l.komponen}</div>
                      <Badge color={k.color}>Skor {Math.round(l.avg)} · {k.label}</Badge>
                    </div>
                    {rek && <div className="text-sm text-slate-700 leading-relaxed">{rek}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
