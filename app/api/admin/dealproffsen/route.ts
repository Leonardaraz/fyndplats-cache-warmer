// GET /api/admin/dealproffsen — prisjämförelse mot dealproffsen.se.
//
//   ?lage=feed-info            vilka kolumner Aosoms feed FAKTISKT har
//   ?lage=jamfor               jämför vår katalog mot deras priser
//   ?lage=jamfor&after=921-    fortsätt från ett prefix (markör)
//
// ☠️ RUTTEN SKRIVER INGENTING, och kan inte. Den mäter. Ett pris som når kund
// ska ha passerat ögon — samma hållning som prisreparationens "det finns ingen
// kör-allt-flagga" och som ommappningens torrkörning.
//
// ☠️ SVARET BÄR ALDRIG AOSOMS ARTIKELNUMMER OCH ALDRIG VÅRT INKÖPSPRIS.
// Det hamnar i en PUBLIK Actions-logg. Artikelnumret är den sträng
// dealproffsen själva publicerar som sku/mpn — läcker vi den joinar vem som
// helst vår produktsida mot deras och därmed mot vårt inköpsled. Raderna
// nycklas på `wixProductId`, som redan står i produktsidans JSON-LD.
//
// ☠️ OCH FEED-ADRESSEN LÄMNAR ALDRIG SERVERN. Samma skäl och samma mönster som
// `aosom-feed-search`: produktionen har adressen, Actions har CRON_SECRET, de
// möts i workflowen. `feed-info` svarar på "vad finns i feeden" utan att någon
// behöver se var den ligger.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import { resolveAosomFeedUrl } from "@/lib/aosom/feed";
import { PRISKOLUMNER, feedKolumner } from "@/lib/aosom/feed-info";
import { listV3ProductPrices, listVisibleV3ProductIds } from "@/lib/wix/v3-products";
import {
  artikelnummerAv,
  jamforPriser,
  prefixAv,
  prefixLista,
  samlaDeras,
  tolkaDerasSvar,
  type DerasRad,
} from "@/lib/pricing/dealproffsen";
import { isAliExpressMapping } from "@/lib/store/supplier";

export const runtime = "nodejs";
export const maxDuration = 300;

const DP_BAS = "https://www.dealproffsen.se/sok?controller=search&ajax=1&resultsPerPage=100";
/** Deras sida svarar inte på en naken klient. */
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

/**
 * Paus mellan anrop mot deras sajt.
 *
 * Samma medicin som `AOSOM_WRITE_DELAY_MS` och `MEDIA_UPLOAD_DELAY_MS`: den
 * billigaste kuren mot en strypning som utlöses av tempo är att inte springa.
 * Det här är dessutom någon annans server — vi har ingen rätt att belasta den.
 */
const PAUS_MS = Number(process.env.DEALPROFFSEN_DELAY_MS ?? 400);

/** Tidsbudget räknad från REQUESTENS början, inte från svepets. */
const TIDSBUDGET_MS = 210_000;

/** Tak per prefix. 439 var det största uppmätta; 20 sidor är gott om marginal. */
const MAX_SIDOR_PER_PREFIX = 20;

/** Rader per packad loggrad. Håller antalet rader läsbart i stället för tusental. */
const RADER_PER_LOGGRAD = 100;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

const sov = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Hämtar alla sidor för ett prefix. Kastar vid HTTP-fel — se anroparen. */
async function hamtaPrefix(prefix: string): Promise<DerasRad[]> {
  const ut: DerasRad[] = [];
  for (let sida = 1; sida <= MAX_SIDOR_PER_PREFIX; sida++) {
    const url = `${DP_BAS}&s=${encodeURIComponent(prefix)}&page=${sida}`;
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`HTTP ${res.status} på ${prefix} sida ${sida}`);
    const rader = tolkaDerasSvar(await res.json());
    ut.push(...rader);
    if (rader.length < 100) break;
    await sov(PAUS_MS);
  }
  return ut;
}

export async function GET(req: NextRequest) {
  const t0 = Date.now();
  if (!auktoriserad(req)) {
    return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  }
  const sp = req.nextUrl.searchParams;
  const lage = sp.get("lage") ?? "jamfor";

  // ── Läge 1: vad finns egentligen i Aosoms feed? ───────────────────────────
  if (lage === "feed-info") {
    try {
      const res = await fetch(await resolveAosomFeedUrl());
      if (!res.ok) throw new Error(`feed HTTP ${res.status}`);
      const info = feedKolumner(await res.text());
      console.log(
        `[dealproffsen] FEED-INFO ${info.rader} rader, ${info.kolumner.length} kolumner, `
        + `ean-kolumn=${info.harEanKolumn} ifyllda=${info.eanIfyllda}`,
      );
      return NextResponse.json({ ok: true, lage, ...info, dolda: PRISKOLUMNER });
    } catch (e) {
      return NextResponse.json(
        { ok: false, error: e instanceof Error ? e.message : String(e) },
        { status: 500 },
      );
    }
  }

  // ── Läge 2: jämför priserna ───────────────────────────────────────────────
  const [mappningar, vartPris, publicerade] = await Promise.all([
    getStore().listMappings(),
    listV3ProductPrices(),
    listVisibleV3ProductIds(),
  ]);

  const alla = prefixLista(mappningar);
  const after = (sp.get("after") ?? "").trim().toUpperCase();
  const start = after ? alla.findIndex((p) => p > after) : 0;
  const kvarstaende = start < 0 ? [] : alla.slice(start);

  const derasRader: DerasRad[] = [];
  const hamtade: string[] = [];
  const fel: Array<{ prefix: string; skal: string }> = [];
  let stoppadAv: "klart" | "tidsbudget" = "klart";

  for (const prefix of kvarstaende) {
    if (Date.now() - t0 > TIDSBUDGET_MS) {
      stoppadAv = "tidsbudget";
      break;
    }
    try {
      derasRader.push(...(await hamtaPrefix(prefix)));
      hamtade.push(prefix);
    } catch (e) {
      fel.push({ prefix, skal: e instanceof Error ? e.message : String(e) });
    }
    await sov(PAUS_MS);
  }

  // ☠️ JÄMFÖR BARA DE PREFIX VI FAKTISKT HÄMTADE DEN HÄR KÖRNINGEN.
  //
  // Utan den här filtreringen hade varje produkt vars prefix ligger senare i
  // markören räknats som `utanTraff` — alltså "de säljer den inte" — när
  // sanningen är "vi har inte frågat än". Det är exakt samma fel som en miss
  // som räknas som ett försprång, fast på körningsnivå i stället för radnivå,
  // och det hade gjort varje delkörning till en rapport som ljuger nedåt.
  const deras = samlaDeras(derasRader);
  const tackta = new Set(hamtade);
  const iOmgangen = mappningar.filter((m) => {
    if (isAliExpressMapping(m)) return false;
    const nr = artikelnummerAv(m);
    const p = nr ? prefixAv(nr) : null;
    return p !== null && tackta.has(p);
  });

  const j = jamforPriser(iOmgangen, vartPris, deras, publicerade);
  const kvar = kvarstaende.length - hamtade.length - fel.length;

  // ☠️ DETALJRADERNA GÅR TILL VERCEL-LOGGEN, ALDRIG TILL SVARET.
  //
  // Skälet är vem som kan läsa vad. Svaret hamnar i en GitHub Actions-logg, och
  // den är PUBLIK på ett publikt repo; Vercels runtime-logg är privat för
  // kontoägaren. Raden bär artikelnumret, och kopplingen "vår produktsida =
  // Aosom-artikel X" över hela katalogen ÄR vårt inköpsled — den hör inte
  // hemma på en publik plats, inte ens utspridd över tusen rader.
  //
  // Formen är packad med flit: en loggrad per hundra produkter i stället för
  // en rad per produkt. Huset har redan mätt att loggvolym är en LÄSBARHETS-
  // fråga innan den är en kostnadsfråga (`bulk-import-worker`, 2026-09-04),
  // och tjugosex rader går att läsa. Flaggan är av som default.
  if (sp.get("detalj") === "1") {
    const nrPerProdukt = new Map(
      iOmgangen.map((m) => [m.wixProductId, artikelnummerAv(m) ?? ""]),
    );
    const rader = j.rader.map(
      (r) =>
        `${r.wixProductId}|${nrPerProdukt.get(r.wixProductId) ?? ""}`
        + `|${r.vartPris}|${r.derasPris}|${r.publicerad ? 1 : 0}`
        + `|${r.behoverPolering ? 1 : 0}`,
    );
    const delar = Math.ceil(rader.length / RADER_PER_LOGGRAD) || 1;
    for (let i = 0; i < rader.length; i += RADER_PER_LOGGRAD) {
      const n = i / RADER_PER_LOGGRAD + 1;
      console.log(
        `[dealproffsen] DETALJ ${n}/${delar} `
        + rader.slice(i, i + RADER_PER_LOGGRAD).join(" "),
      );
    }
  }

  console.log(
    `[dealproffsen] JAMFOR ${hamtade.length} prefix, ${deras.size} av deras produkter, `
    + `${j.granskade} granskade, ${j.viBilligare} vi billigare, ${j.viDyrare} vi dyrare, `
    + `${j.utanTraff} utan träff, ${j.utanVartPris} utan vårt pris, ${fel.length} fel, `
    + `stoppad på ${stoppadAv}`,
  );

  return NextResponse.json({
    ok: true,
    lage,
    prefixTotalt: alla.length,
    prefixHamtade: hamtade.length,
    derasProdukter: deras.size,
    granskade: j.granskade,
    viBilligare: j.viBilligare,
    viDyrare: j.viDyrare,
    likaPris: j.likaPris,
    utanTraff: j.utanTraff,
    utanArtikelnummer: j.utanArtikelnummer,
    utanVartPris: j.utanVartPris,
    medEan: j.rader.filter((r) => r.ean).length,
    // ☠️ `fullstandig: false` diskvalificerar rapporten som beslutsunderlag —
    // samma roll som i mediainventeringen. En halv mätning får inte se ut som
    // en hel, för det är på den man annars sätter priser.
    fullstandig: stoppadAv === "klart" && fel.length === 0 && kvar <= 0,
    stoppadAv,
    kvar: Math.max(0, kvar),
    cursor: hamtade.length > 0 ? hamtade[hamtade.length - 1] : after || null,
    fel: fel.slice(0, 10),
    rader: j.rader,
  });
}
