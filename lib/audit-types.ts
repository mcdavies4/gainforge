export type Severity = "high" | "medium" | "low" | "pass";

export type Category =
  | "Search"
  | "Messaging"
  | "Conversion"
  | "Mobile"
  | "Sharing"
  | "Trust";

export interface Finding {
  id: string;
  category: Category;
  severity: Severity;
  title: string;
  /** What the tool actually detected in the page HTML. */
  evidence: string;
  recommendation: string;
  /** Framed as something to test, never as a guaranteed result. */
  hypothesis?: string;
}

export interface AuditReport {
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
