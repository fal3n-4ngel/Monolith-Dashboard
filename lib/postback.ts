const MONOLITH_API_URL = (
  process.env.MONOLITH_API_URL ||
  process.env.NEXT_PUBLIC_MONOLITH_API_URL ||
  "https://monolith-postbacks.adithyakrishnan.com"
).replace(/\/$/, "");

function key(): string {
  return (
    process.env.MONOLITH_API_KEY ||
    process.env.CONTINUUM_BEARER_TOKEN ||
    process.env.CONTINUUM_API_KEY ||
    process.env.API_KEY ||
    ""
  );
}

interface Event {
  eventType: string;
  email: string;
  entityId?: string;
  itemCount?: number;
  payload?: Record<string, unknown>;
}

// Fire-and-forget usage telemetry to monolith-api as sourceApp "monolith-dashboard".
// `email` is both local_user_id and payload.userEmail — the cross-app user key. Never throws.
export async function postback(event: Event): Promise<void> {
  const token = key();
  if (!token || !event.email) return;
  try {
    await fetch(`${MONOLITH_API_URL}/api/v1/events/postback`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        sourceApp: "monolith-dashboard",
        eventType: event.eventType,
        userId: event.email,
        entityId: event.entityId,
        itemCount: event.itemCount ?? 1,
        timestamp: Date.now(),
        payload: {
          environment: process.env.NODE_ENV || "production",
          userEmail: event.email,
          ...event.payload,
        },
      }),
    });
  } catch {
    // ignore
  }
}
