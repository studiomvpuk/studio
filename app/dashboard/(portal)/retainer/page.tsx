import { getSession } from "@/lib/auth";
import { getClientRetainer } from "@/lib/data";
import ClientTop from "../../ClientTop";
import RetainerPayButton from "../../RetainerPayButton";

export const metadata = { title: "Retainer — StudioMVP" };

export default async function RetainerPage() {
  const session = await getSession();
  const r = await getClientRetainer(session?.userId);

  return (
    <>
      <ClientTop title="Retainer" sub={r ? r.title : undefined} />
      <div className="grid">
        {!r ? (
          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <div className="cl-empty">
              You don&rsquo;t have a retainer yet. When your studio sets up ongoing support, it&rsquo;ll appear here — with the rate, the next payment date, and a button to pay it.
            </div>
          </div>
        ) : (
          <>
            <div className="card">
              <div className="ch">
                <span className="ct">Your retainer</span>
                <span className={`badge ${r.active ? "b-ok" : "b-warn"}`}>{r.statusLabel}</span>
              </div>
              <div className="pay-fig"><span className="k">Plan</span><span className="v" style={{ fontSize: "1.2rem" }}>{r.title}</span></div>
              <div className="pay-fig"><span className="k">Rate</span><span className="v">{r.amount}</span></div>
              <div className="pay-fig"><span className="k">{r.active ? "Next payment due" : "Status"}</span><span className="v" style={{ fontSize: "1.1rem" }}>{r.active ? r.nextDue : r.statusLabel}</span></div>
              <div style={{ marginTop: 18 }}>
                {r.active ? (
                  <RetainerPayButton retainerId={r.id} label={`Pay ${r.amount.replace(/\/.*$/, "")} →`} />
                ) : (
                  <div className="cl-empty" style={{ padding: 16 }}>This retainer is {r.statusLabel.toLowerCase()} — reach out to the team to resume it.</div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="ch"><span className="ct">Payment history</span><span className="badge b-mute">{r.payments.length}</span></div>
              {r.payments.length ? (
                r.payments.map((p, i) => (
                  <div className="inv" key={i}>
                    <span>{p.label} · {p.amount}</span>
                    <span className="badge b-ok">Paid {p.when}</span>
                  </div>
                ))
              ) : (
                <div className="cl-empty" style={{ padding: 16 }}>No retainer payments yet.</div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
