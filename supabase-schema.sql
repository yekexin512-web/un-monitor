create table if not exists public.user_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id text not null,
  status text not null default 'found',
  applied_at date,
  status_updated_at timestamptz,
  first_tracked_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, job_id)
);

alter table public.user_applications enable row level security;

drop policy if exists "Users can read own applications" on public.user_applications;
create policy "Users can read own applications"
on public.user_applications
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own applications" on public.user_applications;
create policy "Users can insert own applications"
on public.user_applications
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own applications" on public.user_applications;
create policy "Users can update own applications"
on public.user_applications
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own applications" on public.user_applications;
create policy "Users can delete own applications"
on public.user_applications
for delete
using (auth.uid() = user_id);
