import { ImageResponse } from "next/og";

// Genererad delningsbild (OG/Twitter) för /grade. Visas när länken delas i
// t.ex. Facebook-grupper eller DM — en del av valideringstrafiken.

export const runtime = "edge";
export const alt = "Gratis EAA-tillgänglighetskoll för din webbutik";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 30, letterSpacing: 2, opacity: 0.9 }}>
          EAA-KOLL · WCAG 2.1 AA
        </div>
        <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.1, marginTop: 24 }}>
          Är din webbutik tillgänglig enligt EU:s nya lag?
        </div>
        <div style={{ fontSize: 32, marginTop: 28, opacity: 0.92 }}>
          Gratis koll på sekunder — se de vanligaste WCAG-felen direkt.
        </div>
      </div>
    ),
    { ...size },
  );
}
