import { getSession } from "@/lib/auth";
import { getClientData } from "@/lib/data";
import ClientTop from "../../ClientTop";
import NoProject from "../../NoProject";

export const metadata = { title: "Documents — StudioMVP" };

export default async function DocumentsPage() {
  const session = await getSession();
  const data = await getClientData(session?.userId);

  return (
    <>
      <ClientTop title="Documents" />
      <div className="grid">
        {!data.hasProject ? (
          <NoProject note="No documents yet. Your signed agreement and proposal will appear here." name={session?.name || ""} email={session?.email || ""} />
        ) : (
          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <div className="ch"><span className="ct">Your documents</span><span className="badge b-mute">{data.documents.length}</span></div>
            {data.documents.length ? (
              data.documents.map((d, i) => (
                <div className="item" key={i}>
                  <div className="ic">⤓</div>
                  <div className="t">{d.label}<small>{d.meta}</small></div>
                  {d.href ? <a className="link" href={d.href} target="_blank" rel="noopener noreferrer">View</a> : null}
                </div>
              ))
            ) : (
              <div className="cl-empty">No documents yet. Once your proposal is signed, your agreement and proposal will be available here.</div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
