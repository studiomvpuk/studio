import Link from "next/link";
import { getAdminThreads } from "@/lib/data";
import AdminTop from "../../AdminTop";

export const metadata = { title: "Messages — StudioMVP Admin" };

export default async function AdminMessagesPage() {
  const { live, threads, awaiting } = await getAdminThreads();

  return (
    <>
      <AdminTop
        title="Messages"
        live={live}
        actions={awaiting ? <span className="badge b-warn">{awaiting} awaiting reply</span> : undefined}
      />

      <div className="card">
        <div className="ct">Client conversations <span className="badge b-mute">{threads.length}</span></div>
        {threads.length ? (
          <div className="thread-list">
            {threads.map((t) => (
              <Link key={t.projectId} href={`/admin/messages/${t.projectId}`} className="thread-row">
                <div className="thread-main">
                  <div className="thread-top">
                    <span className="thread-nm">{t.project}</span>
                    {t.awaitingReply ? <span className="badge b-warn">Reply needed</span> : <span className="badge b-mute">{t.count}</span>}
                  </div>
                  <div className="thread-last">
                    <b>{t.lastAuthor === "team" ? "You" : t.client}:</b> {t.last}
                  </div>
                </div>
                <div className="thread-when">{t.when}</div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty">No conversations yet. When a client messages from their portal, the thread appears here.</div>
        )}
      </div>
    </>
  );
}
