-- =====================================================================
-- Aplikasi Pendampingan KBC Madrasah Piloting — Supabase Schema
-- Run this in Supabase SQL Editor
-- =====================================================================

-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- =====================================================================
-- TABLE: madrasah
-- =====================================================================
create table if not exists public.madrasah (
  id uuid primary key default gen_random_uuid(),
  nama_madrasah text not null,
  jenjang text check (jenjang in ('RA','MI','MTs','MA')) not null,
  nsm text,
  npsn text,
  alamat text,
  kepala_madrasah text,
  pengawas_id uuid,
  status_piloting text default 'aktif',
  created_at timestamptz default now()
);

-- =====================================================================
-- TABLE: profiles
-- =====================================================================
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  nama text,
  email text unique,
  role text check (role in ('admin','pengawas','kepala_madrasah','guru')) default 'guru',
  madrasah_id uuid references public.madrasah(id) on delete set null,
  status text check (status in ('pending','active','revoked')) default 'pending',
  activation_code text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- FK after profiles exists
alter table public.madrasah
  drop constraint if exists madrasah_pengawas_fkey;
alter table public.madrasah
  add constraint madrasah_pengawas_fkey
  foreign key (pengawas_id) references public.profiles(id) on delete set null;

-- =====================================================================
-- TABLE: activation_codes
-- =====================================================================
create table if not exists public.activation_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  role text check (role in ('pengawas','kepala_madrasah','guru')) not null,
  madrasah_id uuid references public.madrasah(id) on delete set null,
  status text check (status in ('unused','used','expired','revoked')) default 'unused',
  created_by uuid references public.profiles(id) on delete set null,
  used_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  used_at timestamptz,
  expired_at timestamptz
);

create index if not exists idx_activation_codes_status on public.activation_codes(status);
create index if not exists idx_activation_codes_code on public.activation_codes(code);

-- =====================================================================
-- TABLE: tim_kbc
-- =====================================================================
create table if not exists public.tim_kbc (
  id uuid primary key default gen_random_uuid(),
  madrasah_id uuid references public.madrasah(id) on delete cascade,
  nama text not null,
  jabatan text,
  tugas text,
  created_at timestamptz default now()
);

-- =====================================================================
-- TABLE: diagnosis_kbc
-- =====================================================================
create table if not exists public.diagnosis_kbc (
  id uuid primary key default gen_random_uuid(),
  madrasah_id uuid references public.madrasah(id) on delete cascade,
  komponen text not null,
  indikator text,
  skor numeric check (skor between 0 and 100),
  catatan text,
  rekomendasi text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- =====================================================================
-- TABLE: rencana_aksi
-- =====================================================================
create table if not exists public.rencana_aksi (
  id uuid primary key default gen_random_uuid(),
  madrasah_id uuid references public.madrasah(id) on delete cascade,
  program text not null,
  panca_cinta text,
  target text,
  jadwal text,
  penanggung_jawab text,
  indikator text,
  status text default 'rencana',
  bukti text,
  created_at timestamptz default now()
);

-- =====================================================================
-- TABLE: pendampingan
-- =====================================================================
create table if not exists public.pendampingan (
  id uuid primary key default gen_random_uuid(),
  madrasah_id uuid references public.madrasah(id) on delete cascade,
  tanggal date not null default current_date,
  tahap text,
  komponen text,
  skor numeric check (skor between 0 and 100),
  catatan text,
  rekomendasi text,
  pengawas_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- =====================================================================
-- TABLE: eviden
-- =====================================================================
create table if not exists public.eviden (
  id uuid primary key default gen_random_uuid(),
  madrasah_id uuid references public.madrasah(id) on delete cascade,
  kategori text,
  judul text not null,
  deskripsi text,
  file_url text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  uploaded_at timestamptz default now()
);

-- =====================================================================
-- TABLE: laporan
-- =====================================================================
create table if not exists public.laporan (
  id uuid primary key default gen_random_uuid(),
  madrasah_id uuid references public.madrasah(id) on delete cascade,
  jenis_laporan text not null,
  periode text,
  isi_laporan text,
  skor_akhir numeric,
  rekomendasi_akhir text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- =====================================================================
-- TRIGGER: auto-create profile on auth signup
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(new.raw_user_meta_data->>'role','guru');
  v_admin_email text := 'subariyantoss3@gmail.com';
  v_status text := 'pending';
begin
  if new.email = v_admin_email then
    v_role := 'admin';
    v_status := 'active';
  end if;
  insert into public.profiles (user_id, email, nama, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nama', split_part(new.email,'@',1)),
    v_role,
    v_status
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- FUNCTION: redeem_activation_code
-- Atomic activation: validate + mark used + activate profile
-- =====================================================================
create or replace function public.redeem_activation_code(
  p_code text,
  p_role text,
  p_madrasah_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile_id uuid;
  v_code public.activation_codes;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'Tidak terautentikasi');
  end if;

  select id into v_profile_id from public.profiles where user_id = v_user_id;
  if v_profile_id is null then
    return jsonb_build_object('ok', false, 'error', 'Profil tidak ditemukan');
  end if;

  select * into v_code from public.activation_codes
  where code = p_code
  for update;

  if v_code.id is null then
    return jsonb_build_object('ok', false, 'error', 'Kode aktivasi tidak ditemukan');
  end if;

  if v_code.status <> 'unused' then
    return jsonb_build_object('ok', false, 'error', 'Kode sudah digunakan/expired/dibatalkan');
  end if;

  if v_code.expired_at is not null and v_code.expired_at < now() then
    update public.activation_codes set status = 'expired' where id = v_code.id;
    return jsonb_build_object('ok', false, 'error', 'Kode sudah kedaluwarsa');
  end if;

  if v_code.role <> p_role then
    return jsonb_build_object('ok', false, 'error', 'Role tidak sesuai dengan kode');
  end if;

  if v_code.madrasah_id is not null and v_code.madrasah_id <> p_madrasah_id then
    return jsonb_build_object('ok', false, 'error', 'Madrasah tidak sesuai dengan kode');
  end if;

  update public.activation_codes
    set status = 'used',
        used_by = v_profile_id,
        used_at = now()
  where id = v_code.id;

  update public.profiles
    set role = p_role,
        madrasah_id = coalesce(p_madrasah_id, madrasah_id),
        status = 'active',
        activation_code = p_code,
        updated_at = now()
  where id = v_profile_id;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.redeem_activation_code(text, text, uuid) to authenticated;

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.madrasah enable row level security;
alter table public.activation_codes enable row level security;
alter table public.tim_kbc enable row level security;
alter table public.diagnosis_kbc enable row level security;
alter table public.rencana_aksi enable row level security;
alter table public.pendampingan enable row level security;
alter table public.eviden enable row level security;
alter table public.laporan enable row level security;

-- Helper: is_admin
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create or replace function public.current_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where user_id = auth.uid();
$$;

create or replace function public.current_madrasah()
returns uuid language sql stable security definer set search_path = public as $$
  select madrasah_id from public.profiles where user_id = auth.uid();
$$;

-- profiles policies
drop policy if exists "profiles read self or admin" on public.profiles;
create policy "profiles read self or admin" on public.profiles
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "profiles update self or admin" on public.profiles;
create policy "profiles update self or admin" on public.profiles
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "profiles insert" on public.profiles;
create policy "profiles insert" on public.profiles
  for insert with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "profiles delete admin" on public.profiles;
create policy "profiles delete admin" on public.profiles
  for delete using (public.is_admin());

-- madrasah policies
drop policy if exists "madrasah read all auth" on public.madrasah;
create policy "madrasah read all auth" on public.madrasah
  for select using (auth.uid() is not null);

drop policy if exists "madrasah write admin" on public.madrasah;
create policy "madrasah write admin" on public.madrasah
  for all using (public.is_admin()) with check (public.is_admin());

-- activation_codes policies (admin only)
drop policy if exists "ac read admin" on public.activation_codes;
create policy "ac read admin" on public.activation_codes
  for select using (public.is_admin());

drop policy if exists "ac write admin" on public.activation_codes;
create policy "ac write admin" on public.activation_codes
  for all using (public.is_admin()) with check (public.is_admin());

-- tim_kbc, diagnosis_kbc, rencana_aksi, pendampingan, eviden, laporan
-- Read: all authenticated; write: admin/pengawas/kepala terkait
do $$
declare t text;
begin
  foreach t in array array['tim_kbc','diagnosis_kbc','rencana_aksi','pendampingan','eviden','laporan']
  loop
    execute format('drop policy if exists "%s read auth" on public.%I', t, t);
    execute format('create policy "%s read auth" on public.%I for select using (auth.uid() is not null)', t, t);

    execute format('drop policy if exists "%s insert role" on public.%I', t, t);
    execute format($P$create policy "%s insert role" on public.%I
      for insert with check (
        public.is_admin()
        or public.current_role() in ('pengawas','kepala_madrasah','guru')
      )$P$, t, t);

    execute format('drop policy if exists "%s update role" on public.%I', t, t);
    execute format($P$create policy "%s update role" on public.%I
      for update using (
        public.is_admin()
        or public.current_role() in ('pengawas','kepala_madrasah','guru')
      )$P$, t, t);

    execute format('drop policy if exists "%s delete admin" on public.%I', t, t);
    execute format('create policy "%s delete admin" on public.%I for delete using (public.is_admin() or public.current_role() = ''pengawas'')', t, t);
  end loop;
end $$;

-- =====================================================================
-- SEED: contoh madrasah
-- =====================================================================
insert into public.madrasah (nama_madrasah, jenjang, nsm, npsn, alamat, kepala_madrasah, status_piloting)
values
  ('MI Nurul Huda Sukowono', 'MI', '111235090001', '60718001', 'Sukowono, Jember', 'Drs. Hasan', 'aktif'),
  ('MTs Al-Ikhlas Kalisat', 'MTs', '121235090002', '20518002', 'Kalisat, Jember', 'H. Mahmud, M.Pd', 'aktif'),
  ('MA Darul Ulum Jember', 'MA', '131235090003', '20518003', 'Patrang, Jember', 'Drs. Sulaiman, M.Pd', 'aktif')
on conflict do nothing;
