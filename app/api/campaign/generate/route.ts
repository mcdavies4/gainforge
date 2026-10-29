import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CampaignRequest {
  opportunityTitle: string;
  category: string;
  action: string;
  evidence?: string;
  businessName: string;
  industry?: string;
  targetAudience: string;
  campaignType: "outreach" | "landing_page" | "proposal" | "community_reply";
}

export async function POST(request: Request) {
  let body: CampaignRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 });
  }

  const {
    opportunityTitle,
    category,
    action,
    evidence = "Direct commercial opportunity identified in growth audit.",
    businessName = "Your Business",
    industry = "Service Provider",
    targetAudience = "Commercial Decision Makers",
    campaignType = "outreach",
  } = body;

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      let prompt = "";

      if (campaignType === "outreach") {
        prompt = `You are a world-class B2B growth and outbound copywriter. Write a 3-touch cold email sequence for ${businessName} (Industry: ${industry}).
Target Prospect: ${targetAudience}.
Context / Opportunity: "${opportunityTitle}" (${category}).
Observed Evidence: "${evidence}".
Desired Action: "${action}".

Tone: Direct, empathetic, highly professional, zero-fluff, non-pushy. Focus on practical value, transparent response times, and clear commercial benefit.

Formatting:
### Touch 1: The Specific Observation (Day 1)
- Subject line (2 punchy options)
- Body (under 110 words)
- Low-friction Call To Action (e.g. "Open to a 5-minute phone chat?")

### Touch 2: The Social Proof & Comparison (Day 4)
- Subject line (Re: previous subject)
- Body (under 90 words, showing contrast vs standard market alternatives)
- Clear proof point

### Touch 3: The Polite Breakup & Resource (Day 9)
- Subject line
- Body (under 70 words, respectful exit leaving door open)`;
      } else if (campaignType === "landing_page") {
        prompt = `You are an expert conversion rate optimization (CRO) copywriter. Write high-converting landing page section copy for ${businessName} (Industry: ${industry}).
Target Customer: ${targetAudience}.
Goal / Barrier to Fix: "${opportunityTitle}" (${category}).
Evidence: "${evidence}".
Action: "${action}".

Provide:
1. Primary Hero Headline (Clear value proposition, not clever wordplay)
2. Supporting Sub-headline (Who it's for, what problem it eliminates)
3. 3 Core Benefit Bullets with Proof Hooks
4. The Objection-Killer FAQ Item (Addressing pricing, reliability, or switching friction)
5. Primary Call To Action Button Label + Risk-Reversal Microcopy`;
      } else if (campaignType === "proposal") {
        prompt = `Create a structured 1-page B2B Commercial Service Proposal Outline for ${businessName} tailored to ${targetAudience}.
Based on opportunity: "${opportunityTitle}".
Evidence: "${evidence}".

Format with:
- Executive Summary & Customer Problem Solved
- Recommended Scope & Service Level Agreement (SLA, e.g., 2-hr response guarantee)
- Transparent Pricing & Terms Framework
- Simple 3-Step Onboarding Process`;
      } else {
        prompt = `Draft an expert, non-promotional public discussion reply for an industry community or forum.
Business: ${businessName} (${industry}).
Topic / Discussion: "${opportunityTitle}".
Objective: Provide genuinely helpful, objective guidance that builds trust without sounding like an aggressive sales pitch. Include 3 concrete tips a buyer can use today.`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      if (response && response.text) {
        return NextResponse.json({
          content: response.text,
          model: "gemini-2.5-flash",
        });
      }
    } catch (err) {
      console.warn("Gemini generation failed, using expert template fallback", err);
    }
  }

  // High-fidelity fallback templates when API key is not configured or in case of rate limit
  const fallbackContent = generateFallbackCampaign(body);
  return NextResponse.json({
    content: fallbackContent,
    model: "heuristic-growth-engine",
  });
}

function generateFallbackCampaign(data: CampaignRequest): string {
  const { businessName, targetAudience, opportunityTitle, action, evidence, campaignType } = data;

  if (campaignType === "landing_page") {
    return `### Landing Page Copy Blueprint: ${opportunityTitle}

**Primary Hero Headline:**
"Reliable ${data.industry || "Commercial Services"} Built for ${targetAudience} — Guaranteed Response Within 2 Hours."

**Supporting Sub-headline:**
"Tired of chasing suppliers and delayed quotes? ${businessName} provides transparent pricing, dedicated account oversight, and guaranteed delivery so you never have to second-guess quality."

---

### Core Value Drivers:
1. **Zero Guesswork Pricing:** Transparent scope before work begins. No hidden overtime fees or surprise invoices.
2. **Dedicated SLA Guarantees:** 2-hour response window on urgent tickets, with live tracking and scheduled milestone reports.
3. **Seamless Transition:** We handle vendor handover checklists so your daily operations continue uninterrupted.

---

### The Objection-Killer FAQ:
**Q: How difficult is it to switch providers or get started?**
**A:** We manage the entire transition. We begin with a zero-cost 15-minute diagnostic walk-through and have your team covered within 48 hours without operational downtime.

---

### Calls To Action:
- **Primary Button:** [Request a 15-Minute Diagnostic Quote]
- **Risk-Reversal Copy:** "No commitment required. Receive your custom scope within 24 hours."`;
  }

  if (campaignType === "proposal") {
    return `### 1-Page Commercial Proposal: ${opportunityTitle}
**Prepared by:** ${businessName}  
**Prepared for:** ${targetAudience}

---

#### 1. Executive Summary
Based on recent review (${evidence}), commercial operations require consistent reliability, verified compliance, and direct accountability. This agreement outlines a dedicated service partnership with ${businessName}.

#### 2. Key Scope & Deliverables
- **Core Action:** ${action}
- **Frequency & Timing:** Scheduled service intervals designed around your peak operational hours.
- **Dedicated Quality Checklists:** Digital proof-of-work submitted after every milestone.

#### 3. Service Level Commitments (SLAs)
- **Response Time:** Guaranteed acknowledgement within 60 minutes for urgent requests.
- **Satisfaction Guarantee:** If any deliverable fails inspection, it is corrected within 24 hours at zero additional cost.

#### 4. Pricing & Investment
- Transparent monthly retainer based on exact facility footprint.
- 30-day rolling terms with 14-day zero-risk trial period.`;
  }

  if (campaignType === "community_reply") {
    return `### Helpful Community Discussion Reply
**Context:** In response to discussions around "${opportunityTitle}"

"Here are 3 practical questions worth asking before making a hiring decision in this category:

1. **Ask for their written SLA:** What happens when an urgent issue arises at 5 PM on a Friday? A reliable provider will commit to a response window in writing.
2. **Clarify invoice transparency:** Ensure the initial scope includes all consumables, equipment, and routine checks so you don't face unexpected monthly add-ons.
3. **Verify supervision:** Who physically inspects the work? A supplier with a dedicated site supervisor will consistently outperform one relying on self-reporting.

Hope this helps anyone evaluating alternatives! Happy to share a free vendor evaluation checklist if useful."`;
  }

  // Default: 3-touch outreach sequence
  return `### Touch 1: The Specific Observation (Day 1)
**Subject:** Quick question regarding ${targetAudience} at {{Company}}
**Alt Subject:** Practical idea for {{Company}}

Hi {{First_Name}},

I noticed {{Company}} manages active operations in our area. From our recent work with similar organisations, many leaders tell us their biggest frustration is suppliers who take days to respond to simple quote adjustments.

At ${businessName}, we guarantee a 2-hour response window and transparent monthly reporting so you always know where projects stand.

${action}

Open to a brief 5-minute phone chat this Thursday afternoon to see if this is relevant for {{Company}}?

Best regards,  
${businessName}

---

### Touch 2: The Social Proof & Comparison (Day 4)
**Subject:** Re: Quick question regarding ${targetAudience} at {{Company}}

Hi {{First_Name}},

Following up briefly on my earlier note. 

When organisations switch to us, the primary reason is eliminating the administrative headache of chasing uncompleted tasks. We provide digital proof-of-work and dedicated SLA accountability.

Would it be helpful if I shared our 1-page comparison sheet showing how our scope compares to traditional providers?

Best,  
${businessName}

---

### Touch 3: The Polite Breakup (Day 9)
**Subject:** Closing the loop / {{Company}}

Hi {{First_Name}},

I know your schedule is full, so I won't follow up again uninvited. 

If resolving ${opportunityTitle.toLowerCase()} ever becomes a priority this quarter, you can find our full service packages and transparent pricing at ${data.businessName}.

Wishing you and the team continued success.

Warm regards,  
${businessName}`;
}
