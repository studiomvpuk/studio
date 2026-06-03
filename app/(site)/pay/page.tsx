import type { Metadata } from "next";
import PayCard from "../../components/PayCard";

export const metadata: Metadata = { title: "Pay an invoice — StudioMVP" };

export default function PayPage() {
  return (
    <section style={{ paddingTop: 150 }} id="pay">
      <div className="wrap">
        <div className="pay reveal">
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
  );
}
