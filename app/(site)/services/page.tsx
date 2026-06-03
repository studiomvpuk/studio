import Link from "next/link";
import type { Metadata } from "next";
import { services } from "../content";

export const metadata: Metadata = { title: "Services — StudioMVP" };

export default function ServicesPage() {
  return (
    <>
      <section className="light-sec" style={{ paddingTop: 150 }} id="services">
        <div className="wrap">
          <div className="reveal">
            <div className="eyebrow">Capabilities</div>
            <h2 className="big-head">Idea to launch,<br />under one roof.</h2>
            <p className="lead">One team for the whole journey — strategy, design, engineering and launch. No hand-offs, no agencies stacked on agencies.</p>
          </div>
          <div className="svc-grid">
            {services.map((s) => (
              <div key={s.n} className="svc reveal">
                <div className="n">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="reveal">
            <div className="eyebrow">How it works</div>
            <h2 className="big-head">A clear path<br />from day one.</h2>
            <p className="lead">Every engagement runs through Discovery → Design → Build → Test → Launch, with previews and approvals at each step — all visible in your client portal.</p>
            <div className="btns" style={{ marginTop: 30 }}>
              <Link className="btn-w" href="/start">Start a project →</Link>
              <Link className="btn-o" href="/work">See the work</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="cta light-sec">
        <div className="wrap reveal">
          <div className="eyebrow" style={{ textAlign: "center" }}>Let&rsquo;s build</div>
          <h2>Ready when<br />you are.</h2>
          <p>Tell us what you&rsquo;re building. We take on only a few projects each quarter.</p>
          <Link className="btn-w" href="/start">Start a project →</Link>
        </div>
      </section>
    </>
  );
}
