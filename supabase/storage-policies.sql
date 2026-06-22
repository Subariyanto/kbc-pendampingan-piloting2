-- Storage policies for `eviden` bucket
-- Run after creating the bucket "eviden" (public: ON)

-- Allow authenticated users to upload
drop policy if exists "eviden upload auth" on storage.objects;
create policy "eviden upload auth" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'eviden');

-- Allow public read (since bucket is public)
drop policy if exists "eviden read public" on storage.objects;
create policy "eviden read public" on storage.objects
  for select using (bucket_id = 'eviden');

-- Allow uploader or admin to delete
drop policy if exists "eviden delete owner" on storage.objects;
create policy "eviden delete owner" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'eviden'
    and (owner = auth.uid() or public.is_admin())
  );
