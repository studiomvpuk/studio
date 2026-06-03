import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { dbConfigured, query } from "@/lib/db";
import { ensureSchema } from "@/lib/migrate";
import { getSession } from "@/lib/auth";
import { sendEmail, base } from "@/lib/email";

// Admin generates a shareable payment link for an arbitrary amount.
export async function POST(req: Request) {
  const session = await getSession();
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }
  if (!dbConfigured) {
    return NextResponse.json({ error: "Database isn't connected." }, { status: 503 });
  }

  const b = await req.json().catch(() => ({}));
  const description = String(b.description || "").trim();
  const amountCents = Math.round(Number(b.amount) * 100);
  const clientEmail = String(b.clientEmail || "").trim() || null;
  const clientName = String(b.clientName || "").trim() || null;
  const notify = Boolean(b.notify);

  if (!description) return NextResponse.json({ error: "Add a description." }, { status: 400 });
  if (!Number.isFinite(amountCents) || amountCents < 100) {
    return NextResponse.json({ error: "Enter an amount of £1 or more." }, { status: 400 });
  }

  await ensureSchema();
  const token = randomBytes(20).toString("hex");
  await query(
    `insert into payment_links (description, amount_cents, client_email, client_name, token)
     values ($1, $2, $3, $4, $5)`,
    [description, amountCents, clientEmail, clientName, token]
  );

  const url = `${base()}/pay/${token}`;

  // Optionally email the link straight to the client.
  if (notify && clientEmail) {
    const amount = "£" + (amountCents / 100).toLocaleString("en-GB");
    await sendEmail({
      to: clientEmail,
      subject: `Payment request from StudioMVP — ${amount}`,
      html: `<p>Hi ${clientName || "there"},</p>
             <p>Here's a secure link to pay <b>${amount}</b> for <b>${description}</b>:</p>
             <p><a href="${url}">Pay ${amount} →</a></p>
             <p>Paid securely by card via Stripe.</p><p>— StudioMVP</p>`,
    });
  }

  return NextResponse.json({ ok: true, token, url });
}
