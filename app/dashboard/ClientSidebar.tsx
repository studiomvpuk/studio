"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/timeline", label: "Timeline" },
  { href: "/dashboard/payments", label: "Payments" },
  { href: "/dashboard/documents", label: "Documents" },
  { href: "/dashboard/approvals", label: "Approvals" },
  { href: "/dashboard/messages", label: "Messages" },
];

export default function ClientSidebar({ name, email }: { name: string; email: string }) {
  const pathname = usePathname();
  const isOn = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <div className="side">
      <div>
        <div className="brand">
          StudioMVP<small>Client Portal</small>
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
  );
}
