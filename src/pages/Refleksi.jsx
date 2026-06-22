import { PageHeader } from '../components/ui';
import { RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Refleksi() {
  return (
    <div>
      <PageHeader title="Refleksi Pembelajaran" subtitle="Catatan refleksi guru terhadap praktik pembelajaran berbasis KBC" />
      <div className="card">
        <div className="flex flex-col items-center text-center py-8">
          <RotateCcw size={42} className="text-slate-400" />
          <p className="mt-3 text-sm text-slate-600 max-w-md">
            Refleksi pembelajaran disimpan menyatu dengan jurnal implementasi pada kolom <strong>Refleksi / Bukti</strong>. Buka menu <Link to="/jurnal" className="text-primary-700 underline">Jurnal Implementasi</Link> untuk menambah refleksi.
          </p>
        </div>
      </div>
    </div>
  );
}
