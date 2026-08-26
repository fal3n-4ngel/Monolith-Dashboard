"use client";

import React, { useEffect, useState } from "react";
import { GitPullRequest, CheckCircle2, XCircle, Loader2, CircleDashed, RefreshCw } from "lucide-react";
import { fetchApi } from "@/lib/api-client";

interface ActionRun {
  id: string;
  repo: string;
  name: string;
  status: string; // queued | in_progress | completed
  conclusion?: string; // success | failure | cancelled | ...
  branch?: string;
  url?: string;
  updatedAt?: string;
}

interface PRItem {
  id: string;
  repo: string;
  title: string;
  status: string; // Open | Merged | Closed
  url?: string;
  authorLogin?: string;
  isMine?: boolean;
  updatedAt?: string;
}

function relativeTime(iso?: string): string {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

function runBadge(run: ActionRun) {
  if (run.status !== "completed") {
    return { icon: Loader2, label: "Running", className: "text-blue-700 bg-blue-50 border-blue-200", spin: true };
  }
  if (run.conclusion === "success") {
    return { icon: CheckCircle2, label: "Passed", className: "text-emerald-700 bg-emerald-50 border-emerald-200", spin: false };
  }
  if (run.conclusion === "failure") {
    return { icon: XCircle, label: "Failed", className: "text-red-700 bg-red-50 border-red-200", spin: false };
  }
  return { icon: CircleDashed, label: run.conclusion || "Unknown", className: "text-[var(--text-secondary)] bg-[var(--bg-primary)] border-[var(--border-subtle)]", spin: false };
}

function prBadge(status: string) {
  if (status === "Open") return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (status === "Merged") return "text-purple-700 bg-purple-50 border-purple-200";
  return "text-[var(--text-secondary)] bg-[var(--bg-primary)] border-[var(--border-subtle)]";
}

export function GithubActivityWidget() {
  const [tab, setTab] = useState<"actions" | "prs">("actions");
  const [runs, setRuns] = useState<ActionRun[]>([]);
  const [prs, setPrs] = useState<PRItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async (force = false) => {
    setLoading(true);
    const opts = force ? { cache: "no-store" as RequestCache } : {};
    try {
      const [actionsRes, prsRes] = await Promise.all([
        fetchApi<{ success: boolean; runs: ActionRun[] }>("/api/github/actions", opts),
        fetchApi<{ success: boolean; prs: PRItem[] }>("/api/github/prs", opts),
      ]);
      setRuns(actionsRes?.success && Array.isArray(actionsRes.runs) ? actionsRes.runs : []);
      setPrs(prsRes?.success && Array.isArray(prsRes.prs) ? prsRes.prs : []);
    } catch {
      setRuns([]);
      setPrs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] p-5 font-sans space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center bg-[var(--bg-primary)] p-0.5 rounded-lg border border-[var(--border-subtle)] text-[11px]">
          <button
            onClick={() => setTab("actions")}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
              tab === "actions" ? "bg-[var(--bg-card)] text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Actions
          </button>
          <button
            onClick={() => setTab("prs")}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
              tab === "prs" ? "bg-[var(--bg-card)] text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <GitPullRequest className="w-3 h-3" />
            Pull Requests
          </button>
        </div>
        <button onClick={() => load(true)} className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title="Refresh">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {tab === "actions" ? (
        <div className="space-y-1.5 min-h-[100px]">
          {loading ? (
            <div className="py-6 text-center text-xs text-[var(--text-secondary)] font-mono">Loading runs...</div>
          ) : runs.length === 0 ? (
            <div className="py-6 text-center text-xs text-[var(--text-secondary)] font-mono">No recent workflow runs.</div>
          ) : (
            runs.map((run) => {
              const badge = runBadge(run);
              const Icon = badge.icon;
              return (
                <a
                  key={run.id}
                  href={run.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--bg-primary)] transition-colors text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[var(--text-primary)] truncate">{run.name}</div>
                    <div className="text-[10px] text-[var(--text-secondary)] font-mono truncate">
                      {run.repo.split("/")[1]} · {run.branch} · {relativeTime(run.updatedAt)}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 ml-2 flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 border ${badge.className}`}
                  >
                    <Icon className={`w-3 h-3 ${badge.spin ? "animate-spin" : ""}`} />
                    {badge.label}
                  </span>
                </a>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-1.5 min-h-[100px]">
          {loading ? (
            <div className="py-6 text-center text-xs text-[var(--text-secondary)] font-mono">Loading pull requests...</div>
          ) : prs.length === 0 ? (
            <div className="py-6 text-center text-xs text-[var(--text-secondary)] font-mono">No pull requests found.</div>
          ) : (
            prs.map((pr) => (
              <a
                key={`${pr.repo}-${pr.id}`}
                href={pr.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--bg-primary)] transition-colors text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[var(--text-primary)] truncate">{pr.title}</div>
                  <div className="text-[10px] text-[var(--text-secondary)] font-mono truncate flex items-center gap-1">
                    <span>{pr.repo.split("/")[1]} #{pr.id}</span>
                    <span
                      className={`px-1 py-0.2 rounded font-semibold ${
                        pr.isMine ? "text-blue-700 bg-blue-50" : "text-[var(--text-secondary)] bg-[var(--bg-primary)]"
                      }`}
                    >
                      {pr.isMine ? "You" : pr.authorLogin || "other"}
                    </span>
                  </div>
                </div>
                <span
                  className={`shrink-0 ml-2 text-[9px] font-semibold px-1.5 py-0.5 border ${prBadge(pr.status)}`}
                >
                  {pr.status}
                </span>
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
}
