"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/work", label: "Work" },
  { href: "/services", label: "Services" },
  { href: "/approach", label: "Approach" },
  { href: "/about", label: "About" },
];

export default function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <nav id="nav">
      <div className="nav-left">
        <Link href="/" className="wordmark">StudioMVP</Link>
        <div className={`links${open ? " open" : ""}`}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={pathname === l.href ? "on" : ""}>{l.label}</Link>
          ))}
          <Link href="/contact">Contact</Link>
          <Link href="/login" className="menu-cta">Portal</Link>
          <Link href="/start" className="menu-cta">Start a project →</Link>
        </div>
      </div>
      <div className="nav-right">
        <span className="clock" id="clock">—</span>
        <Link className="pill desk-pill" href="/login">Portal</Link>
        <Link className="pill desk-pill" href="/start" style={{ background: "#fff", color: "#000" }}>Start a project</Link>
        <button
          type="button"
          className="pill burger-pill"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
    </nav>
  );
}
