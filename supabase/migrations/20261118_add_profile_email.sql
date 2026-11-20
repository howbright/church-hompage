alter table church.profiles
  add column if not exists email text;

create unique index if not exists profiles_email_unique_idx
  on church.profiles (lower(email))
  where email is not null;
