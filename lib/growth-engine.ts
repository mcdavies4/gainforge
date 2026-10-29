import type { AuditReport, Finding } from "./audit-types";

export interface BusinessProfile {
  name: string;
  website: string;
  industry: string;
  targetAudience: string;
  location: string;
  goal: string;
  challenge: string;
  updatedAt: string;
}

export type OpportunityCategory =
  | "Demand signal"
  | "Conversion"
  | "Acquisition"
  | "Trust & Positioning"
  | "Revenue recovery";

export type OpportunityConfidence = "High" | "Medium" | "Low";

export interface GrowthOpportunity {
  id: string;
  title: string;
  category: OpportunityCategory;
  company: string;
  value: string;
  confidence: OpportunityConfidence;
  effort: "quick" | "medium" | "bigger";
  source: string;
  evidence: string;
  reason: string;
  action: string;
  hypothesis: string;
  successMetric: string;
  deadline: string;
  status: "New" | "In progress" | "Won" | "Dismissed";
  auditFindingId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_PROFILE: BusinessProfile = {
  name: "Your business",
  website: "",
  industry: "Service business",
  targetAudience: "Prospective commercial clients and buyers",
  location: "United Kingdom",
  goal: "Find more customers",
  challenge: "Converting visitors into enquiries and finding qualified buyers",
  updatedAt: new Date().toISOString(),
};

export const INITIAL_OPPORTUNITIES: GrowthOpportunity[] = [
  {
    id: "opp-1",
    title: "Respond to active buyer-intent discussions in relevant communities",
    category: "Demand signal",
    company: "Industry Forums & Social Communities",
    value: "Qualified enquiry pipeline",
    confidence: "High",
    effort: "quick",
    source: "Market demand signal · Demo data",
    evidence: "Prospects frequently ask for vendor recommendations when current providers fail to deliver transparent pricing or rapid response times.",
    reason: "Directly addressing existing questions with practical advice builds trust before competitors reach them.",
    action: "Prepare a helpful, non-pitch response answering the top 3 questions prospects ask before hiring.",
    hypothesis: "Helpful public answers will generate direct profile clicks and qualified initial consultations.",
    successMetric: "At least 3 inbound website visits and 1 qualified discovery conversation within 14 days.",
    deadline: "Within 7 days",
    status: "New",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "opp-2",
    title: "Create a dedicated 'Why Choose Us vs Alternatives' comparison page",
    category: "Conversion",
    company: "Buyer objection gap",
    value: "Higher close rate",
    confidence: "High",
    effort: "medium",
    source: "Competitor gap analysis · Demo data",
    evidence: "Prospective buyers compare an average of 3 providers before making contact; lack of clear differentiators causes decision paralysis.",
    reason: "When a website doesn't clearly state who the service is for and how it compares, buyers default to the cheapest option.",
    action: "Draft a comparison guide highlighting response times, transparent scope, and customer guarantees.",
    hypothesis: "Clear comparison points reduce evaluation hesitation and increase quote requests.",
    successMetric: "20% higher enquiry rate from visitors who view the comparison section.",
    deadline: "Within 14 days",
    status: "New",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "opp-3",
    title: "Re-engage unconverted enquiries from the past 90 days",
    category: "Revenue recovery",
    company: "Existing sales pipeline",
    value: "Recoverable revenue",
    confidence: "Medium",
    effort: "quick",
    source: "Pipeline review · Suggested workflow",
    evidence: "Up to 60% of lost enquiries were postponed rather than awarded to competitors.",
    reason: "Clients often stall due to timing. A polite, value-first check-in requires minimal effort compared to cold acquisition.",
    action: "Send a brief 3-sentence check-in asking if their project is still on hold or ready to revisit.",
    hypothesis: "Re-engaging stalled enquiries revives 1 in 10 past leads without ad spend.",
    successMetric: "10 past leads contacted, targeting at least 1 revived proposal.",
    deadline: "Within 5 days",
    status: "In progress",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "opp-4",
    title: "Publish a targeted service package for commercial decision-makers",
    category: "Acquisition",
    company: "Commercial segment opportunity",
    value: "Higher contract value",
    confidence: "Medium",
    effort: "bigger",
    source: "Strategic positioning · Growth recommendation",
    evidence: "Commercial contracts have 4x higher retention and lifetime value than ad-hoc individual jobs.",
    reason: "Commercial clients have distinct requirements (compliance, invoicing, SLAs) that standard consumer messaging fails to address.",
    action: "Outline a dedicated B2B service package with clear service levels and scheduled maintenance terms.",
    hypothesis: "A dedicated commercial landing page will attract higher-value ongoing contracts.",
    successMetric: "Initial outreach to 15 local commercial organisations generating at least 2 tender invites.",
    deadline: "Within 30 days",
    status: "New",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const STORAGE_KEYS = {
  PROFILE: "gainforge_growth_profile_v1",
  OPPORTUNITIES: "gainforge_growth_opportunities_v1",
  LATEST_AUDIT: "gainforge_latest_audit_v1",
};

/** Load the saved business profile from localStorage with fallback */
export function loadProfile(): BusinessProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

/** Save business profile to localStorage */
export function saveProfile(profile: BusinessProfile): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (err) {
    console.warn("Failed to persist business profile", err);
  }
}

/** Load saved opportunities */
export function loadOpportunities(): GrowthOpportunity[] {
  if (typeof window === "undefined") return INITIAL_OPPORTUNITIES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.OPPORTUNITIES);
    if (!raw) return INITIAL_OPPORTUNITIES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_OPPORTUNITIES;
  } catch {
    return INITIAL_OPPORTUNITIES;
  }
}

/** Save opportunities to localStorage */
export function saveOpportunities(opportunities: GrowthOpportunity[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.OPPORTUNITIES, JSON.stringify(opportunities));
  } catch (err) {
    console.warn("Failed to persist opportunities", err);
  }
}

/** Save latest audit report to localStorage */
export function saveLatestAudit(report: AuditReport): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.LATEST_AUDIT, JSON.stringify(report));
  } catch (err) {
    console.warn("Failed to persist latest audit", err);
  }
}

/** Load latest audit report from localStorage */
export function loadLatestAudit(): AuditReport | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.LATEST_AUDIT);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Generate actionable growth opportunities by synthesizing real website audit findings
 * with the user's specific business profile and growth targets.
 */
export function generateOpportunitiesFromAudit(
  profile: BusinessProfile,
  report: AuditReport
): GrowthOpportunity[] {
  const generated: GrowthOpportunity[] = [];
  const issues = report.findings.filter((f) => f.severity !== "pass");

  // Map high/medium severity findings from real audit into commercial opportunities
  issues.forEach((finding, idx) => {
    let title = finding.title;
    let category: OpportunityCategory = "Conversion";
    let value = "Conversion uplift";
    let confidence: OpportunityConfidence = finding.severity === "high" ? "High" : "Medium";
    let successMetric = "Measurable increase in completed website enquiries.";

    switch (finding.category) {
      case "Conversion":
        category = "Conversion";
        value = "Immediate conversion fix";
        title = `Fix website friction: ${finding.title}`;
        successMetric = "15-25% increase in call-to-action engagement within 14 days of update.";
        break;
      case "Messaging":
        category = "Trust & Positioning";
        value = "Clearer buyer value proposition";
        title = `Clarify customer offering: ${finding.title}`;
        successMetric = "Reduced homepage bounce rate and longer average session duration.";
        break;
      case "Search":
        category = "Acquisition";
        value = "Qualified organic traffic";
        title = `Capture search demand: ${finding.title}`;
        successMetric = "Higher search click-through rate from local and targeted queries.";
        break;
      case "Trust":
        category = "Trust & Positioning";
        value = "Customer trust & credibility";
        title = `Reinforce buyer trust: ${finding.title}`;
        successMetric = "Increased proportion of visitors who initiate contact.";
        break;
      case "Mobile":
        category = "Conversion";
        value = "Mobile customer retention";
        title = `Optimise mobile experience: ${finding.title}`;
        successMetric = "Higher mobile contact and form submission completion rate.";
        break;
      default:
        category = "Conversion";
        value = "Website performance";
    }

    generated.push({
      id: `audit-opp-${finding.id}-${idx}`,
      title,
      category,
      company: `${profile.name || "Your business"} · Website Diagnosis`,
      value,
      confidence,
      effort: finding.effort || "medium",
      source: `Website Growth Auditor (${finding.category} check)`,
      evidence: finding.evidence,
      reason: `Directly impacts the ${profile.goal.toLowerCase()} goal by resolving verified website barriers detected during inspection.`,
      action: finding.recommendation,
      hypothesis: finding.hypothesis || "Implementing this recommendation will remove friction for prospective customers.",
      successMetric,
      deadline: finding.effort === "quick" ? "Within 7 days" : "Within 14 days",
      status: "New",
      auditFindingId: finding.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  // Synthesize strategic profile-based opportunities tailored to their industry and audience
  if (profile.industry && profile.industry !== "General") {
    generated.push({
      id: `strategy-opp-1-${Date.now()}`,
      title: `Develop dedicated outreach campaign for ${profile.targetAudience || "target clients"}`,
      category: "Acquisition",
      company: `${profile.industry} sector focus`,
      value: "High-value direct accounts",
      confidence: "High",
      effort: "medium",
      source: "Profile synthesis & commercial targeting",
      evidence: `Target audience '${profile.targetAudience || "ideal customers"}' in ${profile.location || "your region"} responds best to tailored problem-solving over generic marketing.`,
      reason: `Directly targets your primary bottleneck: '${profile.challenge}'.`,
      action: `Draft a 3-stage outreach sequence focusing on solving the primary commercial challenge for ${profile.targetAudience}.`,
      hypothesis: "Personalised outreach highlighting industry-specific pain points achieves a 10%+ response rate.",
      successMetric: "Send to 20 verified local organisations and secure at least 2 discovery conversations.",
      deadline: "Within 21 days",
      status: "New",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // Include re-engagement opportunity if goal is pipeline/sales related
  if (profile.goal.includes("sales") || profile.goal.includes("leads") || profile.goal.includes("customers")) {
    generated.push({
      id: `strategy-opp-2-${Date.now()}`,
      title: "Establish a structured 3-touch follow-up workflow for all enquiries",
      category: "Revenue recovery",
      company: "Sales conversion process",
      value: "Recovered deal flow",
      confidence: "High",
      effort: "quick",
      source: "Commercial workflow best practice",
      evidence: "More than 50% of service business deals close after the second or third touchpoint, yet most businesses never follow up after an initial quote.",
      reason: "Ensures no leads generated from your website audit fixes slip through unaddressed.",
      action: "Create templates for Day 2, Day 5, and Day 10 follow-ups with helpful context rather than pushy sales messages.",
      hypothesis: "Consistent structured follow-ups convert at least 15% of previously stalled quotes into active jobs.",
      successMetric: "100% of new quotes followed up within 48 hours; track monthly close rate.",
      deadline: "Within 7 days",
      status: "New",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return generated;
}
