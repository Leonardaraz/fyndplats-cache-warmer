import type { Metadata } from "next";

const SITE = "https://www.fyndplats.se";

const DEFAULT_OG_ALT = "Fyndplats — Noga utvalda fynd till smarta priser";

// Page-specific metadata incl. its own Open Graph (so social shares show the page's
// own title/description, not the inherited homepage OG).
//
// NOTE on og:image: in Next 16 the root `app/opengraph-image.tsx` file convention
// does NOT cascade to nested route segments once they export their own `openGraph`
// object — so pages that set openGraph here lose the homepage OG image and emit no
// og:image at all. Pass `ogImageHash` to attach the generated OG card explicitly
// (the /opengraph-image route ignores the query string; the hash only keeps each
// page's image URL unique for crawlers/cache).
export function pageMeta(
  title: string,
  description: string,
  path: string,
  ogImageHash?: string,
  ogImageAlt: string = DEFAULT_OG_ALT,
): Metadata {
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
      ...(ogImageHash
        ? {
            images: [
              {
                url: `${SITE}/opengraph-image?${ogImageHash}`,
                width: 1200,
                height: 630,
                type: "image/png",
                alt: ogImageAlt,
              },
            ],
          }
        : {}),
    },
  };
}
