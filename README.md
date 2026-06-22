# Aplikasi Pendampingan KBC Madrasah Piloting

Aplikasi web responsif untuk pendampingan implementasi **Kurikulum Berbasis Cinta (KBC)** di madrasah piloting.
**Frontend statis** (React + Vite) yang dideploy ke **GitHub Pages**, dengan **Supabase** sebagai backend (Auth + Postgres + Storage + RLS).

> Multi-device: bisa diakses dari HP, tablet, dan laptop selama pengguna login dengan akun yang sama. Sesi disimpan di browser (Supabase persistent session).

---

## Stack

- **Frontend:** React 19 + Vite + TailwindCSS 3 + React Router 7 (HashRouter)
- **Backend:** Supabase (Auth, Database, Storage, RLS)
- **Charts:** Recharts
- **Icons:** lucide-react
- **Deploy:** GitHub Pages (gh-pages branch atau GitHub Actions)

## Role

| Role | Akses |
|---|---|
| **Admin** | Semua data, kelola user, kode aktivasi, madrasah |
| **Pengawas** | Madrasah binaan, diagnosis, pendampingan, monitoring, laporan |
| **Kepala Madrasah** | Profil madrasah, Tim KBC, rencana aksi, eviden, laporan |
| **Guru / Tim KBC** | Perangkat ajar, jurnal, refleksi, eviden |

---

## 1. Cara Install Aplikasi

```bash
git clone https://github.com/USERNAME/kbc-pendampingan-piloting2.git
cd kbc-pendampingan-piloting2
npm install
cp .env.example .env
```

Isi `.env` dengan kredensial Supabase Anda:
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ....
VITE_ADMIN_EMAIL=subariyantoss3@gmail.com
```

> **PENTING:** Hanya gunakan `anon` / `publishable` key. **Jangan pernah** menaruh `service_role` key di frontend.

## 2. Cara Menghubungkan Supabase

### a. Buat Project Supabase
1. Login ke https://supabase.com
2. **New Project** → isi nama (mis. `kbc-pendampingan-piloting`), pilih region Singapore
3. Buka **Settings → API**, salin:
   - `Project URL` → ke `VITE_SUPABASE_URL`
   - `anon` key → ke `VITE_SUPABASE_ANON_KEY`

### b. Jalankan SQL Schema
1. Supabase Dashboard → **SQL Editor → New Query**
2. Buka file `supabase/schema.sql`, copy semua isi, paste, klik **Run**
3. Schema akan membuat: 9 tabel + trigger auto-create profile + RLS policies + RPC `redeem_activation_code()`

### c. Buat Storage Bucket
1. Supabase Dashboard → **Storage → New Bucket**
   - Nama: `eviden`
   - Public: **ON**
   - File size limit: 10 MB
2. Jalankan policy storage di `supabase/storage-policies.sql` di SQL Editor

### d. Daftarkan Admin Utama
1. Supabase Dashboard → **Authentication → Users → Add User**
   - Email: `subariyantoss3@gmail.com`
   - Password: (set sendiri, minimal 6 karakter)
   - **Auto Confirm: ON**
2. Trigger `handle_new_user()` otomatis menjadikan email tersebut sebagai admin dengan status active.

## 3. Cara Menjalankan Aplikasi Lokal

```bash
npm run dev
```
Buka http://localhost:5173 dan login dengan akun admin yang baru dibuat.

## 4. Cara Build Aplikasi

```bash
npm run build
```
Output ada di folder `dist/`. Untuk preview production build:
```bash
npm run preview
```

## 5. Cara Deploy ke GitHub Pages

### Persiapan Repository
1. Buat repository di GitHub (mis. `kbc-pendampingan-piloting2`)
2. Edit `vite.config.js`, sesuaikan `REPO_NAME` dengan nama repo Anda:
   ```js
   const REPO_NAME = 'kbc-pendampingan-piloting2';
   ```
3. Edit `package.json`, ubah `homepage` jadi:
   ```json
   "homepage": "https://USERNAME.github.io/REPO_NAME/"
   ```
4. Push ke GitHub:
   ```bash
   git init
   git add .
   git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/USERNAME/REPO_NAME.git
   git push -u origin main
   ```

### Opsi A — Deploy Manual (gh-pages CLI)
```bash
npm run deploy
```
Script ini akan build lalu push ke branch `gh-pages` otomatis. Setelah itu di GitHub:
- **Settings → Pages → Source: Deploy from a branch**
- Pilih branch `gh-pages` / folder `/ (root)` → Save

URL siap di: `https://USERNAME.github.io/REPO_NAME/`

### Opsi B — Deploy Otomatis via GitHub Actions (rekomendasi)
File workflow sudah disediakan di `.github/workflows/deploy.yml`. Langkah:
1. Di GitHub repo: **Settings → Pages → Source: GitHub Actions**
2. **Settings → Secrets and variables → Actions** → tambahkan secret:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ADMIN_EMAIL`
3. Setiap push ke `main`, workflow akan otomatis build dan deploy ke GitHub Pages.

> **Kenapa HashRouter?** GitHub Pages tidak mendukung server-side rewrite, jadi semua route harus pakai `#/path` (mis. `https://USER.github.io/REPO/#/dashboard`). Ini sudah dikonfigurasi di `src/App.jsx`.

## 6. Cara Membuat Akun Admin Pertama

Email admin utama (`VITE_ADMIN_EMAIL` di `.env`) **otomatis menjadi admin** saat register. Default: `subariyantoss3@gmail.com`.

**Cara 1 — Lewat Supabase Dashboard (paling cepat):**
1. **Authentication → Users → Add User**
2. Email = `subariyantoss3@gmail.com`, password = bebas, **Auto Confirm = ON**
3. Trigger `handle_new_user()` otomatis bikin row di `profiles` dengan `role=admin`, `status=active`
4. Login di aplikasi → langsung masuk dashboard admin

**Cara 2 — Lewat halaman Register:**
1. Buka aplikasi, klik **Buat Akun**
2. Isi email = `subariyantoss3@gmail.com`, password, dll
3. Notice di form akan muncul: "Email admin utama terdeteksi — akun akan otomatis menjadi Admin"
4. Setelah konfirmasi email (jika diaktifkan), login langsung sebagai admin

**Cara 3 — Promote user existing jadi admin (manual via SQL):**
```sql
update public.profiles
set role = 'admin', status = 'active'
where email = 'email-target@contoh.com';
```

## 7. Cara Generate Kode Aktivasi

1. Login sebagai **Admin**
2. Buka menu **Kode Aktivasi**
3. Klik **+ Generate Kode**
4. Isi:
   - **Jumlah Kode** (1–100)
   - **Scope** (mis. `JBR`, `MI`, `RA`)
   - **Peran** (Pengawas / Kepala Madrasah / Guru)
   - **Madrasah** (opsional — kosongkan kalau kode bisa dipakai untuk madrasah mana saja)
   - **Tanggal Expired** (opsional)
5. Klik **Generate**
6. Kode muncul di tabel dengan format `KBC-{SCOPE}-{YEAR}-{6CHAR}` (contoh: `KBC-JBR-2026-A7X9Q2`)
7. Tombol **Copy** untuk salin kode, **Revoke** untuk membatalkan, **Hapus** untuk delete permanen

## 8. Cara User Daftar Memakai Kode Aktivasi

1. Admin kirim kode aktivasi ke calon pengguna
2. Pengguna buka aplikasi → klik **Buat Akun**
3. Isi:
   - Nama lengkap
   - Email
   - Password
   - Peran (sesuai kode yang diterima)
   - Madrasah (sesuai kode yang diterima)
   - **Kode Aktivasi**
4. Klik **Daftar**
5. Sistem otomatis:
   - Membuat akun di Supabase Auth
   - Memvalidasi kode (status, role, madrasah, expired) lewat RPC `redeem_activation_code()`
   - Menandai kode sebagai `used` dan profile sebagai `active`
6. User langsung diarahkan ke dashboard

**Jika konfirmasi email Supabase aktif:**
- Setelah daftar, user perlu klik link konfirmasi di email
- Lalu login → masuk halaman **Aktivasi Akun** untuk memasukkan kode aktivasi

**Jika kode tidak valid:**
Sistem akan menampilkan pesan: _"Kode aktivasi tidak valid, sudah digunakan, atau sudah kedaluwarsa."_

---

## Format Kode Aktivasi

```
KBC-[SCOPE]-[YEAR]-[6 char random]
```
Contoh: `KBC-JBR-2026-A7X9Q2`, `KBC-MI-2026-K4P8L2`

Karakter random pakai alphabet 32-char (mengecualikan `I`, `O`, `0`, `1` agar tidak ambigu).

## Skor KBC (8 Komponen Tertimbang)

| Komponen | Bobot |
|---|---|
| Tata Kelola dan Tim Inti | 10% |
| Dokumen Kurikulum/KSP | 15% |
| Perangkat Ajar dan Asesmen | 20% |
| Praktik Pembelajaran | 20% |
| Kokurikuler | 10% |
| Ekstrakurikuler | 10% |
| Budaya/Iklim Madrasah | 10% |
| Kemitraan & Tindak Lanjut | 5% |

**Kategori Skor:**
- 0–25 → **Belum Siap**
- 26–50 → **Mulai Tumbuh**
- 51–75 → **Berkembang**
- 76–100 → **Membudaya**

## 5 Nilai Panca Cinta
1. Cinta Allah dan Rasul
2. Cinta Ilmu
3. Cinta Diri dan Sesama
4. Cinta Lingkungan
5. Cinta Tanah Air

## Struktur Project

```
.
├─ supabase/
│  ├─ schema.sql               # Tabel + RLS + RPC redeem_activation_code
│  └─ storage-policies.sql     # Policy untuk bucket eviden
├─ src/
│  ├─ lib/
│  │  ├─ supabase.js           # Client supabase
│  │  ├─ AuthContext.jsx       # Auth provider + session
│  │  └─ constants.js          # KBC_BOBOT, PANCA_CINTA, generateActivationCode, kategoriSkor
│  ├─ components/
│  │  ├─ AppLayout.jsx         # Sidebar + header (responsive)
│  │  ├─ guards.jsx            # ProtectedRoute, RoleGuard
│  │  └─ ui.jsx                # PageHeader, StatCard, Modal, Badge, Loading, Empty
│  ├─ pages/                   # 22 halaman (Login, Dashboard, Madrasah, dll)
│  ├─ App.jsx                  # Routing (HashRouter) + AuthProvider
│  └─ main.jsx
├─ public/
│  └─ .nojekyll                # disable Jekyll di GitHub Pages
├─ .github/workflows/deploy.yml # CI/CD ke GitHub Pages
├─ index.html
├─ vite.config.js              # base path untuk GitHub Pages
└─ .env.example
```

## Keamanan

- Frontend hanya pakai **anon / publishable key**. Service role key tidak boleh dikirim ke client.
- Akses data dijaga oleh **Row Level Security (RLS)** di Supabase.
- Aktivasi via RPC `redeem_activation_code()` — atomic with FOR UPDATE lock.
- Eviden default di public bucket (untuk preview cepat). Ganti ke private bucket bila perlu kontrol akses lebih ketat.

## Multi-Device

Setelah deploy:
- Buka URL aplikasi (mis. `https://USERNAME.github.io/REPO/`) dari HP, tablet, atau laptop
- Login dengan akun yang sama → data sinkron via Supabase
- Sesi disimpan di browser (auto-refresh token)
- Tampilan otomatis menyesuaikan: sidebar di desktop, hamburger menu di mobile

## Troubleshooting

**Halaman blank putih setelah deploy:**
- Pastikan `vite.config.js → REPO_NAME` cocok dengan nama repo GitHub
- Pastikan `public/.nojekyll` ada
- Cek browser console untuk error path asset

**Login berhasil tapi loop ke halaman aktivasi:**
- Pastikan email user belum punya `status=active` di tabel `profiles`
- Atau pakai email yang sama dengan `VITE_ADMIN_EMAIL`

**Kode aktivasi selalu invalid:**
- Pastikan SQL `schema.sql` sudah dijalankan (RPC `redeem_activation_code` harus ada)
- Cek tabel `activation_codes` di Supabase, pastikan kode benar dan status `unused`

**Build error tentang base path:**
- Cek environment variable di GitHub Actions → Settings → Secrets sudah lengkap
