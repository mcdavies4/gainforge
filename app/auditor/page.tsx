"use client";

import "./auditor.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Copy, Download, Lightbulb, Printer, Search, TrendingUp } from "lucide-react";
import type { AuditReport, Effort, Finding, Severity } from "@/lib/audit-types";

const SEVERITY_LABEL: Record<Severity, string> = {
  high: "High priority",
  medium: "Medium",
  low: "Low",
  pass: "Looks good",
};

const EFFORT_LABEL: Record<Effort, string> = {
  quick: "Quick win · about 15 min",
  medium: "About 1–2 hours",
  bigger: "Half a day or more",
};

function scoreBand(score: number): string {
  if (score >= 85) return "Strong foundation";
  if (score >= 60) return "Good, with gaps";
  if (score >= 35) return "Needs work";
  return "Significant gaps";
}

function hostLabel(finalUrl: string): string {
  try {
    return new URL(finalUrl).hostname.replace(/^www\./, "");
  } catch {
    return finalUrl;
  }
}

function buildSummaryText(report: AuditReport): string {
  const issues = report.findings.filter((f) => f.severity !== "pass");
  const lines = [
    `GainForge website audit: ${hostLabel(report.finalUrl)}${report.sample ? " (sample report, fictional business)" : ""}`,
    `Score: ${report.score}/100 (${scoreBand(report.score)})`,
    `Checked: ${new Date(report.fetchedAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}`,
    "",
    report.summary,
    "",
  ];
  if (issues.length > 0) {
    lines.push("Action plan");
    issues.forEach((f, i) => {
      lines.push(`${i + 1}. [${SEVERITY_LABEL[f.severity]}${f.effort ? ` · ${EFFORT_LABEL[f.effort]}` : ""}] ${f.title}`);
      lines.push(`   ${f.recommendation}`);
    });
    lines.push("");
  }
  lines.push("Based on the initial HTML of the homepage only. Recommendations are things to test, not guaranteed results.");
  return lines.join("\n");
}

export default function AuditorPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<AuditReport | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  // Allow the dashboard to pre-fill the address: /auditor?url=example.com
  useEffect(() => {
    try {
      const prefill = new URLSearchParams(window.location.search).get("url");
      if (prefill) setUrl(prefill);
    } catch {
      /* ignore */
    }
  }, []);

  // Remember which fixes were ticked off, per website, in this browser.
  const storageKey = report ? `gainforge-audit-done:${hostLabel(report.finalUrl)}` : "";
  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = window.localStorage.getItem(storageKey);
      setDone(saved ? (JSON.parse(saved) as Record<string, boolean>) : {});
    } catch {
      setDone({});
    }
  }, [storageKey]);

  function toggleDone(id: string) {
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        if (storageKey) window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* storage unavailable: still works for this visit */
      }
      return next;
    });
  }

  async function load(doFetch: () => Promise<Response>) {
    if (loading) return;
    setError("");
    setReport(null);
    setLoading(true);
    try {
      const res = await doFetch();
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        throw new Error(data?.error ?? "Something went wrong. Please try again.");
      }
      setReport(data as AuditReport);
      window.setTimeout(
        () => document.getElementById("audit-report")?.scrollIntoView({ behavior: "smooth", block: "start" }),
        60
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function runAudit(e: React.FormEvent) {
    e.preventDefault();
    void load(() =>
      fetch("/api/audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      })
    );
  }

  function loadSample(type: "local" | "saas") {
    void load(() => fetch(`/api/audit/sample?type=${type}`));
  }

  function exportCsv() {
    if (!report) return;
    const rows = [
      ["Category", "Priority", "Effort", "Finding", "Evidence", "Recommended action", "Hypothesis to test", "Done"],
      ...report.findings.map((f) => [
        f.category,
        SEVERITY_LABEL[f.severity],
        f.effort ? EFFORT_LABEL[f.effort] : "",
        f.title,
        f.evidence,
        f.recommendation,
        f.hypothesis ?? "",
        f.severity === "pass" ? "n/a" : done[f.id] ? "Yes" : "No",
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blobUrl = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `gainforge-audit-${hostLabel(report.finalUrl)}.csv`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  }

  async function copySummary() {
    if (!report) return;
    const text = buildSummaryText(report);
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      document.body.removeChild(ta);
    }
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    }
  }

  const issues = report ? report.findings.filter((f) => f.severity !== "pass") : [];
  const passes = report ? report.findings.filter((f) => f.severity === "pass") : [];
  const priorities = issues.slice(0, 3);
  const rest = issues.slice(3);
  const doneCount = issues.filter((f) => done[f.id]).length;
  const pct = issues.length ? Math.round((doneCount / issues.length) * 100) : 0;

  return (
    <div className="aud-page">
      <header className="aud-top">
        <Link href="/" className="brand aud-brand">
          <div className="brand-mark"><TrendingUp size={20} strokeWidth={2.5} /></div>
          <div><strong>gainforge</strong><span>GROWTH WORKSPACE</span></div>
        </Link>
        <Link href="/" className="aud-back"><ArrowLeft size={14} /> Back to workspace</Link>
      </header>

      <main className="aud-wrap">
        <section className="aud-hero">
          <div className="eyebrow"><span className="eyebrow-dot" /> WEBSITE GROWTH AUDITOR</div>
          <h1>See what could be holding your website back.</h1>
          <p className="subtitle">
            Enter your website and get a prioritised list of improvements, with the evidence behind each one.
          </p>
          <form className="aud-form" onSubmit={runAudit}>
            <input
              className="aud-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="yourbusiness.com"
              inputMode="url"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              aria-label="Website address"
              required
            />
            <button className="primary-button aud-submit" disabled={loading}>
              {loading ? (
                <><span className="aud-spinner" /> Analysing…</>
              ) : (
                <><Search size={15} /> Run audit</>
              )}
            </button>
          </form>
          <p className="aud-hint">
            Free. We read your public homepage only. Results are suggestions to test, not guarantees.
          </p>
          <div className="aud-samples">
            <span>No website handy? See a sample report:</span>
            <button type="button" className="aud-link" onClick={() => loadSample("local")} disabled={loading}>
              Local service business
            </button>
            <button type="button" className="aud-link" onClick={() => loadSample("saas")} disabled={loading}>
              Software startup
            </button>
          </div>
          {error && <div className="aud-error" role="alert">{error}</div>}
        </section>

        {loading && (
          <section className="panel aud-loading" aria-live="polite">
            <span className="aud-spinner dark" /> Reading the page. This usually takes a few seconds.
          </section>
        )}

        {report && (
          <section className="aud-report" id="audit-report">
            <div className="aud-print-head">GainForge · Website growth audit</div>

            {report.sample && (
              <div className="aud-sample-banner">
                <strong>Sample report.</strong> This is a fictional business, shown so you can see what an audit looks like.
                Run it on your own website above.
              </div>
            )}

            <div className="panel aud-score-card">
              <div
                className="aud-ring"
                style={{ background: `conic-gradient(var(--green) ${report.score * 3.6}deg, #edf1ee 0deg)` }}
                aria-label={`Score ${report.score} out of 100`}
              >
                <div className="aud-ring-inner">
                  <strong>{report.score}</strong>
                  <span>/ 100</span>
                </div>
              </div>
              <div className="aud-score-copy">
                <div className="aud-score-label">{scoreBand(report.score)}</div>
                <h2>{hostLabel(report.finalUrl)}</h2>
                <p>{report.summary}</p>
                <div className="aud-chips">
                  {report.counts.high > 0 && <span className="aud-sev high">{report.counts.high} high</span>}
                  {report.counts.medium > 0 && <span className="aud-sev medium">{report.counts.medium} medium</span>}
                  {report.counts.low > 0 && <span className="aud-sev low">{report.counts.low} low</span>}
                  <span className="aud-sev pass">{report.counts.pass} passed</span>
                </div>
              </div>
            </div>

            <div className="aud-actions">
              <button className="outline-button" onClick={copySummary}>
                {copied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy summary</>}
              </button>
              <button className="outline-button" onClick={() => window.print()}><Printer size={15} /> Save as PDF</button>
              <button className="outline-button" onClick={exportCsv}><Download size={15} /> Export CSV</button>
              <button
                className="outline-button"
                onClick={() => {
                  setReport(null);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Audit another site
              </button>
            </div>

            {issues.length > 0 && (
              <div className="panel aud-plan">
                <div className="aud-plan-head">
                  <div>
                    <h2>Your action plan</h2>
                    <p>Tick things off as you fix them. Quick wins come first within each priority.</p>
                  </div>
                  <span className="aud-plan-count">{doneCount} of {issues.length} done</span>
                </div>
                <div className="aud-progress"><div style={{ width: `${pct}%` }} /></div>
                <ul>
                  {issues.map((f) => (
                    <li key={f.id} className={done[f.id] ? "done" : ""}>
                      <label>
                        <input type="checkbox" checked={!!done[f.id]} onChange={() => toggleDone(f.id)} />
                        <span className="aud-plan-text">
                          <strong>{f.title}</strong>
                          <small>
                            {SEVERITY_LABEL[f.severity]}
                            {f.effort ? ` · ${EFFORT_LABEL[f.effort]}` : ""}
                          </small>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {priorities.length > 0 && (
              <>
                <h2 className="aud-h2">Fix these first</h2>
                <p className="aud-h2-sub">The highest-priority items, in order.</p>
                {priorities.map((f, i) => <FindingCard key={f.id} finding={f} number={i + 1} />)}
              </>
            )}

            {rest.length > 0 && (
              <>
                <h2 className="aud-h2">More improvements</h2>
                {rest.map((f) => <FindingCard key={f.id} finding={f} />)}
              </>
            )}

            {issues.length === 0 && (
              <div className="panel aud-empty">
                <Check size={18} /> None of the checks found a problem on this page.
              </div>
            )}

            {passes.length > 0 && (
              <details className="aud-passes">
                <summary>{passes.length} checks passed</summary>
                <ul>
                  {passes.map((f) => (
                    <li key={f.id}>
                      <Check size={14} />
                      <div><strong>{f.title}</strong><span>{f.evidence}</span></div>
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <div className="note-box aud-note">
              <Lightbulb size={16} />
              <p>
                <strong>How to read this report</strong>
                <br />
                {report.notes.join(" ")}
              </p>
            </div>

            <LeadCapture report={report} />

            <p className="aud-foot">
              Checked {new Date(report.fetchedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

function FindingCard({ finding, number }: { finding: Finding; number?: number }) {
  return (
    <article className="aud-finding">
      <div className="aud-finding-top">
        {number !== undefined && <span className="aud-num">{String(number).padStart(2, "0")}</span>}
        <span className={`aud-sev ${finding.severity}`}>{SEVERITY_LABEL[finding.severity]}</span>
        <span className="aud-cat">{finding.category}</span>
        {finding.effort && <span className="aud-effort">{EFFORT_LABEL[finding.effort]}</span>}
      </div>
      <h3>{finding.title}</h3>
      <div className="aud-field"><span>WHAT WE FOUND</span><p>{finding.evidence}</p></div>
      <div className="aud-field"><span>WHAT TO DO</span><p>{finding.recommendation}</p></div>
      {finding.hypothesis && (
        <div className="aud-field"><span>TEST THIS</span><p>{finding.hypothesis}</p></div>
      )}
    </article>
  );
}

function LeadCapture({ report }: { report: AuditReport }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [company, setCompany] = useState(""); // honeypot: left empty by real visitors
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    setError("");
    setStatus("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          consent,
          company,
          url: report.sample ? "" : report.finalUrl,
          score: report.sample ? null : report.score,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong. Please try again.");
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="aud-lead">
        <div className="aud-lead-done"><Check size={18} /> You're on the early-access list. Thank you.</div>
      </div>
    );
  }

  return (
    <div className="aud-lead">
      <h2>Want a growth plan built around your business?</h2>
      <p>
        We're building personalised growth plans that use your industry, customers and goals, not just your homepage.
        They aren't ready yet. Join the early-access list and we'll tell you when they are.
      </p>
      <form onSubmit={submit}>
        <div className="aud-lead-row">
          <input
            className="aud-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourbusiness.com"
            autoComplete="email"
            aria-label="Email address"
            required
          />
          <button className="primary-button" disabled={status === "sending"}>
            {status === "sending" ? "Joining…" : "Join early access"}
          </button>
        </div>
        <div className="aud-hp" aria-hidden="true">
          <label>
            Company
            <input value={company} onChange={(e) => setCompany(e.target.value)} tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <label className="aud-consent">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>
            Yes, email me about personalised growth plans and GainForge updates. I can unsubscribe at any time.
            {report.sample ? "" : " We'll also note the website and score from this audit."}
          </span>
        </label>
        {error && <div className="aud-error" role="alert">{error}</div>}
      </form>
    </div>
  );
}
