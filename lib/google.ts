// Minimal Google OAuth 2.0 (authorization-code) helpers.
// No extra dependency — plugs into our own session system in lib/auth.ts.

export const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";

/** Where Google sends the user back. Must match a URI registered in the Cloud Console. */
export function googleRedirectUri(base: string): string {
  return `${base}/api/auth/google/callback`;
}

/** Build the consent-screen URL we send the user to. */
export function googleAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

export type GoogleProfile = { email: string; name: string | null; emailVerified: boolean };

/** Exchange the auth code for tokens, then read the user's profile. Returns null on any failure. */
export async function exchangeGoogleCode(code: string, redirectUri: string): Promise<GoogleProfile | null> {
  try {
    const tokenRes = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) return null;
    const tokens = (await tokenRes.json()) as { access_token?: string };
    if (!tokens.access_token) return null;

    const infoRes = await fetch(USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!infoRes.ok) return null;
    const info = (await infoRes.json()) as { email?: string; name?: string; email_verified?: boolean };
    if (!info.email) return null;

    return {
      email: String(info.email).toLowerCase().trim(),
      name: info.name ?? null,
      emailVerified: Boolean(info.email_verified),
    };
  } catch {
    return null;
  }
}
