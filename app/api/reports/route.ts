import { auth } from "@/lib/nextauth";
import { clientForEmail } from "@/lib/dashboard-clients";

const MONOLITH_API_URL = (
  process.env.MONOLITH_API_URL ||
  process.env.NEXT_PUBLIC_MONOLITH_API_URL ||
  "https://monolith-postbacks.adithyakrishnan.com"
).replace(/\/$/, "");

export async function GET(): Promise<Response> {
  const session = await auth();
  const client = clientForEmail(session?.user?.email);
  if (!client) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!client.key) {
    return Response.json({ error: "server_misconfigured", message: "no Monolith key configured" }, { status: 500 });
  }

  let res: Response;
  try {
    res = await fetch(`${MONOLITH_API_URL}/api/v1/reports`, {
      headers: { Authorization: `Bearer ${client.key}` },
      cache: "no-store",
    });
  } catch {
    return Response.json({ error: "upstream_unreachable", message: "Could not reach monolith-api" }, { status: 502 });
  }

  const text = await res.text();
  if (!res.ok) {
    return new Response(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
    });
  }

  let data: Record<string, unknown> = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  // Pass the caller's scope so the page knows whether to ask for `callerApp`.
  return Response.json({ ...data, scope: client.scope });
}
