"use client";

import React from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { MonolithLogo } from "@/components/MonolithLogo";
import { AppIntegrationTicketsWidget } from "@/components/AppIntegrationTicketsWidget";
import { ArrowRight, LogOut, FileText, PlusCircle, ShieldAlert } from "lucide-react";

const GITHUB_APP_INTEGRATION_URL =
  "https://github.com/fal3n-4ngel/monolith-dashboard/issues/new?template=app_integration_request.yml";

export default function UnauthorizedPage() {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;

  const handleSwitchAccount = async () => {
    try {
      sessionStorage.clear();
    } catch {
      // ignore
    }
    await signOut({ redirect: false });
    signIn("google", { callbackUrl: "/audit", prompt: "select_account" });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-12 font-sans">
      <div className="max-w-md w-full border border-[var(--border-strong)] bg-[var(--bg-card)] p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Header Logo */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-center gap-2.5">
            <MonolithLogo size={28} />
            <span className="font-display font-black text-xl uppercase tracking-wide">Monolith</span>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 border border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10">
            Unregistered
          </span>
        </div>

        {/* Warning & Main Message */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <h1 className="font-display font-black text-lg sm:text-xl uppercase tracking-tight">
              No Registered Apps Found
            </h1>
          </div>
          
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {userEmail ? (
              <>
                The Google account <code className="font-mono font-bold text-[var(--text-primary)]">{userEmail}</code> authenticated successfully, but has not been provisioned with access to any application audit scope in Monolith.
              </>
            ) : (
              "Your authenticated account has not been provisioned with access to any application audit scope in Monolith."
            )}
          </p>
        </div>

        {/* Action Guidance List */}
        <div className="border-t border-b border-[var(--border-subtle)] py-4 space-y-3 text-xs">
          <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            How to get access:
          </div>

          <a
            href={GITHUB_APP_INTEGRATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-3 border border-[var(--border-strong)] bg-[var(--bg-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-colors group cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[var(--accent)] group-hover:text-[var(--bg-primary)] shrink-0 mt-0.5" />
            <div className="space-y-0.5 min-w-0">
              <div className="font-mono font-bold text-xs uppercase tracking-wide flex items-center gap-1.5">
                <span>Submit App Integration Ticket</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <div className="text-[11px] opacity-80 font-normal">
                Register a new sourceApp, event types, and BigQuery table.
              </div>
            </div>
          </a>

          <Link
            href="/docs"
            className="flex items-start gap-3 p-3 border border-[var(--border-subtle)] hover:bg-[var(--bg-primary)] transition-colors group"
          >
            <FileText className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] shrink-0 mt-0.5" />
            <div className="space-y-0.5 min-w-0">
              <div className="font-mono font-bold text-xs uppercase tracking-wide flex items-center gap-1.5">
                <span>Read Integration Specs</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <div className="text-[11px] text-[var(--text-secondary)] font-normal">
                Learn about telemetry contracts, authentication, and scopes.
              </div>
            </div>
          </Link>
        </div>

        {/* Live Integration Tickets Widget */}
        <div className="pt-2">
          <AppIntegrationTicketsWidget />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={handleSwitchAccount}
            className="flex items-center gap-1.5 px-3 py-2 border border-[var(--border-subtle)] text-xs font-mono font-semibold uppercase tracking-wider text-[var(--text-secondary)] hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch Account</span>
          </button>

          <Link
            href="/"
            className="text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
