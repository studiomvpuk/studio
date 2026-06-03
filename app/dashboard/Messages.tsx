"use client";

import { useState } from "react";

type Msg = { author: string; body: string; mine: boolean };

export default function Messages({ initial, projectId }: { initial: Msg[]; projectId: string | null }) {
  const [msgs, setMsgs] = useState(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    // optimistic
    setMsgs((m) => [...m, { author: "client", body, mine: true }]);
    setText("");
    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, body }),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="ch"><span className="ct">Messages</span><span className="badge b-info">Thread</span></div>
      {msgs.map((m, i) => (
        <div className="item" key={i}>
          <div className="ic">◔</div>
          <div className="t">{m.mine ? "You" : "StudioMVP team"}<small>&ldquo;{m.body}&rdquo;</small></div>
        </div>
      ))}
      <form onSubmit={send} style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message…"
          style={{ flex: 1, border: "1px solid var(--hair)", borderRadius: 10, padding: "10px 12px", fontFamily: "var(--body)", fontSize: ".92rem", outline: "none" }}
        />
        <button className="btn" type="submit" disabled={busy}>Send</button>
      </form>
    </div>
  );
}
