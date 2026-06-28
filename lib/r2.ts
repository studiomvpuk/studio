import { AwsClient } from "aws4fetch";

/**
 * Cloudflare R2 (S3-compatible) blob store for user uploads (task / comment images).
 * Objects are private — they're served back through our authenticated route.
 *
 * Accepts either naming scheme so it works with the existing S3/AWS variables
 * already set in the environment, or dedicated R2_* names:
 *   endpoint : S3_ENDPOINT            | https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com
 *   bucket   : S3_BUCKET_NAME         | R2_BUCKET
 *   key id   : AWS_ACCESS_KEY_ID      | R2_ACCESS_KEY_ID
 *   secret   : AWS_SECRET_ACCESS_KEY  | R2_SECRET_ACCESS_KEY
 *   region   : AWS_REGION             | (defaults to "auto")
 */
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || "";
const bucket = process.env.S3_BUCKET_NAME || process.env.R2_BUCKET || "";
const region = process.env.AWS_REGION || "auto";

// Account-level endpoint (no bucket), e.g. https://<acct>.r2.cloudflarestorage.com
const endpoint = (
  process.env.S3_ENDPOINT ||
  (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : "")
).replace(/\/+$/, "");

export const r2Configured = Boolean(endpoint && bucket && accessKeyId && secretAccessKey);

// Names of any missing pieces — for a clear log line, never the values.
export function r2MissingVars(): string[] {
  const out: string[] = [];
  if (!endpoint) out.push("S3_ENDPOINT (or R2_ACCOUNT_ID)");
  if (!bucket) out.push("S3_BUCKET_NAME (or R2_BUCKET)");
  if (!accessKeyId) out.push("AWS_ACCESS_KEY_ID (or R2_ACCESS_KEY_ID)");
  if (!secretAccessKey) out.push("AWS_SECRET_ACCESS_KEY (or R2_SECRET_ACCESS_KEY)");
  return out;
}

let client: AwsClient | null = null;
function getClient(): AwsClient {
  if (!client) client = new AwsClient({ accessKeyId, secretAccessKey, region, service: "s3" });
  return client;
}

// Path-style object URL. Guards against an endpoint that already includes the bucket.
const objectBase = endpoint.endsWith(`/${bucket}`) ? endpoint : `${endpoint}/${bucket}`;
const objectUrl = (key: string) =>
  `${objectBase}/${encodeURIComponent(key).replace(/%2F/g, "/")}`;

export async function r2Put(key: string, body: Uint8Array | Buffer, mime: string): Promise<void> {
  // Copy into a plain Uint8Array (fetch BodyInit doesn't accept a Node Buffer type).
  const bytes = new Uint8Array(body);
  const res = await getClient().fetch(objectUrl(key), {
    method: "PUT",
    body: bytes,
    headers: { "Content-Type": mime, "Content-Length": String(bytes.byteLength) },
  });
  if (!res.ok) throw new Error(`R2 put failed (${res.status}): ${await res.text().catch(() => "")}`);
}

/** Returns the raw fetch Response (stream the body straight to the client). */
export async function r2Get(key: string): Promise<Response> {
  return getClient().fetch(objectUrl(key), { method: "GET" });
}

export async function r2Delete(key: string): Promise<void> {
  await getClient().fetch(objectUrl(key), { method: "DELETE" }).catch(() => {});
}
