"use client";

import { useState } from "react";

export default function StartForm() {
  const [form, setForm] = useState({ name: "", email: "", brief: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

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
      setMsg(data.demo ? "Got it (demo mode — not stored). Connect a database to capture leads." : "Thanks — we'll be in touch within a day.");
    } catch {
      setState("error");
      setMsg("Network error — try again.");
    }
  }

  if (state === "sent") {
    return <div className="auth-msg">✓ {msg}</div>;
  }

  return (
    <>
      <form onSubmit={submit}>
        <input placeholder="Your name" value={form.name} onChange={set("name")} disabled={state === "sending"} />
        <input type="email" required placeholder="you@email.com" value={form.email} onChange={set("email")} disabled={state === "sending"} />
        <textarea
          required
          placeholder="What are you building? A sentence or two is plenty."
          value={form.brief}
          onChange={set("brief")}
          rows={4}
          disabled={state === "sending"}
          style={{
            background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12,
            padding: "15px 16px", color: "var(--white)", fontFamily: "var(--body)", fontSize: "1rem",
            outline: "none", resize: "vertical",
          }}
        />
        <button type="submit" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : "Send brief →"}
        </button>
      </form>
      {msg ? <div className="auth-msg">{msg}</div> : null}
    </>
  );
}
