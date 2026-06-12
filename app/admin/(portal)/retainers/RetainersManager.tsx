"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Retainer = {
  id: string; title: string; client: string; project: string;
  amount: string; period: string; status: string; statusLabel: string; badge: string;
  nextDue: string; nextDueISO: string; collected: string; projectId: string | null; amountCents: number; rawPeriod: string; rawStatus: string;
};
type ProjOpt = { id: string; label: string };

function useModal(onClose: () => void) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [onClose]);
}

function EditModal({ r, onClose, onSaved }: { r: Retainer; onClose: () => void; onSaved: () => void }) {
  useModal(onClose);
  const [f, setF] = useState({ title: r.title, amount: String(Math.round(r.amountCents / 100)), period: r.rawPeriod, status: r.rawStatus, nextDue: r.nextDueISO });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const res = await fetch("/api/retainers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id, ...f }) });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || "Couldn't save."); setBusy(false); return; }
    onSaved();
  }

  return (
    <div className="am-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="am-modal" role="dialog" aria-modal="true">
        <div className="am-head">
          <h3>Edit retainer</h3>
          <button type="button" className="am-x" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form className="am-form" onSubmit={save}>
          <label>Title</label>
          <input value={f.title} onChange={set("title")} />
          <label>Amount (£ per period)</label>
          <input required inputMode="decimal" value={f.amount} onChange={set("amount")} />
          <label>Billing period</label>
          <select value={f.period} onChange={set("period")}>
            <option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="halfyearly">Half-yearly</option><option value="yearly">Yearly</option>
          </select>
          <label>Next payment due</label>
          <input type="date" value={f.nextDue} onChange={set("nextDue")} />
          <label>Status</label>
          <select value={f.status} onChange={set("status")}>
            <option value="active">Active</option><option value="paused">Paused</option><option value="ended">Ended</option>
          </select>
          <button type="submit" className="btn" style={{ width: "100%", marginTop: 18 }} disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
          {err ? <div style={{ marginTop: 10, fontSize: ".85rem", color: "var(--warn)" }}>{err}</div> : null}
        </form>
      </div>
    </div>
  );
}

export default function RetainersManager({ retainers, projects, clients }: { retainers: Retainer[]; projects: ProjOpt[]; clients: ProjOpt[] }) {
  const router = useRouter();
  const empty = { clientId: "", projectId: "", title: "Ongoing retainer", amount: "", period: "monthly", nextDue: "" };
  const [create, setCreate] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [edit, setEdit] = useState<Retainer | null>(null);

  const setC = (k: keyof typeof create) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setCreate((s) => ({ ...s, [k]: e.target.value }));

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!create.clientId || !create.amount) { setErr("Pick a client and an amount."); return; }
    setBusy(true); setErr("");
    const res = await fetch("/api/retainers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(create) });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || "Couldn't create."); setBusy(false); return; }
    setCreate(empty); setBusy(false); router.refresh();
  }

  async function del(id: string) {
    if (!window.confirm("Delete this retainer and its payment history?")) return;
    await fetch("/api/retainers", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    router.refresh();
  }

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  async function sync() {
    setSyncing(true); setSyncMsg("");
    const res = await fetch("/api/retainers/sync", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setSyncing(false);
    if (!res.ok) { setSyncMsg(data.error || "Couldn't sync."); return; }
    setSyncMsg(data.credited ? `Recorded ${data.credited} payment${data.credited === 1 ? "" : "s"}.` : "Already up to date.");
    router.refresh();
  }

  return (
    <>
      <div className="panels">
        <div className="card">
          <div className="ch" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span className="ct" style={{ margin: 0 }}>Retainers <span className="badge b-mute">{retainers.length}</span></span>
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {syncMsg ? <span style={{ fontSize: ".78rem", color: "var(--grey-2)" }}>{syncMsg}</span> : null}
              <button type="button" className="btn-o btn am-rowbtn" onClick={sync} disabled={syncing}>{syncing ? "Syncing…" : "Sync from Stripe"}</button>
            </span>
          </div>
          {retainers.length ? (
            <table>
              <tbody>
                <tr><th>Client</th><th>Amount</th><th>Status</th><th>Next due</th><th>Collected</th><th></th></tr>
                {retainers.map((r) => (
                  <tr key={r.id}>
                    <td><div className="pname">{r.client}</div><div style={{ fontSize: ".76rem", color: "var(--grey-2)" }}>{r.project}</div></td>
                    <td>{r.amount}</td>
                    <td><span className={`badge ${r.badge}`}>{r.statusLabel}</span></td>
                    <td>{r.nextDue}</td>
                    <td>{r.collected}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button type="button" className="btn-o btn am-rowbtn" onClick={() => setEdit(r)}>Edit</button>
                      <button type="button" className="btn-o btn am-rowbtn" onClick={() => del(r.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty">No retainers yet. Set one up for a client whose project has wrapped, so they can pay for ongoing support.</div>
          )}
        </div>

        <div className="card pt-card">
          <div className="ct">Set up a retainer</div>
          {clients.length ? (
            <form className="am-form" onSubmit={add}>
              <label>Client</label>
              <select value={create.clientId} onChange={setC("clientId")} required>
                <option value="">Select a client…</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <label>Project <span style={{ color: "var(--grey-2)", fontWeight: 400 }}>(optional)</span></label>
              <select value={create.projectId} onChange={setC("projectId")}>
                <option value="">No project — general / site care</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
              <label>Title</label>
              <input value={create.title} onChange={setC("title")} placeholder="Ongoing retainer" />
              <label>Amount (£ per period)</label>
              <input required inputMode="decimal" value={create.amount} onChange={setC("amount")} placeholder="1500" />
              <label>Billing period</label>
              <select value={create.period} onChange={setC("period")}>
                <option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="halfyearly">Half-yearly</option><option value="yearly">Yearly</option>
              </select>
              <label>First payment due <span style={{ color: "var(--grey-2)", fontWeight: 400 }}>(optional — defaults to today)</span></label>
              <input type="date" value={create.nextDue} onChange={setC("nextDue")} />
              <button type="submit" className="btn" style={{ width: "100%", marginTop: 18 }} disabled={busy}>{busy ? "Creating…" : "Create retainer"}</button>
              {err ? <div style={{ marginTop: 10, fontSize: ".85rem", color: "var(--warn)" }}>{err}</div> : null}
            </form>
          ) : (
            <div className="empty" style={{ padding: 18 }}>No client accounts yet. Once someone signs in (or you sign a proposal for them), you can set up a retainer here.</div>
          )}
        </div>
      </div>

      {edit && <EditModal r={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); router.refresh(); }} />}
    </>
  );
}
