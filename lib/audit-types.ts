export type Severity = "high" | "medium" | "low" | "pass";

export type Category =
  | "Search"
  | "Messaging"
  | "Conversion"
  | "Mobile"
  | "Sharing"
  | "Trust";

/** Rough time to fix: quick ≈ 15 minutes, medium ≈ 1–2 hours, bigger ≈ half a day or more. */
export type Effort = "quick" | "medium" | "bigger";

export interface Finding {
  id: string;
  category: Category;
  severity: Severity;
  /** Set on issues only (not on passed checks). */
  effort?: Effort;
  title: string;
  /** What the tool actually detected in the page HTML. */
  evidence: string;
  recommendation: string;
  /** Framed as something to test, never as a guaranteed result. */
  hypothesis?: string;
}

export interface AuditReport {
  /** True for the built-in example reports (fictional businesses). */
  sample?: boolean;
  url: string;
  finalUrl: string;
  fetchedAt: string;
  /** 0-100 heuristic. A guide to priorities, not a measure of revenue. */
  score: number;
  summary: string;
  counts: { high: number; medium: number; low: number; pass: number };
  findings: Finding[];
  notes: string[];
  stats: {
    words: number;
    headings: number;
    images: number;
    ctas: number;
    htmlTruncated: boolean;
  };
}
