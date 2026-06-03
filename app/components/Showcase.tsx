"use client";

import { useState } from "react";
import Link from "next/link";
import { projects } from "../(site)/projects";

// Selected-work showcase. Each project shows ONE real screenshot from
// public/work/<slug>, framed in a clean browser mockup — full image, no zoom,
// no overlaid layers. Projects without a screenshot yet are skipped here.
const shown = projects.filter((p) => p.shots.length > 0);

export default function Showcase() {
  const [active, setActive] = useState(0);
  const select = (i: number) => setActive(i);

  const p = shown[active];
  const shot = p.shots[p.shots.length - 1];

  return (
    <div className="ss-stage">
      <div className="ss-glow" aria-hidden />

      {/* project list — pinned to the far-left viewport edge.
          Hover previews the project; clicking opens its case study. */}
      <div className="ss-list">
        {shown.map((proj, i) => (
          <Link
            key={proj.slug}
            href={`/work/${proj.slug}`}
            className={`ss-item${i === active ? " active" : ""}`}
            onMouseEnter={() => select(i)}
            onFocus={() => select(i)}
          >
            {proj.name}
          </Link>
        ))}
        <Link className="ss-item all" href="/work">All work →</Link>
      </div>

      {/* description — slides down from the top */}
      <p className="ss-desc" key={`desc-${active}`}>{p.desc}</p>

      {/* one browser-window mockup of the project's screenshot */}
      <Link className="ss-mock" href={`/work/${p.slug}`} key={`mock-${active}`} aria-label={`Open ${p.name} case study`}>
        <span className="ss-mock-bar"><span className="dot" /><span className="dot" /><span className="dot" /></span>
        <span className="ss-mock-screen">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shot} alt={`${p.name} screenshot`} />
        </span>
      </Link>

      {/* big name + discipline — bottom-left (MetaLab style) */}
      <Link className="ss-foot" href={`/work/${p.slug}`} key={`foot-${active}`}>
        <div className="ss-name">{p.name}</div>
        <div className="ss-disc">{p.disc}</div>
        <div className="ss-open">View case study →</div>
      </Link>
    </div>
  );
}
