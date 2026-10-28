import { NextResponse } from "next/server";
import { AuditError, auditWebsite } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Best-effort rate limit per IP. On serverless hosting each instance keeps its
 * own counter, so this slows casual abuse but is not a hard guarantee. Add a
 * shared store (e.g. Upstash Redis) before opening this up widely.
 */
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 15;
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
    return NextResponse.json(
      { error: "You've run a lot of audits in the last hour. Please try again later." },
      { status: 429 }
    );
  }

  let url: unknown;
  try {
    const body = await request.json();
    url = body?.url;
  } catch {
    return NextResponse.json({ error: "Send the website address as JSON." }, { status: 400 });
  }
  if (typeof url !== "string") {
    return NextResponse.json({ error: "Enter a website address to audit." }, { status: 400 });
  }

  try {
    const report = await auditWebsite(url);
    return NextResponse.json(report);
  } catch (err) {
    if (err instanceof AuditError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Audit failed", err);
    return NextResponse.json(
      { error: "Something went wrong while analysing that website. Please try again." },
      { status: 500 }
    );
  }
}
