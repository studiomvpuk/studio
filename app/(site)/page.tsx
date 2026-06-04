import Link from "next/link";
import Showcase from "../components/Showcase";
import HeroParticles from "../components/HeroParticles";
import { stats } from "./content";

export default function Home() {
  return (
    <>
      {/* HERO */}
      <header className="hero">
        <HeroParticles />
        <div className="wrap">
          <div className="avail"><span className="dot"></span>Booking Q3 2026 · 2 project slots open</div>
          <h1>We turn ideas into products people <em>actually use.</em></h1>
          <div className="sub">
            <p>StudioMVP designs and builds investor-ready apps and platforms — from the first sketch to thousands of real users.</p>
            <div className="btns">
              <Link className="btn-w" href="/start">Start a project →</Link>
              <Link className="btn-o" href="/work">See the work</Link>
            </div>
          </div>
        </div>
        <div className="hcue">Selected work<div className="ln"></div></div>
      </header>

      {/* SHOWCASE */}
      <section className="showcase" id="showcase">
        <div className="wrap">
          <div className="sc-head reveal">
            <div className="eyebrow" style={{ margin: 0 }}>Selected work</div>
            <Link className="sc-hint" href="/work">All work →</Link>
          </div>
          <Showcase />
        </div>
      </section>

      {/* IMPACT */}
      <section>
        <div className="wrap">
          <div className="reveal">
            <div className="eyebrow">By the numbers</div>
            <h2 className="big-head">We ship products<br />that grow.</h2>
          </div>
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

      {/* WHAT WE DO (light teaser) */}
      <section className="light-sec">
        <div className="wrap">
          <div className="reveal">
            <div className="eyebrow">Capabilities</div>
            <h2 className="big-head">Idea to launch,<br />under one roof.</h2>
            <p className="lead">MVP development, mobile apps, web platforms, product design, AI and launch — everything you need to go from sketch to shipped.</p>
            <div className="btns" style={{ marginTop: 30 }}>
              <Link className="btn-w" href="/services">Explore services →</Link>
              <Link className="btn-o" href="/approach" style={{ borderColor: "rgba(0,0,0,.15)", color: "var(--ink)" }}>Our approach</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta light-sec">
        <div className="wrap reveal">
          <div className="eyebrow" style={{ textAlign: "center" }}>Let&rsquo;s build</div>
          <h2>Have an idea?<br />Let&rsquo;s make it real.</h2>
          <p>Tell us what you&rsquo;re building. We&rsquo;ll come back with a plan, a timeline and a price — usually within a day.</p>
          <Link className="btn-w" href="/start">Start a project →</Link>
        </div>
      </section>
    </>
  );
}
