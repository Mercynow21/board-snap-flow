-- 1) Create projects table with owner-based access and support for a public demo project
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  title text not null default 'Untitled Project',
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;

-- Clean up any previous policies (idempotent)
drop policy if exists "Public projects are readable" on public.projects;
drop policy if exists "Project owners can read" on public.projects;
drop policy if exists "Project owners can insert" on public.projects;
drop policy if exists "Project owners can update" on public.projects;
drop policy if exists "Project owners can delete" on public.projects;

-- RLS for projects
create policy "Public projects are readable"
  on public.projects
  for select
  using (is_public = true);

create policy "Project owners can read"
  on public.projects
  for select
  to authenticated
  using (auth.uid() = owner_id);

create policy "Project owners can insert"
  on public.projects
  for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy "Project owners can update"
  on public.projects
  for update
  to authenticated
  using (auth.uid() = owner_id);

create policy "Project owners can delete"
  on public.projects
  for delete
  to authenticated
  using (auth.uid() = owner_id);

-- 2) Seed a stable Public Demo project so existing UI keeps working
insert into public.projects (id, title, is_public, owner_id)
values ('00000000-0000-0000-0000-000000000001', 'Public Demo', true, null)
on conflict (id) do nothing;

-- 3) Add project_id to existing tables; default to the Public Demo to avoid breaking existing writes
alter table public.columns
  add column if not exists project_id uuid not null default '00000000-0000-0000-0000-000000000001'
  references public.projects(id) on delete cascade;

alter table public.cards
  add column if not exists project_id uuid not null default '00000000-0000-0000-0000-000000000001'
  references public.projects(id) on delete cascade;

-- 4) Replace permissive RLS policies on columns and cards with project-scoped ones
alter table public.columns enable row level security;
alter table public.cards enable row level security;

-- Drop permissive policies if they exist
-- columns
drop policy if exists "Enable read for all users" on public.columns;
drop policy if exists "Enable insert for all users" on public.columns;
drop policy if exists "Enable update for all users" on public.columns;
drop policy if exists "Enable delete for all users" on public.columns;

-- cards
drop policy if exists "Enable read for all users" on public.cards;
drop policy if exists "Enable insert for all users" on public.cards;
drop policy if exists "Enable update for all users" on public.cards;
drop policy if exists "Enable delete for all users" on public.cards;

-- New secure policies: rows are readable if their project is public or owned by the user
create policy "Read columns in public or owned projects"
  on public.columns
  for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = public.columns.project_id
        and (p.is_public = true or p.owner_id = auth.uid())
    )
  );

create policy "Insert columns into public or owned projects"
  on public.columns
  for insert
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.is_public = true or p.owner_id = auth.uid())
    )
  );

create policy "Update columns in owned projects or public demo"
  on public.columns
  for update
  using (
    exists (
      select 1 from public.projects p
      where p.id = public.columns.project_id
        and (p.is_public = true or p.owner_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.is_public = true or p.owner_id = auth.uid())
    )
  );

create policy "Delete columns in owned projects or public demo"
  on public.columns
  for delete
  using (
    exists (
      select 1 from public.projects p
      where p.id = public.columns.project_id
        and (p.is_public = true or p.owner_id = auth.uid())
    )
  );

-- Cards
create policy "Read cards in public or owned projects"
  on public.cards
  for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = public.cards.project_id
        and (p.is_public = true or p.owner_id = auth.uid())
    )
  );

create policy "Insert cards into public or owned projects"
  on public.cards
  for insert
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.is_public = true or p.owner_id = auth.uid())
    )
  );

create policy "Update cards in owned projects or public demo"
  on public.cards
  for update
  using (
    exists (
      select 1 from public.projects p
      where p.id = public.cards.project_id
        and (p.is_public = true or p.owner_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.is_public = true or p.owner_id = auth.uid())
    )
  );

create policy "Delete cards in owned projects or public demo"
  on public.cards
  for delete
  using (
    exists (
      select 1 from public.projects p
      where p.id = public.cards.project_id
        and (p.is_public = true or p.owner_id = auth.uid())
    )
  );