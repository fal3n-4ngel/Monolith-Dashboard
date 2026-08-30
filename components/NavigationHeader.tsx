"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Home as HomeIcon,
  ChevronDown,
  LogOut,
  LogIn,
  GitFork,
} from "lucide-react";
import { MonolithLogo } from "@/components/MonolithLogo";

const NAV_LINKS = [{ href: "/github", label: "GitHub", icon: GitFork }];

export function NavigationHeader() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isHome = pathname === "/";
  const headerLabel = isHome ? "Monolith Telemetry Hub" : "Monolith Workspace";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  useEffect(() => setMenuOpen(false), [pathname]);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  const handleSignIn = () => {
    signIn("google", { callbackUrl: pathname && pathname !== "/" ? pathname : "/audit" });
  };

  return (
    <header className="sticky top-0 z-40 bg-[var(--bg-primary)]/90 backdrop-blur-md border-b border-[var(--border-subtle)]">
      <div className="max-w-[1750px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left Section: Nav Controls & Dashboard Menu */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="flex items-center space-x-1 text-[var(--text-secondary)]">
            <button
              onClick={() => window.history.back()}
              className="p-1 hover:bg-[var(--border-subtle)]/60 hover:text-[var(--text-primary)] transition-colors"
              title="Go back"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.history.forward()}
              className="p-1 hover:bg-[var(--border-subtle)]/60 hover:text-[var(--text-primary)] transition-colors"
              title="Go forward"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.location.reload()}
              className="p-1 hover:bg-[var(--border-subtle)]/60 hover:text-[var(--text-primary)] transition-colors"
              title="Refresh page"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            {!isHome && (
              <Link
                href="/"
                className="p-1 hover:bg-[var(--border-subtle)]/60 hover:text-[var(--text-primary)] transition-colors"
                title="Home"
              >
                <HomeIcon className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* Title + Navigation Dropdown */}
          <div className="relative border-l border-[var(--border-subtle)] pl-3" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center space-x-2 px-2.5 py-1 hover:bg-[var(--border-subtle)]/60 transition-all font-bold text-xs text-[var(--text-primary)] group"
            >
              <MonolithLogo size={22} />
              <span>{headerLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-transform ${menuOpen ? "rotate-180" : ""}`} />
            </button>

            {menuOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 border border-[var(--border-strong)] bg-[var(--bg-card)] p-2 z-50 animate-fadeIn">
                <Link
                  href="/audit"
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold transition-colors ${
                    pathname === "/audit" ? "bg-[var(--text-primary)] text-[var(--bg-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <HomeIcon className="w-3.5 h-3.5" />
                  <span>Audit Dashboard</span>
                </Link>

                <div className="my-1.5 border-t border-[var(--border-subtle)]" />

                <div className="grid grid-cols-1 gap-0.5">
                  {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href;
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold transition-colors ${
                          active ? "bg-[var(--text-primary)] text-[var(--bg-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Avatar & Sign Out, or Sign In */}
        <div className="flex items-center space-x-3 text-xs font-semibold text-[var(--text-secondary)]">
          {session?.user ? (
            <div className="flex items-center space-x-2.5">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-6.5 h-6.5 rounded-full border border-[var(--border-subtle)]"
                />
              ) : (
                <div className="w-6.5 h-6.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] flex items-center justify-center text-[10px] font-bold">
                  {session.user.name?.[0] || "A"}
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-semibold text-[var(--text-secondary)] hover:text-red-700 hover:bg-red-50 border border-[var(--border-subtle)] transition-colors cursor-pointer"
                title="Log out and redirect to landing page"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          ) : (
            status !== "loading" && (
              <button
                onClick={handleSignIn}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-semibold text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] border border-[var(--border-strong)] transition-colors cursor-pointer"
                title="Sign in with the allow-listed Google account"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign in</span>
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
}
