"use client";

import React from "react";
import { useSession, signIn } from "next-auth/react";
import { usePathname } from "next/navigation";
import { LogIn } from "lucide-react";
import { MonolithLogo } from "@/components/MonolithLogo";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)]">
        <MonolithLogo size={48} />
        <p className="mt-4 text-xs font-mono text-[var(--text-secondary)] animate-pulse">Authenticating workspace…</p>
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[var(--bg-primary)] px-4 text-center">
        <MonolithLogo size={48} />
        <div className="space-y-1.5">
          <h1 className="font-display font-black text-2xl uppercase tracking-tight text-[var(--text-primary)]">
            Owner access only
          </h1>
          <p className="text-xs text-[var(--text-secondary)] max-w-[320px]">
            This workspace is restricted to the Monolith owner. Sign in with the allow-listed Google
            account to continue.
          </p>
        </div>
        <button
          onClick={() => signIn("google", { callbackUrl: pathname || "/audit" })}
          className="flex items-center gap-2 px-4 py-2.5 border border-[var(--border-strong)] bg-[var(--bg-card)] text-xs font-mono font-bold uppercase tracking-widest text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-colors cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          Sign in with Google
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
