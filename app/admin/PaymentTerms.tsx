"use client";

import { useState } from "react";

const TOTAL = 6000;
const fmt = (n: number) => "£" + n.toLocaleString();

type Plan = "full" | "deposit" | "milestones";

export default function PaymentTerms({ projectId }: { projectId?: string }) {
  const [plan, setPlan] = useState<Plan>("deposit");
  const [split, setSplit] = useState(50);
  const [gate, setGate] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");

  async function save() {
    setSaving(true);
    setSaved("");
    try {
      const res = await fetch("/api/projects/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, plan, depositPct: split, gate }),
      });
      const data = await res.json();
      setSaved(res.ok ? (data.demo ? "Saved (demo — connect a project to persist)" : "Saved & invoice queued") : data.error || "Failed");
    } catch {
      setSaved("Network error");
    } finally {
      setSaving(false);
    }
  }

  const dep = Math.round((TOTAL * split) / 100);
  const bal = TOTAL - dep;

  let summary: React.ReactNode;
  if (plan === "full") {
    summary = <>Client pays <b>{fmt(TOTAL)}</b> (100%) on signing before work begins.</>;
  } else if (plan === "milestones") {
    summary = <>Split across custom milestones you define — e.g. 30% / 40% / 30% of <b>{fmt(TOTAL)}</b>.</>;
  } else {
    summary = (
      <>
        Client pays <b>{fmt(dep)}</b> ({split}%) on signing to start, and <b>{fmt(bal)}</b> before launch. Total <b>{fmt(TOTAL)}</b>.
      </>
    );
  }

  return (
    <div className="card pt-card">
      <div className="ct">Payment terms · Mira</div>
      <span className="lbl">Plan</span>
      <div className="seg">
        <button className={plan === "full" ? "on" : ""} onClick={() => setPlan("full")}>Full upfront</button>
        <button className={plan === "deposit" ? "on" : ""} onClick={() => setPlan("deposit")}>Deposit + balance</button>
        <button className={plan === "milestones" ? "on" : ""} onClick={() => setPlan("milestones")}>Milestones</button>
      </div>

      {plan === "deposit" && (
        <div>
          <span className="lbl">Deposit split</span>
          <div className="slider-row">
            <input
              type="range"
              min={10}
              max={90}
              step={5}
              value={split}
              onChange={(e) => setSplit(Number(e.target.value))}
            />
            <span className="split">{split}%</span>
          </div>
          <div className="split-vis">
            <div className="dep" style={{ width: `${split}%` }}>Deposit {split}%</div>
            <div className="bal">Balance {100 - split}%</div>
          </div>
          <div className="opt"><span>Balance trigger</span><span className="badge b-mute">Before launch</span></div>
          <div className="opt">
            <span>Gate launch until balance paid</span>
            <span className={`toggle${gate ? "" : " off"}`} onClick={() => setGate((g) => !g)} role="switch" aria-checked={gate}></span>
          </div>
        </div>
      )}

      <div className="summary">{summary}</div>
      <button className="btn" style={{ width: "100%", marginTop: 14 }} onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save & send invoice"}
      </button>
      {saved ? <div className="summary" style={{ marginTop: 10 }}>{saved}</div> : null}
    </div>
  );
}
