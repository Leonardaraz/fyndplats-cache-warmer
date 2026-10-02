// Säger till butiken att produkter ändrats, så att deras sidor töms och värms.
//
// Butikens produktsidor cachas i sex timmar (lib/produkt-cache.ts på grenen
// `headless-site`, sedan 2026-10-01). Det är ett säkerhetsnät: butikens egen
// cron (/api/cron/uppdatera-andrade) läser Wix `updatedDate` var femte minut och
// tömmer ändrade produkter, och den läser recensionsändringar från motorns
// /api/review-andringar. Den här modulen är för det som inte ska vänta de fem
// minuterna: fyndauktionens prissteg och återställningar, där butikens pris
// ska stämma med kassan från första besöket.
//
// NYCKELN: ADMIN_SECRET som kakan `fp_admin` (butikens proxy släpper bara
// igenom /api/admin/* på kakan — se lib/headless/produktsida.ts) och som
// "Authorization: Bearer". ALDRIG som `?token=` i adressen: en nyckel i en URL
// hamnar i åtkomstloggar, och det här anropet går varje timme. Stegen är
// best-effort och kastar aldrig: en auktion ska stega även om butiken inte
// svarar, och butikens cron tar det ändå inom några minuter.

import { butikensBas } from "./produktsida";

const TIMEOUT_MS = 15_000;
/** Butikens tak per anrop (app/api/admin/uppdatera-produkter). */
const MAX_POSTER = 500;

export interface AndradProdukt {
  /** Wix-produktens id. */
  id: string;
  /** Nuvarande slug, om den är känd — annars slår butiken upp den. */
  slug?: string;
}

export interface ButikensSvar {
  utfall: "uppdaterad" | "ingen_nyckel" | "misslyckades" | "tom";
  status?: number;
  /** Hur många produkter butiken tömde. */
  produkter?: number;
}

export async function uppdateraProduktsidor(
  produkter: readonly AndradProdukt[],
  orsak: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ButikensSvar> {
  const nyckel = process.env.ADMIN_SECRET;
  if (!nyckel) return { utfall: "ingen_nyckel" };
  const sett = new Set<string>();
  const poster: AndradProdukt[] = [];
  for (const p of produkter) {
    const id = typeof p?.id === "string" ? p.id.trim() : "";
    if (!id || sett.has(id)) continue;
    sett.add(id);
    poster.push(p.slug ? { id, slug: p.slug } : { id });
  }
  if (poster.length === 0) return { utfall: "tom" };

  let res: Response;
  try {
    res = await fetchImpl(`${butikensBas()}/api/admin/uppdatera-produkter`, {
      method: "POST",
      headers: {
        cookie: `fp_admin=${nyckel}`,
        authorization: `Bearer ${nyckel}`,
        "content-type": "application/json",
        "user-agent": "fyndplats-cache-warmer/uppdatera",
      },
      body: JSON.stringify({ produkter: poster.slice(0, MAX_POSTER), orsak }),
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return { utfall: "misslyckades" };
  }
  if (!res.ok) return { utfall: "misslyckades", status: res.status };
  let produkterTommda: number | undefined;
  try {
    const body = (await res.json()) as { produkter?: unknown };
    if (typeof body.produkter === "number") produkterTommda = body.produkter;
  } catch {
    // Svaret är en bonus; statuskoden räcker.
  }
  return { utfall: "uppdaterad", status: res.status, ...(produkterTommda !== undefined ? { produkter: produkterTommda } : {}) };
}
