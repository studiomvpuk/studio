"use client";

import { useState } from "react";

const filters = [
  { key: "all", label: "All" },
  { key: "fintech", label: "Fintech" },
  { key: "health", label: "Health" },
  { key: "beauty", label: "Beauty" },
  { key: "web", label: "Web" },
  { key: "ios", label: "iOS" },
];

const rows = [
  { name: "LetsGoHalf", ds: "A social payments app that lets people split and match the cost of anything, now with 12,000+ iOS users.", disc: ["Product Design", "iOS Engineering"], cats: ["fintech", "ios"] },
  { name: "KinCare", ds: "A diaspora eldercare platform connecting families abroad with vetted carers back home.", disc: ["Product Strategy", "UX Design"], cats: ["health"] },
  { name: "ThriftCircle", ds: "Bringing rotating community savings circles online — transparent, secure and social.", disc: ["Product Design", "Engineering"], cats: ["fintech"] },
  { name: "Tiara Shades", ds: "A luxury salon brand site built to turn an engaged Instagram following into real bookings.", disc: ["Web", "Brand"], cats: ["beauty", "web"] },
  { name: "Glamour Clinic", ds: "A skin & laser clinic site bringing a glamorous brand to life online.", disc: ["Web", "Brand"], cats: ["beauty", "web"] },
  { name: "The Colour Studio", ds: "An elegant hair, makeup and beauty site matched to the studio's gold branding.", disc: ["Web", "Brand"], cats: ["beauty", "web"] },
];

export default function WorkFilters() {
  const [filter, setFilter] = useState("all");

  return (
    <>
      <div className="filters reveal">
        <span className="fl-label">Filter by:</span>
        {filters.map((f) => (
          <span
            key={f.key}
            className={`pill${filter === f.key ? " on" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </span>
        ))}
      </div>
      <div className="work-rows">
        {rows.map((r) => {
          const hide = filter !== "all" && !r.cats.includes(filter);
          return (
            <a key={r.name} className={`wrow reveal${hide ? " hide" : ""}`} href="#">
              <div className="nm">{r.name}</div>
              <div className="ds">{r.ds}</div>
              <div className="disc">
                {r.disc[0]}<br />{r.disc[1]}
              </div>
              <span className="cs">View case study →</span>
            </a>
          );
        })}
      </div>
    </>
  );
}
