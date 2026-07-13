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

// Kubens ytfärger — pixel-samplade mellantoner ur faviconen (app/icon.png)
// så mejl-loggan matchar header/flik/Google. Flata fyllningar (inte gradient):
// Satori/ImageResponse-stödet för SVG-gradienter är opålitligt, och på 56 px
// syns ingen skillnad.
const CUBE_TOP = "#FF8D30";
const CUBE_LEFT = "#FF3D0C";
const CUBE_RIGHT = "#FF7A26";
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
          <polygon points="12,1 21.6,6.5 12,12.1 2.4,6.5" fill={CUBE_TOP} />
          <polygon points="2.4,6.5 12,12.1 12,23 2.4,17.3" fill={CUBE_LEFT} />
          <polygon points="21.6,6.5 12,12.1 12,23 21.6,17.3" fill={CUBE_RIGHT} />
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
