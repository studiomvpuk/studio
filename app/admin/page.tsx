import type { Metadata } from "next";
import Link from "next/link";
import "./admin.css";
import { getSession } from "@/lib/auth";
import { getAdminData } from "@/lib/data";
import PaymentTerms from "./PaymentTerms";

export const metadata: Metadata = { title: "StudioMVP — Admin Portal" };

const sideLinks = ["Dashboard", "Pipeline", "Projects", "Contracts", "Payments", "Automations", "Templates", "Settings"];

// kanban is illustrative; the live numbers come from getAdminData()
const pipeline = [
  { h: "Leads", n: 3, deals: [
    { nm: "QuickFix — repairs app", a: "New", b: "£6k est" },
    { nm: "Lumi — skincare", a: "Call booked", b: "£9k est" },
    { nm: "Pace — running", a: "New", b: "£5k est" },
  ] },
  { h: "Proposal", n: 2, deals: [
    { nm: "VendaPay", a: "Viewed", b: "£11k" },
    { nm: "Cove — booking", a: "Sent", b: "£7k" },
  ] },
  { h: "Signed", n: 1, deals: [{ nm: "Mira — wellness", badge: "b-warn", badgeText: "Deposit due" }] },
  { h: "Active", n: 4, deals: [
    { nm: "NaijaEats", badge: "b-info", badgeText: "Build" },
    { nm: "KinCare", badge: "b-info", badgeText: "Design" },
  ] },
  { h: "Done", n: 6, deals: [{ nm: "LetsGoHalf", badge: "b-ok", badgeText: "Live" }] },
];

export default async function AdminPage() {
  const session = await getSession();
  const data = await getAdminData();

  return (
    <div className="admin-app">
      <div className="app">
        <div className="side">
          <div>
            <div className="brand">StudioMVP<small>Admin Portal</small></div>
            <nav>
              {sideLinks.map((l, i) => (
                <a key={l} className={i === 0 ? "on" : ""}><span className="d"></span>{l}</a>
              ))}
            </nav>
          </div>
          <div className="who">
            <div className="av"></div>
            <div>
              <div className="nm">{session?.name || "Tolu O."}</div>
              <div className="em">Admin</div>
            </div>
          </div>
        </div>

        <div className="main">
          <div className="top">
            <h1>Dashboard</h1>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span className={`badge ${data.live ? "b-ok" : "b-mute"}`}>{data.live ? "Live data" : "Demo data"}</span>
              <button className="btn-o btn">New proposal</button>
              <button className="btn">+ New project</button>
            </div>
          </div>

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

          {/* PIPELINE (illustrative) */}
          <div className="cols">
            {pipeline.map((col) => (
              <div key={col.h} className="col">
                <div className="h">{col.h} <span className="n">{col.n}</span></div>
                {col.deals.map((d, i) => (
                  <div key={i} className="deal">
                    <div className="nm">{d.nm}</div>
                    <div className="meta">
                      {"badge" in d && d.badge ? (
                        <span className={`badge ${d.badge}`}>{d.badgeText}</span>
                      ) : (
                        <>
                          <span>{(d as { a: string }).a}</span>
                          <span>{(d as { b: string }).b}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="panels">
            {/* PROJECTS TABLE (live) */}
            <div className="card">
              <div className="ct">Active projects <span className="badge b-mute">{data.projects.length}</span></div>
              <table>
                <tbody>
                  <tr><th>Project</th><th>Phase</th><th>Payment</th><th>Status</th></tr>
                  {data.projects.map((p) => (
                    <tr key={p.name}>
                      <td><div className="pname">{p.name}</div></td>
                      <td>{p.phase}</td>
                      <td>{p.pay}</td>
                      <td><span className={`badge ${p.badge}`}>{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAYMENT TERMS CONFIG */}
            <PaymentTerms />
          </div>

          <div style={{ marginTop: 30, display: "flex", gap: 8, alignItems: "center" }}>
            <Link href="/" className="badge b-mute" style={{ textDecoration: "none" }}>← Site</Link>
            <Link href="/dashboard" className="badge b-mute" style={{ textDecoration: "none" }}>Client view</Link>
            <Link href="/spec" className="badge b-mute" style={{ textDecoration: "none" }}>Spec</Link>
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
