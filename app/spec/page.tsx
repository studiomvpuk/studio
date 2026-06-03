import type { Metadata } from "next";
import "./spec.css";

export const metadata: Metadata = {
  title: "StudioMVP Client Portal — System Specification",
};

export default function SpecPage() {
  return (
    <div className="spec-doc">
      <div className="layout">
        <aside>
          <div className="brand">StudioMVP</div>
          <div className="sub">Client Portal Spec</div>
          <nav>
            <a href="#overview">Overview &amp; vision</a>
            <a href="#roles">Roles</a>
            <div className="grp">The system</div>
            <a href="#journey">Client journey</a>
            <a href="#payments">Payments &amp; deposits</a>
            <a href="#contracts">Contracts &amp; e-signing</a>
            <a href="#automations">Automations</a>
            <a href="#statuses">Project states</a>
            <div className="grp">Interfaces</div>
            <a href="#client-dash">Client dashboard</a>
            <a href="#admin-dash">Admin portal</a>
            <div className="grp">Build</div>
            <a href="#data">Data model</a>
            <a href="#stack">Tech &amp; integrations</a>
            <a href="#security">Security &amp; compliance</a>
            <a href="#roadmap">Roadmap</a>
          </nav>
        </aside>

        <main>
          <div className="doc-head">
            <span className="tag">System specification · v1</span>
            <h1>The StudioMVP Client Portal.</h1>
            <p>An end-to-end system that takes a prospect from first interest through signing, payment and into a live project workspace — automating the path from customer acquisition to delivery.</p>
          </div>

          <section id="overview">
            <h2><span className="no">01</span> Overview &amp; vision</h2>
            <p className="lead">One platform that runs the entire client lifecycle, so the studio scales without the founder being the bottleneck.</p>
            <p>Today, winning and running a project means manual back-and-forth: emails, separate contract tools, chasing payments, ad-hoc updates. The portal collapses all of that into a single, automated flow. A prospect lands, gets qualified, receives a proposal, signs a contract on the site, pays (in full or a deposit you set), and is dropped straight into a workspace where they can watch design, build and testing happen in real time.</p>
            <p>The goal is an <strong>airtight, repeatable machine</strong>: every step is documented, every transition is automated, and the founder&rsquo;s time goes into building products — not admin. This is the operational layer that lets StudioMVP grow from a studio into a company.</p>
            <div className="callout"><div className="ct">North star</div>Any client can self-serve from &ldquo;interested&rdquo; to &ldquo;in production&rdquo; without a single manual step from the team, while the admin keeps full control and visibility.</div>
          </section>

          <section id="roles">
            <h2><span className="no">02</span> Roles</h2>
            <table>
              <tbody>
                <tr><th>Role</th><th>Who</th><th>Can do</th></tr>
                <tr><td><strong>Prospect / Lead</strong></td><td>Pre-signup visitor</td><td>Submit an enquiry, book a call, view &amp; sign a proposal, pay.</td></tr>
                <tr><td><strong>Client</strong></td><td>Signed &amp; paid customer</td><td>Access their project workspace, approve milestones, message the team, pay outstanding balances, download deliverables.</td></tr>
                <tr><td><strong>Admin</strong></td><td>Founder / StudioMVP team</td><td>Manage the pipeline, set scope &amp; payment terms, send contracts, update phases, configure automations.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="journey">
            <h2><span className="no">03</span> The client journey</h2>
            <p className="lead">The spine of the whole system — nine stages from acquisition to handover.</p>
            <div className="flow">
              {[
                { n: 1, h: "Acquisition & lead capture", p: "A visitor submits the “Start a project” form (or arrives via referral link). A Lead record is created.", who: "Actor: Prospect", auto: "instant acknowledgement email + link to book a discovery call." },
                { n: 2, h: "Qualification & discovery call", p: "Admin reviews the brief, holds the call, and decides to proceed.", who: "Actor: Admin", auto: "reminder nudges if the lead goes cold; call booking synced to calendar." },
                { n: 3, h: "Proposal", p: "Admin builds a proposal from a template — scope, deliverables, timeline, price, and the payment terms (full or deposit split). Sent to the prospect.", who: "Actor: Admin", auto: "proposal-sent email; view tracking; auto-reminder if unsigned after N days." },
                { n: 4, h: "Contract & e-signature", p: "Prospect reviews the agreement and signs it directly on the website. A timestamped, auditable signature is stored.", who: "Actor: Prospect", auto: "on signature → project is created, the first invoice is generated, both parties get a signed PDF copy." },
                { n: 5, h: "Payment", p: "Client pays the amount due — 100% upfront or the deposit you configured (e.g. 50%). Paid securely by card via Stripe.", who: "Actor: Client", auto: "on payment confirmed (Stripe webhook) → portal access is activated; receipt issued." },
                { n: 6, h: "Onboarding & intake", p: "Client account goes live. They complete an intake brief and upload assets (brand, logins, references).", who: "Actor: Client", auto: "Discovery phase opens; team notified the brief is in." },
                { n: 7, h: "Project workspace & phases", p: "The client watches progress through Discovery → Design → Build → Test → Launch, with deliverables, previews and an activity feed.", who: "Actor: Client + Admin", auto: "phase change notifies the client; approval requests are raised automatically." },
                { n: 8, h: "Approvals & final payment", p: "Client approves milestones. If on a deposit plan, the balance invoice is triggered at the agreed point (e.g. pre-launch).", who: "Actor: Client", auto: "milestone reached → balance invoice issued; launch gated until paid (configurable)." },
                { n: 9, h: "Handover & completion", p: "Code and IP are transferred. Project marked complete.", who: "Actor: Admin", auto: "handover pack delivered; testimonial request + support-plan offer scheduled." },
              ].map((s) => (
                <div key={s.n} className="step">
                  <div className="sn">{s.n}</div>
                  <div>
                    <h4>{s.h}</h4>
                    <p>{s.p}</p>
                    <span className="who">{s.who}</span>
                    <div className="auto"><b>Auto:</b> {s.auto}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="payments">
            <h2><span className="no">04</span> Payments &amp; deposits</h2>
            <p className="lead">Fully admin-controlled. You decide, per project, how the client pays.</p>
            <h3>Payment plans (set from the admin portal)</h3>
            <table>
              <tbody>
                <tr><th>Plan</th><th>How it works</th><th>Invoices</th></tr>
                <tr><td><strong>Full upfront</strong></td><td>Client pays 100% on signing before work begins.</td><td>1 invoice at signature.</td></tr>
                <tr><td><strong>Deposit + balance</strong></td><td>Client pays a deposit (default 50%, adjustable) to start; balance due at an agreed milestone.</td><td>2 invoices — deposit at signature, balance at trigger.</td></tr>
                <tr><td><strong>Milestones (custom)</strong></td><td>Split across several stages you define (e.g. 30 / 40 / 30).</td><td>N invoices at each milestone.</td></tr>
              </tbody>
            </table>
            <p>The split percentage, the balance trigger point, and whether launch is gated on final payment are all set by the admin when creating the project. Everything runs through <strong>Stripe</strong>; the client only ever sees a clean &ldquo;Pay StudioMVP&rdquo; screen, never your bank details.</p>
            <div className="callout"><div className="ct">Payment states</div>
              <span className="badge b-mute">Draft</span> &nbsp; <span className="badge b-warn">Deposit due</span> &nbsp; <span className="badge b-ok">Deposit paid</span> &nbsp; <span className="badge b-warn">Balance due</span> &nbsp; <span className="badge b-ok">Paid in full</span>
            </div>
          </section>

          <section id="contracts">
            <h2><span className="no">05</span> Contracts &amp; e-signing</h2>
            <p>Each proposal carries an agreement generated from a reusable template (scope, terms, IP transfer, timeline). The client signs on the site — a typed/drawn signature captured with name, email, timestamp and IP for an audit trail. On completion both parties receive a locked PDF.</p>
            <ul>
              <li><strong>Template library</strong> — standard MSA + per-project schedule, editable per deal.</li>
              <li><strong>Audit trail</strong> — who signed, when, from where; tamper-evident.</li>
              <li><strong>Gating</strong> — no project or invoice is created until the contract is signed.</li>
            </ul>
            <p>For launch you can build a lightweight in-house signer, or integrate an established provider (e.g. an open-source option like Documenso/DocuSeal, or Dropbox Sign). The spec treats e-sign as a swappable module.</p>
          </section>

          <section id="automations">
            <h2><span className="no">06</span> Automations</h2>
            <p className="lead">The triggers that make it run without you.</p>
            <table>
              <tbody>
                <tr><th>When this happens</th><th>The system does this</th></tr>
                <tr><td>Lead form submitted</td><td>Acknowledge + send booking link; create Lead; notify admin.</td></tr>
                <tr><td>Proposal sent</td><td>Track views; remind prospect at day 2 &amp; day 5 if unsigned.</td></tr>
                <tr><td>Contract signed</td><td>Create project; generate first invoice; send signed PDF.</td></tr>
                <tr><td>Deposit paid</td><td>Activate portal; send intake brief; open Discovery phase.</td></tr>
                <tr><td>Phase completed</td><td>Notify client; raise approval request.</td></tr>
                <tr><td>Balance milestone reached</td><td>Issue balance invoice; send reminder until paid.</td></tr>
                <tr><td>Final payment received</td><td>Unlock launch/handover; deliver handover pack.</td></tr>
                <tr><td>Project completed</td><td>Request testimonial; offer support retainer; schedule 30-day check-in.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="statuses">
            <h2><span className="no">07</span> Project states</h2>
            <div className="pill-row">
              {["Lead", "Proposal sent", "Signed", "Deposit due", "Active — Discovery", "Active — Design", "Active — Build", "Active — Test", "Awaiting approval", "Balance due", "Launch", "Completed"].map((s) => (
                <span key={s} className="pill">{s}</span>
              ))}
            </div>
            <p>Each state defines what the client sees, what action is theirs vs the team&rsquo;s, and which automation fires on entry. The status is the single source of truth shown on both dashboards.</p>
          </section>

          <section id="client-dash">
            <h2><span className="no">08</span> Client dashboard</h2>
            <p className="lead">What a signed client sees when they log in.</p>
            <div className="cards">
              <div className="card"><h4>Overview</h4><ul><li>Project name &amp; current phase</li><li>Overall % complete</li><li>The one &ldquo;next action&rdquo; for them</li></ul></div>
              <div className="card"><h4>Timeline</h4><ul><li>All phases &amp; status</li><li>What&rsquo;s done, in progress, upcoming</li><li>Estimated launch date</li></ul></div>
              <div className="card"><h4>Payments</h4><ul><li>Total, paid, outstanding</li><li>Pay-now button (Stripe)</li><li>Invoices &amp; receipts</li></ul></div>
              <div className="card"><h4>Documents</h4><ul><li>Signed contract &amp; proposal</li><li>Deliverables to download</li><li>Asset uploads</li></ul></div>
              <div className="card"><h4>Approvals</h4><ul><li>Items awaiting their sign-off</li><li>Approve or request changes</li></ul></div>
              <div className="card"><h4>Messages</h4><ul><li>One thread with the team</li><li>File attachments</li><li>Notification on reply</li></ul></div>
            </div>
          </section>

          <section id="admin-dash">
            <h2><span className="no">09</span> Admin portal</h2>
            <p className="lead">Where you run the whole operation.</p>
            <div className="cards">
              <div className="card"><h4>Pipeline / CRM</h4><ul><li>Leads → proposals → signed → active → done</li><li>Pipeline value &amp; conversion</li></ul></div>
              <div className="card"><h4>Projects</h4><ul><li>Create project, set scope &amp; timeline</li><li><strong>Set payment terms (full / deposit %)</strong></li><li>Manage phases &amp; deliverables</li></ul></div>
              <div className="card"><h4>Contracts</h4><ul><li>Generate from template</li><li>Send for signature, track status</li></ul></div>
              <div className="card"><h4>Payments</h4><ul><li>Collected vs outstanding</li><li>Trigger balance invoices</li><li>Stripe sync</li></ul></div>
              <div className="card"><h4>Automations</h4><ul><li>Toggle &amp; edit triggers</li><li>Email sequence templates</li></ul></div>
              <div className="card"><h4>Analytics</h4><ul><li>Revenue, active projects</li><li>Funnel conversion, cycle time</li></ul></div>
            </div>
          </section>

          <section id="data">
            <h2><span className="no">10</span> Data model</h2>
            <table>
              <tbody>
                <tr><th>Entity</th><th>Key fields</th></tr>
                <tr><td><code>User</code></td><td>id, role (prospect/client/admin), name, email, auth</td></tr>
                <tr><td><code>Lead</code></td><td>id, contact, brief, source, status, created_at</td></tr>
                <tr><td><code>Proposal</code></td><td>id, lead_id, scope, price, payment_plan, status, viewed_at</td></tr>
                <tr><td><code>Contract</code></td><td>id, proposal_id, template, signed_at, signer_meta, pdf_url</td></tr>
                <tr><td><code>Project</code></td><td>id, client_id, status, current_phase, start, est_launch</td></tr>
                <tr><td><code>Phase</code></td><td>id, project_id, name, status, order, deliverables[]</td></tr>
                <tr><td><code>Invoice</code></td><td>id, project_id, amount, type (deposit/balance), status, stripe_id</td></tr>
                <tr><td><code>Approval</code></td><td>id, project_id, item, status, decided_at</td></tr>
                <tr><td><code>Message</code></td><td>id, project_id, author, body, attachments, sent_at</td></tr>
                <tr><td><code>Event</code></td><td>id, type, payload, fired_at (drives automations + audit)</td></tr>
              </tbody>
            </table>
          </section>

          <section id="stack">
            <h2><span className="no">11</span> Tech &amp; integrations</h2>
            <table>
              <tbody>
                <tr><th>Layer</th><th>Choice</th><th>Why</th></tr>
                <tr><td>Frontend</td><td>Next.js / React</td><td>Your stack; SSR for speed &amp; SEO on marketing pages.</td></tr>
                <tr><td>Backend / API</td><td>Node + PostgreSQL (Railway)</td><td>Relational data (projects, invoices) fits SQL cleanly.</td></tr>
                <tr><td>Auth</td><td>Email magic-link</td><td>Frictionless for clients; no passwords to manage.</td></tr>
                <tr><td>Payments</td><td>Stripe (Checkout + Invoices + webhooks)</td><td>Handles cards, receipts, deposits; you stay sole-trader-friendly.</td></tr>
                <tr><td>E-sign</td><td>Documenso / DocuSeal / Dropbox Sign</td><td>Swappable; open-source options keep cost down early.</td></tr>
                <tr><td>Email / automations</td><td>Resend or Postmark + a job queue</td><td>Transactional + sequenced reminders.</td></tr>
                <tr><td>Storage</td><td>S3-compatible</td><td>Contracts, deliverables, asset uploads.</td></tr>
                <tr><td>Hosting</td><td>Vercel + Railway Postgres</td><td>Fast deploys, scales with you.</td></tr>
              </tbody>
            </table>
          </section>

          <section id="security">
            <h2><span className="no">12</span> Security &amp; compliance</h2>
            <ul>
              <li><strong>Auth &amp; RBAC</strong> — strict role separation; clients only ever see their own project.</li>
              <li><strong>Stripe webhooks</strong> — signature-verified; payment state never trusted from the client.</li>
              <li><strong>E-sign audit trail</strong> — immutable record of signature events.</li>
              <li><strong>Encryption</strong> — TLS in transit, encrypted at rest; documents in private storage with signed URLs.</li>
              <li><strong>UK GDPR</strong> — lawful basis, data export &amp; deletion, clear privacy policy.</li>
              <li><strong>Backups &amp; audit log</strong> — every state change recorded via the <code>Event</code> table.</li>
            </ul>
          </section>

          <section id="roadmap">
            <h2><span className="no">13</span> Build roadmap</h2>
            <div className="flow">
              <div className="step"><div className="sn">1</div><div><h4>Phase 1 — Core spine (MVP)</h4><p>Lead capture, manual proposal, e-sign, Stripe deposit, basic client portal with phases. Gets you taking signed, paid clients online.</p><span className="who">Get to revenue</span></div></div>
              <div className="step"><div className="sn">2</div><div><h4>Phase 2 — Admin portal &amp; automations</h4><p>Full pipeline/CRM, payment-term config, automated emails &amp; reminders, balance invoicing, approvals.</p><span className="who">Remove manual work</span></div></div>
              <div className="step"><div className="sn">3</div><div><h4>Phase 3 — Scale &amp; polish</h4><p>Analytics, templates library, support retainers, multi-team admin, white-glove client experience.</p><span className="who">Become a company</span></div></div>
            </div>
            <div className="callout"><div className="ct">Recommendation</div>Build Phase 1 first and start signing clients with it immediately — it pays for the rest. Don&rsquo;t wait for the full system to launch.</div>
          </section>
        </main>
      </div>
    </div>
  );
}
