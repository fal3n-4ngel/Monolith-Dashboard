import React from "react";
import { MonolithLogo } from "@/components/MonolithLogo";

// Shown between a session resolving to "authenticated" and Dashboard's data
// actually being ready (see app/page.tsx) — without it, Dashboard mounted
// immediately and every widget popped in its own "Loading..." state at a
// different moment as each API call resolved.
export function PostLoginLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[var(--bg-primary)]">
      <div className="animate-pulse">
        <MonolithLogo size={48} />
      </div>
      <span className="text-xs font-mono text-[var(--text-secondary)] tracking-wide">Loading your dashboard…</span>
    </div>
  );
}
