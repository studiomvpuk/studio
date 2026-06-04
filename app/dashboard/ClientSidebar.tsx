"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/timeline", label: "Timeline" },
  { href: "/dashboard/payments", label: "Payments" },
  { href: "/dashboard/retainer", label: "Retainer" },
  { href: "/dashboard/documents", label: "Documents" },
  { href: "/dashboard/approvals", label: "Approvals" },
  { href: "/dashboard/messages", label: "Messages" },
];

export default function ClientSidebar({ name, email }: { name: string; email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isOn = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  // Close the drawer on navigation.
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <>
      <button type="button" className="side-toggle" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
        <span /><span /><span />
      </button>
      <div className={`side-scrim${open ? " show" : ""}`} onClick={() => setOpen(false)} aria-hidden />

      <div className={`side${open ? " open" : ""}`}>
        <div>
          <div className="brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="" className="logo-mark" />
            <span>StudioMVP<small>Client Portal</small></span>
            <button type="button" className="side-close" aria-label="Close menu" onClick={() => setOpen(false)}>✕</button>
          </div>
          <nav>
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={isOn(l.href) ? "on" : ""}>
                <span className="d"></span>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="who">
          <div className="av"></div>
          <div>
            <div className="nm">{name}</div>
            <div className="em">{email}</div>
          </div>
        </div>
      </div>
    </>
  );
}
