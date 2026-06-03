export type Mail = { to: string; subject: string; html: string };

/** Send via Resend if configured, else log (dev). Never throws. */
export async function sendEmail(mail: Mail): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n✉️  [email:dev] → ${mail.to}\n   ${mail.subject}\n`);
    return;
  }
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "StudioMVP <onboarding@resend.dev>",
        to: mail.to,
        subject: mail.subject,
        html: mail.html,
      }),
    });
  } catch (err) {
    console.warn("[email] send failed:", (err as Error).message);
  }
}

export const base = () => process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
