"use client";

import React from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuditStreamDashboard } from "@/components/AuditStreamDashboard";

export default function AuditPage() {
  return (
    <ProtectedRoute>
      <AuditStreamDashboard />
    </ProtectedRoute>
  );
}
