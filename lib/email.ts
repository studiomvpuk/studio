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

/* ───────── Premium branded email template ───────── */
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const SERIF = "Georgia,'Times New Roman',serif";

/** A bulletproof (table-based) dark CTA button. */
export function emailButton(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:30px 0 6px;">
    <tr><td align="center" bgcolor="#0a0a0c" style="border-radius:11px;">
      <a href="${url}" style="display:inline-block;padding:15px 32px;font-family:${SANS};font-size:15px;font-weight:600;letter-spacing:.01em;color:#ffffff;text-decoration:none;border-radius:11px;">${label}</a>
    </td></tr></table>`;
}

export type EmailContent = {
  preheader?: string;
  heading: string;
  intro?: string;
  paragraphs?: string[];
  cta?: { label: string; url: string };
  footnote?: string;
};

/** Wrap structured content in the StudioMVP-branded HTML shell. */
export function renderEmail(c: EmailContent): string {
  const site = base();
  const para = (c.paragraphs || [])
    .map((p) => `<p style="margin:0 0 16px;font-family:${SANS};font-size:15px;line-height:1.7;color:#3a3a3f;">${p}</p>`)
    .join("");

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
</head>
<body style="margin:0;padding:0;background:#f3f2ef;-webkit-font-smoothing:antialiased;">
${c.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${c.preheader}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f2ef;">
  <tr><td align="center" style="padding:36px 16px;">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e7e7e6;border-radius:18px;overflow:hidden;">
      <tr><td style="background:#0a0a0c;padding:24px 36px;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:11px;"><img src="${site}/logo.jpg" width="34" height="34" alt="" style="display:block;border-radius:8px;background:#ffffff;"></td>
          <td style="font-family:${SERIF};font-size:22px;color:#ffffff;letter-spacing:.01em;">StudioMVP</td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:42px 36px 10px;">
        <h1 style="margin:0 0 18px;font-family:${SERIF};font-weight:400;font-size:27px;line-height:1.22;color:#0a0a0c;">${c.heading}</h1>
        ${c.intro ? `<p style="margin:0 0 16px;font-family:${SANS};font-size:15px;line-height:1.7;color:#3a3a3f;">${c.intro}</p>` : ""}
        ${para}
        ${c.cta ? emailButton(c.cta.label, c.cta.url) : ""}
        ${c.footnote ? `<p style="margin:18px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:#9a9aa2;">${c.footnote}</p>` : ""}
      </td></tr>
      <tr><td style="padding:26px 36px;border-top:1px solid #efefee;">
        <p style="margin:0;font-family:${SANS};font-size:13px;line-height:1.65;color:#9a9aa2;">StudioMVP — a product studio for founders who are serious.<br>
        <a href="${site}" style="color:#0a0a0c;text-decoration:none;">studiomvp.co.uk</a></p>
      </td></tr>
    </table>
    <p style="margin:18px 0 0;font-family:${SANS};font-size:12px;color:#b3b3b0;">© 2026 StudioMVP · Product studio · United Kingdom</p>
  </td></tr>
</table>
</body></html>`;
}
