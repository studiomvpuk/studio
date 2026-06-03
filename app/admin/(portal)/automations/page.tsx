import { getEvents } from "@/lib/data";
import AdminTop from "../../AdminTop";

export const metadata = { title: "Automations — StudioMVP Admin" };

// These mirror the rules wired in lib/automations.ts — they run on every matching event.
const RULES: { event: string; action: string }[] = [
  { event: "lead.created", action: "Email the prospect a brief-received confirmation" },
  { event: "proposal.sent", action: "Email the client a review & sign link" },
  { event: "contract.signed", action: "Set up the project, raise the first invoice, email the client" },
  { event: "invoice.paid", action: "Email a receipt and activate the portal" },
  { event: "project.completed", action: "Email the handover pack and request a testimonial" },
];

export default async function AutomationsPage() {
  const { live, rows } = await getEvents();

  return (
    <>
      <AdminTop title="Automations" live={live} />

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="ct">Active rules <span className="badge b-mute">{RULES.length}</span></div>
        <div className="rule-list">
          {RULES.map((r) => (
            <div key={r.event} className="rule">
              <span className="badge b-info">{r.event}</span>
              <span className="rule-arrow">→</span>
              <span className="rule-act">{r.action}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="ct">Event log <span className="badge b-mute">{rows.length}</span></div>
        {rows.length ? (
          <table>
            <tbody>
              <tr><th>Event</th><th>Details</th><th>When</th></tr>
              {rows.map((e, i) => (
                <tr key={i}>
                  <td><span className="badge b-mute">{e.type}</span></td>
                  <td>{e.summary || "—"}</td>
                  <td>{e.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty">No events yet. Every lead, proposal, signature and payment is recorded here as it happens.</div>
        )}
      </div>
    </>
  );
}
