import Link from "next/link";
import AdminTop from "../../AdminTop";

export const metadata = { title: "Templates — StudioMVP Admin" };

export default function TemplatesPage() {
  return (
    <>
      <AdminTop
        title="Templates"
        actions={<Link href="/admin/new-proposal" className="btn" style={{ textDecoration: "none" }}>New proposal</Link>}
      />

      <div className="card">
        <div className="ct">Proposal templates</div>
        <div className="empty">
          No saved templates yet. Build a proposal once, and you&apos;ll be able to reuse its scope, pricing and payment terms as a template for the next client.
          <div style={{ marginTop: 14 }}>
            <Link href="/admin/new-proposal" className="btn" style={{ textDecoration: "none" }}>Create a proposal</Link>
          </div>
        </div>
      </div>
    </>
  );
}
