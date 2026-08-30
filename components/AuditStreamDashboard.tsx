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
  Download,
  LogOut,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { MonolithLogo } from "@/components/MonolithLogo";

// Shapes mirror monolith-api's AuditLogPage / AuditLogEntry (GET /api/v1/audit/logs),
// reached through the server-side proxy at /api/audit/logs which injects the key.
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
  payload: unknown;
}

interface AuditLogPage {
  scope: string;
  count: number;
  results: AuditLogEntry[];
  nextBefore?: string | null;
}

const PAGE_SIZE = 100;

interface Filters {
  sourceApp: string;
  domain: string;
  eventType: string;
  userId: string;
  from: string;
}

const EMPTY_FILTERS: Filters = { sourceApp: "", domain: "", eventType: "", userId: "", from: "" };

export function AuditStreamDashboard() {
  const { data: session } = useSession();

  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [scope, setScope] = useState<string>("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);

  const buildUrl = useCallback((filters: Filters, before: string | null) => {
    const params = new URLSearchParams();
    if (filters.sourceApp.trim()) params.set("sourceApp", filters.sourceApp.trim());
    if (filters.domain.trim()) params.set("domain", filters.domain.trim());
    if (filters.eventType.trim()) params.set("eventType", filters.eventType.trim());
    if (filters.userId.trim()) params.set("userId", filters.userId.trim());
    if (filters.from.trim()) params.set("from", filters.from.trim());
    params.set("limit", String(PAGE_SIZE));
    if (before) params.set("before", before);
    return `/api/audit/logs?${params.toString()}`;
  }, []);

  const load = useCallback(
    async (filters: Filters, mode: "replace" | "append") => {
      if (mode === "replace") setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        const before = mode === "append" ? cursor : null;
        const res = await fetch(buildUrl(filters, before));
        const raw = await res.text();
        const data = raw ? (JSON.parse(raw) as AuditLogPage & { error?: string; message?: string }) : null;

        if (!res.ok || !data) {
          throw new Error(data?.message || data?.error || `Request failed (HTTP ${res.status})`);
        }

        setScope(data.scope ?? "");
        setCursor(data.nextBefore ?? null);
        setEntries((prev) => (mode === "append" ? [...prev, ...data.results] : data.results));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load audit log");
        if (mode === "replace") setEntries([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildUrl, cursor]
  );

  useEffect(() => {
    load(EMPTY_FILTERS, "replace");
    // first load only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = () => {
    setApplied(draft);
    setCursor(null);
    load(draft, "replace");
  };

  const resetFilters = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setCursor(null);
    load(EMPTY_FILTERS, "replace");
  };

  const hasActiveFilters = useMemo(() => Object.values(applied).some((v) => v.trim() !== ""), [applied]);

  // A client scoped to one app can't pick a source app — the proxy pins it regardless.
  const scopeLocked = scope !== "" && scope.toLowerCase() !== "all";

  const downloadCsv = () => {
    if (entries.length === 0) return;
    const csv = toCsv(entries);
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "").replace(/(\d{8})(\d{4})/, "$1-$2");
    triggerDownload(`monolith-audit-${scope || "all"}-${stamp}.csv`, csv, "text/csv;charset=utf-8");
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Self-contained header — this page is only the audit log. */}
      <header className="sticky top-0 z-40 border-b border-[var(--border-strong)] bg-[var(--bg-primary)]/95 backdrop-blur-md">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <MonolithLogo size={22} />
            <span className="font-display font-black text-lg uppercase tracking-wide">Monolith</span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-secondary)] border-l border-[var(--border-subtle)] pl-2.5 hidden sm:inline">
              Audit Log
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={downloadCsv}
              disabled={loading || entries.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 border border-[var(--border-strong)] text-xs font-mono font-semibold uppercase tracking-widest hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              title="Download the loaded rows as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download CSV</span>
              <span className="tabular-nums">({entries.length})</span>
            </button>
            <button
              onClick={() => load(applied, "replace")}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 border border-[var(--border-subtle)] text-xs font-mono font-semibold uppercase tracking-widest hover:bg-[var(--bg-card)] transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            {session?.user && (
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-semibold text-[var(--text-secondary)] hover:text-red-700 hover:bg-red-50 border border-[var(--border-subtle)] transition-colors cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <p className="text-xs text-[var(--text-secondary)]">
          Domain-event history from <code className="font-mono">monolith-api</code> ·{" "}
          <code className="font-mono">GET /api/v1/audit/logs</code> · scope{" "}
          <span className="font-mono font-bold text-[var(--text-primary)]">{scope || "—"}</span>
        </p>

        {/* Filters */}
        <div className="border border-[var(--border-subtle)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border-subtle)] text-[11px] font-mono font-bold uppercase tracking-widest text-[var(--text-secondary)]">
            <Filter className="w-3.5 h-3.5" />
            Filters
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              applyFilters();
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4">
              {!scopeLocked && (
                <FilterField label="Source App" value={draft.sourceApp}
                  onChange={(v) => setDraft((d) => ({ ...d, sourceApp: v }))}
                  placeholder="continuum-home" />
              )}
              <FilterField label="Domain" value={draft.domain}
                onChange={(v) => setDraft((d) => ({ ...d, domain: v }))}
                placeholder="expenses" />
              <FilterField label="Event Type" value={draft.eventType}
                onChange={(v) => setDraft((d) => ({ ...d, eventType: v }))}
                placeholder="EXPENSE_CREATED" />
              <FilterField label="User ID" value={draft.userId}
                onChange={(v) => setDraft((d) => ({ ...d, userId: v }))}
                placeholder="usr_1" />
              <FilterField label="From" value={draft.from}
                onChange={(v) => setDraft((d) => ({ ...d, from: v }))}
                placeholder="2026-08-01T00:00:00Z" />
            </div>
            <div className="flex items-center gap-3 px-4 pb-4">
              <button
                type="submit"
                className="flex items-center gap-2 px-3 py-2 bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                Apply
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-3 py-2 border border-[var(--border-subtle)] text-xs font-mono font-semibold uppercase tracking-widest hover:bg-[var(--bg-primary)] transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
              <span className="ml-auto text-[11px] font-mono text-[var(--text-secondary)]">
                {entries.length} row{entries.length === 1 ? "" : "s"} loaded
                {cursor ? " · more available" : ""}
              </span>
            </div>
          </form>
        </div>

        {error && (
          <div className="flex items-start gap-2 border border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-3 text-xs">
            <AlertTriangle className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
            <span className="font-mono">{error}</span>
          </div>
        )}

        {/* Table */}
        <div className="border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden">
          <div className="overflow-x-auto">
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
                  <th className="py-3 px-4 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-[var(--text-secondary)]">
                      <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
                      Loading audit log…
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-[var(--text-secondary)] font-sans">
                      No events match these filters.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, i) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {cursor && !loading && (
            <div className="border-t border-[var(--border-subtle)] p-3 text-center">
              <button
                onClick={() => load(applied, "append")}
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
        className="px-2.5 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs font-mono focus:outline-none focus:border-[var(--border-strong)] transition-colors"
      />
    </label>
  );
}

function DetailModal({ entry, onClose }: { entry: AuditLogEntry; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[var(--bg-card)] border border-[var(--border-strong)] max-w-2xl w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[var(--accent)]" />
            <span className="font-bold text-sm">{entry.eventType ?? "event"}</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[var(--bg-primary)] transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs font-mono">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Event ID" value={entry.eventId} />
            <Field label="Source App" value={entry.sourceApp} />
            <Field label="Domain" value={entry.domain} />
            <Field label="Action" value={entry.action} />
            <Field label="User ID" value={entry.userId} />
            <Field label="Entity ID" value={entry.entityId} />
            <Field label="Item Count" value={entry.itemCount != null ? String(entry.itemCount) : null} />
            <Field label="Occurred At" value={entry.occurredAt} />
            <Field label="Received At" value={entry.receivedAt} />
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
              Payload
            </span>
            <pre className="mt-1.5 p-3 bg-[var(--text-primary)] text-[var(--bg-primary)] overflow-x-auto text-[11px] leading-relaxed">
              {entry.payload == null ? "null" : JSON.stringify(entry.payload, null, 2)}
            </pre>
          </div>
        </div>
      </div>
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
  "payload",
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
      r.payload == null ? "" : JSON.stringify(r.payload),
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
