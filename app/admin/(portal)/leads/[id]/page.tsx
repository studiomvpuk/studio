import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeadDetail } from "@/lib/data";
import AdminTop from "../../../AdminTop";
import LeadActions from "../../../LeadActions";

export const metadata = { title: "Lead — StudioMVP Admin" };

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await getLeadDetail(id);
  if (!lead) notFound();

  const proposalHref = `/admin/new-proposal?email=${encodeURIComponent(lead.email)}&name=${encodeURIComponent(lead.name)}`;

  return (
    <>
      <AdminTop
        title={lead.name}
        actions={
          <>
            <span className="badge b-mute" style={{ textTransform: "capitalize" }}>{lead.statusLabel}</span>
            <LeadActions leadId={lead.id} status={lead.status} />
          </>
        }
      />

      <div className="stats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="stat"><div className="k">Email</div><div className="v" style={{ fontSize: "1.1rem" }}>{lead.email}</div><div className="delta"><a href={`mailto:${lead.email}`} style={{ color: "inherit" }}>Send email →</a></div></div>
        <div className="stat"><div className="k">Source</div><div className="v" style={{ fontSize: "1.1rem", textTransform: "capitalize" }}>{lead.source}</div><div className="delta">enquiry channel</div></div>
        <div className="stat"><div className="k">Received</div><div className="v" style={{ fontSize: "1.1rem" }}>{lead.when}</div><div className="delta">{lead.est !== "—" ? `${lead.est} estimated` : "no estimate"}</div></div>
      </div>

      <div className="panels">
        <div className="card">
          <div className="ct">Brief</div>
          {lead.brief ? (
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0, color: "var(--grey)" }}>{lead.brief}</p>
          ) : (
            <div className="empty">No brief provided.</div>
          )}
        </div>

        <div className="card">
          <div className="ct">Next step</div>
          <p style={{ color: "var(--grey)", margin: "0 0 16px", lineHeight: 1.5 }}>
            Review the brief, book a discovery call, then send a proposal when you&apos;re ready to proceed.
          </p>
          <Link href={proposalHref} className="btn" style={{ textDecoration: "none", display: "inline-block" }}>
            Create proposal →
          </Link>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <Link href="/admin/pipeline" className="badge b-mute" style={{ textDecoration: "none" }}>← Back to pipeline</Link>
      </div>
    </>
  );
}
