import type { Metadata } from "next";
import Link from "next/link";
import { MonolithLogo } from "@/components/MonolithLogo";

export const metadata: Metadata = {
  title: "Privacy Policy — Monolith",
  description: "Public Privacy Policy for Monolith personal dashboard application.",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans">
      <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 backdrop-blur-md py-4 px-6 sm:px-8">
        <div className="max-w-[900px] mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <MonolithLogo size={24} />
            <span className="font-bold text-sm tracking-tight text-[var(--text-primary)]">Monolith</span>
          </Link>
          <div className="flex items-center gap-5 text-xs text-[var(--text-secondary)] font-semibold">
            <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">Home</Link>
            <Link href="/terms" className="hover:text-[var(--text-primary)] transition-colors">Terms of Service</Link>
          </div>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-6 sm:px-8 py-14 space-y-10">
        <div className="space-y-3 border-b border-[var(--border-subtle)] pb-8">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--bg-card)] text-[11px] font-bold text-[var(--text-secondary)] border border-[var(--border-subtle)] uppercase tracking-wider font-mono">
            Privacy Statement
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[var(--text-primary)]">
            Privacy Policy
          </h1>
          <p className="text-xs font-mono text-[var(--text-secondary)]">Last updated: August 11, 2026</p>
        </div>

        <div className="space-y-8 text-sm text-[var(--text-secondary)] leading-relaxed font-sans">
          <section className="space-y-2 border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">1. Overview</h2>
            <p>
              <strong className="text-[var(--text-primary)]">Monolith</strong> is a single-owner tool for two things: OpenAPI/auth-based E2E testing of apps
              you register, and a GitHub Actions monitor (activity, pull requests, repos, and scheduled-workflow status).
            </p>
          </section>

          <section className="space-y-2 border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">2. Google User Data &amp; Access Scopes</h2>
            <p>
              When you authenticate with Google OAuth, Monolith requests read-only access to your basic profile
              information (name, email, profile image) only, to confirm your identity. No additional scopes are requested.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-[var(--text-secondary)]">
              <li>Profile data is used exclusively to display the authenticated user avatar and email, and to verify sign-in against the single allowed account.</li>
              <li>GitHub data (activity, pull requests, repos, workflow runs) is read via a server-side GitHub token, not tied to your Google identity.</li>
              <li>E2E test credentials you configure for a registered app are used only to run that app&apos;s test suite, and are never shared with third parties.</li>
            </ul>
          </section>

          <section className="space-y-2 border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">3. Google API Services Limited Use Compliance</h2>
            <p>
              Monolith&apos;s use and transfer to any other app of information received from Google APIs will adhere to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[var(--text-primary)] underline decoration-[var(--border-subtle)] underline-offset-2 hover:decoration-[var(--text-primary)]"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
          </section>

          <section className="space-y-2 border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">4. Data Sharing &amp; Third Parties</h2>
            <p>
              Your data is never sold, shared, rented, or transferred to any third party or advertising network.
            </p>
          </section>

          <section className="space-y-2 border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">5. Contact Information</h2>
            <p>
              If you have any questions, please contact us at{" "}
              <a href="mailto:support@adithyakrishnan.com" className="font-semibold text-[var(--text-primary)] underline decoration-[var(--border-subtle)] underline-offset-2 hover:decoration-[var(--text-primary)]">
                support@adithyakrishnan.com
              </a>.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-primary)] py-8 text-center text-xs text-[var(--text-secondary)] font-mono">
        &copy; 2026 Monolith. All rights reserved. &middot;{" "}
        <Link href="/terms" className="underline hover:text-[var(--text-primary)] transition-colors">
          Terms of Service
        </Link>
      </footer>
    </div>
  );
}
