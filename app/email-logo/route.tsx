// app/email-logo/route.tsx
//
// PNG logo for transactional emails. Apple Mail (especially mobile) won't
// render SVG, and email clients ignore CSS `filter` — so we ship a real PNG
// with the wordmark already in the right color for the dark header bar.
//
// Served at https://www.fyndplats.se/email-logo with Content-Type image/png.
// Cached aggressively because every transactional email pulls this URL.

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";

const ORANGE = "#F47A35";
const ORANGE_LIGHT = "#FFB078";
const ORANGE_DARK = "#E5681F";
const RED = "#F84848";
const HEADER_BG = "#222018";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          background: HEADER_BG,
          padding: "0 24px",
          fontFamily: "sans-serif",
        }}
      >
        <svg width="56" height="56" viewBox="0 0 24 24">
          <polygon points="12,2.4 21.6,7.5 12,12.6 2.4,7.5" fill={ORANGE_LIGHT} />
          <polygon points="2.4,7.5 12,12.6 12,21.6 2.4,16.5" fill={RED} />
          <polygon points="21.6,7.5 12,12.6 12,21.6 21.6,16.5" fill={ORANGE} />
        </svg>
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: "#FFFFFF",
            letterSpacing: -1,
            display: "flex",
          }}
        >
          Fyndplats
        </div>
      </div>
    ),
    {
      width: 600,
      height: 140,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    },
  );
}
