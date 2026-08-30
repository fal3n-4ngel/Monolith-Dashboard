import { createHash } from "crypto";

/**
 * Per-instance, in-memory admission control for /api/mcp — no Redis, no external dependency,
 * so this scales to zero cost. It buckets by credential when a bearer token is present (a
 * leaked key replayed from a different IP still hits its own ceiling), falling back to source
 * IP for unauthenticated requests.
 *
 * This mirrors monolith-api's RateLimitFilter design: enforcement is per serverless instance,
 * so the effective global ceiling is roughly `limit x concurrent instances`. That's the
 * correct trade at this scale — MCP tool calls from an IDE agent aren't high-frequency, and a
 * shared counter would mean a network hop (and its own quota) on every single call. The
 * hosting platform's edge network already absorbs volumetric floods below this layer, for free.
 */

const WINDOW_MS = 60_000;
const MAX_TRACKED_BUCKETS = 5_000;
const LIMIT_PER_MINUTE = Number(process.env.MCP_RATE_LIMIT_PER_MINUTE ?? 60);

interface Window {
  count: number;
  startedAt: number;
}

const windows = new Map<string, Window>();

function fingerprint(bearerToken: string): string {
  return createHash("sha256").update(bearerToken).digest("base64url").slice(0, 16);
}

export function resolveMcpClientKey(req: Request): string {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return `key:${fingerprint(auth.slice(7))}`;
  }
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return `ip:${ip}`;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function checkMcpRateLimit(clientKey: string): RateLimitResult {
  if (LIMIT_PER_MINUTE <= 0) return { allowed: true, retryAfterSeconds: 0 };

  const now = Date.now();

  // Bound memory: a client rotating IPs or credentials must not grow the map without limit.
  if (windows.size > MAX_TRACKED_BUCKETS) {
    for (const [key, window] of windows) {
      if (now - window.startedAt > WINDOW_MS) windows.delete(key);
    }
  }

  let window = windows.get(clientKey);
  if (!window || now - window.startedAt > WINDOW_MS) {
    window = { count: 0, startedAt: now };
    windows.set(clientKey, window);
  }
  window.count += 1;

  const retryAfterSeconds = Math.max(1, Math.ceil((window.startedAt + WINDOW_MS - now) / 1000));
  return { allowed: window.count <= LIMIT_PER_MINUTE, retryAfterSeconds };
}
