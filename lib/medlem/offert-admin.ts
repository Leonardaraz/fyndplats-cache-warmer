// lib/medlem/offert-admin.ts
//
// Offerterna i motorns admin (E3-10): kön med förfrågningar, golvet per rad
// ur motorns egna mappningar (samma räkning som /api/medlem/golv) och
// beslutet: prissatt med styckpriser, eller avböjd. Butiken skriver
// förfrågan och sköter resten: mejlet "Offerten är klar", kassan, betald och
// utgången (headless-site lib/medlem/offertjobb.ts).
//
// Varje beslut kräver en orsak och skrivs till medlemsloggen med antal rader,
// aldrig priser.

import { randomUUID } from "node:crypto";
import { fraga, hamta, infoga, patcha, satt } from "@/lib/db/wix-data-klient";
import { getStore } from "@/lib/store/factory";
import { queryAuctions } from "@/lib/auction/store";
import { golvFor } from "@/lib/medlem/golv";
import { MEDLEM_KOL, type Orsak, type Rad } from "@/lib/medlem/admin";
import { offertGiltigTill, provaOffertpriser, type Offertradspris } from "@/lib/medlem/offertpriser";

export const OFFERT_KOL = "FyndplatsOfferter";

export interface Offertrad extends Offertradspris {
  produktId: string;
  variantId: string | null;
}

export interface OffertIKon {
  id: string;
  medlemsId: string;
  epost: string;
  foretagNamn: string;
  meddelande: string;
  skapad: string;
  rader: Offertrad[];
}

const text = (v: unknown) => (typeof v === "string" ? v : "");
const tal = (v: unknown) => (typeof v === "number" && Number.isSafeInteger(v) ? v : 0);

async function golvForRader(rader: { produktId: string; variantId: string | null }[]): Promise<(number | null)[]> {
  if (rader.length === 0) return [];
  const [mappningar, levande] = await Promise.all([
    getStore().getMappingsByWixProductIds([...new Set(rader.map((r) => r.produktId))]),
    queryAuctions(["live"]).then((d) => new Set(d.map((x) => x.productId))),
  ]);
  return golvFor(rader, mappningar, levande).map((g) => g.golvOre);
}

/** Förfrågningar som väntar på priser, äldst först, med golvet per rad. */
export async function offertko(antal = 20): Promise<OffertIKon[]> {
  const rader = await fraga<Rad>(OFFERT_KOL, { filter: { status: "skickad" }, sort: [{ fieldName: "skapad", order: "ASC" }], limit: antal });
  return Promise.all(
    rader.map(async (o) => {
      const medlemsId = text(o.medlemsId);
      const m = medlemsId ? await hamta<Rad>(MEDLEM_KOL.medlemmar, medlemsId) : null;
      const r = (Array.isArray(o.rader) ? o.rader : []) as Rad[];
      const bas = r.map((x) => ({ produktId: text(x.produktId), variantId: text(x.variantId) || null }));
      const golv = await golvForRader(bas).catch(() => bas.map(() => null));
      return {
        id: String(o._id),
        medlemsId,
        epost: text(m?.epost),
        foretagNamn: text(o.foretagNamn),
        meddelande: text(o.meddelande),
        skapad: text(o.skapad),
        rader: r.map((x, i) => ({ ...bas[i], namn: text(x.namn) || "Vara", antal: tal(x.antal), aOre: tal(x.aOre), golvOre: golv[i] ?? null })),
      };
    }),
  );
}

/** De senaste offerterna i andra lägen, för överblicken. */
export function senasteOfferter(antal = 10): Promise<Rad[]> {
  return fraga<Rad>(OFFERT_KOL, { filter: { status: { $ne: "skickad" } }, sort: [{ fieldName: "skapad", order: "DESC" }], limit: antal });
}

async function logga(h: Rad): Promise<void> {
  const tid = new Date().toISOString();
  await infoga(MEDLEM_KOL.logg, `l_${tid.replace(/[^0-9]/g, "")}_${randomUUID().slice(0, 8)}`, { ...h, aktor: "admin", tid });
}

/**
 * Sätter styckpriserna och gör offerten prissatt i 14 dygn. Golvet räknas om
 * här, så att ett pris aldrig sparas under dagens golv. Skrivs bara om
 * offerten fortfarande väntar (villkoret).
 */
export async function prissattOffert(id: string, falt: Record<string, unknown>, orsak: Orsak): Promise<string> {
  const o = await hamta<Rad>(OFFERT_KOL, id);
  if (!o || o.status !== "skickad") return "Offerten väntar inte på priser längre.";
  const r = (Array.isArray(o.rader) ? o.rader : []) as Rad[];
  const bas = r.map((x) => ({ produktId: text(x.produktId), variantId: text(x.variantId) || null }));
  const golv = await golvForRader(bas);
  const prov = provaOffertpriser(
    falt,
    r.map((x, i) => ({ namn: text(x.namn) || "Vara", antal: tal(x.antal), aOre: tal(x.aOre), golvOre: golv[i] ?? null })),
  );
  if (!prov.ok) return prov.fel;
  const nu = Date.now();
  const nyaRader = r.map((x, i) => ({ ...x, offertOre: prov.priser[i] }));
  const u = await patcha(
    OFFERT_KOL,
    id,
    [satt("rader", nyaRader), satt("status", "prissatt"), satt("prissatt", new Date(nu).toISOString()), satt("giltigTill", offertGiltigTill(nu))],
    { status: "skickad" },
  );
  if (u !== "applied") return "Någon annan ändrade offerten samtidigt. Ladda om sidan.";
  await logga({ omrade: "offert", typ: "offert-prissatt", medlemsId: text(o.medlemsId), efter: { offertId: id, rader: r.length }, orsakKod: orsak.kod, orsakText: orsak.text });
  return "ok";
}

/** Avböjer en förfrågan. Kunden ser det på Mina sidor. */
export async function avbojOffert(id: string, orsak: Orsak): Promise<string> {
  const o = await hamta<Rad>(OFFERT_KOL, id);
  if (!o || o.status !== "skickad") return "Offerten väntar inte på priser längre.";
  const u = await patcha(OFFERT_KOL, id, [satt("status", "avbojd")], { status: "skickad" });
  if (u !== "applied") return "Någon annan ändrade offerten samtidigt. Ladda om sidan.";
  await logga({ omrade: "offert", typ: "offert-avbojd", medlemsId: text(o.medlemsId), efter: { offertId: id }, orsakKod: orsak.kod, orsakText: orsak.text });
  return "ok";
}
