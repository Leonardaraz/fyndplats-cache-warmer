import type { Metadata } from "next";

const SITE = "https://www.fyndplats.se";
const OG_IMAGE =
  "https://static.wixstatic.com/media/b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg/v1/fill/w_1200,h_630,al_c,q_85,enc_avif/file.jpg";

// Page-specific metadata incl. its own Open Graph (so social shares show the page's
// own title/description, not the inherited homepage OG).
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
      images: [OG_IMAGE],
    },
  };
}
