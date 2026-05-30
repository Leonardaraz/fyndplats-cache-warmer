import { ImageResponse } from "next/og";

export const alt = "Fyndplats — Noga utvalda fynd till smarta priser";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ORANGE = "#F47A35";
const ORANGE_DARK = "#C2410C";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #FFF8F2 0%, #FFFFFF 60%, #FFEDDE 100%)",
          padding: "80px 100px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 12,
            background: ORANGE,
            display: "flex",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <svg width="96" height="96" viewBox="0 0 24 24">
            <polygon points="12,2.4 21.6,7.5 12,12.6 2.4,7.5" fill="#FFB078" />
            <polygon points="2.4,7.5 12,12.6 12,21.6 2.4,16.5" fill="#F84848" />
            <polygon points="21.6,7.5 12,12.6 12,21.6 21.6,16.5" fill={ORANGE} />
          </svg>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: "#1A1A1A",
              letterSpacing: -2,
              display: "flex",
            }}
          >
            Fyndplats
          </div>
        </div>

        <div
          style={{
            marginTop: 70,
            fontSize: 88,
            fontWeight: 800,
            color: "#1A1A1A",
            lineHeight: 1.05,
            letterSpacing: -3,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex" }}>Noga utvalda fynd,</div>
          <div style={{ display: "flex", color: ORANGE_DARK, fontStyle: "italic" }}>tryggt köp.</div>
        </div>

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            gap: 36,
            fontSize: 26,
            color: "#444",
            fontWeight: 500,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 12, height: 12, background: ORANGE_DARK, borderRadius: 6, display: "flex" }} /> Svensk e-handel
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 12, height: 12, background: ORANGE_DARK, borderRadius: 6, display: "flex" }} /> Klarna & Swish
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 12, height: 12, background: ORANGE_DARK, borderRadius: 6, display: "flex" }} /> Fri frakt över 499 kr
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
