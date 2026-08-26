import React from "react";
import Link from "next/link";
import { MonolithLogo } from "@/components/MonolithLogo";

export const metadata = {
  title: "Terms of Service — Monolith",
  description: "Public Terms of Service for Monolith personal dashboard application.",
};

export default function TermsPage() {
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
            <Link href="/privacy" className="hover:text-[var(--text-primary)] transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-6 sm:px-8 py-14 space-y-10">
        <div className="space-y-3 border-b border-[var(--border-subtle)] pb-8">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--bg-card)] text-[11px] font-bold text-[var(--text-secondary)] border border-[var(--border-subtle)] uppercase tracking-wider font-mono">
            Legal Agreement
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[var(--text-primary)]">
            Terms of Service
          </h1>
          <p className="text-xs font-mono text-[var(--text-secondary)]">Last updated: August 11, 2026</p>
        </div>

        <div className="space-y-8 text-sm text-[var(--text-secondary)] leading-relaxed font-sans">
          <section className="space-y-2 border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">1. Acceptance of Terms</h2>
            <p>
              By accessing or using <strong className="text-[var(--text-primary)]">Monolith</strong> (&quot;the Application&quot;), you agree to be bound by these Terms of Service. Monolith is a single-owner tool for OpenAPI/auth-based E2E testing of registered apps, and monitoring GitHub Actions activity and scheduled workflows.
            </p>
          </section>

          <section className="space-y-2 border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">2. Purpose of the Application</h2>
            <p>
              <strong className="text-[var(--text-primary)]">Monolith</strong> integrates with Google OAuth solely to authenticate the single account this
              instance is locked to. The Application separately connects to GitHub (via a server-side token) for
              Actions/PR/repo data, and to whatever apps you register for E2E testing (via a credential you provide).
            </p>
          </section>

          <section className="space-y-2 border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">3. Google User Data &amp; Privacy</h2>
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
              , including the Limited Use requirements. Your Google User Data is never sold, shared with third parties, or used for advertising.
            </p>
          </section>

          <section className="space-y-2 border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">4. User Responsibilities</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree not to use the Application for any unlawful or unauthorized purpose.
            </p>
          </section>

          <section className="space-y-2 border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">5. Disclaimer of Warranties</h2>
            <p>
              Monolith is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, whether express or implied. We do not guarantee uninterrupted or error-free operation of the service.
            </p>
          </section>

          <section className="space-y-2 border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">6. Contact Information</h2>
            <p>
              If you have any questions regarding these Terms of Service, please contact us at{" "}
              <a href="mailto:support@adithyakrishnan.com" className="font-semibold text-[var(--text-primary)] underline decoration-[var(--border-subtle)] underline-offset-2 hover:decoration-[var(--text-primary)]">
                support@adithyakrishnan.com
              </a>.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-primary)] py-8 text-center text-xs text-[var(--text-secondary)] font-mono">
        &copy; 2026 Monolith. All rights reserved. &middot;{" "}
        <Link href="/privacy" className="underline hover:text-[var(--text-primary)] transition-colors">
          Privacy Policy
        </Link>
      </footer>
    </div>
  );
}
