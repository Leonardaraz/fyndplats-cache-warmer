import type { Metadata } from "next";

const SITE = "https://www.fyndplats.se";

// Page-specific metadata incl. its own Open Graph (so social shares show the page's
// own title/description, not the inherited homepage OG). Images are inherited from
// the root opengraph-image file convention (app/opengraph-image.tsx).
export function pageMeta(title: string, description: string, path: string): Metadata {
  const url = `${SITE}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "sv_SE",
      siteName: "Fyndplats",
      url,
      title,
      description,
    },
  };
}
