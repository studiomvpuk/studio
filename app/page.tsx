import ClientEffects from "./components/ClientEffects";
import PayCard from "./components/PayCard";
import Showcase from "./components/Showcase";
import WorkFilters from "./components/WorkFilters";

const services = [
  { n: "01", title: "MVP Development", body: "Investor-ready first versions — enough to test, win users and raise." },
  { n: "02", title: "Mobile Apps", body: "Native-quality iOS & Android, built to scale from launch to thousands." },
  { n: "03", title: "Web Platforms", body: "Fast, secure web apps and dashboards with backends built for growth." },
  { n: "04", title: "Product Design", body: "Considered UX that makes complex products feel effortless." },
  { n: "05", title: "AI Integration", body: "Modern AI woven in only where it genuinely earns its place." },
  { n: "06", title: "Launch & Growth", body: "Store launch, analytics and the foundation to keep iterating." },
];

const principles = [
  { pn: "01", title: "Ship fast, ship right", body: "Speed and quality aren't a trade-off. We move quickly without leaving you something to rebuild." },
  { pn: "02", title: "Design that earns trust", body: "Users decide in seconds. Every screen is crafted to feel premium and worth paying for." },
  { pn: "03", title: "You own everything", body: "Full code, design files and IP are yours. No lock-in, no games." },
];

const stats = [
  { count: 12000, suffix: "+", label: "Users on a shipped app" },
  { count: 6, suffix: "+", label: "Products launched" },
  { count: 6, suffix: "wk", label: "Typical idea-to-launch" },
  { count: 100, suffix: "%", label: "Code & IP ownership to you" },
];

export default function Home() {
  return (
    <div className="mvp">
      <ClientEffects />

      <nav id="nav">
        <a className="pill" href="#showcase">Menu</a>
        <div className="wordmark">StudioMVP</div>
        <div className="nav-right">
          <span className="clock" id="clock">—</span>
          <a className="pill" href="/login">Portal</a>
          <a className="icon-pill" href="mailto:hello@studiomvp.co.uk" aria-label="Contact">
            <svg viewBox="0 0 24 24">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
          </a>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero">
        <div className="wrap">
          <div className="avail"><span className="dot"></span>Booking Q3 2026 · 2 project slots open</div>
          <h1>We turn ideas into products people <em>actually use.</em></h1>
          <div className="sub">
            <p>StudioMVP designs and builds investor-ready apps and platforms — from the first sketch to thousands of real users.</p>
            <div className="btns">
              <a className="btn-w" href="/start">Start a project →</a>
              <a className="btn-o" href="#showcase">See the work</a>
            </div>
          </div>
        </div>
        <div className="hcue">Selected work<div className="ln"></div></div>
      </header>

      {/* SHOWCASE */}
      <section className="showcase" id="showcase">
        <div className="wrap">
          <div className="sc-head reveal">
            <div className="eyebrow" style={{ margin: 0 }}>Selected work</div>
            <div className="sc-hint">Hover a project to preview →</div>
          </div>
          <Showcase />
        </div>
      </section>

      {/* WORK ROWS (light) */}
      <section className="work light-sec" id="work">
        <div className="wrap">
          <div className="reveal">
            <div className="eyebrow">The full list</div>
            <h2 className="big-head">A sample of our work —<br />from idea to launch.</h2>
          </div>
          <WorkFilters />
        </div>
      </section>

      {/* IMPACT (dark) */}
      <section>
        <div className="wrap">
          <div className="reveal">
            <div className="eyebrow">By the numbers</div>
            <h2 className="big-head">We ship products<br />that grow.</h2>
          </div>
          <div className="imp-grid">
            {stats.map((s) => (
              <div key={s.label} className="imp reveal">
                <div className="n" data-count={s.count} data-suffix={s.suffix}>0</div>
                <div className="l">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES (light) */}
      <section className="light-sec" id="services">
        <div className="wrap">
          <div className="reveal">
            <div className="eyebrow">Capabilities</div>
            <h2 className="big-head">Idea to launch,<br />under one roof.</h2>
          </div>
          <div className="svc-grid">
            {services.map((s) => (
              <div key={s.n} className="svc reveal">
                <div className="n">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* APPROACH (dark) */}
      <section id="approach">
        <div className="wrap">
          <div className="reveal">
            <div className="eyebrow">How we think</div>
            <h2 className="big-head">Built like founders,<br />not contractors.</h2>
          </div>
          <div className="appr-grid">
            {principles.map((p) => (
              <div key={p.pn} className="principle reveal">
                <div className="pn">{p.pn}</div>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOUNDER (dark) */}
      <section>
        <div className="wrap founder-grid founder">
          <div className="photo reveal"><span>Add founder photo</span></div>
          <div className="reveal">
            <div className="eyebrow">The founder</div>
            <h2>Built by a founder who&rsquo;s shipped — not a sales team.</h2>
            <p>
              StudioMVP is led by Tolulope Olonibua, a full-stack engineer and product
              founder. He designed, built and launched LetsGoHalf — now used by 12,000+
              people on iOS — from a single idea to a live product.
            </p>
            <p>
              So you work directly with someone who has lived the founder journey,
              understands what investors look for, and builds your product like it&rsquo;s his own.
            </p>
            <div className="creds">BSc Mathematics · ex-MTN Group · Founder, LetsGoHalf</div>
            <div className="sig">— Tolulope Olonibua</div>
          </div>
        </div>
      </section>

      {/* PAY (dark) */}
      <section>
        <div className="wrap">
          <div className="pay reveal" id="pay">
            <div>
              <div className="eyebrow">Client payments</div>
              <h2>Settle invoices in seconds.</h2>
              <p className="lead">A simple, secure way for clients to pay a deposit or invoice by card — processed through Stripe, straight to StudioMVP.</p>
              <ul>
                <li>Pay any agreed amount by card</li>
                <li>Encrypted &amp; PCI-compliant via Stripe</li>
                <li>Instant emailed receipt</li>
              </ul>
            </div>
            <PayCard />
          </div>
        </div>
      </section>

      {/* CTA (light) */}
      <section className="cta light-sec" id="contact">
        <div className="wrap reveal">
          <div className="eyebrow" style={{ textAlign: "center" }}>Let&rsquo;s build</div>
          <h2>Have an idea?<br />Let&rsquo;s make it real.</h2>
          <p>Tell us what you&rsquo;re building. We&rsquo;ll come back with a plan, a timeline and a price — usually within a day. We take on only a few projects each quarter.</p>
          <a className="btn-w" href="/start">Start a project →</a>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="foot-top">
            <div className="wordmark">StudioMVP</div>
            <div className="foot-links">
              <div className="foot-col">
                <h4>Studio</h4>
                <a href="#work">Work</a>
                <a href="#services">Services</a>
                <a href="#approach">Approach</a>
              </div>
              <div className="foot-col">
                <h4>Company</h4>
                <a href="#contact">Contact</a>
                <a href="#pay">Pay an invoice</a>
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
    </div>
  );
}
