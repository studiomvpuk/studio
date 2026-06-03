import { dbConfigured, safeQuery } from "./db";
import { sendEmail, base } from "./email";

/**
 * Central automation dispatcher. Every meaningful state change calls dispatch();
 * it records an Event (audit + future triggers) and fires the side effects the
 * spec describes (emails, etc.). Safe to call in demo mode — it just no-ops the DB.
 */
export type EventType =
  | "lead.created"
  | "proposal.sent"
  | "contract.signed"
  | "invoice.created"
  | "invoice.paid"
  | "project.activated"
  | "phase.completed"
  | "project.completed";

export async function dispatch(type: EventType, payload: Record<string, unknown>): Promise<void> {
  if (dbConfigured) {
    await safeQuery(`insert into events (type, payload) values ($1, $2)`, [type, JSON.stringify(payload)]);
  }
  try {
    await react(type, payload);
  } catch (err) {
    console.warn(`[automation] ${type} side-effect failed:`, (err as Error).message);
  }
}

async function react(type: EventType, p: Record<string, unknown>): Promise<void> {
  const email = String(p.email || "");
  const name = String(p.name || "there");

  switch (type) {
    case "lead.created":
      if (email) {
        await sendEmail({
          to: email,
          subject: "Thanks — we've got your project brief",
          html: `<p>Hi ${name},</p><p>Thanks for telling us about your idea. We'll review it and come back within a day with next steps.</p><p>— StudioMVP</p>`,
        });
      }
      break;

    case "proposal.sent":
      if (email && p.token) {
        await sendEmail({
          to: email,
          subject: "Your StudioMVP proposal",
          html: `<p>Hi ${name},</p><p>Your proposal is ready to review and sign:</p><p><a href="${base()}/proposal/${p.token}">View &amp; sign your proposal →</a></p>`,
        });
      }
      break;

    case "contract.signed":
      if (email) {
        await sendEmail({
          to: email,
          subject: "Contract signed — your project is set up",
          html: `<p>Hi ${name},</p><p>Thanks for signing. Your project workspace is ready and your first invoice has been issued.</p><p><a href="${base()}/dashboard">Open your dashboard →</a></p>`,
        });
      }
      break;

    case "invoice.paid":
      if (email) {
        await sendEmail({
          to: email,
          subject: "Payment received — receipt",
          html: `<p>Hi ${name},</p><p>We've received your payment. A receipt from Stripe is on its way. Your portal is now active.</p>`,
        });
      }
      break;

    case "project.completed":
      if (email) {
        await sendEmail({
          to: email,
          subject: "Your project is complete 🎉",
          html: `<p>Hi ${name},</p><p>Your handover pack is ready. We'd love a quick testimonial — and we're here if you'd like ongoing support.</p>`,
        });
      }
      break;

    default:
      break;
  }
}
