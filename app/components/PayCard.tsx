"use client";

import { useState } from "react";

export default function PayCard() {
  const [amount, setAmount] = useState("499.00");
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function pay() {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, reference: ref || "StudioMVP payment" }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setErr(data.error || "Couldn't start checkout.");
    } catch {
      setErr("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pay-card">
      <div className="pc-top">
        <div className="biz"><span className="mk">S</span>StudioMVP</div>
        <div className="secure">🔒 Secure</div>
      </div>
      <label>Amount</label>
      <div className="amount">
        <span className="cur">£</span>
        <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" aria-label="Amount" />
      </div>
      <label>Reference / project</label>
      <input className="ref" type="text" placeholder="e.g. App build — deposit" value={ref} onChange={(e) => setRef(e.target.value)} />
      <button className="paybtn" onClick={pay} disabled={busy}>
        {busy ? "Starting…" : "Pay securely →"}
      </button>
      {err ? <div className="powered" style={{ color: "#d66" }}>{err}</div> : <div className="powered">Payments powered by Stripe</div>}
    </div>
  );
}
