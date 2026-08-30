// Maps a signed-in Google identity to what it may see in the workspace.
//
// DASHBOARD_CLIENTS is JSON: { "<email>": { "scope": "all" | "<sourceApp>", "key": "<monolith bearer>" } }.
// A scoped user's `key` should itself be bound to that app in monolith-api's clients.json, so the
// proxy pinning the scope and monolith-api enforcing it are two independent guards.
// With DASHBOARD_CLIENTS unset, the solo owner is ALLOWED_EMAIL (scope "all") keyed by MONOLITH_API_KEY.

export interface DashboardClient {
  scope: string;
  key: string;
}

function ownerKey(): string {
  return (
    process.env.MONOLITH_API_KEY ||
    process.env.CONTINUUM_BEARER_TOKEN ||
    process.env.CONTINUUM_API_KEY ||
    process.env.API_KEY ||
    ""
  ).trim();
}

function parse(): Record<string, DashboardClient> {
  const out: Record<string, DashboardClient> = {};

  const raw = process.env.DASHBOARD_CLIENTS?.trim();
  if (raw) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("DASHBOARD_CLIENTS is not valid JSON");
    }
    if (parsed && typeof parsed === "object") {
      for (const [email, value] of Object.entries(parsed as Record<string, unknown>)) {
        if (value && typeof value === "object") {
          const v = value as { scope?: unknown; key?: unknown };
          const scope = String(v.scope ?? "").trim();
          const key = String(v.key ?? "").trim();
          if (scope && key) out[email.trim().toLowerCase()] = { scope, key };
        }
      }
    }
  }

  const owner = process.env.ALLOWED_EMAIL?.trim().toLowerCase();
  const key = ownerKey();
  if (owner && key && !out[owner]) {
    out[owner] = { scope: "all", key };
  }

  return out;
}

let cache: Record<string, DashboardClient> | null = null;

export function clientForEmail(email?: string | null): DashboardClient | null {
  if (!email) return null;
  cache ??= parse();
  return cache[email.trim().toLowerCase()] ?? null;
}
