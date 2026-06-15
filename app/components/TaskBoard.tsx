"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type Comment = { author: "client" | "admin"; body: string; when: string; image: string | null };
type Task = {
  id: string; title: string; detail: string;
  status: "pending" | "in_progress" | "done" | "confirmed";
  statusLabel: string; badge: string; createdBy: "client" | "admin"; when: string; image: string | null; comments: Comment[];
};

const MAX_BYTES = 8 * 1024 * 1024;
const OK_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];

// Read a File into a base64 data URL after validating type + size.
function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!OK_TYPES.includes(file.type)) return reject(new Error("Use a PNG, JPG, WEBP or GIF image."));
    if (file.size > MAX_BYTES) return reject(new Error("Image is too large (max 8MB)."));
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Couldn't read that image."));
    r.readAsDataURL(file);
  });
}

export default function TaskBoard({
  scope, role, initial, allowance = 0, used = 0, periodWord = "period",
}: {
  scope: { projectId?: string; retainerId?: string };
  role: "client" | "admin";
  initial: Task[];
  allowance?: number;
  used?: number;          // tasks the client has raised this billing period
  periodWord?: string;    // "month" | "quarter" | …
}) {
  const router = useRouter();
  const [add, setAdd] = useState({ title: "", detail: "" });
  const [addImg, setAddImg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [comment, setComment] = useState<Record<string, string>>({});
  const [commentImg, setCommentImg] = useState<Record<string, string>>({});
  const addFileRef = useRef<HTMLInputElement>(null);

  const who = (a: "client" | "admin") =>
    a === role ? "You" : a === "admin" ? "StudioMVP" : "Client";

  const capped = allowance > 0;            // retainer with a per-period task allowance
  const atCap = capped && role === "client" && used >= allowance;

  async function pickAddImage(file?: File) {
    if (!file) return;
    try { setAddImg(await readImage(file)); setErr(""); }
    catch (e) { setErr((e as Error).message); }
  }
  async function pickCommentImage(id: string, file?: File) {
    if (!file) return;
    try { setCommentImg((m) => ({ ...m, [id]: "" })); const d = await readImage(file); setCommentImg((m) => ({ ...m, [id]: d })); setErr(""); }
    catch (e) { setErr((e as Error).message); }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!add.title.trim()) { setErr("Add a short title."); return; }
    setBusy(true); setErr("");
    const res = await fetch("/api/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...scope, title: add.title, detail: add.detail, image: addImg }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(data.error || "Couldn't add it."); return; }
    setAdd({ title: "", detail: "" }); setAddImg(null);
    if (addFileRef.current) addFileRef.current.value = "";
    router.refresh();
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
    const image = commentImg[id] || null;
    if (!body && !image) return;
    setBusy(true);
    const res = await fetch("/api/tasks/comment", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: id, body, image }),
    });
    setBusy(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setErr(d.error || "Couldn't send."); return; }
    setComment((c) => ({ ...c, [id]: "" }));
    setCommentImg((m) => ({ ...m, [id]: "" }));
    router.refresh();
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
      <div className="tb-head">
        <span className="tb-h-t">Tasks &amp; requests</span>
        {capped
          ? <span className={`badge ${atCap ? "b-warn" : "b-mute"}`}>{used} / {allowance} this {periodWord}</span>
          : <span className="badge b-mute">{initial.length}</span>}
      </div>

      {atCap ? (
        <div className="empty" style={{ padding: 14, marginBottom: 16 }}>
          You&rsquo;ve used all {allowance} task{allowance === 1 ? "" : "s"} included this {periodWord}. Your allowance resets next {periodWord} — or ask us to add more.
        </div>
      ) : (
        <form className="tb-add" onSubmit={create}>
          <input value={add.title} onChange={(e) => setAdd((v) => ({ ...v, title: e.target.value }))}
            placeholder={role === "admin" ? "Add a task…" : "What do you need us to do?"} />
          <textarea value={add.detail} onChange={(e) => setAdd((v) => ({ ...v, detail: e.target.value }))}
            placeholder="Add any detail (optional)" rows={2} />
          {addImg ? (
            <div className="tb-attach">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={addImg} alt="attachment preview" />
              <button type="button" className="tb-x" onClick={() => { setAddImg(null); if (addFileRef.current) addFileRef.current.value = ""; }}>Remove image</button>
            </div>
          ) : null}
          <div className="tb-addrow">
            <label className="tb-btn ghost tb-file">
              📎 Image
              <input ref={addFileRef} type="file" accept="image/*" onChange={(e) => pickAddImage(e.target.files?.[0])} hidden />
            </label>
            <button type="submit" className="tb-btn" disabled={busy}>{busy ? "…" : "Add task"}</button>
          </div>
          {err ? <div className="tb-err">{err}</div> : null}
        </form>
      )}

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

              {t.image ? (
                <a href={t.image} target="_blank" rel="noopener noreferrer" className="tb-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.image} alt="task attachment" />
                </a>
              ) : null}

              {t.comments.length ? (
                <div className="tb-thread">
                  {t.comments.map((c, i) => (
                    <div className={`tb-c ${c.author === role ? "mine" : ""}`} key={i}>
                      <div className="tb-c-who">{who(c.author)} · {c.when}</div>
                      {c.body && c.body !== "(image)" ? <div className="tb-c-body">{c.body}</div> : null}
                      {c.image ? (
                        <a href={c.image} target="_blank" rel="noopener noreferrer" className="tb-img sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={c.image} alt="comment attachment" />
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="tb-foot">
                {actions(t)}
                <div className="tb-comment">
                  <input value={comment[t.id] || ""} onChange={(e) => setComment((c) => ({ ...c, [t.id]: e.target.value }))}
                    placeholder="Add a comment…" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(t.id); } }} />
                  <label className="tb-btn ghost tb-file" title="Attach image">
                    📎
                    <input type="file" accept="image/*" onChange={(e) => pickCommentImage(t.id, e.target.files?.[0])} hidden />
                  </label>
                  <button type="button" className="tb-btn ghost" disabled={busy} onClick={() => send(t.id)}>Send</button>
                </div>
              </div>
              {commentImg[t.id] ? (
                <div className="tb-attach sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={commentImg[t.id]} alt="comment preview" />
                  <button type="button" className="tb-x" onClick={() => setCommentImg((m) => ({ ...m, [t.id]: "" }))}>Remove</button>
                </div>
              ) : null}
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
