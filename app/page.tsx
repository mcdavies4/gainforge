"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Activity, ArrowRight, ArrowUpRight, BarChart3, Bell, Building2, Calendar,
  Check, CheckCircle2, ChevronDown, CircleHelp, Clock, Compass, Copy,
  CreditCard, Download, ExternalLink, FileText, Filter, Globe2, HelpCircle, Layers,
  LayoutDashboard, Lightbulb, ListChecks, Mail, Menu, Plus, Printer, RefreshCw,
  RotateCcw, Search, Send, SendHorizontal, Settings2, Share2, ShieldCheck, Sparkles, Target,
  TrendingUp, Users, X, Zap
} from "lucide-react";
import Link from "next/link";
import type { AuditReport } from "@/lib/audit-types";
import {
  type BusinessProfile,
  type GrowthOpportunity,
  type OpportunityCategory,
  DEFAULT_PROFILE,
  INITIAL_OPPORTUNITIES,
  loadProfile,
  saveProfile,
  loadOpportunities,
  saveOpportunities,
  loadLatestAudit,
  generateOpportunitiesFromAudit,
} from "@/lib/growth-engine";
import {
  type Prospect,
  loadProspects,
  saveProspects,
  discoverProspectsForProfile,
} from "@/lib/lead-finder";
import {
  type SavedCampaign,
  loadCampaigns,
  saveCampaigns,
} from "@/lib/campaign-engine";
import {
  type RoiStats,
  type AuditHistoryEntry,
  loadRoiStats,
  saveRoiStats,
  loadAuditHistory,
} from "@/lib/roi-engine";
import {
  COMPETITOR_BENCHMARKS,
  type CompetitorAnalysis,
  loadCompetitorAnalyses,
  saveCompetitorAnalyses,
  performCompetitorComparison,
} from "@/lib/competitor-engine";
import {
  type ClientWorkspace,
  loadWorkspaces,
  saveWorkspaces,
  getActiveWorkspaceId,
  setActiveWorkspaceId,
  INITIAL_WORKSPACES,
} from "@/lib/workspaces";
import { sendProspectToWebhook } from "@/lib/webhook";

const navItems = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Opportunities", icon: Compass },
  { label: "Lead Finder", icon: Users },
  { label: "Campaigns", icon: Mail },
  { label: "Action centre", icon: ListChecks },
  { label: "Revenue & ROI", icon: BarChart3 },
  { label: "Competitors", icon: ShieldCheck },
];

const EFFORT_LABELS = {
  quick: "Quick win · ~15 min",
  medium: "Medium · 1–2 hrs",
  bigger: "Bigger initiative · 1/2 day+",
};

export default function Home() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [profile, setProfile] = useState<BusinessProfile>(DEFAULT_PROFILE);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddOppModal, setShowAddOppModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showAddProspectModal, setShowAddProspectModal] = useState(false);

  // Agency Multi-Client Workspaces State
  const [workspaces, setWorkspaces] = useState<ClientWorkspace[]>(INITIAL_WORKSPACES);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string>("ws-default");
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [showNewWorkspaceModal, setShowNewWorkspaceModal] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [newWsIndustry, setNewWsIndustry] = useState("");
  const [newWsAudience, setNewWsAudience] = useState("");
  const [newWsLocation, setNewWsLocation] = useState("");
  const [newWsGoal, setNewWsGoal] = useState("Generate more qualified leads");

  // Executive Growth Brief Modal State
  const [showBriefModal, setShowBriefModal] = useState(false);

  // Growth Engine Data
  const [opportunities, setOpportunities] = useState<GrowthOpportunity[]>(INITIAL_OPPORTUNITIES);
  const [latestAudit, setLatestAudit] = useState<AuditReport | null>(null);

  // Lead Finder State
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [prospectFilter, setProspectFilter] = useState("All");
  const [prospectSearch, setProspectSearch] = useState("");
  const [newProspectName, setNewProspectName] = useState("");
  const [newProspectRole, setNewProspectRole] = useState("");
  const [newProspectSector, setNewProspectSector] = useState("");
  const [newProspectUrl, setNewProspectUrl] = useState("");
  const [newProspectOpportunity, setNewProspectOpportunity] = useState("");
  const [prospectWebhookStatus, setProspectWebhookStatus] = useState<Record<string, "sending" | "success" | "error">>({});

  // Campaign Builder & Interactive Email Client Preview State
  const [campaigns, setCampaigns] = useState<SavedCampaign[]>([]);
  const [selectedOppForCampaign, setSelectedOppForCampaign] = useState<string>("");
  const [campaignType, setCampaignType] = useState<"outreach" | "landing_page" | "proposal" | "community_reply">("outreach");
  const [generatedCampaign, setGeneratedCampaign] = useState<string>("");
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [copiedCampaign, setCopiedCampaign] = useState(false);
  const [emailViewMode, setEmailViewMode] = useState<"preview" | "raw">("preview");
  const [selectedProspectForEmailId, setSelectedProspectForEmailId] = useState<string>("");
  const [customEmailSubject, setCustomEmailSubject] = useState("");

  // ROI & Pipeline Stats
  const [roiStats, setRoiStats] = useState<RoiStats>(loadRoiStats());
  const [auditHistory, setAuditHistory] = useState<AuditHistoryEntry[]>([]);

  // Competitor Analysis State
  const [competitorAnalyses, setCompetitorAnalyses] = useState<CompetitorAnalysis[]>([]);
  const [showCompetitorModal, setShowCompetitorModal] = useState(false);
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [competitorName, setCompetitorName] = useState("");
  const [analyzingCompetitor, setAnalyzingCompetitor] = useState(false);

  // Filters & Selection
  const [filter, setFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<GrowthOpportunity | null>(null);
  const [toast, setToast] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  // Custom Opportunity creation state
  const [newOppTitle, setNewOppTitle] = useState("");
  const [newOppCategory, setNewOppCategory] = useState<OpportunityCategory>("Conversion");
  const [newOppAction, setNewOppAction] = useState("");
  const [newOppEvidence, setNewOppEvidence] = useState("");
  const [newOppDeadline, setNewOppDeadline] = useState("Within 7 days");
  const [newOppEffort, setNewOppEffort] = useState<"quick" | "medium" | "bigger">("quick");

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3500);
  };


  const syncAuditToEngine = useCallback(
    (audit: AuditReport, currentProfile: BusinessProfile, existingOpps: GrowthOpportunity[]) => {
      const generated = generateOpportunitiesFromAudit(currentProfile, audit);
      const existingTitles = new Set(existingOpps.map((o) => o.title.toLowerCase()));
      const fresh = generated.filter((g) => !existingTitles.has(g.title.toLowerCase()));

      const combined = [...fresh, ...existingOpps];
      setOpportunities(combined);
      saveOpportunities(combined);
      notify(`Synthesized ${fresh.length} audit-backed opportunities into your pipeline.`);
    },
    []
  );

  // Load all persisted state on mount
  useEffect(() => {
    const savedProfile = loadProfile();
    setProfile(savedProfile);

    const savedOpps = loadOpportunities();
    setOpportunities(savedOpps);
    if (savedOpps.length > 0) {
      setSelectedOppForCampaign(savedOpps[0].id);
    }

    const audit = loadLatestAudit();
    setLatestAudit(audit);

    const savedProspects = loadProspects();
    setProspects(savedProspects);

    const savedCampaigns = loadCampaigns();
    setCampaigns(savedCampaigns);

    const savedRoi = loadRoiStats();
    setRoiStats(savedRoi);

    const savedHistory = loadAuditHistory();
    setAuditHistory(savedHistory);

    const savedCompetitors = loadCompetitorAnalyses();
    setCompetitorAnalyses(savedCompetitors);

    const savedWorkspaces = loadWorkspaces();
    setWorkspaces(savedWorkspaces);
    const activeId = getActiveWorkspaceId();
    setActiveWorkspaceIdState(activeId);

    // If active workspace is found in saved workspaces, ensure matching state
    const currentWs = savedWorkspaces.find((w) => w.id === activeId);
    if (currentWs) {
      setProfile(currentWs.profile);
      setOpportunities(currentWs.opportunities);
      setProspects(currentWs.prospects);
      setCampaigns(currentWs.campaigns);
      setRoiStats(currentWs.roiStats);
      if (currentWs.opportunities.length > 0) {
        setSelectedOppForCampaign(currentWs.opportunities[0].id);
      }
    }

    // Check for audit sync URL trigger
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const shouldSync = params.get("syncAudit") === "true";
      const prefillUrl = params.get("url");

      if (prefillUrl && (!savedProfile.website || savedProfile.website !== prefillUrl)) {
        const updated = { ...savedProfile, website: prefillUrl };
        setProfile(updated);
        saveProfile(updated);
      }

      if (shouldSync && audit) {
        syncAuditToEngine(audit, savedProfile, savedOpps);
      }
    }
  }, [syncAuditToEngine]);

  // Agency Workspace Handlers
  const handleSwitchWorkspace = (targetId: string) => {
    // 1. Snapshot current workspace state into workspaces
    const currentSnapshot: ClientWorkspace = {
      id: activeWorkspaceId,
      name: profile.name,
      industry: profile.industry,
      profile,
      opportunities,
      prospects,
      campaigns,
      roiStats,
      latestAudit,
      auditHistory,
      competitors: competitorAnalyses,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedWorkspaces = workspaces.map((ws) =>
      ws.id === activeWorkspaceId ? currentSnapshot : ws
    );

    const target = updatedWorkspaces.find((ws) => ws.id === targetId);
    if (!target) return;

    setWorkspaces(updatedWorkspaces);
    saveWorkspaces(updatedWorkspaces);
    setActiveWorkspaceIdState(targetId);
    setActiveWorkspaceId(targetId);

    // 2. Load target workspace state
    setProfile(target.profile);
    setOpportunities(target.opportunities);
    setProspects(target.prospects);
    setCampaigns(target.campaigns);
    setRoiStats(target.roiStats);
    setLatestAudit(target.latestAudit);
    setAuditHistory(target.auditHistory);
    setCompetitorAnalyses(target.competitors);
    if (target.opportunities.length > 0) {
      setSelectedOppForCampaign(target.opportunities[0].id);
    }
    setIsWorkspaceMenuOpen(false);
    notify(`Switched client workspace to ${target.name}.`);
  };

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    const newWsId = `ws-${Date.now()}`;
    const newWsProfile: BusinessProfile = {
      name: newWsName.trim(),
      industry: newWsIndustry.trim() || "Professional Services",
      targetAudience: newWsAudience.trim() || "Commercial Decision Makers",
      location: newWsLocation.trim() || "UK & Remote",
      website: "",
      goal: newWsGoal || "Generate more qualified leads",
      challenge: "Accelerate customer acquisition and increase pipeline velocity",
      updatedAt: new Date().toISOString(),
    };

    const newWs: ClientWorkspace = {
      id: newWsId,
      name: newWsProfile.name,
      industry: newWsProfile.industry,
      profile: newWsProfile,
      opportunities: [
        {
          id: `opp-${newWsId}-1`,
          title: `Define competitive value proposition for ${newWsProfile.name}`,
          category: "Trust & Positioning",
          company: newWsProfile.name,
          value: "Target customer acquisition",
          confidence: "High",
          effort: "quick",
          source: "Strategic Growth Intake",
          evidence: `Direct intake for ${newWsProfile.industry} targeting ${newWsProfile.targetAudience}.`,
          reason: `Establishes distinct positioning before outbound outreach launches.`,
          action: "Draft clear 1-sentence value proposition and core commercial offer.",
          hypothesis: "A direct, unambiguous offer improves initial prospect response rates by 20%.",
          successMetric: "Finalised positioning statement approved by leadership.",
          deadline: "Within 7 days",
          status: "New",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      prospects: discoverProspectsForProfile(
        newWsProfile.industry,
        newWsProfile.location,
        newWsProfile.targetAudience
      ),
      campaigns: [],
      roiStats: {
        averageDealValue: 3500,
        monthlyMarketingSpend: 500,
        totalEnquiries: 5,
        qualifiedLeads: 2,
        dealsWon: 0,
        verifiedWonRevenue: 0,
      },
      latestAudit: null,
      auditHistory: [],
      competitors: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newWs, ...workspaces];
    setWorkspaces(updated);
    saveWorkspaces(updated);
    setShowNewWorkspaceModal(false);
    setNewWsName("");
    setNewWsIndustry("");
    setNewWsAudience("");
    setNewWsLocation("");

    // Switch to it
    handleSwitchWorkspace(newWsId);
    notify(`Created new client workspace: ${newWs.name}`);
  };

  // Push verified prospect to Make.com / Zapier webhook
  const handlePushProspectToWebhook = async (p: Prospect) => {
    setProspectWebhookStatus((prev) => ({ ...prev, [p.id]: "sending" }));
    try {
      await sendProspectToWebhook({
        companyName: p.companyName,
        targetRole: p.targetRole,
        sector: p.sector,
        location: p.location,
        sourceUrl: p.sourceUrl,
        sourceType: p.sourceType,
        dateChecked: p.dateChecked,
        estimatedOpportunity: p.estimatedOpportunity,
        relevanceReason: p.relevanceReason,
        outreachStatus: p.outreachStatus,
        clientWorkspace: profile.name,
      });
      setProspectWebhookStatus((prev) => ({ ...prev, [p.id]: "success" }));
      notify(`Pushed ${p.companyName} to webhook endpoint (Make.com / Zapier).`);
    } catch (err) {
      setProspectWebhookStatus((prev) => ({ ...prev, [p.id]: "error" }));
      notify(err instanceof Error ? err.message : "Failed to push to webhook.");
    }
  };


  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!competitorUrl.trim()) return;

    setAnalyzingCompetitor(true);
    try {
      const result = await performCompetitorComparison(
        competitorUrl,
        competitorName,
        profile.name,
        profile.industry
      );

      const updated = [result, ...competitorAnalyses];
      setCompetitorAnalyses(updated);
      saveCompetitorAnalyses(updated);
      setShowCompetitorModal(false);
      setCompetitorUrl("");
      setCompetitorName("");
      notify(`Competitor comparison completed for ${result.competitorName}.`);
    } catch {
      notify("Failed to analyze competitor. Please check the address.");
    } finally {
      setAnalyzingCompetitor(false);
    }
  };

  const deleteCompetitorAnalysis = (id: string) => {
    const updated = competitorAnalyses.filter((c) => c.id !== id);
    setCompetitorAnalyses(updated);
    saveCompetitorAnalyses(updated);
    notify("Competitor analysis removed.");
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...profile,
      name: profile.name.trim() || "Your business",
      updatedAt: new Date().toISOString(),
    };
    setProfile(updated);
    saveProfile(updated);
    setShowProfileModal(false);

    if (latestAudit) {
      syncAuditToEngine(latestAudit, updated, opportunities);
    } else {
      notify("Business profile saved to your workspace.");
    }
  };

  const updateStatus = (id: string, status: GrowthOpportunity["status"]) => {
    const updated = opportunities.map((o) =>
      o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o
    );
    setOpportunities(updated);
    saveOpportunities(updated);
    if (selected && selected.id === id) {
      setSelected({ ...selected, status, updatedAt: new Date().toISOString() });
    }

    if (status === "Won") {
      const newRoi = {
        ...roiStats,
        dealsWon: roiStats.dealsWon + 1,
        verifiedWonRevenue: roiStats.verifiedWonRevenue + roiStats.averageDealValue,
      };
      setRoiStats(newRoi);
      saveRoiStats(newRoi);
      notify("Marked as won! Verified customer outcome and revenue updated.");
    } else {
      notify(`Opportunity moved to ${status.toLowerCase()}.`);
    }
  };

  const updateOpportunityNote = (id: string, notes: string) => {
    const updated = opportunities.map((o) =>
      o.id === id ? { ...o, notes, updatedAt: new Date().toISOString() } : o
    );
    setOpportunities(updated);
    saveOpportunities(updated);
    if (selected && selected.id === id) {
      setSelected({ ...selected, notes });
    }
  };

  const updateOpportunityDeadline = (id: string, deadline: string) => {
    const updated = opportunities.map((o) =>
      o.id === id ? { ...o, deadline, updatedAt: new Date().toISOString() } : o
    );
    setOpportunities(updated);
    saveOpportunities(updated);
    if (selected && selected.id === id) {
      setSelected({ ...selected, deadline });
    }
    notify("Target deadline updated.");
  };

  const handleCreateOpportunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOppTitle.trim()) return;

    const newOpp: GrowthOpportunity = {
      id: `custom-opp-${Date.now()}`,
      title: newOppTitle.trim(),
      category: newOppCategory,
      company: profile.name || "Your business",
      value: "Commercial growth action",
      confidence: "High",
      effort: newOppEffort,
      source: "User-defined growth initiative",
      evidence: newOppEvidence.trim() || "Direct commercial hypothesis and user observation.",
      reason: `Supports ${profile.goal.toLowerCase()} by executing user-prioritised initiative.`,
      action: newOppAction.trim() || "Execute planned task and track client response.",
      hypothesis: "Executing this focused action will generate verified enquiries.",
      successMetric: "Customer response or completed sales conversation.",
      deadline: newOppDeadline,
      status: "New",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newOpp, ...opportunities];
    setOpportunities(updated);
    saveOpportunities(updated);
    setShowAddOppModal(false);
    setNewOppTitle("");
    setNewOppAction("");
    setNewOppEvidence("");
    notify("New growth opportunity added to your pipeline.");
  };

  // Lead Finder Handlers
  const handleDiscoverProspects = () => {
    const discovered = discoverProspectsForProfile(
      profile.industry,
      profile.location,
      profile.targetAudience
    );
    const existingIds = new Set(prospects.map((p) => p.companyName.toLowerCase()));
    const fresh = discovered.filter((d) => !existingIds.has(d.companyName.toLowerCase()));
    const combined = [...fresh, ...prospects];
    setProspects(combined);
    saveProspects(combined);
    notify(`Discovered ${fresh.length} relevant commercial prospects from public registers.`);
  };

  const updateProspectStatus = (id: string, status: Prospect["outreachStatus"]) => {
    const updated = prospects.map((p) =>
      p.id === id ? { ...p, outreachStatus: status, updatedAt: new Date().toISOString() } : p
    );
    setProspects(updated);
    saveProspects(updated);

    if (status === "Won") {
      const newRoi = {
        ...roiStats,
        dealsWon: roiStats.dealsWon + 1,
        verifiedWonRevenue: roiStats.verifiedWonRevenue + roiStats.averageDealValue,
      };
      setRoiStats(newRoi);
      saveRoiStats(newRoi);
      notify("Prospect marked as won! Pipeline revenue updated.");
    } else {
      notify(`Prospect status updated to ${status}.`);
    }
  };

  const handleAddCustomProspect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProspectName.trim()) return;

    const newP: Prospect = {
      id: `pros-custom-${Date.now()}`,
      companyName: newProspectName.trim(),
      sector: newProspectSector || profile.industry,
      location: profile.location || "Regional UK",
      targetRole: newProspectRole || "Decision Maker",
      sourceUrl: newProspectUrl || "https://companieshouse.gov.uk",
      sourceType: "Direct Research & Verifiable Registry",
      dateChecked: new Date().toISOString().slice(0, 10),
      estimatedOpportunity: newProspectOpportunity || `Commercial Service (~£${roiStats.averageDealValue})`,
      relevanceReason: `Matches target criteria for ${profile.industry} in ${profile.location}.`,
      suggestedTouchpoint: "Personalised introductory touchpoint focusing on SLAs and transparency.",
      outreachStatus: "Discovered",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const combined = [newP, ...prospects];
    setProspects(combined);
    saveProspects(combined);
    setShowAddProspectModal(false);
    setNewProspectName("");
    setNewProspectRole("");
    setNewProspectUrl("");
    setNewProspectOpportunity("");
    notify("Prospect added to your finder pipeline.");
  };

  // AI Campaign Generation Handler
  const handleGenerateCampaign = async () => {
    const opp = opportunities.find((o) => o.id === selectedOppForCampaign) || opportunities[0];
    if (!opp) {
      notify("Select an opportunity first.");
      return;
    }

    setCampaignLoading(true);
    setGeneratedCampaign("");

    try {
      const res = await fetch("/api/campaign/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityTitle: opp.title,
          category: opp.category,
          action: opp.action,
          evidence: opp.evidence,
          businessName: profile.name,
          industry: profile.industry,
          targetAudience: profile.targetAudience,
          campaignType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed.");

      setGeneratedCampaign(data.content);

      // Save to active campaigns
      const newCampaign: SavedCampaign = {
        id: `camp-${Date.now()}`,
        title: `${opp.title.slice(0, 45)} (${campaignType.replace("_", " ")})`,
        opportunityTitle: opp.title,
        campaignType,
        content: data.content,
        status: "Ready",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updated = [newCampaign, ...campaigns];
      setCampaigns(updated);
      saveCampaigns(updated);
      notify("Campaign generated and saved to active assets.");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Something went wrong generating campaign.");
    } finally {
      setCampaignLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCampaign(true);
      setTimeout(() => setCopiedCampaign(false), 2200);
      notify("Copied to clipboard.");
    } catch {
      notify("Unable to copy to clipboard.");
    }
  };

  // CSV Exports
  const exportCsv = () => {
    const rows = [
      [
        "Title",
        "Category",
        "Company / Focus",
        "Confidence",
        "Effort",
        "Source",
        "Observed Evidence",
        "Reason for Relevance",
        "Action to Take",
        "Hypothesis to Test",
        "Measurable Success Metric",
        "Deadline",
        "Status",
        "Notes",
      ],
      ...opportunities.map((o) => [
        o.title,
        o.category,
        o.company,
        o.confidence,
        o.effort,
        o.source,
        o.evidence,
        o.reason,
        o.action,
        o.hypothesis,
        o.successMetric,
        o.deadline,
        o.status,
        o.notes || "",
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blobUrl = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `gainforge-growth-pipeline-${profile.name.toLowerCase().replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(blobUrl);
    notify("Complete opportunity pipeline exported as CSV.");
  };

  // Filtered lists
  const visibleOpportunities = useMemo(() => {
    return opportunities.filter((o) => {
      const statusMatch = filter === "All" || o.status === filter;
      const categoryMatch = categoryFilter === "All" || o.category === categoryFilter;
      const queryMatch = `${o.title} ${o.category} ${o.company} ${o.evidence} ${o.action}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return statusMatch && categoryMatch && queryMatch;
    });
  }, [opportunities, filter, categoryFilter, searchTerm]);

  const visibleProspects = useMemo(() => {
    return prospects.filter((p) => {
      const statusMatch = prospectFilter === "All" || p.outreachStatus === prospectFilter;
      const queryMatch = `${p.companyName} ${p.sector} ${p.location} ${p.targetRole}`
        .toLowerCase()
        .includes(prospectSearch.toLowerCase());
      return statusMatch && queryMatch;
    });
  }, [prospects, prospectFilter, prospectSearch]);

  // Statistics
  const openCount = opportunities.filter((o) => o.status === "New" || o.status === "In progress").length;
  const inProgressCount = opportunities.filter((o) => o.status === "In progress").length;
  const wonCount = opportunities.filter((o) => o.status === "Won").length;
  const totalCount = opportunities.length;
  const completionPct = totalCount > 0 ? Math.round(((wonCount + inProgressCount * 0.5) / totalCount) * 100) : 0;

  // Pipeline calculations
  const totalPipelineValue = opportunities.length * roiStats.averageDealValue;
  const wonRevenue = roiStats.verifiedWonRevenue;
  const estimatedRoiRatio =
    roiStats.monthlyMarketingSpend > 0
      ? (wonRevenue / (roiStats.monthlyMarketingSpend * 3)).toFixed(1)
      : "14.8";

  const auditorHref = profile.website.trim()
    ? `/auditor?url=${encodeURIComponent(profile.website.trim())}`
    : "/auditor";

  // Active prospect chosen for email client preview
  const activeEmailProspect = useMemo(() => {
    return prospects.find((p) => p.id === selectedProspectForEmailId) || prospects[0] || null;
  }, [prospects, selectedProspectForEmailId]);

  // Derive interpolated email subject and body
  const previewEmailData = useMemo(() => {
    const p = activeEmailProspect;
    const recipientCompany = p ? p.companyName : "Your prospective client";
    const recipientRole = p ? p.targetRole : "Decision Maker";
    const recipientLocation = p ? p.location : profile.location || "your region";
    const recipientName = p ? p.targetRole.split(" ")[0] || "there" : "there";

    let raw = generatedCampaign;
    if (!raw && campaigns.length > 0) {
      raw = campaigns[0].content;
    }
    if (!raw) {
      raw = `Hi {{First_Name}},\n\nI noticed {{Company}} operates across {{Location}}. Many {{Role}}s in your sector mention their biggest challenge is response delays and lack of transparent SLAs from existing partners.\n\nAt ${profile.name}, we provide tailored ${profile.industry} with guaranteed 2-hour response windows and transparent weekly reporting.\n\nWould you be open to a brief 10-minute introductory conversation this Thursday at 11am to see if this could streamline operations for {{Company}}?\n\nBest regards,\n${profile.name} Team`;
    }

    const interpolatedBody = raw
      .replace(/\{\{First_Name\}\}/g, recipientName)
      .replace(/\{\{Company\}\}/g, recipientCompany)
      .replace(/\{\{Role\}\}/g, recipientRole)
      .replace(/\{\{Location\}\}/g, recipientLocation)
      .replace(/\{\{Target_Role\}\}/g, recipientRole);

    const defaultSubject = customEmailSubject || `Intro: ${profile.name} & ${recipientCompany} (${profile.industry})`;

    return {
      to: p ? `contact@${recipientCompany.toLowerCase().replace(/[^a-z0-9]/g, "")}.co.uk` : "client@example.com",
      toLabel: `${recipientRole} · ${recipientCompany}`,
      subject: defaultSubject,
      body: interpolatedBody,
      rawBody: raw,
    };
  }, [activeEmailProspect, generatedCampaign, campaigns, profile, customEmailSubject]);

  const smartAlerts = useMemo(() => {
    const list: Array<{ id: string; type: "urgent" | "growth"; title: string; desc: string; actionText: string; onAction: () => void }> = [];

    // 1. Follow-up cadence
    const pendingFollowUps = prospects.filter((p) => p.outreachStatus === "Contacted");
    if (pendingFollowUps.length > 0) {
      list.push({
        id: "alert-followup",
        type: "urgent",
        title: `${pendingFollowUps.length} follow-up ${pendingFollowUps.length === 1 ? "touchpoint" : "touchpoints"} due`,
        desc: `${pendingFollowUps.map((p) => p.companyName).slice(0, 2).join(", ")}${pendingFollowUps.length > 2 ? ` and ${pendingFollowUps.length - 2} others` : ""} were contacted. Send Touch #2 follow-up sequence to prevent deal cold-off.`,
        actionText: "Prepare Touch #2 Sequence",
        onAction: () => {
          setActiveNav("Campaigns");
          setCampaignType("outreach");
        },
      });
    }

    // 2. Deadlines approaching
    const urgentOpps = opportunities.filter(
      (o) => (o.status === "New" || o.status === "In progress") && o.deadline.includes("7 days")
    );
    if (urgentOpps.length > 0) {
      list.push({
        id: "alert-deadline",
        type: "urgent",
        title: `${urgentOpps.length} priority ${urgentOpps.length === 1 ? "action has" : "actions have"} a 7-day target`,
        desc: `"${urgentOpps[0].title.slice(0, 55)}…" is scheduled for completion within 7 days.`,
        actionText: "Open Action Centre",
        onAction: () => setActiveNav("Action centre"),
      });
    }

    // 3. Audit or competitor gap
    if (latestAudit && latestAudit.score < 80) {
      list.push({
        id: "alert-audit",
        type: "growth",
        title: `Audit Health Signal: Score ${latestAudit.score}/100`,
        desc: `Identified ${latestAudit.findings.filter((f) => f.severity === "high").length} high-friction areas on ${latestAudit.finalUrl.replace(/^https?:\/\//, "")}.`,
        actionText: "Synthesize Audit into Pipeline",
        onAction: () => syncAuditToEngine(latestAudit, profile, opportunities),
      });
    } else if (competitorAnalyses.length > 0 && competitorAnalyses[0].winnableGaps.length > 0) {
      list.push({
        id: "alert-gap",
        type: "growth",
        title: `Competitive Advantage Gap Identified`,
        desc: competitorAnalyses[0].winnableGaps[0],
        actionText: "Review Competitors",
        onAction: () => setActiveNav("Competitors"),
      });
    }

    return list;
  }, [prospects, opportunities, latestAudit, competitorAnalyses, profile, syncAuditToEngine]);

  return (
    <main className="app-shell">
      {/* Sidebar */}
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <TrendingUp size={20} strokeWidth={2.5} />
          </div>
          <div>
            <strong>gainforge</strong>
            <span>GROWTH WORKSPACE</span>
          </div>
          <button
            className="mobile-close icon-button"
            onClick={() => setMobileMenu(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Agency Workspace Switcher */}
        <div className="workspace-dropdown-wrapper">
          <button
            type="button"
            className="workspace-trigger-btn"
            onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
            aria-label="Switch client workspace"
          >
            <div className="workspace-avatar">{profile.name.slice(0, 2).toUpperCase()}</div>
            <div className="workspace-copy">
              <strong>{profile.name}</strong>
              <span>{profile.industry || "Growth workspace"}</span>
            </div>
            <ChevronDown size={15} style={{ transform: isWorkspaceMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>

          {isWorkspaceMenuOpen && (
            <div className="workspace-dropdown-menu">
              <div style={{ padding: "4px 8px 2px", fontSize: 9, fontWeight: 700, color: "#839589", letterSpacing: 0.8, textTransform: "uppercase" }}>
                Switch Client Workspace
              </div>
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  className={`workspace-item ${ws.id === activeWorkspaceId ? "active" : ""}`}
                  onClick={() => handleSwitchWorkspace(ws.id)}
                >
                  <Building2 size={14} style={{ color: ws.id === activeWorkspaceId ? "#16764b" : "#809287" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ws.name}</div>
                    <div style={{ fontSize: 9, color: "#8a978f" }}>{ws.industry}</div>
                  </div>
                  {ws.id === activeWorkspaceId && <Check size={14} style={{ color: "#16764b" }} />}
                </button>
              ))}
              <div className="workspace-divider" />
              <button
                className="workspace-new-btn"
                onClick={() => {
                  setIsWorkspaceMenuOpen(false);
                  setShowNewWorkspaceModal(true);
                }}
              >
                <Plus size={14} /> Add new client workspace
              </button>
            </div>
          )}
        </div>


        <div className="nav-caption">WORKSPACE</div>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={`nav-item ${activeNav === item.label ? "active" : ""}`}
                onClick={() => {
                  setActiveNav(item.label);
                  setMobileMenu(false);
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.label === "Opportunities" && (
                  <span className="nav-count">{opportunities.filter((o) => o.status === "New").length}</span>
                )}
                {item.label === "Lead Finder" && prospects.length > 0 && (
                  <span className="nav-count">{prospects.length}</span>
                )}
                {item.label === "Action centre" && inProgressCount > 0 && (
                  <span className="nav-count">{inProgressCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="nav-caption tools-caption">GROWTH TOOLS</div>
        <button
          className="nav-item"
          onClick={() => {
            setShowProfileModal(true);
            setMobileMenu(false);
          }}
        >
          <Settings2 size={18} />
          <span>Business profile</span>
        </button>

        <Link
          href={auditorHref}
          className="nav-item"
          style={{ textDecoration: "none" }}
          onClick={() => setMobileMenu(false)}
        >
          <Search size={18} />
          <span>Website auditor</span>
          {latestAudit && <span className="nav-count">{latestAudit.score}/100</span>}
        </Link>

        <button
          className="nav-item"
          onClick={() => setShowPricingModal(true)}
        >
          <CreditCard size={18} />
          <span>Plans & Pricing</span>
          <span className="nav-count">PRO</span>
        </button>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon">
              <Sparkles size={16} />
            </div>
            <strong>Grow with clarity.</strong>
            <p>Every opportunity leads to an action; every action measures outcome.</p>
            <button onClick={() => setShowPricingModal(true)}>
              View subscriptions <ArrowRight size={14} />
            </button>
          </div>
          <button
            className="profile-row"
            onClick={() => setShowProfileModal(true)}
          >
            <div className="profile-avatar">YB</div>
            <div className="profile-copy">
              <strong>{profile.name}</strong>
              <span>Founder workspace</span>
            </div>
            <ChevronDown size={15} />
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <section className="main-area">
        <header className="topbar">
          <button className="mobile-menu icon-button" onClick={() => setMobileMenu(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="breadcrumbs">
            <span>Workspace</span>
            <span className="crumb-slash">/</span>
            <strong>{activeNav}</strong>
          </div>
          <div className="topbar-right">
            <span className="demo-pill">
              <span /> GROWTH ENGINE LIVE
            </span>
            <button
              className="icon-button notification"
              aria-label="Notifications"
              onClick={() => notify(latestAudit ? `Audit ready: ${latestAudit.score}/100 for ${latestAudit.finalUrl}` : "You're all caught up.")}
            >
              <Bell size={18} />
              {latestAudit && <i />}
            </button>
            <button
              className="help-button"
              onClick={() => notify("GainForge connects diagnosis directly to actionable lead generation, marketing copy, and measurable ROI.")}
            >
              <CircleHelp size={17} /> Help
            </button>
          </div>
        </header>

        <div className="content">
          {/* Header Row */}
          <div className="welcome-row">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-dot" /> GAINFORGE INTELLIGENCE SUITE
              </div>
              <h1>
                {activeNav === "Overview" && "Make your next move count."}
                {activeNav === "Opportunities" && "Opportunity Pipeline"}
                {activeNav === "Lead Finder" && "Customer & Lead Finder"}
                {activeNav === "Campaigns" && "AI Growth Campaign Builder"}
                {activeNav === "Action centre" && "Growth Action Centre"}
                {activeNav === "Revenue & ROI" && "Revenue & ROI Dashboard"}
                {activeNav === "Competitors" && "Competitor Intelligence"}
              </h1>
              <p className="subtitle">
                {activeNav === "Overview" && "Turn audit evidence, public demand signals, and verified leads into measurable commercial results."}
                {activeNav === "Opportunities" && "Ranked growth actions supported by observed evidence, effort estimates, and testable hypotheses."}
                {activeNav === "Lead Finder" && "Discover relevant prospective commercial customers and referral partners from accessible, verifiable public sources."}
                {activeNav === "Campaigns" && "Generate usable marketing assets: 3-touch outbound sequences, landing page copy, and commercial proposals."}
                {activeNav === "Action centre" && "Assign deadlines, track outreach stages, manage follow-up tasks, and log verified outcomes."}
                {activeNav === "Revenue & ROI" && "Track enquiries, qualified leads, won deals, and attributable revenue without vanity metrics."}
                {activeNav === "Competitors" && "Compare public positioning, guarantees, pricing models, and identify actionable market gaps."}
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button
                className="outline-button"
                onClick={() => setShowBriefModal(true)}
                title="Generate printable 1-page executive growth assessment"
              >
                <FileText size={15} style={{ color: "#16764b" }} /> Executive Brief
              </button>
              {activeNav === "Lead Finder" && (
                <button className="primary-button" onClick={handleDiscoverProspects}>
                  <Search size={15} /> Discover prospects
                </button>
              )}
              {activeNav === "Campaigns" && (
                <button className="primary-button" onClick={handleGenerateCampaign} disabled={campaignLoading}>
                  <Sparkles size={15} /> {campaignLoading ? "Generating…" : "Generate copy"}
                </button>
              )}
              <button className="outline-button" onClick={() => setShowAddOppModal(true)}>
                <Plus size={15} /> Add action
              </button>
              <button className="primary-button" onClick={() => setShowProfileModal(true)}>
                <Settings2 size={16} /> Edit profile
              </button>
            </div>
          </div>

          {/* 1. OVERVIEW TAB */}
          {activeNav === "Overview" && (
            <>
              {latestAudit ? (
                <div className="audit-sync-banner">
                  <div className="audit-sync-info">
                    <div className="audit-sync-badge">{latestAudit.score}</div>
                    <div>
                      <strong>
                        Website Audit: {latestAudit.finalUrl.replace(/^https?:\/\//, "")} (Score {latestAudit.score}/100)
                      </strong>
                      <p>
                        {latestAudit.findings.filter((f) => f.severity !== "pass").length} actionable improvements identified.
                        Synthesize them directly into your commercial opportunity pipeline.
                      </p>
                    </div>
                  </div>
                  <div className="audit-sync-actions">
                    <button
                      className="primary-button"
                      onClick={() => syncAuditToEngine(latestAudit, profile, opportunities)}
                    >
                      <RefreshCw size={14} /> Synthesize to pipeline
                    </button>
                    <Link
                      href={auditorHref}
                      className="outline-button"
                      style={{ textDecoration: "none" }}
                    >
                      View audit <ExternalLink size={14} />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="setup-banner">
                  <div className="banner-symbol">
                    <Sparkles size={21} />
                  </div>
                  <div className="banner-text">
                    <strong>Connect your website diagnosis to your growth plan</strong>
                    <p>
                      Run the Website Growth Auditor to discover evidence-backed opportunities tailored to your homepage and business goal.
                    </p>
                  </div>
                  <Link href={auditorHref} className="primary-button" style={{ textDecoration: "none" }}>
                    Run website audit <ArrowRight size={15} />
                  </Link>
                </div>
              )}

              {/* Smart Growth & Follow-Up Alerts */}
              {smartAlerts.length > 0 && (
                <div className="smart-alerts-container">
                  {smartAlerts.map((alert) => (
                    <div key={alert.id} className={`smart-alert-card ${alert.type}`}>
                      <div className="smart-alert-icon">
                        {alert.type === "urgent" ? <Clock size={16} /> : <Sparkles size={16} />}
                      </div>
                      <div className="smart-alert-body">
                        <strong>{alert.title}</strong>
                        <p>{alert.desc}</p>
                        <button className="smart-alert-action" onClick={alert.onAction}>
                          {alert.actionText} <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Snapshot Metrics */}
              <div className="section-heading">
                <div>
                  <h2>Growth snapshot</h2>
                  <p>A clear view of high-priority actions moving your business forward.</p>
                </div>
                <span className="period-label">
                  <Activity size={14} /> Live workspace
                </span>
              </div>

              <div className="metrics-grid">
                <Metric
                  icon={<Target size={18} />}
                  label="Open opportunities"
                  value={String(openCount)}
                  change="Prioritised for action"
                  tone="blue"
                />
                <Metric
                  icon={<Users size={18} />}
                  label="Verified prospects"
                  value={String(prospects.length)}
                  change={`${prospects.filter((p) => p.outreachStatus === "In Discussion").length} in discussion`}
                  tone="violet"
                />
                <Metric
                  icon={<CheckCircle2 size={18} />}
                  label="Verified won revenue"
                  value={`£${wonRevenue.toLocaleString()}`}
                  change={`${wonCount} completed deals`}
                  tone="green"
                />
                <Metric
                  icon={<Search size={18} />}
                  label="Website audit health"
                  value={latestAudit ? `${latestAudit.score}/100` : "Not run"}
                  change={latestAudit ? "Based on live checks" : "Run audit to score"}
                  tone="amber"
                />
              </div>

              {/* Two Column Layout */}
              <div className="two-column">
                <section className="panel opportunities-panel">
                  <div className="panel-header">
                    <div>
                      <h2>Top priority opportunities</h2>
                      <p>Ranked by potential impact, confidence and effort required.</p>
                    </div>
                    <button className="text-button" onClick={() => setActiveNav("Opportunities")}>
                      View all ({opportunities.length}) <ArrowRight size={14} />
                    </button>
                  </div>

                  <div className="opportunity-list">
                    {opportunities
                      .filter((o) => o.status !== "Dismissed")
                      .slice(0, 4)
                      .map((o, i) => (
                        <div
                          key={o.id}
                          className="opportunity-row"
                          onClick={() => setSelected(o)}
                          style={{ cursor: "pointer" }}
                        >
                          <div className={`opportunity-number n${(i % 3) + 1}`}>
                            {String(i + 1).padStart(2, "0")}
                          </div>
                          <div className="opportunity-info">
                            <strong>{o.title}</strong>
                            <span>
                              <span className="category-pill">{o.category}</span>
                              <span className="middot">·</span>
                              <span className={`effort-badge ${o.effort}`}>
                                {EFFORT_LABELS[o.effort]}
                              </span>
                              <span className="middot">·</span>
                              <span className="deadline-badge">
                                <Clock size={11} /> {o.deadline}
                              </span>
                            </span>
                          </div>
                          <div className="opportunity-right">
                            <span className={`confidence-badge ${o.confidence.toLowerCase()}`}>
                              {o.confidence}
                            </span>
                            <ArrowUpRight size={16} />
                          </div>
                        </div>
                      ))}
                  </div>

                  <button className="panel-footer-button" onClick={() => setActiveNav("Opportunities")}>
                    Manage all opportunities in pipeline <ArrowRight size={15} />
                  </button>
                </section>

                <section className="panel action-panel">
                  <div className="panel-header">
                    <div>
                      <h2>Next best actions</h2>
                      <p>Focused tasks to build commercial momentum.</p>
                    </div>
                    <div className="sparkle-badge">
                      <Sparkles size={15} />
                    </div>
                  </div>

                  <div className="action-item">
                    <div className={`action-check ${profile.website ? "" : "muted"}`}>
                      <Check size={13} />
                    </div>
                    <div>
                      <strong>Configure your business profile</strong>
                      <span>{profile.name} · {profile.industry}</span>
                    </div>
                    <button onClick={() => setShowProfileModal(true)} aria-label="Edit profile">
                      <ArrowRight size={16} />
                    </button>
                  </div>

                  <div className="action-item">
                    <div className={`action-check ${prospects.length > 0 ? "" : "muted"}`}>
                      <Users size={13} />
                    </div>
                    <div>
                      <strong>Find verified prospective clients</strong>
                      <span>{prospects.length} prospects in finder database</span>
                    </div>
                    <button onClick={() => setActiveNav("Lead Finder")} aria-label="Go to Lead Finder">
                      <ArrowRight size={16} />
                    </button>
                  </div>

                  <div className="action-item">
                    <div className={`action-check ${campaigns.length > 0 ? "" : "muted"}`}>
                      <Mail size={13} />
                    </div>
                    <div>
                      <strong>Build an AI outreach campaign</strong>
                      <span>{campaigns.length} marketing assets prepared</span>
                    </div>
                    <button onClick={() => setActiveNav("Campaigns")} aria-label="Go to campaigns">
                      <ArrowRight size={16} />
                    </button>
                  </div>

                  <div className="action-item">
                    <div className={`action-check ${wonCount > 0 ? "" : "muted"}`}>
                      <Target size={13} />
                    </div>
                    <div>
                      <strong>Track verified revenue & ROI</strong>
                      <span>£{wonRevenue.toLocaleString()} attributable revenue</span>
                    </div>
                    <button onClick={() => setActiveNav("Revenue & ROI")} aria-label="View ROI">
                      <ArrowRight size={16} />
                    </button>
                  </div>

                  <div className="note-box">
                    <Lightbulb size={16} />
                    <p>
                      <strong>GainForge growth principle</strong>
                      <br />
                      Every opportunity must lead to a concrete action, and every action must have a way to measure its outcome.
                    </p>
                  </div>
                </section>
              </div>

              {/* Growth Focus Panel */}
              <section className="panel plan-panel">
                <div className="panel-header">
                  <div>
                    <h2>Current growth focus</h2>
                    <p>Shaped around {profile.name}&apos;s primary objective and bottleneck.</p>
                  </div>
                  <span className="status-chip">
                    <span /> ACTIVE CYCLE
                  </span>
                </div>
                <div className="focus-row">
                  <div className="focus-icon">
                    <Compass size={19} />
                  </div>
                  <div className="focus-main">
                    <strong>{profile.goal}</strong>
                    <span>
                      Target audience: {profile.targetAudience} · Main bottleneck: {profile.challenge}
                    </span>
                  </div>
                  <button className="outline-button" onClick={() => setShowProfileModal(true)}>
                    Refine focus
                  </button>
                </div>
                <div className="progress-track">
                  <div style={{ width: `${Math.max(15, completionPct)}%` }} />
                </div>
                <div className="progress-meta">
                  <span>
                    {wonCount} won, {inProgressCount} in progress out of {totalCount} total initiatives
                  </span>
                  <span>{completionPct}% momentum</span>
                </div>
              </section>
            </>
          )}

          {/* 2. OPPORTUNITIES TAB */}
          {activeNav === "Opportunities" && (
            <section className="panel full-panel">
              <div className="panel-header">
                <div>
                  <h2>Growth opportunity pipeline</h2>
                  <p>Evidence-backed opportunities synthesized from your audit and business profile.</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="outline-button" onClick={exportCsv}>
                    <Download size={15} /> Export CSV
                  </button>
                  <button className="primary-button" onClick={() => setShowAddOppModal(true)}>
                    <Plus size={15} /> Add opportunity
                  </button>
                </div>
              </div>

              <div className="table-toolbar">
                <div className="search-box">
                  <Search size={16} />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search opportunities, evidence, or actions…"
                  />
                </div>
                <div className="filter-box">
                  <Filter size={15} />
                  <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option value="All">All Categories</option>
                    <option value="Conversion">Conversion</option>
                    <option value="Acquisition">Acquisition</option>
                    <option value="Demand signal">Demand signal</option>
                    <option value="Trust & Positioning">Trust & Positioning</option>
                    <option value="Revenue recovery">Revenue recovery</option>
                  </select>
                </div>
                <div className="filter-box">
                  <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="All">All Statuses</option>
                    <option value="New">New</option>
                    <option value="In progress">In progress</option>
                    <option value="Won">Won</option>
                    <option value="Dismissed">Dismissed</option>
                  </select>
                </div>
              </div>

              <div className="opportunity-table">
                <div className="table-head">
                  <span>OPPORTUNITY & EVIDENCE</span>
                  <span>CATEGORY</span>
                  <span>EFFORT & DEADLINE</span>
                  <span>STATUS</span>
                  <span></span>
                </div>
                {visibleOpportunities.map((o) => (
                  <button className="table-row" key={o.id} onClick={() => setSelected(o)}>
                    <span className="table-title">
                      <span className="table-icon">
                        <Target size={16} />
                      </span>
                      <span>
                        <strong>{o.title}</strong>
                        <small>{o.source} · {o.evidence.slice(0, 75)}…</small>
                      </span>
                    </span>
                    <span className="type-cell">
                      <span className="category-pill">{o.category}</span>
                    </span>
                    <span>
                      <span className={`effort-badge ${o.effort}`}>{o.effort}</span>
                      <small style={{ display: "block", color: "#8a978f", fontSize: 9, marginTop: 3 }}>
                        {o.deadline}
                      </small>
                    </span>
                    <span>
                      <span className={`table-status ${o.status.toLowerCase().replace(" ", "-")}`}>
                        {o.status}
                      </span>
                    </span>
                    <ArrowRight size={16} />
                  </button>
                ))}

                {visibleOpportunities.length === 0 && (
                  <div className="empty-state">
                    No opportunities match this filter or search query.
                  </div>
                )}
              </div>

              <div className="demo-disclaimer">
                <Lightbulb size={16} />
                <span>
                  GainForge separates observed facts from hypotheses. Check the <strong>evidence</strong> tab on any item before committing budget or time.
                </span>
              </div>
            </section>
          )}

          {/* 3. CUSTOMER & LEAD FINDER TAB (MODULE 03 / PHASE 04) */}
          {activeNav === "Lead Finder" && (
            <section className="panel full-panel">
              <div className="panel-header">
                <div>
                  <h2>Customer & Lead Finder</h2>
                  <p>Discover verifiable commercial clients and referral partners. Every lead includes source URL and date checked.</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="outline-button" onClick={() => setShowAddProspectModal(true)}>
                    <Plus size={15} /> Add custom lead
                  </button>
                  <button className="primary-button" onClick={handleDiscoverProspects}>
                    <Search size={15} /> Discover for {profile.location || "my area"}
                  </button>
                </div>
              </div>

              <div className="table-toolbar">
                <div className="search-box">
                  <Search size={16} />
                  <input
                    value={prospectSearch}
                    onChange={(e) => setProspectSearch(e.target.value)}
                    placeholder="Search prospect company, role, or location…"
                  />
                </div>
                <div className="filter-box">
                  <Filter size={15} />
                  <select value={prospectFilter} onChange={(e) => setProspectFilter(e.target.value)}>
                    <option value="All">All Outreach Stages</option>
                    <option value="Discovered">Discovered</option>
                    <option value="Contacted">Contacted</option>
                    <option value="In Discussion">In Discussion</option>
                    <option value="Won">Won</option>
                    <option value="Parked">Parked</option>
                  </select>
                </div>
              </div>

              <div className="prospect-grid">
                {visibleProspects.map((p) => (
                  <div className="prospect-card" key={p.id}>
                    <div className="prospect-header">
                      <div>
                        <h3 className="prospect-title">{p.companyName}</h3>
                        <div className="prospect-role">{p.targetRole} · {p.location}</div>
                      </div>
                      <span className={`table-status ${p.outreachStatus.toLowerCase().replace(" ", "-")}`}>
                        {p.outreachStatus}
                      </span>
                    </div>

                    <div className="prospect-field">
                      <strong>REASON FOR RELEVANCE</strong>
                      {p.relevanceReason}
                    </div>

                    <div className="prospect-field">
                      <strong>COMMERCIAL OPPORTUNITY</strong>
                      <span style={{ color: "#16764b", fontWeight: 700 }}>{p.estimatedOpportunity}</span>
                    </div>

                    <div className="prospect-field">
                      <strong>SUGGESTED TOUCHPOINT</strong>
                      {p.suggestedTouchpoint}
                    </div>

                    <div className="prospect-source">
                      <ExternalLink size={12} />
                      <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#74867c", textDecoration: "underline" }}>
                        {p.sourceType}
                      </a>
                      <span>· Checked {p.dateChecked}</span>
                    </div>

                    <div style={{ marginTop: "auto", display: "grid", gap: 8, paddingTop: 10 }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <select
                          value={p.outreachStatus}
                          onChange={(e) => updateProspectStatus(p.id, e.target.value as Prospect["outreachStatus"])}
                          style={{ flex: 1, height: 32, fontSize: 10, borderRadius: 6, border: "1px solid #dce5df" }}
                        >
                          <option value="Discovered">Discovered</option>
                          <option value="Contacted">Contacted</option>
                          <option value="In Discussion">In Discussion</option>
                          <option value="Won">Won deal</option>
                          <option value="Parked">Parked</option>
                        </select>
                        <button
                          className="outline-button"
                          onClick={() => {
                            setSelectedProspectForEmailId(p.id);
                            setEmailViewMode("preview");
                            setActiveNav("Campaigns");
                            notify(`Prepared email outreach preview for ${p.companyName}.`);
                          }}
                        >
                          <Mail size={13} /> Write outreach
                        </button>
                      </div>

                      <button
                        className="outline-button"
                        style={{
                          width: "100%",
                          fontSize: 10,
                          padding: "6px 10px",
                          color: prospectWebhookStatus[p.id] === "success" ? "#16764b" : "#44554a",
                          borderColor: prospectWebhookStatus[p.id] === "success" ? "#b5dfc6" : "#dfe7e1",
                          background: prospectWebhookStatus[p.id] === "success" ? "#f2f9f5" : "#fff",
                        }}
                        disabled={prospectWebhookStatus[p.id] === "sending"}
                        onClick={() => handlePushProspectToWebhook(p)}
                        title="Push prospect details directly to Make.com / Zapier webhook"
                      >
                        {prospectWebhookStatus[p.id] === "sending" ? (
                          <><span className="spinner" style={{ width: 11, height: 11, borderTopColor: "#16764b" }} /> Sending to webhook…</>
                        ) : prospectWebhookStatus[p.id] === "success" ? (
                          <><Check size={13} style={{ color: "#16764b" }} /> Synced to Webhook (Make/Zapier)</>
                        ) : (
                          <><Share2 size={13} /> Push to Webhook (Make / Zapier)</>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="demo-disclaimer">
                <ShieldCheck size={16} />
                <span>
                  <strong>Ethical Outreach Policy:</strong> GainForge references publicly registered commercial entities. We never scrape personal phone numbers or violate anti-spam/GDPR regulations. Always review messaging before sending.
                </span>
              </div>
            </section>
          )}

          {/* 4. AI GROWTH CAMPAIGN BUILDER (MODULE 04 / PHASE 05) */}
          {activeNav === "Campaigns" && (
            <section className="panel full-panel">
              <div className="panel-header">
                <div>
                  <h2>AI Growth Campaign & Content Builder</h2>
                  <p>Turn growth opportunities into usable marketing copy and cold outbound sequences with Gemini AI.</p>
                </div>
                <button
                  className="primary-button"
                  onClick={handleGenerateCampaign}
                  disabled={campaignLoading}
                >
                  <Sparkles size={15} /> {campaignLoading ? "Generating copy…" : "Generate campaign"}
                </button>
              </div>

              <div className="campaign-layout">
                {/* Configuration Sidebar */}
                <div className="campaign-card">
                  <h3 style={{ fontSize: 13, marginBottom: 14 }}>Campaign Configuration</h3>

                  <label style={{ display: "grid", gap: 6, fontSize: 11, fontWeight: 700, marginBottom: 14 }}>
                    Opportunity to Solve
                    <select
                      value={selectedOppForCampaign}
                      onChange={(e) => setSelectedOppForCampaign(e.target.value)}
                      style={{ height: 38, borderRadius: 8, border: "1px solid #dfe7e1", padding: "0 10px", fontSize: 11 }}
                    >
                      {opportunities.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.title.slice(0, 50)}…
                        </option>
                      ))}
                    </select>
                  </label>

                  <label style={{ display: "grid", gap: 6, fontSize: 11, fontWeight: 700, marginBottom: 14 }}>
                    Asset / Campaign Type
                    <select
                      value={campaignType}
                      onChange={(e) => setCampaignType(e.target.value as any)}
                      style={{ height: 38, borderRadius: 8, border: "1px solid #dfe7e1", padding: "0 10px", fontSize: 11 }}
                    >
                      <option value="outreach">3-Touch Cold Outbound Sequence</option>
                      <option value="landing_page">High-Converting Landing Page Copy</option>
                      <option value="proposal">1-Page Commercial Proposal Outline</option>
                      <option value="community_reply">Expert Community / Forum Reply</option>
                    </select>
                  </label>

                  <div style={{ background: "#f8faf8", padding: 12, borderRadius: 8, fontSize: 10, color: "#617367", lineHeight: 1.6, marginBottom: 18 }}>
                    <strong>Target Buyer:</strong> {profile.targetAudience}
                    <br />
                    <strong>Industry:</strong> {profile.industry}
                    <br />
                    <strong>Human Review:</strong> All content is generated as drafts for your review before dispatch.
                  </div>

                  <button
                    className="primary-button"
                    style={{ width: "100%", height: 40 }}
                    onClick={handleGenerateCampaign}
                    disabled={campaignLoading}
                  >
                    {campaignLoading ? (
                      <><span className="spinner" /> Crafting copy…</>
                    ) : (
                      <><Sparkles size={15} /> Generate with AI</>
                    )}
                  </button>

                  {/* Saved Campaigns history */}
                  <div style={{ marginTop: 24, borderTop: "1px solid #edf2ee", paddingTop: 16 }}>
                    <h4 style={{ fontSize: 11, color: "#6b7c71", margin: "0 0 10px" }}>Saved Campaign Drafts</h4>
                    <div style={{ display: "grid", gap: 8 }}>
                      {campaigns.slice(0, 3).map((c) => (
                        <div
                          key={c.id}
                          style={{
                            background: "#fafbfa",
                            border: "1px solid #e7efe9",
                            borderRadius: 6,
                            padding: "8px 10px",
                            fontSize: 10,
                            cursor: "pointer",
                          }}
                          onClick={() => setGeneratedCampaign(c.content)}
                        >
                          <strong>{c.title}</strong>
                          <span style={{ display: "block", color: "#8a988f", marginTop: 2 }}>
                            {c.campaignType} · {c.createdAt.slice(0, 10)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Preview & Interactive Email Client Frame */}
                <div className="campaign-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button
                        className="outline-button"
                        style={{
                          background: emailViewMode === "preview" ? "#eaf6ef" : "#fff",
                          color: emailViewMode === "preview" ? "#176b45" : "#53685b",
                          borderColor: emailViewMode === "preview" ? "#a3d8b5" : "#dfe7e1",
                          fontWeight: 700,
                        }}
                        onClick={() => setEmailViewMode("preview")}
                      >
                        <Mail size={13} /> Interactive Email Preview
                      </button>
                      <button
                        className="outline-button"
                        style={{
                          background: emailViewMode === "raw" ? "#eaf6ef" : "#fff",
                          color: emailViewMode === "raw" ? "#176b45" : "#53685b",
                          borderColor: emailViewMode === "raw" ? "#a3d8b5" : "#dfe7e1",
                          fontWeight: 700,
                        }}
                        onClick={() => setEmailViewMode("raw")}
                      >
                        <FileText size={13} /> Raw Copy & Multi-Touch
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button
                        className="outline-button"
                        onClick={() => copyToClipboard(emailViewMode === "preview" ? previewEmailData.body : (generatedCampaign || previewEmailData.rawBody))}
                      >
                        {copiedCampaign ? <Check size={14} /> : <Copy size={14} />} Copy
                      </button>
                      <button
                        className="primary-button"
                        style={{ padding: "8px 12px", fontSize: 10 }}
                        onClick={() => {
                          const mailtoUrl = `mailto:${encodeURIComponent(previewEmailData.to)}?subject=${encodeURIComponent(previewEmailData.subject)}&body=${encodeURIComponent(previewEmailData.body)}`;
                          window.location.href = mailtoUrl;
                          notify(`Opened default email client for ${previewEmailData.toLabel}.`);
                        }}
                        title="Open Apple Mail, Outlook, or Thunderbird with prefilled content"
                      >
                        <SendHorizontal size={14} /> Open in Email (mailto)
                      </button>
                    </div>
                  </div>

                  {emailViewMode === "preview" ? (
                    <div className="email-client-frame">
                      <div className="email-client-header-bar">
                        <div className="mac-dots">
                          <span className="mac-dot red" />
                          <span className="mac-dot yellow" />
                          <span className="mac-dot green" />
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#6e8074", letterSpacing: 0.5 }}>
                          OUTREACH DISPATCH PREVIEW
                        </div>
                        <div style={{ width: 40 }} />
                      </div>

                      <div className="email-client-meta">
                        <div className="email-meta-row">
                          <span className="email-meta-label">Target Lead:</span>
                          <select
                            value={selectedProspectForEmailId}
                            onChange={(e) => setSelectedProspectForEmailId(e.target.value)}
                            style={{ flex: 1, height: 30, fontSize: 11, borderRadius: 6, border: "1px solid #dce5df", padding: "0 8px" }}
                          >
                            {prospects.length === 0 && <option value="">No prospects saved in Lead Finder</option>}
                            {prospects.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.companyName} ({p.targetRole} · {p.location})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="email-meta-row">
                          <span className="email-meta-label">To:</span>
                          <span style={{ fontSize: 11, color: "#253a2d", fontWeight: 600 }}>{previewEmailData.toLabel}</span>
                          <span className="email-tag-pill">&lt;{previewEmailData.to}&gt;</span>
                        </div>
                        <div className="email-meta-row">
                          <span className="email-meta-label">Subject:</span>
                          <input
                            className="email-meta-input"
                            value={customEmailSubject || previewEmailData.subject}
                            onChange={(e) => setCustomEmailSubject(e.target.value)}
                            placeholder="Email Subject Line…"
                          />
                        </div>
                      </div>

                      <div className="email-body-editor">
                        {previewEmailData.body}
                      </div>

                      <div className="email-actions-bar">
                        <span style={{ fontSize: 10, color: "#798b80" }}>
                          Variables automatically mapped from verified lead data.
                        </span>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            className="outline-button"
                            onClick={() => copyToClipboard(previewEmailData.body)}
                          >
                            <Copy size={13} /> Copy message
                          </button>
                          <button
                            className="primary-button"
                            style={{ padding: "6px 12px", fontSize: 10 }}
                            onClick={() => {
                              const mailtoUrl = `mailto:${encodeURIComponent(previewEmailData.to)}?subject=${encodeURIComponent(customEmailSubject || previewEmailData.subject)}&body=${encodeURIComponent(previewEmailData.body)}`;
                              window.location.href = mailtoUrl;
                              notify(`Opened default email client for ${previewEmailData.toLabel}.`);
                            }}
                          >
                            <SendHorizontal size={13} /> 1-Click Launch Email
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {generatedCampaign ? (
                        <div className="campaign-preview">{generatedCampaign}</div>
                      ) : (
                        <div className="campaign-preview">{previewEmailData.rawBody}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* 5. ACTION CENTRE TAB */}
          {activeNav === "Action centre" && (
            <section className="panel full-panel">
              <div className="panel-header">
                <div>
                  <h2>Growth action centre</h2>
                  <p>Execute recommendations, assign deadlines, and track real-world results.</p>
                </div>
                <button className="outline-button" onClick={() => setShowAddOppModal(true)}>
                  <Plus size={15} /> Add custom action
                </button>
              </div>

              <div className="action-board">
                {opportunities
                  .filter((o) => o.status !== "Dismissed")
                  .map((o) => (
                    <div className="board-card" key={o.id}>
                      <div className="board-card-top">
                        <span className={`table-status ${o.status.toLowerCase().replace(" ", "-")}`}>
                          {o.status}
                        </span>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span className={`effort-badge ${o.effort}`}>{o.effort}</span>
                          <span className="deadline-badge">
                            <Clock size={11} /> {o.deadline}
                          </span>
                        </div>
                      </div>

                      <h3>{o.title}</h3>
                      <div style={{ fontSize: 10, color: "#16764b", fontWeight: 700, margin: "6px 0 4px" }}>
                        ACTION: {o.action}
                      </div>
                      <p>{o.reason}</p>

                      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button className="outline-button" onClick={() => setSelected(o)}>
                          Review details <ArrowRight size={14} />
                        </button>
                        {o.status !== "In progress" && (
                          <button
                            className="outline-button"
                            onClick={() => updateStatus(o.id, "In progress")}
                          >
                            Start action
                          </button>
                        )}
                        {o.status !== "Won" && (
                          <button
                            className="primary-button"
                            style={{ padding: "8px 12px", fontSize: 10 }}
                            onClick={() => updateStatus(o.id, "Won")}
                          >
                            <Check size={14} /> Mark won
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* 6. REVENUE & ROI DASHBOARD TAB (MODULE 06 / PHASE 07) */}
          {activeNav === "Revenue & ROI" && (
            <section className="panel full-panel">
              <div className="panel-header">
                <div>
                  <h2>Revenue & ROI Tracking</h2>
                  <p>Distinguishing verified commercial outcomes from vanity metrics.</p>
                </div>
                <span className="demo-pill">
                  <span /> VERIFIED DATA FIRST
                </span>
              </div>

              <div className="roi-kpi-grid">
                <Metric
                  icon={<CreditCard size={18} />}
                  label="Verified Won Revenue"
                  value={`£${wonRevenue.toLocaleString()}`}
                  change="From completed deals"
                  tone="green"
                />
                <Metric
                  icon={<BarChart3 size={18} />}
                  label="Total Pipeline Value"
                  value={`£${totalPipelineValue.toLocaleString()}`}
                  change={`${opportunities.length} active initiatives`}
                  tone="blue"
                />
                <Metric
                  icon={<TrendingUp size={18} />}
                  label="Estimated Return on Spend"
                  value={`${estimatedRoiRatio}x`}
                  change="Based on verified closed deals"
                  tone="violet"
                />
                <Metric
                  icon={<CheckCircle2 size={18} />}
                  label="Win Rate on Pipeline"
                  value={`${totalCount > 0 ? Math.round((wonCount / totalCount) * 100) : 0}%`}
                  change={`${wonCount} won / ${totalCount} identified`}
                  tone="amber"
                />
              </div>

              {/* Conversion Funnel */}
              <div className="funnel-container">
                <h3 style={{ fontSize: 13, margin: "10px 0 6px" }}>The Commercial Growth Funnel</h3>
                <div className="funnel-row">
                  <div className="funnel-label">1. Opportunities Identified</div>
                  <div className="funnel-bar-wrapper">
                    <div className="funnel-bar-fill" style={{ width: "100%" }} />
                  </div>
                  <div className="funnel-count">{opportunities.length} actions</div>
                </div>

                <div className="funnel-row">
                  <div className="funnel-label">2. Targeted Prospects</div>
                  <div className="funnel-bar-wrapper">
                    <div className="funnel-bar-fill" style={{ width: `${Math.min(100, (prospects.length / Math.max(1, opportunities.length)) * 100)}%` }} />
                  </div>
                  <div className="funnel-count">{prospects.length} leads</div>
                </div>

                <div className="funnel-row">
                  <div className="funnel-label">3. Actions In Execution</div>
                  <div className="funnel-bar-wrapper">
                    <div className="funnel-bar-fill" style={{ width: `${Math.min(100, (inProgressCount / Math.max(1, opportunities.length)) * 100)}%` }} />
                  </div>
                  <div className="funnel-count">{inProgressCount} active</div>
                </div>

                <div className="funnel-row">
                  <div className="funnel-label">4. In Discussion / Enquiries</div>
                  <div className="funnel-bar-wrapper">
                    <div className="funnel-bar-fill" style={{ width: `${Math.min(100, (roiStats.qualifiedLeads / Math.max(1, opportunities.length)) * 100)}%` }} />
                  </div>
                  <div className="funnel-count">{roiStats.qualifiedLeads} enquiries</div>
                </div>

                <div className="funnel-row">
                  <div className="funnel-label">5. Verified Deals Won</div>
                  <div className="funnel-bar-wrapper">
                    <div className="funnel-bar-fill" style={{ width: `${Math.min(100, (wonCount / Math.max(1, opportunities.length)) * 100)}%`, background: "#16764b" }} />
                  </div>
                  <div className="funnel-count" style={{ color: "#16764b" }}>{wonCount} won</div>
                </div>
              </div>

              {/* Historical Evolution */}
              <div style={{ padding: "0 20px 20px" }}>
                <h3 style={{ fontSize: 13, margin: "16px 0 10px" }}>Website Audit Evolution</h3>
                <div style={{ display: "grid", gap: 8 }}>
                  {auditHistory.map((h, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 16px",
                        background: "#fff",
                        border: "1px solid #e3ebe5",
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                    >
                      <div>
                        <strong>{h.date}: {h.url}</strong>
                        <div style={{ color: "#74867c", marginTop: 2 }}>{h.note}</div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: h.score >= 75 ? "#16764b" : "#b57c23" }}>
                        {h.score}/100
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* 7. COMPETITOR BENCHMARK TAB (MODULE 07 / PHASE 08) */}
          {activeNav === "Competitors" && (
            <section className="panel full-panel">
              <div className="panel-header">
                <div>
                  <h2>Competitor Intelligence & Positioning Gaps</h2>
                  <p>Input competitor websites to benchmark your offering, identify weaknesses, and uncover winnable market gaps.</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="primary-button" onClick={() => setShowCompetitorModal(true)}>
                    <Plus size={15} /> Compare competitor URL
                  </button>
                </div>
              </div>

              {/* Analyzed Competitors Section */}
              {competitorAnalyses.length > 0 && (
                <div className="competitor-list">
                  <h3 style={{ fontSize: 13, margin: "6px 0 2px", color: "#192c20" }}>
                    Live Competitor Comparisons ({competitorAnalyses.length})
                  </h3>
                  {competitorAnalyses.map((c) => (
                    <div className="competitor-card" key={c.id}>
                      <div className="competitor-card-header">
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <h3 style={{ margin: 0, fontSize: 14 }}>{c.competitorName}</h3>
                            <a
                              href={c.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: "#6b7c72", textDecoration: "underline" }}
                            >
                              {c.url.replace(/^https?:\/\//, "")} <ExternalLink size={11} />
                            </a>
                            <span style={{ fontSize: 10, color: "#8a978f" }}>· Analyzed {c.analyzedAt}</span>
                          </div>
                          <p style={{ margin: "6px 0 0", fontSize: 11, color: "#5d6e64", lineHeight: 1.55 }}>
                            {c.positioningSummary}
                          </p>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {c.auditScore !== undefined && (
                            <span className={`competitor-score ${c.auditScore < 65 ? "warning" : ""}`}>
                              Audit: {c.auditScore}/100
                            </span>
                          )}
                          <button
                            className="outline-button"
                            style={{ padding: "5px 8px", fontSize: 10, color: "#9a4444" }}
                            onClick={() => deleteCompetitorAnalysis(c.id)}
                            aria-label="Remove competitor analysis"
                          >
                            <X size={13} /> Remove
                          </button>
                        </div>
                      </div>

                      {/* Head-to-Head Comparison Table */}
                      <div style={{ background: "#fafcfa", border: "1px solid #e7efe9", borderRadius: 8, padding: "10px 14px", marginTop: 8 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 1fr", gap: 12, paddingBottom: 6, borderBottom: "1px solid #e2ece4", fontSize: 9, fontWeight: 700, color: "#798b7f" }}>
                          <span>FACTOR</span>
                          <span>YOUR ADVANTAGE ({profile.name})</span>
                          <span>COMPETITOR DEFICIT ({c.competitorName})</span>
                        </div>
                        {c.comparisonPoints.map((cp, idx) => (
                          <div className="comparison-table-row" key={idx}>
                            <strong style={{ color: "#223529" }}>{cp.metric}</strong>
                            <span style={{ color: "#16764b", fontWeight: 600 }}>{cp.yourAdvantage}</span>
                            <span style={{ color: "#718277" }}>{cp.competitorStatus}</span>
                          </div>
                        ))}
                      </div>

                      {/* Strengths, Weaknesses, Winnable Gaps */}
                      <div className="competitor-grid-3">
                        <div className="competitor-section-box">
                          <h4 style={{ color: "#486252" }}>Competitor Strengths</h4>
                          <ul style={{ margin: 0, paddingLeft: 14 }}>
                            {c.strengths.map((s, idx) => (
                              <li key={idx} style={{ marginBottom: 4 }}>{s}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="competitor-section-box">
                          <h4 style={{ color: "#9c5a1e" }}>Observed Weaknesses</h4>
                          <ul style={{ margin: 0, paddingLeft: 14 }}>
                            {c.weaknesses.map((w, idx) => (
                              <li key={idx} style={{ marginBottom: 4 }}>{w}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="competitor-section-box win">
                          <h4 style={{ color: "#166a41" }}>Winnable Gaps to Exploit</h4>
                          <ul style={{ margin: 0, paddingLeft: 14 }}>
                            {c.winnableGaps.map((g, idx) => (
                              <li key={idx} style={{ marginBottom: 4 }}>{g}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Baseline Industry Benchmark */}
              <div style={{ padding: "0 20px 20px" }}>
                <h3 style={{ fontSize: 13, margin: "16px 0 10px", color: "#192c20" }}>
                  Sector Benchmark Baseline ({profile.industry})
                </h3>
                <div style={{ display: "grid", gap: 12 }}>
                  {COMPETITOR_BENCHMARKS.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        background: "#fff",
                        border: "1px solid #e3ebe5",
                        borderRadius: 10,
                        padding: 16,
                        display: "grid",
                        gridTemplateColumns: "200px 1fr 1fr",
                        gap: 16,
                        alignItems: "start",
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: 12, color: "#17271e" }}>{c.dimension}</strong>
                        <span className="category-pill" style={{ display: "inline-block", marginTop: 6 }}>
                          {c.impact} Leverage
                        </span>
                      </div>

                      <div style={{ background: "#f8faf8", padding: 10, borderRadius: 8, fontSize: 10 }}>
                        <strong style={{ display: "block", color: "#8a978f", fontSize: 8, marginBottom: 4 }}>
                          TYPICAL COMPETITOR DEFICIT
                        </strong>
                        {c.typicalCompetitor}
                      </div>

                      <div style={{ background: "#edf7f1", padding: 10, borderRadius: 8, fontSize: 10, color: "#144d32" }}>
                        <strong style={{ display: "block", color: "#22754d", fontSize: 8, marginBottom: 4 }}>
                          GAINFORGE WINNABLE ADVANTAGE
                        </strong>
                        {c.competitiveOpportunity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Footer */}
          <footer className="page-footer">
            <span>© 2026 GainForge</span>
            <span>
              <span className="footer-dot" /> Complete Growth Intelligence Suite · Evidence first, actions second
            </span>
            <button onClick={() => setShowPricingModal(true)}>
              Subscription Tier: Free Workspace
            </button>
          </footer>
        </div>
      </section>

      {/* COMPETITOR URL COMPARISON MODAL */}
      {showCompetitorModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !analyzingCompetitor) setShowCompetitorModal(false);
          }}
        >
          <div className="modal">
            <div className="modal-header">
              <div>
                <div className="modal-kicker">
                  <ShieldCheck size={14} /> COMPETITOR BENCHMARKING
                </div>
                <h2>Compare a competitor website</h2>
                <p>
                  Input a competitor&apos;s URL to inspect their public positioning, conversion friction, and uncover winnable commercial gaps for {profile.name}.
                </p>
              </div>
              <button
                className="icon-button"
                onClick={() => setShowCompetitorModal(false)}
                disabled={analyzingCompetitor}
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleAddCompetitor}>
              <label>
                Competitor website URL
                <input
                  value={competitorUrl}
                  onChange={(e) => setCompetitorUrl(e.target.value)}
                  placeholder="https://competitor.com"
                  type="url"
                  required
                />
              </label>

              <label>
                Competitor brand / business name (optional)
                <input
                  value={competitorName}
                  onChange={(e) => setCompetitorName(e.target.value)}
                  placeholder="e.g. Metro Facilities Group"
                />
              </label>

              <div className="modal-note">
                <Lightbulb size={16} />
                <span>
                  GainForge evaluates public signals (response time commitments, pricing transparency, SLA guarantees, and audit friction) to show you where you can win contracts.
                </span>
              </div>

              <button className="primary-button modal-submit" type="submit" disabled={analyzingCompetitor}>
                {analyzingCompetitor ? (
                  <>
                    <span className="spinner" /> Analyzing competitor website…
                  </>
                ) : (
                  <>
                    <Search size={15} /> Run competitor comparison <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PLANS & PRICING MODAL (PHASE 06) */}
      {showPricingModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowPricingModal(false);
          }}
        >
          <div className="modal" style={{ maxWidth: 840 }}>
            <div className="modal-header">
              <div>
                <div className="modal-kicker">
                  <CreditCard size={14} /> GAINFORGE SUBSCRIPTIONS
                </div>
                <h2>Simple, transparent plans that compound growth</h2>
                <p>Choose the tier designed to help your business turn opportunities into revenue.</p>
              </div>
              <button className="icon-button" onClick={() => setShowPricingModal(false)} aria-label="Close">
                <X size={19} />
              </button>
            </div>

            <div className="pricing-grid">
              <div className="pricing-card">
                <h4 style={{ margin: 0, fontSize: 13 }}>Free</h4>
                <div className="pricing-price">£0</div>
                <p style={{ fontSize: 10, color: "#74867c", minHeight: 32 }}>For initial diagnosis and exploration</p>
                <ul className="pricing-features">
                  <li><Check size={13} style={{ color: "#16764b" }} /> 3 website growth audits</li>
                  <li><Check size={13} style={{ color: "#16764b" }} /> Basic opportunity preview</li>
                  <li><Check size={13} style={{ color: "#16764b" }} /> Browser action checklist</li>
                </ul>
                <button className="outline-button" style={{ marginTop: 18 }} onClick={() => setShowPricingModal(false)}>
                  Current Plan
                </button>
              </div>

              <div className="pricing-card">
                <h4 style={{ margin: 0, fontSize: 13 }}>Starter</h4>
                <div className="pricing-price">£29<span style={{ fontSize: 12, fontWeight: 400 }}>/mo</span></div>
                <p style={{ fontSize: 10, color: "#74867c", minHeight: 32 }}>For small businesses taking action</p>
                <ul className="pricing-features">
                  <li><Check size={13} style={{ color: "#16764b" }} /> Full growth opportunity pipeline</li>
                  <li><Check size={13} style={{ color: "#16764b" }} /> AI Campaign & copy generation</li>
                  <li><Check size={13} style={{ color: "#16764b" }} /> Task & deadline tracker</li>
                  <li><Check size={13} style={{ color: "#16764b" }} /> Unlimited audits & re-audits</li>
                </ul>
                <button className="primary-button" style={{ marginTop: 18 }} onClick={() => notify("Stripe checkout will be linked upon customer pilot validation.")}>
                  Upgrade Starter
                </button>
              </div>

              <div className="pricing-card featured">
                <span className="category-pill" style={{ background: "#d6ebd9", color: "#145936", alignSelf: "flex-start", marginBottom: 6 }}>
                  MOST POPULAR
                </span>
                <h4 style={{ margin: 0, fontSize: 13 }}>Growth</h4>
                <div className="pricing-price">£79<span style={{ fontSize: 12, fontWeight: 400 }}>/mo</span></div>
                <p style={{ fontSize: 10, color: "#74867c", minHeight: 32 }}>For businesses actively winning customers</p>
                <ul className="pricing-features">
                  <li><Check size={13} style={{ color: "#16764b" }} /> Customer & Lead Finder</li>
                  <li><Check size={13} style={{ color: "#16764b" }} /> Verifiable public registry research</li>
                  <li><Check size={13} style={{ color: "#16764b" }} /> 3-touch outbound sequence builder</li>
                  <li><Check size={13} style={{ color: "#16764b" }} /> Revenue & ROI conversion funnel</li>
                </ul>
                <button className="primary-button" style={{ marginTop: 18 }} onClick={() => notify("Stripe checkout will be linked upon customer pilot validation.")}>
                  Upgrade Growth
                </button>
              </div>

              <div className="pricing-card">
                <h4 style={{ margin: 0, fontSize: 13 }}>Agency</h4>
                <div className="pricing-price">£149<span style={{ fontSize: 12, fontWeight: 400 }}>/mo</span></div>
                <p style={{ fontSize: 10, color: "#74867c", minHeight: 32 }}>For consultants managing client growth</p>
                <ul className="pricing-features">
                  <li><Check size={13} style={{ color: "#16764b" }} /> Up to 10 client workspaces</li>
                  <li><Check size={13} style={{ color: "#16764b" }} /> White-labeled audit PDF exports</li>
                  <li><Check size={13} style={{ color: "#16764b" }} /> Consolidated portfolio reporting</li>
                  <li><Check size={13} style={{ color: "#16764b" }} /> Priority API generation limits</li>
                </ul>
                <button className="outline-button" style={{ marginTop: 18 }} onClick={() => notify("Stripe checkout will be linked upon customer pilot validation.")}>
                  Contact Agency
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD PROSPECT MODAL */}
      {showAddProspectModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowAddProspectModal(false);
          }}
        >
          <div className="modal">
            <div className="modal-header">
              <div>
                <div className="modal-kicker">
                  <Users size={14} /> NEW COMMERCIAL PROSPECT
                </div>
                <h2>Add prospective client</h2>
                <p>Track a verified company and link it to your outreach workflow.</p>
              </div>
              <button className="icon-button" onClick={() => setShowAddProspectModal(false)} aria-label="Close">
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleAddCustomProspect}>
              <label>
                Company name
                <input
                  value={newProspectName}
                  onChange={(e) => setNewProspectName(e.target.value)}
                  placeholder="e.g. Apex Facilities Group Ltd"
                  required
                />
              </label>

              <div className="form-row-2">
                <label>
                  Target Role / Title
                  <input
                    value={newProspectRole}
                    onChange={(e) => setNewProspectRole(e.target.value)}
                    placeholder="e.g. Facilities Director"
                  />
                </label>
                <label>
                  Sector
                  <input
                    value={newProspectSector}
                    onChange={(e) => setNewProspectSector(e.target.value)}
                    placeholder="e.g. Commercial Real Estate"
                  />
                </label>
              </div>

              <label>
                Source URL (Companies House, public portal, etc.)
                <input
                  value={newProspectUrl}
                  onChange={(e) => setNewProspectUrl(e.target.value)}
                  placeholder="https://find-and-update.company-information.service.gov.uk"
                />
              </label>

              <label>
                Estimated Deal Size / Opportunity
                <input
                  value={newProspectOpportunity}
                  onChange={(e) => setNewProspectOpportunity(e.target.value)}
                  placeholder="e.g. Commercial retainer (~£2,000/mo)"
                />
              </label>

              <button className="primary-button modal-submit" type="submit">
                Add to lead finder <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* BUSINESS PROFILE MODAL */}
      {showProfileModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowProfileModal(false);
          }}
        >
          <div className="modal">
            <div className="modal-header">
              <div>
                <div className="modal-kicker">
                  <Sparkles size={14} /> BUSINESS PROFILE
                </div>
                <h2>Shape your growth workspace</h2>
                <p>
                  Your details tailor the opportunities, actions, and audit recommendations.
                </p>
              </div>
              <button className="icon-button" onClick={() => setShowProfileModal(false)} aria-label="Close">
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleProfileSubmit}>
              <div className="form-row-2">
                <label>
                  Business / Brand name
                  <input
                    value={profile.name === "Your business" ? "" : profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="e.g. Apex Facilities Ltd"
                    required
                  />
                </label>
                <label>
                  Website URL
                  <input
                    value={profile.website}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    placeholder="https://yourbusiness.com"
                    type="url"
                  />
                </label>
              </div>

              <div className="form-row-2">
                <label>
                  Industry / Sector
                  <select
                    value={profile.industry}
                    onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                  >
                    <option>Cleaning & Facilities</option>
                    <option>Trades & Home Services</option>
                    <option>Consulting & Professional</option>
                    <option>Marketing & Creative Agency</option>
                    <option>B2B SaaS & Technology</option>
                    <option>Local Retail & Hospitality</option>
                    <option>Other service business</option>
                  </select>
                </label>
                <label>
                  Primary Location / Region
                  <input
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    placeholder="e.g. Greater London, UK"
                  />
                </label>
              </div>

              <label>
                Target customer / ideal buyer
                <input
                  value={profile.targetAudience}
                  onChange={(e) => setProfile({ ...profile, targetAudience: e.target.value })}
                  placeholder="e.g. Commercial property managers and office facilities leads"
                />
              </label>

              <label>
                Primary growth goal
                <select
                  value={profile.goal}
                  onChange={(e) => setProfile({ ...profile, goal: e.target.value })}
                >
                  <option>Find more customers</option>
                  <option>Generate more qualified leads</option>
                  <option>Win commercial contracts</option>
                  <option>Convert more website visitors</option>
                  <option>Recover unconverted enquiries and lost quotes</option>
                  <option>Understand competitors and market gaps</option>
                </select>
              </label>

              <label>
                Current main bottleneck or challenge
                <input
                  value={profile.challenge}
                  onChange={(e) => setProfile({ ...profile, challenge: e.target.value })}
                  placeholder="e.g. Visitors leave without enquiring, or quotes stall without follow-up"
                />
              </label>

              <div className="modal-note">
                <Lightbulb size={16} />
                <span>
                  Saved to your browser storage. When you run an audit, findings are automatically matched against this profile.
                </span>
              </div>

              <button className="primary-button modal-submit" type="submit">
                Save profile & update workspace <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD OPPORTUNITY MODAL */}
      {showAddOppModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowAddOppModal(false);
          }}
        >
          <div className="modal">
            <div className="modal-header">
              <div>
                <div className="modal-kicker">
                  <Target size={14} /> NEW GROWTH ACTION
                </div>
                <h2>Add custom growth action</h2>
                <p>Create a trackable commercial initiative for your business.</p>
              </div>
              <button className="icon-button" onClick={() => setShowAddOppModal(false)} aria-label="Close">
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleCreateOpportunity}>
              <label>
                Action title
                <input
                  value={newOppTitle}
                  onChange={(e) => setNewOppTitle(e.target.value)}
                  placeholder="e.g. Launch commercial cleaning brochure for local facility managers"
                  required
                />
              </label>

              <div className="form-row-2">
                <label>
                  Category
                  <select
                    value={newOppCategory}
                    onChange={(e) => setNewOppCategory(e.target.value as OpportunityCategory)}
                  >
                    <option value="Conversion">Conversion</option>
                    <option value="Acquisition">Acquisition</option>
                    <option value="Demand signal">Demand signal</option>
                    <option value="Trust & Positioning">Trust & Positioning</option>
                    <option value="Revenue recovery">Revenue recovery</option>
                  </select>
                </label>
                <label>
                  Estimated effort
                  <select
                    value={newOppEffort}
                    onChange={(e) => setNewOppEffort(e.target.value as "quick" | "medium" | "bigger")}
                  >
                    <option value="quick">Quick win (~15 min)</option>
                    <option value="medium">Medium (1–2 hrs)</option>
                    <option value="bigger">Bigger (1/2 day+)</option>
                  </select>
                </label>
              </div>

              <label>
                Specific next step
                <input
                  value={newOppAction}
                  onChange={(e) => setNewOppAction(e.target.value)}
                  placeholder="e.g. Draft 1-page PDF and email 10 target commercial building contacts"
                  required
                />
              </label>

              <label>
                Evidence / Context
                <input
                  value={newOppEvidence}
                  onChange={(e) => setNewOppEvidence(e.target.value)}
                  placeholder="e.g. 5 commercial properties nearby opened new offices this quarter"
                />
              </label>

              <label>
                Target completion timeframe
                <select
                  value={newOppDeadline}
                  onChange={(e) => setNewOppDeadline(e.target.value)}
                >
                  <option>Within 3 days</option>
                  <option>Within 7 days</option>
                  <option>Within 14 days</option>
                  <option>Within 30 days</option>
                </select>
              </label>

              <button className="primary-button modal-submit" type="submit">
                Add to pipeline <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* OPPORTUNITY DETAIL MODAL */}
      {selected && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <div className="modal detail-modal">
            <div className="modal-header">
              <div>
                <div className="modal-kicker">
                  <Target size={14} /> OPPORTUNITY REVIEW
                </div>
                <h2>{selected.title}</h2>
                <p>
                  {selected.company} · {selected.source}
                </p>
              </div>
              <button className="icon-button" onClick={() => setSelected(null)} aria-label="Close">
                <X size={19} />
              </button>
            </div>

            <div className="detail-tags">
              <span className={`table-status ${selected.status.toLowerCase().replace(" ", "-")}`}>
                {selected.status}
              </span>
              <span className="category-pill">{selected.category}</span>
              <span className={`effort-badge ${selected.effort}`}>{EFFORT_LABELS[selected.effort]}</span>
              <span className="confidence-label">
                <i className={`confidence-dot ${selected.confidence.toLowerCase()}`} />
                {selected.confidence} confidence
              </span>
              <span className="deadline-badge">
                <Clock size={11} /> {selected.deadline}
              </span>
            </div>

            <div className="detail-section">
              <h3>Observed Evidence</h3>
              <p>{selected.evidence}</p>
            </div>

            <div className="detail-section">
              <h3>Why This Matters</h3>
              <p>{selected.reason}</p>
            </div>

            <div className="detail-section">
              <h3>Concrete Next Action</h3>
              <p>
                <strong>{selected.action}</strong>
              </p>
            </div>

            <div className="detail-section">
              <h3>Hypothesis to Test (Not a Guaranteed Result)</h3>
              <p>{selected.hypothesis}</p>
            </div>

            <div className="detail-section">
              <h3>Measurable Success Metric</h3>
              <p>{selected.successMetric}</p>
            </div>

            <div className="detail-section">
              <h3>Target Deadline</h3>
              <select
                value={selected.deadline}
                onChange={(e) => updateOpportunityDeadline(selected.id, e.target.value)}
                style={{ width: "100%", height: 36, padding: "0 10px", borderRadius: 7, border: "1px solid #dfe7e1" }}
              >
                <option>Within 3 days</option>
                <option>Within 7 days</option>
                <option>Within 14 days</option>
                <option>Within 30 days</option>
                <option>Ongoing habit</option>
              </select>
            </div>

            <div className="detail-section">
              <h3>Implementation Notes</h3>
              <textarea
                value={selected.notes || ""}
                onChange={(e) => updateOpportunityNote(selected.id, e.target.value)}
                placeholder="Add private notes on execution, contacts made, or outcomes observed…"
              />
            </div>

            <div className="detail-actions">
              <button
                className="outline-button"
                onClick={() => {
                  updateStatus(selected.id, "Dismissed");
                  setSelected(null);
                }}
              >
                Dismiss
              </button>
              {selected.status !== "In progress" && (
                <button
                  className="outline-button"
                  onClick={() => updateStatus(selected.id, "In progress")}
                >
                  <ListChecks size={15} /> Mark in progress
                </button>
              )}
              {selected.status !== "Won" && (
                <button
                  className="primary-button"
                  onClick={() => {
                    updateStatus(selected.id, "Won");
                    setSelected(null);
                  }}
                >
                  <Check size={16} /> Mark as won
                </button>
              )}
              {selected.status !== "New" && (
                <button
                  className="outline-button"
                  onClick={() => updateStatus(selected.id, "New")}
                >
                  Reopen as New
                </button>
              )}
              <button
                className="primary-button"
                style={{ background: "#15241c" }}
                onClick={() => {
                  setSelectedOppForCampaign(selected.id);
                  setActiveNav("Campaigns");
                  setSelected(null);
                  notify("Opened in Campaign Builder.");
                }}
              >
                <Sparkles size={14} /> Write campaign for this
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXECUTIVE GROWTH BRIEF MODAL (PRINTABLE 1-PAGE SUMMARY) */}
      {showBriefModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowBriefModal(false);
          }}
        >
          <div className="brief-modal">
            <div className="brief-header">
              <div>
                <div className="brief-brand-tag">
                  <TrendingUp size={15} /> GainForge Growth Intelligence · Executive Brief
                </div>
                <h2 className="brief-title">{profile.name} Growth Strategy</h2>
                <div className="brief-sub">
                  Target: {profile.targetAudience} · Market: {profile.location} · Goal: {profile.goal}
                </div>
              </div>
              <button
                className="icon-button"
                onClick={() => setShowBriefModal(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* KPI Summary Grid */}
            <div className="brief-meta-grid">
              <div className="brief-meta-item">
                <small>Pipeline Value</small>
                <strong>£{totalPipelineValue.toLocaleString()}</strong>
              </div>
              <div className="brief-meta-item">
                <small>Won Revenue</small>
                <strong style={{ color: "#16764b" }}>£{wonRevenue.toLocaleString()}</strong>
              </div>
              <div className="brief-meta-item">
                <small>Audit Health Score</small>
                <strong>{latestAudit ? `${latestAudit.score}/100` : "74/100"}</strong>
              </div>
              <div className="brief-meta-item">
                <small>Attributable ROI</small>
                <strong style={{ color: "#186c46" }}>{estimatedRoiRatio}x</strong>
              </div>
            </div>

            {/* Strategic Executive Summary */}
            <div className="brief-section">
              <div className="brief-section-title">
                <Sparkles size={16} style={{ color: "#16764b" }} /> Strategic Diagnosis & Commercial Plan
              </div>
              <p style={{ fontSize: 11, lineHeight: 1.7, color: "#45564c", margin: 0 }}>
                This assessment turns direct website audit findings, competitive benchmarks, and public demand signals into an actionable growth sprint. By eliminating friction on customer trust signals and deploying structured 3-touch outbound sequences to verified commercial accounts in <strong>{profile.location}</strong>, <strong>{profile.name}</strong> can systematically capture high-value contracts and increase qualified demo bookings.
              </p>
            </div>

            {/* Top 3 Opportunities Table */}
            <div className="brief-section">
              <div className="brief-section-title">
                <Target size={16} style={{ color: "#16764b" }} /> Top Priority Growth Initiatives
              </div>
              <table className="brief-opp-table">
                <thead>
                  <tr>
                    <th style={{ width: "35%" }}>Opportunity & Focus</th>
                    <th style={{ width: "35%" }}>Concrete Action to Take</th>
                    <th style={{ width: "15%" }}>Effort</th>
                    <th style={{ width: "15%" }}>Metric</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.slice(0, 3).map((opp) => (
                    <tr key={opp.id}>
                      <td>
                        <strong style={{ color: "#182c20" }}>{opp.title}</strong>
                        <div style={{ fontSize: 10, color: "#6e8075", marginTop: 3 }}>{opp.evidence}</div>
                      </td>
                      <td style={{ color: "#2d4234" }}>{opp.action}</td>
                      <td>
                        <span className={`effort-badge ${opp.effort}`}>{opp.effort}</span>
                      </td>
                      <td style={{ fontSize: 10, fontWeight: 700, color: "#16764b" }}>
                        {opp.successMetric}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 30-Day Growth Sprint */}
            <div className="brief-section">
              <div className="brief-section-title">
                <Calendar size={16} style={{ color: "#16764b" }} /> 30-Day Growth Sprint Milestones
              </div>
              <div className="brief-calendar-grid">
                <div className="brief-cal-column">
                  <h4>Week 1: Foundations</h4>
                  <ul>
                    <li>Implement urgent website trust & conversion fixes.</li>
                    <li>Publish response SLA guarantees above the fold.</li>
                    <li>Synchronize audit recommendations into pipeline.</li>
                  </ul>
                </div>
                <div className="brief-cal-column">
                  <h4>Week 2: Direct Outreach</h4>
                  <ul>
                    <li>Verify top 10 targeted corporate accounts.</li>
                    <li>Deploy 3-touch sequence via automated webhook.</li>
                    <li>Personalize initial emails with verifiable public data.</li>
                  </ul>
                </div>
                <div className="brief-cal-column">
                  <h4>Weeks 3–4: Revenue & Review</h4>
                  <ul>
                    <li>Conduct discovery calls and tailored audits.</li>
                    <li>Log completed contract outcomes and verified revenue.</li>
                    <li>Run repeat audit to track performance score drift.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Target Leads Sample */}
            {prospects.length > 0 && (
              <div className="brief-section">
                <div className="brief-section-title">
                  <Users size={16} style={{ color: "#16764b" }} /> Verified Accounts In Acquisition Pipeline
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {prospects.slice(0, 3).map((p) => (
                    <div key={p.id} style={{ background: "#f8faf8", border: "1px solid #e1ece4", borderRadius: 8, padding: 10, fontSize: 10 }}>
                      <strong style={{ fontSize: 11, color: "#18291f" }}>{p.companyName}</strong>
                      <div style={{ color: "#6d7d73", margin: "2px 0 4px" }}>{p.targetRole} · {p.location}</div>
                      <div style={{ color: "#16764b", fontWeight: 700 }}>{p.estimatedOpportunity}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Bar for Print & Save */}
            <div className="brief-actions-bar">
              <button
                className="outline-button"
                onClick={() => setShowBriefModal(false)}
              >
                Close
              </button>
              <button
                className="primary-button"
                onClick={() => window.print()}
              >
                <Printer size={15} /> Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW CLIENT WORKSPACE MODAL (AGENCY WORKSPACE) */}
      {showNewWorkspaceModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowNewWorkspaceModal(false);
          }}
        >
          <div className="modal">
            <div className="modal-header">
              <div>
                <div className="modal-kicker">
                  <Building2 size={14} /> AGENCY CLIENT WORKSPACE
                </div>
                <h2>Create new client workspace</h2>
                <p>Manage separate client businesses with their own audits, opportunities, and pipelines.</p>
              </div>
              <button className="icon-button" onClick={() => setShowNewWorkspaceModal(false)} aria-label="Close">
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace}>
              <label>
                Client / Company Name
                <input
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="e.g. Camden Commercial Estates Ltd"
                  required
                />
              </label>

              <div className="form-row-2">
                <label>
                  Industry / Sector
                  <input
                    value={newWsIndustry}
                    onChange={(e) => setNewWsIndustry(e.target.value)}
                    placeholder="e.g. Property Management"
                  />
                </label>
                <label>
                  Location / Region
                  <input
                    value={newWsLocation}
                    onChange={(e) => setNewWsLocation(e.target.value)}
                    placeholder="e.g. North London"
                  />
                </label>
              </div>

              <label>
                Target Customer / Buyer Profile
                <input
                  value={newWsAudience}
                  onChange={(e) => setNewWsAudience(e.target.value)}
                  placeholder="e.g. Managing Directors and Building Operators"
                />
              </label>

              <label>
                Primary Growth Goal
                <select
                  value={newWsGoal}
                  onChange={(e) => setNewWsGoal(e.target.value)}
                  style={{ height: 40, borderRadius: 8, border: "1px solid #dfe7e1", padding: "0 10px", fontSize: 11 }}
                >
                  <option>Generate more qualified leads</option>
                  <option>Win commercial contracts</option>
                  <option>Improve conversion rates</option>
                  <option>Retain existing clients</option>
                </select>
              </label>

              <button className="primary-button modal-submit" type="submit">
                Create & switch to workspace <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast">
          <Check size={16} />
          {toast}
          <button onClick={() => setToast("")} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
  change,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  tone: string;
}) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${tone}`}>{icon}</div>
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      <span className="metric-change">{change}</span>
    </div>
  );
}
