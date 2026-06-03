import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __mvpPool: Pool | undefined;
}

export const dbConfigured = Boolean(process.env.DATABASE_URL);

function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!global.__mvpPool) {
    global.__mvpPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Railway external connections use TLS; allow self-signed in dev.
      ssl: process.env.DATABASE_URL.includes("rlwy.net") || process.env.PGSSL === "require"
        ? { rejectUnauthorized: false }
        : undefined,
      max: 5,
    });
  }
  return global.__mvpPool;
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const pool = getPool();
  const res = await pool.query(text, params as never[]);
  return res.rows as T[];
}

/** Run a read query, returning [] if the DB isn't configured/reachable (keeps the UI alive in demo mode). */
export async function safeQuery<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  if (!dbConfigured) return [];
  try {
    return await query<T>(text, params);
  } catch (err) {
    console.warn("[db] query failed, falling back:", (err as Error).message);
    return [];
  }
}
