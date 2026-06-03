import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = () =>
  new TextEncoder().encode(process.env.SESSION_SECRET || "dev-insecure-secret-change-me");

async function roleFromCookie(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get("mvp_session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return (payload.role as string) ?? null;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  // Demo mode: no database configured yet → leave the static dashboards open.
  if (!process.env.DATABASE_URL) return NextResponse.next();

  const { pathname } = req.nextUrl;
  const role = await roleFromCookie(req);

  const needsAdmin = pathname.startsWith("/admin");
  const needsClient = pathname.startsWith("/dashboard");

  if ((needsAdmin || needsClient) && !role) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (needsAdmin && role !== "admin") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/dashboard", "/dashboard/:path*"],
};
