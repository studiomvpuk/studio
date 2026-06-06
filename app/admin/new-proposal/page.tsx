import Link from "next/link";
import NewProposalForm from "./NewProposalForm";

export const metadata = { title: "New proposal — StudioMVP Admin" };

export default async function NewProposalPage({ searchParams }: { searchParams: Promise<{ email?: string; name?: string }> }) {
  const sp = await searchParams;
  const initial = {
    clientEmail: sp.email || "",
    clientName: sp.name || "",
  };

  return (
    <div className="doc-page">
      <div className="doc-wrap" style={{ maxWidth: 620 }}>
        <div className="tag">Admin · New proposal</div>
        <h1>Create a proposal</h1>
        <div className="who">Scope, price and payment terms. On send, the client gets a link to review &amp; sign — signing creates the project and first invoice automatically.</div>
        <NewProposalForm initial={initial} />
        <div style={{ marginTop: 22 }}>
          <Link href="/admin" className="terms" style={{ borderBottom: "1px solid var(--hair)" }}>← Back to admin</Link>
        </div>
      </div>
    </div>
  );
}
