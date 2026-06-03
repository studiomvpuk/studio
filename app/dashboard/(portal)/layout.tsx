import type { Metadata } from "next";
import Link from "next/link";
import "../client.css";
import { getSession } from "@/lib/auth";
import ClientSidebar from "../ClientSidebar";

export const metadata: Metadata = { title: "StudioMVP — Client Portal" };

export default async function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <div className="client-app">
      <div className="app">
        <ClientSidebar name={session?.name || "Client"} email={session?.email || "Client"} />
        <div className="main">
          {children}
          <div className="cl-foot">
            <Link href="/" className="badge b-mute">← Site</Link>
            <Link href="/admin" className="badge b-mute">Admin view</Link>
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
