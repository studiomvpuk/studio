import Link from "next/link";
import { getContracts } from "@/lib/data";
import AdminTop from "../../AdminTop";
import ContractsManager from "./ContractsManager";

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

      <ContractsManager proposals={proposals} />

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
