import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { after } from "next/server";
import { withToolErrors } from "@/lib/mcp/format";
import { postback } from "@/lib/postback";
import { clientForEmail } from "@/lib/dashboard-clients";

const MONOLITH_API_URL =
  process.env.MONOLITH_API_URL ||
  process.env.NEXT_PUBLIC_MONOLITH_API_URL ||
  "https://monolith-postbacks.adithyakrishnan.com";

function ownerKey(): string {
  return (
    process.env.MONOLITH_API_KEY ||
    process.env.CONTINUUM_BEARER_TOKEN ||
    process.env.CONTINUUM_API_KEY ||
    process.env.API_KEY ||
    ""
  );
}

type McpAuthExtra = {
  authInfo?: { clientId?: string; extra?: { role?: string } };
};

interface McpAccess {
  bearer: string;
  forcedApp?: string;
  actorEmail?: string;
}

function resolveAccess(extra: McpAuthExtra | undefined): McpAccess {
  const id = extra?.authInfo?.clientId;
  const actorEmail = id && id.includes("@") ? id : undefined;

  if (extra?.authInfo?.extra?.role === "admin") {
    const bearer = ownerKey();
    if (!bearer) throw new Error("Admin MCP identity, but no MONOLITH_API_KEY is configured to call Monolith with.");
    return { bearer, actorEmail };
  }

  const client = clientForEmail(actorEmail);
  if (!client) {
    throw new Error(
      "This MCP identity is not provisioned for data access. Add it to DASHBOARD_CLIENTS as `\"<email>\": { \"scope\", \"key\" }`."
    );
  }
  return {
    bearer: client.key,
    forcedApp: client.scope === "all" ? undefined : client.scope,
    actorEmail,
  };
}

export function registerAuditTools(server: McpServer) {
  // 1. TOOL: query_user_activity
  server.registerTool(
    "query_user_activity",
    {
      title: "Query User Activity & Audit Telemetry",
      description:
        "Query a user's domain-event history from Monolith via GET /api/v1/audit/logs. " +
        "Returns { scope, count, results[], nextBefore }, newest first. Your identity's key is " +
        "confined to its own app; sourceApp is honoured only for an admin identity. Email " +
        "lookups are not supported (no identity view) — filter by userId.",
      inputSchema: z.object({
        userId: z.string().optional().describe("Filter by the acting user's local ID as known to the source app"),
        sourceApp: z.string().optional().describe("Admin identity only: restrict to one app, e.g. continuum-home"),
        from: z.string().optional().describe("Lower bound on occurred_at — ISO-8601 or epoch millis. Omit to scan the last 30 days"),
        before: z.string().optional().describe("Upper bound on occurred_at (exclusive). Pass a prior nextBefore to paginate"),
        limit: z.number().optional().default(50).describe("Maximum rows to return (server caps at 200)"),
      }),
    },
    withToolErrors(async ({ userId, sourceApp, from, before, limit }, extra) => {
      const { bearer, forcedApp, actorEmail } = resolveAccess(extra);
      if (actorEmail) after(() => postback({ eventType: "MCP_QUERY", email: actorEmail, entityId: "query_user_activity" }));

      const url = new URL(`${MONOLITH_API_URL.replace(/\/$/, "")}/api/v1/audit/logs`);
      if (userId) url.searchParams.set("userId", userId);
      const app = forcedApp ?? sourceApp;
      if (app) url.searchParams.set("sourceApp", app);
      if (from) url.searchParams.set("from", from);
      if (before) url.searchParams.set("before", before);
      url.searchParams.set("limit", (limit || 50).toString());

      const res = await fetch(url.toString(), {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${bearer}` },
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Monolith API returned HTTP ${res.status}: ${text}`);
      }

      return await res.json();
    })
  );

  // 2. TOOL: query_domain_events
  server.registerTool(
    "query_domain_events",
    {
      title: "Query Domain Audit Events",
      description:
        "Query domain events from Monolith via GET /api/v1/audit/logs, filtered by app, domain, " +
        "or event type. Returns { scope, count, results[], nextBefore }. Your identity's key sees " +
        "only its own app; sourceApp is honoured only for an admin identity.",
      inputSchema: z.object({
        sourceApp: z.string().optional().describe("Admin identity only: source application name (e.g. continuum-home)"),
        domain: z.string().optional().describe("Domain name (e.g. expenses, watchlist, investments, subscriptions)"),
        eventType: z.string().optional().describe("Allowlisted domain event type (e.g. EXPENSE_CREATED)"),
        userId: z.string().optional().describe("Filter by the acting user's local ID"),
        from: z.string().optional().describe("Lower bound on occurred_at — ISO-8601 or epoch millis"),
        limit: z.number().optional().default(50).describe("Max rows (server caps at 200)"),
      }),
    },
    withToolErrors(async ({ sourceApp, domain, eventType, userId, from, limit }, extra) => {
      const { bearer, forcedApp, actorEmail } = resolveAccess(extra);
      if (actorEmail) after(() => postback({ eventType: "MCP_QUERY", email: actorEmail, entityId: "query_domain_events" }));

      const url = new URL(`${MONOLITH_API_URL.replace(/\/$/, "")}/api/v1/audit/logs`);
      const app = forcedApp ?? sourceApp;
      if (app) url.searchParams.set("sourceApp", app);
      if (domain) url.searchParams.set("domain", domain);
      if (eventType) url.searchParams.set("eventType", eventType);
      if (userId) url.searchParams.set("userId", userId);
      if (from) url.searchParams.set("from", from);
      url.searchParams.set("limit", (limit || 50).toString());

      const res = await fetch(url.toString(), {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${bearer}` },
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Monolith API returned HTTP ${res.status}: ${text}`);
      }

      return await res.json();
    })
  );

  // 3. TOOL: get_bigquery_schema
  server.registerTool(
    "get_bigquery_schema",
    {
      title: "Get BigQuery Schema & Views Specification",
      description:
        "Returns universal 10-column event schema, partitioning policy, and cross-domain SQL query patterns for BigQuery.",
      inputSchema: z.object({}),
    },
    withToolErrors(async () => {
      return {
        dataset: "portfolio-api-505006:events",
        partitioning: "DAY on occurred_at (Permanent / Infinite Retention)",
        clustering: ["local_user_id", "event_type"],
        schemaColumns: [
          { name: "event_id", type: "STRING", description: "Unique UUID event insertId" },
          { name: "source_app", type: "STRING", description: "Originating application identifier" },
          { name: "local_user_id", type: "STRING", description: "Source application user ID" },
          { name: "event_type", type: "STRING", description: "Server-routed event type enum" },
          { name: "action", type: "STRING", description: "CRUD action type (CREATE, UPDATE, DELETE)" },
          { name: "entity_id", type: "STRING", description: "Target record ID in source app" },
          { name: "item_count", type: "INT64", description: "Affected row count" },
          { name: "occurred_at", type: "TIMESTAMP", description: "Event timestamp" },
          { name: "received_at", type: "TIMESTAMP", description: "Monolith ingestion timestamp" },
          { name: "payload", type: "JSON", description: "Sanitized JSON event metadata" },
        ],
        views: [
          {
            name: "all_events",
            description: "Unified view UNIONing all domain event tables with an added domain column",
          },
          {
            name: "user_activity",
            description: "User activity view joining all_events with user email profiles",
          },
        ],
      };
    })
  );

  // 4. TOOL: get_system_health
  server.registerTool(
    "get_system_health",
    {
      title: "Get Monolith Telemetry System Health",
      description: "Returns GCP Cloud Run backend status, BigQuery dataset bindings, and ingestion endpoints.",
      inputSchema: z.object({}),
    },
    withToolErrors(async () => {
      const url = `${MONOLITH_API_URL.replace(/\/$/, "")}/actuator/health`;
      const res = await fetch(url, { cache: "no-store" }).catch(() => null);
      const isOk = res?.ok ?? false;

      return {
        status: isOk ? "UP" : "DEGRADED",
        service: "Monolith Telemetry Ingestion Engine",
        gcpProject: "portfolio-api-505006",
        postbackEndpoint: "https://monolith-postbacks.adithyakrishnan.com/api/v1/events/postback",
        mcpServerEndpoint: "https://monolith.adithyakrishnan.com/api/mcp",
      };
    })
  );
}
