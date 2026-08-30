import { after } from "next/server";
import { auth } from "@/lib/nextauth";
import { clientForEmail } from "@/lib/dashboard-clients";
import { postback } from "@/lib/postback";

const MONOLITH_API_URL = (
  process.env.MONOLITH_API_URL ||
  process.env.NEXT_PUBLIC_MONOLITH_API_URL ||
  "https://monolith-postbacks.adithyakrishnan.com"
).replace(/\/$/, "");

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await ctx.params;
  const session = await auth();
  const email = session?.user?.email ?? "";
  const client = clientForEmail(email);
  if (!client) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!client.key) {
    return Response.json({ error: "server_misconfigured", message: "no Monolith key configured" }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
    if (!body || typeof body !== "object") body = {};
  } catch {
    body = {};
  }
  // A scoped client's report is pinned to its own app; the value the browser sent is ignored.
  if (client.scope !== "all") {
    body = { ...body, callerApp: client.scope };
  }

  let res: Response;
  try {
    res = await fetch(`${MONOLITH_API_URL}/api/v1/reports/${encodeURIComponent(id)}/run`, {
      method: "POST",
      headers: { Authorization: `Bearer ${client.key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return Response.json({ error: "upstream_unreachable", message: "Could not reach monolith-api" }, { status: 502 });
  }

  const text = await res.text();
  const headers = new Headers();
  for (const h of ["Content-Type", "Content-Disposition", "X-Report-Truncated"]) {
    const v = res.headers.get(h);
    if (v) headers.set(h, v);
  }

  if (res.ok && email) {
    const rows = text ? text.trimEnd().split("\n").length - 1 : 0;
    after(() =>
      postback({
        eventType: "REPORT_RUN",
        email,
        entityId: id,
        itemCount: Math.max(rows, 1),
        payload: { report: id, rows, scope: client.scope, truncated: res.headers.get("X-Report-Truncated") === "true" },
      })
    );
  }

  return new Response(text, { status: res.status, headers });
}
