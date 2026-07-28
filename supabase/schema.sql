-- Building Account Tracker — Supabase cloud store (Phase 1: whole-state sync)
--
-- Run this once in your Supabase project: Dashboard → SQL Editor → New query →
-- paste → Run. It creates the single table the app syncs its state to.
--
-- Phase 1 trust model: the app talks to Supabase with the *anon public* key,
-- which the owner shares only with tenants via the in-app access code. The
-- policies below let that key read/write this one table. Phase 2 will add real
-- Supabase Auth logins and per-tenant row-level security (so a tenant can read
-- only their own rows). The service_role key is NEVER used by the app.

create table if not exists public.building_state (
  id          text primary key,
  state       jsonb not null,
  rev         bigint not null default 0,
  updated_at  timestamptz not null default now()
);

alter table public.building_state enable row level security;

-- Table-level privileges. Newer Supabase projects do not auto-grant these to
-- the anon role, and PostgREST needs BOTH a grant and an RLS policy to allow a
-- request through.
grant select, insert, update on public.building_state to anon;

-- Allow the anon role (the app's public key) to read and upsert the state row.
drop policy if exists "anon read building_state"   on public.building_state;
drop policy if exists "anon insert building_state" on public.building_state;
drop policy if exists "anon update building_state" on public.building_state;

create policy "anon read building_state"
  on public.building_state for select to anon using (true);

create policy "anon insert building_state"
  on public.building_state for insert to anon with check (true);

create policy "anon update building_state"
  on public.building_state for update to anon using (true) with check (true);
