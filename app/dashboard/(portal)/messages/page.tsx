import { getSession } from "@/lib/auth";
import { getClientData } from "@/lib/data";
import ClientTop from "../../ClientTop";
import NoProject from "../../NoProject";
import MessageThread from "@/app/components/MessageThread";

export const metadata = { title: "Messages — StudioMVP" };

export default async function MessagesPage() {
  const session = await getSession();
  const data = await getClientData(session?.userId);

  return (
    <>
      <ClientTop title="Messages" sub={data.hasProject ? `Project thread · ${data.project}` : undefined} />
      <div className="grid">
        {!data.hasProject ? (
          <NoProject note="Messaging opens once your project is set up. You'll be able to chat with the team right here." name={session?.name || ""} email={session?.email || ""} />
        ) : (
          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <div className="ch"><span className="ct">Project thread</span><span className="badge b-info">Live</span></div>
            <MessageThread projectId={data.projectId} initial={data.messages} me="client" />
          </div>
        )}
      </div>
    </>
  );
}
