import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { withToolErrors } from "@/lib/mcp/format";

const MONOLITH_API_URL =
  process.env.MONOLITH_API_URL ||
  process.env.NEXT_PUBLIC_MONOLITH_API_URL ||
  "https://monolith-postbacks.adithyakrishnan.com";

function getApiKey(): string {
  return (
    process.env.MONOLITH_API_KEY ||
    process.env.CONTINUUM_BEARER_TOKEN ||
    process.env.CONTINUUM_API_KEY ||
    process.env.API_KEY ||
    ""
  );
}

export function registerAuditTools(server: McpServer) {
  // 1. TOOL: query_user_activity
  server.registerTool(
    "query_user_activity",
    {
      title: "Query User Activity & Audit Telemetry",
      description:
        "Query cross-domain user activity records and domain events from the Monolith BigQuery data warehouse.",
      inputSchema: z.object({
        userId: z.string().optional().describe("Filter by specific local user ID"),
        email: z.string().optional().describe("Filter by user email address"),
        limit: z.number().optional().default(50).describe("Maximum number of audit events to return"),
      }),
    },
    withToolErrors(async ({ userId, email, limit }) => {
      const apiKey = getApiKey();
      const url = new URL(`${MONOLITH_API_URL.replace(/\/$/, "")}/api/v1/audit/logs`);
      if (userId) url.searchParams.set("userId", userId);
      if (email) url.searchParams.set("email", email);
      url.searchParams.set("limit", (limit || 50).toString());

      const res = await fetch(url.toString(), {
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
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
        "Query telemetry events by source application, domain, or specific event type (e.g. EXPENSE_CREATED).",
      inputSchema: z.object({
        sourceApp: z.string().optional().describe("Source application name (e.g. continuum-home)"),
        domain: z.string().optional().describe("Domain name (e.g. expenses, watchlist, library)"),
        eventType: z.string().optional().describe("Specific domain event type (e.g. EXPENSE_CREATED)"),
        limit: z.number().optional().default(50).describe("Max event limit"),
      }),
    },
    withToolErrors(async ({ sourceApp, domain, eventType, limit }) => {
      const apiKey = getApiKey();
      const url = new URL(`${MONOLITH_API_URL.replace(/\/$/, "")}/api/v1/audit/logs`);
      if (sourceApp) url.searchParams.set("sourceApp", sourceApp);
      if (domain) url.searchParams.set("domain", domain);
      if (eventType) url.searchParams.set("eventType", eventType);
      url.searchParams.set("limit", (limit || 50).toString());

      const res = await fetch(url.toString(), {
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
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
