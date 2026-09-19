"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Play, AlertTriangle, FileText } from "lucide-react";
import { WorkspaceHeader } from "@/components/WorkspaceHeader";

interface ReportField {
  name: string;
  type: string;
  required: boolean;
}

interface Report {
  id: string;
  name: string;
  description?: string;
  needsCallerApp: boolean;
  tags?: string[];
  params: ReportField[];
}

const clientOptions = (report: Report, apps: string[]): string[] =>
  report.tags && report.tags.length ? report.tags : apps;

const groupKey = (report: Report): string =>
  report.tags && report.tags.length ? [...report.tags].sort().join(",") : "general";

const groupLabel = (key: string): string => (key === "general" ? "General" : key.split(",").join(" · "));

const CLIENT_FIELD: ReportField = { name: "callerApp", type: "client", required: true };

export function ReportsWorkspace() {
  const [reports, setReports] = useState<Report[]>([]);
  const [apps, setApps] = useState<string[]>([]);
  const [scope, setScope] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [runError, setRunError] = useState<Record<string, string>>({});
  const [note, setNote] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<string>("all");

  const fieldsFor = useCallback(
    (report: Report): ReportField[] => (report.needsCallerApp ? [CLIENT_FIELD, ...report.params] : report.params),
    []
  );

  const loadReports = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const res = await fetch("/api/reports");
      const raw = await res.text();
      const data = raw ? JSON.parse(raw) : null;
      if (!res.ok || !data) throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
      const loaded: Report[] = Array.isArray(data.reports) ? data.reports : [];
      const appList: string[] = Array.isArray(data.apps) ? data.apps : [];
      setReports(loaded);
      setApps(appList);
      setScope(typeof data.scope === "string" ? data.scope : "");
      setValues((prev) => seedDefaults(loaded, appList, prev));
      setTab("general");
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to load reports");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setValue = (reportId: string, name: string, v: string) =>
    setValues((prev) => ({ ...prev, [reportId]: { ...(prev[reportId] ?? {}), [name]: v } }));

  const run = async (report: Report) => {
    const fields = fieldsFor(report);
    const raw = values[report.id] ?? {};

    const missing = fields.filter((f) => f.required && !(raw[f.name] ?? "").trim()).map(labelFor);
    if (missing.length) {
      setRunError((e) => ({ ...e, [report.id]: `Fill in: ${missing.join(", ")}` }));
      return;
    }

    setRunning(report.id);
    setRunError((e) => ({ ...e, [report.id]: "" }));
    setNote((n) => ({ ...n, [report.id]: "" }));
    try {
      const res = await fetch(`/api/reports/${encodeURIComponent(report.id)}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(fields, raw)),
      });
      if (!res.ok) {
        const text = await res.text();
        let message = `HTTP ${res.status}`;
        try {
          const j = JSON.parse(text);
          message = j.detail || j.message || j.error || message;
        } catch {
          if (text) message = text;
        }
        throw new Error(message);
      }
      const csv = await res.text();
      const truncated = res.headers.get("X-Report-Truncated") === "true";
      const rows = csv ? csv.trimEnd().split("\n").length - 1 : 0;
      triggerDownload(`${report.id}-${stamp()}.csv`, csv);
      setNote((n) => ({
        ...n,
        [report.id]: `${rows} row${rows === 1 ? "" : "s"} downloaded${truncated ? " · row cap hit, narrow the range" : ""}`,
      }));
    } catch (err) {
      setRunError((e) => ({ ...e, [report.id]: err instanceof Error ? err.message : "Report run failed" }));
    } finally {
      setRunning(null);
    }
  };

  const heading = useMemo(
    () => (scope && scope.toLowerCase() !== "all" ? scope : "all clients"),
    [scope]
  );

  const tabs = useMemo(() => {
    const keys: string[] = [];
    for (const report of reports) {
      const key = groupKey(report);
      if (!keys.includes(key)) keys.push(key);
    }
    keys.sort((a, b) => (a === "general" ? -1 : b === "general" ? 1 : a.localeCompare(b)));
    return keys.length > 1 ? keys.map((k) => ({ key: k, label: groupLabel(k) })) : [];
  }, [reports]);

  const activeTab = tabs.some((t) => t.key === tab) ? tab : tabs[0]?.key ?? "";
  const visibleReports = tabs.length ? reports.filter((r) => groupKey(r) === activeTab) : reports;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <WorkspaceHeader
        actions={
          <button
            onClick={loadReports}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 border border-[var(--border-subtle)] text-[10px] sm:text-xs font-mono font-semibold uppercase tracking-widest hover:bg-[var(--bg-card)] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        }
      />

      <main className="flex-1 max-w-[1100px] w-full mx-auto p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        <p className="text-xs text-[var(--text-secondary)]">
          BigQuery reports for{" "}
          <span className="font-mono font-bold text-[var(--text-primary)]">{heading}</span> · results
          download as CSV.
        </p>

        {listError && (
          <div className="flex items-start gap-2 border border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-3 text-xs">
            <AlertTriangle className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
            <span className="font-mono break-all">{listError}</span>
          </div>
        )}

        {loading ? (
          <div className="border border-[var(--border-subtle)] bg-[var(--bg-card)] p-12 sm:p-16 text-center text-xs text-[var(--text-secondary)] font-mono">
            <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
            Loading reports…
          </div>
        ) : reports.length === 0 ? (
          <div className="border border-[var(--border-subtle)] bg-[var(--bg-card)] p-12 sm:p-16 text-center text-xs text-[var(--text-secondary)] font-sans">
            No reports are allotted to your account.
          </div>
        ) : (
          <div className="space-y-4">
            {tabs.length > 0 && (
              <div className="flex items-center gap-1 border-b border-[var(--border-subtle)] pb-2 overflow-x-auto scrollbar-none">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`px-2.5 py-1 text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-widest whitespace-nowrap transition-colors cursor-pointer ${
                      activeTab === t.key
                        ? "bg-[var(--text-primary)] text-[var(--bg-primary)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {visibleReports.map((report) => {
              const fields = fieldsFor(report);
              const options = clientOptions(report, apps);
              return (
                <div key={report.id} className="border border-[var(--border-subtle)] bg-[var(--bg-card)]">
                  <div className="px-3.5 sm:px-4 py-3 border-b border-[var(--border-subtle)] flex items-start gap-2.5 sm:gap-3">
                    <FileText className="w-4 h-4 text-[var(--accent)] mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm">{report.name}</span>
                        {(report.tags ?? []).map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 border border-[var(--border-subtle)] text-[var(--text-secondary)]"
                          >
                            {tag} only
                          </span>
                        ))}
                      </div>
                      {report.description && (
                        <div className="text-xs text-[var(--text-secondary)] mt-0.5">{report.description}</div>
                      )}
                      <div className="text-[10px] font-mono text-[var(--text-secondary)] mt-0.5 break-all">
                        {report.id}
                      </div>
                    </div>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      run(report);
                    }}
                    className="p-3.5 sm:p-4 space-y-4"
                  >
                    {fields.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {fields.map((field) => (
                          <label key={field.name} className="flex flex-col gap-1">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                              {labelFor(field)}
                              {field.required && <span className="text-[var(--accent)]"> *</span>}
                              {field.type !== "client" && <span className="opacity-60"> · {field.type}</span>}
                            </span>
                            <FieldInput
                              field={field}
                              options={options}
                              value={values[report.id]?.[field.name] ?? ""}
                              onChange={(v) => setValue(report.id, field.name, v)}
                            />
                          </label>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <button
                        type="submit"
                        disabled={running === report.id}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer w-full sm:w-auto"
                      >
                        {running === report.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                        Run &amp; download CSV
                      </button>
                      {runError[report.id] && (
                        <span className="flex items-center gap-1.5 text-[11px] font-mono text-red-700 break-all">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          {runError[report.id]}
                        </span>
                      )}
                      {note[report.id] && !runError[report.id] && (
                        <span className="text-[11px] font-mono text-[var(--text-secondary)] break-all">
                          {note[report.id]}
                        </span>
                      )}
                    </div>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function FieldInput({
  field,
  options,
  value,
  onChange,
}: {
  field: ReportField;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const cls =
    "px-2.5 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs font-mono focus:outline-none focus:border-[var(--border-strong)] transition-colors disabled:opacity-70 disabled:cursor-not-allowed w-full";

  if (field.type === "client") {
    return (
      <select
        className={`${cls} cursor-pointer`}
        value={value}
        disabled={options.length <= 1}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.length !== 1 && <option value="">Select a client…</option>}
        {options.map((app) => (
          <option key={app} value={app}>
            {app}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "bool") {
    return (
      <select className={`${cls} cursor-pointer`} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  }

  const inputType =
    field.type === "timestamp"
      ? "datetime-local"
      : field.type === "date"
      ? "date"
      : field.type === "int64"
      ? "number"
      : "text";

  return (
    <input
      type={inputType}
      required={field.required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cls}
    />
  );
}

function labelFor(field: ReportField): string {
  return field.type === "client" ? "client" : field.name;
}

function toPayload(fields: ReportField[], raw: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of fields) {
    const v = (raw[field.name] ?? "").trim();
    if (!v) continue;
    if (field.type === "timestamp") {
      const d = new Date(v);
      out[field.name] = Number.isNaN(d.getTime()) ? v : d.toISOString();
    } else {
      out[field.name] = v;
    }
  }
  return out;
}

function seedDefaults(
  reports: Report[],
  apps: string[],
  existing: Record<string, Record<string, string>>
): Record<string, Record<string, string>> {
  const next = { ...existing };
  const monthAgo = localDateTime(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  for (const report of reports) {
    const seed: Record<string, string> = {};
    const options = clientOptions(report, apps);
    if (report.needsCallerApp && options.length === 1 && !next[report.id]?.callerApp) {
      seed.callerApp = options[0];
    }
    for (const param of report.params) {
      if (param.required && param.type === "timestamp" && !next[report.id]?.[param.name]) {
        seed[param.name] = monthAgo;
      }
    }
    if (Object.keys(seed).length) {
      next[report.id] = { ...(next[report.id] ?? {}), ...seed };
    }
  }
  return next;
}

function localDateTime(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function stamp(): string {
  return new Date().toISOString().slice(0, 16).replace(/[:T]/g, "").replace(/(\d{8})(\d{4})/, "$1-$2");
}

function triggerDownload(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
