import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Monolith — central audit telemetry & MCP server";

const TICKS = Array.from({ length: 44 });

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#F5F1E7",
          display: "flex",
          padding: 40,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            border: "2px solid #171717",
          }}
        >
          {/* ruler ticks — top edge */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 10,
              display: "flex",
              flexDirection: "row",
            }}
          >
            {TICKS.map((_, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  width: 26,
                  height: "100%",
                  borderLeft: "1px solid #DAD6C8",
                }}
              />
            ))}
          </div>

          {/* crosshair corners */}
          <div style={{ display: "flex", position: "absolute", top: -13, left: -11, fontSize: 26, color: "#6B6960" }}>+</div>
          <div style={{ display: "flex", position: "absolute", top: -13, right: -11, fontSize: 26, color: "#6B6960" }}>+</div>
          <div style={{ display: "flex", position: "absolute", bottom: -13, left: -11, fontSize: 26, color: "#6B6960" }}>+</div>
          <div style={{ display: "flex", position: "absolute", bottom: -13, right: -11, fontSize: 26, color: "#6B6960" }}>+</div>

          {/* obelisk mark */}
          <div style={{ display: "flex", position: "relative", width: 76, height: 128 }}>
            <div style={{ display: "flex", width: 38, height: 128, background: "#F5F1E7", border: "3px solid #171717", borderRight: "none" }} />
            <div style={{ display: "flex", width: 38, height: 128, background: "#E4E0D2", border: "3px solid #171717", borderLeft: "none" }} />
            <div style={{ display: "flex", position: "absolute", left: 35, top: 0, width: 6, height: 128, background: "#FF5C38" }} />
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 92,
              fontWeight: 900,
              color: "#171717",
              letterSpacing: "-0.03em",
              marginTop: 32,
              textTransform: "uppercase",
            }}
          >
            Monolith
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 26,
              color: "#6B6960",
              marginTop: 16,
              textAlign: "center",
              maxWidth: 760,
              justifyContent: "center",
            }}
          >
            Central audit telemetry, one BigQuery warehouse, one query away.
          </div>

          <div
            style={{
              display: "flex",
              position: "absolute",
              bottom: 24,
              right: 30,
              fontSize: 20,
              color: "#6B6960",
              letterSpacing: "0.05em",
            }}
          >
            monolith.adithyakrishnan.com
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
