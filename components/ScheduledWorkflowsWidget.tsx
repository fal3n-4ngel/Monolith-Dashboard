"use client";

import React, { useEffect, useState } from "react";
import { Clock, AlertTriangle, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { fetchApi } from "@/lib/api-client";

interface ScheduledWorkflow {
  repo: string;
  workflowId: number;
  workflowName: string;
  path: string;
  htmlUrl: string;
  cronExpressions: string[];
  lastRun: {
    status: string;
    conclusion: string | null;
    ranAt: string;
    url: string;
  } | null;
  nextExpectedRun: string | null;
  isLate: boolean;
}

function relativeTime(iso?: string | null): string {
  if (!iso) return "never";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

function relativeFuture(iso: string | null): string {
  if (!iso) return "—";
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return "due now";
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `in ${hrs}h`;
  const days = Math.round(hrs / 24);
  return `in ${days}d`;
}

function lastRunBadge(run: ScheduledWorkflow["lastRun"]) {
  if (!run) return { icon: XCircle, label: "No runs", className: "text-[var(--text-secondary)] bg-[var(--bg-primary)] border-[var(--border-subtle)]" };
  if (run.status !== "completed") {
    return { icon: Clock, label: "Running", className: "text-blue-700 bg-blue-50 border-blue-200" };
  }
  if (run.conclusion === "success") {
    return { icon: CheckCircle2, label: "Passed", className: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  }
  if (run.conclusion === "failure") {
    return { icon: XCircle, label: "Failed", className: "text-red-700 bg-red-50 border-red-200" };
  }
  return { icon: XCircle, label: run.conclusion || "Unknown", className: "text-[var(--text-secondary)] bg-[var(--bg-primary)] border-[var(--border-subtle)]" };
}

export function ScheduledWorkflowsWidget() {
  const [workflows, setWorkflows] = useState<ScheduledWorkflow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async (force = false) => {
    setLoading(true);
    const opts = force ? { cache: "no-store" as RequestCache } : {};
    try {
      const res = await fetchApi<{ success: boolean; workflows: ScheduledWorkflow[] }>("/api/github/schedules", opts);
      setWorkflows(res?.success && Array.isArray(res.workflows) ? res.workflows : []);
    } catch {
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const lateCount = workflows.filter((w) => w.isLate).length;

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] p-5 font-sans space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--text-secondary)]" />
          <h3 className="text-xs font-semibold text-[var(--text-primary)]">Scheduled Workflows</h3>
          {lateCount > 0 && (
            <span className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 border text-amber-700 bg-amber-50 border-amber-200">
              <AlertTriangle className="w-3 h-3" />
              {lateCount} late
            </span>
          )}
        </div>
        <button onClick={() => load(true)} className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title="Refresh">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="space-y-1.5 min-h-[100px]">
        {loading ? (
          <div className="py-6 text-center text-xs text-[var(--text-secondary)] font-mono">Scanning workflow schedules...</div>
        ) : workflows.length === 0 ? (
          <div className="py-6 text-center text-xs text-[var(--text-secondary)] font-mono">No cron-scheduled workflows found.</div>
        ) : (
          workflows.map((wf) => {
            const badge = lastRunBadge(wf.lastRun);
            const Icon = badge.icon;
            return (
              <a
                key={`${wf.repo}-${wf.workflowId}`}
                href={wf.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-between p-2 rounded-lg hover:bg-[var(--bg-primary)] transition-colors text-xs ${
                  wf.isLate ? "bg-amber-50/50" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-[var(--text-primary)] truncate">{wf.workflowName}</span>
                    {wf.isLate && <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />}
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)] font-mono truncate">
                    {wf.repo.split("/")[1]} · {wf.cronExpressions.join(", ")} · last {relativeTime(wf.lastRun?.ranAt)} · next {relativeFuture(wf.nextExpectedRun)}
                  </div>
                </div>
                <span
                  className={`shrink-0 ml-2 flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 border ${badge.className}`}
                >
                  <Icon className="w-3 h-3" />
                  {badge.label}
                </span>
              </a>
            );
          })
        )}
      </div>
    </div>
  );
}
