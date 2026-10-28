 "use client";

import { useMemo, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, Bell,
  Check, ChevronDown, CircleHelp, Compass, Download, Filter, Globe2,
  LayoutDashboard, Lightbulb, ListChecks, Mail, Menu, Plus, Search,
  Settings2, Sparkles, Target, TrendingUp, Users, X, Zap
} from "lucide-react";
import Link from "next/link";

type Opportunity = {
  id: number;
  title: string;
  company: string;
  category: string;
  value: string;
  confidence: "High" | "Medium";
  source: string;
  reason: string;
  action: string;
  status: "New" | "In progress" | "Won" | "Dismissed";
};

const initialOpportunities: Opportunity[] = [
  { id: 1, title: "Respond to a buyer-intent discussion", company: "Online community", category: "Demand signal", value: "Potential lead", confidence: "High", source: "Public discussion · Demo data", reason: "Someone is actively asking for a tool in your category. A helpful, transparent answer may earn a qualified visit.", action: "Draft helpful reply", status: "New" },
  { id: 2, title: "Build a comparison page", company: "Competitor gap", category: "Conversion", value: "Growth opportunity", confidence: "High", source: "Public website review · Demo data", reason: "Your offer could be easier to evaluate against alternatives. A clear comparison page can address purchase objections.", action: "Create page outline", status: "New" },
  { id: 3, title: "Follow up with unconverted enquiries", company: "Your sales pipeline", category: "Revenue recovery", value: "Recoverable leads", confidence: "Medium", source: "Suggested workflow · Demo data", reason: "A polite follow-up sequence can help recover interested prospects who have not made a decision.", action: "Draft follow-up", status: "In progress" },
  { id: 4, title: "Create a focused landing page", company: "Search opportunity", category: "Acquisition", value: "New demand", confidence: "Medium", source: "Growth recommendation · Demo data", reason: "A dedicated page for one customer problem can make your offer clearer and improve conversion measurement.", action: "Draft landing page", status: "New" },
];

const navItems = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Opportunities", icon: Compass },
  { label: "Action centre", icon: ListChecks },
  { label: "Growth insights", icon: BarChart3 },
];

export default function Home() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [businessName, setBusinessName] = useState("Your business");
  const [website, setWebsite] = useState("");
  const [goal, setGoal] = useState("Find more customers");
  const [showSetup, setShowSetup] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [opportunities, setOpportunities] = useState(initialOpportunities);
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [toast, setToast] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const auditorHref = website.trim() ? `/auditor?url=${encodeURIComponent(website.trim())}` : "/auditor";

  const visibleOpportunities = useMemo(() => opportunities.filter(o => {
    const filterMatch = filter === "All" || o.status === filter;
    const queryMatch = `${o.title} ${o.category} ${o.company}`.toLowerCase().includes(searchTerm.toLowerCase());
    return filterMatch && queryMatch;
  }), [opportunities, filter, searchTerm]);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  };

  const runDemo = () => {
    if (!website.trim()) {
      setShowSetup(true);
      notify("Add your website to personalise your growth workspace.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setGenerated(true);
      setLoading(false);
      setShowSetup(false);
      notify("Demo growth report created. Live research is not connected yet.");
    }, 950);
  };

  const updateStatus = (id: number, status: Opportunity["status"]) => {
    setOpportunities(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    setSelected(prev => prev?.id === id ? { ...prev, status } : prev);
    notify(status === "Won" ? "Marked as won. Keep tracking the actual result." : `Opportunity moved to ${status.toLowerCase()}.`);
  };

  const exportCsv = () => {
    const rows = [["Opportunity", "Company/source", "Category", "Value", "Confidence", "Status"],
      ...opportunities.map(o => [o.title, o.company, o.category, o.value, o.confidence, o.status])];
    const csv = rows.map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a"); a.href = url; a.download = "gainforge-opportunities.csv"; a.click(); URL.revokeObjectURL(url);
    notify("Opportunity list exported.");
  };

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><TrendingUp size={20} strokeWidth={2.5} /></div>
          <div><strong>gainforge</strong><span>GROWTH WORKSPACE</span></div>
          <button className="mobile-close icon-button" onClick={() => setMobileMenu(false)} aria-label="Close menu"><X size={18}/></button>
        </div>
        <div className="workspace-switch">
          <div className="workspace-avatar">YB</div><div className="workspace-copy"><strong>{businessName}</strong><span>Free workspace</span></div><ChevronDown size={15}/>
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav>
          {navItems.map(item => {
            const Icon = item.icon;
            return <button key={item.label} className={`nav-item ${activeNav === item.label ? "active" : ""}`} onClick={() => { setActiveNav(item.label); setMobileMenu(false); }}>
              <Icon size={18}/><span>{item.label}</span>{item.label === "Opportunities" && <span className="nav-count">{opportunities.filter(o => o.status === "New").length}</span>}
            </button>;
          })}
        </nav>
        <div className="nav-caption tools-caption">TOOLS</div>
        <button className="nav-item" onClick={() => { setShowSetup(true); setMobileMenu(false); }}><Settings2 size={18}/><span>Business profile</span></button>
        <Link href={auditorHref} className="nav-item" style={{ textDecoration: "none" }} onClick={() => setMobileMenu(false)}><Search size={18}/><span>Website auditor</span><span className="nav-count">NEW</span></Link>
        <button className="nav-item" onClick={() => notify("Integrations are planned for a later MVP phase.")}><Zap size={18}/><span>Integrations</span><span className="soon">SOON</span></button>
        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon"><Sparkles size={16}/></div>
            <strong>Grow with clarity.</strong>
            <p>Find your next best move, not just another metric.</p>
            <button onClick={() => notify("Paid plans will be introduced after pilot validation.")}>Explore plans <ArrowRight size={14}/></button>
          </div>
          <button className="profile-row" onClick={() => notify("Account settings will be added with authentication.")}>
            <div className="profile-avatar">DA</div><div className="profile-copy"><strong>Demo account</strong><span>Founder</span></div><ChevronDown size={15}/>
          </button>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <button className="mobile-menu icon-button" onClick={() => setMobileMenu(true)} aria-label="Open menu"><Menu size={20}/></button>
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>{activeNav}</strong></div>
          <div className="topbar-right"><span className="demo-pill"><span/> DEMO MODE</span><button className="icon-button notification" aria-label="Notifications" onClick={() => notify("You're all caught up.")}><Bell size={18}/><i/></button><button className="help-button" onClick={() => notify("This prototype uses illustrative data. Live research and integrations are next.")}><CircleHelp size={17}/> Help</button></div>
        </header>

        <div className="content">
          <div className="welcome-row">
            <div><div className="eyebrow"><span className="eyebrow-dot"/> YOUR GROWTH, IN FOCUS</div><h1>{activeNav === "Overview" ? "Make your next move count." : activeNav}</h1><p className="subtitle">{activeNav === "Overview" ? "Turn business signals into clear, practical actions." : activeNav === "Opportunities" ? "Review potential growth opportunities and decide what to do next." : activeNav === "Action centre" ? "Keep useful actions moving and track their outcomes." : "Understand what is moving your business forward."}</p></div>
            <button className="primary-button" onClick={() => setShowSetup(true)}><Plus size={17}/> Business profile</button>
          </div>

          {activeNav === "Overview" && <>
            <div className="setup-banner">
              <div className="banner-symbol"><Sparkles size={21}/></div>
              <div className="banner-text"><strong>{generated ? "Your demo growth report is ready" : "Start with your business, not a blank dashboard"}</strong><p>{generated ? `Showing a sample plan for ${businessName}. Connect live research to replace illustrative opportunities.` : "Tell GainForge what you do and what you want to achieve. We'll shape the workspace around your goal."}</p></div>
              <button className="banner-button" onClick={() => setShowSetup(true)}>{generated ? "Edit profile" : "Set up business"} <ArrowRight size={15}/></button>
            </div>

            <div className="section-heading"><div><h2>Growth snapshot</h2><p>A clear view of the work that could move you forward.</p></div><span className="period-label"><Activity size={14}/> Sample workspace</span></div>
            <div className="metrics-grid">
              <Metric icon={<Target size={18}/>} label="Open opportunities" value={String(opportunities.filter(o => o.status === "New" || o.status === "In progress").length)} change="Prioritise next steps" tone="blue"/>
              <Metric icon={<ListChecks size={18}/>} label="Actions in progress" value={String(opportunities.filter(o => o.status === "In progress").length)} change="Keep momentum" tone="violet"/>
              <Metric icon={<Users size={18}/>} label="Qualified leads" value="—" change="Connect a data source" tone="green"/>
              <Metric icon={<BarChart3 size={18}/>} label="Revenue attributed" value="—" change="No sales data connected" tone="amber"/>
            </div>

            <div className="two-column">
              <section className="panel opportunities-panel">
                <div className="panel-header"><div><h2>Recommended opportunities</h2><p>Ideas to review, not promises of results.</p></div><button className="text-button" onClick={() => setActiveNav("Opportunities")}>View all <ArrowRight size={14}/></button></div>
                <div className="opportunity-list">
                  {opportunities.filter(o => o.status !== "Dismissed").slice(0, 3).map((o, i) => <OpportunityRow key={o.id} opportunity={o} index={i} onClick={() => setSelected(o)}/>)}
                </div>
                <button className="panel-footer-button" onClick={() => setActiveNav("Opportunities")}>Explore all opportunities <ArrowRight size={15}/></button>
              </section>
              <section className="panel action-panel">
                <div className="panel-header"><div><h2>Next best actions</h2><p>Small steps that create momentum.</p></div><div className="sparkle-badge"><Sparkles size={15}/></div></div>
                <div className="action-item"><div className="action-check"><Check size={13}/></div><div><strong>Complete your business profile</strong><span>Help us tailor recommendations</span></div><button onClick={() => setShowSetup(true)} aria-label="Complete business profile"><ArrowRight size={16}/></button></div>
                <div className="action-item"><div className="action-check muted"><Globe2 size={13}/></div><div><strong>Audit your website</strong><span>Find what may be holding conversions back</span></div><Link href={auditorHref} aria-label="Run website audit" style={{ color: "#a1aca4", padding: 5, display: "flex" }}><ArrowRight size={16}/></Link></div>
                <div className="action-item"><div className="action-check muted"><Search size={13}/></div><div><strong>Validate one opportunity</strong><span>Confirm the need before investing time</span></div><button onClick={() => setSelected(opportunities[0])} aria-label="Validate opportunity"><ArrowRight size={16}/></button></div>
                <div className="action-item"><div className="action-check muted"><Mail size={13}/></div><div><strong>Prepare a helpful first touch</strong><span>Human review before sending</span></div><button onClick={() => setSelected(opportunities[0])} aria-label="Prepare outreach"><ArrowRight size={16}/></button></div>
                <div className="note-box"><Lightbulb size={16}/><p><strong>Growth principle</strong><br/>Prioritise evidence and customer conversations before spending on automation.</p></div>
              </section>
            </div>

            <section className="panel plan-panel">
              <div className="panel-header"><div><h2>Your growth focus</h2><p>{generated ? `A starting point for ${businessName}.` : "Choose a goal to shape your first recommendations."}</p></div><span className="status-chip"><span/> IN PROGRESS</span></div>
              <div className="focus-row"><div className="focus-icon"><Compass size={19}/></div><div className="focus-main"><strong>{goal}</strong><span>{website || "Add your website to personalise this plan"}</span></div><button className="outline-button" onClick={() => setShowSetup(true)}>Refine goal</button></div>
              <div className="progress-track"><div style={{width: generated ? "55%" : "22%"}}/></div><div className="progress-meta"><span>{generated ? "2 of 4 setup steps complete" : "1 of 4 setup steps complete"}</span><span>{generated ? "55%" : "22%"}</span></div>
            </section>
          </>}

          {activeNav === "Opportunities" && <section className="panel full-panel">
            <div className="panel-header"><div><h2>Opportunity pipeline</h2><p>Review each item, validate its evidence and choose a next action.</p></div><button className="outline-button" onClick={exportCsv}><Download size={15}/> Export CSV</button></div>
            <div className="table-toolbar"><div className="search-box"><Search size={16}/><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search opportunities..."/></div><div className="filter-box"><Filter size={15}/><select value={filter} onChange={e => setFilter(e.target.value)}><option>All</option><option>New</option><option>In progress</option><option>Won</option><option>Dismissed</option></select></div></div>
            <div className="opportunity-table">
              <div className="table-head"><span>OPPORTUNITY</span><span>TYPE</span><span>CONFIDENCE</span><span>STATUS</span><span></span></div>
              {visibleOpportunities.map(o => <button className="table-row" key={o.id} onClick={() => setSelected(o)}><span className="table-title"><span className="table-icon"><Target size={16}/></span><span><strong>{o.title}</strong><small>{o.company}</small></span></span><span className="type-cell">{o.category}</span><span><i className={`confidence-dot ${o.confidence.toLowerCase()}`}/>{o.confidence}</span><span><span className={`table-status ${o.status.toLowerCase().replace(" ", "-")}`}>{o.status}</span></span><ArrowRight size={16}/></button>)}
              {visibleOpportunities.length === 0 && <div className="empty-state">No opportunities match this filter.</div>}
            </div>
            <div className="demo-disclaimer"><Lightbulb size={16}/> All current opportunities are illustrative demo data. Real opportunity research is the next development milestone.</div>
          </section>}

          {activeNav === "Action centre" && <section className="panel full-panel"><div className="panel-header"><div><h2>Action centre</h2><p>Turn recommendations into trackable work.</p></div><span className="status-chip"><span/> HUMAN APPROVAL</span></div><div className="action-board">{opportunities.filter(o => o.status !== "Dismissed").map(o => <div className="board-card" key={o.id}><div className="board-card-top"><span className={`table-status ${o.status.toLowerCase().replace(" ", "-")}`}>{o.status}</span><span className="board-type">{o.category}</span></div><h3>{o.action}</h3><p>{o.reason}</p><button className="outline-button" onClick={() => setSelected(o)}>Review action <ArrowRight size={14}/></button></div>)}</div></section>}

          {activeNav === "Growth insights" && <section className="panel full-panel"><div className="panel-header"><div><h2>Growth insights</h2><p>We only show measured results when a source is connected.</p></div><span className="demo-pill"><span/> DEMO MODE</span></div><div className="insight-grid"><div className="insight-card"><div className="insight-icon green"><TrendingUp size={19}/></div><h3>Revenue attribution</h3><p>Connect sales or CRM data to see which opportunities turn into revenue.</p><span className="insight-state">Not connected</span></div><div className="insight-card"><div className="insight-icon blue"><Globe2 size={19}/></div><h3>Acquisition channels</h3><p>Compare qualified leads from your website, outreach and other sources.</p><span className="insight-state">Not connected</span></div><div className="insight-card"><div className="insight-icon violet"><Activity size={19}/></div><h3>Conversion journey</h3><p>Track progress from first signal to contact, qualified lead and won deal.</p><span className="insight-state">Prototype</span></div></div><div className="note-box wide-note"><Lightbulb size={17}/><p><strong>Trust over vanity metrics.</strong><br/>GainForge will distinguish measured evidence from AI estimates and illustrative examples. We won't label a lead as revenue until a connected source supports it.</p></div></section>}

          <footer className="page-footer"><span>© 2026 GainForge</span><span><span className="footer-dot"/> Prototype · Evidence first, actions second</span><button onClick={() => notify("Privacy, terms and account controls will be implemented before public launch.")}>Privacy & terms</button></footer>
        </div>
      </section>

      {showSetup && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowSetup(false); }}><div className="modal"><div className="modal-header"><div><div className="modal-kicker"><Sparkles size={14}/> BUSINESS PROFILE</div><h2>Let's understand your business.</h2><p>Start with the basics. This prototype saves details in this browser session only.</p></div><button className="icon-button" onClick={() => setShowSetup(false)} aria-label="Close"><X size={19}/></button></div><form onSubmit={e => { e.preventDefault(); setBusinessName(businessName.trim() || "Your business"); runDemo(); }}><label>Business or brand name<input value={businessName === "Your business" ? "" : businessName} onChange={e => setBusinessName(e.target.value)} placeholder="e.g. Acme Studio" /></label><label>Website URL<input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yourbusiness.com" required type="url"/></label><label>What's your main growth goal?<select value={goal} onChange={e => setGoal(e.target.value)}><option>Find more customers</option><option>Generate more qualified leads</option><option>Win more contracts</option><option>Convert more website visitors</option><option>Recover lost sales and enquiries</option><option>Understand competitors</option></select></label><div className="modal-note"><CircleHelp size={16}/><span>Live website analysis, external data sources and AI research are not connected in this prototype. No claim of real leads will be made.</span></div><button className="primary-button modal-submit" disabled={loading}>{loading ? <><span className="spinner"/> Building demo report…</> : <>Create my growth workspace <ArrowRight size={16}/></>}</button></form></div></div>}

      {selected && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setSelected(null); }}><div className="modal detail-modal"><div className="modal-header"><div><div className="modal-kicker"><Target size={14}/> OPPORTUNITY REVIEW</div><h2>{selected.title}</h2><p>{selected.company} · {selected.source}</p></div><button className="icon-button" onClick={() => setSelected(null)} aria-label="Close"><X size={19}/></button></div><div className="detail-tags"><span className={`table-status ${selected.status.toLowerCase().replace(" ", "-")}`}>{selected.status}</span><span className="type-cell">{selected.category}</span><span className="confidence-label"><i className={`confidence-dot ${selected.confidence.toLowerCase()}`}/>{selected.confidence} confidence</span></div><div className="detail-section"><h3>Why this may matter</h3><p>{selected.reason}</p></div><div className="detail-section"><h3>Suggested next step</h3><p>{selected.action}. Review the facts and adapt the action to your business before publishing or contacting anyone.</p></div><div className="modal-note"><Lightbulb size={16}/><span>Demo opportunity only. Validate the source and customer need before spending money or contacting a prospect.</span></div><div className="detail-actions"><button className="outline-button" onClick={() => { updateStatus(selected.id, "Dismissed"); setSelected(null); }}>Dismiss</button><button className="outline-button" onClick={() => updateStatus(selected.id, "In progress")}><ListChecks size={15}/> Mark in progress</button><button className="primary-button" onClick={() => { updateStatus(selected.id, "Won"); setSelected(null); }}><Check size={16}/> Mark as won</button></div></div></div>}

      {toast && <div className="toast"><Check size={16}/>{toast}<button onClick={() => setToast("")} aria-label="Dismiss"><X size={14}/></button></div>}
    </main>
  );
}

function Metric({ icon, label, value, change, tone }: { icon: React.ReactNode; label: string; value: string; change: string; tone: string }) {
  return <div className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong><span className="metric-change">{change}</span></div>;
}

function OpportunityRow({ opportunity, index, onClick }: { opportunity: Opportunity; index: number; onClick: () => void }) {
  return <button className="opportunity-row" onClick={onClick}><div className={`opportunity-number n${index + 1}`}>{String(index + 1).padStart(2, "0")}</div><div className="opportunity-info"><strong>{opportunity.title}</strong><span>{opportunity.category} <span className="middot">·</span> {opportunity.company}</span></div><div className="opportunity-right"><span className={`confidence-badge ${opportunity.confidence.toLowerCase()}`}>{opportunity.confidence}</span><ArrowUpRight size={16}/></div></button>;
}
