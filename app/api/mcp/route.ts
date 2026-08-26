import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { registerAuditTools } from "@/lib/mcp/tools/audit";
import { verifyMcpToken } from "@/lib/mcp/auth";

// Monolith Telemetry Data Consumption MCP Server
// Exposes BigQuery event telemetry, user activity queries, schema definitions, and ingestion health over MCP.
// Strictly protected: Only registered MCP users with a valid Bearer token can access.
const handler = createMcpHandler((server) => {
  registerAuditTools(server);
});

const authHandler = withMcpAuth(handler, verifyMcpToken, { required: true });

export { authHandler as GET, authHandler as POST };
