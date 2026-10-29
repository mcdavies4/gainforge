"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowRight, ArrowUpRight, BarChart3, Bell, Calendar,
  Check, CheckCircle2, ChevronDown, CircleHelp, Clock, Compass, Download,
  ExternalLink, Filter, Globe2, HelpCircle, Layers, LayoutDashboard,
  Lightbulb, ListChecks, Mail, Menu, Plus, RefreshCw, RotateCcw, Search,
  Settings2, Sparkles, Target, TrendingUp, Users, X, Zap
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

const navItems = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Opportunities", icon: Compass },
  { label: "Action centre", icon: ListChecks },
  { label: "Growth insights", icon: BarChart3 },
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

  // Growth Engine Data
  const [opportunities, setOpportunities] = useState<GrowthOpportunity[]>(INITIAL_OPPORTUNITIES);
  const [latestAudit, setLatestAudit] = useState<AuditReport | null>(null);

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

  const syncAuditToEngine = (
    audit: AuditReport,
    currentProfile: BusinessProfile,
    existingOpps: GrowthOpportunity[]
  ) => {
    const generated = generateOpportunitiesFromAudit(currentProfile, audit);
    // Merge generated opportunities, avoiding exact duplicate titles
    const existingTitles = new Set(existingOpps.map((o) => o.title.toLowerCase()));
    const fresh = generated.filter((g) => !existingTitles.has(g.title.toLowerCase()));

    const combined = [...fresh, ...existingOpps];
    setOpportunities(combined);
    saveOpportunities(combined);
    notify(`Synthesized ${fresh.length} audit-backed opportunities into your pipeline.`);
  };

  // Load persisted state on mount
  useEffect(() => {
    const savedProfile = loadProfile();
    setProfile(savedProfile);

    const savedOpps = loadOpportunities();
    setOpportunities(savedOpps);

    const audit = loadLatestAudit();
    setLatestAudit(audit);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    // If an audit already exists, update and regenerate opportunities
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
    notify(
      status === "Won"
        ? "Marked as won! Verified customer outcome recorded."
        : `Opportunity moved to ${status.toLowerCase()}.`
    );
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

  const resetToSampleData = () => {
    setOpportunities(INITIAL_OPPORTUNITIES);
    saveOpportunities(INITIAL_OPPORTUNITIES);
    notify("Workspace reset to standard sample recommendations.");
  };

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

  // Filtered opportunities
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

  // Statistics
  const openCount = opportunities.filter((o) => o.status === "New" || o.status === "In progress").length;
  const inProgressCount = opportunities.filter((o) => o.status === "In progress").length;
  const wonCount = opportunities.filter((o) => o.status === "Won").length;
  const totalCount = opportunities.length;
  const completionPct = totalCount > 0 ? Math.round(((wonCount + inProgressCount * 0.5) / totalCount) * 100) : 0;

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

        <button className="nav-item" onClick={() => notify("Integrations (CRM & Google Sheets) in Milestone 06.")}>
          <Zap size={18} />
          <span>Integrations</span>
          <span className="soon">SOON</span>
        </button>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon">
              <Sparkles size={16} />
            </div>
            <strong>Grow with clarity.</strong>
            <p>Every opportunity leads to an action; every action measures outcome.</p>
            <button onClick={() => notify("Paid subscriptions will be introduced after customer validation.")}>
              Explore roadmap <ArrowRight size={14} />
            </button>
          </div>
          <button
            className="profile-row"
            onClick={() => notify("Account management will arrive in Milestone 06 with secure authentication.")}
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
              <span /> GROWTH ENGINE ACTIVE
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
              onClick={() => notify("GainForge connects website diagnosis directly to actionable, trackable growth initiatives.")}
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
                <span className="eyebrow-dot" /> GROWTH OPPORTUNITY ENGINE
              </div>
              <h1>{activeNav === "Overview" ? "Make your next move count." : activeNav}</h1>
              <p className="subtitle">
                {activeNav === "Overview"
                  ? "Turn audit evidence and business signals into practical, high-value commercial actions."
                  : activeNav === "Opportunities"
                  ? "Review, validate, and prioritize evidence-backed growth actions."
                  : activeNav === "Action centre"
                  ? "Execute tasks, manage follow-ups, and track verified customer outcomes."
                  : "Measure progress, track verified wins, and refine your growth strategy."}
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="outline-button" onClick={() => setShowAddOppModal(true)}>
                <Plus size={15} /> Add action
              </button>
              <button className="primary-button" onClick={() => setShowProfileModal(true)}>
                <Settings2 size={16} /> Edit profile
              </button>
            </div>
          </div>

          {/* OVERVIEW TAB */}
          {activeNav === "Overview" && (
            <>
              {/* Audit Connection Banner */}
              {latestAudit ? (
                <div className="audit-sync-banner">
                  <div className="audit-sync-info">
                    <div className="audit-sync-badge">{latestAudit.score}</div>
                    <div>
                      <strong>
                        Website Audit available: {latestAudit.finalUrl.replace(/^https?:\/\//, "")} (Score {latestAudit.score}/100)
                      </strong>
                      <p>
                        {latestAudit.findings.filter((f) => f.severity !== "pass").length} actionable improvements identified.
                        Connect them to your opportunity pipeline.
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
                  icon={<ListChecks size={18} />}
                  label="Actions in progress"
                  value={String(inProgressCount)}
                  change="Actively being executed"
                  tone="violet"
                />
                <Metric
                  icon={<CheckCircle2 size={18} />}
                  label="Verified wins"
                  value={String(wonCount)}
                  change="Completed customer outcomes"
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
                {/* Left: Recommended Opportunities */}
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

                {/* Right: Next Best Actions */}
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
                    <div className={`action-check ${latestAudit ? "" : "muted"}`}>
                      <Globe2 size={13} />
                    </div>
                    <div>
                      <strong>Audit website conversion friction</strong>
                      <span>
                        {latestAudit ? `Audited (Score ${latestAudit.score}/100)` : "Find what holds visitors back"}
                      </span>
                    </div>
                    <Link
                      href={auditorHref}
                      aria-label="Run website audit"
                      style={{ color: "#a1aca4", padding: 5, display: "flex" }}
                    >
                      <ArrowRight size={16} />
                    </Link>
                  </div>

                  <div className="action-item">
                    <div className={`action-check ${inProgressCount > 0 ? "" : "muted"}`}>
                      <ListChecks size={13} />
                    </div>
                    <div>
                      <strong>Execute an action from your pipeline</strong>
                      <span>{inProgressCount} active tasks in progress</span>
                    </div>
                    <button onClick={() => setActiveNav("Action centre")} aria-label="Go to action centre">
                      <ArrowRight size={16} />
                    </button>
                  </div>

                  <div className="action-item">
                    <div className={`action-check ${wonCount > 0 ? "" : "muted"}`}>
                      <Target size={13} />
                    </div>
                    <div>
                      <strong>Record verified customer outcomes</strong>
                      <span>{wonCount} verified results logged</span>
                    </div>
                    <button onClick={() => setActiveNav("Growth insights")} aria-label="View insights">
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

          {/* OPPORTUNITIES TAB */}
          {activeNav === "Opportunities" && (
            <section className="panel full-panel">
              <div className="panel-header">
                <div>
                  <h2>Growth opportunity pipeline</h2>
                  <p>Evidence-backed opportunities synthesized from your audit and business profile.</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="outline-button" onClick={resetToSampleData}>
                    <RotateCcw size={14} /> Reset sample
                  </button>
                  <button className="outline-button" onClick={exportCsv}>
                    <Download size={15} /> Export CSV
                  </button>
                  <button className="primary-button" onClick={() => setShowAddOppModal(true)}>
                    <Plus size={15} /> Add opportunity
                  </button>
                </div>
              </div>

              {/* Filters toolbar */}
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

              {/* Table */}
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

          {/* ACTION CENTRE TAB */}
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

          {/* GROWTH INSIGHTS TAB */}
          {activeNav === "Growth insights" && (
            <section className="panel full-panel">
              <div className="panel-header">
                <div>
                  <h2>Growth insights & commercial outcomes</h2>
                  <p>Verified outcomes and pipeline health for {profile.name}.</p>
                </div>
                <span className="demo-pill">
                  <span /> EVIDENCE-FIRST
                </span>
              </div>

              <div className="insight-grid">
                <div className="insight-card">
                  <div className="insight-icon green">
                    <CheckCircle2 size={19} />
                  </div>
                  <h3>Commercial execution rate</h3>
                  <p>
                    {wonCount} initiatives marked as won out of {totalCount} discovered opportunities.
                  </p>
                  <span className="insight-state">{completionPct}% progress</span>
                </div>

                <div className="insight-card">
                  <div className="insight-icon blue">
                    <Globe2 size={19} />
                  </div>
                  <h3>Website audit status</h3>
                  <p>
                    {latestAudit
                      ? `Last audit scored ${latestAudit.score}/100. ${latestAudit.findings.filter((f) => f.severity !== "pass").length} issues identified for resolution.`
                      : "Run an audit on your website to measure conversion and acquisition signals."}
                  </p>
                  <span className="insight-state">
                    {latestAudit ? "Verified check" : "Awaiting audit"}
                  </span>
                </div>

                <div className="insight-card">
                  <div className="insight-icon violet">
                    <TrendingUp size={19} />
                  </div>
                  <h3>Attributable revenue</h3>
                  <p>
                    Connect your CRM or Stripe in Milestone 06 to track qualified revenue from won initiatives.
                  </p>
                  <span className="insight-state">Next milestone</span>
                </div>
              </div>

              <div className="note-box wide-note">
                <Lightbulb size={17} />
                <p>
                  <strong>The 5 Growth Questions</strong>
                  <br />
                  GainForge is designed to help you answer: (1) Where am I losing potential customers? (2) What opportunities could help grow? (3) Which to pursue first? (4) What exact steps to take? (5) Is my effort generating enquiries, sales or revenue?
                </p>
              </div>
            </section>
          )}

          {/* Footer */}
          <footer className="page-footer">
            <span>© 2026 GainForge</span>
            <span>
              <span className="footer-dot" /> Growth Opportunity Engine · Evidence first, actions second
            </span>
            <button onClick={() => notify("Data is saved in this browser's local storage. Cloud sync arrives in Milestone 06.")}>
              Storage status: Local persistence active
            </button>
          </footer>
        </div>
      </section>

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
