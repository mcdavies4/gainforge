import { analyseHtml } from "./audit";
import type { AuditReport } from "./audit-types";

/**
 * Example reports for fictional businesses. The HTML below is written by hand
 * and run through the real audit engine, so the findings are genuine output of
 * the same checks, not hard-coded results.
 */

const LOCAL_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Brightside Cleaning</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <header><nav><a href="/">Home</a><a href="/services">Services</a><a href="/about">About</a><a href="/contact">Contact</a></nav></header>
  <h1>Welcome to Brightside</h1>
  <p>We are a family-run cleaning company based in Leeds. Our friendly team has been helping local homes
  stay fresh and tidy for over ten years. We use safe products and we take pride in every visit.</p>
  <p>Have a look around our website to find out more about what we do.</p>
  <img src="/van.jpg"><img src="/team.jpg"><img src="/kitchen.jpg" alt="Freshly cleaned kitchen"><img src="/logo.png">
  <p>Phone us on <a href="tel:+441134960000">0113 496 0000</a>.</p>
  <footer>Brightside Cleaning Ltd</footer>
</body>
</html>`;

const SAAS_HTML = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Loopdesk: shared inbox and help desk software for small support teams and growing startups</title>
  <meta name="description" content="Loopdesk gives small support teams one shared inbox, saved replies and simple reporting, so customers get answers faster. Free for 14 days.">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta property="og:title" content="Loopdesk: a calmer way to run customer support">
  <meta property="og:description" content="One shared inbox, saved replies and simple reporting for small support teams.">
  <link rel="canonical" href="https://loopdesk.example/">
</head>
<body>
  <h1>A calmer way to run customer support</h1>
  <p>Loopdesk brings every customer email, chat and form message into one shared inbox, so nothing slips through the cracks
  and your whole team can see who is handling what. Assign conversations in a click, leave private notes for teammates and
  reply from saved templates that keep your tone consistent.</p>
  <a href="/signup">Start free trial</a> <a href="/demo">Book a demo</a>
  <h1>Trusted by growing teams</h1>
  <h2>How it works</h2>
  <p>Connect your support email in about five minutes. Loopdesk then sorts new conversations, flags anything waiting too long
  and shows you how quickly your team replies. There is no long contract, and you can export your data whenever you like.
  Most teams are up and running on the same day, without needing help from a developer or an IT department.</p>
  <h2>Pricing</h2>
  <p>Plans start from a simple monthly price per team member. Every plan includes the shared inbox, saved replies and
  reporting, and you can change or cancel your plan at any time from your account settings.</p>
  <img src="/inbox.png" alt="The Loopdesk shared inbox"><img src="/reports.png" alt="Reply time report"><img src="/logo.svg" alt="Loopdesk">
</body>
</html>`;

const SAMPLES: Record<string, { url: string; html: string }> = {
  local: { url: "https://brightsidecleaning.example/", html: LOCAL_HTML },
  saas: { url: "https://loopdesk.example/", html: SAAS_HTML },
};

export function buildSample(type: string): AuditReport | null {
  const sample = Object.prototype.hasOwnProperty.call(SAMPLES, type) ? SAMPLES[type] : null;
  if (!sample) return null;
  return { ...analyseHtml(sample.html, sample.url, sample.url), sample: true };
}
