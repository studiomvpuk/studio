import Link from "next/link";
import { getAdminData } from "@/lib/data";
import AdminTop from "../AdminTop";
import ProjectActions from "../ProjectActions";

export default async function AdminDashboard() {
  const data = await getAdminData();

  return (
    <>
      <AdminTop
        title="Dashboard"
        live={data.live}
        actions={
          <>
            <Link href="/admin/new-proposal" className="btn-o btn" style={{ textDecoration: "none" }}>New proposal</Link>
            <Link href="/admin/new-proposal" className="btn" style={{ textDecoration: "none" }}>+ New project</Link>
          </>
        }
      />

      {/* STATS */}
      <div className="stats">
        {data.stats.map((s) => (
          <div key={s.k} className="stat">
            <div className="k">{s.k}</div>
            <div className="v">{s.v}</div>
            <div className="delta" style={s.warn ? { color: "var(--warn)" } : undefined}>{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="panels">
        {/* ACTIVE PROJECTS */}
        <div className="card">
          <div className="ct">
            Active projects <span className="badge b-mute">{data.projects.length}</span>
          </div>
          {data.projects.length ? (
            <table>
              <tbody>
                <tr><th>Project</th><th>Phase</th><th>Payment</th><th>Status</th><th></th></tr>
                {data.projects.map((p) => (
                  <tr key={p.id || p.name}>
                    <td>
                      {p.id ? (
                        <Link href={`/admin/projects/${p.id}`} className="pname" style={{ textDecoration: "none", color: "inherit" }}>{p.name}</Link>
                      ) : (
                        <div className="pname">{p.name}</div>
                      )}
                    </td>
                    <td>{p.phase}</td>
                    <td>{p.pay}</td>
                    <td><span className={`badge ${p.badge}`}>{p.status}</span></td>
                    <td><ProjectActions projectId={p.id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty">
              No active projects yet. They appear here once a client signs a proposal.
              <div style={{ marginTop: 14 }}>
                <Link href="/admin/new-proposal" className="btn" style={{ textDecoration: "none" }}>Create a proposal</Link>
              </div>
            </div>
          )}
        </div>

        {/* RECENT LEADS */}
        <div className="card">
          <div className="ct">
            Recent leads <span className="badge b-mute">{data.leads.length}</span>
          </div>
          {data.leads.length ? (
            <table>
              <tbody>
                <tr><th>Lead</th><th>Status</th><th>Est.</th></tr>
                {data.leads.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <Link href={`/admin/leads/${l.id}`} className="pname" style={{ textDecoration: "none", color: "inherit" }}>{l.name}</Link>
                    </td>
                    <td><span className="badge b-mute" style={{ textTransform: "capitalize" }}>{l.status.replace(/_/g, " ")}</span></td>
                    <td>{l.est}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty">No leads yet. New enquiries from the site land here.</div>
          )}
        </div>
      </div>
    </>
  );
}
