"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Activity,
  RefreshCw,
  Search,
  Shield,
  Layers,
  Terminal,
  Server,
  Send,
  X,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ChevronRight,
  Database,
  Radio,
  ExternalLink,
  ShieldAlert,
  Globe,
  GitBranch,
  Cpu,
  ArrowUpRight,
  Check,
  Clock,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { NavigationHeader } from "@/components/NavigationHeader";
import { ScheduledWorkflowsWidget } from "@/components/ScheduledWorkflowsWidget";
import { GithubReposWidget } from "@/components/GithubReposWidget";
import { MonolithDocs } from "@/components/MonolithDocs";

export interface AuditLogEntry {
  logId: string;
  sourceApp: string;
  eventType: string;
  severity: "INFO" | "WARN" | "ERROR" | "CRITICAL" | string;
  userId?: string;
  timestamp: number;
  createdAt?: number;
  metadata?: Record<string, any>;
  context?: {
    origin?: string;
    clientOrigin?: string;
    referer?: string;
    clientHref?: string;
    clientIp?: string;
    userAgent?: string;
    environment?: string;
    isUat?: boolean;
    [key: string]: any;
  };
}

// Approved production domains for continuum-home
const AUTHORIZED_DOMAINS = ["https://continuum-home.vercel.app", "http://localhost:3000", "http://localhost:3001"];

export function AuditStreamDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "audit" | "docs" | "github">("overview");
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  // Live Monolith API Health check status
  const [apiHealth, setApiHealth] = useState<{ status: "ONLINE" | "OFFLINE" | "CHECKING"; latencyMs?: number }>({
    status: "CHECKING",
  });

  // Filters
  const [sourceAppFilter, setSourceAppFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Test Event Modal State
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);
  const [testSourceApp, setTestSourceApp] = useState<string>("continuum-home");
  const [testEventType, setTestEventType] = useState<string>("EXPENSE_CREATED");
  const [testSeverity, setTestSeverity] = useState<string>("INFO");
  const [testPayloadJson, setTestPayloadJson] = useState<string>(
    JSON.stringify({ amount: 500, category: "Groceries", title: "Whole Foods" }, null, 2)
  );
  const [sendingTest, setSendingTest] = useState<boolean>(false);
  const [testResultMsg, setTestResultMsg] = useState<string | null>(null);

  // Real Health check call to backend API
  const checkBackendHealth = useCallback(() => {
    setApiHealth({ status: "CHECKING" });
    const start = Date.now();
    fetch("https://monolith-postbacks.adithyakrishnan.com/health")
      .then((res) => {
        if (res.ok) {
          setApiHealth({ status: "ONLINE", latencyMs: Date.now() - start });
        } else {
          setApiHealth({ status: "OFFLINE" });
        }
      })
      .catch(() => {
        setApiHealth({ status: "OFFLINE" });
      });
  }, []);

  useEffect(() => {
    checkBackendHealth();
  }, [checkBackendHealth]);

  const fetchLogs = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (sourceAppFilter !== "all") params.set("sourceApp", sourceAppFilter);
      if (severityFilter !== "all") params.set("severity", severityFilter);
      params.set("limit", "100");

      const res = await fetch(`/api/audit/logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("[AuditStreamDashboard] Fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sourceAppFilter, severityFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Optimized auto-refresh poll (15s interval, paused when browser tab is hidden)
  useEffect(() => {
    if (!autoRefresh || activeTab !== "audit") return;

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchLogs();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [autoRefresh, activeTab, fetchLogs]);

  const handleSendTestEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingTest(true);
    setTestResultMsg(null);

    let parsedMetadata = {};
    try {
      parsedMetadata = JSON.parse(testPayloadJson);
    } catch {
      setTestResultMsg("Error: Invalid JSON payload.");
      setSendingTest(false);
      return;
    }

    try {
      const res = await fetch("/api/audit/postback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceApp: testSourceApp || "continuum-home",
          eventType: testEventType || "TEST_EVENT",
          severity: testSeverity || "INFO",
          userId: "dashboard_tester",
          timestamp: Date.now(),
          metadata: parsedMetadata,
          context: {
            clientOrigin: typeof window !== "undefined" ? window.location.origin : "https://monolith.adithyakrishnan.com",
            clientHref: typeof window !== "undefined" ? window.location.href : "https://monolith.adithyakrishnan.com",
            userAgent: typeof window !== "undefined" ? navigator.userAgent : "Dashboard",
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTestResultMsg(`Success! Recorded Log ID: ${data.logId}`);
        setTimeout(() => {
          setIsTestModalOpen(false);
          fetchLogs(true);
        }, 1500);
      } else {
        const errData = await res.json().catch(() => ({}));
        setTestResultMsg(`Failed: ${errData.error || res.statusText}`);
      }
    } catch (err: any) {
      setTestResultMsg(`Error: ${err?.message || "Failed to dispatch"}`);
    } finally {
      setSendingTest(false);
    }
  };

  // Helper to extract real originating URL from context
  const getLogOriginUrl = (log: AuditLogEntry): { url: string; isUnauthorized: boolean } => {
    const rawOrigin =
      log.context?.clientOrigin ||
      log.context?.origin ||
      log.context?.referer ||
      log.context?.clientHref ||
      "";

    let url = rawOrigin.trim();
    if (!url) return { url: "Unknown Origin", isUnauthorized: false };

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }

    const isKnownAuthorized = AUTHORIZED_DOMAINS.some((domain) => url.startsWith(domain));
    const isUnauthorized = !isKnownAuthorized && log.sourceApp === "continuum-home";

    return { url, isUnauthorized };
  };

  // BUILD PURE EMPIRICAL APP DIRECTORY FROM ACTUAL FIRESTORE AUDIT LOGS ONLY
  const actualAppsMap = new Map<
    string,
    { count: number; lastSeen: number; origins: Set<string>; hasUnauthorized: boolean }
  >();

  logs.forEach((log) => {
    const slug = log.sourceApp || "unknown";
    const { url, isUnauthorized } = getLogOriginUrl(log);
    const existing = actualAppsMap.get(slug);
    const logTime = log.timestamp || log.createdAt || Date.now();

    if (!existing) {
      const originSet = new Set<string>();
      if (url !== "Unknown Origin") originSet.add(url);
      actualAppsMap.set(slug, {
        count: 1,
        lastSeen: logTime,
        origins: originSet,
        hasUnauthorized: isUnauthorized,
      });
    } else {
      if (url !== "Unknown Origin") existing.origins.add(url);
      existing.count += 1;
      existing.lastSeen = Math.max(existing.lastSeen, logTime);
      if (isUnauthorized) existing.hasUnauthorized = true;
    }
  });

  const actualAppsList = Array.from(actualAppsMap.entries()).map(([slug, data]) => ({
    slug,
    count: data.count,
    lastSeen: data.lastSeen,
    origins: Array.from(data.origins),
    hasUnauthorized: data.hasUnauthorized,
  }));

  // Filter logs locally for search query
  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchesId = log.logId?.toLowerCase().includes(q);
    const matchesEvent = log.eventType?.toLowerCase().includes(q);
    const matchesApp = log.sourceApp?.toLowerCase().includes(q);
    const matchesUser = log.userId?.toLowerCase().includes(q);
    const matchesContext = JSON.stringify(log.context || {}).toLowerCase().includes(q);
    const matchesMetadata = JSON.stringify(log.metadata || {}).toLowerCase().includes(q);
    return matchesId || matchesEvent || matchesApp || matchesUser || matchesContext || matchesMetadata;
  });

  // Metrics (Derived 100% from empirical data)
  const totalEvents = logs.length;
  const uniqueAppsCount = actualAppsMap.size;
  const unauthorizedAlertCount = logs.filter((l) => getLogOriginUrl(l).isUnauthorized).length;

  const renderSeverityBadge = (severity: string) => {
    const s = severity?.toUpperCase() || "INFO";
    if (s === "ERROR" || s === "CRITICAL") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <AlertOctagon className="w-3 h-3 text-red-600" />
          {s}
        </span>
      );
    }
    if (s === "WARN" || s === "WARNING") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          {s}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        {s}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#1A1A1A] font-sans">
      <NavigationHeader />

      {/* Main Tab Navigation Bar */}
      <div className="border-b border-stone-200/80 bg-white/80 backdrop-blur-md sticky top-[57px] z-20">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 rounded-xl bg-[#1A1A1A] text-white shadow-sm">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight text-[#1A1A1A]">Monolith Command Hub</h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-600" />
                  EMPIRICAL STREAM ACTIVE
                </span>
              </div>
            </div>
          </div>

          {/* Primary View Switcher */}
          <div className="flex items-center gap-1 bg-stone-100/90 p-1 rounded-xl border border-stone-200">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "bg-[#1A1A1A] text-white shadow-sm"
                  : "text-stone-600 hover:text-[#1A1A1A] hover:bg-stone-200/60"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Command Center</span>
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "audit"
                  ? "bg-[#1A1A1A] text-white shadow-sm"
                  : "text-stone-600 hover:text-[#1A1A1A] hover:bg-stone-200/60"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Audit Telemetry ({totalEvents})</span>
            </button>
            <button
              onClick={() => setActiveTab("docs")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "docs"
                  ? "bg-[#1A1A1A] text-white shadow-sm"
                  : "text-stone-600 hover:text-[#1A1A1A] hover:bg-stone-200/60"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Docs & Integration Spec</span>
            </button>
            <button
              onClick={() => setActiveTab("github")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "github"
                  ? "bg-[#1A1A1A] text-white shadow-sm"
                  : "text-stone-600 hover:text-[#1A1A1A] hover:bg-stone-200/60"
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>CI/CD Workflows</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      {activeTab === "docs" ? (
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-4">
          <MonolithDocs />
        </div>
      ) : activeTab === "github" ? (
        <main className="max-w-[1700px] mx-auto px-4 sm:px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ScheduledWorkflowsWidget />
            <GithubReposWidget />
          </div>
        </main>
      ) : activeTab === "overview" ? (
        <main className="max-w-[1700px] mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Hero Banner */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 flex flex-wrap items-center justify-between gap-6 shadow-sm">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-xs font-mono font-semibold text-stone-700">
                <Sparkles className="w-3.5 h-3.5 text-stone-900" />
                Central Application Governance & Empirical Telemetry Hub
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">
                Real-Time Telemetry & Anti-Theft Audit Command Center
              </h2>
              <p className="text-xs text-stone-600 leading-relaxed font-sans">
                Every event, metric, origin URL, and client IP in this dashboard is derived strictly from real Firestore audit logs ingested by <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">https://monolith-postbacks.adithyakrishnan.com</code>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsTestModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-stone-800 shadow-sm transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Dispatch Postback Test</span>
              </button>
              <button
                onClick={() => setActiveTab("audit")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 text-xs font-semibold transition-all cursor-pointer"
              >
                <Activity className="w-4 h-4" />
                <span>View Empirical Telemetry ({totalEvents})</span>
              </button>
            </div>
          </div>

          {/* Quick System Metrics Cards (100% Empirical) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-stone-500 uppercase tracking-wider">Live Backend Health</span>
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                  <Radio className="w-4 h-4 animate-pulse text-emerald-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#1A1A1A] font-mono">
                {apiHealth.status === "ONLINE" ? `ONLINE (${apiHealth.latencyMs}ms)` : apiHealth.status === "OFFLINE" ? "OFFLINE" : "CHECKING..."}
              </div>
              <div className="text-[11px] text-stone-500 font-mono">https://monolith-postbacks.adithyakrishnan.com</div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-stone-500 uppercase tracking-wider">Total Ingested Events</span>
                <div className="p-2 rounded-lg bg-stone-100 text-stone-700">
                  <Database className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#1A1A1A] font-mono">{totalEvents}</div>
              <div className="text-[11px] text-stone-500 font-mono">Actual Firestore documents</div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-stone-500 uppercase tracking-wider">Active Ingest Apps</span>
                <div className="p-2 rounded-lg bg-stone-100 text-stone-700">
                  <Server className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#1A1A1A] font-mono">{uniqueAppsCount}</div>
              <div className="text-[11px] text-stone-500 font-mono">Empirical application sources</div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-stone-500 uppercase tracking-wider">Security Origin Alerts</span>
                <div className="p-2 rounded-lg bg-red-50 text-red-700">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-red-700 font-mono">{unauthorizedAlertCount}</div>
              <div className="text-[11px] text-stone-500 font-mono">Stolen / unknown host warnings</div>
            </div>
          </div>

          {/* Connected Applications Matrix derived STRICTLY from Ingested Logs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-stone-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 font-mono">
                  Ingested Application Telemetry Matrix ({actualAppsList.length})
                </h3>
              </div>
              <span className="text-[11px] font-mono text-stone-500">Pure Empirical Data</span>
            </div>

            {actualAppsList.length === 0 ? (
              <div className="p-8 rounded-2xl border border-stone-200 bg-white text-center text-xs text-stone-400 font-mono">
                No telemetry data currently stored in Firestore. Ingested application origins will automatically render here as logs arrive.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {actualAppsList.map((app) => (
                  <div
                    key={app.slug}
                    className={`rounded-2xl border bg-white p-5 shadow-sm space-y-4 transition-all flex flex-col justify-between ${
                      app.hasUnauthorized ? "border-red-300 bg-red-50/30" : "border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-bold text-[#1A1A1A] font-mono">{app.slug}</h4>
                        {app.hasUnauthorized ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300 animate-pulse">
                            <ShieldAlert className="w-3 h-3 text-red-600" />
                            UNAUTHORIZED ORIGIN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            VERIFIED SOURCE
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 font-mono">
                        <div className="text-xs text-stone-600">
                          Total Events Ingested: <span className="font-bold text-[#1A1A1A]">{app.count}</span>
                        </div>
                        <div className="text-[11px] text-stone-500">
                          Last Event Received: {new Date(app.lastSeen).toLocaleString()}
                        </div>
                      </div>

                      <div className="pt-2 space-y-1">
                        <span className="text-[10px] font-mono font-semibold text-stone-400 uppercase block">
                          Captured Origin URLs ({app.origins.length})
                        </span>
                        {app.origins.length === 0 ? (
                          <span className="text-xs text-stone-400 italic font-mono">Origin header omitted</span>
                        ) : (
                          app.origins.map((url) => (
                            <div key={url} className="flex items-center justify-between">
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-blue-600 hover:underline truncate max-w-[220px]"
                              >
                                <span className="truncate">{url}</span>
                                <ExternalLink className="w-3 h-3 shrink-0 text-blue-500" />
                              </a>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="border-t border-stone-100 pt-3 flex items-center justify-between text-xs font-mono text-stone-500">
                      <span>Source: Empirical Firestore Log</span>
                      <button
                        onClick={() => {
                          setSourceAppFilter(app.slug);
                          setActiveTab("audit");
                        }}
                        className="text-xs font-semibold text-[#1A1A1A] hover:underline"
                      >
                        Inspect Stream &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      ) : (
        /* Audit Telemetry Stream View */
        <main className="max-w-[1700px] mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Status Banner */}
          <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <div>
                <div className="text-xs font-mono font-bold text-stone-800 flex items-center gap-2">
                  <span>Target API:</span>
                  <span className="text-stone-900 bg-stone-100 px-2 py-0.5 rounded border border-stone-200 font-semibold">
                    https://monolith-postbacks.adithyakrishnan.com/api/v1/audit/postback
                  </span>
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  Strict actual audit ingestion — tracking real deployment origins, user IPs, and postbacks
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsTestModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-stone-800 shadow-sm transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simulate Postback</span>
              </button>
            </div>
          </div>

          {/* Filter & Toolbar Header */}
          <div className="rounded-2xl border border-stone-200 bg-white p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search logs by ID, event name, origin URL, user IP, metadata..."
                  className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:border-stone-400 transition-all font-sans"
                />
              </div>

              {/* Source App Filter */}
              <select
                value={sourceAppFilter}
                onChange={(e) => setSourceAppFilter(e.target.value)}
                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700 focus:outline-none focus:border-stone-400 cursor-pointer font-sans"
              >
                <option value="all">All Source Apps</option>
                {Array.from(actualAppsMap.keys()).map((appSlug) => (
                  <option key={appSlug} value={appSlug}>
                    {appSlug}
                  </option>
                ))}
              </select>

              {/* Severity Filter */}
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700 focus:outline-none focus:border-stone-400 cursor-pointer font-sans"
              >
                <option value="all">All Severities</option>
                <option value="INFO">INFO</option>
                <option value="WARN">WARN</option>
                <option value="ERROR">ERROR</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-stone-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-stone-300 bg-stone-50 text-[#1A1A1A] focus:ring-0"
                />
                <span>Auto Refresh (15s, Tab Paused)</span>
              </label>

              <button
                onClick={() => fetchLogs(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-stone-900" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Audit Telemetry Stream Table */}
          <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 border-b border-stone-200 font-mono text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                    <th className="py-3.5 px-4 font-semibold">Severity</th>
                    <th className="py-3.5 px-4 font-semibold">Event Type</th>
                    <th className="py-3.5 px-4 font-semibold">Source App</th>
                    <th className="py-3.5 px-4 font-semibold">Origin URL / Deployment Host</th>
                    <th className="py-3.5 px-4 font-semibold">Client IP</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-stone-400">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-stone-700" />
                          <span>Loading empirical telemetry event stream...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-stone-400 font-sans">
                        No empirical audit logs found in Firestore matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const formattedTime = new Date(log.timestamp || log.createdAt || Date.now()).toLocaleString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        }
                      );

                      const { url: originUrl, isUnauthorized } = getLogOriginUrl(log);
                      const clientIp = log.context?.clientIp || "N/A";

                      return (
                        <tr
                          key={log.logId}
                          onClick={() => setSelectedLog(log)}
                          className={`hover:bg-stone-50 cursor-pointer transition-colors group ${
                            isUnauthorized ? "bg-red-50/40" : ""
                          }`}
                        >
                          <td className="py-3 px-4 text-stone-500 whitespace-nowrap">{formattedTime}</td>
                          <td className="py-3 px-4">{renderSeverityBadge(log.severity)}</td>
                          <td className="py-3 px-4 font-bold text-[#1A1A1A] group-hover:text-blue-600 transition-colors">
                            {log.eventType}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-800 text-[11px] font-semibold">
                              {log.sourceApp}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {isUnauthorized ? (
                              <div className="flex flex-col">
                                <a
                                  href={originUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-red-700 font-bold hover:underline flex items-center gap-1"
                                >
                                  <span>{originUrl}</span>
                                  <ExternalLink className="w-3 h-3 text-red-600 shrink-0" />
                                </a>
                                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">
                                  🚨 STOLEN CODE / UNKNOWN ORIGIN
                                </span>
                              </div>
                            ) : (
                              <a
                                href={originUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-blue-600 hover:underline flex items-center gap-1 font-semibold text-[11px]"
                              >
                                <span>{originUrl.replace(/^https?:\/\//, "")}</span>
                                <ExternalLink className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                              </a>
                            )}
                          </td>
                          <td className="py-3 px-4 text-stone-600 font-mono text-[11px]">{clientIp}</td>
                          <td className="py-3 px-4 text-right">
                            <button className="text-stone-400 group-hover:text-stone-900 group-hover:translate-x-0.5 transition-all">
                              <ChevronRight className="w-4 h-4 inline" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      {/* Detail Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-stone-100 text-stone-800">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A1A1A]">{selectedLog.eventType}</h3>
                  <div className="text-xs text-stone-500 font-mono">Log ID: {selectedLog.logId}</div>
                </div>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                <div>
                  <span className="text-stone-500 block">SOURCE APP:</span>
                  <span className="text-stone-900 font-bold">{selectedLog.sourceApp}</span>
                </div>
                <div>
                  <span className="text-stone-500 block">ORIGIN URL:</span>
                  <a
                    href={getLogOriginUrl(selectedLog).url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-bold"
                  >
                    {getLogOriginUrl(selectedLog).url}
                  </a>
                </div>
                <div>
                  <span className="text-stone-500 block">USER ID / IP:</span>
                  <span className="text-stone-700">
                    {selectedLog.userId || "anonymous"} ({selectedLog.context?.clientIp || "N/A"})
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block">TIMESTAMP:</span>
                  <span className="text-stone-700">{new Date(selectedLog.timestamp).toISOString()}</span>
                </div>
              </div>

              {selectedLog.metadata && (
                <div>
                  <label className="text-xs font-mono text-stone-500 block mb-1.5 uppercase font-semibold">
                    Event Metadata Payload
                  </label>
                  <pre className="p-4 bg-stone-900 text-emerald-400 border border-stone-800 rounded-xl text-xs font-mono overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.context && (
                <div>
                  <label className="text-xs font-mono text-stone-500 block mb-1.5 uppercase font-semibold">
                    Full Execution Context (Origin, Client IP, User Agent)
                  </label>
                  <pre className="p-4 bg-stone-900 text-stone-200 border border-stone-800 rounded-xl text-xs font-mono overflow-x-auto">
                    {JSON.stringify(selectedLog.context, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="border-t border-stone-100 pt-4 text-right">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors border border-stone-200"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulate Postback Event Modal */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                <Send className="w-4 h-4 text-stone-700" />
                Simulate Postback Event Dispatch
              </h3>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendTestEvent} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-stone-600 mb-1 font-semibold">Source Application Slug</label>
                <input
                  type="text"
                  value={testSourceApp}
                  onChange={(e) => setTestSourceApp(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:border-stone-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1 font-semibold">Event Type</label>
                  <input
                    type="text"
                    value={testEventType}
                    onChange={(e) => setTestEventType(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:border-stone-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1 font-semibold">Severity</label>
                  <select
                    value={testSeverity}
                    onChange={(e) => setTestSeverity(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:border-stone-400"
                  >
                    <option value="INFO">INFO</option>
                    <option value="WARN">WARN</option>
                    <option value="ERROR">ERROR</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-600 mb-1 font-semibold">Payload Metadata (JSON)</label>
                <textarea
                  rows={4}
                  value={testPayloadJson}
                  onChange={(e) => setTestPayloadJson(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-900 text-emerald-400 border border-stone-800 rounded-xl font-mono text-xs focus:outline-none"
                />
              </div>

              {testResultMsg && (
                <div
                  className={`p-3 rounded-xl border text-xs font-semibold ${
                    testResultMsg.startsWith("Success")
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-red-50 text-red-800 border-red-200"
                  }`}
                >
                  {testResultMsg}
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-2 font-sans">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold transition-colors border border-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingTest}
                  className="px-4 py-2 bg-[#1A1A1A] text-white rounded-xl font-semibold hover:bg-stone-800 transition-all cursor-pointer disabled:opacity-50"
                >
                  {sendingTest ? "Dispatching..." : "Dispatch Postback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
