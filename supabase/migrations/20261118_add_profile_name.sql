alter table church.profiles
  add column if not exists full_name text not null default '';
