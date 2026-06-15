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

create table if not exists proposals (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid references leads(id) on delete set null,
  client_email  text not null,
  client_name   text,
  title         text not null,
  scope         text,
  price_cents   integer not null default 0,
  payment_plan  text not null default 'deposit' check (payment_plan in ('full','deposit','milestones')),
  deposit_pct   integer not null default 50,
  status        text not null default 'draft' check (status in ('draft','sent','viewed','signed','declined')),
  token         text unique not null,
  viewed_at     timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists proposals_token_idx on proposals (token);

create table if not exists contracts (
  id            uuid primary key default gen_random_uuid(),
  proposal_id   uuid not null references proposals(id) on delete cascade,
  project_id    uuid,
  signer_name   text not null,
  signer_email  text not null,
  signature     text not null,
  signer_ip     text,
  signer_agent  text,
  signed_at     timestamptz not null default now()
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

create table if not exists documents (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  label       text not null,
  url         text not null,
  created_at  timestamptz not null default now()
);
create index if not exists documents_project_idx on documents (project_id);

create table if not exists payment_links (
  id            uuid primary key default gen_random_uuid(),
  description   text not null,
  amount_cents  integer not null,
  client_email  text,
  client_name   text,
  project_id    uuid references projects(id) on delete set null,
  status        text not null default 'open' check (status in ('open','paid','void')),
  token         text unique not null,
  stripe_session_id text,
  stripe_payment_intent text,
  created_at    timestamptz not null default now(),
  paid_at       timestamptz
);
create index if not exists payment_links_token_idx on payment_links (token);

create table if not exists retainers (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid references projects(id) on delete set null,
  client_id     uuid references users(id) on delete set null,
  title         text not null default 'Ongoing retainer',
  amount_cents  integer not null,
  period        text not null default 'monthly' check (period in ('monthly','quarterly','halfyearly','yearly')),
  status        text not null default 'active' check (status in ('active','paused','ended')),
  next_due      date,
  task_allowance integer not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists retainers_client_idx on retainers (client_id);

create table if not exists retainer_payments (
  id            uuid primary key default gen_random_uuid(),
  retainer_id   uuid not null references retainers(id) on delete cascade,
  amount_cents  integer not null,
  period_label  text,
  stripe_payment_intent text,
  paid_at       timestamptz not null default now()
);

create table if not exists project_tasks (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid references projects(id) on delete cascade,
  retainer_id   uuid references retainers(id) on delete cascade,
  title         text not null,
  detail        text,
  status        text not null default 'pending' check (status in ('pending','in_progress','done','confirmed')),
  created_by    text not null default 'client' check (created_by in ('client','admin')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists project_tasks_project_idx on project_tasks (project_id);
create index if not exists project_tasks_retainer_idx on project_tasks (retainer_id);

create table if not exists task_comments (
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid not null references project_tasks(id) on delete cascade,
  author        text not null check (author in ('client','admin')),
  body          text not null,
  created_at    timestamptz not null default now()
);
create index if not exists task_comments_task_idx on task_comments (task_id);

create table if not exists task_attachments (
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid references project_tasks(id) on delete cascade,
  comment_id    uuid references task_comments(id) on delete cascade,
  mime          text not null,
  r2_key        text not null,
  created_at    timestamptz not null default now()
);
create index if not exists task_attachments_task_idx on task_attachments (task_id);
create index if not exists task_attachments_comment_idx on task_attachments (comment_id);
