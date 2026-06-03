import StartProjectModal from "./StartProjectModal";

export default function NoProject({ note, name = "", email = "" }: { note?: string; name?: string; email?: string }) {
  return (
    <div className="card" style={{ gridColumn: "1 / -1" }}>
      <div className="cl-empty">
        {note || "No active project yet. Once you sign your proposal, your project workspace appears here — timeline, payments, approvals and messages."}
        <div style={{ marginTop: 16 }}>
          <StartProjectModal name={name} email={email} />
        </div>
      </div>
    </div>
  );
}
