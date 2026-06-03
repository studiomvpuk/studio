import Link from "next/link";
import { getPipeline } from "@/lib/data";
import AdminTop from "../../AdminTop";

export const metadata = { title: "Pipeline — StudioMVP Admin" };

export default async function PipelinePage() {
  const { live, empty, cols } = await getPipeline();

  return (
    <>
      <AdminTop
        title="Pipeline"
        live={live}
        actions={<Link href="/admin/new-proposal" className="btn" style={{ textDecoration: "none" }}>New proposal</Link>}
      />

      {empty ? (
        <div className="empty">
          Your pipeline is empty. Leads from the website appear in the first column, and move across as you send proposals and sign clients.
          <div style={{ marginTop: 14 }}>
            <Link href="/admin/new-proposal" className="btn" style={{ textDecoration: "none" }}>Create a proposal</Link>
          </div>
        </div>
      ) : (
        <div className="cols">
          {cols.map((col) => (
            <div key={col.h} className="col">
              <div className="h">{col.h} <span className="n">{col.deals.length}</span></div>
              {col.deals.length ? (
                col.deals.map((d, i) => {
                  const inner = (
                    <>
                      <div className="nm">{d.nm}</div>
                      <div className="meta">
                        {d.badge ? (
                          <span className={`badge ${d.badge}`}>{d.badgeText}</span>
                        ) : (
                          <>
                            <span>{d.a}</span>
                            <span>{d.b}</span>
                          </>
                        )}
                      </div>
                    </>
                  );
                  return d.href ? (
                    <Link key={i} href={d.href} className="deal" style={{ display: "block", textDecoration: "none", color: "inherit" }}>{inner}</Link>
                  ) : (
                    <div key={i} className="deal">{inner}</div>
                  );
                })
              ) : (
                <div className="empty" style={{ padding: 14, fontSize: ".82rem" }}>—</div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
