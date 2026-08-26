import type { CallToolResult } from "@modelcontextprotocol/server";

// Shared response shaping for MCP tool handlers, so every tool reports
// success/failure the same way instead of each reinventing it. The MCP spec
// distinguishes protocol-level failures (a malformed request — the SDK
// handles those) from tool-level failures (the tool ran but the underlying
// operation failed) via `isError: true` on an otherwise normal result, so
// the model sees a readable message instead of an opaque transport error.

function toolResult(data: unknown): CallToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function toolError(error: unknown): CallToolResult {
  const message = error instanceof Error ? error.message : String(error);
  return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
}

// Wraps a tool handler so a thrown error becomes an MCP tool-error result
// instead of an unhandled rejection, and a successful return value gets the
// content/text envelope every tool result needs.
// `any[]` is the standard TS idiom for an "any function" generic constraint
// here; `unknown[]` would break Parameters<T> inference for each tool's
// typed args.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withToolErrors<T extends (...args: any[]) => Promise<unknown>>(
  fn: T
): (...args: Parameters<T>) => Promise<CallToolResult> {
  return async (...args: Parameters<T>) => {
    try {
      const data = await fn(...args);
      return toolResult(data);
    } catch (error) {
      return toolError(error);
    }
  };
}
