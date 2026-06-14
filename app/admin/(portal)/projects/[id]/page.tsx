import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectDetail, getProjectTasks } from "@/lib/data";
import AdminTop from "../../../AdminTop";
import PaymentTerms from "../../../PaymentTerms";
import ProjectActions from "../../../ProjectActions";
import ProjectDocuments from "../../../ProjectDocuments";
import TaskBoard from "@/app/components/TaskBoard";
import MessageThread from "@/app/components/MessageThread";

export const metadata = { title: "Project — StudioMVP Admin" };

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getProjectDetail(id);
  if (!p) notFound();
  const tasks = await getProjectTasks(id);

  return (
    <>
      <AdminTop
        title={p.name}
        actions={
          <>
            <span className="badge b-info">{p.status}</span>
            <ProjectActions projectId={p.id} />
          </>
        }
      />

      <div className="stats" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="stat"><div className="k">Total</div><div className="v">{p.total}</div><div className="delta">contract value</div></div>
        <div className="stat"><div className="k">Paid</div><div className="v">{p.paid}</div><div className="delta">received</div></div>
        <div className="stat"><div className="k">Outstanding</div><div className="v">{p.outstanding}</div><div className="delta">balance due</div></div>
        <div className="stat"><div className="k">Launch</div><div className="v" style={{ fontSize: "1.3rem" }}>{p.launch}</div><div className="delta">{p.client}</div></div>
      </div>

      <div className="panels">
        <div style={{ display: "grid", gap: 20 }}>
          {/* PHASES */}
          <div className="card">
            <div className="ct">Phases · {p.phase}</div>
            {p.phases.length ? (
              <div className="ph-list">
                {p.phases.map((ph) => (
                  <div key={ph.id} className={`ph ph-${ph.state}`}>
                    <span className="dot"></span>
                    <span className="ph-nm">{ph.name}</span>
                    <span className="badge b-mute" style={{ textTransform: "capitalize" }}>{ph.state}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty">No phases set up yet.</div>
            )}
          </div>

          {/* INVOICES */}
          <div className="card">
            <div className="ct">Invoices <span className="badge b-mute">{p.invoices.length}</span></div>
            {p.invoices.length ? (
              <table>
                <tbody>
                  <tr><th>Type</th><th>Amount</th><th>Status</th><th>Date</th></tr>
                  {p.invoices.map((i) => (
                    <tr key={i.id}>
                      <td className="pname">{i.type}</td>
                      <td>{i.amount}</td>
                      <td><span className={`badge ${i.status === "paid" ? "b-ok" : i.status === "due" ? "b-warn" : "b-mute"}`} style={{ textTransform: "capitalize" }}>{i.status}</span></td>
                      <td>{i.when}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty">No invoices yet.</div>
            )}
          </div>

          {/* APPROVALS */}
          <div className="card">
            <div className="ct">Approvals <span className="badge b-mute">{p.approvals.length}</span></div>
            {p.approvals.length ? (
              <div className="ap-list">
                {p.approvals.map((a) => (
                  <div key={a.id} className="ap">
                    <div>
                      <div className="pname">{a.item}</div>
                      <div style={{ fontSize: ".78rem", color: "var(--grey-2)" }}>{a.when}</div>
                    </div>
                    <span className={`badge ${a.status === "approved" ? "b-ok" : a.status === "changes" ? "b-warn" : "b-mute"}`} style={{ textTransform: "capitalize" }}>{a.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty">No approvals requested yet.</div>
            )}
          </div>

          {/* TASKS (two-way board, shared with the client) */}
          <TaskBoard projectId={p.id} role="admin" initial={tasks} />

          {/* DOCUMENTS (admin manages → client sees) */}
          <ProjectDocuments projectId={p.id} initial={p.documents} />

          {/* MESSAGES (live thread) */}
          <div className="card">
            <div className="ct">Messages <span className="badge b-mute">{p.messages.length}</span></div>
            <MessageThread
              projectId={p.id}
              initial={p.messages.map((m) => ({ author: m.author, body: m.body, when: m.when }))}
              me="team"
            />
          </div>
        </div>

        {/* PAYMENT TERMS (real project) */}
        <PaymentTerms
          projectId={p.id}
          projectName={p.name}
          totalCents={p.totalCents}
          depositPct={p.depositPct}
          gateLaunch={p.gateLaunch}
        />
      </div>

      <div style={{ marginTop: 24 }}>
        <Link href="/admin/projects" className="badge b-mute" style={{ textDecoration: "none" }}>← All projects</Link>
      </div>
    </>
  );
}
