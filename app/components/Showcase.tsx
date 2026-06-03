"use client";

import { useState } from "react";
import Link from "next/link";
import { projects } from "../(site)/projects";

// Selected-work showcase. Every image is a real screenshot from public/work/<slug>:
// the project's own shot fills the background (dimmed) AND the crisp foreground card.
// Projects without a screenshot yet are skipped here (still on the full /work list).
const shown = projects.filter((p) => p.shots.length > 0);

export default function Showcase() {
  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState(0);

  const select = (i: number) => {
    if (i === active) return;
    setPrev(active);
    setActive(i);
  };

  const p = shown[active];
  const back = p.shots.length > 1 ? p.shots[0] : null;
  const front = p.shots[p.shots.length - 1];
  const prevFront = shown[prev].shots[shown[prev].shots.length - 1];

  return (
    <div className="ss-stage">
      {/* background = the active project's own screenshot, dimmed + blurred for
          legibility. Cross-fades: previous layer underneath, new layer fades in. */}
      <div className="ss-bg under" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={prevFront} alt="" />
      </div>
      <div className="ss-bg over" key={`bg-${active}`} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={front} alt="" />
      </div>

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

      {/* product — real screenshots from public/work; two stacked when the project
          has a pair, a single framed card when it only has one. */}
      <Link className="ss-product" href={`/work/${p.slug}`} key={`prod-${active}`} aria-label={`Open ${p.name} case study`}>
        {back ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="shot back" src={back} alt={`${p.name} screenshot`} />
        ) : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={`shot front${back ? "" : " solo"}`} src={front} alt={`${p.name} screenshot`} />
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
