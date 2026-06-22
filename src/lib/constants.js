// KBC scoring config & static lookups

export const KBC_BOBOT = [
  { key: 'tata_kelola', label: 'Tata Kelola dan Tim Inti KBC', bobot: 10 },
  { key: 'ksp', label: 'Dokumen Kurikulum/KSP', bobot: 15 },
  { key: 'perangkat_ajar', label: 'Perangkat Ajar dan Asesmen Intrakurikuler', bobot: 20 },
  { key: 'praktik', label: 'Praktik Pembelajaran', bobot: 20 },
  { key: 'kokurikuler', label: 'Kokurikuler', bobot: 10 },
  { key: 'ekstrakurikuler', label: 'Ekstrakurikuler', bobot: 10 },
  { key: 'budaya', label: 'Budaya/Iklim Madrasah', bobot: 10 },
  { key: 'kemitraan', label: 'Kemitraan, Pelaporan, dan Tindak Lanjut', bobot: 5 },
];

export const PANCA_CINTA = [
  'Cinta Allah dan Rasul',
  'Cinta Ilmu',
  'Cinta Diri dan Sesama',
  'Cinta Lingkungan',
  'Cinta Tanah Air',
];

export const REKOMENDASI_OTOMATIS = {
  ksp: 'Madrasah perlu merevisi visi, misi, tujuan, dan pengorganisasian pembelajaran agar memuat Panca Cinta.',
  perangkat_ajar: 'Guru perlu mengikuti klinik penyusunan perangkat ajar berbasis Panca Cinta dan Pembelajaran Mendalam.',
  praktik: 'Pengawas perlu melakukan coaching dan observasi kelas lanjutan.',
  kokurikuler: 'Madrasah perlu menyusun program kokurikuler yang memiliki tujuan, asesmen, refleksi, dan pelaporan.',
  ekstrakurikuler: 'Pembina ekstrakurikuler perlu memasukkan nilai Panca Cinta ke dalam program dan jurnal kegiatan.',
  budaya: 'Madrasah perlu memperkuat pembiasaan 5S, disiplin positif, anti-bullying, refleksi pagi, dan budaya ramah lingkungan.',
  tata_kelola: 'Madrasah perlu memperkuat tata kelola dan menugaskan Tim Inti KBC dengan SK resmi.',
  kemitraan: 'Madrasah perlu meningkatkan kemitraan dengan orang tua, komunitas, dan instansi terkait.',
};

export function kategoriSkor(skor) {
  if (skor == null || isNaN(skor)) return { label: '-', color: 'muted' };
  if (skor >= 76) return { label: 'Membudaya', color: 'success' };
  if (skor >= 51) return { label: 'Berkembang', color: 'info' };
  if (skor >= 26) return { label: 'Mulai Tumbuh', color: 'warn' };
  return { label: 'Belum Siap', color: 'danger' };
}

export function rekomendasiByKomponen(komponenKey, skor) {
  if (skor == null || skor >= 51) return '';
  return REKOMENDASI_OTOMATIS[komponenKey] || '';
}

export function generateActivationCode(scope = 'JBR', year = new Date().getFullYear()) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 6; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `KBC-${scope.toUpperCase()}-${year}-${rand}`;
}

export const ROLE_LABEL = {
  admin: 'Admin',
  pengawas: 'Pengawas Madrasah',
  kepala_madrasah: 'Kepala Madrasah',
  guru: 'Guru / Tim KBC',
};

export const STATUS_LABEL = {
  unused: { label: 'Belum Dipakai', color: 'info' },
  used: { label: 'Sudah Dipakai', color: 'success' },
  expired: { label: 'Kedaluwarsa', color: 'warn' },
  revoked: { label: 'Dibatalkan', color: 'danger' },
  pending: { label: 'Pending', color: 'warn' },
  active: { label: 'Aktif', color: 'success' },
};

export const KOMPONEN_DIAGNOSIS = KBC_BOBOT.map((k) => k.label);
