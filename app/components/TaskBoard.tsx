"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Comment = { author: "client" | "admin"; body: string; when: string };
type Task = {
  id: string; title: string; detail: string;
  status: "pending" | "in_progress" | "done" | "confirmed";
  statusLabel: string; badge: string; createdBy: "client" | "admin"; when: string; comments: Comment[];
};

export default function TaskBoard({
  projectId, role, initial,
}: { projectId: string; role: "client" | "admin"; initial: Task[] }) {
  const router = useRouter();
  const [add, setAdd] = useState({ title: "", detail: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [comment, setComment] = useState<Record<string, string>>({});

  const who = (a: "client" | "admin") =>
    a === role ? "You" : a === "admin" ? "StudioMVP" : "Client";

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!add.title.trim()) { setErr("Add a short title."); return; }
    setBusy(true); setErr("");
    const res = await fetch("/api/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, title: add.title, detail: add.detail }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(data.error || "Couldn't add it."); return; }
    setAdd({ title: "", detail: "" }); router.refresh();
  }

  async function setStatus(id: string, status: Task["status"]) {
    setBusy(true);
    await fetch("/api/tasks", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setBusy(false); router.refresh();
  }

  async function remove(id: string) {
    if (!window.confirm("Remove this task?")) return;
    setBusy(true);
    await fetch("/api/tasks", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBusy(false); router.refresh();
  }

  async function send(id: string) {
    const body = (comment[id] || "").trim();
    if (!body) return;
    setBusy(true);
    await fetch("/api/tasks/comment", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: id, body }),
    });
    setComment((c) => ({ ...c, [id]: "" }));
    setBusy(false); router.refresh();
  }

  function actions(t: Task) {
    if (role === "admin") {
      return (
        <div className="tb-actions">
          {t.status === "pending" && <button className="tb-btn" disabled={busy} onClick={() => setStatus(t.id, "in_progress")}>Start</button>}
          {t.status === "in_progress" && <button className="tb-btn" disabled={busy} onClick={() => setStatus(t.id, "done")}>Mark done</button>}
          {t.status === "done" && <button className="tb-btn ghost" disabled={busy} onClick={() => setStatus(t.id, "in_progress")}>Reopen</button>}
          {t.status === "confirmed" && <button className="tb-btn ghost" disabled={busy} onClick={() => setStatus(t.id, "in_progress")}>Reopen</button>}
          <button className="tb-btn ghost" disabled={busy} onClick={() => remove(t.id)}>Delete</button>
        </div>
      );
    }
    // client
    return (
      <div className="tb-actions">
        {t.status === "done" && <button className="tb-btn" disabled={busy} onClick={() => setStatus(t.id, "confirmed")}>Confirm complete</button>}
        {t.status === "done" && <button className="tb-btn ghost" disabled={busy} onClick={() => setStatus(t.id, "in_progress")}>Request changes</button>}
        {t.status === "pending" && t.createdBy === "client" && <button className="tb-btn ghost" disabled={busy} onClick={() => remove(t.id)}>Remove</button>}
      </div>
    );
  }

  return (
    <div className="card">
      <div className="tb-head"><span className="tb-h-t">Tasks &amp; requests</span><span className="badge b-mute">{initial.length}</span></div>

      <form className="tb-add" onSubmit={create}>
        <input value={add.title} onChange={(e) => setAdd((v) => ({ ...v, title: e.target.value }))}
          placeholder={role === "admin" ? "Add a task for this project…" : "What do you need us to do?"} />
        <textarea value={add.detail} onChange={(e) => setAdd((v) => ({ ...v, detail: e.target.value }))}
          placeholder="Add any detail (optional)" rows={2} />
        <button type="submit" className="tb-btn" disabled={busy}>{busy ? "…" : "Add task"}</button>
        {err ? <div className="tb-err">{err}</div> : null}
      </form>

      {initial.length ? (
        <div className="tb-list">
          {initial.map((t) => (
            <div className={`tb-task st-${t.status}`} key={t.id}>
              <div className="tb-top">
                <div>
                  <div className="tb-title">{t.title}</div>
                  {t.detail ? <div className="tb-detail">{t.detail}</div> : null}
                  <div className="tb-meta">Raised by {who(t.createdBy)} · {t.when}</div>
                </div>
                <span className={`badge ${t.badge}`}>{t.statusLabel}</span>
              </div>

              {t.comments.length ? (
                <div className="tb-thread">
                  {t.comments.map((c, i) => (
                    <div className={`tb-c ${c.author === role ? "mine" : ""}`} key={i}>
                      <div className="tb-c-who">{who(c.author)} · {c.when}</div>
                      <div className="tb-c-body">{c.body}</div>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="tb-foot">
                {actions(t)}
                <div className="tb-comment">
                  <input value={comment[t.id] || ""} onChange={(e) => setComment((c) => ({ ...c, [t.id]: e.target.value }))}
                    placeholder="Add a comment…" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(t.id); } }} />
                  <button type="button" className="tb-btn ghost" disabled={busy} onClick={() => send(t.id)}>Send</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty" style={{ padding: 18 }}>
          {role === "admin"
            ? "No tasks yet. Add one here, or your client can raise a request from their dashboard."
            : "No tasks yet. Need us to do something? Add it above and we'll pick it up."}
        </div>
      )}
    </div>
  );
}
