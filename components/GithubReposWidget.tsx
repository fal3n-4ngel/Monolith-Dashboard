"use client";

import React, { useEffect, useState } from "react";
import { GitFork, Star, RefreshCw } from "lucide-react";
import { fetchApi } from "@/lib/api-client";

interface GithubRepo {
  name: string;
  fullName: string;
  description?: string;
  url: string;
  language?: string;
  stars: number;
  updatedAt: string;
}

export function GithubReposWidget() {
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRepos = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApi<{ repos: GithubRepo[] }>("/api/github/repos", force ? { cache: "no-store" } : {});
      setRepos(Array.isArray(data?.repos) ? data.repos : []);
    } catch (err) {
      setRepos([]);
      setError((err instanceof Error ? err.message : String(err)) || "Failed to load repos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepos();
  }, []);

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] p-4 font-sans space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Recent Repos</div>
        <button onClick={() => loadRepos(true)} className="p-0.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title="Refresh">
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="py-4 text-center text-[11px] text-[var(--text-secondary)] font-mono">Loading repos...</div>
      ) : error ? (
        <div className="py-4 text-center text-[11px] text-red-500 font-mono">{error}</div>
      ) : repos.length === 0 ? (
        <div className="py-4 text-center text-[11px] text-[var(--text-secondary)] font-mono">No repos found.</div>
      ) : (
        <div className="space-y-1.5 max-h-[92px] overflow-y-auto pr-1">
          {repos.slice(0, 3).map((repo) => (
            <a
              key={repo.fullName}
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-[var(--bg-primary)] transition-colors text-xs"
            >
              <div className="flex items-center space-x-1.5 min-w-0">
                <GitFork className="w-3 h-3 text-[var(--text-secondary)] shrink-0" />
                <span className="font-semibold text-[var(--text-primary)] truncate">{repo.name}</span>
              </div>
              <div className="flex items-center space-x-1 text-[10px] text-[var(--text-secondary)] font-mono shrink-0">
                <Star className="w-3 h-3" />
                <span>{repo.stars ?? 0}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
