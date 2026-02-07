-- Calorie Tracker schema (run in Supabase SQL editor)

-- Enable UUIDs
create extension if not exists "pgcrypto";

-- Food entries
create table if not exists public.food_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  occurred_on date not null,
  name text not null,
  calories integer not null check (calories >= 0),
  barcode text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists food_entries_user_date_idx
  on public.food_entries(user_id, occurred_on);

-- Keep updated_at current
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists food_entries_set_updated_at on public.food_entries;
create trigger food_entries_set_updated_at
before update on public.food_entries
for each row execute procedure public.set_updated_at();

-- RLS
alter table public.food_entries enable row level security;

-- Policies: users can CRUD their own rows

drop policy if exists "select own entries" on public.food_entries;
create policy "select own entries"
  on public.food_entries for select
  using (auth.uid() = user_id);

drop policy if exists "insert own entries" on public.food_entries;
create policy "insert own entries"
  on public.food_entries for insert
  with check (auth.uid() = user_id);

drop policy if exists "update own entries" on public.food_entries;
create policy "update own entries"
  on public.food_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "delete own entries" on public.food_entries;
create policy "delete own entries"
  on public.food_entries for delete
  using (auth.uid() = user_id);
