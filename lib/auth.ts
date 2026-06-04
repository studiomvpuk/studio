import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { query, safeQuery } from "./db";
import { renderEmail } from "./email";

export type Role = "prospect" | "client" | "admin";
export type Session = { userId: string; email: string; role: Role; name: string | null };

const COOKIE = "mvp_session";
const secret = () =>
  new TextEncoder().encode(process.env.SESSION_SECRET || "dev-insecure-secret-change-me");

/* ── session cookie (stateless JWT) ── */
export async function createSession(s: Session) {
  const token = await new SignJWT(s as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      userId: String(payload.userId),
      email: String(payload.email),
      role: payload.role as Role,
      name: (payload.name as string) ?? null,
    };
  } catch {
    return null;
  }
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

/* ── magic-link tokens (DB-backed) ── */
const hash = (t: string) => createHash("sha256").update(t).digest("hex");

export async function createMagicToken(email: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 min
  await query(
    `insert into magic_tokens (email, token_hash, expires_at) values ($1, $2, $3)`,
    [email.toLowerCase().trim(), hash(token), expires]
  );
  return token;
}

/** Verify a magic token, find-or-create the user, and return them. Returns null if invalid. */
export async function consumeMagicToken(token: string): Promise<Session | null> {
  const rows = await safeQuery<{ id: string; email: string }>(
    `update magic_tokens set used = true
       where token_hash = $1 and used = false and expires_at > now()
       returning id, email`,
    [hash(token)]
  );
  if (!rows.length) return null;
  const email = rows[0].email;

  let users = await query<{ id: string; email: string; role: Role; name: string | null }>(
    `select id, email, role, name from users where email = $1`,
    [email]
  );
  if (!users.length) {
    users = await query(
      `insert into users (email, role) values ($1, 'prospect') returning id, email, role, name`,
      [email]
    );
  }
  const u = users[0];
  return { userId: u.id, email: u.email, role: u.role, name: u.name };
}

/** Find-or-create a user from a verified OAuth identity (e.g. Google). */
export async function upsertOAuthUser(email: string, name: string | null): Promise<Session> {
  const normalized = email.toLowerCase().trim();
  const adminEmail = (process.env.ADMIN_EMAIL || "officialstudiomvp@gmail.com").toLowerCase().trim();

  let users = await query<{ id: string; email: string; role: Role; name: string | null }>(
    `select id, email, role, name from users where email = $1`,
    [normalized]
  );

  if (!users.length) {
    const role: Role = normalized === adminEmail ? "admin" : "prospect";
    users = await query(
      `insert into users (email, role, name) values ($1, $2, $3) returning id, email, role, name`,
      [normalized, role, name]
    );
  } else {
    // Backfill the name from Google, and make sure the studio owner is always admin.
    if (name && !users[0].name) {
      await query(`update users set name = $1 where id = $2`, [name, users[0].id]);
      users[0].name = name;
    }
    if (normalized === adminEmail && users[0].role !== "admin") {
      await query(`update users set role = 'admin' where id = $1`, [users[0].id]);
      users[0].role = "admin";
    }
  }

  const u = users[0];
  return { userId: u.id, email: u.email, role: u.role, name: u.name };
}

/* ── magic-link email (Resend if configured, else dev log) ── */
export async function sendMagicLink(email: string, link: string): Promise<{ devLink?: string }> {
  if (process.env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "StudioMVP <onboarding@resend.dev>",
        to: email,
        subject: "Your StudioMVP sign-in link",
        html: renderEmail({
          preheader: "Your secure sign-in link — expires in 30 minutes.",
          heading: "Sign in to StudioMVP",
          paragraphs: ["Click the button below to sign in to your portal. This link is just for you and expires in 30 minutes."],
          cta: { label: "Sign in →", url: link },
          footnote: "If you didn't request this, you can safely ignore this email — no one can sign in without the link.",
        }),
      }),
    });
    return {};
  }
  console.log(`\n🔗 Magic link for ${email}:\n${link}\n`);
  return { devLink: link };
}
