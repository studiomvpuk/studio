import { getPayments, getPaymentLinks } from "@/lib/data";
import AdminTop from "../../AdminTop";
import CreatePaymentLink from "./CreatePaymentLink";

export const metadata = { title: "Payments — StudioMVP Admin" };

export default async function PaymentsPage() {
  const { live, stats, rows } = await getPayments();
  const links = await getPaymentLinks();

  return (
    <>
      <AdminTop title="Payments" live={live} />

      <div className="stats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {stats.map((s) => (
          <div key={s.k} className="stat">
            <div className="k">{s.k}</div>
            <div className="v">{s.v}</div>
            <div className="delta" style={s.warn ? { color: "var(--warn)" } : undefined}>{s.warn ? "outstanding" : "to date"}</div>
          </div>
        ))}
      </div>

      <div className="panels">
        {/* INVOICES (auto-raised from projects) */}
        <div className="card">
          <div className="ct">Invoices <span className="badge b-mute">{rows.length}</span></div>
          {rows.length ? (
            <table>
              <tbody>
                <tr><th>Project</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th></tr>
                {rows.map((i) => (
                  <tr key={i.id}>
                    <td className="pname">{i.project}</td>
                    <td>{i.type}</td>
                    <td>{i.amount}</td>
                    <td><span className={`badge ${i.badge}`}>{i.status}</span></td>
                    <td>{i.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty">No invoices yet. Deposits and balances are raised automatically when proposals are signed and as projects progress.</div>
          )}
        </div>

        {/* CREATE A PAYMENT LINK (ad-hoc) */}
        <CreatePaymentLink />
      </div>

      {/* PAYMENT LINKS */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="ct">Payment links <span className="badge b-mute">{links.length}</span></div>
        {links.length ? (
          <table>
            <tbody>
              <tr><th>For</th><th>Amount</th><th>Client</th><th>Status</th><th>Date</th><th></th></tr>
              {links.map((l) => (
                <tr key={l.token}>
                  <td className="pname">{l.description}</td>
                  <td>{l.amount}</td>
                  <td>{l.client}</td>
                  <td><span className={`badge ${l.badge}`}>{l.status}</span></td>
                  <td>{l.when}</td>
                  <td>
                    <a className="btn-o btn" style={{ padding: "6px 10px", fontSize: ".78rem", textDecoration: "none" }} href={`/pay/${l.token}`} target="_blank" rel="noopener noreferrer">Open</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty">No payment links yet. Create one above to charge a client for anything outside their main invoices — extra rounds, add-ons, retainers.</div>
        )}
      </div>
    </>
  );
}
