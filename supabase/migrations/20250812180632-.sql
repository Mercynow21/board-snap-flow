-- Phase 2 — Supabase setup for Kanban board
-- Creates columns and cards tables, enables RLS with permissive policies,
-- sets FK cascade, and seeds default columns.

-- Ensure uuid generation is available
create extension if not exists pgcrypto;

-- Tables
create table if not exists public.columns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  position integer not null
);

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  column_id uuid not null references public.columns(id) on delete cascade,
  title text not null,
  position integer not null
);

-- Enable Row Level Security
alter table public.columns enable row level security;
alter table public.cards enable row level security;

-- Reset policies if they already exist (safe to re-run)
drop policy if exists "Enable read for all users" on public.columns;
drop policy if exists "Enable insert for all users" on public.columns;
drop policy if exists "Enable update for all users" on public.columns;
drop policy if exists "Enable delete for all users" on public.columns;

drop policy if exists "Enable read for all users" on public.cards;
drop policy if exists "Enable insert for all users" on public.cards;
drop policy if exists "Enable update for all users" on public.cards;
drop policy if exists "Enable delete for all users" on public.cards;

-- Permissive policies for a public app (no auth) — both anon and authenticated
create policy "Enable read for all users"
  on public.columns for select to public
  using (true);

create policy "Enable insert for all users"
  on public.columns for insert to public
  with check (true);

create policy "Enable update for all users"
  on public.columns for update to public
  using (true);

create policy "Enable delete for all users"
  on public.columns for delete to public
  using (true);

create policy "Enable read for all users"
  on public.cards for select to public
  using (true);

create policy "Enable insert for all users"
  on public.cards for insert to public
  with check (true);

create policy "Enable update for all users"
  on public.cards for update to public
  using (true);

create policy "Enable delete for all users"
  on public.cards for delete to public
  using (true);

-- Seed default columns only if empty
do $$
begin
  if not exists (select 1 from public.columns) then
    insert into public.columns (title, position)
    values ('To Do', 0), ('In Progress', 1), ('Done', 2);
  end if;
end
$$;