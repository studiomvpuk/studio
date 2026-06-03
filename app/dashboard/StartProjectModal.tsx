"use client";

import { useEffect, useRef, useState } from "react";

export default function StartProjectModal({
  label = "Start a project",
  name = "",
  email = "",
}: {
  label?: string;
  name?: string;
  email?: string;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name, email, brief: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");
  const firstField = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  // Lock body scroll + Escape to close + focus first field.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => firstField.current?.focus(), 60);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open]);

  function close() {
    setOpen(false);
    // reset after the close animation so reopening is clean
    setTimeout(() => { setState("idle"); setMsg(""); setForm((f) => ({ ...f, brief: "" })); }, 200);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setMsg("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setState("error");
        setMsg(data.error || "Something went wrong.");
        return;
      }
      setState("sent");
      setMsg(data.demo ? "Got it (demo mode — not stored)." : "Thanks — we'll be in touch within a day with a plan, timeline and price.");
    } catch {
      setState("error");
      setMsg("Network error — try again.");
    }
  }

  return (
    <>
      <button type="button" className="btn" onClick={() => setOpen(true)}>{label}</button>

      {open ? (
        <div className="cl-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div className="cl-modal" role="dialog" aria-modal="true" aria-label="Start a project">
            <div className="cl-modal-head">
              <div>
                <h3>Start a project</h3>
                <div className="cl-modal-sub">Tell us what you&rsquo;re building — a sentence or two is plenty. We&rsquo;ll come back with a plan, a timeline and a price.</div>
              </div>
              <button type="button" className="cl-x" aria-label="Close" onClick={close}>✕</button>
            </div>

            {state === "sent" ? (
              <div className="cl-ok">
                <div className="tick">✓</div>
                <div style={{ fontSize: ".96rem", color: "var(--grey)", lineHeight: 1.5 }}>{msg}</div>
                <button type="button" className="btn" style={{ marginTop: 20 }} onClick={close}>Done</button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div className="cl-field">
                  <label htmlFor="sp-name">Your name</label>
                  <input id="sp-name" ref={firstField as React.RefObject<HTMLInputElement>} placeholder="Your name" value={form.name} onChange={set("name")} disabled={state === "sending"} />
                </div>
                <div className="cl-field">
                  <label htmlFor="sp-email">Email</label>
                  <input id="sp-email" type="email" required placeholder="you@email.com" value={form.email} onChange={set("email")} disabled={state === "sending"} />
                </div>
                <div className="cl-field">
                  <label htmlFor="sp-brief">What are you building?</label>
                  <textarea id="sp-brief" required rows={4} placeholder="A new app, a redesign, an MVP to validate an idea…" value={form.brief} onChange={set("brief")} disabled={state === "sending"} />
                </div>
                <button type="submit" className="btn" disabled={state === "sending"}>
                  {state === "sending" ? "Sending…" : "Send brief →"}
                </button>
                {state === "error" && msg ? <div style={{ marginTop: 10, fontSize: ".85rem", color: "var(--warn)" }}>{msg}</div> : null}
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
