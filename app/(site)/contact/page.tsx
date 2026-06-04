import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact — StudioMVP" };

export default function ContactPage() {
  return (
    <section className="cta" style={{ paddingTop: 170 }} id="contact">
      <div className="wrap reveal">
        <div className="eyebrow" style={{ textAlign: "center" }}>Let&rsquo;s build</div>
        <h2>Have an idea?<br />Let&rsquo;s make it real.</h2>
        <p>Tell us what you&rsquo;re building. We&rsquo;ll come back with a plan, a timeline and a price — usually within a day. We take on only a few projects each quarter.</p>
        <div className="btns" style={{ justifyContent: "center" }}>
          <Link className="btn-w" href="/start">Start a project →</Link>
          <a className="btn-o" href="mailto:officialstudiomvp@gmail.com">officialstudiomvp@gmail.com</a>
        </div>
      </div>
    </section>
  );
}
