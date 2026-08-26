// Shared by app/api/github/{actions,prs,repos}/route.ts and
// lib/mcp/tools/github.ts. GITHUB_TOKEN is optional — unauthenticated
// requests still work, just against public data and a lower rate limit.
export function githubAuthHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    "User-Agent": "Monolith-Dashboard-App",
    Accept: "application/vnd.github.v3+json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function getRecentRepos(count: number): Promise<{ full_name: string }[]> {
  try {
    const res = await fetch(`https://api.github.com/user/repos?sort=updated&per_page=${count}`, {
      headers: githubAuthHeaders(),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
