import { timingSafeEqual } from "crypto";
import type { AuthInfo } from "@modelcontextprotocol/server";

export interface McpUser {
  id: string;
  name: string;
  key: string;
  role: "admin" | "user";
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/** Resolves allowed MCP user accounts from MCP_USERS (JSON or CSV) and MCP_API_KEY */
export function getAllowedMcpUsers(): McpUser[] {
  const users: McpUser[] = [];

  const rawMcpUsers = process.env.MCP_USERS || process.env.ALLOWED_MCP_USERS;
  if (rawMcpUsers) {
    try {
      const parsed = JSON.parse(rawMcpUsers);
      if (Array.isArray(parsed)) {
        parsed.forEach((item, index) => {
          if (typeof item === "string") {
            users.push({ id: `user_${index + 1}`, name: `user_${index + 1}`, key: item, role: "user" });
          } else if (item && typeof item === "object") {
            users.push({
              id: item.id || item.name || `user_${index + 1}`,
              name: item.name || item.email || item.id || `user_${index + 1}`,
              key: item.key || item.token || item.apiKey || "",
              role: item.role === "admin" ? "admin" : "user",
            });
          }
        });
      } else if (typeof parsed === "object") {
        Object.entries(parsed).forEach(([name, val]) => {
          const key = typeof val === "string" ? val : (val as { key?: string })?.key || "";
          const role = (val as { role?: string })?.role === "admin" ? "admin" : "user";
          users.push({ id: name, name, key, role });
        });
      }
    } catch {
      // Fallback CSV format: "name:key,name2:key2" or "key1,key2"
      rawMcpUsers.split(",").forEach((pair, index) => {
        const trimmed = pair.trim();
        if (trimmed.includes(":")) {
          const [name, key] = trimmed.split(":");
          users.push({ id: name.trim(), name: name.trim(), key: key.trim(), role: "user" });
        } else if (trimmed) {
          users.push({ id: `user_${index + 1}`, name: `user_${index + 1}`, key: trimmed, role: "user" });
        }
      });
    }
  }

  // Fallback single owner key from MCP_API_KEY
  const ownerKey = process.env.MCP_API_KEY;
  if (ownerKey && !users.some((u) => safeEqual(u.key, ownerKey))) {
    const ownerName = process.env.ALLOWED_EMAIL || "admin";
    users.unshift({ id: ownerName, name: ownerName, key: ownerKey, role: "admin" });
  }

  return users;
}

/** Verifies Bearer token against registered MCP user accounts */
export const verifyMcpToken = async (_req: Request, bearerToken?: string): Promise<AuthInfo | undefined> => {
  if (!bearerToken) return undefined;

  const allowedUsers = getAllowedMcpUsers();
  const matchedUser = allowedUsers.find((user) => safeEqual(user.key, bearerToken));

  if (!matchedUser) return undefined;

  return {
    token: bearerToken,
    clientId: matchedUser.name,
    scopes: matchedUser.role === "admin" ? ["read", "write", "admin"] : ["read"],
    extra: {
      userId: matchedUser.id,
      userName: matchedUser.name,
      role: matchedUser.role,
    },
  };
};
