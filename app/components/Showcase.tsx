"use client";

import { useState } from "react";

// Background + two product "iterations" are placeholders — swap `bg` / `shots`
// for the real product screenshots (drop files in /public and point here).
const U = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;
const P = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=700&q=80`;

const projects = [
  {
    name: "LetsGoHalf",
    desc: "Building a payments experience that helps people split and match the cost of anything — now used by 12,000+ on iOS.",
    disc: "Product Design · iOS Engineering",
    bg: U("1451187580459-43490279c0fa"),
    shots: [P("1512941937669-90a1b58e7e9c"), P("1556656793-08538906a9f8")],
  },
  {
    name: "KinCare",
    desc: "A diaspora eldercare platform connecting families abroad with vetted carers back home.",
    disc: "Product Strategy · UX Design",
    bg: U("1545987796-200677ee1011"),
    shots: [P("1556656793-08538906a9f8"), P("1512941937669-90a1b58e7e9c")],
  },
  {
    name: "ThriftCircle",
    desc: "Bringing rotating community savings circles online — transparent, secure and social.",
    disc: "Product Design · Engineering",
    bg: U("1605379399642-870262d3d051"),
    shots: [P("1607252650355-f7fd0460ccdb"), P("1512941937669-90a1b58e7e9c")],
  },
  {
    name: "Tiara Shades",
    desc: "A luxury salon brand site built to turn an engaged Instagram following into real bookings.",
    disc: "Web · Brand",
    bg: U("1502691876148-a84978e59af8"),
    shots: [P("1512941937669-90a1b58e7e9c"), P("1556656793-08538906a9f8")],
  },
  {
    name: "Glamour Clinic",
    desc: "A skin & laser clinic site bringing a glamorous brand to life online.",
    disc: "Web · Brand",
    bg: U("1614850523060-8da1d56ae167"),
    shots: [P("1556656793-08538906a9f8"), P("1512941937669-90a1b58e7e9c")],
  },
  {
    name: "The Colour Studio",
    desc: "An elegant hair, makeup and beauty studio site, matched to its gold branding.",
    disc: "Web · Brand",
    bg: U("1502691876148-a84978e59af8"),
    shots: [P("1512941937669-90a1b58e7e9c"), P("1607252650355-f7fd0460ccdb")],
  },
];

export default function Showcase() {
  const [active, setActive] = useState(0);
  const [fade, setFade] = useState(false);

  const select = (i: number) => {
    if (i === active) return;
    setFade(true);
    window.setTimeout(() => { setActive(i); setFade(false); }, 240);
  };

  const p = projects[active];
  const f = fade ? " fade" : "";

  return (
    <div className="ss-stage">
      {/* full-bleed background */}
      <div className={`ss-bg${f}`} key={p.bg}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.bg} alt="" aria-hidden />
      </div>

      {/* project list — pinned to the far-left edge */}
      <div className="ss-list">
        {projects.map((proj, i) => (
          <button
            key={proj.name}
            className={`ss-item${i === active ? " active" : ""}`}
            onMouseEnter={() => select(i)}
            onClick={() => select(i)}
          >
            {proj.name}
          </button>
        ))}
        <a className="ss-item all" href="/work">All work →</a>
      </div>

      {/* description — top */}
      <p className={`ss-desc${f}`}>{p.desc}</p>

      {/* product shot — two iterations, far-right edge */}
      <div className={`ss-product${f}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="shot back" src={p.shots[1]} alt={`${p.name} product`} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="shot front" src={p.shots[0]} alt={`${p.name} product`} />
      </div>

      {/* big name + discipline — lower-left */}
      <div className="ss-foot">
        <div className={`ss-name${f}`}>{p.name}</div>
        <div className={`ss-disc${f}`}>{p.disc}</div>
      </div>
    </div>
  );
}
