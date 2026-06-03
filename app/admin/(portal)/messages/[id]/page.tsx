import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminThread } from "@/lib/data";
import AdminTop from "../../../AdminTop";
import MessageThread from "@/app/components/MessageThread";

export const metadata = { title: "Conversation — StudioMVP Admin" };

export default async function AdminConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const thread = await getAdminThread(id);
  if (!thread) notFound();

  return (
    <>
      <AdminTop
        title={thread.project}
        actions={<Link href={`/admin/projects/${id}`} className="btn-o btn" style={{ textDecoration: "none" }}>Open project →</Link>}
      />

      <div className="card" style={{ maxWidth: 720 }}>
        <div className="ct">Conversation with {thread.client}</div>
        <MessageThread projectId={id} initial={thread.messages} me="team" />
      </div>

      <div style={{ marginTop: 24 }}>
        <Link href="/admin/messages" className="badge b-mute" style={{ textDecoration: "none" }}>← All messages</Link>
      </div>
    </>
  );
}
