import Link from "next/link";
import { getSession } from "@/lib/auth";
import AdminTop from "../../AdminTop";

export const metadata = { title: "Settings — StudioMVP Admin" };

export default async function SettingsPage() {
  const session = await getSession();

  const dbOn = Boolean(process.env.DATABASE_URL);
  const stripeOn = Boolean(process.env.STRIPE_SECRET_KEY);
  const emailOn = Boolean(process.env.RESEND_API_KEY);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "—";

  const status = [
    { k: "Database", on: dbOn, on_t: "Connected", off_t: "Not connected (demo mode)" },
    { k: "Payments (Stripe)", on: stripeOn, on_t: "Live", off_t: "Not configured" },
    { k: "Email (Resend)", on: emailOn, on_t: "Sending", off_t: "Dev log only" },
  ];

  return (
    <>
      <AdminTop title="Settings" />

      <div className="panels">
        <div style={{ display: "grid", gap: 20 }}>
          {/* PROFILE */}
          <div className="card">
            <div className="ct">Your account</div>
            <div className="kv"><span>Name</span><b>{session?.name || "—"}</b></div>
            <div className="kv"><span>Email</span><b>{session?.email || "—"}</b></div>
            <div className="kv"><span>Role</span><b style={{ textTransform: "capitalize" }}>{session?.role || "—"}</b></div>
            <div className="kv"><span>Site URL</span><b>{baseUrl}</b></div>
          </div>

          {/* TEAM */}
          <div className="card">
            <div className="ct">Team &amp; clients</div>
            <p style={{ color: "var(--grey)", fontSize: ".92rem", margin: "0 0 6px" }}>
              People sign in with a magic link — no passwords. New email addresses start as prospects;
              promote them to <b>client</b> or <b>admin</b> in the database <code>users</code> table.
            </p>
            <p style={{ color: "var(--grey-2)", fontSize: ".82rem", margin: 0 }}>
              Admin email: <b>{process.env.ADMIN_EMAIL || "officialstudiomvp@gmail.com"}</b>
            </p>
            <div style={{ marginTop: 14 }}>
              <Link href="/login" className="btn-o btn" style={{ textDecoration: "none" }}>Send a magic link →</Link>
            </div>
          </div>
        </div>

        {/* SYSTEM STATUS */}
        <div className="card">
          <div className="ct">System status</div>
          <div className="status-list">
            {status.map((s) => (
              <div key={s.k} className="opt" style={{ borderTop: "1px solid var(--hair)" }}>
                <span>{s.k}</span>
                <span className={`badge ${s.on ? "b-ok" : "b-mute"}`}>{s.on ? s.on_t : s.off_t}</span>
              </div>
            ))}
          </div>
          <p style={{ color: "var(--grey-2)", fontSize: ".82rem", marginTop: 14 }}>
            Configure these via environment variables in Railway. Each one is optional — the app runs in a graceful demo mode without them.
          </p>
        </div>
      </div>
    </>
  );
}
