"use client";

import { useState } from "react";

export default function PayBalanceButton({
  invoiceId,
  label,
}: {
  invoiceId: string | null;
  label: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function pay() {
    if (!invoiceId) {
      setErr("Nothing's due to pay right now.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
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
    <>
      <button className="btn" style={{ width: "100%" }} onClick={pay} disabled={busy}>
        {busy ? "Starting…" : label}
      </button>
      {err ? <div style={{ marginTop: 8, fontSize: ".82rem", color: "var(--warn)" }}>{err}</div> : null}
    </>
  );
}
