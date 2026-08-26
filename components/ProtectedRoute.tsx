"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MonolithLogo } from "@/components/MonolithLogo";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)]">
        <MonolithLogo size={48} />
        <p className="mt-4 text-xs font-mono text-[var(--text-secondary)] animate-pulse">Authenticating workspace...</p>
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return null;
  }

  return <>{children}</>;
}
