"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  MonolithAppConfig,
  getMonolithApps,
  saveMonolithApp,
  deleteMonolithApp,
  resetMonolithAppsToDefault,
} from "@/lib/monolith-apps";
import { NavigationHeader } from "@/components/NavigationHeader";
import { MonolithLogo } from "@/components/MonolithLogo";
import {
  LayoutGrid,
  Plus,
  Play,
  RefreshCw,
  Edit2,
  Trash2,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Smartphone,
  Tablet,
  Monitor,
  Laptop,
  Code2,
  Activity,
  Maximize2,
  Minimize2,
  Key,
} from "lucide-react";

function E2ESuiteContent() {
  const [apps, setApps] = useState<MonolithAppConfig[]>([]);
  const [activeAppId, setActiveAppId] = useState<string>("");
  const [viewportSize, setViewportSize] = useState<"desktop" | "laptop" | "tablet" | "mobile">("desktop");
  const [isFullWidth, setIsFullWidth] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);
  const [iframeError, setIframeError] = useState<boolean>(false);

  // Diagnostic Test Results State
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [testReport, setTestReport] = useState<any | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingApp, setEditingApp] = useState<Partial<MonolithAppConfig>>({
    name: "",
    description: "",
    appUrl: "",
    openApiUrl: "",
    embeddedQuery: "?embedded=true&theme=monolith",
    testToken: "embedded_test_user_token",
    expectedFrameAncestors: "*",
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  // Load Apps on Mount & Handle Custom Window Events
  useEffect(() => {
    const loadedApps = getMonolithApps();
    setApps(loadedApps);

    const queryAppId = searchParams.get("app");
    if (queryAppId && loadedApps.some((a) => a.id === queryAppId)) {
      setActiveAppId(queryAppId);
    } else if (loadedApps.length > 0) {
      setActiveAppId(loadedApps[0].id);
    }

    const handleUpdate = () => setApps(getMonolithApps());
    window.addEventListener("monolith_apps_updated", handleUpdate);
    return () => window.removeEventListener("monolith_apps_updated", handleUpdate);
  }, [searchParams]);

  const selectApp = (id: string) => {
    setActiveAppId(id);
    router.push(`/?app=${id}`, { scroll: false });
  };

  const activeApp = apps.find((a) => a.id === activeAppId) || apps[0];

  const getFullEmbeddedUrl = (app?: MonolithAppConfig) => {
    if (!app) return "";
    const base = app.appUrl.replace(/\/$/, "");
    const query = app.embeddedQuery
      ? app.embeddedQuery.startsWith("?") || app.embeddedQuery.startsWith("/")
        ? app.embeddedQuery
        : `/${app.embeddedQuery}`
      : "";
    return `${base}${query}`;
  };

  // Run E2E Test Suite via API
  const handleRunE2ETests = async () => {
    if (!activeApp) return;
    setIsRunningTests(true);
    setTestReport(null);

    try {
      const res = await fetch("/api/e2e", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appUrl: activeApp.appUrl,
          openApiUrl: activeApp.openApiUrl,
          testToken: activeApp.testToken,
        }),
      });

      const data = await res.json();
      setTestReport(data);
    } catch (err: any) {
      setTestReport({
        error: `Diagnostic test runner failure: ${err.message}`,
        e2eResults: [{ name: "Test Execution", status: "fail", message: err.message }],
      });
    } finally {
      setIsRunningTests(false);
    }
  };

  // Run test whenever active app changes
  useEffect(() => {
    if (activeApp) {
      setIframeLoaded(false);
      setIframeError(false);
      setIframeKey((prev) => prev + 1);
      handleRunE2ETests();
    }
  }, [activeAppId]);

  // Modal Handlers
  const handleOpenAddModal = () => {
    setModalMode("add");
    setEditingApp({
      id: `app-${Date.now()}`,
      name: "",
      description: "",
      appUrl: "https://continuum-home.vercel.app",
      openApiUrl: "https://continuum-home.vercel.app/api/openapi.json",
      embeddedQuery: "?embedded=true&theme=monolith",
      testToken: "embedded_test_user_token",
      expectedFrameAncestors: "*",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (app: MonolithAppConfig) => {
    setModalMode("edit");
    setEditingApp({ ...app });
    setIsModalOpen(true);
  };

  const handleSaveApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp.name || !editingApp.appUrl) return;

    const appToSave: MonolithAppConfig = {
      id: editingApp.id || `app-${Date.now()}`,
      name: editingApp.name,
      description: editingApp.description || "",
      appUrl: editingApp.appUrl,
      openApiUrl: editingApp.openApiUrl || "/api/openapi.json",
      embeddedQuery: editingApp.embeddedQuery || "?embedded=true&theme=monolith",
      testToken: editingApp.testToken || "embedded_test_user_token",
      expectedFrameAncestors: editingApp.expectedFrameAncestors || "*",
      isDefault: editingApp.isDefault || false,
    };

    const updated = saveMonolithApp(appToSave);
    setApps(updated);
    setActiveAppId(appToSave.id);
    setIsModalOpen(false);
  };

  const handleDeleteApp = (id: string) => {
    const updated = deleteMonolithApp(id);
    setApps(updated);
    if (updated.length > 0) {
      setActiveAppId(updated[0].id);
    }
  };

  const handleResetDefaults = () => {
    const defaults = resetMonolithAppsToDefault();
    setApps(defaults);
    if (defaults.length > 0) {
      setActiveAppId(defaults[0].id);
    }
  };

  // Viewport Container Widths
  const getViewportWidthClass = () => {
    switch (viewportSize) {
      case "mobile":
        return "max-w-[375px]";
      case "tablet":
        return "max-w-[768px]";
      case "laptop":
        return "max-w-[1024px]";
      case "desktop":
      default:
        return "w-full";
    }
  };

  const warningCount = testReport?.e2eResults?.filter((r: any) => r.status === "warning").length || 0;
  const failCount = testReport?.e2eResults?.filter((r: any) => r.status === "fail").length || 0;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FBFBFA] text-[#1A1A1A]">
      <NavigationHeader />

      <main className="flex-1 max-w-[1750px] w-full mx-auto p-4 sm:p-5 lg:p-6 space-y-6">
        {/* HEADER & APP SELECTOR */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div>
              <h1 className="text-2xl font-serif font-bold text-[#1A1A1A] tracking-tight flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-stone-400" />
                <span>Monolith E2E Suite</span>
              </h1>
              <p className="text-xs text-stone-500 mt-1 font-serif italic">
                Live embedded frame container and automated OpenAPI E2E schema tests for registered apps.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add App
              </button>
              <button
                onClick={handleResetDefaults}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
                title="Reset apps to defaults"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset Defaults
              </button>
            </div>
          </div>

          {/* App Selector Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {apps.map((app) => {
              const isActive = app.id === activeAppId;
              return (
                <button
                  key={app.id}
                  onClick={() => selectApp(app.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-[#1A1A1A] text-white shadow-xs"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200/80 hover:text-stone-900"
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>{app.name}</span>
                  {app.isDefault && (
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${isActive ? "bg-stone-800 text-stone-300" : "bg-stone-200 text-stone-500"}`}>
                      Preset
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ACTIVE APP SUMMARY & CONTROLS */}
        {activeApp && (
          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-serif font-bold text-[#1A1A1A]">{activeApp.name}</h2>
                  <button
                    onClick={() => handleOpenEditModal(activeApp)}
                    className="p-1 text-stone-400 hover:text-stone-800 transition-colors flex items-center gap-1 text-xs font-medium bg-stone-100 px-2 py-0.5 rounded-lg"
                    title="Edit App Configuration"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Configure Token &amp; URLs
                  </button>
                  {!activeApp.isDefault && (
                    <button
                      onClick={() => handleDeleteApp(activeApp.id)}
                      className="p-1 text-stone-400 hover:text-red-600 transition-colors"
                      title="Delete App"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-stone-500 leading-relaxed">{activeApp.description}</p>
                <div className="flex flex-wrap gap-4 pt-1 font-mono text-[11px] text-stone-500">
                  <span><strong className="text-stone-800">App URL:</strong> {activeApp.appUrl}</span>
                  <span><strong className="text-stone-800">OpenAPI Spec:</strong> {activeApp.openApiUrl}</span>
                  <span><strong className="text-stone-800">Test Bearer Token:</strong> {activeApp.testToken ? `${activeApp.testToken.substring(0, 14)}...` : "None"}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={isRunningTests}
                  onClick={handleRunE2ETests}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors disabled:opacity-50"
                >
                  {isRunningTests ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Testing Protected Routes...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" /> Run E2E Test Suite
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Diagnostic Summary Badges */}
            {testReport && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-stone-100">
                <div className={`flex items-center gap-3 rounded-xl border p-3 ${
                  testReport.openApiStatus?.valid ? "border-emerald-200 bg-emerald-50/50 text-emerald-900" : "border-red-200 bg-red-50/50 text-red-900"
                }`}>
                  {testReport.openApiStatus?.valid ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                  )}
                  <div>
                    <div className="font-mono text-xs font-bold uppercase">OpenAPI Spec</div>
                    <div className="text-[11px] opacity-90">
                      {testReport.openApiStatus?.valid ? `${testReport.openApiStatus.pathCount} route(s) verified` : "Spec fetch error"}
                    </div>
                  </div>
                </div>

                <div className={`flex items-center gap-3 rounded-xl border p-3 ${
                  testReport.cspStatus?.allowed ? "border-emerald-200 bg-emerald-50/50 text-emerald-900" : "border-red-200 bg-red-50/50 text-red-900"
                }`}>
                  {testReport.cspStatus?.allowed ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                  )}
                  <div>
                    <div className="font-mono text-xs font-bold uppercase">CSP Frame Ancestors</div>
                    <div className="text-[11px] opacity-90 truncate max-w-[220px]">
                      {testReport.cspStatus?.allowed ? "Embedding Permitted" : testReport.cspStatus?.details}
                    </div>
                  </div>
                </div>

                <div className={`flex items-center gap-3 rounded-xl border p-3 ${
                  failCount > 0
                    ? "border-red-200 bg-red-50/50 text-red-900"
                    : "border-emerald-200 bg-emerald-50/50 text-emerald-900"
                }`}>
                  <Activity className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="font-mono text-xs font-bold uppercase">E2E Assertions</div>
                    <div className="text-[11px] opacity-90">
                      {testReport.e2eResults?.filter((r: any) => r.status === "pass").length} / {testReport.e2eResults?.length || 0} passed
                    </div>
                  </div>
                </div>

                <div className={`flex items-center gap-3 rounded-xl border p-3 ${
                  warningCount > 0 ? "border-amber-200 bg-amber-50/50 text-amber-900" : "border-stone-200 bg-stone-50/50 text-stone-600"
                }`}>
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="font-mono text-xs font-bold uppercase">Warnings</div>
                    <div className="text-[11px] opacity-90">{warningCount} flagged</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SPLIT VIEW WORKSPACE: LOGS + LIVE IFRAME VIEWPORT */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* LEFT PANEL (4 cols): E2E LOGS & OPENAPI ROUTES */}
          <div className={`${isFullWidth ? "hidden" : "xl:col-span-4"} bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs space-y-4`}>
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
                <Activity className="w-4 h-4 text-stone-400" /> E2E Assertions &amp; Routes
              </h3>
              <span className="font-mono text-[10px] uppercase text-stone-400">Diagnostic Log</span>
            </div>

            {testReport ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="font-mono text-xs font-bold text-stone-600 uppercase">Lifecycle Assertions</span>
                  <div className="space-y-2">
                    {testReport.e2eResults?.map((res: any, idx: number) => (
                      <div
                        key={idx}
                        className={`flex items-start justify-between gap-3 rounded-xl border p-3 text-xs ${
                          res.status === "warning" ? "border-amber-200 bg-amber-50/50" : "border-stone-100 bg-stone-50/60"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {res.status === "pass" ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                          ) : res.status === "warning" ? (
                            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                          ) : res.status === "skipped" ? (
                            <Key className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                          )}
                          <div>
                            <div className="font-bold text-stone-900">{res.name}</div>
                            <div className="text-[11px] text-stone-500 mt-0.5">{res.message}</div>
                          </div>
                        </div>
                        {res.latencyMs !== undefined && (
                          <span className="font-mono text-[10px] text-stone-400 shrink-0">{res.latencyMs}ms</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {testReport.openApiStatus?.endpointDetails?.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-mono text-xs font-bold text-stone-600 uppercase">
                      OpenAPI Endpoints ({testReport.openApiStatus.endpointDetails.length})
                    </span>
                    <div className="max-h-[300px] overflow-y-auto rounded-xl border border-stone-200">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-stone-200 bg-stone-50 text-[10px] font-bold uppercase text-stone-500 sticky top-0">
                          <tr>
                            <th className="p-2.5">Method</th>
                            <th className="p-2.5">Path</th>
                            <th className="p-2.5">Consequential</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                          {testReport.openApiStatus.endpointDetails.map((ep: any, i: number) => (
                            <tr key={i} className="hover:bg-stone-50/80">
                              <td className="p-2.5 font-bold">
                                <span
                                  className={`rounded px-1.5 py-0.5 text-[9px] uppercase ${
                                    ep.method === "GET"
                                      ? "bg-blue-50 text-blue-700"
                                      : ep.method === "POST"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : ep.method === "DELETE"
                                      ? "bg-red-50 text-red-700"
                                      : "bg-amber-50 text-amber-700"
                                  }`}
                                >
                                  {ep.method}
                                </span>
                              </td>
                              <td className="p-2.5 text-stone-800 truncate max-w-[180px]">{ep.path}</td>
                              <td className="p-2.5">
                                {ep.isConsequentialValid ? (
                                  <span className="text-emerald-600 font-bold">Valid</span>
                                ) : (
                                  <span className="text-amber-600 font-bold" title="Missing x-openai-isConsequential: false marker">
                                    Missing Marker
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-stone-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <p className="text-xs font-mono">Running automated diagnostics...</p>
              </div>
            )}
          </div>

          {/* RIGHT PANEL (8 or 12 cols): LIVE IFRAME VIEWPORT */}
          <div className={`${isFullWidth ? "col-span-12" : "xl:col-span-8"} bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs space-y-4`}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
                <button
                  onClick={() => setViewportSize("desktop")}
                  className={`p-1.5 rounded-lg text-xs transition-all ${
                    viewportSize === "desktop" ? "bg-white text-stone-900 font-bold shadow-xs" : "text-stone-500 hover:text-stone-900"
                  }`}
                  title="Desktop (100%)"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewportSize("laptop")}
                  className={`p-1.5 rounded-lg text-xs transition-all ${
                    viewportSize === "laptop" ? "bg-white text-stone-900 font-bold shadow-xs" : "text-stone-500 hover:text-stone-900"
                  }`}
                  title="Laptop (1024px)"
                >
                  <Laptop className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewportSize("tablet")}
                  className={`p-1.5 rounded-lg text-xs transition-all ${
                    viewportSize === "tablet" ? "bg-white text-stone-900 font-bold shadow-xs" : "text-stone-500 hover:text-stone-900"
                  }`}
                  title="Tablet (768px)"
                >
                  <Tablet className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewportSize("mobile")}
                  className={`p-1.5 rounded-lg text-xs transition-all ${
                    viewportSize === "mobile" ? "bg-white text-stone-900 font-bold shadow-xs" : "text-stone-500 hover:text-stone-900"
                  }`}
                  title="Mobile (375px)"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs font-semibold">
                <button
                  onClick={() => setIsFullWidth((prev) => !prev)}
                  className="flex items-center gap-1 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-lg transition-colors"
                  title={isFullWidth ? "Switch to Split View" : "Expand Viewport Full Width"}
                >
                  {isFullWidth ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5" /> Split View
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5" /> Full Width
                    </>
                  )}
                </button>
                <button
                  onClick={() => setIframeKey((prev) => prev + 1)}
                  className="flex items-center gap-1 text-stone-500 hover:text-stone-900 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Reload
                </button>
                <a
                  href={getFullEmbeddedUrl(activeApp)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-stone-500 hover:text-stone-900 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Direct
                </a>
              </div>
            </div>

            {/* Browser Window Mockup Container */}
            <div className="flex flex-col items-center w-full">
              <div className={`w-full transition-all duration-300 ${getViewportWidthClass()}`}>
                <div className="flex flex-col rounded-2xl border border-stone-200 bg-stone-900 shadow-xl overflow-hidden h-[620px]">
                  {/* Window Bar Mockup */}
                  <div className="flex items-center gap-2 border-b border-stone-800 bg-stone-900 px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    </div>
                    <div className="flex-1 rounded-lg border border-stone-800 bg-stone-950 px-3 py-1 font-mono text-[11px] text-stone-400 truncate">
                      {getFullEmbeddedUrl(activeApp)}
                    </div>
                  </div>

                  {/* Iframe Frame */}
                  <div className="relative flex-1 w-full h-full bg-white">
                    {(!iframeLoaded && !iframeError) && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-stone-50 p-4 text-center">
                        <RefreshCw className="w-6 h-6 animate-spin text-stone-400 mb-2" />
                        <span className="font-mono text-xs text-stone-500">Loading Embedded App Frame...</span>
                      </div>
                    )}

                    <iframe
                      key={iframeKey}
                      ref={iframeRef}
                      title={`Monolith App View - ${activeApp?.name}`}
                      src={getFullEmbeddedUrl(activeApp)}
                      onLoad={() => setIframeLoaded(true)}
                      onError={() => setIframeError(true)}
                      className="w-full h-full border-none"
                      sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ADD / EDIT DYNAMIC APP MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  {modalMode === "add" ? "Add Dynamic App Configuration" : "Edit App Configuration"}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-800 font-bold">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveApp} className="space-y-4">
                <div className="space-y-1">
                  <label className="font-mono text-xs font-bold text-stone-600 uppercase">App Name *</label>
                  <input
                    type="text"
                    required
                    value={editingApp.name || ""}
                    onChange={(e) => setEditingApp({ ...editingApp, name: e.target.value })}
                    placeholder="e.g. Continuum Home"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-900 focus:border-stone-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-xs font-bold text-stone-600 uppercase">Description</label>
                  <input
                    type="text"
                    value={editingApp.description || ""}
                    onChange={(e) => setEditingApp({ ...editingApp, description: e.target.value })}
                    placeholder="Short description of the app"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-900 focus:border-stone-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-xs font-bold text-stone-600 uppercase">App Base URL *</label>
                  <input
                    type="url"
                    required
                    value={editingApp.appUrl || ""}
                    onChange={(e) => setEditingApp({ ...editingApp, appUrl: e.target.value })}
                    placeholder="http://localhost:3000 or https://monolith.adithyakrishnan.com"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-900 font-mono focus:border-stone-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-xs font-bold text-stone-600 uppercase">OpenAPI Spec URL</label>
                  <input
                    type="text"
                    value={editingApp.openApiUrl || ""}
                    onChange={(e) => setEditingApp({ ...editingApp, openApiUrl: e.target.value })}
                    placeholder="/api/openapi.json or full URL"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-900 font-mono focus:border-stone-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-xs font-bold text-stone-600 uppercase flex items-center justify-between">
                    <span>Test Bearer Token / Session Secret</span>
                    <span className="text-[10px] text-emerald-600 font-normal lowercase">Authenticates protected routes</span>
                  </label>
                  <input
                    type="text"
                    value={editingApp.testToken || ""}
                    onChange={(e) => setEditingApp({ ...editingApp, testToken: e.target.value })}
                    placeholder="Paste NextAuth session token or API bearer secret"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-900 font-mono focus:border-stone-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-xs font-bold text-stone-600 uppercase">Embedded Query String</label>
                  <input
                    type="text"
                    value={editingApp.embeddedQuery || ""}
                    onChange={(e) => setEditingApp({ ...editingApp, embeddedQuery: e.target.value })}
                    placeholder="?embedded=true&theme=monolith"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-900 font-mono focus:border-stone-900 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider hover:bg-black"
                  >
                    Save App &amp; Test
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export function E2ESuite() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FBFBFA]">
          <MonolithLogo size={44} />
        </div>
      }
    >
      <E2ESuiteContent />
    </Suspense>
  );
}
