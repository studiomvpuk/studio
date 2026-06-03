#!/usr/bin/env node
/**
 * Sync project images to Cloudflare R2 (S3-compatible API).
 *
 * Uploads two sets of objects to your bucket:
 *   1. Stock images from scripts/image-manifest.json (downloaded from source).
 *   2. Any self-hosted screenshots you drop under public/work/** .
 * Both use the same object key the app expects, so the site resolves them
 * from R2 in production.
 *
 * Credentials are read from the environment (or .env.local) — never hardcoded:
 *   S3_BUCKET_NAME         your R2 bucket name
 *   S3_ENDPOINT            https://<account-id>.r2.cloudflarestorage.com
 *   AWS_ACCESS_KEY_ID      R2 access key id
 *   AWS_SECRET_ACCESS_KEY  R2 secret access key
 *   AWS_REGION             optional (defaults to "auto" for R2)
 *   S3_PUBLIC_URL          the bucket's public URL (used by the app, not here)
 *
 * Usage:
 *   node scripts/sync-images-to-r2.mjs              upload everything (skips objects already present)
 *   node scripts/sync-images-to-r2.mjs --force      re-upload even if the object exists
 *   node scripts/sync-images-to-r2.mjs --dry-run    list what would be uploaded, no network/creds
 *
 * Requires: npm install  (adds @aws-sdk/client-s3)
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, sep } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PUBLIC_DIR = join(ROOT, "public");

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const FORCE = args.has("--force");
const CONCURRENCY = 6;

// ── Load .env.local into process.env (only keys not already set) ─────────────
function loadEnvLocal() {
  const file = join(ROOT, ".env.local");
  if (!existsSync(file)) return;
  for (const raw of readFileSync(file, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}
loadEnvLocal();

// ── Content type from extension ──────────────────────────────────────────────
const contentTypeFor = (key) => {
  const ext = key.slice(key.lastIndexOf(".") + 1).toLowerCase();
  return ext === "png" ? "image/png"
    : ext === "webp" ? "image/webp"
    : ext === "avif" ? "image/avif"
    : "image/jpeg";
};

// ── Collect self-hosted screenshots under public/work ────────────────────────
function collectLocal() {
  const dir = join(PUBLIC_DIR, "work");
  if (!existsSync(dir)) return [];
  const out = [];
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      if (name === ".gitkeep" || name.toLowerCase() === "readme.md") continue;
      const full = join(d, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(jpe?g|png|webp|avif)$/i.test(name)) {
        const key = relative(PUBLIC_DIR, full).split(sep).join("/"); // e.g. work/<slug>/hero.jpg
        out.push({ key, file: full });
      }
    }
  };
  walk(dir);
  return out;
}

// ── Build the upload set (local screenshots override stock images by key) ────
const manifest = JSON.parse(readFileSync(join(__dirname, "image-manifest.json"), "utf8"));
const localItems = collectLocal();
const byKey = new Map();
for (const it of manifest) byKey.set(it.key, it);
for (const it of localItems) byKey.set(it.key, it); // a real screenshot wins
const items = [...byKey.values()];
console.log(
  `Stock images: ${manifest.length} · local screenshots: ${localItems.length} · total objects: ${items.length}`
);

if (DRY_RUN) {
  for (const it of items) console.log(`  ${it.key}  ←  ${it.file ? "public/" + it.key : it.src}`);
  console.log(`\nDry run only. ${items.length} objects would be uploaded.`);
  process.exit(0);
}

// ── Validate credentials ─────────────────────────────────────────────────────
const { S3_BUCKET_NAME, S3_ENDPOINT, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;
const AWS_REGION = process.env.AWS_REGION || "auto";
const missing = [];
if (!S3_BUCKET_NAME) missing.push("S3_BUCKET_NAME");
if (!S3_ENDPOINT) missing.push("S3_ENDPOINT");
if (!AWS_ACCESS_KEY_ID) missing.push("AWS_ACCESS_KEY_ID");
if (!AWS_SECRET_ACCESS_KEY) missing.push("AWS_SECRET_ACCESS_KEY");
if (missing.length) {
  console.error(`\nMissing required env vars: ${missing.join(", ")}`);
  console.error("Set them in .env.local or export them, then re-run.");
  process.exit(1);
}

// ── S3 client (lazy import so --dry-run needs no dependency) ─────────────────
let S3Client, PutObjectCommand, HeadObjectCommand;
try {
  ({ S3Client, PutObjectCommand, HeadObjectCommand } = await import("@aws-sdk/client-s3"));
} catch {
  console.error("\n@aws-sdk/client-s3 is not installed. Run:  npm install");
  process.exit(1);
}

const s3 = new S3Client({
  region: AWS_REGION,
  endpoint: S3_ENDPOINT,
  credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY },
});

async function exists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadOne(item) {
  const { key } = item;
  if (!FORCE && (await exists(key))) return { key, status: "skipped" };
  let body;
  if (item.file) {
    body = readFileSync(item.file);
  } else {
    const res = await fetch(item.src);
    if (!res.ok) throw new Error(`download ${res.status} for ${item.src}`);
    body = Buffer.from(await res.arrayBuffer());
  }
  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentTypeFor(key),
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  return { key, status: "uploaded", bytes: body.length };
}

// ── Run with bounded concurrency ─────────────────────────────────────────────
let uploaded = 0, skipped = 0, failed = 0;
const queue = [...items];

async function worker() {
  while (queue.length) {
    const item = queue.shift();
    try {
      const r = await uploadOne(item);
      if (r.status === "uploaded") {
        uploaded++;
        console.log(`✓ uploaded  ${r.key}  (${(r.bytes / 1024).toFixed(0)} KB)`);
      } else {
        skipped++;
        console.log(`• skipped   ${r.key} (already present)`);
      }
    } catch (e) {
      failed++;
      console.error(`✗ failed    ${item.key}: ${e.message}`);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

console.log(`\nDone. uploaded=${uploaded} skipped=${skipped} failed=${failed}`);
console.log(
  `Public base: ${process.env.S3_PUBLIC_URL || "(set S3_PUBLIC_URL / NEXT_PUBLIC_ASSET_BASE_URL)"}`
);
process.exit(failed ? 1 : 0);
