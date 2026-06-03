import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getClientData } from "@/lib/data";
import ClientTop from "../ClientTop";
import NoProject from "../NoProject";

export default async function ClientOverview() {
  const session = await getSession();
  const data = await getClientData(session?.userId);
  const firstName = (session?.name || "there").split(" ")[0];
  const pendingApprovals = data.approvals.filter((a) => a.status === "pending").length;

  return (
    <>
      <ClientTop
        title={`Welcome back, ${firstName}`}
        sub={data.hasProject ? "Here's where your project stands today." : "Your project workspace will appear here."}
        actions={data.hasProject ? <Link href="/dashboard/messages" className="btn" style={{ textDecoration: "none" }}>Message the team</Link> : undefined}
      />

      <div className="grid">
        {!data.hasProject ? (
          <NoProject name={session?.name || ""} email={session?.email || ""} />
        ) : (
          <>
            {/* OVERVIEW HERO */}
            <div className="card ovr">
              <div className="ch">
                <span className="ct">Your project</span>
                <span className="badge b-info">● {data.statusLabel} — {data.nextPhase || data.phaseLabel}</span>
              </div>
              <div className="row">
                <div>
                  <h2>{data.project}</h2>
                  <div className="phase">{data.phaseLabel}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="pct">{data.pct}%</div>
                  <div className="phase">complete</div>
                </div>
              </div>
              <div className="bar"><i style={{ width: `${data.pct}%` }}></i></div>
              {data.nextPhase ? (
                <div className="next">
                  <div className="t"><b>Current phase:</b> {data.nextPhase}.{pendingApprovals ? ` ${pendingApprovals} item${pendingApprovals > 1 ? "s" : ""} awaiting your approval.` : ""}</div>
                  <Link href={pendingApprovals ? "/dashboard/approvals" : "/dashboard/timeline"} className="btn-o btn" style={{ textDecoration: "none" }}>
                    {pendingApprovals ? "Review approvals →" : "View timeline →"}
                  </Link>
                </div>
              ) : null}
            </div>

            {/* QUICK STATS */}
            <div className="card">
              <div className="ch"><span className="ct">Payments</span>
                <span className={`badge ${data.outstanding === data.total && data.paidPct === 0 ? "b-warn" : data.paidPct >= 100 ? "b-ok" : "b-warn"}`}>
                  {data.paidPct >= 100 ? "Paid in full" : "Balance due"}
                </span>
              </div>
              <div className="pay-fig"><span className="k">Project total</span><span className="v">{data.total}</span></div>
              <div className="pay-fig"><span className="k">Paid</span><span className="v">{data.paid}</span></div>
              <div className="pay-fig"><span className="k">Outstanding</span><span className="v">{data.outstanding}</span></div>
              <div className="pay-bar"><i style={{ width: `${data.paidPct}%` }}></i></div>
              <Link href="/dashboard/payments" className="btn" style={{ width: "100%", textAlign: "center", textDecoration: "none", display: "block" }}>Go to payments →</Link>
            </div>

            {/* APPROVALS SUMMARY */}
            <div className="card">
              <div className="ch"><span className="ct">Awaiting you</span><span className="badge b-warn">{pendingApprovals}</span></div>
              {pendingApprovals ? (
                data.approvals.filter((a) => a.status === "pending").slice(0, 3).map((a) => (
                  <div className="item" key={a.id}>
                    <div className="ic">◳</div>
                    <div className="t">{a.item}<small>Uploaded {a.when}</small></div>
                  </div>
                ))
              ) : (
                <div className="cl-empty" style={{ padding: 18 }}>Nothing waiting on you right now.</div>
              )}
              <Link href="/dashboard/approvals" className="link" style={{ display: "inline-block", marginTop: 14 }}>All approvals →</Link>
            </div>

            {/* TIMELINE SUMMARY */}
            <div className="card">
              <div className="ch"><span className="ct">Timeline</span><span className="badge b-mute">{data.phases.length} phases</span></div>
              <div className="tl">
                {data.phases.slice(0, 5).map((p) => (
                  <div key={p.name} className={`ph ${p.state}`}>
                    <span className="dot">{p.state === "done" ? "✓" : ""}</span>
                    <span className="nm">{p.name}</span>
                  </div>
                ))}
              </div>
              <Link href="/dashboard/timeline" className="link" style={{ display: "inline-block", marginTop: 14 }}>Full timeline →</Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
