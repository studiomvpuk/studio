"use client";

import { useState } from "react";

const projects = [
  { name: "LetsGoHalf", desc: "A social payments app that lets people split and match the cost of anything — now used by 12,000+ people on iOS.", disc: "Product Design · iOS Engineering" },
  { name: "KinCare", desc: "A diaspora eldercare platform connecting families abroad with vetted carers back home.", disc: "Product Strategy · UX Design" },
  { name: "ThriftCircle", desc: "Bringing rotating community savings circles online — transparent, secure and social.", disc: "Product Design · Engineering" },
  { name: "Tiara Shades", desc: "A luxury salon brand site built to turn an engaged Instagram following into real bookings.", disc: "Web · Brand" },
  { name: "Glamour Clinic", desc: "A skin & laser clinic site bringing a glamorous brand to life online.", disc: "Web · Brand" },
  { name: "The Colour Studio", desc: "An elegant hair, makeup and beauty studio site, matched to its gold branding.", disc: "Web · Brand" },
];

export default function Showcase() {
  const [active, setActive] = useState(0);
  const [fade, setFade] = useState(false);

  const select = (i: number) => {
    if (i === active) return;
    setFade(true);
    window.setTimeout(() => {
      setActive(i);
      setFade(false);
    }, 230);
  };

  const p = projects[active];
  const f = fade ? " fade" : "";

  return (
    <div className="sc2-grid">
      <div className="sc-list">
        {projects.map((proj, i) => (
          <div
            key={proj.name}
            className={`sc-item${i === active ? " active" : ""}`}
            onMouseEnter={() => select(i)}
            onClick={() => select(i)}
          >
            {proj.name}
          </div>
        ))}
        <a className="sc-item all" href="#work">All work →</a>
      </div>
      <div className="sc-stage">
        <div className={`sc-visual${f}`}>
          <div className="frame">
            <span>{p.name}</span>
          </div>
          <div className="ph-note">Placeholder — add product shot</div>
        </div>
        <div className={`sc-bigname${f}`}>{p.name}</div>
        <p className={`sc-desc${f}`}>{p.desc}</p>
        <div className={`sc-disc${f}`}>{p.disc}</div>
      </div>
    </div>
  );
}
