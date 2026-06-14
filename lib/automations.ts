import { dbConfigured, safeQuery } from "./db";
import { sendEmail, renderEmail, base } from "./email";

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
  | "retainer.created"
  | "task.created"
  | "task.done"
  | "task.confirmed"
  | "project.activated"
  | "phase.completed"
  | "project.completed";

const PERIOD_WORD: Record<string, string> = { monthly: "month", quarterly: "quarter", halfyearly: "half-year", yearly: "year" };
const gbp = (cents: number) => "£" + (Number(cents) / 100).toLocaleString("en-GB");
const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

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
          html: renderEmail({
            preheader: "We've received your brief and we'll be in touch within a day.",
            heading: "We've got your brief",
            intro: `Hi ${name},`,
            paragraphs: [
              "Thanks for telling us about your idea. We'll review it and come back within a day with the next steps — a plan, a timeline and a price.",
              "If there's anything else we should know in the meantime, just reply to this email.",
            ],
          }),
        });
      }
      break;

    case "proposal.sent":
      if (email && p.token) {
        await sendEmail({
          to: email,
          subject: "Your StudioMVP proposal",
          html: renderEmail({
            preheader: "Your proposal is ready to review and sign.",
            heading: "Your proposal is ready",
            intro: `Hi ${name},`,
            paragraphs: ["Your proposal is ready to review and sign online — scope, timeline and pricing, all in one place."],
            cta: { label: "View & sign your proposal →", url: `${base()}/proposal/${p.token}` },
          }),
        });
      }
      break;

    case "contract.signed":
      if (email) {
        await sendEmail({
          to: email,
          subject: "Contract signed — your project is set up",
          html: renderEmail({
            preheader: "Your project workspace is ready.",
            heading: "You're all set",
            intro: `Hi ${name},`,
            paragraphs: [
              "Thanks for signing. Your project workspace is ready, and your first invoice has been issued.",
              "From your dashboard you can follow progress, approve work, settle invoices and message the team — all in one place.",
            ],
            cta: { label: "Open your dashboard →", url: `${base()}/dashboard` },
          }),
        });
      }
      break;

    case "invoice.paid":
      if (email) {
        await sendEmail({
          to: email,
          subject: "Payment received — thank you",
          html: renderEmail({
            preheader: "We've received your payment.",
            heading: "Payment received",
            intro: `Hi ${name},`,
            paragraphs: ["We've received your payment — thank you. A receipt from Stripe is on its way, and your portal is fully active."],
            cta: { label: "Open your dashboard →", url: `${base()}/dashboard` },
          }),
        });
      }
      break;

    case "retainer.created":
      if (email) {
        const amount = gbp(Number(p.amountCents));
        const per = PERIOD_WORD[String(p.period)] || "month";
        const due = p.nextDue ? longDate(String(p.nextDue)) : "shortly";
        await sendEmail({
          to: email,
          subject: "Your ongoing plan with StudioMVP",
          html: renderEmail({
            preheader: `${amount} per ${per} — first payment due ${due}.`,
            heading: "Your ongoing plan is set up",
            intro: `Hi ${name},`,
            paragraphs: [
              `We've set up <strong>${String(p.title || "your retainer")}</strong> — ${amount} per ${per}, keeping things moving on an ongoing basis.`,
              `Your first payment is due <strong>${due}</strong>. You can pay it in a couple of taps from your dashboard, and you'll always see what's next and your full payment history there.`,
            ],
            cta: { label: "View your plan & pay →", url: `${base()}/dashboard/retainer` },
            footnote: "Need to change anything? Just reply to this email and we'll sort it.",
          }),
        });
      }
      break;

    case "task.created":
      if (email) {
        const who = String(p.who || "Someone");
        const project = String(p.project || "your project");
        const title = String(p.title || "a task");
        await sendEmail({
          to: email,
          subject: `New task on ${project}: ${title}`,
          html: renderEmail({
            preheader: `${who} added "${title}" to ${project}.`,
            heading: "A new task was added",
            intro: `Hi ${name},`,
            paragraphs: [
              `${who} added <strong>${title}</strong> to <strong>${project}</strong>.`,
              "Open the project board to set it in progress, leave a comment, or mark it done when it's complete.",
            ],
            cta: { label: "Open the project board →", url: `${base()}/dashboard/tasks` },
          }),
        });
      }
      break;

    case "task.done":
      if (email) {
        const project = String(p.project || "your project");
        const title = String(p.title || "your task");
        await sendEmail({
          to: email,
          subject: `Done — please confirm: ${title}`,
          html: renderEmail({
            preheader: `We've completed "${title}". Please review and confirm.`,
            heading: "We've marked a task done",
            intro: `Hi ${name},`,
            paragraphs: [
              `We've completed <strong>${title}</strong> on <strong>${project}</strong>.`,
              "Please take a look and confirm it's all good — or leave a comment if anything still needs a tweak.",
            ],
            cta: { label: "Review & confirm →", url: `${base()}/dashboard/tasks` },
          }),
        });
      }
      break;

    case "task.confirmed":
      if (email) {
        const who = String(p.who || "The client");
        const project = String(p.project || "a project");
        const title = String(p.title || "a task");
        await sendEmail({
          to: email,
          subject: `Confirmed complete: ${title}`,
          html: renderEmail({
            preheader: `${who} confirmed "${title}" is complete.`,
            heading: "A task was confirmed complete",
            intro: `Hi ${name},`,
            paragraphs: [`${who} confirmed <strong>${title}</strong> on <strong>${project}</strong> is complete. Nothing further needed.`],
          }),
        });
      }
      break;

    case "project.completed":
      if (email) {
        await sendEmail({
          to: email,
          subject: "Your project is complete 🎉",
          html: renderEmail({
            preheader: "Your handover pack is ready.",
            heading: "Your project is complete 🎉",
            intro: `Hi ${name},`,
            paragraphs: [
              "Your handover pack is ready — it's been a pleasure building this with you.",
              "We'd love a quick testimonial, and we're here whenever you'd like ongoing support or the next thing.",
            ],
            cta: { label: "Open your dashboard →", url: `${base()}/dashboard` },
          }),
        });
      }
      break;

    default:
      break;
  }
}
