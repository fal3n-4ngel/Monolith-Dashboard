"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Database,
  Ticket,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  Key,
  Lock,
  Send,
  Terminal,
  Cpu,
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  Menu,
  X,
} from "lucide-react";

const MONOLITH_ENDPOINT = "https://monolith-postbacks.adithyakrishnan.com/api/v1/events/postback";
const MCP_ENDPOINT = "https://monolith.adithyakrishnan.com/api/mcp";
const GITHUB_ISSUE_URL = "https://github.com/fal3n-4ngel/monolith-dashboard/issues/new/choose";
const GITHUB_APP_INTEGRATION_ISSUE_URL = "https://github.com/fal3n-4ngel/monolith-dashboard/issues/new?template=app_integration_request.yml";

type Subsection = { id: string; title: string };
type DocSection = {
  id: string;
  number: string;
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  summary: string;
  subsections: Subsection[];
};

const SECTIONS: DocSection[] = [
  {
    id: "adding-an-app",
    number: "01",
    icon: Ticket,
    eyebrow: "Onboarding Guide",
    title: "How to Add a New App",
    summary:
      "The three-step path from an integration ticket to a shipped postback dispatcher.",
    subsections: [
      { id: "integration-ticket", title: "Submit an integration ticket" },
      { id: "server-provisioning", title: "Enum & table provisioning" },
      { id: "postback-dispatcher", title: "Implement the dispatcher" },
    ],
  },
  {
    id: "postback-spec",
    number: "02",
    icon: Send,
    eyebrow: "Telemetry Ingestion",
    title: "Postback & Payload Spec",
    summary:
      "Field-level contract for every event Monolith accepts, and what happens when it doesn't validate.",
    subsections: [
      { id: "payload-fields", title: "Required & recommended fields" },
      { id: "sample-payload", title: "Sample payload" },
    ],
  },
  {
    id: "auth-setup",
    number: "03",
    icon: Key,
    eyebrow: "Authentication & Security",
    title: "API Keys & Auth Setup",
    summary:
      "A zero-trust, fails-closed model with three authentication paths depending on where your app runs.",
    subsections: [
      { id: "auth-overview", title: "Overview" },
      { id: "auth-methods", title: "Three authentication paths" },
      { id: "mcp-user-config", title: "Multi-user MCP configuration" },
    ],
  },
  {
    id: "mcp-server",
    number: "04",
    icon: Cpu,
    eyebrow: "AI Agent Protocol",
    title: "MCP Server & AI Tools",
    summary:
      "How AI coding agents connect to Monolith's telemetry graph over the Model Context Protocol.",
    subsections: [
      { id: "mcp-overview", title: "Overview" },
      { id: "mcp-configuration", title: "Client configuration" },
      { id: "mcp-tools", title: "Registered tool dictionary" },
    ],
  },
  {
    id: "bigquery-architecture",
    number: "05",
    icon: Database,
    eyebrow: "Data Warehouse Architecture",
    title: "BigQuery Architecture",
    summary:
      "Dataset bindings, partitioning strategy, and the analytics views every app's events land in.",
    subsections: [
      { id: "dataset-overview", title: "Dataset & retention" },
      { id: "schema-details", title: "Clustering & views" },
      { id: "sample-query", title: "Sample query" },
    ],
  },
];

const ALL_ANCHORS = SECTIONS.flatMap((s) => s.subsections.map((sub) => sub.id));

function CopyButton({
  text,
  id,
  label,
  copiedId,
  onCopy,
}: {
  text: string;
  id: string;
  label: string;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
}) {
  const copied = copiedId === id;
  return (
    <button
      onClick={() => onCopy(text, id)}
      className="flex items-center gap-1.5 px-3 py-1 bg-[var(--bg-primary)] hover:bg-[var(--border-subtle)] border border-[var(--border-subtle)] text-xs font-semibold transition-colors shrink-0"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
      <span>{copied ? "Copied!" : label}</span>
    </button>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--bg-primary)] text-[11px] font-bold text-[var(--text-secondary)] border border-[var(--border-subtle)] uppercase tracking-wider">
      <span>{children}</span>
    </div>
  );
}

function SubHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h4
      id={id}
      data-doc-anchor
      className="scroll-mt-32 text-sm font-bold text-[var(--text-primary)] flex items-center gap-2"
    >
      {children}
    </h4>
  );
}

export function MonolithDocs() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [codeLanguage, setCodeLanguage] = useState<"typescript" | "curl" | "python">("typescript");
  const [activeAnchor, setActiveAnchor] = useState<string>(ALL_ANCHORS[0]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveAnchor(visible[0].target.id);
        }
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 }
    );

    const nodes = containerRef.current?.querySelectorAll("[data-doc-anchor]");
    nodes?.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const activeSectionId = useMemo(() => {
    const parent = SECTIONS.find((s) => s.subsections.some((sub) => sub.id === activeAnchor));
    return parent?.id ?? SECTIONS[0].id;
  }, [activeAnchor]);

  const activeSectionIndex = SECTIONS.findIndex((s) => s.id === activeSectionId);

  const scrollToAnchor = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileNavOpen(false);
  };

  return (
    <div ref={containerRef} className="w-full font-sans text-[var(--text-primary)]">
      {/* ─── MOBILE TOC TOGGLE ─── */}
      <div className="lg:hidden mb-4 sticky top-16 z-30">
        <button
          onClick={() => setMobileNavOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs font-bold"
        >
          <span className="flex items-center gap-2">
            {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span>On this page</span>
          </span>
          <span className="text-[var(--text-secondary)] font-mono">
            {String(activeSectionIndex + 1).padStart(2, "0")} / {String(SECTIONS.length).padStart(2, "0")}
          </span>
        </button>
        {mobileNavOpen && (
          <nav className="mt-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] p-3 space-y-3 max-h-[70vh] overflow-y-auto">
            {SECTIONS.map((section) => (
              <div key={section.id}>
                <button
                  onClick={() => scrollToAnchor(section.subsections[0].id)}
                  className={`w-full text-left text-xs font-bold mb-1 ${
                    activeSectionId === section.id ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                  }`}
                >
                  {section.number} · {section.title}
                </button>
                <div className="space-y-1 pl-3 border-l border-[var(--border-subtle)]">
                  {section.subsections.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => scrollToAnchor(sub.id)}
                      className={`block w-full text-left text-[11px] py-0.5 ${
                        activeAnchor === sub.id ? "text-[var(--text-primary)] font-semibold" : "text-[var(--text-secondary)]"
                      }`}
                    >
                      {sub.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[248px_1fr] gap-10 items-start">
        {/* ─── DESKTOP SIDEBAR / TABLE OF CONTENTS ─── */}
        <aside className="hidden lg:block sticky top-24 self-start">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-3 px-1">
            Documentation
          </div>
          <nav className="space-y-5 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 scrollbar-none">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const sectionActive = activeSectionId === section.id;
              return (
                <div key={section.id}>
                  <button
                    onClick={() => scrollToAnchor(section.subsections[0].id)}
                    className={`w-full flex items-center gap-2 text-left text-xs font-bold mb-1.5 transition-colors ${
                      sectionActive ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 flex items-center justify-center shrink-0 border ${
                        sectionActive
                          ? "bg-[var(--text-primary)] border-[var(--text-primary)] text-[var(--bg-primary)]"
                          : "bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--text-secondary)]"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                    </span>
                    <span>{section.title}</span>
                  </button>
                  <div className="space-y-0.5 pl-[26px] border-l border-[var(--border-subtle)] ml-2.5">
                    {section.subsections.map((sub) => {
                      const subActive = activeAnchor === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => scrollToAnchor(sub.id)}
                          className={`relative block w-full text-left text-[11.5px] leading-snug py-1 pl-3 -ml-px transition-colors ${
                            subActive
                              ? "text-[var(--text-primary)] font-semibold border-l-2 border-[var(--text-primary)]"
                              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-l-2 border-transparent"
                          }`}
                        >
                          {sub.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* ─── DOCS CONTENT ─── */}
        <div className="min-w-0 space-y-20">
          {/* SECTION 1 — HOW TO ADD A NEW APP */}
          <DocSectionShell
            section={SECTIONS[0]}
            headerAction={
              <a
                href={GITHUB_ISSUE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-bold hover:bg-[var(--accent)] transition-colors shrink-0"
              >
                <span>Open an Integration Ticket</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            }
          >
            <div className="space-y-3">
              <SubHeading id="integration-ticket">Step 1 · Submit an integration ticket</SubHeading>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Open a{" "}
                <a
                  href={GITHUB_APP_INTEGRATION_ISSUE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[var(--text-primary)] underline decoration-[var(--border-subtle)] underline-offset-2 hover:decoration-[var(--text-primary)]"
                >
                  GitHub Issue
                </a>{" "}
                on the repo — it auto-populates as a ticket on the project board, no separate account or
                board access needed — specifying your <code className="font-mono text-[var(--text-primary)]">sourceApp</code> identifier
                (e.g. <code className="font-mono text-[var(--text-primary)]">&quot;my-task-app&quot;</code>), target domain
                group, and allowlisted <code className="font-mono text-[var(--text-primary)]">DomainEventType</code> names.
              </p>
            </div>

            <div className="space-y-3">
              <SubHeading id="server-provisioning">Step 2 · Enum &amp; table provisioning</SubHeading>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                The Monolith maintainer registers <code className="font-mono text-[var(--text-primary)]">SourceApp.java</code>{" "}
                and <code className="font-mono text-[var(--text-primary)]">DomainEventType.java</code> enums, and
                provisions BigQuery destination tables (<code className="font-mono text-[var(--text-primary)]">my_task_app_tasks</code>)
                with <b className="text-[var(--text-primary)]">permanent retention</b> and daily partitioning.
              </p>
            </div>

            <div className="space-y-3">
              <SubHeading id="postback-dispatcher">Step 3 · Implement the postback dispatcher</SubHeading>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Add non-blocking event dispatching in your application using your preferred
                programming language:
              </p>

              <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
                {(["typescript", "python", "curl"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setCodeLanguage(lang)}
                    className={`px-3 py-1 text-xs font-semibold transition-colors ${
                      codeLanguage === lang
                        ? "bg-[var(--text-primary)] text-[var(--bg-primary)]"
                        : "bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {lang === "typescript" ? "TypeScript / Next.js" : lang === "python" ? "Python" : "cURL"}
                  </button>
                ))}
              </div>

              {codeLanguage === "typescript" && (
                <pre className="p-5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] font-mono text-xs text-[var(--text-primary)] overflow-x-auto leading-relaxed">
{`import { after } from "next/server";

export function recordDomainEvent(event: {
  eventType: string;
  userId: string;
  userEmail: string;
  entityId?: string;
  payload?: Record<string, any>;
}) {
  after(async () => {
    await fetch("${MONOLITH_ENDPOINT}", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": \`Bearer \${process.env.MONOLITH_API_KEY}\`,
      },
      body: JSON.stringify({
        sourceApp: "my-task-app",
        eventId: crypto.randomUUID(),
        eventType: event.eventType,
        userId: event.userId,
        entityId: event.entityId,
        itemCount: 1,
        timestamp: Date.now(),
        payload: {
          ...event.payload,
          userEmail: event.userEmail,
          environment: process.env.NODE_ENV || "production",
        },
      }),
    });
  });
}`}
                </pre>
              )}

              {codeLanguage === "python" && (
                <pre className="p-5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] font-mono text-xs text-[var(--text-primary)] overflow-x-auto leading-relaxed">
{`import requests
import uuid
import time
import os

def send_domain_event(event_type: str, user_id: str, user_email: str, payload: dict):
    url = "${MONOLITH_ENDPOINT}"
    headers = {
        "Authorization": f"Bearer {os.environ['MONOLITH_API_KEY']}",
        "Content-Type": "application/json"
    }
    body = {
        "sourceApp": "my-python-app",
        "eventId": str(uuid.uuid4()),
        "eventType": event_type,
        "userId": user_id,
        "timestamp": int(time.time() * 1000),
        "payload": {
            **payload,
            "userEmail": user_email,
            "environment": "production"
        }
    }
    requests.post(url, json=body, timeout=3.0)`}
                </pre>
              )}

              {codeLanguage === "curl" && (
                <pre className="p-5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] font-mono text-xs text-[var(--text-primary)] overflow-x-auto leading-relaxed">
{`curl -X POST ${MONOLITH_ENDPOINT} \\
  -H "Authorization: Bearer YOUR_MONOLITH_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sourceApp": "continuum-home",
    "eventId": "a7826cd3-fbe0-4503-ae48-200e598ed031",
    "eventType": "EXPENSE_CREATED",
    "userId": "imm9N7AL1Nf0QQR7u6WfpXqdp5D3",
    "itemCount": 1,
    "timestamp": 1787726400000,
    "payload": {
      "amount": 4200.0,
      "category": "Rent",
      "userEmail": "adiadithyakrishnan@gmail.com",
      "environment": "production"
    }
  }'`}
                </pre>
              )}
            </div>
          </DocSectionShell>

          {/* SECTION 2 — POSTBACK & PAYLOAD SPEC */}
          <DocSectionShell
            section={SECTIONS[1]}
            headerAction={
              <span className="text-xs font-mono font-bold bg-[var(--bg-primary)] px-3 py-1.5 border border-[var(--border-subtle)] text-[var(--text-primary)] shrink-0">
                POST {MONOLITH_ENDPOINT}
              </span>
            }
          >
            <div className="space-y-3">
              <SubHeading id="payload-fields">Required &amp; recommended fields</SubHeading>
              <div className="overflow-x-auto border border-[var(--border-subtle)]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] text-[var(--text-primary)] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Field Name</th>
                      <th className="p-3.5">Data Type</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Description &amp; Standard</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-secondary)]">
                    <tr className="bg-[var(--bg-card)] hover:bg-[var(--bg-primary)]/50">
                      <td className="p-3.5 font-mono font-bold text-[var(--text-primary)]">sourceApp</td>
                      <td className="p-3.5 font-mono text-amber-700">STRING</td>
                      <td className="p-3.5 font-bold text-red-600">REQUIRED</td>
                      <td className="p-3.5">Application identifier (e.g. <code className="font-mono text-[var(--text-primary)]">continuum-home</code>). Must match registered <code className="font-mono text-[var(--text-primary)]">SourceApp.java</code> enum.</td>
                    </tr>
                    <tr className="bg-[var(--bg-card)] hover:bg-[var(--bg-primary)]/50">
                      <td className="p-3.5 font-mono font-bold text-[var(--text-primary)]">eventType</td>
                      <td className="p-3.5 font-mono text-amber-700">STRING</td>
                      <td className="p-3.5 font-bold text-red-600">REQUIRED</td>
                      <td className="p-3.5">Allowlisted event enum (e.g. <code className="font-mono text-[var(--text-primary)]">EXPENSE_CREATED</code>, <code className="font-mono text-[var(--text-primary)]">SALARY_UPDATED</code>). Resolves BigQuery target table.</td>
                    </tr>
                    <tr className="bg-[var(--bg-card)] hover:bg-[var(--bg-primary)]/50">
                      <td className="p-3.5 font-mono font-bold text-[var(--text-primary)]">userId</td>
                      <td className="p-3.5 font-mono text-amber-700">STRING</td>
                      <td className="p-3.5 font-bold text-red-600">REQUIRED</td>
                      <td className="p-3.5">User UID in source system. Used for BigQuery clustering and analytics indexing.</td>
                    </tr>
                    <tr className="bg-[var(--bg-card)] hover:bg-[var(--bg-primary)]/50">
                      <td className="p-3.5 font-mono font-bold text-[var(--text-primary)]">payload.userEmail</td>
                      <td className="p-3.5 font-mono text-amber-700">STRING</td>
                      <td className="p-3.5 font-bold text-red-600">REQUIRED</td>
                      <td className="p-3.5">The user&apos;s primary email. Direct payload field for multi-app user identity cross-referencing without joins.</td>
                    </tr>
                    <tr className="bg-[var(--bg-card)] hover:bg-[var(--bg-primary)]/50">
                      <td className="p-3.5 font-mono font-bold text-[var(--text-primary)]">eventId</td>
                      <td className="p-3.5 font-mono text-blue-600">STRING</td>
                      <td className="p-3.5 font-semibold text-[var(--text-primary)]">RECOMMENDED</td>
                      <td className="p-3.5">UUID event insertId. Used as BigQuery <code className="font-mono text-[var(--text-primary)]">insertId</code> for automatic retry deduplication.</td>
                    </tr>
                    <tr className="bg-[var(--bg-card)] hover:bg-[var(--bg-primary)]/50">
                      <td className="p-3.5 font-mono font-bold text-[var(--text-primary)]">itemCount</td>
                      <td className="p-3.5 font-mono text-purple-600">INT64</td>
                      <td className="p-3.5 font-semibold text-[var(--text-secondary)]">OPTIONAL</td>
                      <td className="p-3.5 font-sans">Affected row count (default 1). Set &gt;1 for CSV batch imports or bulk sync operations.</td>
                    </tr>
                    <tr className="bg-[var(--bg-card)] hover:bg-[var(--bg-primary)]/50">
                      <td className="p-3.5 font-mono font-bold text-[var(--text-primary)]">payload.environment</td>
                      <td className="p-3.5 font-mono text-blue-600">STRING</td>
                      <td className="p-3.5 font-semibold text-[var(--text-primary)]">RECOMMENDED</td>
                      <td className="p-3.5 font-sans">Environment tag (<code className="font-mono text-[var(--text-primary)]">production</code>, <code className="font-mono text-[var(--text-primary)]">uat</code>, <code className="font-mono text-[var(--text-primary)]">test</code>). Views filter non-production rows automatically.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <SubHeading id="sample-payload">Sample standard postback payload</SubHeading>
                <CopyButton
                  id="json_payload"
                  label="Copy Payload"
                  copiedId={copiedCode}
                  onCopy={copyToClipboard}
                  text={`{\n  "sourceApp": "continuum-home",\n  "eventId": "a7826cd3-fbe0-4503-ae48-200e598ed031",\n  "eventType": "EXPENSE_CREATED",\n  "userId": "imm9N7AL1Nf0QQR7u6WfpXqdp5D3",\n  "itemCount": 1,\n  "timestamp": 1787726400000,\n  "payload": {\n    "amount": 4200.0,\n    "category": "Rent",\n    "userEmail": "adiadithyakrishnan@gmail.com",\n    "environment": "production"\n  }\n}`}
                />
              </div>
              <pre className="p-5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] font-mono text-xs text-[var(--text-primary)] overflow-x-auto leading-relaxed">
{`{
  "sourceApp": "continuum-home",
  "eventId": "a7826cd3-fbe0-4503-ae48-200e598ed031",
  "eventType": "EXPENSE_CREATED",
  "userId": "imm9N7AL1Nf0QQR7u6WfpXqdp5D3",
  "itemCount": 1,
  "timestamp": 1787726400000,
  "payload": {
    "amount": 4200.0,
    "category": "Rent",
    "userEmail": "adiadithyakrishnan@gmail.com",
    "environment": "production"
  }
}`}
              </pre>
            </div>
          </DocSectionShell>

          {/* SECTION 3 — API KEYS & AUTH SETUP */}
          <DocSectionShell
            section={SECTIONS[2]}
            headerAction={
              <span className="text-xs font-mono font-bold bg-[var(--bg-primary)] px-3 py-1.5 border border-[var(--border-subtle)] text-emerald-700 shrink-0">
                Fails-Closed HTTP 401 Enforcement
              </span>
            }
          >
            <div className="space-y-3">
              <SubHeading id="auth-overview">Overview</SubHeading>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Monolith enforces a zero-trust, fails-closed authentication model. Incoming
                postbacks and MCP tool calls are verified before processing, preventing
                unauthorized data writes or reads.
              </p>
            </div>

            <div className="space-y-3">
              <SubHeading id="auth-methods">Three authentication paths</SubHeading>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
                <div className="p-6 bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-3">
                  <div className="font-bold text-[var(--text-primary)] flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span>1. Google OIDC</span>
                  </div>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    Services on GCP, Firebase, or Google Auth send standard Google ID Tokens
                    (<code className="font-mono text-[var(--text-primary)]">Authorization: Bearer &lt;id_token&gt;</code>).
                    Verified via Google&apos;s public key verifier with{" "}
                    <b className="text-[var(--text-primary)]">zero Secret Manager setup</b> required.
                  </p>
                </div>
                <div className="p-6 bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-3">
                  <div className="font-bold text-[var(--text-primary)] flex items-center gap-2 text-sm">
                    <Key className="w-4 h-4 text-amber-600" />
                    <span>2. Shared Platform Key</span>
                  </div>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    Backend applications pass the platform postback key
                    (<code className="font-mono text-[var(--text-primary)]">MONOLITH_API_KEY</code>). Evaluated
                    using constant-time comparison (<code className="font-mono text-[var(--text-primary)]">MessageDigest.isEqual</code>)
                    to prevent timing-attack side channels.
                  </p>
                </div>
                <div className="p-6 bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-3">
                  <div className="font-bold text-[var(--text-primary)] flex items-center gap-2 text-sm">
                    <Lock className="w-4 h-4 text-blue-600" />
                    <span>3. Multi-User MCP Keys</span>
                  </div>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    AI coding agents access <code className="font-mono text-[var(--text-primary)]">/api/mcp</code>{" "}
                    using registered user tokens, configured via
                    (<code className="font-mono text-[var(--text-primary)]">MCP_USERS</code> JSON map or{" "}
                    <code className="font-mono text-[var(--text-primary)]">MCP_API_KEY</code> fallback).
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <SubHeading id="mcp-user-config">Multi-user MCP configuration example</SubHeading>
                <CopyButton
                  id="mcp_env"
                  label="Copy ENV Snippet"
                  copiedId={copiedCode}
                  onCopy={copyToClipboard}
                  text={`MCP_USERS='{"adiadithyakrishnan@gmail.com": "mcp_key_continuum_9918"}'\nMCP_API_KEY="mcp_key_fallback_12345"`}
                />
              </div>
              <pre className="p-5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] font-mono text-xs text-[var(--text-primary)] overflow-x-auto leading-relaxed">
{`# Server-Side Allowed MCP Users (JSON Map: Email -> Token)
MCP_USERS='{"adiadithyakrishnan@gmail.com": "mcp_key_continuum_9918"}'

# Single Key Fallback
MCP_API_KEY="mcp_key_fallback_12345"`}
              </pre>
            </div>
          </DocSectionShell>

          {/* SECTION 4 — MCP SERVER & AI TOOLS */}
          <DocSectionShell section={SECTIONS[3]}>
            <div className="space-y-5">
              <SubHeading id="mcp-overview">Overview</SubHeading>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Monolith exposes an HTTP Model Context Protocol (MCP) server over SSE stream
                transport. AI coding assistants — Cursor, Claude Code, Antigravity — use this
                endpoint to inspect user event history, salary logs, domain telemetry, and
                BigQuery schemas directly inside the IDE, without a human ever running a query
                by hand.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold bg-[var(--bg-primary)] px-3 py-1.5 border border-[var(--border-subtle)] text-[var(--text-primary)]">
                  {MCP_ENDPOINT}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  SSE stream transport
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <SubHeading id="mcp-configuration">
                  Client configuration <code className="font-mono text-[var(--text-secondary)] font-normal">mcp_config.json</code>
                </SubHeading>
                <CopyButton
                  id="mcp_config"
                  label="Copy mcp_config.json"
                  copiedId={copiedCode}
                  onCopy={copyToClipboard}
                  text={`{\n  "mcpServers": {\n    "monolith-telemetry": {\n      "url": "${MCP_ENDPOINT}",\n      "headers": {\n        "Authorization": "Bearer YOUR_MCP_USER_KEY"\n      }\n    }\n  }\n}`}
                />
              </div>
              <pre className="p-5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] font-mono text-xs text-[var(--text-primary)] overflow-x-auto leading-relaxed">
{`{
  "mcpServers": {
    "monolith-telemetry": {
      "url": "${MCP_ENDPOINT}",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_USER_KEY"
      }
    }
  }
}`}
              </pre>
            </div>

            <div className="space-y-3">
              <SubHeading id="mcp-tools">Registered MCP tool dictionary</SubHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {[
                  {
                    name: "query_user_activity",
                    desc: "Queries complete user event history, salary logs, watchlists, and domain activity across all apps by email.",
                    inputs: "email, limit",
                  },
                  {
                    name: "query_domain_events",
                    desc: (
                      <>
                        Filters domain events by source application (<code className="font-mono">continuum-home</code>), domain group, or event enum name.
                      </>
                    ),
                    inputs: "sourceApp, domain, eventType",
                  },
                  {
                    name: "get_bigquery_schema",
                    desc: "Fetches table definitions, partitioning options, and SQL view specifications directly into the agent.",
                    inputs: "None",
                  },
                  {
                    name: "get_system_health",
                    desc: "Checks backend Cloud Run health, dataset bindings, Discord notifier status, and BigQuery write stream.",
                    inputs: "None",
                  },
                ].map((tool) => (
                  <div key={tool.name} className="p-5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2">
                    <div className="font-mono font-bold text-[var(--text-primary)] text-sm flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-[var(--text-primary)]" /> {tool.name}
                    </div>
                    <p className="text-[var(--text-secondary)]">{tool.desc}</p>
                    <span className="font-mono text-[11px] text-[var(--text-primary)] bg-[var(--bg-card)] px-2 py-1 rounded border border-[var(--border-subtle)] inline-block">
                      Inputs: {tool.inputs}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </DocSectionShell>

          {/* SECTION 5 — BIGQUERY ARCHITECTURE */}
          <DocSectionShell
            section={SECTIONS[4]}
            headerAction={
              <span className="text-xs font-mono font-bold bg-[var(--bg-primary)] px-3 py-1.5 border border-[var(--border-subtle)] text-[var(--text-primary)] shrink-0">
                portfolio-api-505006:events
              </span>
            }
            isLast
          >
            <div className="space-y-3">
              <SubHeading id="dataset-overview">Dataset &amp; retention</SubHeading>
              <div className="p-4 bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2 text-xs">
                <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-2">
                  <span className="text-[var(--text-secondary)]">Dataset Binding</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">portfolio-api-505006:events</span>
                </div>
                <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-2">
                  <span className="text-[var(--text-secondary)]">Partitioning Strategy</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">DAY on occurred_at</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">Retention Policy</span>
                  <span className="font-mono font-bold text-emerald-700">Permanent / Infinite Retention</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <SubHeading id="schema-details">Clustering keys &amp; analytics views</SubHeading>
              <div className="p-4 bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2 text-xs">
                <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-2">
                  <span className="text-[var(--text-secondary)]">Clustering Keys</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">(local_user_id, event_type)</span>
                </div>
                <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-2">
                  <span className="text-[var(--text-secondary)]">Unified View</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">events.all_events</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">User Identity View</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">events.user_activity</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <SubHeading id="sample-query">Sample BigQuery user activity query</SubHeading>
                <CopyButton
                  id="sql_query"
                  label="Copy SQL Query"
                  copiedId={copiedCode}
                  onCopy={copyToClipboard}
                  text={`SELECT\n  COALESCE(JSON_VALUE(e.payload.userEmail), 'adiadithyakrishnan@gmail.com') AS email,\n  e.source_app,\n  e.event_type,\n  COUNT(*) AS total_events,\n  MAX(e.occurred_at) AS last_activity\nFROM \`portfolio-api-505006.events.all_events\` e\nGROUP BY 1, 2, 3\nORDER BY total_events DESC;`}
                />
              </div>
              <pre className="p-5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] font-mono text-xs text-[var(--text-primary)] overflow-x-auto leading-relaxed">
{`SELECT
  COALESCE(JSON_VALUE(e.payload.userEmail), 'adiadithyakrishnan@gmail.com') AS email,
  e.source_app,
  e.event_type,
  COUNT(*) AS total_events,
  MAX(e.occurred_at) AS last_activity
FROM \`portfolio-api-505006.events.all_events\` e
GROUP BY 1, 2, 3
ORDER BY total_events DESC;`}
              </pre>
            </div>
          </DocSectionShell>

          {/* ─── BACK TO TOP ─── */}
          <div className="pt-4 flex justify-center">
            <button
              onClick={() => scrollToAnchor(ALL_ANCHORS[0])}
              className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Back to top ↑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocSectionShell({
  section,
  headerAction,
  children,
  isLast,
}: {
  section: DocSection;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  isLast?: boolean;
}) {
  const Icon = section.icon;
  const index = SECTIONS.findIndex((s) => s.id === section.id);
  const prev = index > 0 ? SECTIONS[index - 1] : null;
  const next = index < SECTIONS.length - 1 ? SECTIONS[index + 1] : null;

  return (
    <section id={section.id} className="scroll-mt-24">
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] p-6 sm:p-8 space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 bg-[var(--text-primary)] text-[var(--bg-primary)] flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5" />
              </span>
              <Eyebrow>
                {section.number} · {section.eyebrow}
              </Eyebrow>
            </div>
            <h3 className="font-display font-black text-2xl sm:text-3xl uppercase text-[var(--text-primary)] tracking-tight leading-none">
              {section.title}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-[560px] leading-relaxed">
              {section.summary}
            </p>
          </div>
          {headerAction}
        </div>

        <div className="space-y-8">{children}</div>
      </div>

      {/* ─── PREV / NEXT PAGER ─── */}
      {(prev || next) && (
        <div className={`mt-6 grid gap-3 ${prev && next ? "grid-cols-2" : "grid-cols-1"}`}>
          {prev && (
            <a
              href={`#${prev.subsections[0].id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(prev.subsections[0].id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="group flex items-center gap-3 p-4 border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-primary)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-[var(--text-secondary)] group-hover:-translate-x-0.5 transition-transform shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Previous</div>
                <div className="text-xs font-bold text-[var(--text-primary)] truncate">{prev.title}</div>
              </div>
            </a>
          )}
          {next && (
            <a
              href={`#${next.subsections[0].id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(next.subsections[0].id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="group flex items-center justify-end gap-3 p-4 border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-primary)] transition-colors text-right"
            >
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Next</div>
                <div className="text-xs font-bold text-[var(--text-primary)] truncate">{next.title}</div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[var(--text-secondary)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
            </a>
          )}
        </div>
      )}
    </section>
  );
}
