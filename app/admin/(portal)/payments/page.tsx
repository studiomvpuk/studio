import { getPayments } from "@/lib/data";
import AdminTop from "../../AdminTop";

export const metadata = { title: "Payments — StudioMVP Admin" };

export default async function PaymentsPage() {
  const { live, stats, rows } = await getPayments();

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
    </>
  );
}
