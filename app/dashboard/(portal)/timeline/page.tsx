import { getSession } from "@/lib/auth";
import { getClientData } from "@/lib/data";
import ClientTop from "../../ClientTop";
import NoProject from "../../NoProject";

export const metadata = { title: "Timeline — StudioMVP" };

const badgeFor = (s: string) => (s === "done" ? "b-ok" : s === "active" ? "b-info" : "b-mute");
const textFor = (s: string) => (s === "done" ? "Done" : s === "active" ? "In progress" : "Upcoming");

export default async function TimelinePage() {
  const session = await getSession();
  const data = await getClientData(session?.userId);

  return (
    <>
      <ClientTop title="Timeline" sub={data.hasProject ? data.phaseLabel : undefined} />
      <div className="grid">
        {!data.hasProject ? (
          <NoProject name={session?.name || ""} email={session?.email || ""} />
        ) : (
          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <div className="ch"><span className="ct">Project phases</span><span className="badge b-mute">{data.pct}% complete</span></div>
            <div className="bar" style={{ background: "var(--paper)", marginBottom: 18 }}><i style={{ width: `${data.pct}%`, background: "var(--ink)" }}></i></div>
            {data.phases.length ? (
              <div className="tl">
                {data.phases.map((p) => (
                  <div key={p.name} className={`ph ${p.state}`}>
                    <span className="dot">{p.state === "done" ? "✓" : ""}</span>
                    <span className="nm">{p.name}</span>
                    <span className={`badge ${badgeFor(p.state)}`}>{textFor(p.state)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="cl-empty">Your phase plan will appear here once the project kicks off.</div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
