const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

const cacheMap = new Map<string, { timestamp: number; data: unknown }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const isRelative = endpoint.startsWith("/");
  const url = isRelative && typeof window !== "undefined" ? endpoint : `${API_BASE_URL}${endpoint}`;
  const cacheKey = `${options.method || "GET"}_${url}`;
  const isGet = !options.method || options.method === "GET";
  const bypassCache = options.cache === "no-store";

  if (isGet && !bypassCache && typeof window !== "undefined") {
    const cached = cacheMap.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data as T;
    }
  }

  const defaultHeaders = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${API_KEY}`,
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API Error [${response.status}]: ${errorBody || response.statusText}`);
  }

  const data = await response.json();

  if (isGet) {
    cacheMap.set(cacheKey, { timestamp: Date.now(), data });
  }

  return data as T;
}

// Warms fetchApi's in-memory cache for the dashboard's static-key endpoints
// before Dashboard mounts, so GithubActivityWidget's own fetchApi calls
// resolve from cache instantly instead of showing a "Loading..." flash.
//
// Promise.allSettled so one dead endpoint (e.g. an invalid GitHub token)
// can't block the others — or the loading screen — from resolving.
export async function prefetchDashboardData(): Promise<void> {
  await Promise.allSettled([fetchApi("/api/github/actions"), fetchApi("/api/github/prs")]);
}

