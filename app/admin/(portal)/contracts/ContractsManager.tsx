"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Proposal = {
  id: string; title: string; client: string; clientName: string; clientEmail: string;
  scope: string; priceCents: number; price: string; paymentPlan: string; depositPct: number;
  status: string; statusLabel: string; rawStatus: string; token: string; when: string;
};

const gbp = (cents: number) => "£" + Math.round(cents / 100).toLocaleString("en-GB");

function useModal(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open, onClose]);
}

/* ── read-only preview (opens in place, no client sign page) ── */
function PreviewModal({ p, onClose, onEdit }: { p: Proposal; onClose: () => void; onEdit: () => void }) {
  useModal(true, onClose);
  const [copied, setCopied] = useState(false);
  const link = typeof window !== "undefined" ? `${window.location.origin}/proposal/${p.token}` : `/proposal/${p.token}`;
  const deposit = Math.round((p.priceCents * p.depositPct) / 100);

  async function copy() {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  }

  return (
    <div className="am-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="am-modal" role="dialog" aria-modal="true" aria-label="Proposal preview">
        <div className="am-head">
          <div>
            <span className="badge b-mute" style={{ marginBottom: 10 }}>Proposal · {p.statusLabel}</span>
            <h3>{p.title}</h3>
            <div style={{ color: "var(--grey-2)", fontSize: ".88rem", marginTop: 4 }}>Prepared for {p.client}</div>
          </div>
          <button type="button" className="am-x" aria-label="Close" onClick={onClose}>✕</button>
        </div>

        <div className="am-section">
          <h4>Scope</h4>
          <p>{p.scope || "Scope to be confirmed."}</p>
        </div>

        <div className="am-section">
          <h4>Investment</h4>
          <div className="am-figs">
            <div className="am-fig"><div className="k">Total</div><div className="v">{p.price}</div></div>
            {p.paymentPlan === "deposit" && (
              <>
                <div className="am-fig"><div className="k">Deposit ({p.depositPct}%)</div><div className="v">{gbp(deposit)}</div></div>
                <div className="am-fig"><div className="k">Balance</div><div className="v">{gbp(p.priceCents - deposit)}</div></div>
              </>
            )}
          </div>
        </div>

        <div className="am-section">
          <h4>Terms</h4>
          <p>Full code, design files and IP transfer to the client on completion. Timeline confirmed at kick-off. This proposal and the standard StudioMVP services agreement form the contract on signature.</p>
        </div>

        <div className="am-actions">
          {p.rawStatus !== "signed" && <button type="button" className="btn" onClick={onEdit}>Edit contract</button>}
          <button type="button" className="btn-o btn" onClick={copy}>{copied ? "Copied ✓" : "Copy client link"}</button>
          <a className="btn-o btn" href={link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>Open client view ↗</a>
        </div>
      </div>
    </div>
  );
}

/* ── edit / adjust the contract ── */
function EditModal({ p, onClose, onSaved }: { p: Proposal; onClose: () => void; onSaved: () => void }) {
  useModal(true, onClose);
  const [f, setF] = useState({
    clientName: p.clientName, clientEmail: p.clientEmail, title: p.title, scope: p.scope,
    priceGBP: String(Math.round(p.priceCents / 100)), paymentPlan: p.paymentPlan, depositPct: String(p.depositPct),
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const res = await fetch(`/api/proposals/${p.token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Couldn't save."); setBusy(false); return; }
      onSaved();
    } catch {
      setErr("Network error — try again."); setBusy(false);
    }
  }

  return (
    <div className="am-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="am-modal" role="dialog" aria-modal="true" aria-label="Edit contract">
        <div className="am-head">
          <h3>Adjust contract</h3>
          <button type="button" className="am-x" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <form className="am-form" onSubmit={save}>
          <label>Client name</label>
          <input value={f.clientName} onChange={set("clientName")} placeholder="Amara O." />
          <label>Client email</label>
          <input type="email" required value={f.clientEmail} onChange={set("clientEmail")} placeholder="client@email.com" />
          <label>Project title</label>
          <input required value={f.title} onChange={set("title")} placeholder="NaijaEats — Food delivery app" />
          <label>Scope</label>
          <textarea rows={5} value={f.scope} onChange={set("scope")} placeholder="What's included…" />
          <label>Price (£)</label>
          <input required inputMode="decimal" value={f.priceGBP} onChange={set("priceGBP")} placeholder="8000" />
          <label>Payment plan</label>
          <select value={f.paymentPlan} onChange={set("paymentPlan")}>
            <option value="full">Full upfront</option>
            <option value="deposit">Deposit + balance</option>
            <option value="milestones">Milestones</option>
          </select>
          {f.paymentPlan === "deposit" && (
            <>
              <label>Deposit %</label>
              <input inputMode="numeric" value={f.depositPct} onChange={set("depositPct")} placeholder="50" />
            </>
          )}
          <button type="submit" className="btn" disabled={busy} style={{ width: "100%", marginTop: 18 }}>
            {busy ? "Saving…" : "Save changes"}
          </button>
          {err ? <div style={{ marginTop: 10, fontSize: ".85rem", color: "var(--warn)" }}>{err}</div> : null}
        </form>
      </div>
    </div>
  );
}

export default function ContractsManager({ proposals }: { proposals: Proposal[] }) {
  const router = useRouter();
  const [preview, setPreview] = useState<Proposal | null>(null);
  const [edit, setEdit] = useState<Proposal | null>(null);

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="ct">Proposals <span className="badge b-mute">{proposals.length}</span></div>
      {proposals.length ? (
        <table>
          <tbody>
            <tr><th>Title</th><th>Client</th><th>Price</th><th>Status</th><th>Created</th><th></th></tr>
            {proposals.map((p) => (
              <tr key={p.id}>
                <td className="pname">{p.title}</td>
                <td>{p.client}</td>
                <td>{p.price}</td>
                <td><span className={`badge ${p.status}`}>{p.statusLabel}</span></td>
                <td>{p.when}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button type="button" className="btn-o btn am-rowbtn" onClick={() => setPreview(p)}>View</button>
                  {p.rawStatus !== "signed" && (
                    <button type="button" className="btn-o btn am-rowbtn" onClick={() => setEdit(p)}>Edit</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty">No proposals yet. Create one and send it — the client reviews &amp; signs online.</div>
      )}

      {preview && <PreviewModal p={preview} onClose={() => setPreview(null)} onEdit={() => { setEdit(preview); setPreview(null); }} />}
      {edit && <EditModal p={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); router.refresh(); }} />}
    </div>
  );
}
