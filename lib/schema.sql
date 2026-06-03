-- StudioMVP Client Portal — core schema (Postgres / Railway)
create extension if not exists pgcrypto;

create table if not exists users (
  id          uuid primary key default gen_random_uuid(),
  role        text not null default 'prospect' check (role in ('prospect','client','admin')),
  name        text,
  email       text unique not null,
  created_at  timestamptz not null default now()
);

create table if not exists magic_tokens (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  token_hash  text not null,
  expires_at  timestamptz not null,
  used        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists magic_tokens_hash_idx on magic_tokens (token_hash);

create table if not exists leads (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  email       text not null,
  brief       text,
  source      text default 'website',
  status      text not null default 'new' check (status in ('new','call_booked','proposal','signed','lost')),
  est_cents   integer,
  created_at  timestamptz not null default now()
);

create table if not exists projects (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid references users(id) on delete set null,
  name          text not null,
  status        text not null default 'active' check (status in ('lead','signed','active','completed')),
  current_phase text not null default 'Discovery',
  total_cents   integer not null default 0,
  deposit_pct   integer not null default 50,
  gate_launch   boolean not null default true,
  est_launch    date,
  created_at    timestamptz not null default now()
);

create table if not exists phases (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  name        text not null,
  status      text not null default 'upcoming' check (status in ('done','active','upcoming')),
  ord         integer not null default 0
);

create table if not exists invoices (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references projects(id) on delete cascade,
  amount_cents  integer not null,
  type          text not null check (type in ('deposit','balance','full')),
  status        text not null default 'due' check (status in ('draft','due','paid')),
  stripe_session_id text,
  stripe_payment_intent text,
  created_at    timestamptz not null default now(),
  paid_at       timestamptz
);

create table if not exists approvals (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  item        text not null,
  status      text not null default 'pending' check (status in ('pending','approved','changes')),
  created_at  timestamptz not null default now(),
  decided_at  timestamptz
);

create table if not exists messages (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  author      text not null,
  body        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists events (
  id        uuid primary key default gen_random_uuid(),
  type      text not null,
  payload   jsonb,
  fired_at  timestamptz not null default now()
);
