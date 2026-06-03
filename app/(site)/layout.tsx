import ClientEffects from "../components/ClientEffects";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mvp">
      <ClientEffects />
      <SiteNav />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
