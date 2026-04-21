-- Storage policies (template)
-- Run after `schema.sql` and `rls.sql`.

-- Bucket: product-images
-- Ensure the bucket exists in Supabase dashboard:
--   Storage -> product-images

alter table storage.objects enable row level security;

create policy "product_images_public_read"
on storage.objects
for select
using (bucket_id = 'product-images');

create policy "product_images_admin_insert"
on storage.objects
for insert
with check (bucket_id = 'product-images' and public.is_admin());

create policy "product_images_admin_update"
on storage.objects
for update
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

create policy "product_images_admin_delete"
on storage.objects
for delete
using (bucket_id = 'product-images' and public.is_admin());

