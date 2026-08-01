create extension if not exists pgcrypto;

create table if not exists public.weekly_bulletins (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  service_date date not null,
  scripture_reference text not null,
  message_title text not null,
  column_content text not null,
  weekly_notice text,
  published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists weekly_bulletins_service_date_idx
  on public.weekly_bulletins (service_date desc);

create or replace function public.set_weekly_bulletins_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists weekly_bulletins_updated_at on public.weekly_bulletins;

create trigger weekly_bulletins_updated_at
before update on public.weekly_bulletins
for each row
execute function public.set_weekly_bulletins_updated_at();

alter table public.weekly_bulletins enable row level security;

drop policy if exists "Published bulletins are viewable by everyone"
  on public.weekly_bulletins;

create policy "Published bulletins are viewable by everyone"
on public.weekly_bulletins
for select
using (published = true);

-- If you already created the table with the old structure, run this once:
-- alter table public.weekly_bulletins rename column sermon_title to message_title;
-- alter table public.weekly_bulletins rename column pastoral_note to column_content;
