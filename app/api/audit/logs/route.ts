import { auth } from "@/lib/nextauth";
import { clientForEmail } from "@/lib/dashboard-clients";

// Server-side proxy for the Monolith audit-log read API.
//
// The browser never sees a Monolith key. Every request is gated on a NextAuth
// session, resolved to a registered dashboard client (DASHBOARD_CLIENTS), and
// forwarded to monolith-api's GET /api/v1/audit/logs with that client's bearer.
// A client scoped to one app has `sourceApp` forced to that app here AND is
// presented a key that monolith-api itself binds to that app — so a bug in one
// layer cannot expose another client's data.

const MONOLITH_API_URL = (
  process.env.MONOLITH_API_URL ||
  process.env.NEXT_PUBLIC_MONOLITH_API_URL ||
  "https://monolith-postbacks.adithyakrishnan.com"
).replace(/\/$/, "");

const FORWARDED_PARAMS = ["userId", "domain", "eventType", "from", "before", "limit"] as const;

export async function GET(req: Request): Promise<Response> {
  const session = await auth();
  const client = clientForEmail(session?.user?.email);

  if (!client) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!client.key) {
    return Response.json(
      { error: "server_misconfigured", message: "no Monolith key configured for this client" },
      { status: 500 }
    );
  }

  const incoming = new URL(req.url);
  const upstream = new URL(`${MONOLITH_API_URL}/api/v1/audit/logs`);
  for (const param of FORWARDED_PARAMS) {
    const value = incoming.searchParams.get(param);
    if (value) upstream.searchParams.set(param, value);
  }

  const crossApp = client.scope === "all";
  if (crossApp) {
    // Only a cross-app client may narrow by sourceApp; anyone else is pinned.
    const requested = incoming.searchParams.get("sourceApp");
    if (requested) upstream.searchParams.set("sourceApp", requested);
  } else {
    upstream.searchParams.set("sourceApp", client.scope);
  }

  let res: Response;
  try {
    res = await fetch(upstream, {
      headers: { Authorization: `Bearer ${client.key}`, "Content-Type": "application/json" },
      cache: "no-store",
    });
  } catch {
    return Response.json(
      { error: "upstream_unreachable", message: "Could not reach monolith-api" },
      { status: 502 }
    );
  }

  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}
