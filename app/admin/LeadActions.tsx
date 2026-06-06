"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const NEXT: Record<string, { status: string; label: string }[]> = {
  new: [
    { status: "call_booked", label: "Call booked" },
    { status: "lost", label: "Mark lost" },
  ],
  call_booked: [
    { status: "lost", label: "Mark lost" },
  ],
};

export default function LeadActions({ leadId, status }: { leadId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");

  async function updateStatus(next: string) {
    setBusy(next);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy("");
    }
  }

  const actions = NEXT[status] || [];
  if (!actions.length) return null;

  return (
    <div style={{ display: "flex", gap: 6 }}>
      {actions.map((a) => (
        <button
          key={a.status}
          className="btn-o btn"
          style={{ padding: "6px 10px", fontSize: ".78rem" }}
          onClick={() => updateStatus(a.status)}
          disabled={!!busy}
        >
          {busy === a.status ? "…" : a.label}
        </button>
      ))}
    </div>
  );
}
