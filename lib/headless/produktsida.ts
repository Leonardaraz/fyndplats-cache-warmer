// Tömmer butikens cache för EN produktsida och värmer den direkt efteråt.
//
// Används före ett restock-mejl (lib/restock/notify.ts). Butikens produktsidor
// cachas i en timme (`revalidate = 3600` i app/produkt/[slug]/page.tsx på
// grenen `headless-site`), och bara en order tömmer cachen i förväg. Ett
// lagersaldo som synken skriver syns alltså inte förrän sidan byggts om. Utan
// det här steget kunde kunden klicka på "Nu finns den igen!" och landa på en
// sida som fortfarande säger "Slutsåld", med bevakningsformuläret under.
//
// ☠️ NYCKELN SKICKAS SOM KAKA, INTE SOM `?key=`. Butikens proxy.ts släpper igenom
// /api/admin/* på kakan `fp_admin`, eller på `?key=` genom en omdirigering som
// SÄTTER kakan. Node:s fetch följer omdirigeringen men sparar inga kakor, så
// `?key=`-vägen landar på proxyns 404. Rutten själv kontrollerar `?token=`.
//
// Stegen är best-effort och kastar aldrig: mejlet ska gå även om cachen inte
// gick att tömma. Utfallet räknas av anroparen, så en saknad nyckel syns.

const DEFAULT_BUTIK = "https://www.fyndplats.se";
const TIMEOUT_MS = 10_000;

export type Uppfriskning = "uppfriskad" | "ingen_nyckel" | "misslyckades";

export async function uppfriskaProduktsida(
  slug: string,
  fetchImpl: typeof fetch = fetch,
): Promise<Uppfriskning> {
  const nyckel = process.env.ADMIN_SECRET;
  if (!nyckel) return "ingen_nyckel";
  const s = slug.trim();
  if (!s) return "misslyckades";
  const bas = (process.env.HEADLESS_BASE_URL || DEFAULT_BUTIK).replace(/\/$/, "");
  const sokvag = `/produkt/${encodeURIComponent(s)}`;

  let res: Response;
  try {
    res = await fetchImpl(
      `${bas}/api/admin/revalidate?token=${encodeURIComponent(nyckel)}&path=${encodeURIComponent(sokvag)}`,
      {
        method: "POST",
        headers: { cookie: `fp_admin=${nyckel}`, "user-agent": "fyndplats-cache-warmer/restock" },
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
  } catch {
    return "misslyckades";
  }
  if (!res.ok) return "misslyckades";

  // Första besöket efter tömningen bygger om sidan. Det ska vara vårt, inte
  // kundens: sidan är färdigbyggd när mejlet kommer fram. Faller besöket är
  // cachen ändå tömd, och då bygger kundens besök om sidan.
  try {
    await fetchImpl(`${bas}${sokvag}`, {
      method: "GET",
      headers: { "user-agent": "fyndplats-cache-warmer/restock" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    // Värmningen är en bonus.
  }
  return "uppfriskad";
}
