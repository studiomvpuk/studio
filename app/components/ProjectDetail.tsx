import Link from "next/link";
import type { Project } from "../(site)/projects";

export default function ProjectDetail({ project }: { project: Project }) {
  const p = project;

  return (
    <article className="pd">
      {/* Header — name + meta. Eases down + fades in on load. */}
      <header className="pd-head">
        <div className="wrap">
          <h1 className="pd-name">{p.name}</h1>
          <div className="pd-meta">
            <div className="pd-meta-col">
              <div className="pd-meta-k">Project Type</div>
              <div className="pd-meta-v">{p.projectType}</div>
            </div>
            <div className="pd-meta-col">
              <div className="pd-meta-k">Stage</div>
              <div className="pd-meta-v">{p.stage}</div>
            </div>
            <div className="pd-meta-col">
              <div className="pd-meta-k">Deliverables</div>
              <div className="pd-meta-v">{p.deliverables}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero — full-bleed, revealed beneath the header. */}
      <div className="pd-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.hero} alt={`${p.name} — hero`} />
      </div>

      {/* Introduction. */}
      <section className="pd-intro">
        <div className="wrap">
          <div className="pd-eyebrow reveal">Introduction</div>
          <p className="pd-lead reveal">{p.intro}</p>
        </div>
      </section>

      {/* Gallery — full-bleed singles and side-by-side pairs. */}
      <section className="pd-gallery">
        <div className="wrap">
          {p.gallery.map((row, i) => (
            <div
              key={i}
              className={`pd-row reveal ${row.images.length === 2 ? "pair" : "full"}`}
            >
              {row.images.map((src, j) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={j} src={src} alt={`${p.name} — ${i + 1}.${j + 1}`} />
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Footer nav. */}
      <section className="pd-next light-sec">
        <div className="wrap reveal" style={{ textAlign: "center" }}>
          <div className="eyebrow" style={{ textAlign: "center" }}>Next</div>
          <h2 className="big-head" style={{ textAlign: "center" }}>Like what you see?</h2>
          <div className="btns" style={{ justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
            <a className="btn-w" href={p.liveUrl} target="_blank" rel="noopener noreferrer">Visit the live site →</a>
            <Link className="btn-o" href="/start" style={{ borderColor: "rgba(0,0,0,.15)", color: "var(--ink)" }}>
              Start a project
            </Link>
            <Link className="btn-o" href="/work" style={{ borderColor: "rgba(0,0,0,.15)", color: "var(--ink)" }}>
              ← All work
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
