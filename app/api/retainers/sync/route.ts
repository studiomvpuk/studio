import { NextResponse } from "next/server";
import { dbConfigured } from "@/lib/db";
import { ensureSchema } from "@/lib/migrate";
import { getSession } from "@/lib/auth";
import { stripeConfigured } from "@/lib/stripe";
import { syncRetainersFromStripe } from "@/lib/retainer-credit";

// Admin: pull any paid-but-unrecorded retainer payments from Stripe.
export async function POST() {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Admins only." }, { status: 403 });
  if (!dbConfigured) return NextResponse.json({ error: "Database isn't connected." }, { status: 503 });
  if (!stripeConfigured) return NextResponse.json({ error: "Stripe isn't configured." }, { status: 503 });
  await ensureSchema();

  try {
    const credited = await syncRetainersFromStripe();
    return NextResponse.json({ ok: true, credited });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
