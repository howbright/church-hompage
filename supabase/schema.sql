create extension if not exists pgcrypto;

create table if not exists public.weekly_bulletins (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  service_date date not null,
  scripture_reference text not null,
  message_title text not null,
  column_content text not null,
  column_content_rich jsonb,
  weekly_notice text,
  published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.weekly_bulletins
  add column if not exists column_content_rich jsonb;

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

do $$
begin
  create type public.gallery_visibility as enum ('public', 'members', 'private');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.gallery_entries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date not null,
  date_label text,
  visibility public.gallery_visibility not null default 'members',
  contains_minors boolean not null default false,
  consent_confirmed boolean not null default false,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.gallery_entries(id) on delete cascade,
  storage_path text not null unique,
  sort_order integer not null default 0,
  alt_text text,
  caption text,
  width integer not null,
  height integer not null,
  mime_type text not null,
  file_size integer not null,
  created_at timestamptz not null default now()
);

create index if not exists gallery_entries_event_date_idx
  on public.gallery_entries (event_date desc, published_at desc);

create index if not exists gallery_photos_entry_order_idx
  on public.gallery_photos (entry_id, sort_order);

drop trigger if exists gallery_entries_updated_at on public.gallery_entries;

create trigger gallery_entries_updated_at
before update on public.gallery_entries
for each row
execute function public.set_weekly_bulletins_updated_at();

alter table public.gallery_entries enable row level security;
alter table public.gallery_photos enable row level security;

drop policy if exists "Public gallery entries are viewable by everyone"
  on public.gallery_entries;

create policy "Public gallery entries are viewable by everyone"
on public.gallery_entries
for select
using (visibility = 'public');

drop policy if exists "Public gallery photos are viewable by everyone"
  on public.gallery_photos;

create policy "Public gallery photos are viewable by everyone"
on public.gallery_photos
for select
using (
  exists (
    select 1
    from public.gallery_entries
    where gallery_entries.id = gallery_photos.entry_id
      and gallery_entries.visibility = 'public'
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gallery-media',
  'gallery-media',
  false,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.bible_college_content (
  id text primary key default 'main' check (id = 'main'),
  introduction text not null default '',
  semester_name text not null default '',
  curriculum jsonb not null default '[]'::jsonb check (jsonb_typeof(curriculum) = 'array'),
  instructors jsonb not null default '[]'::jsonb check (jsonb_typeof(instructors) = 'array'),
  student_photo_path text,
  student_photo_alt text,
  student_photo_caption text,
  notices jsonb not null default '[]'::jsonb check (jsonb_typeof(notices) = 'array'),
  calendar_events jsonb not null default '[]'::jsonb check (jsonb_typeof(calendar_events) = 'array'),
  inquiry_email text not null default 'mosesnara@hanmail.net',
  address text not null default '서울 송파구 중대로 245, 3층',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.bible_college_content (
  id,
  introduction,
  semester_name
)
values (
  'main',
  '갈보리채플 성경대학교는 척 스미스 목사의 말씀 중심 목회 철학을 따라 성경 전체를 장별·절별로 체계적으로 배우고 가르칩니다. 창세기부터 요한계시록까지 본문의 흐름과 의미를 살피며, 하나님의 말씀을 삶 속에서 이해하고 실천하도록 돕습니다.',
  '2026년 9월학기'
)
on conflict (id) do nothing;

drop trigger if exists bible_college_content_updated_at
  on public.bible_college_content;

create trigger bible_college_content_updated_at
before update on public.bible_college_content
for each row
execute function public.set_weekly_bulletins_updated_at();

alter table public.bible_college_content enable row level security;

drop policy if exists "Bible college content is viewable by everyone"
  on public.bible_college_content;

create policy "Bible college content is viewable by everyone"
on public.bible_college_content
for select
using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bible-college-media',
  'bible-college-media',
  false,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
