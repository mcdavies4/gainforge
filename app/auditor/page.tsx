"use client";

import "./auditor.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Download, Lightbulb, Search, TrendingUp } from "lucide-react";
import type { AuditReport, Finding, Severity } from "@/lib/audit-types";

const SEVERITY_LABEL: Record<Severity, string> = {
  high: "High priority",
  medium: "Medium",
  low: "Low",
  pass: "Looks good",
};

function scoreBand(score: number): string {
  if (score >= 85) return "Strong foundation";
  if (score >= 60) return "Good, with gaps";
  if (score >= 35) return "Needs work";
  return "Significant gaps";
}

export default function AuditorPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<AuditReport | null>(null);

  // Allow the dashboard to pre-fill the address: /auditor?url=example.com
  useEffect(() => {
    try {
      const prefill = new URLSearchParams(window.location.search).get("url");
      if (prefill) setUrl(prefill);
    } catch {
      /* ignore */
    }
  }, []);

  async function runAudit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");
    setReport(null);
    setLoading(true);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
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

  function exportCsv() {
    if (!report) return;
    const rows = [
      ["Category", "Priority", "Finding", "Evidence", "Recommended action", "Hypothesis to test"],
      ...report.findings.map((f) => [
        f.category,
        SEVERITY_LABEL[f.severity],
        f.title,
        f.evidence,
        f.recommendation,
        f.hypothesis ?? "",
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    let host = "website";
    try {
      host = new URL(report.finalUrl).hostname.replace(/^www\./, "");
    } catch {
      /* ignore */
    }
    const blobUrl = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `gainforge-audit-${host}.csv`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  }

  const issues = report ? report.findings.filter((f) => f.severity !== "pass") : [];
  const passes = report ? report.findings.filter((f) => f.severity === "pass") : [];
  const priorities = issues.slice(0, 3);
  const rest = issues.slice(3);

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
          {error && <div className="aud-error" role="alert">{error}</div>}
        </section>

        {loading && (
          <section className="panel aud-loading" aria-live="polite">
            <span className="aud-spinner dark" /> Reading your homepage. This usually takes a few seconds.
          </section>
        )}

        {report && (
          <section className="aud-report" id="audit-report">
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

            <p className="aud-foot">
              Checked {new Date(report.fetchedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}.
              Next: personalised growth plans based on your business and goals.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

function hostLabel(finalUrl: string): string {
  try {
    return new URL(finalUrl).hostname.replace(/^www\./, "");
  } catch {
    return finalUrl;
  }
}

function FindingCard({ finding, number }: { finding: Finding; number?: number }) {
  return (
    <article className="aud-finding">
      <div className="aud-finding-top">
        {number !== undefined && <span className="aud-num">{String(number).padStart(2, "0")}</span>}
        <span className={`aud-sev ${finding.severity}`}>{SEVERITY_LABEL[finding.severity]}</span>
        <span className="aud-cat">{finding.category}</span>
      </div>
      <h3>{finding.title}</h3>
      <div className="aud-field"><span>WHAT WE FOUND</span><p>{finding.evidence}</p></div>
      <div className="aud-field">
        <span>WHAT TO DO</span>
        <p>{finding.recommendation}</p>
      </div>
      {finding.hypothesis && (
        <div className="aud-field"><span>TEST THIS</span><p>{finding.hypothesis}</p></div>
      )}
    </article>
  );
}
