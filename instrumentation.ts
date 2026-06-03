// Runs once when the server boots — creates the DB schema + admin user automatically,
// so there's no manual migration step on deploy.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureSchema } = await import("./lib/migrate");
    await ensureSchema().catch(() => {
      /* logged inside ensureSchema; don't crash boot */
    });
  }
}
