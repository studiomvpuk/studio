"use client";

import { useState } from "react";

export default function PayNowButton({ token, label }: { token: string; label: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function pay() {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentLinkToken: token }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setErr(data.error || "Couldn't start checkout.");
    } catch {
      setErr("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" onClick={pay} disabled={busy} style={{ width: "100%" }}>
        {busy ? "Starting…" : label}
      </button>
      {err ? <div className="auth-error" style={{ marginTop: 12 }}>{err}</div> : null}
    </>
  );
}
