"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { PlusCircle, ExternalLink, RefreshCw, Ticket, CheckCircle2, Clock, Filter, UserCheck } from "lucide-react";

interface GithubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  html_url: string;
  created_at: string;
  user: {
    login: string;
    avatar_url: string;
    type?: string;
  };
  labels: Array<{ name: string; color: string }>;
  parsedEmail?: string | null;
  parsedSourceApp?: string | null;
}

function extractMetadataFromBody(body?: string | null, title?: string | null) {
  const text = `${title ?? ""}\n${body ?? ""}`;

  // Extract Requester Email Address from markdown template section or general regex
  let email: string | null = null;
  const emailSectionMatch = text.match(/###\s*Requester Email[^\n]*\n+([^\n#\r]+)/i);
  if (emailSectionMatch && emailSectionMatch[1]?.trim()) {
    const candidate = emailSectionMatch[1].trim();
    if (candidate.includes("@")) email = candidate;
  }
  if (!email) {
    const generalEmailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (generalEmailMatch) email = generalEmailMatch[1];
  }

  // Extract sourceApp identifier from template section
  let sourceApp: string | null = null;
  const appSectionMatch = text.match(/###\s*sourceApp identifier[^\n]*\n+([^\n#\r]+)/i);
  if (appSectionMatch && appSectionMatch[1]?.trim()) {
    sourceApp = appSectionMatch[1].trim();
  }

  return { email, sourceApp };
}

export function AppIntegrationTicketsWidget() {
  const { data: session } = useSession();
  const userEmail = session?.user?.email?.toLowerCase().trim() || "";

  const [allTickets, setAllTickets] = useState<GithubIssue[]>([]);
  const [filterMode, setFilterMode] = useState<"my" | "all">("my");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const newTicketUrl = "https://github.com/fal3n-4ngel/monolith-dashboard/issues/new?template=app_integration_request.yml";

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://api.github.com/repos/fal3n-4ngel/monolith-dashboard/issues?state=all&per_page=50");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as GithubIssue[];

      // Strictly filter real GitHub issues (ignore bot PRs, dependabot bumps)
      const realIssues = (Array.isArray(data) ? data : [])
        .filter((issue) => {
          const isBot = issue.user?.login?.includes("[bot]") || issue.user?.type === "Bot";
          const titleLower = issue.title.toLowerCase();
          const isDependabotPr =
            titleLower.startsWith("chore(deps") ||
            titleLower.includes("bump ") ||
            titleLower.includes("dependabot");
          return !isBot && !isDependabotPr;
        })
        .map((issue) => {
          const { email, sourceApp } = extractMetadataFromBody(issue.body, issue.title);
          return {
            ...issue,
            parsedEmail: email,
            parsedSourceApp: sourceApp,
          };
        });

      setAllTickets(realIssues);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load GitHub tickets");
      setAllTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Filter tickets by signed-in user's email if mode is 'my' and user Email exists
  const displayedTickets = allTickets.filter((ticket) => {
    if (filterMode === "my" && userEmail) {
      return (
        ticket.parsedEmail?.toLowerCase().trim() === userEmail ||
        ticket.body?.toLowerCase().includes(userEmail) ||
        ticket.title.toLowerCase().includes(userEmail)
      );
    }
    return true;
  });

  return (
    <div className="border border-[var(--border-strong)] bg-[var(--bg-card)] font-sans">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <Ticket className="w-4 h-4 text-[var(--accent)]" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            App Integration Requests
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 border border-[var(--border-subtle)] text-[var(--text-secondary)]">
            {displayedTickets.length} Tickets
          </span>
        </div>

        <div className="flex items-center gap-2">
          {userEmail && (
            <div className="flex items-center border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[10px] font-mono font-semibold uppercase tracking-wider">
              <button
                onClick={() => setFilterMode("my")}
                className={`px-2 py-1 transition-colors cursor-pointer ${
                  filterMode === "my"
                    ? "bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                My Requests
              </button>
              <button
                onClick={() => setFilterMode("all")}
                className={`px-2 py-1 transition-colors cursor-pointer ${
                  filterMode === "all"
                    ? "bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                All
              </button>
            </div>
          )}

          <button
            onClick={fetchTickets}
            disabled={loading}
            className="p-1 hover:bg-[var(--bg-primary)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            title="Refresh tickets from GitHub"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <a
            href={newTicketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono text-[11px] font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Ticket</span>
          </a>
        </div>
      </div>

      {/* Signed-in Email Filter Status */}
      {userEmail && (
        <div className="flex items-center justify-between px-4 py-1.5 bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-secondary)]">
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-3 h-3 text-[var(--accent)]" />
            <span>Filtering for account:</span>
            <span className="font-bold text-[var(--text-primary)]">{userEmail}</span>
          </div>
          {filterMode === "my" && displayedTickets.length === 0 && allTickets.length > 0 && (
            <button
              onClick={() => setFilterMode("all")}
              className="text-[var(--accent)] hover:underline font-semibold cursor-pointer"
            >
              View all ({allTickets.length}) repo tickets ➔
            </button>
          )}
        </div>
      )}

      {/* Ticket Stream / List */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="py-8 text-center text-xs font-mono text-[var(--text-secondary)]">
            <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
            Fetching integration request tickets from GitHub…
          </div>
        ) : error ? (
          <div className="py-6 text-center text-xs font-mono text-[var(--accent)]">
            {error}
          </div>
        ) : displayedTickets.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <Ticket className="w-8 h-8 text-[var(--text-secondary)] mx-auto opacity-50" />
            <p className="text-xs font-mono text-[var(--text-secondary)]">
              {filterMode === "my" && userEmail
                ? `No integration requests found for ${userEmail}.`
                : "No open integration requests found in repository."}
            </p>
            <div className="flex items-center justify-center gap-3 pt-1">
              <a
                href={newTicketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Submit Integration Ticket</span>
              </a>
              {filterMode === "my" && allTickets.length > 0 && (
                <button
                  onClick={() => setFilterMode("all")}
                  className="px-3 py-1.5 border border-[var(--border-subtle)] text-xs font-mono font-semibold uppercase tracking-wider hover:bg-[var(--bg-primary)] transition-colors cursor-pointer"
                >
                  Show All ({allTickets.length})
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)] border border-[var(--border-subtle)] font-mono text-xs">
            {displayedTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="p-3 flex items-start justify-between gap-3 hover:bg-[var(--bg-primary)] transition-colors group"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate">
                      {ticket.title}
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)] shrink-0">#{ticket.number}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-[var(--text-secondary)]">
                    {ticket.parsedSourceApp && (
                      <span className="px-1.5 py-0.5 border border-[var(--border-subtle)] font-semibold text-[var(--text-primary)]">
                        app: {ticket.parsedSourceApp}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      {ticket.user?.avatar_url ? (
                        <img
                          src={ticket.user.avatar_url}
                          alt={ticket.user.login}
                          className="w-3.5 h-3.5 rounded-full border border-[var(--border-subtle)]"
                        />
                      ) : (
                        <UserCheck className="w-3 h-3 text-[var(--accent)]" />
                      )}
                      <span>{ticket.parsedEmail || ticket.user?.login}</span>
                    </span>
                    <span>·</span>
                    <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${
                      ticket.state === "open"
                        ? "border-amber-600/40 text-amber-700 bg-amber-50"
                        : "border-green-600/40 text-green-700 bg-green-50"
                    }`}
                  >
                    {ticket.state === "open" ? (
                      <>
                        <Clock className="w-3 h-3" />
                        <span>OPEN</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>RESOLVED</span>
                      </>
                    )}
                  </span>

                  <a
                    href={ticket.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:text-[var(--text-primary)] transition-colors text-[var(--text-secondary)]"
                    title="View issue on GitHub"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
