create table if not exists sessions (
  id text primary key,
  account_id text not null,
  name text not null,
  avatar text,
  cloud_id text not null,
  site_url text not null,
  access_token text not null,
  refresh_token text not null,
  expires_at bigint not null,
  created_at timestamptz not null default now()
);

create index if not exists sessions_account_idx on sessions(account_id);

create table if not exists user_prefs (
  account_id text primary key,
  show_team boolean not null default false,
  default_project text,
  updated_at timestamptz not null default now()
);
