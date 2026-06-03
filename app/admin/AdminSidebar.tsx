"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/pipeline", label: "Pipeline" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/contracts", label: "Contracts" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/automations", label: "Automations" },
  { href: "/admin/templates", label: "Templates" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminSidebar({ name, email }: { name: string; email: string }) {
  const pathname = usePathname();
  const isOn = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="side">
      <div>
        <div className="brand">
          StudioMVP<small>Admin Portal</small>
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
