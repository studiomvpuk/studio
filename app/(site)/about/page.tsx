import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = { title: "About — StudioMVP" };

export default function AboutPage() {
  return (
    <>
      <section style={{ paddingTop: 150 }}>
        <div className="wrap founder-grid founder">
          <div className="photo reveal"><span style={{ borderRadius: "5%", overflow: "hidden" }}>
            <Image src="/tolulope.jpg" alt="Tolulope Olonibua" width={500} height={500} />
            </span></div>
          <div className="reveal">
            <div className="eyebrow">The founder</div>
            <h2>Built by a founder who&rsquo;s shipped — not a sales team.</h2>
            <p>
              StudioMVP is led by Tolulope Olonibua, a full-stack engineer and product
              founder. He designed, built and launched LetsGoHalf — now used by 1200+
              people on iOS — from a single idea to a live product.
            </p>
            <p>
              So you work directly with someone who has lived the founder journey,
              understands what investors look for, and builds your product like it&rsquo;s his own.
            </p>
            <div className="creds">BSc Mathematics · Co-Founder, LetsGoHalf</div>
            <div className="sig">— Tolulope Olonibua</div>
          </div>
        </div>
      </section>

      <section className="light-sec cta">
        <div className="wrap reveal">
          <div className="eyebrow" style={{ textAlign: "center" }}>Work with us</div>
          <h2>Let&rsquo;s build<br />something real.</h2>
          <p>A few projects each quarter, built end-to-end by people who&rsquo;ve done it before.</p>
          <Link className="btn-w" href="/start">Start a project →</Link>
        </div>
      </section>
    </>
  );
}
