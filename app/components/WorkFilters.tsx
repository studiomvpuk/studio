"use client";

import { useState } from "react";
import Link from "next/link";
import { projects } from "../(site)/projects";

const filters = [
  { key: "all", label: "All" },
  { key: "fintech", label: "Fintech" },
  { key: "health", label: "Health" },
  { key: "beauty", label: "Beauty" },
  { key: "web", label: "Web" },
  { key: "ios", label: "iOS" },
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
        {projects.map((r) => {
          const hide = filter !== "all" && !r.cats.includes(filter);
          const disc = r.disc.split("·").map((d) => d.trim());
          return (
            <Link key={r.slug} className={`wrow reveal${hide ? " hide" : ""}`} href={`/work/${r.slug}`}>
              <div className="nm">{r.name}</div>
              <div className="ds">{r.desc}</div>
              <div className="disc">
                {disc[0]}<br />{disc[1]}
              </div>
              <span className="cs">View case study →</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
