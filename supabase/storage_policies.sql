-- LarvaLens Private Storage Buckets and Policies
-- Source of Truth: 05_BACKEND_SCHEMA.md

-- 1. Create Private Buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values 
  ('scan-videos', 'scan-videos', false, 83886080, array['video/mp4', 'video/webm', 'video/quicktime']),
  ('scan-evidence', 'scan-evidence', false, 52428800, array['video/mp4', 'image/jpeg', 'image/png'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2. Storage Policies (Idempotent with DROP POLICY IF EXISTS)

-- Videos: Read own or reviewer/admin
drop policy if exists "Read own or reviewer video" on storage.objects;
create policy "Read own or reviewer video"
on storage.objects for select to authenticated
using (
  bucket_id = 'scan-videos'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.has_review_role()
  )
);

-- Videos: Upload own video
drop policy if exists "Allow authenticated upload scan videos" on storage.objects;
create policy "Allow authenticated upload scan videos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'scan-videos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Evidence: Read own or reviewer/admin
drop policy if exists "Read own or reviewer evidence" on storage.objects;
create policy "Read own or reviewer evidence"
on storage.objects for select to authenticated
using (
  bucket_id = 'scan-evidence'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.has_review_role()
  )
);

-- Evidence: Service role / Reviewer upload evidence
drop policy if exists "Allow authenticated upload scan evidence" on storage.objects;
create policy "Allow authenticated upload scan evidence"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'scan-evidence'
);
