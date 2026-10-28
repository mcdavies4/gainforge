# GainForge MVP — prototype 0.1

**Product promise:** Turn business opportunities into clear, trackable actions.

GainForge is a global AI Growth Agent concept. This package contains a polished front-end prototype to validate the workflow before adding paid data sources, AI research, authentication, persistent storage, billing, and real integrations.

## What's included

- Responsive workspace dashboard
- Business profile modal (website, name, growth goal)
- Opportunity pipeline with search and status filters
- Opportunity detail and review modal
- Action centre and growth-insights placeholder
- CSV export
- Clearly labelled illustrative demo data; no fake claims of live leads or revenue
- **Website Growth Auditor (`/auditor`)**: enter a public website and get a prioritised report with the evidence behind each finding. Real analysis, no AI key needed
- Next.js App Router, React, TypeScript and Lucide icons

## Website Growth Auditor

- Page: `app/auditor/page.tsx` (styles in `app/auditor/auditor.css`)
- API: `POST /api/audit` with `{ "url": "example.com" }` (`app/api/audit/route.ts`)
- Engine: `lib/audit.ts` (fetch and checks) and `lib/audit-types.ts` (shared types)
- Checks: page title, search description, canonical link, main heading, amount of text, calls to action, mobile viewport, social-sharing tags, HTTPS, contact method, language, image alt text
- Reads the initial homepage HTML only. It can't see content added by JavaScript, other pages, page speed or rankings, and says so in the report
- Safety: rejects localhost and private network addresses (including after redirects), 10 second timeout, 1.5 MB size cap, best-effort rate limit of 15 audits per IP per hour
- The rate limit is per server instance. Add a shared store (e.g. Upstash Redis) before promoting the tool widely
- Test with several real sites before launch. Some sites block automated requests and will show an error

### Sharing, sample reports and early-access signups

- Each issue has an effort estimate (quick win, 1–2 hours, half a day). Within a priority level, quick wins are listed first
- The report has a tick-off action plan (progress is remembered in the visitor's browser), plus Copy summary, Save as PDF (browser print) and CSV export
- Sample reports for two fictional businesses (`GET /api/audit/sample?type=local|saas`, content in `lib/samples.ts`) run through the real engine and are clearly labelled as samples
- Early-access signup form (`POST /api/leads`): email plus an unticked consent box, a hidden honeypot field and a per-IP rate limit
- Set `LEAD_WEBHOOK_URL` in Vercel (a Make, Zapier or Google Apps Script webhook that adds a row to a sheet) so signups are saved. Without it they only appear in the server logs
- Before promoting the auditor publicly, add a privacy notice that says what you do with email addresses and the websites people enter (UK GDPR)

## Important current limitation

This is still mostly a **front-end prototype**, not yet a production SaaS. The auditor is real, but the dashboard's opportunities are sample records, the business profile website field only pre-fills the auditor, and profile changes are not persisted to a database. AI, real opportunity discovery, account authentication, billing and integrations have not yet been connected.

The next development milestone should be the real opportunity research workflow: start with one or two legally accessible sources, show the source and date for each finding, score relevance transparently, and require human review before external outreach.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Build

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Create a new GitHub repository, for example `gainforge`.
2. Upload these project files to the repository root.
3. Import that repository into Vercel.
4. Use the default Next.js settings and deploy.
5. No environment variables are required for this demo.

## Suggested production architecture

- Next.js + TypeScript
- Supabase Auth and Postgres for accounts, business profiles, opportunities and action outcomes
- Server-side AI provider calls only (never expose provider API keys in browser code)
- Pluggable, compliant public data sources with source URL, timestamp and evidence stored per opportunity
- Human approval for outbound messages and all consequential actions
- Stripe after paid-pilot validation
- Analytics tied to qualified leads and verified conversion/revenue data

## Suggested database entities

- `profiles`: owner and account preferences
- `businesses`: name, URL, category, regions, audience and goals
- `opportunities`: source URL, source date, evidence, category, relevance score, status and suggested action
- `actions`: draft, owner approval, sent state and follow-up schedule
- `outcomes`: qualified lead, booked call, won/lost and verified revenue where available

## Brand note

GainForge is a working name selected for this prototype. Search results did not establish a clear exact-match business-growth SaaS conflict in the limited check, but that is **not** trademark, company-name, social-handle or domain clearance. Check the domain and relevant trademark registers before committing to the brand.
