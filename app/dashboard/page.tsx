import type { Metadata } from "next";
import Link from "next/link";
import "./client.css";
import { getSession } from "@/lib/auth";
import { getClientData } from "@/lib/data";
import PayBalanceButton from "./PayBalanceButton";

export const metadata: Metadata = { title: "StudioMVP — Client Dashboard" };

const sideLinks = ["Overview", "Timeline", "Payments", "Documents", "Approvals", "Messages"];
const badgeFor = (s: string) => (s === "done" ? "b-ok" : s === "active" ? "b-info" : "b-mute");
const textFor = (s: string) => (s === "done" ? "Done" : s === "active" ? "In progress" : "Upcoming");

export default async function ClientDashboard() {
  const session = await getSession();
  const data = await getClientData(session?.userId);
  const firstName = (session?.name || "Amara").split(" ")[0];

  return (
    <div className="client-app">
      <div className="app">
        <div className="side">
          <div>
            <div className="brand">StudioMVP<small>Client Portal</small></div>
            <nav>
              {sideLinks.map((l, i) => (
                <a key={l} className={i === 0 ? "on" : ""}><span className="d"></span>{l}</a>
              ))}
            </nav>
          </div>
          <div className="who">
            <div className="av"></div>
            <div>
              <div className="nm">{session?.name || "Amara O."}</div>
              <div className="em">Client</div>
            </div>
          </div>
        </div>

        <div className="main">
          <div className="top">
            <div>
              <h1>Welcome back, {firstName}</h1>
              <div className="sub">
                Here&rsquo;s where your project stands today.
                {!data.live ? " (Demo data — connect a database to go live.)" : ""}
              </div>
            </div>
            <button className="btn">Message the team</button>
          </div>

          <div className="grid">
            {/* OVERVIEW */}
            <div className="card ovr">
              <div className="ch"><span className="ct">Your project</span><span className="badge b-info">● Active — Build</span></div>
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
              <div className="next">
                <div className="t"><b>Your next action:</b> review the Build preview and approve the checkout flow.</div>
                <button className="btn-o btn">Review now →</button>
              </div>
            </div>

            {/* TIMELINE */}
            <div className="card">
              <div className="ch"><span className="ct">Timeline</span><span className="badge b-mute">{data.phases.length} phases</span></div>
              <div className="tl">
                {data.phases.map((p) => (
                  <div key={p.name} className={`ph ${p.state}`}>
                    <span className="dot">{p.state === "done" ? "✓" : ""}</span>
                    <span className="nm">{p.name}</span>
                    <span className={`badge ${badgeFor(p.state)}`}>{textFor(p.state)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* PAYMENTS */}
            <div className="card">
              <div className="ch"><span className="ct">Payments</span><span className="badge b-warn">Balance due</span></div>
              <div className="pay-fig"><span className="k">Project total</span><span className="v">{data.total}</span></div>
              <div className="pay-fig"><span className="k">Paid</span><span className="v">{data.paid}</span></div>
              <div className="pay-fig"><span className="k">Outstanding</span><span className="v">{data.outstanding}</span></div>
              <div className="pay-bar"><i></i></div>
              <PayBalanceButton invoiceId={data.balanceInvoiceId} label={`Pay balance · ${data.outstanding} →`} />
              <div className="inv"><span>Deposit invoice</span><span className="badge b-ok">Paid</span></div>
              <div className="inv"><span>Balance invoice</span><span className="badge b-warn">Due before launch</span></div>
            </div>

            {/* APPROVALS */}
            <div className="card">
              <div className="ch"><span className="ct">Awaiting your approval</span><span className="badge b-warn">1</span></div>
              <div className="item"><div className="ic">◳</div><div className="t">Checkout flow — Build preview<small>Uploaded 2 hours ago</small></div><a className="link">Review</a></div>
              <div className="item"><div className="ic">✓</div><div className="t">Home screen design<small>Approved 4 days ago</small></div><span className="badge b-ok">Approved</span></div>
            </div>

            {/* DOCUMENTS */}
            <div className="card">
              <div className="ch"><span className="ct">Documents</span></div>
              <div className="item"><div className="ic">⤓</div><div className="t">Signed agreement<small>PDF · signed 18 Jun</small></div><a className="link">Download</a></div>
              <div className="item"><div className="ic">⤓</div><div className="t">Project proposal<small>PDF</small></div><a className="link">Download</a></div>
              <div className="item"><div className="ic">⤓</div><div className="t">Brand assets (your upload)<small>ZIP · 14 files</small></div><a className="link">View</a></div>
            </div>

            {/* MESSAGES */}
            <div className="card">
              <div className="ch"><span className="ct">Messages</span><span className="badge b-info">New</span></div>
              <div className="item"><div className="ic">◔</div><div className="t">StudioMVP team<small>&ldquo;Build preview is up — take a look at the checkout when you get a sec.&rdquo;</small></div></div>
              <div className="item"><div className="ic">◔</div><div className="t">You<small>&ldquo;Looks great, approving the home screen now.&rdquo;</small></div></div>
              <a className="link" style={{ display: "inline-block", marginTop: 14 }}>Open conversation →</a>
            </div>
          </div>

          <div style={{ marginTop: 30, display: "flex", gap: 8, alignItems: "center" }}>
            <Link href="/" className="badge b-mute" style={{ textDecoration: "none" }}>← Site</Link>
            <Link href="/admin" className="badge b-mute" style={{ textDecoration: "none" }}>Admin view</Link>
            {session ? (
              <form action="/api/auth/logout" method="post" style={{ marginLeft: "auto" }}>
                <button className="btn-o btn" type="submit">Sign out</button>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
