import Link from "next/link";
import type { Metadata } from "next";
import Showcase from "../../components/Showcase";
import WorkFilters from "../../components/WorkFilters";
import { stats } from "../content";

export const metadata: Metadata = { title: "Work — StudioMVP" };

export default function WorkPage() {
  return (
    <>
      <section style={{ paddingTop: 150 }}>
        <div className="wrap">
          <div className="reveal">
            <div className="eyebrow">Selected work</div>
            <h2 className="big-head">From idea<br />to launch.</h2>
            <p className="lead">A sample of products we&rsquo;ve designed and built — from social fintech with thousands of users to brand sites that convert.</p>
          </div>
        </div>
      </section>

      <section className="showcase" id="showcase" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sc-head reveal">
            <div className="eyebrow" style={{ margin: 0 }}>Preview</div>
            <div className="sc-hint">Hover a project to preview →</div>
          </div>
          <Showcase />
        </div>
      </section>

      <section className="work light-sec" id="work">
        <div className="wrap">
          <div className="reveal">
            <div className="eyebrow">The full list</div>
            <h2 className="big-head">Every project,<br />filterable.</h2>
          </div>
          <WorkFilters />
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="imp-grid">
            {stats.map((s) => (
              <div key={s.label} className="imp reveal">
                <div className="n" data-count={s.count} data-suffix={s.suffix}>0</div>
                <div className="l">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta light-sec">
        <div className="wrap reveal">
          <div className="eyebrow" style={{ textAlign: "center" }}>Let&rsquo;s build</div>
          <h2>Want to be next?</h2>
          <p>Tell us what you&rsquo;re building and we&rsquo;ll come back with a plan within a day.</p>
          <Link className="btn-w" href="/start">Start a project →</Link>
        </div>
      </section>
    </>
  );
}
