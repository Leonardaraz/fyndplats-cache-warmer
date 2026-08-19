// Bearbetar och laddar upp en kundbild till Wix Media.
//
// Ligger separat eftersom den här filen drar in nätverk. Grindarna bor i
// lib/review-image.ts och bildbearbetningen i lib/review-image-process.ts —
// båda lövmoduler som går att testa var för sig.

import { mediaFileName } from "./review-image";

const WIX_BASE = "https://www.wixapis.com";

function wixHeaders(): Record<string, string> | null {
  const token = process.env.WIX_API_KEY;
  const siteId = process.env.WIX_SITE_ID;
  if (!token || !siteId) return null;
  return { Authorization: token, "wix-site-id": siteId };
}

/**
 * Laddar upp den bearbetade bilden och returnerar dess publika adress.
 *
 * Wix tvåstegsflöde: be om en uppladdnings-URL, lägg sedan bytena där. Vi kan
 * inte använda import-v2 (som resten av kodbasen gör) eftersom den hämtar från
 * en URL — kundens fil finns bara i requesten.
 *
 * Returnerar null vid alla fel. Omdömet ska sparas ändå: text och betyg är
 * huvudsaken, och en misslyckad bilduppladdning får inte kosta kunden hela
 * omdömet efter att hen skrivit det.
 */
export async function uploadReviewImage(
  bild: Buffer,
  productId: string,
  reviewIdAE: string,
  index = 0,
): Promise<string | null> {
  const headers = wixHeaders();
  if (!headers) return null;
  try {
    const res = await fetch(`${WIX_BASE}/site-media/v1/files/generate-upload-url`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        mimeType: "image/jpeg",
        fileName: mediaFileName(productId, reviewIdAE, index),
        parentFolderId: process.env.WIX_MEDIA_REVIEW_FOLDER_ID || undefined,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.warn(`[omdome] generate-upload-url → HTTP ${res.status}`);
      return null;
    }
    const { uploadUrl } = (await res.json()) as { uploadUrl?: string };
    if (!uploadUrl) return null;

    const put = await fetch(`${uploadUrl}?filename=${encodeURIComponent(mediaFileName(productId, reviewIdAE, index))}`, {
      method: "PUT",
      headers: { "Content-Type": "image/jpeg" },
      body: new Uint8Array(bild),
      signal: AbortSignal.timeout(20_000),
    });
    if (!put.ok) {
      console.warn(`[omdome] bilduppladdning → HTTP ${put.status}`);
      return null;
    }
    const body = (await put.json()) as {
      file?: { url?: string; id?: string };
    };
    return body.file?.url ?? null;
  } catch (err) {
    console.warn("[omdome] bilduppladdning misslyckades", err);
    return null;
  }
}
