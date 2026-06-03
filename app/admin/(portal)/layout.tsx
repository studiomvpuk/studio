import type { Metadata } from "next";
import Link from "next/link";
import "../admin.css";
import { getSession } from "@/lib/auth";
import AdminSidebar from "../AdminSidebar";

export const metadata: Metadata = { title: "StudioMVP — Admin Portal" };

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <div className="admin-app">
      <div className="app">
        <AdminSidebar name={session?.name || "Admin"} email={session?.email || "officialstudiomvp@gmail.com"} />
        <div className="main">
          {children}
          <div className="admin-foot">
            <Link href="/" className="badge b-mute">← Site</Link>
            <Link href="/dashboard" className="badge b-mute">Client view</Link>
            <Link href="/spec" className="badge b-mute">Spec</Link>
            {session ? (
              <form action="/api/auth/logout" method="post" style={{ marginLeft: "auto" }}>
                <button className="btn-o btn" type="submit">Sign out</button>
              </form>
            ) : (
              <Link href="/login" className="btn-o btn" style={{ marginLeft: "auto", textDecoration: "none" }}>Sign in</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
