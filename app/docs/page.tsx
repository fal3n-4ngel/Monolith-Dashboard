import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MonolithLogo } from "@/components/MonolithLogo";
import { MonolithDocs } from "@/components/MonolithDocs";

const GITHUB_ISSUE_URL = "https://github.com/fal3n-4ngel/monolith-dashboard/issues/new/choose";

export const metadata: Metadata = {
  title: "Documentation — Monolith",
  description: "MCP integration, app onboarding, postback payload spec, authentication, and BigQuery architecture reference for Monolith.",
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans">
      <div className="h-1 w-full bg-[var(--text-primary)]" />

      <header className="sticky top-0 z-50 border-b border-[var(--border-strong)] bg-[var(--bg-primary)]/95 backdrop-blur-md">
        <div className="max-w-[1320px] mx-auto px-6 sm:px-8 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <MonolithLogo size={26} />
            <span className="font-display font-black text-xl tracking-wide uppercase">Monolith</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="hidden sm:flex items-center gap-2 text-[11px] font-mono font-semibold uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
            <a
              href={GITHUB_ISSUE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-widest text-[var(--accent)] hover:opacity-70 transition-opacity"
            >
              <span>Open a Integration Ticket</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-[1320px] mx-auto px-6 sm:px-8 py-12 sm:py-16">
        <div className="space-y-3 mb-12 border-b border-[var(--border-subtle)] pb-10">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[var(--text-secondary)]">Documentation</span>
          <h1 className="font-display font-black text-4xl sm:text-6xl leading-[0.95] uppercase tracking-tight">
            Full specification &amp; API reference
          </h1>
          <p className="text-sm text-[var(--text-secondary)] max-w-[640px]">
            MCP integration, adding a new application, postback payload contracts, authentication, and the
            BigQuery schema every registered app streams into.
          </p>
        </div>

        <MonolithDocs />
      </main>

      <footer className="border-t border-[var(--border-strong)] py-10 px-6 sm:px-8">
        <div className="max-w-[1320px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <MonolithLogo size={20} />
            <span className="font-display font-black text-sm uppercase tracking-wide">Monolith</span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-[11px] font-mono font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
            <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">Home</Link>
            <Link href="/terms" className="hover:text-[var(--text-primary)] transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-[var(--text-primary)] transition-colors">Privacy</Link>
            <a
              href={GITHUB_ISSUE_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-[var(--accent)] hover:opacity-70 transition-opacity"
            >
              Report an Issue <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
