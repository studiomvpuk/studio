import { dbConfigured, query } from "./db";
import { ensureSchema } from "./migrate";
import { getSession } from "./auth";

export type Actor = { role: "admin" | "client"; userId: string };
export type Denied = { error: string; status: number };
export function isDenied(x: Actor | Denied): x is Denied {
  return "error" in x;
}

/** Allow admins always; clients only when they own the project / retainer behind the task. */
export async function authorizeOwner(scope: { projectId?: string | null; retainerId?: string | null }): Promise<Actor | Denied> {
  const session = await getSession();
  if (!session?.userId) return { error: "Sign in first.", status: 401 };
  if (!dbConfigured) return { error: "Database isn't connected.", status: 503 };
  await ensureSchema();
  if (session.role === "admin") return { role: "admin", userId: session.userId };

  let ownerId: string | null = null;
  if (scope.retainerId) {
    const r = await query<{ client_id: string | null }>(`select client_id from retainers where id = $1`, [scope.retainerId]);
    if (!r.length) return { error: "Retainer not found.", status: 404 };
    ownerId = r[0].client_id;
  } else if (scope.projectId) {
    const p = await query<{ client_id: string | null }>(`select client_id from projects where id = $1`, [scope.projectId]);
    if (!p.length) return { error: "Project not found.", status: 404 };
    ownerId = p[0].client_id;
  } else {
    return { error: "Nothing to act on.", status: 400 };
  }
  if (ownerId !== session.userId) return { error: "Not yours to change.", status: 403 };
  return { role: "client", userId: session.userId };
}

/** Convenience wrapper for project-scoped checks. */
export const authorizeProject = (projectId: string) => authorizeOwner({ projectId });
