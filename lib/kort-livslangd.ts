// En sida som byggdes på reservdata ska inte ligga i sex timmar.
//
// Produktsidan cachas i sex timmar (lib/produkt-cache.ts). Flera hämtningar på
// vägen är fail-open: faller V3-produkten får alla varianter baspriset, faller
// recensionerna visas inga, faller Wix-uppslaget används instansens gamla
// katalogkopia. Med fem minuters livslängd läkte sådant av sig självt. Med sex
// timmar hade en sekunds hicka hos Wix eller motorn legat kvar en arbetsdag.
//
// Anropa kortLivslangd() i reservgrenen. Sidan byggs då om efter fem minuter i
// stället för sex timmar, och bara den renderingen påverkas.
//
// MEKANIK. unstable_cache med ett numeriskt `revalidate` sänker den pågående
// renderingens revalidate om talet är lägre (node_modules/next/dist/server/web/
// spec-extension/unstable-cache.js, "We update the store's revalidate property").
// Posten själv är ett litet `true` som förnyas var femte minut.
//
// ☠️ ALDRIG `fetch(..., { cache: "no-store" })` här eller i renderingen. Det gör
// en ISR-sida dynamisk mitt i renderingen och Next svarar 500 ("Page changed
// from static to dynamic at runtime") — se kommentaren i lib/popularity.ts.
//
// Utanför en sidrendering (route handlers, cron, tester) gör anropet ingenting.

import { unstable_cache } from "next/cache";

/** Livslängden för en sida byggd på reservdata. */
export const KORT_LIVSLANGD_SEKUNDER = 300;

const markor = unstable_cache(async () => true, ["kort-livslangd-v1"], {
  revalidate: KORT_LIVSLANGD_SEKUNDER,
});

export async function kortLivslangd(): Promise<void> {
  try {
    await markor();
  } catch {
    // Ingen cache att tala med (tester, lokal körning utan Next): ingen effekt.
  }
}
