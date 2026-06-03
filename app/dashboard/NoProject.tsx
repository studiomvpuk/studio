import Link from "next/link";

export default function NoProject({ note }: { note?: string }) {
  return (
    <div className="card" style={{ gridColumn: "1 / -1" }}>
      <div className="cl-empty">
        {note || "No active project yet. Once you sign your proposal, your project workspace appears here — timeline, payments, approvals and messages."}
        <div style={{ marginTop: 16 }}>
          <Link href="/start" className="btn" style={{ textDecoration: "none" }}>Start a project</Link>
        </div>
      </div>
    </div>
  );
}
