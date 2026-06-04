import { notFound } from "next/navigation";
import { dbConfigured, query, safeQuery } from "@/lib/db";
import { getSession } from "@/lib/auth";
import SignForm from "./SignForm";

export const metadata = { title: "Your proposal — StudioMVP" };

const gbp = (cents: number) => "£" + (cents / 100).toLocaleString("en-GB");

type Proposal = {
  client_email: string; client_name: string | null; title: string; scope: string | null;
  price_cents: number; payment_plan: "full" | "deposit" | "milestones"; deposit_pct: number; status: string;
};

const DEMO: Proposal = {
  client_email: "client@example.com", client_name: "there", title: "Your app — MVP build",
  scope: "Design + build of an investor-ready MVP: native iOS app, backend, and launch.\n\n• Discovery & UX\n• Visual design\n• Build & integrations\n• Test & App Store launch",
  price_cents: 800000, payment_plan: "deposit", deposit_pct: 50, status: "sent",
};

export default async function ProposalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let p: Proposal;
  if (!dbConfigured) {
    p = DEMO;
  } else {
    const rows = await query<Proposal>(`select * from proposals where token = $1`, [token]);
    if (!rows.length) notFound();
    p = rows[0];
    // mark viewed (best-effort)
    await safeQuery(`update proposals set status = 'viewed', viewed_at = coalesce(viewed_at, now()) where token = $1 and status = 'sent'`, [token]);
  }

  const deposit = Math.round((p.price_cents * p.deposit_pct) / 100);
  const planLabel =
    p.payment_plan === "full" ? `${gbp(p.price_cents)} in full on signing`
    : p.payment_plan === "milestones" ? `Across milestones — total ${gbp(p.price_cents)}`
    : `${gbp(deposit)} deposit (${p.deposit_pct}%) on signing, ${gbp(p.price_cents - deposit)} balance before launch`;

  const signed = p.status === "signed";
  const session = await getSession();

  return (
    <div className="doc-page">
      <div className="doc-wrap">
        <div className="tag">Proposal · StudioMVP</div>
        <h1>{p.title}</h1>
        <div className="who">Prepared for {p.client_name || p.client_email}</div>

        <div className="panel">
          <h3>Scope</h3>
          <p>{p.scope || "Scope to be confirmed."}</p>
        </div>

        <div className="panel">
          <h3>Investment</h3>
          <div className="figs">
            <div className="fig"><div className="k">Total</div><div className="v">{gbp(p.price_cents)}</div></div>
            {p.payment_plan === "deposit" && (
              <>
                <div className="fig"><div className="k">Deposit ({p.deposit_pct}%)</div><div className="v">{gbp(deposit)}</div></div>
                <div className="fig"><div className="k">Balance</div><div className="v">{gbp(p.price_cents - deposit)}</div></div>
              </>
            )}
          </div>
          <p className="terms" style={{ marginTop: 14 }}>{planLabel}. Paid securely by card via Stripe.</p>
        </div>

        <div className="panel">
          <h3>Terms</h3>
          <p className="terms">Full code, design files and IP transfer to you on completion. Timeline confirmed at kick-off. This proposal and the standard StudioMVP services agreement form the contract on signature.</p>
        </div>

        {signed ? (
          <div className="ok">
            <div className="tag">Signed</div>
            <div className="big">This proposal has been signed.</div>
            <a className="btn" href={session ? "/dashboard" : "/login"} style={{ display: "inline-block", maxWidth: 280, margin: "8px auto 0" }}>
              {session ? "Back to your dashboard →" : "Sign in to your dashboard →"}
            </a>
          </div>
        ) : (
          <SignForm token={token} clientName={p.client_name || ""} />
        )}
      </div>
    </div>
  );
}
