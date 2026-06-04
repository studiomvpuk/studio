"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/pipeline", label: "Pipeline" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/contracts", label: "Contracts" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/retainers", label: "Retainers" },
  { href: "/admin/automations", label: "Automations" },
  { href: "/admin/templates", label: "Templates" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminSidebar({ name, email }: { name: string; email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isOn = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

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
            <span>StudioMVP<small>Admin Portal</small></span>
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
