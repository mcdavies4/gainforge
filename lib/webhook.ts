"use server";

export interface LeadData {
  email: string;
  consent?: boolean;
  company?: string;
  url?: string;
  website?: string;
  score?: number | null;
  source?: string;
  submittedAt?: string;
  [key: string]: unknown;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Sends JSON lead data to the LEAD_WEBHOOK_URL environment variable using a secure POST request.
 * Enables sending user-captured leads to preferred external automation tools like Make.com, Zapier, etc.
 */
export async function sendLeadToWebhook(lead: LeadData): Promise<{ ok: boolean; status?: number; error?: string }> {
  // Honeypot: real visitors never fill this field. Silently accept for bots.
  if (typeof lead.company === "string" && lead.company.trim() !== "") {
    return { ok: true };
  }

  const email = typeof lead.email === "string" ? lead.email.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    throw new Error("Enter a valid email address.");
  }

  if (lead.consent !== true) {
    throw new Error("Please tick the box so we know you're happy to hear from us.");
  }

  const payload = {
    email,
    website: typeof lead.url === "string" ? lead.url.slice(0, 300) : (typeof lead.website === "string" ? lead.website.slice(0, 300) : ""),
    score: typeof lead.score === "number" && Number.isFinite(lead.score) ? Math.round(lead.score) : null,
    source: lead.source || "auditor",
    consent: "Agreed to hear about personalised growth plans and GainForge updates",
    submittedAt: lead.submittedAt || new Date().toISOString(),
  };

  const webhookUrl = process.env.LEAD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.info("[gainforge-lead]", JSON.stringify(payload));
    return { ok: true };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      throw new Error(`Webhook responded with status ${res.status}`);
    }

    return { ok: true, status: res.status };
  } catch (err) {
    console.error("Lead webhook delivery failed", err);
    throw new Error("We couldn't save that just now. Please try again in a minute.");
  }
}

export const sendLeadWebhook = sendLeadToWebhook;
export const sendWebhook = sendLeadToWebhook;
export default sendLeadToWebhook;
