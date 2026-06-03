import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-top">
          <Link href="/" className="wordmark">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="" className="logo-mark" />
            StudioMVP
          </Link>
          <div className="foot-links">
            <div className="foot-col">
              <h4>Studio</h4>
              <Link href="/work">Work</Link>
              <Link href="/services">Services</Link>
              <Link href="/approach">Approach</Link>
              <Link href="/about">About</Link>
            </div>
            <div className="foot-col">
              <h4>Company</h4>
              <Link href="/contact">Contact</Link>
              <Link href="/start">Start a project</Link>
              <Link href="/pay">Pay an invoice</Link>
              <Link href="/login">Client portal</Link>
            </div>
            <div className="foot-col">
              <h4>Connect</h4>
              <a href="https://instagram.com/studiomvp_">Instagram</a>
              <a href="mailto:hello@studiomvp.co.uk">Email</a>
            </div>
          </div>
        </div>
        <div className="foot-bot">
          <span>© 2026 StudioMVP · Product studio · UK</span>
          <span>Booking Q3 2026 · 2 slots open</span>
        </div>
      </div>
    </footer>
  );
}
