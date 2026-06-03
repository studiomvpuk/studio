"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Msg = { author: string; body: string; when: string };

export default function MessageThread({
  projectId,
  initial,
  me,
}: {
  projectId: string | null;
  initial: Msg[];
  me: "client" | "team";
}) {
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/messages?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages)) setMsgs(data.messages);
      }
    } catch {
      /* keep current state on a failed poll */
    }
  }, [projectId]);

  // Light polling keeps both sides of the thread in sync.
  useEffect(() => {
    if (!projectId) return;
    const id = setInterval(refresh, 12000);
    return () => clearInterval(id);
  }, [projectId, refresh]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [msgs.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || !projectId) return;
    setBusy(true);
    setMsgs((m) => [...m, { author: me, body, when: "now" }]); // optimistic
    setText("");
    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, body }),
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!projectId) {
    return <div className="mt-empty">Messaging opens once the project is set up.</div>;
  }

  return (
    <div className="mt">
      <div className="mt-scroll">
        {msgs.length ? (
          msgs.map((m, i) => {
            const mine = m.author === me;
            return (
              <div key={i} className={`mt-msg${mine ? " mt-mine" : ""}`}>
                <div className="mt-meta">{m.author === "team" ? "StudioMVP team" : "Client"} · {m.when}</div>
                <div className="mt-body">{m.body}</div>
              </div>
            );
          })
        ) : (
          <div className="mt-empty">No messages yet — start the conversation.</div>
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="mt-form">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message…"
          aria-label="Write a message"
        />
        <button className="btn" type="submit" disabled={busy}>{busy ? "…" : "Send"}</button>
      </form>
    </div>
  );
}
