"use client";

import { useState } from "react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState<React.ReactNode>("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setMsg("");
    try {
      const res = await fetch("/api/auth/magic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState("error");
        setMsg(data.error || "Something went wrong.");
        return;
      }
      setState("sent");
      if (data.devLink) {
        setMsg(
          <>
            Dev mode — email isn&rsquo;t configured. <a href={data.devLink}>Click here to sign in</a>.
          </>
        );
      } else {
        setMsg(<>Check <b>{email}</b> for your sign-in link.</>);
      }
    } catch {
      setState("error");
      setMsg("Network error — try again.");
    }
  }

  return (
    <>
      <form onSubmit={submit}>
        <input
          type="email"
          required
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={state === "sending"}
        />
        <button type="submit" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : "Email me a sign-in link →"}
        </button>
      </form>
      {msg ? <div className="auth-msg">{msg}</div> : null}
    </>
  );
}
