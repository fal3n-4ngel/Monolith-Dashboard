import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Monolith — a private personal dashboard";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 140,
            height: 140,
            background: "#1c1917",
            borderRadius: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 44,
          }}
        >
          <div style={{ width: 36, height: 72, background: "white", borderRadius: 6 }} />
        </div>
        <div style={{ display: "flex", fontSize: 68, fontWeight: 800, color: "#1c1917", letterSpacing: "-0.02em" }}>
          Monolith
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#78716c", marginTop: 18 }}>
          A private dashboard for money, calendar, tasks, and media.
        </div>
      </div>
    ),
    { ...size }
  );
}
