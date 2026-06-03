"use client";

import { useState } from "react";

type Item = { id: string; item: string; status: "pending" | "approved" | "changes"; when: string };

export default function Approvals({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  const pending = items.filter((i) => i.status === "pending").length;

  async function decide(id: string, decision: "approved" | "changes") {
    setBusy(id);
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalId: id, decision }),
      });
      if (res.ok) {
        setItems((xs) => xs.map((x) => (x.id === id ? { ...x, status: decision } : x)));
      }
    } finally {
      setBusy(null);
    }
  }

  const badge = (s: Item["status"]) =>
    s === "approved" ? <span className="badge b-ok">Approved</span>
    : s === "changes" ? <span className="badge b-warn">Changes requested</span>
    : null;

  return (
    <div className="card">
      <div className="ch"><span className="ct">Awaiting your approval</span><span className="badge b-warn">{pending}</span></div>
      {items.map((it) => (
        <div className="item" key={it.id}>
          <div className="ic">{it.status === "approved" ? "✓" : "◳"}</div>
          <div className="t">{it.item}<small>{it.status === "pending" ? `Uploaded ${it.when}` : `${it.when}`}</small></div>
          {it.status === "pending" ? (
            <div style={{ display: "flex", gap: 8 }}>
              <button className="link" style={{ border: "none", background: "none", cursor: "pointer" }} disabled={busy === it.id} onClick={() => decide(it.id, "approved")}>Approve</button>
              <button className="link" style={{ border: "none", background: "none", cursor: "pointer", color: "var(--warn)", borderColor: "var(--warn)" }} disabled={busy === it.id} onClick={() => decide(it.id, "changes")}>Changes</button>
            </div>
          ) : badge(it.status)}
        </div>
      ))}
      {!items.length ? <div className="item"><div className="t" style={{ color: "var(--grey-2)" }}>Nothing waiting on you right now.</div></div> : null}
    </div>
  );
}
