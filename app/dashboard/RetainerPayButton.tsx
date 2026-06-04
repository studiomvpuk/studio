"use client";

import { useState } from "react";

export default function RetainerPayButton({ retainerId, label }: { retainerId: string; label: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function pay() {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retainerId }),
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
      <button type="button" className="btn" style={{ width: "100%" }} onClick={pay} disabled={busy}>
        {busy ? "Starting…" : label}
      </button>
      {err ? <div style={{ marginTop: 8, fontSize: ".82rem", color: "var(--warn)" }}>{err}</div> : null}
    </>
  );
}
