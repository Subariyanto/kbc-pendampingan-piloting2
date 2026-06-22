import { PageHeader, Empty } from '../components/ui';
import { Sparkles } from 'lucide-react';

export default function PraktikBaik() {
  return (
    <div>
      <PageHeader title="Praktik Baik" subtitle="Galeri praktik baik implementasi KBC" />
      <div className="card">
        <Empty icon={Sparkles} label="Praktik baik akan ditampilkan dari eviden yang ditandai sebagai praktik baik. Fitur tag praktik baik bisa ditambahkan dari menu Eviden." />
      </div>
    </div>
  );
}
