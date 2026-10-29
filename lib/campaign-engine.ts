export interface SavedCampaign {
  id: string;
  title: string;
  opportunityTitle: string;
  campaignType: "outreach" | "landing_page" | "proposal" | "community_reply";
  content: string;
  status: "Draft" | "Ready" | "Sent" | "Converted";
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "gainforge_saved_campaigns_v1";

export const SAMPLE_CAMPAIGNS: SavedCampaign[] = [
  {
    id: "camp-1",
    title: "Commercial Property Manager 3-Touch Cold Outreach",
    opportunityTitle: "Publish a targeted service package for commercial decision-makers",
    campaignType: "outreach",
    content: `### Touch 1: The Specific Observation (Day 1)
Subject: Quick question regarding facility response times at {{Company}}

Hi {{First_Name}},

I noticed {{Company}} manages commercial office spaces in our area. When speaking with facility heads, their #1 complaint about incumbent maintenance contractors is lack of clear SLAs and missed morning schedules.

We operate with a guaranteed 2-hour response window and submit digital proof-of-completion after every visit.

Would you be open to a 5-minute introductory call this Thursday to see how our commercial rates compare?

Best regards,
Commercial Operations Team`,
    status: "Ready",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function loadCampaigns(): SavedCampaign[] {
  if (typeof window === "undefined") return SAMPLE_CAMPAIGNS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SAMPLE_CAMPAIGNS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SAMPLE_CAMPAIGNS;
  } catch {
    return SAMPLE_CAMPAIGNS;
  }
}

export function saveCampaigns(campaigns: SavedCampaign[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
  } catch (err) {
    console.warn("Failed to persist campaigns", err);
  }
}
