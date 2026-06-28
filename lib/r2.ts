import { AwsClient } from "aws4fetch";

/**
 * Cloudflare R2 (S3-compatible) blob store for user uploads (task / comment images).
 * Configure with: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET.
 * Objects are private — they're served back through our authenticated route.
 */
const accountId = process.env.R2_ACCOUNT_ID || "";
const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
const bucket = process.env.R2_BUCKET || "";

export const r2Configured = Boolean(accountId && accessKeyId && secretAccessKey && bucket);

// Names of any R2 vars that are missing — for a clear log line, never the values.
export function r2MissingVars(): string[] {
  return [
    ["R2_ACCOUNT_ID", accountId],
    ["R2_ACCESS_KEY_ID", accessKeyId],
    ["R2_SECRET_ACCESS_KEY", secretAccessKey],
    ["R2_BUCKET", bucket],
  ].filter(([, v]) => !v).map(([k]) => k);
}

let client: AwsClient | null = null;
function getClient(): AwsClient {
  if (!client) client = new AwsClient({ accessKeyId, secretAccessKey, region: "auto", service: "s3" });
  return client;
}

const objectUrl = (key: string) =>
  `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${encodeURIComponent(key).replace(/%2F/g, "/")}`;

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
