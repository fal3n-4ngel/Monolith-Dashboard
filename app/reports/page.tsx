"use client";

import React from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ReportsWorkspace } from "@/components/ReportsWorkspace";

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <ReportsWorkspace />
    </ProtectedRoute>
  );
}
