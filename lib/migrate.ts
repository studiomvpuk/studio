import { dbConfigured, query } from "./db";

// Full schema embedded (no file reads → works on any host). All statements are
// idempotent, so this is safe to run on every boot.
const SCHEMA = `
create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  role text not null default 'prospect' check (role in ('prospect','client','admin')),
  name text, email text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists magic_tokens (
  id uuid primary key default gen_random_uuid(),
  email text not null, token_hash text not null,
  expires_at timestamptz not null, used boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists magic_tokens_hash_idx on magic_tokens (token_hash);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text, email text not null, brief text, source text default 'website',
  status text not null default 'new' check (status in ('new','call_booked','proposal','signed','lost')),
  est_cents integer, created_at timestamptz not null default now()
);

create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete set null,
  client_email text not null, client_name text, title text not null, scope text,
  price_cents integer not null default 0,
  payment_plan text not null default 'deposit' check (payment_plan in ('full','deposit','milestones')),
  deposit_pct integer not null default 50,
  status text not null default 'draft' check (status in ('draft','sent','viewed','signed','declined')),
  token text unique not null, viewed_at timestamptz, created_at timestamptz not null default now()
);
create index if not exists proposals_token_idx on proposals (token);

create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals(id) on delete cascade, project_id uuid,
  signer_name text not null, signer_email text not null, signature text not null,
  signer_ip text, signer_agent text, signed_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references users(id) on delete set null,
  name text not null,
  status text not null default 'active' check (status in ('lead','signed','active','completed')),
  current_phase text not null default 'Discovery',
  total_cents integer not null default 0, deposit_pct integer not null default 50,
  gate_launch boolean not null default true, est_launch date,
  created_at timestamptz not null default now()
);

create table if not exists phases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  status text not null default 'upcoming' check (status in ('done','active','upcoming')),
  ord integer not null default 0
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  amount_cents integer not null,
  type text not null check (type in ('deposit','balance','full')),
  status text not null default 'due' check (status in ('draft','due','paid')),
  stripe_session_id text, stripe_payment_intent text,
  created_at timestamptz not null default now(), paid_at timestamptz
);

create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  item text not null,
  status text not null default 'pending' check (status in ('pending','approved','changes')),
  created_at timestamptz not null default now(), decided_at timestamptz
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  author text not null, body text not null, created_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  type text not null, payload jsonb, fired_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  label text not null,
  url text not null,
  created_at timestamptz not null default now()
);
create index if not exists documents_project_idx on documents (project_id);

create table if not exists payment_links (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  amount_cents integer not null,
  client_email text, client_name text,
  project_id uuid references projects(id) on delete set null,
  status text not null default 'open' check (status in ('open','paid','void')),
  token text unique not null,
  stripe_session_id text, stripe_payment_intent text,
  created_at timestamptz not null default now(), paid_at timestamptz
);
create index if not exists payment_links_token_idx on payment_links (token);
`;

// The admin account is created automatically. Override the email with ADMIN_EMAIL.
function adminSeed(): string {
  const email = (process.env.ADMIN_EMAIL || "officialstudiomvp@gmail.com").replace(/'/g, "''");
  return `insert into users (role, name, email) values ('admin', 'StudioMVP', '${email}')
          on conflict (email) do update set role = 'admin';`;
}

let ran: Promise<void> | null = null;

/** Create the schema + admin user once per process. Safe to call on every request. */
export function ensureSchema(): Promise<void> {
  if (!dbConfigured) return Promise.resolve();
  if (!ran) {
    ran = (async () => {
      await query(SCHEMA);
      await query(adminSeed());
      console.log("[migrate] schema ensured + admin seeded");
    })().catch((err) => {
      ran = null; // allow retry on next request
      console.error("[migrate] failed:", (err as Error).message);
      throw err;
    });
  }
  return ran;
}
