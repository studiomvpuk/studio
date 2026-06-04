"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Doc = { id: string; label: string; url: string; when: string };

export default function ProjectDocuments({ projectId, initial }: { projectId: string; initial: Doc[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState({ label: "", url: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState({ label: "", url: "" });
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!adding.label.trim() || !adding.url.trim()) return;
    setBusy(true);
    await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, label: adding.label, url: adding.url }),
    });
    setAdding({ label: "", url: "" });
    setBusy(false);
    router.refresh();
  }

  async function save(id: string) {
    if (!editVal.label.trim() || !editVal.url.trim()) return;
    setBusy(true);
    await fetch("/api/documents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, label: editVal.label, url: editVal.url }),
    });
    setEditId(null);
    setBusy(false);
    router.refresh();
  }

  async function del(id: string) {
    if (!window.confirm("Remove this document?")) return;
    setBusy(true);
    await fetch("/api/documents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="card">
      <div className="ct">Documents <span className="badge b-mute">{initial.length}</span></div>

      {initial.length ? (
        <div className="doc-list">
          {initial.map((d) =>
            editId === d.id ? (
              <div className="doc-edit" key={d.id}>
                <input value={editVal.label} onChange={(e) => setEditVal((v) => ({ ...v, label: e.target.value }))} placeholder="Label" />
                <input value={editVal.url} onChange={(e) => setEditVal((v) => ({ ...v, url: e.target.value }))} placeholder="https://…" />
                <button type="button" className="btn am-rowbtn" onClick={() => save(d.id)} disabled={busy}>Save</button>
                <button type="button" className="btn-o btn am-rowbtn" onClick={() => setEditId(null)}>Cancel</button>
              </div>
            ) : (
              <div className="doc-row" key={d.id}>
                <div className="doc-main">
                  <a href={d.url} target="_blank" rel="noopener noreferrer" className="pname">{d.label}</a>
                  <div className="doc-meta">Added {d.when} · {d.url}</div>
                </div>
                <div style={{ whiteSpace: "nowrap" }}>
                  <button type="button" className="btn-o btn am-rowbtn" onClick={() => { setEditId(d.id); setEditVal({ label: d.label, url: d.url }); }}>Edit</button>
                  <button type="button" className="btn-o btn am-rowbtn" onClick={() => del(d.id)} disabled={busy}>Delete</button>
                </div>
              </div>
            )
          )}
        </div>
      ) : (
        <div className="empty" style={{ padding: 18 }}>No documents yet. Add links the client can view — agreement, designs, decks, handover pack.</div>
      )}

      <form className="doc-add" onSubmit={add}>
        <input value={adding.label} onChange={(e) => setAdding((v) => ({ ...v, label: e.target.value }))} placeholder="Label (e.g. Brand guidelines)" />
        <input value={adding.url} onChange={(e) => setAdding((v) => ({ ...v, url: e.target.value }))} placeholder="https://link-to-file" />
        <button type="submit" className="btn" disabled={busy}>{busy ? "…" : "Add"}</button>
      </form>
    </div>
  );
}
