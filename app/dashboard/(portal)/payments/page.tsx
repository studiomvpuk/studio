import { getSession } from "@/lib/auth";
import { getClientData } from "@/lib/data";
import ClientTop from "../../ClientTop";
import NoProject from "../../NoProject";
import PayBalanceButton from "../../PayBalanceButton";

export const metadata = { title: "Payments — StudioMVP" };

export default async function PaymentsPage() {
  const session = await getSession();
  const data = await getClientData(session?.userId);

  return (
    <>
      <ClientTop title="Payments" sub={data.hasProject ? `${data.paid} paid of ${data.total}` : undefined} />
      <div className="grid">
        {!data.hasProject ? (
          <NoProject note="No invoices yet. Your deposit and balance invoices appear here once your proposal is signed." name={session?.name || ""} email={session?.email || ""} />
        ) : (
          <>
            <div className="card">
              <div className="ch"><span className="ct">Balance</span>
                <span className={`badge ${data.paidPct >= 100 ? "b-ok" : "b-warn"}`}>{data.paidPct >= 100 ? "Paid in full" : "Balance due"}</span>
              </div>
              <div className="pay-fig"><span className="k">Project total</span><span className="v">{data.total}</span></div>
              <div className="pay-fig"><span className="k">Paid</span><span className="v">{data.paid}</span></div>
              <div className="pay-fig"><span className="k">Outstanding</span><span className="v">{data.outstanding}</span></div>
              <div className="pay-bar"><i style={{ width: `${data.paidPct}%` }}></i></div>
              {data.paidPct < 100 ? (
                <PayBalanceButton invoiceId={data.balanceInvoiceId} label={`Pay balance · ${data.outstanding} →`} />
              ) : (
                <div className="cl-empty" style={{ padding: 16 }}>You&rsquo;re all paid up — thank you!</div>
              )}
            </div>

            <div className="card">
              <div className="ch"><span className="ct">Invoices</span><span className="badge b-mute">{data.invoices.length}</span></div>
              {data.invoices.length ? (
                data.invoices.map((i) => (
                  <div className="inv" key={i.id}>
                    <span>{i.label} · {i.amount}</span>
                    <span className={`badge ${i.badge}`}>{i.status}</span>
                  </div>
                ))
              ) : (
                <div className="cl-empty" style={{ padding: 16 }}>No invoices raised yet.</div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
