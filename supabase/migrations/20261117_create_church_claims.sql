-- Church claims foundation. Run this migration once after the church schema exists.
create schema if not exists church;

do $$
begin
  create type church.member_role as enum ('member', 'accountant', 'admin');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type church.claim_status as enum ('draft', 'submitted', 'under_review', 'needs_revision', 'approved', 'paid', 'rejected', 'cancelled');
exception when duplicate_object then null;
end $$;

create table if not exists church.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role church.member_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists church.payout_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references church.profiles(id) on delete cascade,
  bank_name text not null,
  account_number text not null,
  account_holder_name text not null,
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists payout_accounts_primary_user_idx on church.payout_accounts (user_id) where is_primary = true;

create table if not exists church.claims (
  id uuid primary key default gen_random_uuid(),
  claim_number text not null unique,
  user_id uuid not null references church.profiles(id),
  category text not null,
  amount numeric(12,2) not null check (amount >= 0),
  used_at date,
  description text not null default '',
  accounting_note text not null default '',
  status church.claim_status not null default 'draft',
  submitted_at timestamptz,
  reviewed_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists claims_user_created_idx on church.claims (user_id, created_at desc);
create index if not exists claims_status_created_idx on church.claims (status, created_at desc);

create table if not exists church.claim_receipts (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references church.claims(id) on delete cascade,
  storage_path text not null unique,
  original_file_name text not null,
  mime_type text not null,
  file_size integer not null check (file_size > 0),
  created_at timestamptz not null default now()
);

create table if not exists church.claim_payments (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null unique references church.claims(id),
  paid_amount numeric(12,2) not null check (paid_amount >= 0),
  paid_at timestamptz not null default now(),
  payment_method text,
  payment_reference text,
  note text not null default '',
  paid_by uuid not null references church.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists church.claim_status_history (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references church.claims(id) on delete cascade,
  from_status church.claim_status,
  to_status church.claim_status not null,
  changed_by uuid not null references church.profiles(id),
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists church.claim_audit_logs (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references church.claims(id) on delete cascade,
  changed_by uuid not null references church.profiles(id),
  action text not null,
  field_name text,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create index if not exists claim_receipts_claim_idx on church.claim_receipts (claim_id, created_at);
create index if not exists claim_status_history_claim_idx on church.claim_status_history (claim_id, created_at);
create index if not exists claim_audit_logs_claim_idx on church.claim_audit_logs (claim_id, created_at desc);

create or replace function church.prevent_paid_claim_mutation() returns trigger language plpgsql as $$
begin
  if old.status = 'paid' then raise exception 'Paid claims are locked and cannot be modified'; end if;
  return new;
end;
$$;

drop trigger if exists claims_paid_lock on church.claims;
create trigger claims_paid_lock before update on church.claims for each row execute function church.prevent_paid_claim_mutation();

create or replace function church.prevent_paid_receipt_delete() returns trigger language plpgsql as $$
begin
  if exists (select 1 from church.claims where id = old.claim_id and status = 'paid') then raise exception 'Receipts for paid claims are locked'; end if;
  return old;
end;
$$;

drop trigger if exists claim_receipts_paid_lock on church.claim_receipts;
create trigger claim_receipts_paid_lock before delete on church.claim_receipts for each row execute function church.prevent_paid_receipt_delete();

grant usage on schema church to authenticated;
grant select, insert on church.profiles to authenticated;
grant select, insert, update on church.payout_accounts to authenticated;
grant select, insert, update, delete on church.claims to authenticated;
grant select, insert, update on church.claim_receipts to authenticated;
grant select, insert on church.claim_payments to authenticated;
grant select, insert on church.claim_status_history to authenticated;
grant select, insert on church.claim_audit_logs to authenticated;

alter table church.profiles enable row level security;
alter table church.payout_accounts enable row level security;
alter table church.claims enable row level security;
alter table church.claim_receipts enable row level security;
alter table church.claim_payments enable row level security;
alter table church.claim_status_history enable row level security;
alter table church.claim_audit_logs enable row level security;

drop policy if exists "Members can view their own role" on church.profiles;
create policy "Members can view their own role" on church.profiles for select to authenticated using (id = auth.uid());
drop policy if exists "Members can create their own profile" on church.profiles;
create policy "Members can create their own profile" on church.profiles for insert to authenticated with check (id = auth.uid() and role = 'member');

drop policy if exists "Members manage their own payout account" on church.payout_accounts;
create policy "Members manage their own payout account" on church.payout_accounts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "Members view and create their own claims" on church.claims;
create policy "Members view and create their own claims" on church.claims for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "Members access their own receipts" on church.claim_receipts;
create policy "Members access their own receipts" on church.claim_receipts for all to authenticated using (exists (select 1 from church.claims c where c.id = claim_id and c.user_id = auth.uid())) with check (exists (select 1 from church.claims c where c.id = claim_id and c.user_id = auth.uid()));
drop policy if exists "Members view their own payment" on church.claim_payments;
create policy "Members view their own payment" on church.claim_payments for select to authenticated using (exists (select 1 from church.claims c where c.id = claim_id and c.user_id = auth.uid()));
drop policy if exists "Members view their own claim history" on church.claim_status_history;
create policy "Members view their own claim history" on church.claim_status_history for select to authenticated using (exists (select 1 from church.claims c where c.id = claim_id and c.user_id = auth.uid()));
drop policy if exists "Members view their own audit history" on church.claim_audit_logs;
create policy "Members view their own audit history" on church.claim_audit_logs for select to authenticated using (exists (select 1 from church.claims c where c.id = claim_id and c.user_id = auth.uid()));
