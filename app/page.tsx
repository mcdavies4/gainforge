"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Activity, ArrowRight, ArrowUpRight, BarChart3, Bell, Calendar,
  Check, CheckCircle2, ChevronDown, CircleHelp, Clock, Compass, Copy,
  CreditCard, Download, ExternalLink, Filter, Globe2, HelpCircle, Layers,
  LayoutDashboard, Lightbulb, ListChecks, Mail, Menu, Plus, RefreshCw,
  RotateCcw, Search, Send, Settings2, ShieldCheck, Sparkles, Target,
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

  // Campaign Builder State
  const [campaigns, setCampaigns] = useState<SavedCampaign[]>([]);
  const [selectedOppForCampaign, setSelectedOppForCampaign] = useState<string>("");
  const [campaignType, setCampaignType] = useState<"outreach" | "landing_page" | "proposal" | "community_reply">("outreach");
  const [generatedCampaign, setGeneratedCampaign] = useState<string>("");
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [copiedCampaign, setCopiedCampaign] = useState(false);

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

        <div className="workspace-switch" onClick={() => setShowProfileModal(true)} style={{ cursor: "pointer" }}>
          <div className="workspace-avatar">{profile.name.slice(0, 2).toUpperCase()}</div>
          <div className="workspace-copy">
            <strong>{profile.name}</strong>
            <span>{profile.industry || "Growth workspace"}</span>
          </div>
          <ChevronDown size={15} />
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
            <div style={{ display: "flex", gap: 10 }}>
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

                    <div style={{ marginTop: "auto", display: "flex", gap: 8, paddingTop: 10 }}>
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
                          setActiveNav("Campaigns");
                          notify(`Switched to Campaign Builder to prepare outreach for ${p.companyName}.`);
                        }}
                      >
                        <Mail size={13} /> Write outreach
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

                {/* Live Preview Area */}
                <div className="campaign-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <h3 style={{ fontSize: 13, margin: 0 }}>Generated Marketing Copy</h3>
                    {generatedCampaign && (
                      <button
                        className="outline-button"
                        onClick={() => copyToClipboard(generatedCampaign)}
                      >
                        {copiedCampaign ? <Check size={14} /> : <Copy size={14} />} Copy copy
                      </button>
                    )}
                  </div>

                  {generatedCampaign ? (
                    <div className="campaign-preview">{generatedCampaign}</div>
                  ) : (
                    <div
                      style={{
                        padding: 60,
                        textAlign: "center",
                        color: "#7e8f84",
                        border: "2px dashed #e2ede5",
                        borderRadius: 10,
                        fontSize: 11,
                      }}
                    >
                      <Sparkles size={28} style={{ margin: "0 auto 12px", color: "#2d8a59" }} />
                      <strong>Ready to turn an opportunity into actionable outreach.</strong>
                      <p style={{ maxWidth: 360, margin: "6px auto 16px", lineHeight: 1.5 }}>
                        Select an opportunity and click <strong>Generate Campaign</strong> to produce a 3-touch outbound sequence or conversion copy.
                      </p>
                      <button className="primary-button" onClick={handleGenerateCampaign} disabled={campaignLoading}>
                        Generate initial draft
                      </button>
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

      {/* Toast Notification */}
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
