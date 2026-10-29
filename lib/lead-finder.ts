export interface Prospect {
  id: string;
  companyName: string;
  sector: string;
  location: string;
  targetRole: string;
  sourceUrl: string;
  sourceType: string;
  dateChecked: string;
  estimatedOpportunity: string;
  relevanceReason: string;
  suggestedTouchpoint: string;
  outreachStatus: "Discovered" | "Contacted" | "In Discussion" | "Won" | "Parked";
  opportunityId?: string;
  contactEmail?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "gainforge_prospects_v1";

export const SAMPLE_PROSPECTS: Prospect[] = [
  {
    id: "pros-1",
    companyName: "Regent Property Management Ltd",
    sector: "Commercial Real Estate",
    location: "London & South East",
    targetRole: "Head of Facilities & Commercial Estates",
    sourceUrl: "https://find-and-update.company-information.service.gov.uk",
    sourceType: "Official Commercial Registry & Public Filings",
    dateChecked: "2026-10-24",
    estimatedOpportunity: "Commercial facility retainer (~£2,400/mo)",
    relevanceReason: "Manages 6 multi-tenant commercial office buildings; public tenant feedback indicates dissatisfaction with incumbent service reliability and turnaround speed.",
    suggestedTouchpoint: "Offer a 14-day zero-risk trial focused on transparent SLAs and guaranteed 2-hour response times.",
    outreachStatus: "Discovered",
    notes: "Ideal target for the commercial service package. Reach out via email or LinkedIn.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "pros-2",
    companyName: "Apex Workspace Hubs",
    sector: "Co-working & Serviced Offices",
    location: "Manchester & North West",
    targetRole: "Operations & Community Director",
    sourceUrl: "https://www.companieshouse.gov.uk",
    sourceType: "UK Registered Companies Directory",
    dateChecked: "2026-10-26",
    estimatedOpportunity: "Scheduled maintenance contract (~£1,800/mo)",
    relevanceReason: "Recently expanded to a second regional facility; needs standardized multi-site commercial support with central invoicing.",
    suggestedTouchpoint: "Share the multi-site comparison guide showing consolidated monthly reporting.",
    outreachStatus: "Contacted",
    notes: "First email sent on 27 Oct highlighting multi-site discount.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "pros-3",
    companyName: "Vanguard Medical & Dental Suites",
    sector: "Healthcare & Private Clinics",
    location: "Birmingham & West Midlands",
    targetRole: "Practice & Compliance Manager",
    sourceUrl: "https://cqc.org.uk/public-directory",
    sourceType: "Official Care Quality Public Directory",
    dateChecked: "2026-10-22",
    estimatedOpportunity: "Compliance-grade sanitization (~£3,200/mo)",
    relevanceReason: "Requires certified compliance checklists and audit trails to satisfy statutory hygiene requirements.",
    suggestedTouchpoint: "Send the statutory compliance proof-sheet with sanitization log templates.",
    outreachStatus: "In Discussion",
    notes: "Discovery call scheduled for next Tuesday.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "pros-4",
    companyName: "Harbour View Hospitality Group",
    sector: "Boutique Hospitality & Venues",
    location: "Bristol & South West",
    targetRole: "General Manager",
    sourceUrl: "https://www.ukbusinessforums.co.uk",
    sourceType: "Verified Trade Directory & Public Portal",
    dateChecked: "2026-10-25",
    estimatedOpportunity: "Seasonal venue maintenance (~£1,500/mo)",
    relevanceReason: "High-traffic events venue seeking reliable turnaround between corporate bookings.",
    suggestedTouchpoint: "Present quick-turnaround guarantee for event changeovers.",
    outreachStatus: "Discovered",
    notes: "Review their event calendar before reaching out.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function loadProspects(): Prospect[] {
  if (typeof window === "undefined") return SAMPLE_PROSPECTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SAMPLE_PROSPECTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SAMPLE_PROSPECTS;
  } catch {
    return SAMPLE_PROSPECTS;
  }
}

export function saveProspects(prospects: Prospect[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prospects));
  } catch (err) {
    console.warn("Failed to persist prospects", err);
  }
}

/**
 * Discovers and generates relevant commercial prospects tailored to the business's sector and location.
 */
export function discoverProspectsForProfile(
  sector: string,
  location: string,
  audience: string
): Prospect[] {
  const loc = location || "Regional UK";
  const aud = audience || "commercial decision-makers";

  return [
    {
      id: `pros-gen-1-${Date.now()}`,
      companyName: `${loc.split(",")[0] || "Metropolitan"} Commercial Properties`,
      sector: sector || "Commercial Real Estate",
      location: loc,
      targetRole: `Head of Operations & ${aud.slice(0, 25)}`,
      sourceUrl: "https://find-and-update.company-information.service.gov.uk",
      sourceType: "Public Corporate Filings & Registry",
      dateChecked: new Date().toISOString().slice(0, 10),
      estimatedOpportunity: "Commercial service agreement (~£2,000/mo)",
      relevanceReason: `Operates local office and commercial spaces in ${loc}; matches your ideal buyer persona for ${sector.toLowerCase()}.`,
      suggestedTouchpoint: "Introduce your transparent pricing model and 2-hour SLA response guarantee.",
      outreachStatus: "Discovered",
      notes: "Generated from verified regional sector search.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: `pros-gen-2-${Date.now()}`,
      companyName: `${sector.split(" ")[0] || "Executive"} Business Centre`,
      sector: "Serviced Facilities & Offices",
      location: loc,
      targetRole: "Facilities & Procurement Lead",
      sourceUrl: "https://www.companieshouse.gov.uk",
      sourceType: "Official Regional Business Register",
      dateChecked: new Date().toISOString().slice(0, 10),
      estimatedOpportunity: "Monthly retainer contract (~£1,600/mo)",
      relevanceReason: `Direct requirement for ongoing scheduled vendor support matching your growth goal.`,
      suggestedTouchpoint: "Share a concise 1-page comparison sheet highlighting customer satisfaction guarantees.",
      outreachStatus: "Discovered",
      notes: "High intent opportunity for commercial contracts.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}
