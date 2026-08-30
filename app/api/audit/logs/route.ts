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
  for (const param of FORWARDED_PARAMS) {
    const value = incoming.searchParams.get(param);
    if (value) upstream.searchParams.set(param, value);
  }
  if (client.scope === "all") {
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
    return Response.json({ error: "upstream_unreachable", message: "Could not reach monolith-api" }, { status: 502 });
  }

  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}
