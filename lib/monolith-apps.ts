export interface MonolithAppConfig {
  id: string;
  name: string;
  description: string;
  appUrl: string;
  openApiUrl: string;
  embeddedQuery: string;
  testToken?: string;
  expectedFrameAncestors?: string;
  isDefault?: boolean;
}

export const DEFAULT_MONOLITH_APPS: MonolithAppConfig[] = [
  {
    id: "continuum",
    name: "Continuum Home",
    description: "Personal dashboard hub for expenses, media watchlist, investments & financial health.",
    appUrl: process.env.NEXT_PUBLIC_CONTINUUM_URL || "https://continuum-home.vercel.app",
    openApiUrl: (process.env.NEXT_PUBLIC_CONTINUUM_URL || "https://continuum-home.vercel.app") + "/api/openapi.json",
    embeddedQuery: "",
    testToken: "embedded_test_user_token",
    expectedFrameAncestors: "'self' http://localhost:3000 http://localhost:3001 https://*.vercel.app https://monolith.adithyakrishnan.com;",
    isDefault: true,
  },
  {
    id: "portfolio-ui",
    name: "Portfolio UI",
    description: "Personal portfolio website with interactive stats, projects & blogs.",
    appUrl: "https://adithyakrishnan.com",
    openApiUrl: "https://adithyakrishnan.com/api/openapi.json",
    embeddedQuery: "",
    testToken: "embedded_test_user_token",
    expectedFrameAncestors: "*",
    isDefault: true,
  },
  {
    id: "portfolio-api",
    name: "Portfolio API",
    description: "Backend Spring Boot / Java REST API powering portfolio integrations.",
    appUrl: "https://api.adithyakrishnan.com",
    openApiUrl: "https://api.adithyakrishnan.com/v3/api-docs",
    embeddedQuery: "/actuator/health",
    testToken: "embedded_test_user_token",
    expectedFrameAncestors: "*",
    isDefault: true,
  },
];

const STORAGE_KEY = "monolith_apps_config_v5";

export function getMonolithApps(): MonolithAppConfig[] {
  if (typeof window === "undefined") return DEFAULT_MONOLITH_APPS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_MONOLITH_APPS;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_MONOLITH_APPS;
  } catch (err) {
    console.error("Failed to load monolith app configs from localStorage", err);
    return DEFAULT_MONOLITH_APPS;
  }
}

export function saveMonolithApp(app: MonolithAppConfig): MonolithAppConfig[] {
  const apps = getMonolithApps();
  const index = apps.findIndex((a) => a.id === app.id);
  let updated: MonolithAppConfig[];
  if (index >= 0) {
    updated = [...apps];
    updated[index] = app;
  } else {
    updated = [...apps, app];
  }
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("monolith_apps_updated"));
  }
  return updated;
}

export function deleteMonolithApp(id: string): MonolithAppConfig[] {
  const apps = getMonolithApps();
  const updated = apps.filter((a) => a.id !== id);
  const finalApps = updated.length > 0 ? updated : DEFAULT_MONOLITH_APPS;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(finalApps));
    window.dispatchEvent(new Event("monolith_apps_updated"));
  }
  return finalApps;
}

export function resetMonolithAppsToDefault(): MonolithAppConfig[] {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MONOLITH_APPS));
    window.dispatchEvent(new Event("monolith_apps_updated"));
  }
  return DEFAULT_MONOLITH_APPS;
}
