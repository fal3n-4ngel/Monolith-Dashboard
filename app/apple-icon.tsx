import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#18181B",
          borderRadius: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", position: "relative", width: 70, height: 120 }}>
          <div style={{ width: 35, height: 120, background: "#3F3F46", borderTopLeftRadius: 10 }} />
          <div style={{ width: 35, height: 120, background: "#27272A", borderTopRightRadius: 10 }} />
          <div style={{ position: "absolute", left: 32, top: 0, width: 6, height: 120, background: "#FF5C38" }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
