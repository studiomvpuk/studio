import Link from "next/link";
import { getProjects } from "@/lib/data";
import AdminTop from "../../AdminTop";

export const metadata = { title: "Projects — StudioMVP Admin" };

export default async function ProjectsPage() {
  const { live, rows } = await getProjects();

  return (
    <>
      <AdminTop
        title="Projects"
        live={live}
        actions={<Link href="/admin/new-proposal" className="btn" style={{ textDecoration: "none" }}>+ New project</Link>}
      />

      <div className="card">
        <div className="ct">All projects <span className="badge b-mute">{rows.length}</span></div>
        {rows.length ? (
          <table>
            <tbody>
              <tr><th>Project</th><th>Client</th><th>Phase</th><th>Payment</th><th>Status</th><th>Launch</th></tr>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/admin/projects/${p.id}`} className="pname" style={{ textDecoration: "none", color: "inherit" }}>{p.name}</Link>
                  </td>
                  <td>{p.client}</td>
                  <td>{p.phase}</td>
                  <td>{p.pay}</td>
                  <td><span className={`badge ${p.badge}`}>{p.statusLabel}</span></td>
                  <td>{p.launch}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty">
            No projects yet. A project is created automatically when a client signs a proposal.
            <div style={{ marginTop: 14 }}>
              <Link href="/admin/new-proposal" className="btn" style={{ textDecoration: "none" }}>Create a proposal</Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
