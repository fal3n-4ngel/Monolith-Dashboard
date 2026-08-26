"use client";

import React from "react";
import { NavigationHeader } from "@/components/NavigationHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { GithubActivityWidget } from "@/components/GithubActivityWidget";
import { GithubReposWidget } from "@/components/GithubReposWidget";
import { ScheduledWorkflowsWidget } from "@/components/ScheduledWorkflowsWidget";

export default function GithubPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col font-sans bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <NavigationHeader />

        <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">GitHub &amp; System Telemetry</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Real-time GitHub activity streams, repository status, CI/CD action builds, and Cloud Run health monitoring.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-6">
              <GithubActivityWidget />
              <ScheduledWorkflowsWidget />
            </div>
            <div className="lg:col-span-5 space-y-6">
              <GithubReposWidget />
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
