export interface CompetitorComparison {
  dimension: string;
  yourStatus: string;
  typicalCompetitor: string;
  competitiveOpportunity: string;
  impact: "High" | "Medium";
}

export const COMPETITOR_BENCHMARKS: CompetitorComparison[] = [
  {
    dimension: "Response Time & Quoting",
    yourStatus: "Direct enquiries with 2-hour guarantee target",
    typicalCompetitor: "Takes 24–48 hours to reply to website requests",
    competitiveOpportunity: "Highlight '2-Hour Response Commitment' prominently on homepage and quote form.",
    impact: "High",
  },
  {
    dimension: "Pricing Transparency",
    yourStatus: "Transparent package starting prices & scoping",
    typicalCompetitor: "Vague 'Call for quote' with zero price indicators",
    competitiveOpportunity: "Publishing starting rates eliminates buyer anxiety and captures price-ready leads.",
    impact: "High",
  },
  {
    dimension: "Trust Signals & Guarantees",
    yourStatus: "14-day risk-reversal & SLA quality checklist",
    typicalCompetitor: "Generic '100% satisfaction' with no measurable criteria",
    competitiveOpportunity: "Offer a concrete written guarantee: re-inspection within 24h if any item is missed.",
    impact: "High",
  },
  {
    dimension: "Commercial Package Clarity",
    yourStatus: "Dedicated packages for facilities & multi-site accounts",
    typicalCompetitor: "One-size-fits-all generic consumer messaging",
    competitiveOpportunity: "Separate consumer and B2B commercial landing pages to avoid mixed messaging.",
    impact: "Medium",
  },
  {
    dimension: "Mobile Contact Friction",
    yourStatus: "Tap-to-call, 1-click email and short enquiry forms",
    typicalCompetitor: "Long 10-field desktop-only contact forms",
    competitiveOpportunity: "Short 2-field mobile form captures 30% more out-of-hours leads.",
    impact: "Medium",
  },
];
