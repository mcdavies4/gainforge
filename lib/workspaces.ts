import { DEFAULT_PROFILE, INITIAL_OPPORTUNITIES, type BusinessProfile, type GrowthOpportunity } from "./growth-engine";
import { SAMPLE_PROSPECTS, type Prospect } from "./lead-finder";
import { SAMPLE_CAMPAIGNS, type SavedCampaign } from "./campaign-engine";
import { DEFAULT_ROI_STATS, type RoiStats, type AuditHistoryEntry } from "./roi-engine";
import { INITIAL_COMPETITOR_ANALYSES, type CompetitorAnalysis } from "./competitor-engine";
import type { AuditReport } from "./audit-types";

export interface ClientWorkspace {
  id: string;
  name: string;
  industry: string;
  profile: BusinessProfile;
  opportunities: GrowthOpportunity[];
  prospects: Prospect[];
  campaigns: SavedCampaign[];
  roiStats: RoiStats;
  latestAudit: AuditReport | null;
  auditHistory: AuditHistoryEntry[];
  competitors: CompetitorAnalysis[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY_WORKSPACES = "gainforge_client_workspaces_v1";
const STORAGE_KEY_ACTIVE_ID = "gainforge_active_workspace_id_v1";

export const INITIAL_WORKSPACES: ClientWorkspace[] = [
  {
    id: "ws-default",
    name: "Apex Facilities Group",
    industry: "Cleaning & Facilities",
    profile: {
      ...DEFAULT_PROFILE,
      name: "Apex Facilities Group",
      industry: "Cleaning & Facilities",
      targetAudience: "Commercial property managers & multi-tenant office leads",
      location: "Greater London, UK",
      goal: "Win commercial contracts",
      challenge: "Visitors bounce without enquiring; lack of structured 3-touch follow-ups",
    },
    opportunities: INITIAL_OPPORTUNITIES,
    prospects: SAMPLE_PROSPECTS,
    campaigns: SAMPLE_CAMPAIGNS,
    roiStats: DEFAULT_ROI_STATS,
    latestAudit: null,
    auditHistory: [
      {
        date: "Initial Baseline",
        url: "apexfacilities.co.uk",
        score: 62,
        note: "Initial audit identified missing above-the-fold CTA and contact friction",
      },
      {
        date: "Post-Optimization",
        url: "apexfacilities.co.uk",
        score: 84,
        note: "Added 2-hour SLA response guarantee, comparison section, and simplified mobile form",
      },
    ],
    competitors: INITIAL_COMPETITOR_ANALYSES,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ws-client-2",
    name: "Vanguard Tech & Cloud Solutions",
    industry: "B2B SaaS & Technology",
    profile: {
      ...DEFAULT_PROFILE,
      name: "Vanguard Tech & Cloud Solutions",
      industry: "B2B SaaS & Technology",
      targetAudience: "CTOs and IT Procurement Directors",
      location: "Manchester & Remote UK",
      goal: "Generate more qualified leads",
      challenge: "High website traffic but low free trial to demo conversion rate",
    },
    opportunities: [
      {
        id: "opp-vg-1",
        title: "Build dedicated alternative comparison page vs incumbent legacy vendors",
        category: "Conversion",
        company: "Vanguard Tech",
        value: "Enterprise demo pipeline",
        confidence: "High",
        effort: "medium",
        source: "Competitor positioning gap",
        evidence: "Prospective buyers spend 70% of evaluation looking for feature and pricing comparisons vs AWS/Azure native tools.",
        reason: "Without a clear comparison guide, prospects default to legacy providers.",
        action: "Publish an honest 'Why Teams Choose Vanguard' comparison matrix.",
        hypothesis: "A dedicated comparison page will increase demo booking conversion by 25%.",
        successMetric: "At least 8 qualified enterprise demo bookings within 30 days.",
        deadline: "Within 10 days",
        status: "In progress",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "opp-vg-2",
        title: "Deploy 3-touch outreach sequence to mid-market security directors",
        category: "Acquisition",
        company: "Security compliance target",
        value: "Annual recurring contracts",
        confidence: "High",
        effort: "quick",
        source: "Market demand signal",
        evidence: "Recent cloud security regulations mandate multi-region compliance audits for UK financial firms.",
        reason: "Directly solves the urgency created by new regulatory audits.",
        action: "Send 3-touch outbound sequence offering free compliance diagnostic checklist.",
        hypothesis: "Offering an audit checklist achieves an 8%+ reply rate from security directors.",
        successMetric: "20 organisations contacted, securing at least 3 discovery calls.",
        deadline: "Within 7 days",
        status: "New",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    prospects: [
      {
        id: "vg-pros-1",
        companyName: "FinCloud Global Ltd",
        sector: "Fintech & Payments",
        location: "London, UK",
        targetRole: "VP of Engineering & Security",
        sourceUrl: "https://find-and-update.company-information.service.gov.uk",
        sourceType: "UK Companies House",
        dateChecked: "2026-10-27",
        estimatedOpportunity: "Enterprise annual retainer (~£18,000/yr)",
        relevanceReason: "Scaling rapidly; hiring 15 engineers; requires automated cloud compliance audits.",
        suggestedTouchpoint: "Share the cloud compliance benchmark whitepaper.",
        outreachStatus: "Contacted",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    campaigns: [],
    roiStats: {
      averageDealValue: 4200,
      monthlyMarketingSpend: 600,
      totalEnquiries: 18,
      qualifiedLeads: 7,
      dealsWon: 3,
      verifiedWonRevenue: 12600,
    },
    latestAudit: null,
    auditHistory: [],
    competitors: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function loadWorkspaces(): ClientWorkspace[] {
  if (typeof window === "undefined") return INITIAL_WORKSPACES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_WORKSPACES);
    if (!raw) return INITIAL_WORKSPACES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_WORKSPACES;
  } catch {
    return INITIAL_WORKSPACES;
  }
}

export function saveWorkspaces(workspaces: ClientWorkspace[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY_WORKSPACES, JSON.stringify(workspaces));
  } catch (err) {
    console.warn("Failed to persist workspaces", err);
  }
}

export function getActiveWorkspaceId(): string {
  if (typeof window === "undefined") return "ws-default";
  try {
    return window.localStorage.getItem(STORAGE_KEY_ACTIVE_ID) || "ws-default";
  } catch {
    return "ws-default";
  }
}

export function setActiveWorkspaceId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
  } catch (err) {
    console.warn("Failed to set active workspace id", err);
  }
}
