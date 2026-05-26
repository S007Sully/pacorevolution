update storage.buckets set public = true where id = 'event-images';
create policy "event images public read" on storage.objects for select using (bucket_id = 'event-images');