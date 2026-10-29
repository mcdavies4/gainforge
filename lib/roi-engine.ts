export interface RoiStats {
  averageDealValue: number;
  monthlyMarketingSpend: number;
  totalEnquiries: number;
  qualifiedLeads: number;
  dealsWon: number;
  verifiedWonRevenue: number;
}

export interface AuditHistoryEntry {
  date: string;
  url: string;
  score: number;
  note: string;
}

const STATS_KEY = "gainforge_roi_stats_v1";
const AUDIT_HISTORY_KEY = "gainforge_audit_history_v1";

export const DEFAULT_ROI_STATS: RoiStats = {
  averageDealValue: 1850,
  monthlyMarketingSpend: 250,
  totalEnquiries: 12,
  qualifiedLeads: 5,
  dealsWon: 2,
  verifiedWonRevenue: 3700,
};

export function loadRoiStats(): RoiStats {
  if (typeof window === "undefined") return DEFAULT_ROI_STATS;
  try {
    const raw = window.localStorage.getItem(STATS_KEY);
    if (!raw) return DEFAULT_ROI_STATS;
    return { ...DEFAULT_ROI_STATS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_ROI_STATS;
  }
}

export function saveRoiStats(stats: RoiStats): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (err) {
    console.warn("Failed to persist ROI stats", err);
  }
}

export function loadAuditHistory(): AuditHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(AUDIT_HISTORY_KEY);
    if (!raw) {
      return [
        {
          date: "Initial Baseline",
          url: "yourbusiness.com",
          score: 54,
          note: "Before fixing conversion friction and CTA placement",
        },
        {
          date: "Post-Audit Optimization",
          url: "yourbusiness.com",
          score: 82,
          note: "Added above-the-fold CTA, HTTPS redirect, and search snippet",
        },
      ];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveAuditHistory(history: AuditHistoryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AUDIT_HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    console.warn("Failed to persist audit history", err);
  }
}
