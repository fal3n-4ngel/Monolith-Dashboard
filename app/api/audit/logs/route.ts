import { auth } from "@/lib/nextauth";
import { clientForEmail } from "@/lib/dashboard-clients";

const MONOLITH_API_URL = (
  process.env.MONOLITH_API_URL ||
  process.env.NEXT_PUBLIC_MONOLITH_API_URL ||
  "https://monolith-postbacks.adithyakrishnan.com"
).replace(/\/$/, "");

const FORWARDED_PARAMS = ["userId", "domain", "eventType", "from", "before", "limit"] as const;

export async function GET(req: Request): Promise<Response> {
  const session = await auth();
  const client = clientForEmail(session?.user?.email);
  if (!client) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!client.key) {
    return Response.json({ error: "server_misconfigured", message: "no Monolith key configured" }, { status: 500 });
  }

  const incoming = new URL(req.url);
  const upstream = new URL(`${MONOLITH_API_URL}/api/v1/audit/logs`);
  let isFiltered = false;

  for (const param of FORWARDED_PARAMS) {
    const value = incoming.searchParams.get(param);
    if (value) {
      upstream.searchParams.set(param, value);
      if (param !== "limit") isFiltered = true;
    }
  }

  if (client.scope === "all") {
    const requested = incoming.searchParams.get("sourceApp");
    if (requested) {
      upstream.searchParams.set("sourceApp", requested);
      isFiltered = true;
    }
  } else {
    upstream.searchParams.set("sourceApp", client.scope);
  }

  const forceFresh = incoming.searchParams.get("refresh") === "true";

  let res: Response;
  try {
    // For default initial loads without filters, revalidate every 15s to reduce upstream load
    const fetchOptions: RequestInit = (!isFiltered && !forceFresh)
      ? { next: { revalidate: 15 }, headers: { Authorization: `Bearer ${client.key}`, "Content-Type": "application/json" } }
      : { cache: "no-store", headers: { Authorization: `Bearer ${client.key}`, "Content-Type": "application/json" } };

    res = await fetch(upstream, fetchOptions);
  } catch {
    return Response.json({ error: "upstream_unreachable", message: "Could not reach monolith-api" }, { status: 502 });
  }

  const body = await res.text();
  const headers = new Headers();
  headers.set("Content-Type", res.headers.get("Content-Type") ?? "application/json");

  if (!isFiltered && !forceFresh && res.ok) {
    headers.set("Cache-Control", "private, max-age=15, stale-while-revalidate=30");
  } else {
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  }

  return new Response(body, {
    status: res.status,
    headers,
  });
}
