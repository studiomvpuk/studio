"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProjectActions({ projectId }: { projectId: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");

  async function advance() {
    if (!projectId) return;
    setBusy("advance");
    try {
      await fetch("/api/projects/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      router.refresh();
    } finally {
      setBusy("");
    }
  }

  async function requestApproval() {
    if (!projectId) return;
    const item = window.prompt("Approval item (e.g. 'Checkout flow — Build preview')");
    if (!item) return;
    setBusy("approval");
    try {
      await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", projectId, item }),
      });
      router.refresh();
    } finally {
      setBusy("");
    }
  }

  if (!projectId) return <span style={{ color: "var(--grey-2)", fontSize: ".8rem" }}>demo</span>;

  return (
    <div style={{ display: "flex", gap: 6 }}>
      <button className="btn-o btn" style={{ padding: "6px 10px", fontSize: ".78rem" }} onClick={advance} disabled={!!busy}>
        {busy === "advance" ? "…" : "Advance →"}
      </button>
      <button className="btn-o btn" style={{ padding: "6px 10px", fontSize: ".78rem" }} onClick={requestApproval} disabled={!!busy}>
        Request approval
      </button>
    </div>
  );
}
