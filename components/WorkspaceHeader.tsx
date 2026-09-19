"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { MonolithLogo } from "@/components/MonolithLogo";

const TABS = [
  { href: "/audit", label: "Audit Log" },
  { href: "/reports", label: "Reports" },
];

export function WorkspaceHeader({ actions }: { actions?: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const handleSignOut = () => {
    try {
      sessionStorage.clear();
    } catch {
      // ignore
    }
    signOut({ callbackUrl: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-strong)] bg-[var(--bg-primary)]/95 backdrop-blur-md">
      <div className="max-w-[1700px] mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <Link href="/audit" className="flex items-center gap-2">
            <MonolithLogo size={20} />
            <span className="font-display font-black text-base sm:text-lg uppercase tracking-wide">
              Monolith
            </span>
          </Link>
          <nav className="flex items-center border-l border-[var(--border-subtle)] pl-2 sm:pl-4 gap-1">
            {TABS.map((tab) => {
              const active = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider transition-colors ${
                    active
                      ? "bg-[var(--text-primary)] text-[var(--bg-primary)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {actions}
          {session?.user && (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-mono font-semibold text-[var(--text-secondary)] hover:text-red-700 hover:bg-red-50 border border-[var(--border-subtle)] transition-colors cursor-pointer"
              title="Log out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Log out</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
