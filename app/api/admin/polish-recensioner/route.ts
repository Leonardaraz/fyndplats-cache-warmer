// POST /api/admin/polish-recensioner — recensionerna i poleringsrundan.
//
// Body (JSON):
//   { "lage": "las",   "produkter": ["<wix-id>", …] }
//   { "lage": "torr",  "beslut": [{ "productId": "…", "oversatt": { "<id>": "<svensk text>" }, "dolj": { "<id>": "<skäl>" } }] }
//   { "lage": "skriv", "beslut": [ … samma … ] }
//
// Leonard 2026-10-30: den som polerar en produkt tar också dess recensioner,
// som ett steg i rundan. Logiken bor i lib/reviews/polering.ts, det här är IO
// och auth. Workflowen är .github/workflows/polish-recensioner.yml.
//
// På en VEVOR-produkt beslutas bara recensioner om produktens egna artiklar
// (punkt 6 i polering.ts). Artikeln per recension läses ur VEVOR-läsarens
// avläsningar, som verktyget för recensioner om en annan artikel gör.
//
// ☠️ LOGGEN BÄR BARA RÄKNARE. Läsningen svarar med originaltexterna, som
// workflowen lägger i rundans katalog (de är redan publika hos leverantören),
// men aldrig namn eller land, och artikelnummerformer är redigerade.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getReviewStore, type StoredReview } from "@/lib/store/reviews";
import { getStore } from "@/lib/store/factory";
import { WixVevorLager } from "@/lib/vevor/lager";
import { artikelPerText, produktensArtiklar } from "@/lib/vevor/recensionsartikel";
import { meddelaButikenOmRecensioner } from "@/lib/reviews/meddela-butiken";
import {
  MAX_PRODUKTER,
  MAX_RADER_PER_PRODUKT,
  artikelkartaFor,
  kallaFor,
  polera,
  tolkaBeslut,
  type Artikelkarta,
} from "@/lib/reviews/polering";

export const runtime = "nodejs";
export const maxDuration = 300;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

/**
 * En VEVOR-produkt är en produkt med recensioner från VEVOR. Artikeln per rad
 * läses ur VEVOR-läsarens avläsningar för produktens artiklar. Saknas
 * mappningen, eller hittas inga avläsningar, är varje rads artikel okänd.
 */
async function artikelkarta(productId: string, rader: StoredReview[]): Promise<Artikelkarta> {
  if (!rader.some((r) => r.source === "vevor")) return null;
  const m = await getStore().getMappingByWixProductId(productId);
  const artiklar = m ? produktensArtiklar(m) : new Set<string>();
  const avlasningar = artiklar.size > 0 ? await new WixVevorLager().avlasningar([...artiklar]) : new Map();
  return artikelkartaFor(rader, artiklar, artikelPerText(avlasningar.values()));
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  if (!auktoriserad(req)) {
    return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Kroppen är inte JSON" }, { status: 400 });
  }
  const lage = body && typeof body === "object" ? (body as { lage?: unknown }).lage : undefined;
  const store = getReviewStore();

  if (lage === "las") {
    const rå = (body as { produkter?: unknown }).produkter;
    const ids = Array.isArray(rå)
      ? [...new Set(rå.filter((x): x is string => typeof x === "string" && x.trim() !== "").map((x) => x.trim()))]
      : [];
    if (ids.length === 0 || ids.length > MAX_PRODUKTER) {
      return NextResponse.json({ ok: false, error: `produkter: 1–${MAX_PRODUKTER} Wix-id` }, { status: 400 });
    }
    const produkter = [];
    for (const id of ids) {
      const rader = await store.listByProduct(id, MAX_RADER_PER_PRODUKT);
      produkter.push(kallaFor(id, rader, await artikelkarta(id, rader)));
    }
    console.log(
      `[polish-recensioner] läs: ${ids.length} produkter, ${produkter.reduce((n, p) => n + p.attBesluta.length, 0)} att besluta, `
        + `${produkter.reduce((n, p) => n + p.annanArtikel, 0)} om en annan artikel, `
        + `${produkter.reduce((n, p) => n + p.okandArtikel, 0)} med okänd artikel, ${Date.now() - t0} ms`,
    );
    return NextResponse.json({ ok: true, lage, produkter });
  }

  if (lage !== "torr" && lage !== "skriv") {
    return NextResponse.json({ ok: false, error: "lage ska vara las, torr eller skriv" }, { status: 400 });
  }
  const tolkat = tolkaBeslut(body);
  if ("fel" in tolkat) {
    return NextResponse.json({ ok: false, error: tolkat.fel.slice(0, 20) }, { status: 400 });
  }
  const dryRun = lage === "torr";
  const svar = await polera(tolkat.beslut, dryRun, {
    listByProduct: (id) => store.listByProduct(id, MAX_RADER_PER_PRODUKT),
    artikelkarta,
    editText: (id, rid, sv) => store.editText(id, rid, sv),
    setStatus: (id, rid, status) => store.setStatus(id, rid, status),
    meddelaButiken: (ids) => meddelaButikenOmRecensioner(ids, "polering: recensioner"),
  });

  const oversatta = svar.produkter.reduce((n, p) => n + p.oversatta, 0);
  const dolda = svar.produkter.reduce((n, p) => n + p.dolda, 0);
  const avvikelser = svar.produkter.reduce((n, p) => n + p.avvikelser.length, 0);
  if (!dryRun && oversatta + dolda > 0) {
    await audit(
      "reviews",
      "polering",
      `${oversatta} recensioner översatta och publicerade, ${dolda} dolda, på ${svar.produkter.length} produkter, ${avvikelser} avvikelser`,
    );
  }
  console.log(
    `[polish-recensioner] ${lage}: ${tolkat.beslut.length} produkter, ${svar.fel.length} fel, ${oversatta} översatta, ${dolda} dolda, `
      + `${avvikelser} avvikelser, ${Date.now() - t0} ms`,
  );
  return NextResponse.json({ lage, ...svar }, { status: svar.fel.length > 0 ? 422 : 200 });
}
