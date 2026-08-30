import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { registerAuditTools } from "@/lib/mcp/tools/audit";
import { verifyMcpToken } from "@/lib/mcp/auth";
import { checkMcpRateLimit, resolveMcpClientKey } from "@/lib/mcp/rate-limit";

// Monolith Telemetry Data Consumption MCP Server
// Exposes BigQuery event telemetry, user activity queries, schema definitions, and ingestion health over MCP.
// Strictly protected: Only registered MCP users with a valid Bearer token can access.
const handler = createMcpHandler((server) => {
  registerAuditTools(server);
});

const authHandler = withMcpAuth(handler, verifyMcpToken, { required: true });

async function rateLimited(req: Request): Promise<Response> {
  const clientKey = resolveMcpClientKey(req);
  const { allowed, retryAfterSeconds } = checkMcpRateLimit(clientKey);

  if (!allowed) {
    return new Response(
      JSON.stringify({ error: "rate_limited", message: `MCP rate limit exceeded. Retry after ${retryAfterSeconds}s.` }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfterSeconds),
        },
      }
    );
  }

  return authHandler(req);
}

export { rateLimited as GET, rateLimited as POST };
