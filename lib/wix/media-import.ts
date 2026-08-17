// lib/wix/media-import.ts
//
// Hämtar hem en extern bild till butikens egen mediahantering och returnerar
// den nya adressen.
//
// Varför (2026-08-17): kundbilderna i recensionerna serverades direkt från
// leverantörens bild-CDN. Adressen står i produktsidans HTML, så vem som helst
// som högerklickar → "kopiera bildadress" ser varifrån varorna kommer. De 329
// befintliga bilderna flyttades manuellt; den här modulen finns för att nya
// importer inte ska återinföra problemet.
//
// Bonusen är att bilderna slutar försvinna den dagen leverantören rensar sitt
// CDN — de ligger då hos oss.

const WIX_BASE = "https://www.wixapis.com";

/** Värdar vi aldrig vill länka till från en kundvänlig sida. */
const EXTERNA_VARDAR = ["aliexpress-media.com", "alicdn.com"];

export function isExternalSupplierImage(url: string | undefined): boolean {
  if (!url) return false;
  return EXTERNA_VARDAR.some((v) => url.includes(v));
}

function headers(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
  const h: Record<string, string> = { "Content-Type": "application/json", Authorization: token };
  const siteId = process.env.WIX_SITE_ID;
  if (siteId) h["wix-site-id"] = siteId;
  return h;
}

/**
 * Importerar `url` till mediahanteringen och ger tillbaka wixstatic-adressen.
 *
 * Returnerar null i stället för att kasta — anroparen avgör vad som händer då.
 * Wix svarar 429 vid för hög takt; ett återförsök med paus räcker i praktiken
 * (uppmätt vid flytten av de 329 befintliga bilderna).
 */
export async function importImageToOwnMedia(
  url: string,
  displayName: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  for (let försök = 0; försök < 2; försök++) {
    try {
      const res = await fetchImpl(`${WIX_BASE}/site-media/v1/files/import`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          mimeType: "image/jpeg",
          displayName,
          private: false,
          url,
        }),
      });
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }
      if (!res.ok) return null;
      const body = (await res.json()) as { file?: { url?: string } };
      const ny = body.file?.url;
      // Kontrollera att vi faktiskt fick vår egen adress tillbaka — annars vore
      // "lyckad" import ett tyst sätt att behålla leverantörslänken.
      return ny && ny.startsWith("https://static.wixstatic.com/") ? ny : null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Bildadressen som ska sparas på recensionen.
 *
 * Misslyckad import → `undefined`, alltså ingen bild alls. Att falla tillbaka
 * på leverantörens adress vore att återinföra precis det vi tar bort; texten
 * i recensionen är det som bär värdet och den påverkas inte.
 */
export async function ownImageUrlForReview(
  imageUrl: string | undefined,
  reviewIdAE: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string | undefined> {
  if (!imageUrl) return undefined;
  if (!isExternalSupplierImage(imageUrl)) return imageUrl;
  const ny = await importImageToOwnMedia(imageUrl, `kundbild-${reviewIdAE}.jpg`, fetchImpl);
  return ny ?? undefined;
}
