# Supabase Setup — Aplikasi Pendampingan KBC Madrasah Piloting

## 1. Buat Project Supabase
1. Login ke https://supabase.com
2. New Project → isi nama (mis. `kbc-pendampingan-piloting`), region Singapore
3. Catat **Project URL** dan **anon/public key** dari Settings → API

## 2. Isi `.env`
Salin `.env.example` jadi `.env` dan isi:

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ....
VITE_ADMIN_EMAIL=subariyantoss3@gmail.com
```

## 3. Jalankan SQL Schema
Di Supabase Dashboard → SQL Editor → buka file `supabase/schema.sql` yang ada di repo ini, paste, lalu klik **Run**. Schema akan membuat:
- 9 tabel (`profiles`, `activation_codes`, `madrasah`, `tim_kbc`, `diagnosis_kbc`, `rencana_aksi`, `pendampingan`, `eviden`, `laporan`)
- Trigger auto-create profile saat user register
- RLS policies
- Function `redeem_activation_code()` untuk validasi atomik

## 4. Buat Storage Bucket
Di Supabase Dashboard → Storage → New Bucket:
- Nama: `eviden`
- Public: ON (supaya `file_url` bisa langsung di-preview)
- File size limit: 10 MB

Lalu jalankan policy storage di `supabase/storage-policies.sql`.

## 5. Daftarkan Admin Utama
Di Authentication → Users → Add User:
- Email: `subariyantoss3@gmail.com`
- Password: (set sendiri)
- Auto Confirm: ON

Lalu di SQL Editor jalankan:

```sql
update public.profiles
set role = 'admin', status = 'active'
where email = 'subariyantoss3@gmail.com';
```

## 6. Run Frontend
```
npm install
npm run dev
```

Buka http://localhost:5173 → login dengan email admin.

## Catatan Keamanan
- Frontend cuma pakai **anon key**. Service role key tidak boleh dikirim ke client.
- Akses data dijaga oleh **RLS policies** di SQL.
- Aktivasi kode divalidasi via RPC `redeem_activation_code()` (atomic — anti race condition).
