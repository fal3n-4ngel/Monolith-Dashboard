"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Search,
  X,
  ChevronRight,
  Database,
  AlertTriangle,
  Filter,
  SlidersHorizontal,
  ShieldAlert,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import { WorkspaceHeader } from "@/components/WorkspaceHeader";

export interface AuditLogEntry {
  domain: string | null;
  eventId: string | null;
  sourceApp: string | null;
  userId: string | null;
  eventType: string | null;
  action: string | null;
  entityId: string | null;
  itemCount: number | null;
  occurredAt: string | null;
  receivedAt: string | null;
  payload?: Record<string, unknown> | string | null;
}

interface AuditLogPage {
  scope: string;
  count: number;
  results: AuditLogEntry[];
  nextBefore?: string | null;
}

const PAGE_SIZE = 100;

const DEFAULT_APPS = ["chayakudikanpooyalo", "continuum-home", "monolith-api", "monolith-dashboard"];
const DEFAULT_DOMAINS = ["account", "expenses", "investments", "subscriptions", "usage", "watchlist"];
const DEFAULT_EVENT_TYPES = [
  "EXPENSE_CREATED",
  "EXPENSE_UPDATED",
  "EXPENSE_DELETED",
  "SALARY_UPDATED",
  "SALARY_LOGGED",
  "WATCHLIST_ADDED",
  "WATCHLIST_UPDATED",
  "WATCHLIST_REMOVED",
  "INVESTMENT_CREATED",
  "INVESTMENT_UPDATED",
  "INVESTMENT_DELETED",
  "SUBSCRIPTION_CREATED",
  "SUBSCRIPTION_UPDATED",
  "SUBSCRIPTION_DELETED",
  "USER_CREATED",
  "USER_DELETED",
  "REPORT_RUN",
  "MCP_QUERY",
  "WORKSPACE_SIGNIN",
];

interface Filters {
  sourceApp: string;
  domain: string;
  eventType: string;
  userId: string;
  from: string;
}

const EMPTY_FILTERS: Filters = { sourceApp: "", domain: "", eventType: "", userId: "", from: "" };

export function AuditStreamDashboard() {
  const [rawEntries, setRawEntries] = useState<AuditLogEntry[]>([]);
  const [userScope, setUserScope] = useState<string>("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  // App, Domain, and Event Type dropdown options derived from rawEntries + defaults
  const appOptions = useMemo(() => {
    const set = new Set([...DEFAULT_APPS]);
    rawEntries.forEach((e) => { if (e.sourceApp) set.add(e.sourceApp); });
    return Array.from(set).sort();
  }, [rawEntries]);

  const domainOptions = useMemo(() => {
    const set = new Set([...DEFAULT_DOMAINS]);
    rawEntries.forEach((e) => { if (e.domain) set.add(e.domain); });
    return Array.from(set).sort();
  }, [rawEntries]);

  const eventTypeOptions = useMemo(() => {
    const set = new Set([...DEFAULT_EVENT_TYPES]);
    rawEntries.forEach((e) => { if (e.eventType) set.add(e.eventType); });
    return Array.from(set).sort();
  }, [rawEntries]);

  // Instant client-side filtering on cached/loaded entries
  const filteredEntries = useMemo(() => {
    return rawEntries.filter((e) => {
      if (filters.sourceApp.trim()) {
        if (!e.sourceApp || e.sourceApp.toLowerCase() !== filters.sourceApp.trim().toLowerCase()) {
          return false;
        }
      }
      if (filters.domain.trim()) {
        if (!e.domain || e.domain.toLowerCase() !== filters.domain.trim().toLowerCase()) {
          return false;
        }
      }
      if (filters.eventType.trim()) {
        if (!e.eventType || e.eventType.toLowerCase() !== filters.eventType.trim().toLowerCase()) {
          return false;
        }
      }
      if (filters.userId.trim()) {
        if (!e.userId || !e.userId.toLowerCase().includes(filters.userId.trim().toLowerCase())) {
          return false;
        }
      }
      if (filters.from.trim()) {
        if (!e.occurredAt) return false;
        const fromTime = new Date(filters.from.trim()).getTime();
        const eventTime = new Date(e.occurredAt).getTime();
        if (!isNaN(fromTime) && !isNaN(eventTime) && eventTime < fromTime) {
          return false;
        }
      }
      return true;
    });
  }, [rawEntries, filters]);

  const buildUrl = useCallback((activeFilters: Filters, before: string | null, isRefresh = false) => {
    const params = new URLSearchParams();
    if (activeFilters.sourceApp.trim()) params.set("sourceApp", activeFilters.sourceApp.trim());
    if (activeFilters.domain.trim()) params.set("domain", activeFilters.domain.trim());
    if (activeFilters.eventType.trim()) params.set("eventType", activeFilters.eventType.trim());
    if (activeFilters.userId.trim()) params.set("userId", activeFilters.userId.trim());
    if (activeFilters.from.trim()) params.set("from", activeFilters.from.trim());
    params.set("limit", String(PAGE_SIZE));
    if (before) params.set("before", before);
    if (isRefresh) params.set("refresh", "true");
    return `/api/audit/logs?${params.toString()}`;
  }, []);

  const load = useCallback(
    async (activeFilters: Filters, mode: "replace" | "append", isRefresh = false) => {
      if (mode === "replace") setLoading(true);
      else setLoadingMore(true);
      setError(null);

      // 30s Client-side sessionStorage cache for initial default load
      const isInitialDefault =
        mode === "replace" &&
        !isRefresh &&
        !Object.values(activeFilters).some((v) => v.trim() !== "");

      const CACHE_KEY = "monolith_initial_audit_log_cache";
      if (isInitialDefault) {
        try {
          const cachedRaw = sessionStorage.getItem(CACHE_KEY);
          if (cachedRaw) {
            const { timestamp, page } = JSON.parse(cachedRaw);
            if (Date.now() - timestamp < 30000 && page && Array.isArray(page.results)) {
              if (page.scope) setUserScope(page.scope);
              setCursor(page.nextBefore ?? null);
              setRawEntries(page.results);
              setLoading(false);
              setLoadingMore(false);
              return;
            }
          }
        } catch {
          // ignore cache read errors
        }
      }

      try {
        const before = mode === "append" ? cursor : null;
        const res = await fetch(buildUrl(activeFilters, before, isRefresh));
        const raw = await res.text();
        const data = raw ? (JSON.parse(raw) as AuditLogPage & { error?: string; message?: string }) : null;

        if (!res.ok || !data) {
          throw new Error(data?.message || data?.error || `Request failed (HTTP ${res.status})`);
        }

        // Only set userScope on default initial load so filtering by sourceApp doesn't overwrite account scope
        if (isInitialDefault || !userScope) {
          setUserScope(data.scope ?? "");
        }
        setCursor(data.nextBefore ?? null);
        setRawEntries((prev) => (mode === "append" ? [...prev, ...data.results] : data.results));

        if (isInitialDefault) {
          try {
            sessionStorage.setItem(
              CACHE_KEY,
              JSON.stringify({ timestamp: Date.now(), page: data })
            );
          } catch {
            // ignore cache write errors
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load audit log");
        if (mode === "replace") setRawEntries([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildUrl, cursor, userScope]
  );

  useEffect(() => {
    load(EMPTY_FILTERS, "replace");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQueryServer = () => {
    setCursor(null);
    setMobileFilterOpen(false);
    load(filters, "replace");
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setMobileFilterOpen(false);
  };

  const hasActiveFilters = useMemo(() => Object.values(filters).some((v) => v.trim() !== ""), [filters]);

  // Lock Source App selector only if user's account scope itself is restricted to a single non-'all' app
  const isAccountScopeLocked = userScope !== "" && userScope.toLowerCase() !== "all";

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <WorkspaceHeader
        actions={
          <button
            onClick={() => load(filters, "replace", true)}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 border border-[var(--border-subtle)] text-[10px] sm:text-xs font-mono font-semibold uppercase tracking-widest hover:bg-[var(--bg-card)] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        }
      />

      <main className="flex-1 max-w-[1700px] w-full mx-auto p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-secondary)]">
          <div>
            Domain-event history from <code className="font-mono text-[11px]">monolith-api</code> · scope{" "}
            <span className="font-mono font-bold text-[var(--text-primary)]">{userScope || "all"}</span>
          </div>

          {/* Mobile Filter Toggle Button */}
          <button
            onClick={() => setMobileFilterOpen((v) => !v)}
            className="lg:hidden flex items-center gap-1.5 px-2.5 py-1 border border-[var(--border-subtle)] bg-[var(--bg-card)] text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)] cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters {hasActiveFilters && "•"}</span>
          </button>
        </div>

        {/* Filters Panel (Always open on lg, collapsible on mobile) */}
        <div
          className={`border border-[var(--border-subtle)] bg-[var(--bg-card)] ${
            mobileFilterOpen ? "block" : "hidden lg:block"
          }`}
        >
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-subtle)] text-[11px] font-mono font-bold uppercase tracking-widest text-[var(--text-secondary)]">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters (Instant Client-Side & Cache)</span>
            </div>
            {hasActiveFilters && (
              <span className="text-[10px] text-[var(--accent)] font-semibold">Instant Filter Active</span>
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleQueryServer();
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-3 sm:p-4">
              {!isAccountScopeLocked ? (
                <FilterSelectField
                  label="Source App"
                  value={filters.sourceApp}
                  options={appOptions}
                  allLabel="All Apps"
                  onChange={(v) => setFilters((d) => ({ ...d, sourceApp: v }))}
                />
              ) : (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                    Source App
                  </span>
                  <div className="px-2.5 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)]">
                    {userScope} (Locked)
                  </div>
                </div>
              )}
              <FilterSelectField
                label="Domain"
                value={filters.domain}
                options={domainOptions}
                allLabel="All Domains"
                onChange={(v) => setFilters((d) => ({ ...d, domain: v }))}
              />
              <FilterSelectField
                label="Event Type"
                value={filters.eventType}
                options={eventTypeOptions}
                allLabel="All Event Types"
                onChange={(v) => setFilters((d) => ({ ...d, eventType: v }))}
              />
              <FilterField
                label="User ID"
                value={filters.userId}
                onChange={(v) => setFilters((d) => ({ ...d, userId: v }))}
                placeholder="usr_1"
              />
              <FilterField
                label="From"
                value={filters.from}
                onChange={(v) => setFilters((d) => ({ ...d, from: v }))}
                placeholder="2026-08-01T00:00:00Z"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 px-3 sm:px-4 pb-3 sm:pb-4">
              <button
                type="submit"
                className="flex items-center gap-2 px-3 py-2 bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                Fetch from Server
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-3 py-2 border border-[var(--border-subtle)] text-xs font-mono font-semibold uppercase tracking-widest hover:bg-[var(--bg-primary)] transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
              <span className="ml-auto text-[11px] font-mono text-[var(--text-secondary)]">
                {filteredEntries.length} of {rawEntries.length} row{rawEntries.length === 1 ? "" : "s"} shown
                {cursor ? " · more available" : ""}
              </span>
            </div>
          </form>
        </div>

        {error && (
          <div className="flex items-start gap-2 border border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-3 text-xs">
            <AlertTriangle className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
            <span className="font-mono break-all">{error}</span>
          </div>
        )}

        {/* Audit Log Entries View */}
        <div className="border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-xs text-[var(--text-secondary)] font-mono">
              <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
              Loading audit log…
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--text-secondary)] font-sans">
              No events match these filters.
            </div>
          ) : (
            <>
              {/* Desktop Table View (hidden on mobile) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[var(--border-strong)] text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                    <tr>
                      <th className="py-3 px-4">Occurred</th>
                      <th className="py-3 px-4">Event Type</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Source App</th>
                      <th className="py-3 px-4">Domain</th>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Entity</th>
                      <th className="py-3 px-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
                    {filteredEntries.map((entry, i) => (
                      <tr
                        key={entry.eventId ?? `${entry.occurredAt}-${i}`}
                        onClick={() => setSelected(entry)}
                        className="hover:bg-[var(--bg-primary)] cursor-pointer transition-colors group"
                      >
                        <td className="py-2.5 px-4 text-[var(--text-secondary)] whitespace-nowrap">
                          {formatTs(entry.occurredAt)}
                        </td>
                        <td className="py-2.5 px-4 font-bold group-hover:text-[var(--accent)] transition-colors">
                          {entry.eventType ?? "—"}
                        </td>
                        <td className="py-2.5 px-4 text-[var(--text-secondary)]">{entry.action ?? "—"}</td>
                        <td className="py-2.5 px-4">
                          <span className="px-1.5 py-0.5 border border-[var(--border-subtle)] text-[10px]">
                            {entry.sourceApp ?? "—"}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-[var(--text-secondary)]">{entry.domain ?? "—"}</td>
                        <td className="py-2.5 px-4 text-[var(--text-secondary)]">{entry.userId ?? "—"}</td>
                        <td className="py-2.5 px-4 text-[var(--text-secondary)]">
                          {entry.entityId ?? "—"}
                          {entry.itemCount && entry.itemCount > 1 ? ` ×${entry.itemCount}` : ""}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <ChevronRight className="w-4 h-4 inline text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] group-hover:translate-x-0.5 transition-all" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Responsive Mobile Cards View (shown only on mobile) */}
              <div className="md:hidden divide-y divide-[var(--border-subtle)] font-mono">
                {filteredEntries.map((entry, i) => (
                  <div
                    key={entry.eventId ?? `${entry.occurredAt}-${i}`}
                    onClick={() => setSelected(entry)}
                    className="p-3.5 space-y-2 hover:bg-[var(--bg-primary)] active:bg-[var(--bg-primary)] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="font-bold text-[var(--text-primary)] truncate">
                        {entry.eventType ?? "—"}
                      </span>
                      <span className="text-[10px] text-[var(--text-secondary)] shrink-0">
                        {formatTs(entry.occurredAt)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                      {entry.sourceApp && (
                        <span className="px-1.5 py-0.5 border border-[var(--border-subtle)] text-[10px] font-semibold text-[var(--text-primary)]">
                          {entry.sourceApp}
                        </span>
                      )}
                      {entry.action && <span className="opacity-80">· {entry.action}</span>}
                      {entry.domain && <span className="opacity-80">· {entry.domain}</span>}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] pt-1 border-t border-[var(--border-subtle)]/50">
                      <span>User: {entry.userId ?? "—"}</span>
                      <span className="flex items-center gap-0.5 text-[var(--accent)] font-semibold text-[10px]">
                        Inspect Details <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {cursor && !loading && (
            <div className="border-t border-[var(--border-subtle)] p-3 text-center">
              <button
                onClick={() => load(filters, "append")}
                disabled={loadingMore}
                className="px-4 py-2 border border-[var(--border-subtle)] text-xs font-mono font-semibold uppercase tracking-widest hover:bg-[var(--bg-primary)] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </div>
      </main>

      {selected && <DetailModal entry={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function FilterField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-secondary)]">
        {label}
      </span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="px-2.5 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs font-mono focus:outline-none focus:border-[var(--border-strong)] transition-colors w-full"
      />
    </label>
  );
}

function FilterSelectField({
  label,
  value,
  options,
  allLabel,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  allLabel: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-secondary)]">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-2.5 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs font-mono focus:outline-none focus:border-[var(--border-strong)] transition-colors w-full cursor-pointer"
      >
        <option value="">{allLabel}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

function DetailModal({ entry, onClose }: { entry: AuditLogEntry; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div
        className="bg-[var(--bg-card)] border border-[var(--border-strong)] max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[var(--border-subtle)] sticky top-0 bg-[var(--bg-card)] z-10 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Database className="w-4 h-4 text-[var(--accent)] shrink-0" />
            <span className="font-mono font-bold text-xs sm:text-sm text-[var(--text-primary)] truncate">
              {entry.eventType ?? "EVENT_DETAILS"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--bg-primary)] transition-colors cursor-pointer shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 space-y-4 text-xs font-mono overflow-y-auto">
          {/* Metadata 2-Column Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="col-span-2 sm:col-span-1">
              <Field label="Event ID" value={entry.eventId} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Field label="Source App" value={entry.sourceApp} />
            </div>
            <div>
              <Field label="Domain" value={entry.domain} />
            </div>
            <div>
              <Field label="Action" value={entry.action} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Field label="User ID" value={entry.userId} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Field label="Entity ID" value={entry.entityId} />
            </div>
            <div>
              <Field label="Item Count" value={entry.itemCount != null ? String(entry.itemCount) : null} />
            </div>
            <div>
              <Field label="Occurred At" value={entry.occurredAt} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Field label="Received At" value={entry.receivedAt} />
            </div>
          </div>

          {/* Sensitive Payload Container */}
          <CleanPayloadView payload={entry.payload} />
        </div>
      </div>
    </div>
  );
}

function CleanPayloadView({ payload }: { payload?: Record<string, unknown> | string | null }) {
  const [showSensitive, setShowSensitive] = useState(false);

  if (!payload) return null;

  let parsed: Record<string, unknown> | null = null;
  if (typeof payload === "string") {
    try {
      parsed = JSON.parse(payload);
    } catch {
      parsed = { raw: payload };
    }
  } else if (typeof payload === "object") {
    parsed = payload;
  }

  if (!parsed || Object.keys(parsed).length === 0) return null;

  const entries = Object.entries(parsed);

  return (
    <div className="border border-amber-600/40 bg-amber-500/5 p-3 sm:p-4 space-y-3 font-mono mt-3">
      {/* Payload Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-600/20 pb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 whitespace-nowrap">
            Sensitive Log Payload
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border border-amber-600/40 text-amber-700 bg-amber-500/10 whitespace-nowrap">
            SENSITIVE
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowSensitive((v) => !v)}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 hover:text-amber-900 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
        >
          {showSensitive ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>Hide Payload</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>Reveal Payload</span>
            </>
          )}
        </button>
      </div>

      {/* Payload Content / Summary */}
      {showSensitive ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
          {entries.map(([key, val]) => (
            <div key={key} className="p-2.5 border border-[var(--border-subtle)] bg-[var(--bg-primary)] space-y-1">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                {key}
              </span>
              <span className="break-all font-semibold text-[var(--text-primary)] text-[11px]">
                {val == null ? "—" : typeof val === "object" ? JSON.stringify(val) : String(val)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[11px] text-[var(--text-secondary)] flex flex-wrap items-center justify-between gap-2 py-0.5">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-amber-600/70 shrink-0 inline" />
            <span>Contains {entries.length} sensitive key{entries.length === 1 ? "" : "s"} (hidden by default).</span>
          </span>
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider whitespace-nowrap">
            Click Reveal to view
          </span>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <span className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
        {label}
      </span>
      <span className="break-all">{value ?? "—"}</span>
    </div>
  );
}

function formatTs(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const CSV_COLUMNS = [
  "occurred_at",
  "received_at",
  "domain",
  "source_app",
  "event_type",
  "action",
  "user_id",
  "entity_id",
  "item_count",
  "event_id",
] as const;

function toCsv(rows: AuditLogEntry[]): string {
  const cell = (v: unknown) => {
    const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const header = CSV_COLUMNS.join(",");
  const lines = rows.map((r) =>
    [
      r.occurredAt,
      r.receivedAt,
      r.domain,
      r.sourceApp,
      r.eventType,
      r.action,
      r.userId,
      r.entityId,
      r.itemCount,
      r.eventId,
    ]
      .map(cell)
      .join(",")
  );
  return [header, ...lines].join("\r\n") + "\r\n";
}

function triggerDownload(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
