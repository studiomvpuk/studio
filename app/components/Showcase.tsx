"use client";

import { useState } from "react";
import Link from "next/link";
import { projects } from "../(site)/projects";

export default function Showcase() {
  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState(0);

  const select = (i: number) => {
    if (i === active) return;
    setPrev(active);
    setActive(i);
  };

  const p = projects[active];

  return (
    <div className="ss-stage">
      {/* cross-fading background — previous layer underneath, new layer fades in on top */}
      <div className="ss-bg under" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={projects[prev].bg} alt="" />
      </div>
      <div className="ss-bg over" key={`bg-${active}`} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.bg} alt="" />
      </div>

      {/* project list — pinned to the far-left viewport edge.
          Hover previews the project; clicking opens its case study. */}
      <div className="ss-list">
        {projects.map((proj, i) => (
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

      {/* product shot — two iterations slide in from the right, staggered (second on top).
          The whole stack links into the case study. */}
      <Link className="ss-product" href={`/work/${p.slug}`} key={`prod-${active}`} aria-label={`Open ${p.name} case study`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="shot back" src={p.shots[0]} alt={`${p.name} product`} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="shot front" src={p.shots[1]} alt={`${p.name} product`} />
      </Link>

      {/* big name + discipline — vertically centred in the mid-left (MetaLab style) */}
      <Link className="ss-foot" href={`/work/${p.slug}`} key={`foot-${active}`}>
        <div className="ss-name">{p.name}</div>
        <div className="ss-disc">{p.disc}</div>
        <div className="ss-open">View case study →</div>
      </Link>
    </div>
  );
}
