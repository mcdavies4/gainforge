import { NextResponse } from "next/server";
import { sendLeadToWebhook, type LeadData } from "@/lib/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Collects early-access signups from the auditor.
 *
 * Uses sendLeadToWebhook to securely POST each signup to LEAD_WEBHOOK_URL (e.g. Make or Zapier).
 */
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 6;
const hits = new Map<string, { count: number; resetAt: number }>();

function isLimited(ip: string): boolean {
  const now = Date.now();
  if (hits.size > 1000) {
    for (const [key, entry] of hits) if (entry.resetAt < now) hits.delete(key);
  }
  const entry = hits.get(ip);
  if (!entry || entry.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isLimited(ip)) {
    return NextResponse.json({ error: "Too many sign-ups from this connection. Please try again later." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    body = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const result = await sendLeadToWebhook(body as LeadData);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    const status = message.includes("valid email") || message.includes("tick the box") ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
