"use client";

import { useState } from "react";

export default function SignForm({ token, clientName }: { token: string; clientName: string }) {
  const [name, setName] = useState(clientName);
  const [signature, setSignature] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function sign(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`/api/proposals/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signerName: name, signature }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Couldn't sign.");
        setBusy(false);
        return;
      }
      setDone(true);
    } catch {
      setErr("Network error — try again.");
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="ok">
        <div className="tag">Signed</div>
        <div className="big">Thank you — you&rsquo;re all set.</div>
        <p className="who">Your project workspace is being created and your first invoice has been issued. We&rsquo;ve emailed you a sign-in link to your dashboard.</p>
        <a className="btn" href="/login" style={{ display: "inline-block", maxWidth: 280, margin: "10px auto 0" }}>Go to sign-in →</a>
      </div>
    );
  }

  return (
    <div className="sign-box">
      <h3 style={{ fontSize: ".76rem", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--grey-2)", fontWeight: 600, marginBottom: 6 }}>
        Sign to accept
      </h3>
      <form onSubmit={sign}>
        <label>Full legal name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required disabled={busy} />
        <label>Signature (type your name)</label>
        <input className="sig" value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Your signature" required disabled={busy} />
        <button className="btn" type="submit" disabled={busy}>{busy ? "Signing…" : "Sign &amp; accept proposal →"}</button>
      </form>
      {err ? <div className="err">{err}</div> : null}
      <div className="legal">
        By signing you agree to the scope and terms above. Your name, email, timestamp and IP are recorded as an audit trail.
      </div>
    </div>
  );
}
