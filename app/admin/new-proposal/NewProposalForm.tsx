"use client";

import { useState } from "react";

const empty = { clientName: "", clientEmail: "", title: "", scope: "", priceGBP: "", paymentPlan: "deposit", depositPct: "50" };

export default function NewProposalForm({ initial }: { initial?: Partial<typeof empty> }) {
  const [f, setF] = useState({ ...empty, ...initial });
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState("");
  const [err, setErr] = useState("");

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(""); setLink("");
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Couldn't create proposal."); setBusy(false); return; }
      setLink(data.url);
    } catch {
      setErr("Network error.");
    } finally {
      setBusy(false);
    }
  }

  if (link) {
    return (
      <div className="sign-box">
        <h3 style={{ fontSize: ".76rem", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--grey-2)", fontWeight: 600, marginBottom: 10 }}>Proposal sent ✓</h3>
        <p className="terms">Share this sign link with the client (also emailed if email is configured):</p>
        <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} style={{ marginTop: 10 }} />
        <a className="btn" href="/admin" style={{ display: "block", textAlign: "center", textDecoration: "none", marginTop: 16 }}>← Back to admin</a>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = { width: "100%", border: "1px solid var(--hair)", borderRadius: 11, padding: "13px 15px", fontFamily: "var(--body)", fontSize: "1rem", outline: "none", marginBottom: 4 };

  return (
    <form className="sign-box" onSubmit={submit}>
      <label>Client name</label>
      <input style={inputStyle} value={f.clientName} onChange={set("clientName")} placeholder="Amara O." />
      <label>Client email</label>
      <input style={inputStyle} type="email" required value={f.clientEmail} onChange={set("clientEmail")} placeholder="client@email.com" />
      <label>Project title</label>
      <input style={inputStyle} required value={f.title} onChange={set("title")} placeholder="NaijaEats — Food delivery app" />
      <label>Scope</label>
      <textarea style={{ ...inputStyle, resize: "vertical" }} rows={5} value={f.scope} onChange={set("scope")} placeholder="What's included…" />
      <label>Price (£)</label>
      <input style={inputStyle} required inputMode="decimal" value={f.priceGBP} onChange={set("priceGBP")} placeholder="8000" />
      <label>Payment plan</label>
      <select style={inputStyle} value={f.paymentPlan} onChange={set("paymentPlan")}>
        <option value="full">Full upfront</option>
        <option value="deposit">Deposit + balance</option>
        <option value="milestones">Milestones</option>
      </select>
      {f.paymentPlan === "deposit" && (
        <>
          <label>Deposit %</label>
          <input style={inputStyle} inputMode="numeric" value={f.depositPct} onChange={set("depositPct")} placeholder="50" />
        </>
      )}
      <button className="btn" type="submit" disabled={busy} style={{ marginTop: 16, width: "100%", background: "var(--ink)", color: "#fff", border: "none", borderRadius: 11, padding: 15, fontWeight: 600, cursor: "pointer" }}>
        {busy ? "Creating…" : "Create & send proposal →"}
      </button>
      {err ? <div className="err">{err}</div> : null}
    </form>
  );
}
