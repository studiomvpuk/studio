"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const empty = { description: "", amount: "", clientName: "", clientEmail: "", notify: false };

export default function CreatePaymentLink() {
  const router = useRouter();
  const [form, setForm] = useState(empty);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setMsg("");
    try {
      const res = await fetch("/api/payments/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setState("error");
        setMsg(data.error || "Couldn't create the link.");
        return;
      }
      setUrl(data.url);
      setState("done");
      router.refresh();
    } catch {
      setState("error");
      setMsg("Network error — try again.");
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — user can select the field manually */
    }
  }

  function reset() {
    setForm(empty);
    setUrl("");
    setMsg("");
    setState("idle");
  }

  return (
    <div className="card pt-card">
      <div className="ct">Create a payment link</div>

      {state === "done" ? (
        <div>
          <div className="pl-done">✓ Link created{form.notify && form.clientEmail ? " and emailed to the client" : ""}.</div>
          <div className="pl-url">
            <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
            <button type="button" className="btn" onClick={copy}>{copied ? "Copied" : "Copy"}</button>
          </div>
          <button type="button" className="btn-o btn" style={{ marginTop: 12, width: "100%" }} onClick={reset}>Create another</button>
        </div>
      ) : (
        <form onSubmit={submit} className="pl-form">
          <span className="lbl">What&rsquo;s it for</span>
          <input required placeholder="e.g. Extra design round" value={form.description} onChange={set("description")} />
          <span className="lbl">Amount (£)</span>
          <input required type="number" min="1" step="0.01" placeholder="500" value={form.amount} onChange={set("amount")} />
          <span className="lbl">Client name (optional)</span>
          <input placeholder="Amara O." value={form.clientName} onChange={set("clientName")} />
          <span className="lbl">Client email (optional)</span>
          <input type="email" placeholder="client@email.com" value={form.clientEmail} onChange={set("clientEmail")} />
          <label className="pl-check">
            <input type="checkbox" checked={form.notify} onChange={set("notify")} /> Email the link to the client
          </label>
          <button type="submit" className="btn" style={{ width: "100%", marginTop: 10 }} disabled={state === "sending"}>
            {state === "sending" ? "Creating…" : "Generate link"}
          </button>
          {state === "error" && msg ? <div style={{ marginTop: 10, fontSize: ".85rem", color: "var(--warn)" }}>{msg}</div> : null}
        </form>
      )}
    </div>
  );
}
