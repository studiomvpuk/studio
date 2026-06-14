import { dbConfigured, query } from "./db";
import { ensureSchema } from "./migrate";
import { getSession } from "./auth";

export type Actor = { role: "admin" | "client"; userId: string };
export type Denied = { error: string; status: number };

/** Allow admins on any project, and clients only on a project they own. */
export async function authorizeProject(projectId: string): Promise<Actor | Denied> {
  const session = await getSession();
  if (!session?.userId) return { error: "Sign in first.", status: 401 };
  if (!dbConfigured) return { error: "Database isn't connected.", status: 503 };
  await ensureSchema();
  if (session.role === "admin") return { role: "admin", userId: session.userId };

  const rows = await query<{ client_id: string | null }>(`select client_id from projects where id = $1`, [projectId]);
  if (!rows.length) return { error: "Project not found.", status: 404 };
  if (rows[0].client_id !== session.userId) return { error: "Not your project.", status: 403 };
  return { role: "client", userId: session.userId };
}
