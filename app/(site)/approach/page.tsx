import Link from "next/link";
import type { Metadata } from "next";
import { principles } from "../content";

export const metadata: Metadata = { title: "Approach — StudioMVP" };

export default function ApproachPage() {
  return (
    <>
      <section style={{ paddingTop: 150 }} id="approach">
        <div className="wrap">
          <div className="reveal">
            <div className="eyebrow">How we think</div>
            <h2 className="big-head">Built like founders,<br />not contractors.</h2>
            <p className="lead">We&rsquo;ve shipped our own products. So we build yours the way we&rsquo;d build our own — fast, considered, and entirely yours at the end.</p>
          </div>
          <div className="appr-grid">
            {principles.map((p) => (
              <div key={p.pn} className="principle reveal">
                <div className="pn">{p.pn}</div>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="light-sec">
        <div className="wrap">
          <div className="reveal">
            <div className="eyebrow">What you get</div>
            <h2 className="big-head">No lock-in.<br />No surprises.</h2>
            <p className="lead">Transparent pricing set up front, a live client portal so you always know where things stand, and full handover of code, design files and IP on completion.</p>
            <div className="btns" style={{ marginTop: 30 }}>
              <Link className="btn-w" href="/about">Meet the founder →</Link>
              <Link className="btn-o" href="/start" style={{ borderColor: "rgba(0,0,0,.15)", color: "var(--ink)" }}>Start a project</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
