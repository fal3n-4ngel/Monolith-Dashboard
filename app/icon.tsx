import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#171717",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Monolith Obelisk Mark */}
        <div style={{ display: "flex", position: "relative", width: 14, height: 24 }}>
          <div style={{ width: 7, height: 24, background: "#4A4A44" }} />
          <div style={{ width: 7, height: 24, background: "#2E2E2A" }} />
          <div style={{ position: "absolute", left: 6, top: 0, width: 2, height: 24, background: "#FF5C38" }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
