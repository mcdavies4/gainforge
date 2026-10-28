import { lookup } from "node:dns/promises";
import net from "node:net";
import type { AuditReport, Finding, Severity } from "./audit-types";

export type { AuditReport, Finding, Severity } from "./audit-types";

export class AuditError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "AuditError";
    this.status = status;
  }
}

const TIMEOUT_MS = 10_000;
const MAX_BYTES = 1_500_000;
const MAX_REDIRECTS = 5;
const USER_AGENT =
  "Mozilla/5.0 (compatible; GainForgeAuditBot/1.0; +https://gainforge-ten.vercel.app)";

/* -------------------------------------------------------------------------- */
/* URL handling and network safety                                             */
/* -------------------------------------------------------------------------- */

export function normaliseUrl(input: string): string {
  let raw = (input ?? "").trim();
  if (!raw) throw new AuditError("Enter a website address to audit.");
  if (raw.length > 2048) throw new AuditError("That address is too long.");
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = `https://${raw}`;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new AuditError("That doesn't look like a valid website address.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new AuditError("Only http and https website addresses can be audited.");
  }
  if (url.username || url.password) {
    throw new AuditError("Remove any username or password from the address.");
  }
  const host = url.hostname.toLowerCase();
  const looksLocal =
    host === "localhost" ||
    (!host.includes(".") && !host.includes(":") && !net.isIP(host));
  if (looksLocal) {
    throw new AuditError("Enter a public website address, such as yourbusiness.com.");
  }
  return url.toString();
}

function isPrivateIPv4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  const v6 = ip.toLowerCase();
  if (v6 === "::" || v6 === "::1") return true;
  if (v6.startsWith("::ffff:")) {
    const tail = v6.slice(7);
    return net.isIPv4(tail) ? isPrivateIPv4(tail) : true;
  }
  return /^f[cd]/.test(v6) || /^fe[89ab]/.test(v6) || v6.startsWith("ff");
}

/** Stops the auditor being used to reach internal or private network addresses. */
async function assertPublicHost(hostname: string): Promise<void> {
  const host = hostname.replace(/^\[|\]$/g, "");
  let addresses: string[];
  if (net.isIP(host)) {
    addresses = [host];
  } else {
    try {
      addresses = (await lookup(host, { all: true })).map((a) => a.address);
    } catch {
      throw new AuditError(
        "We couldn't find that website. Check the address and try again.",
        422
      );
    }
  }
  if (addresses.length === 0 || addresses.some(isPrivateIp)) {
    throw new AuditError("That address isn't a public website we can audit.", 422);
  }
}

async function readLimited(res: Response): Promise<{ html: string; truncated: boolean }> {
  if (!res.body) return { html: "", truncated: false };
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  let truncated = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const remaining = MAX_BYTES - received;
    if (value.length > remaining) {
      chunks.push(value.subarray(0, remaining));
      truncated = true;
      await reader.cancel();
      break;
    }
    received += value.length;
    chunks.push(value);
  }
  return { html: new TextDecoder("utf-8").decode(Buffer.concat(chunks)), truncated };
}

async function fetchPage(
  startUrl: string
): Promise<{ html: string; finalUrl: string; truncated: boolean }> {
  let current = startUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const target = new URL(current);
    await assertPublicHost(target.hostname);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      let res: Response;
      try {
        res = await fetch(target, {
          redirect: "manual",
          signal: controller.signal,
          cache: "no-store",
          headers: {
            "user-agent": USER_AGENT,
            accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
            "accept-language": "en",
          },
        });
      } catch {
        throw new AuditError(
          "We couldn't reach that website. Check the address, or the site may be blocking automated requests.",
          422
        );
      }

      const location = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && location) {
        await res.body?.cancel();
        let next: URL;
        try {
          next = new URL(location, target);
        } catch {
          throw new AuditError("The website redirected to an invalid address.", 422);
        }
        if (next.protocol !== "http:" && next.protocol !== "https:") {
          throw new AuditError("The website redirected to an unsupported address.", 422);
        }
        current = next.toString();
        continue;
      }

      if (res.status >= 400) {
        await res.body?.cancel();
        throw new AuditError(
          `The website returned an error (HTTP ${res.status}). It may be down or blocking automated requests.`,
          422
        );
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (contentType && !/html|xml/i.test(contentType)) {
        await res.body?.cancel();
        throw new AuditError("That address didn't return a web page we can analyse.", 422);
      }

      const { html, truncated } = await readLimited(res);
      return { html, finalUrl: target.toString(), truncated };
    } catch (err) {
      if (err instanceof AuditError) throw err;
      throw new AuditError(
        "The website took too long to respond, or the page couldn't be downloaded.",
        422
      );
    } finally {
      clearTimeout(timer);
    }
  }
  throw new AuditError("The website redirected too many times.", 422);
}

/* -------------------------------------------------------------------------- */
/* HTML parsing helpers (no dependencies)                                      */
/* -------------------------------------------------------------------------- */

const collapse = (s: string) => s.replace(/\s+/g, " ").trim();

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n: string) => {
      try {
        return String.fromCodePoint(Number(n));
      } catch {
        return " ";
      }
    });
}

const stripTags = (s: string) => collapse(decodeEntities(s.replace(/<[^>]*>/g, " ")));
const shorten = (s: string, n = 90) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const unique = <T>(items: T[]) => [...new Set(items)];

function parseAttrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  const inner = tag.replace(/^<\s*[a-z0-9-]+/i, "");
  const re = /([a-zA-Z_:][-\w:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(inner)) !== null) {
    out[m[1].toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? "");
  }
  return out;
}

const CTA_PHRASES = [
  "book a call", "book a demo", "book a free", "book now", "book an appointment",
  "book a consultation", "book online", "get started", "get a quote", "get a free quote",
  "get an estimate", "get a free estimate", "request a quote", "request a demo",
  "request a call", "request a callback", "contact us", "call us", "call now",
  "get in touch", "sign up", "start free", "start your free", "free trial",
  "try it free", "try free", "try for free", "buy now", "shop now", "order now",
  "schedule a", "subscribe", "join now", "join free", "enquire", "inquire",
  "free audit", "free consultation", "free quote", "free estimate", "get your free",
  "start now", "get access", "view pricing", "see pricing",
];

/* -------------------------------------------------------------------------- */
/* The audit itself                                                            */
/* -------------------------------------------------------------------------- */

const WEIGHTS: Record<Severity, number> = { high: 15, medium: 8, low: 3, pass: 0 };
const ORDER: Record<Severity, number> = { high: 0, medium: 1, low: 2, pass: 3 };

export function analyseHtml(
  html: string,
  requestedUrl: string,
  finalUrl: string,
  truncated = false
): AuditReport {
  const findings: Finding[] = [];
  const add = (f: Finding) => findings.push(f);

  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => parseAttrs(m[0]));
  const meta = (key: string) =>
    metas
      .find((m) => (m.name?.toLowerCase() === key || m.property?.toLowerCase() === key) && m.content)
      ?.content?.trim() ?? "";
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => parseAttrs(m[0]));

  const body = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|template|head)\b[\s\S]*?<\/\1>/gi, " ");
  const text = stripTags(body);
  const words = text ? text.split(" ").length : 0;
  const scriptCount = (html.match(/<script\b/gi) ?? []).length;
  const jsHint = words < 100 && scriptCount >= 3;
  const jsNote = jsHint
    ? " This page seems to load its content with JavaScript, so this may be a limit of the check rather than a real problem."
    : "";

  const headings = [...body.matchAll(/<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => ({
    level: Number(m[1]),
    text: stripTags(m[2]),
  }));
  const h1s = headings.filter((h) => h.level === 1 && h.text);

  const clickable: string[] = [];
  for (const m of body.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)) clickable.push(stripTags(m[1]));
  for (const m of body.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/gi)) clickable.push(stripTags(m[1]));
  for (const m of body.matchAll(/<input\b[^>]*>/gi)) {
    const a = parseAttrs(m[0]);
    if (/^(submit|button)$/i.test(a.type ?? "") && a.value) clickable.push(a.value);
  }
  const ctas = unique(
    clickable.filter(
      (t) => t.length > 0 && t.length <= 60 && CTA_PHRASES.some((p) => t.toLowerCase().includes(p))
    )
  );

  const images = [...body.matchAll(/<img\b[^>]*>/gi)].map((m) => parseAttrs(m[0]));
  const missingAlt = images.filter((i) => i.alt === undefined).length;

  /* ---- Search presentation ------------------------------------------------ */
  const title = stripTags(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  const titleHypothesis =
    "A clearer title may help the right people recognise and click your result in search. Test it by watching clicks in Google Search Console.";
  if (!title) {
    add({
      id: "title-missing", category: "Search", severity: "high",
      title: "No page title found",
      evidence: "The page has no <title> tag, or it is empty.",
      recommendation: "Add a unique title of about 30–60 characters that names your business and the main thing you offer.",
      hypothesis: titleHypothesis,
    });
  } else if (title.length < 20) {
    add({
      id: "title-short", category: "Search", severity: "medium",
      title: "Page title is very short",
      evidence: `The title is “${title}” (${title.length} characters).`,
      recommendation: "Expand it to about 30–60 characters so it says what you do and who it is for, not just your name.",
      hypothesis: titleHypothesis,
    });
  } else if (title.length > 65) {
    add({
      id: "title-long", category: "Search", severity: "low",
      title: "Page title may be cut off in search results",
      evidence: `The title is ${title.length} characters: “${shorten(title, 110)}”.`,
      recommendation: "Put the most important words first and aim for 60 characters or fewer.",
    });
  } else {
    add({
      id: "title-ok", category: "Search", severity: "pass",
      title: "Page title is a sensible length",
      evidence: `“${title}” (${title.length} characters).`,
      recommendation: "Nothing to change here.",
    });
  }

  const description = meta("description");
  if (!description) {
    add({
      id: "description-missing", category: "Search", severity: "medium",
      title: "No search description found",
      evidence: "The page has no meta description.",
      recommendation: "Write a 70–160 character summary of the offer and the next step. Search engines often show it under your title.",
      hypothesis: "A specific description may earn more clicks from search results than an auto-generated snippet. Compare click-through rate before and after.",
    });
  } else if (description.length < 70 || description.length > 160) {
    add({
      id: "description-length", category: "Search", severity: "low",
      title: description.length < 70 ? "Search description is short" : "Search description may be cut off",
      evidence: `The description is ${description.length} characters: “${shorten(description, 120)}”.`,
      recommendation: "Aim for roughly 70–160 characters that explain the offer and invite action.",
    });
  } else {
    add({
      id: "description-ok", category: "Search", severity: "pass",
      title: "Search description is a sensible length",
      evidence: `${description.length} characters: “${shorten(description, 120)}”.`,
      recommendation: "Nothing to change here.",
    });
  }

  const canonical = links.find((l) => l.rel?.toLowerCase().split(/\s+/).includes("canonical") && l.href);
  if (!canonical) {
    add({
      id: "canonical-missing", category: "Search", severity: "low",
      title: "No canonical link found",
      evidence: "The page has no <link rel=\"canonical\"> tag.",
      recommendation: "Add a canonical link pointing to the preferred address of this page, so duplicate versions don't compete in search.",
    });
  } else {
    add({
      id: "canonical-ok", category: "Search", severity: "pass",
      title: "Canonical link is set",
      evidence: `Canonical: ${shorten(canonical.href, 100)}`,
      recommendation: "Nothing to change here.",
    });
  }

  /* ---- Message clarity ---------------------------------------------------- */
  if (h1s.length === 0) {
    add({
      id: "h1-missing", category: "Messaging", severity: "high",
      title: "No main heading (H1) found",
      evidence: `The initial HTML contains no <h1> heading.${jsNote}`,
      recommendation: "Add one clear heading near the top that says what you offer and who it is for, in plain language.",
      hypothesis: "Visitors who understand the offer within a few seconds may be more likely to stay. Test a new headline and compare enquiries over a few weeks.",
    });
  } else if (h1s.length > 1) {
    add({
      id: "h1-multiple", category: "Messaging", severity: "low",
      title: "More than one main heading (H1)",
      evidence: `Found ${h1s.length} H1 headings: ${h1s.slice(0, 3).map((h) => `“${shorten(h.text, 50)}”`).join(", ")}.`,
      recommendation: "Keep a single H1 for the main promise of the page and use H2 headings for sections.",
    });
  } else {
    add({
      id: "h1-ok", category: "Messaging", severity: "pass",
      title: "One clear main heading",
      evidence: `Main heading: “${shorten(h1s[0].text, 110)}”. Check that it says what you offer and who it is for.`,
      recommendation: "Nothing to change here.",
    });
  }

  if (words < 100) {
    add({
      id: "content-thin", category: "Messaging", severity: "medium",
      title: "Very little explanatory text",
      evidence: `About ${words} words of visible text in the initial HTML.${jsNote}`,
      recommendation: "Explain what you offer, who it is for, how it works and why to trust you, in short plain-language sections.",
      hypothesis: "Visitors may need more information before they enquire. Test by adding a short “how it works” section and watching enquiries.",
    });
  } else {
    add({
      id: "content-ok", category: "Messaging", severity: "pass",
      title: "Enough text to explain the offer",
      evidence: `About ${words} words of visible text and ${headings.length} headings.`,
      recommendation: "Nothing to change here.",
    });
  }

  /* ---- Conversion --------------------------------------------------------- */
  if (ctas.length === 0) {
    add({
      id: "cta-missing", category: "Conversion", severity: "high",
      title: "No clear call to action found",
      evidence: `Looked at ${clickable.length} links and buttons in the initial HTML. None used common action wording such as “Book a call”, “Request a quote” or “Get started”.${jsNote}`,
      recommendation: "Add a prominent button that sends visitors to the single most important next step for your business, and repeat it further down the page.",
      hypothesis: "Visitors may find it easier to act when the next step is obvious. This is a hypothesis to test, not a guaranteed increase in sales.",
    });
  } else {
    add({
      id: "cta-ok", category: "Conversion", severity: "pass",
      title: "Action wording found",
      evidence: `Found: ${ctas.slice(0, 4).map((c) => `“${shorten(c, 40)}”`).join(", ")}${ctas.length > 4 ? ` and ${ctas.length - 4} more` : ""}. Check that one main action stands out.`,
      recommendation: "Nothing to change here.",
    });
  }

  /* ---- Mobile ------------------------------------------------------------- */
  const viewport = meta("viewport");
  if (!viewport) {
    add({
      id: "viewport-missing", category: "Mobile", severity: "high",
      title: "Page isn't set up for mobile screens",
      evidence: "No viewport meta tag was found.",
      recommendation: "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> to the page head, then check the layout on a phone.",
      hypothesis: "Many visitors arrive on phones. A page that is easy to read on mobile may lose fewer of them.",
    });
  } else {
    add({
      id: "viewport-ok", category: "Mobile", severity: "pass",
      title: "Mobile viewport is set",
      evidence: `Viewport: “${shorten(viewport, 80)}”.`,
      recommendation: "Nothing to change here.",
    });
  }

  /* ---- Social sharing ----------------------------------------------------- */
  const ogMissing = ["og:title", "og:description", "og:image"].filter((k) => !meta(k));
  if (ogMissing.length === 3) {
    add({
      id: "og-missing", category: "Sharing", severity: "medium",
      title: "Links to your site won't preview well when shared",
      evidence: "No Open Graph tags (og:title, og:description, og:image) were found.",
      recommendation: "Add Open Graph tags so a shared link shows a clear title, summary and image on WhatsApp, LinkedIn, Facebook and Slack.",
      hypothesis: "An attractive preview may get more clicks when people share your link. Test by sharing it in a few places and comparing visits.",
    });
  } else if (ogMissing.length > 0) {
    add({
      id: "og-partial", category: "Sharing", severity: "low",
      title: "Sharing preview is incomplete",
      evidence: `Missing: ${ogMissing.join(", ")}.`,
      recommendation: "Add the missing Open Graph tags so shared links show a title, summary and image.",
    });
  } else {
    add({
      id: "og-ok", category: "Sharing", severity: "pass",
      title: "Sharing preview tags are present",
      evidence: "og:title, og:description and og:image are all set.",
      recommendation: "Nothing to change here.",
    });
  }

  /* ---- Trust and basics --------------------------------------------------- */
  if (finalUrl.startsWith("http://")) {
    add({
      id: "https-missing", category: "Trust", severity: "medium",
      title: "Site isn't served over HTTPS",
      evidence: `The final address is ${shorten(finalUrl, 100)}.`,
      recommendation: "Turn on HTTPS (most hosting providers offer free certificates) and redirect the old address to it.",
      hypothesis: "Browsers may warn visitors on non-secure pages, which can reduce trust.",
    });
  } else {
    add({
      id: "https-ok", category: "Trust", severity: "pass",
      title: "Served over HTTPS",
      evidence: "The page loads over a secure connection.",
      recommendation: "Nothing to change here.",
    });
  }

  const hasContact = /href\s*=\s*["']\s*(tel:|mailto:)/i.test(html) || /<form\b/i.test(body);
  if (!hasContact) {
    add({
      id: "contact-missing", category: "Trust", severity: "low",
      title: "No obvious way to get in touch",
      evidence: "No phone (tel:) or email (mailto:) links and no form were found in the initial HTML.",
      recommendation: "Show a phone number, email address or enquiry form where visitors can see it without searching.",
    });
  } else {
    add({
      id: "contact-ok", category: "Trust", severity: "pass",
      title: "A way to get in touch is visible",
      evidence: "Found a phone link, email link or form.",
      recommendation: "Nothing to change here.",
    });
  }

  if (!/<html\b[^>]*\blang\s*=/i.test(html)) {
    add({
      id: "lang-missing", category: "Trust", severity: "low",
      title: "Page language isn't declared",
      evidence: "The <html> tag has no lang attribute.",
      recommendation: "Add lang=\"en\" (or the right language) to the <html> tag. It helps search engines and screen readers.",
    });
  } else {
    add({
      id: "lang-ok", category: "Trust", severity: "pass",
      title: "Page language is declared",
      evidence: "The <html> tag has a lang attribute.",
      recommendation: "Nothing to change here.",
    });
  }

  if (images.length >= 3 && missingAlt / images.length > 0.3) {
    add({
      id: "alt-missing", category: "Trust", severity: "low",
      title: "Many images have no alt text",
      evidence: `${missingAlt} of ${images.length} images have no alt attribute.`,
      recommendation: "Add short descriptions to meaningful images. It helps accessibility and image search.",
    });
  } else if (images.length > 0) {
    add({
      id: "alt-ok", category: "Trust", severity: "pass",
      title: "Images mostly have alt text",
      evidence: `${images.length - missingAlt} of ${images.length} images have an alt attribute.`,
      recommendation: "Nothing to change here.",
    });
  }

  /* ---- Assemble ----------------------------------------------------------- */
  findings.sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);

  const counts = { high: 0, medium: 0, low: 0, pass: 0 };
  let penalty = 0;
  for (const f of findings) {
    counts[f.severity] += 1;
    penalty += WEIGHTS[f.severity];
  }
  const score = Math.max(0, 100 - penalty);
  const issues = counts.high + counts.medium + counts.low;

  const summary =
    issues === 0
      ? "None of the checks we ran found a problem. The next step is to test your headline and main button with real visitors."
      : `We found ${issues} ${issues === 1 ? "thing" : "things"} worth improving${
          counts.high ? `, ${counts.high} of them high priority` : ""
        }. Start at the top of the list and work down.`;

  const notes = [
    "These checks read the initial HTML of your homepage only. They can't see content added by JavaScript, other pages, page speed or search rankings.",
    "Recommendations are hypotheses to test, not guaranteed results. Change one thing at a time and compare enquiries before and after.",
  ];
  if (jsHint) {
    notes.unshift(
      "This page appears to load most of its content with JavaScript, so some findings may under-report what visitors actually see."
    );
  }
  if (truncated) {
    notes.push("The page was very large, so only the first part was analysed.");
  }

  return {
    url: requestedUrl,
    finalUrl,
    fetchedAt: new Date().toISOString(),
    score,
    summary,
    counts,
    findings,
    notes,
    stats: {
      words,
      headings: headings.length,
      images: images.length,
      ctas: ctas.length,
      htmlTruncated: truncated,
    },
  };
}

export async function auditWebsite(input: string): Promise<AuditReport> {
  const url = normaliseUrl(input);
  const { html, finalUrl, truncated } = await fetchPage(url);
  if (!html.trim()) {
    throw new AuditError("The website returned an empty page, so there was nothing to analyse.", 422);
  }
  return analyseHtml(html, url, finalUrl, truncated);
}
