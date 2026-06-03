import Link from "next/link";
import { getContracts } from "@/lib/data";
import AdminTop from "../../AdminTop";

export const metadata = { title: "Contracts — StudioMVP Admin" };

export default async function ContractsPage() {
  const { live, proposals, signed } = await getContracts();

  return (
    <>
      <AdminTop
        title="Contracts"
        live={live}
        actions={<Link href="/admin/new-proposal" className="btn" style={{ textDecoration: "none" }}>New proposal</Link>}
      />

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="ct">Proposals <span className="badge b-mute">{proposals.length}</span></div>
        {proposals.length ? (
          <table>
            <tbody>
              <tr><th>Title</th><th>Client</th><th>Price</th><th>Status</th><th>Created</th><th></th></tr>
              {proposals.map((p) => (
                <tr key={p.id}>
                  <td className="pname">{p.title}</td>
                  <td>{p.client}</td>
                  <td>{p.price}</td>
                  <td><span className={`badge ${p.status}`}>{p.statusLabel}</span></td>
                  <td>{p.when}</td>
                  <td>
                    <Link href={`/proposal/${p.token}`} className="btn-o btn" style={{ padding: "6px 10px", fontSize: ".78rem", textDecoration: "none" }}>View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty">
            No proposals yet. Create one and send it — the client reviews &amp; signs online.
            <div style={{ marginTop: 14 }}>
              <Link href="/admin/new-proposal" className="btn" style={{ textDecoration: "none" }}>Create a proposal</Link>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="ct">Signed contracts <span className="badge b-mute">{signed.length}</span></div>
        {signed.length ? (
          <table>
            <tbody>
              <tr><th>Project</th><th>Signed by</th><th>Email</th><th>Date</th></tr>
              {signed.map((s, i) => (
                <tr key={i}>
                  <td className="pname">{s.title}</td>
                  <td>{s.signer}</td>
                  <td>{s.email}</td>
                  <td>{s.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty">No signed contracts yet. Signed proposals appear here with the signer&apos;s details.</div>
        )}
      </div>
    </>
  );
}
