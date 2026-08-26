// Upstash Redis REST Helper Client

const url = process.env.UPSTASH_REDIS_REST_URL || "https://star-kite-98467.upstash.io";
const token = process.env.UPSTASH_REDIS_REST_TOKEN || "b793330c-1b2f-4a7f-a542-3d98ea5e01d9";

export async function redisCommand(command: string[]): Promise<any> {
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url}/${command.map((c) => encodeURIComponent(c)).join("/")}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.result;
  } catch (err) {
    console.error("Upstash Redis command error:", err);
    return null;
  }
}

export async function pingRedis(): Promise<boolean> {
  const result = await redisCommand(["PING"]);
  return result === "PONG";
}

export const redis = {
  get: (key: string) => redisCommand(["GET", key]),
  set: (key: string, value: string) => redisCommand(["SET", key, value]),
  del: (key: string) => redisCommand(["DEL", key]),
  ping: pingRedis,
};
