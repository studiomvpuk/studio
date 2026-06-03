import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPaymentLink } from "@/lib/data";
import PayNowButton from "./PayNowButton";

export const metadata: Metadata = { title: "Payment — StudioMVP" };

export default async function PayLinkPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ paid?: string; canceled?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const link = await getPaymentLink(token);
  if (!link) notFound();

  const paid = link.status === "paid" || sp.paid === "1";

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand">StudioMVP</div>

        {paid ? (
          <>
            <div className="pay-amount">{link.amount}</div>
            <div className="auth-msg" style={{ marginTop: 4 }}>✓ Paid — thank you{link.clientName ? `, ${link.clientName}` : ""}. A receipt from Stripe is on its way.</div>
            <div className="auth-foot"><Link href="/">← Back to studiomvp.co.uk</Link></div>
          </>
        ) : link.status === "void" ? (
          <>
            <div className="sub">This payment link has been cancelled. Please contact StudioMVP for a new one.</div>
            <div className="auth-foot"><Link href="/">← Back to studiomvp.co.uk</Link></div>
          </>
        ) : (
          <>
            <div className="sub">{link.clientName ? `Hi ${link.clientName} — here's` : "Here's"} your secure payment, processed by Stripe.</div>
            <div className="pay-line">
              <span>{link.description}</span>
              <b className="pay-amount">{link.amount}</b>
            </div>
            {sp.canceled === "1" ? <div className="auth-error">Payment was cancelled — you can try again below.</div> : null}
            <PayNowButton token={token} label={`Pay ${link.amount} →`} />
            <div className="auth-msg">Encrypted &amp; PCI-compliant via Stripe. No account needed.</div>
            <div className="auth-foot"><Link href="/">← Back to studiomvp.co.uk</Link></div>
          </>
        )}
      </div>
    </div>
  );
}
