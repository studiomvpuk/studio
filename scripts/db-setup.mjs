// Run the schema + a small demo seed against your Railway Postgres.
//   1. Put DATABASE_URL in .env.local (or export it)
//   2. npm run db:setup
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

// load .env.local / .env if present (no dependency)
for (const f of [".env.local", ".env"]) {
  try {
    const txt = readFileSync(join(__dirname, "..", f), "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}

if (!process.env.DATABASE_URL) {
  console.error("✗ DATABASE_URL not set. Add it to .env.local first.");
  process.exit(1);
}

const ssl = process.env.DATABASE_URL.includes("rlwy.net") ? { rejectUnauthorized: false } : undefined;
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl });

const seed = `
insert into users (role, name, email) values
  ('admin', 'StudioMVP', 'officialstudiomvp@gmail.com'),
  ('client', 'Amara O.', 'amara@example.com')
on conflict (email) do nothing;

with c as (select id from users where email = 'amara@example.com')
insert into projects (client_id, name, status, current_phase, total_cents, deposit_pct, est_launch)
select c.id, 'NaijaEats — Food delivery app', 'active', 'Build', 800000, 50, date '2026-08-12'
from c
where not exists (select 1 from projects where name = 'NaijaEats — Food delivery app');

with p as (select id from projects where name = 'NaijaEats — Food delivery app' limit 1)
insert into phases (project_id, name, status, ord)
select p.id, v.name, v.status, v.ord from p,
  (values ('Discovery & brief','done',1),('Design','done',2),('Build','active',3),
          ('Testing & QA','upcoming',4),('Launch & handover','upcoming',5)) as v(name,status,ord)
where not exists (select 1 from phases ph where ph.project_id = p.id);

with p as (select id from projects where name = 'NaijaEats — Food delivery app' limit 1)
insert into invoices (project_id, amount_cents, type, status, paid_at)
select p.id, 400000, 'deposit', 'paid', now() from p
where not exists (select 1 from invoices i where i.project_id = p.id and i.type='deposit');

with p as (select id from projects where name = 'NaijaEats — Food delivery app' limit 1)
insert into invoices (project_id, amount_cents, type, status)
select p.id, 400000, 'balance', 'due' from p
where not exists (select 1 from invoices i where i.project_id = p.id and i.type='balance');

insert into leads (name, email, brief, status, est_cents) values
  ('QuickFix', 'hi@quickfix.app', 'Repairs marketplace app', 'new', 600000),
  ('Lumi', 'team@lumi.co', 'Skincare subscription', 'call_booked', 900000)
on conflict do nothing;
`;

try {
  await client.connect();
  const schema = readFileSync(join(__dirname, "..", "lib", "schema.sql"), "utf8");
  await client.query(schema);
  console.log("✓ schema applied");
  await client.query(seed);
  console.log("✓ demo data seeded");
  console.log("\nDemo logins (magic-link): officialstudiomvp@gmail.com · amara@example.com");
} catch (e) {
  console.error("✗ setup failed:", e.message);
  process.exit(1);
} finally {
  await client.end();
}
