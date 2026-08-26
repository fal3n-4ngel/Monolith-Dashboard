"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Minus,
  Plus,
  Database,
  Server,
  Cpu,
  Globe,
} from "lucide-react";
import { MonolithLogo } from "@/components/MonolithLogo";

const GITHUB_ISSUE_URL = "https://github.com/fal3n-4ngel/monolith-dashboard/issues/new/choose";

const NAV_LINKS = [
  { href: "#overview", label: "Overview" },
  { href: "#apps", label: "Integrations" },
  { href: "#problems", label: "Problems" },
  { href: "/docs", label: "Docs" },
];

const TICKER_ITEMS = [
  "FAIL-CLOSED VALIDATION",
  "PERMANENT BIGQUERY RETENTION",
  "MULTI-USER MCP ACCESS",
  "NON-BLOCKING POSTBACKS",
  "ZERO SECRET OIDC AUTH",
];

const INTEGRATION_BADGES = [
  { name: "continuum-home", role: "Client App" },
  { name: "Chayakudikanpooyalo", role: "Client App" },
  { name: "monolith-api", role: "Ingestion Engine" },
  { name: "monolith-dashboard", role: "Docs & MCP Host" },
  { name: "BigQuery", role: "Data Warehouse" },
];

const PROBLEM_CARDS = [
  {
    tag: "01",
    label: "Siloed",
    title: "Each app kept its own history, on its own",
    body: "continuum-home and Chayakudikanpooyalo each logged what happened inside them, but nowhere in the same place — auditing either meant digging through a different app every time.",
    icon: (
      <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.2">
        <rect x="14" y="10" width="36" height="18" />
        <rect x="14" y="36" width="36" height="18" />
        <line x1="32" y1="28" x2="32" y2="36" strokeDasharray="2 3" />
      </svg>
    ),
  },
  {
    tag: "02",
    label: "Unaudited",
    title: "No record of what changed, or when",
    body: "Without a shared event log, answering \"what happened to this record and who touched it\" meant reconstructing history from application state after the fact.",
    icon: (
      <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.2">
        <rect x="18" y="18" width="28" height="28" />
        <circle cx="32" cy="10" r="4" />
        <line x1="32" y1="14" x2="32" y2="18" />
      </svg>
    ),
  },
  {
    tag: "03",
    label: "Scattered",
    title: "Data lived in as many places as apps",
    body: "Every app had its own database, so there was never one place to point a query and get an answer across the whole ecosystem.",
    icon: (
      <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.2">
        <circle cx="32" cy="32" r="18" />
        <polygon points="32,20 42,32 32,44 22,32" />
      </svg>
    ),
  },
  {
    tag: "04",
    label: "Slow",
    title: "Cross-app reports meant manual joins",
    body: "Pulling one report across multiple apps meant exporting from each database separately and joining them by hand, every single time.",
    icon: (
      <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.2">
        <polygon points="32,10 54,24 54,40 32,54 10,40 10,24" />
        <polygon points="32,20 46,28 46,36 32,44 18,36 18,28" />
      </svg>
    ),
  },
];

const USE_CASES = [
  {
    title: "Event Audits, Per App",
    body: "Every domain event from continuum-home and Chayakudikanpooyalo is recorded the moment it happens — a full, permanent audit trail per app, no reconstruction required.",
  },
  {
    title: "One Data Place",
    body: "Every app writes into the same permanent BigQuery warehouse instead of its own siloed database, so there's exactly one place to look, not one per app.",
  },
  {
    title: "Query for Reports",
    body: "Run SQL straight against events.all_events for cross-app reports, or ask an MCP-connected AI agent the same question in plain English inside the IDE.",
  },
  {
    title: "Adding the Next App",
    body: "New apps join the same pipeline through one integration ticket — a registered sourceApp, an allowlisted event type, and a provisioned BigQuery table.",
  },
];

function BlueprintObelisk({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 420 520" className={className} fill="none">
      <defs>
        <pattern id="hatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--border-subtle)" strokeWidth="1" />
        </pattern>
      </defs>

      {/* dimension line — height */}
      <line x1="60" y1="40" x2="60" y2="460" stroke="var(--text-secondary)" strokeWidth="1" strokeDasharray="3 4" opacity="0.5" />
      <line x1="52" y1="40" x2="68" y2="40" stroke="var(--text-secondary)" strokeWidth="1" opacity="0.5" />
      <line x1="52" y1="460" x2="68" y2="460" stroke="var(--text-secondary)" strokeWidth="1" opacity="0.5" />
      <text x="38" y="252" fontFamily="var(--font-mono)" fontSize="10" fill="var(--text-secondary)" opacity="0.7" transform="rotate(-90 38 252)">
        ∞ RETENTION
      </text>

      {/* left facet */}
      <polygon points="150,60 110,110 110,430 150,460" fill="var(--bg-card)" stroke="var(--text-primary)" strokeWidth="1.5" />
      {/* right facet */}
      <polygon points="150,60 190,110 190,430 150,460" fill="url(#hatch)" stroke="var(--text-primary)" strokeWidth="1.5" />
      {/* top apex */}
      <polygon points="150,60 110,110 150,124 190,110" fill="var(--bg-card)" stroke="var(--text-primary)" strokeWidth="1.5" />

      {/* center seam */}
      <line x1="150" y1="60" x2="150" y2="460" stroke="var(--accent)" strokeWidth="2.5" />
      <circle cx="150" cy="60" r="3.5" fill="var(--accent)" />

      {/* ground line */}
      <line x1="70" y1="460" x2="230" y2="460" stroke="var(--text-primary)" strokeWidth="1.5" />

      {/* annotation markers */}
      <rect x="118" y="220" width="7" height="7" fill="var(--accent)" />
      <rect x="176" y="330" width="7" height="7" fill="var(--accent)" />
      <line x1="125" y1="223" x2="260" y2="223" stroke="var(--text-secondary)" strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />
      <text x="264" y="226" fontFamily="var(--font-mono)" fontSize="10" fill="var(--text-secondary)">EVENT_STREAM</text>

      <line x1="183" y1="333" x2="290" y2="333" stroke="var(--text-secondary)" strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />
      <text x="294" y="336" fontFamily="var(--font-mono)" fontSize="10" fill="var(--text-secondary)">MCP_TOOLS</text>

      {/* flanking server racks */}
      {[[300, 340], [46, 380]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`} stroke="var(--text-secondary)" strokeWidth="1" opacity="0.55">
          {[0, 10, 20, 30].map((dy) => (
            <rect key={dy} x="0" y={dy} width="34" height="8" />
          ))}
        </g>
      ))}
    </svg>
  );
}

function TechButton({
  href,
  target,
  children,
  variant = "default",
}: {
  href: string;
  target?: string;
  children: React.ReactNode;
  variant?: "default" | "solid";
}) {
  const base =
    "inline-flex items-stretch text-xs font-mono font-semibold uppercase tracking-wider transition-colors";
  const solid = "bg-[var(--text-primary)] text-[var(--bg-primary)] hover:bg-[var(--accent)]";
  const outline = "border border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)]";
  return (
    <a
      href={href}
      target={target}
      rel={target ? "noopener noreferrer" : undefined}
      className={`${base} ${variant === "solid" ? solid : outline} group`}
    >
      <span className="px-5 py-3 flex items-center">{children}</span>
      <span className={`flex items-center px-3.5 border-l ${variant === "solid" ? "border-[var(--bg-primary)]/25" : "border-[var(--border-strong)] group-hover:border-[var(--bg-primary)]/40"} border-dashed`}>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </span>
    </a>
  );
}

export function LandingPage() {
  const [openCase, setOpenCase] = useState(0);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] font-sans text-[var(--text-primary)] selection:bg-[var(--text-primary)] selection:text-[var(--bg-primary)] antialiased">
      <div className="h-1 w-full bg-[var(--text-primary)]" />

      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-50 border-b border-[var(--border-strong)] bg-[var(--bg-primary)]/95 backdrop-blur-md">
        <div className="max-w-[1320px] mx-auto px-6 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MonolithLogo size={26} />
            <span className="font-display font-black text-xl tracking-wide uppercase">Monolith</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-[11px] font-mono font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-[var(--text-primary)] transition-colors">
                {link.label}
              </a>
            ))}
          </nav>

          <a
            href={GITHUB_ISSUE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-widest text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            <span>Open a Integration Ticket</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* ─── HERO CANVAS ─── */}
      <section id="overview" className="max-w-[1320px] mx-auto px-6 sm:px-8">
        <div className="relative crosshair border border-[var(--border-subtle)] mt-0">
          <div className="absolute -top-[7px] -right-[6px] font-mono text-sm text-[var(--text-secondary)]/60 select-none">+</div>
          <div className="absolute -bottom-[7px] -left-[6px] font-mono text-sm text-[var(--text-secondary)]/60 select-none">+</div>
          <div className="absolute -bottom-[7px] -right-[6px] font-mono text-sm text-[var(--text-secondary)]/60 select-none">+</div>
          <div className="ruler-x ruler-y dot-grid flex items-center justify-center py-16 sm:py-24 px-6">
            <BlueprintObelisk className="w-full max-w-[420px] h-auto" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8 lg:gap-16 border-b border-[var(--border-subtle)] pb-10 pt-8 sm:pt-10">
          <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-[64px] leading-[0.95] tracking-tight uppercase">
            An audit engine for every app you ship
          </h1>
          <div className="space-y-5 lg:pt-2">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Monolith audits every event from every app you run — continuum-home, Chayakudikanpooyalo, and
              whatever&apos;s next — into one permanent BigQuery warehouse, so there&apos;s a single place to
              query for reports instead of one database per app.
            </p>
            <a href="#apps" className="inline-flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-widest text-[var(--accent)] hover:opacity-70 transition-opacity">
              <span>Discover More</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* marquee ticker */}
        <div className="overflow-hidden border-b border-[var(--border-subtle)] py-3">
          <div className="flex w-max animate-marquee gap-10 text-[11px] font-mono font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} className="flex items-center gap-2 shrink-0">
                <span className="w-1.5 h-1.5 bg-[var(--accent)] rotate-45 shrink-0" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── INTEGRATION STRIP ─── */}
      <section id="apps" className="max-w-[1320px] mx-auto px-6 sm:px-8 border-b border-[var(--border-subtle)] py-6">
        <p className="text-[11px] font-mono text-[var(--text-secondary)] uppercase tracking-widest mb-5">
          Works natively across the stack, including Next.js, Spring Boot, BigQuery, and MCP.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 border border-[var(--border-subtle)] divide-x divide-[var(--border-subtle)]">
          {INTEGRATION_BADGES.map((badge) => (
            <div key={badge.name} className="p-4 sm:p-5 space-y-1">
              <div className="font-mono text-xs sm:text-sm font-bold truncate">{badge.name}</div>
              <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide">{badge.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PROBLEMS ─── */}
      <section id="problems" className="max-w-[1320px] mx-auto px-6 sm:px-8 border-b border-[var(--border-subtle)] py-14 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 lg:gap-16 mb-12">
          <div className="space-y-4">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[var(--text-secondary)]">Problems</span>
            <h2 className="font-display font-black text-3xl sm:text-5xl leading-[0.95] uppercase tracking-tight">
              Before Monolith, every app was its own island
            </h2>
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed lg:pt-8">
            continuum-home and Chayakudikanpooyalo each ran fine on their own, but nothing tied them
            together — no shared audit trail, no shared storage, no way to ask one question across both.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[var(--border-subtle)] divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-subtle)]">
          {PROBLEM_CARDS.map((card) => (
            <div key={card.tag} className="p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-widest">
                <span>{card.label}</span>
                <span className="text-[var(--text-secondary)]">[{card.tag}]</span>
              </div>
              <div className="text-[var(--text-secondary)]">{card.icon}</div>
              <div className="border-t border-dashed border-[var(--border-subtle)] pt-4 space-y-2">
                <h3 className="font-display font-bold text-lg leading-tight uppercase tracking-tight">{card.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{card.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SOLUTION SPLIT ─── */}
      <section id="validation" className="max-w-[1320px] mx-auto px-6 sm:px-8 border-b border-[var(--border-subtle)] py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="border border-[var(--border-subtle)] p-8 flex items-center justify-center bg-[var(--bg-card)]">
          <svg viewBox="0 0 320 280" className="w-full max-w-[320px] h-auto" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="20" y="200" width="60" height="60" />
            <rect x="130" y="150" width="60" height="110" />
            <rect x="240" y="90" width="60" height="170" />
            <line x1="50" y1="200" x2="160" y2="150" strokeDasharray="3 4" opacity="0.6" />
            <line x1="160" y1="150" x2="270" y2="90" strokeDasharray="3 4" opacity="0.6" />
            <circle cx="50" cy="200" r="4" fill="var(--accent)" stroke="none" />
            <circle cx="160" cy="150" r="4" fill="var(--accent)" stroke="none" />
            <circle cx="270" cy="90" r="4" fill="var(--accent)" stroke="none" />
          </svg>
        </div>
        <div className="space-y-6">
          <p className="font-display font-black text-3xl sm:text-4xl leading-[1.05] uppercase tracking-tight">
            One audit trail per app, one warehouse for all of them, one place to run the query — that&apos;s
            the whole job. Monolith handles the ingestion and validation so{" "}
            <span className="text-[var(--text-secondary)]">the report is always one query away.</span>
          </p>
          <TechButton href="/docs">Explore the docs</TechButton>
        </div>
      </section>

      {/* ─── USE CASES ─── */}
      <section className="max-w-[1320px] mx-auto px-6 sm:px-8 border-b border-[var(--border-subtle)] py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div className="border border-[var(--border-subtle)] p-8 flex items-center justify-center bg-[var(--bg-card)] lg:sticky lg:top-24">
          <BlueprintObelisk className="w-full max-w-[300px] h-auto" />
        </div>
        <div>
          <div className="space-y-3 mb-8">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[var(--text-secondary)]">Use Cases</span>
            <h2 className="font-display font-black text-3xl sm:text-5xl leading-[0.95] uppercase tracking-tight">
              What Monolith is actually for
            </h2>
          </div>

          <div className="border-t border-dashed border-[var(--border-subtle)]">
            {USE_CASES.map((useCase, i) => {
              const isOpen = openCase === i;
              return (
                <div key={useCase.title} className="border-b border-dashed border-[var(--border-subtle)]">
                  <button
                    onClick={() => setOpenCase(isOpen ? -1 : i)}
                    className="w-full flex items-center justify-between py-4 text-left"
                  >
                    <span className="font-display font-bold text-xl sm:text-2xl uppercase tracking-tight">
                      {useCase.title}
                    </span>
                    {isOpen ? (
                      <Minus className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                    ) : (
                      <Plus className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <p className="pb-4 text-xs text-[var(--text-secondary)] leading-relaxed max-w-[440px] animate-fadeIn">
                      {useCase.body}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── DOCUMENTATION TEASER ─── */}
      <section id="docs" className="max-w-[1320px] mx-auto px-6 sm:px-8 py-14 sm:py-20 border-b border-[var(--border-subtle)]">
        <div className="border border-[var(--border-subtle)] p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center bg-[var(--bg-card)]">
          <div className="space-y-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[var(--text-secondary)]">Documentation</span>
            <h2 className="font-display font-black text-3xl sm:text-5xl leading-[0.95] uppercase tracking-tight">
              Full specification &amp; API reference
            </h2>
            <p className="text-sm text-[var(--text-secondary)] max-w-[560px]">
              MCP integration, adding a new application, postback payload contracts, authentication, and the
              BigQuery schema powering everything above — laid out as a dedicated reference with paged
              navigation.
            </p>
          </div>
          <TechButton href="/docs" variant="solid">Open Documentation</TechButton>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-[var(--border-strong)] py-10 px-6 sm:px-8">
        <div className="max-w-[1320px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <MonolithLogo size={20} />
            <span className="font-display font-black text-sm uppercase tracking-wide">Monolith</span>
            <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest ml-2">
              Central Audit Telemetry Engine
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[11px] font-mono font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
            <a href="#overview" className="hover:text-[var(--text-primary)] transition-colors">Overview</a>
            <a href="/docs" className="hover:text-[var(--text-primary)] transition-colors">Docs</a>
            <a href="/terms" className="hover:text-[var(--text-primary)] transition-colors">Terms</a>
            <a href="/privacy" className="hover:text-[var(--text-primary)] transition-colors">Privacy</a>
            <a
              href={GITHUB_ISSUE_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-[var(--accent)] hover:opacity-70 transition-opacity"
            >
              Report an Issue <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
