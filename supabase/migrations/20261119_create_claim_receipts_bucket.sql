insert into storage.buckets (id, name, public)
values ('claim-receipts', 'claim-receipts', false)
on conflict (id) do nothing;

grant usage on schema storage to authenticated;
grant select, insert, delete on storage.objects to authenticated;

create policy "Members upload own claim receipts"
on storage.objects for insert to authenticated
with check (bucket_id = 'claim-receipts' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Members view own claim receipts"
on storage.objects for select to authenticated
using (bucket_id = 'claim-receipts' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Members delete own claim receipts"
on storage.objects for delete to authenticated
using (bucket_id = 'claim-receipts' and (storage.foldername(name))[1] = auth.uid()::text);
