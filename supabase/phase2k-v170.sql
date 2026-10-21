-- Phase 2k — v170
--
--   * tenants can see the invoice photos the concierge took (concierge/<year>/…),
--     like every other expense invoice; meter and problem photos the concierge
--     took stay hidden from tenants
--
-- Run in: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Needs phase2a–2j.

drop policy if exists "member read invoices" on storage.objects;
create policy "member read invoices"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'invoices'
    and (
      public.is_owner()
      or public.is_viewer()
      or (public.is_concierge() and (name like 'concierge/%' or name like 'issues/%'))
      or (
        public.my_tenant_id() is not null
        and (
          (name not like 'proofs/%' and name not like 'issues/%' and name not like 'documents/%' and name not like 'concierge/%')
          or name ~ '^concierge/[0-9]{4}/'
          or name like 'proofs/' || public.my_tenant_id() || '/%'
          or name like 'issues/' || public.my_tenant_id() || '/%'
          or name like 'issues/building/%'
        )
      )
    )
  );
