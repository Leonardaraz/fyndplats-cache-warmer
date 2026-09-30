// GET /api/admin/fargbilder — varje färg på en sammanslagen sida får ALLA sina
// bilder (2026-09-30). Logiken och skälen: lib/aosom/fargbilder.ts.
//
//   ?lage=plan                        (default) räkna fram planen, skriv ingenting
//   &hogst=10                         så många sidor (1–50), de första i wix-id-ordning
//   &sidor=<wix-id>,<wix-id>          i stället för hogst: just de här sidorna
//   &ta_med_granskade=ja              ta med opolerade givares bilder från position 3
//   ?lage=skriv&bekrafta=<sha>        skriv — sha är planens, med samma parametrar
//
// ☠️ TORRT SOM DEFAULT. `skriv` kräver `bekrafta` = planens sha256. Planen räknas
// om ur en färsk läsning i samma anrop, och skiljer sig sha:n har något ändrats
// sedan en människa läste planen — då skrivs ingenting.
//
// ☠️ KÖRNINGEN STANNAR VID FÖRSTA AVVIKELSEN. Varje sida läses tillbaka efter
// skrivningen (galleri, alt-texter, varje vals lista, synlighet, varianter),
// och stämmer något inte skrivs ingen fler sida.
//
// ☠️ SVARET BÄR BARA WIX-ID, RÄKNARE OCH HINDER. Loggen är publik; namn,
// sluggar och alt-texter är ofta Aosoms tyska titlar, och artikelnummer och
// priser läses aldrig ens här.
//
// Auth: CRON_SECRET eller EXTENSION_API_TOKEN, som husets andra admin-rutter.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { MIN_KATALOG, KATALOG_TOLERANS } from "@/lib/aosom/pensionerade";
import {
  doldaPerFil,
  planSha,
  planeraSida,
  raknare,
  valNyckel,
  valjSidor,
  type SidPlan,
} from "@/lib/aosom/fargbilder";
import { lasSidaIn, skrivSida, type SkrivUtfall } from "@/lib/aosom/fargbilder-kor";
import { getFargbildLager } from "@/lib/store/fargbilder";
import { countProducts, headlessSiteId, listCatalogProductMedia } from "@/lib/wix/media-audit";
import { queryAuctions } from "@/lib/auction/store";
import { skapaWixAnrop } from "@/lib/polish/skrivplan-wix";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Räknad från requestens början. */
const TIDSBUDGET_MS = 270_000;
/** Katalogsvepet får högst så här mycket; resten är sidornas. */
const SVEP_BUDGET_MS = 150_000;
const STANDARD_HOGST = 10;
const MAX_HOGST = 50;
/** Så många hindrade sidor läses utöver `hogst` innan planen ger sig. */
const MAX_EXTRA_LASTA = 40;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

const fel = (status: number, error: string, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ ok: false, error, ...extra }, { status });

export async function GET(req: NextRequest) {
  const t0 = Date.now();
  if (!auktoriserad(req)) return fel(401, "Otillåten");

  const sp = req.nextUrl.searchParams;
  const lage = sp.get("lage") ?? "plan";
  if (lage !== "plan" && lage !== "skriv") return fel(400, "lage ska vara plan eller skriv");
  const taMedGranskade = sp.get("ta_med_granskade") === "ja";
  const bekrafta = (sp.get("bekrafta") ?? "").trim().toLowerCase();
  if (lage === "skriv" && !/^[0-9a-f]{64}$/.test(bekrafta)) {
    return fel(400, "skriv kräver bekrafta = planens sha (64 hextecken)");
  }
  const sidorParam = (sp.get("sidor") ?? "").trim();
  const sidor = sidorParam ? [...new Set(sidorParam.split(",").map((s) => s.trim()).filter(Boolean))] : [];
  if (sidor.some((s) => !UUID.test(s))) return fel(400, "sidor ska vara wix-id (uuid), kommaseparerade");
  if (sidor.length > MAX_HOGST) return fel(400, `högst ${MAX_HOGST} sidor per körning`);
  const hogstParam = sp.get("hogst");
  const hogst = hogstParam === null ? STANDARD_HOGST : Number(hogstParam);
  if (!Number.isInteger(hogst) || hogst < 1 || hogst > MAX_HOGST) return fel(400, `hogst ska vara 1–${MAX_HOGST}`);
  if (sidor.length && hogstParam !== null) return fel(400, "ange sidor ELLER hogst, inte båda");

  const sajt = headlessSiteId();
  const wix = skapaWixAnrop();
  const lager = getFargbildLager();

  // ── Underlaget: katalogen (givarna hittas via filen), tabellen, auktionerna ─
  // ☠️ Ett ofullständigt svep vägras. Saknas en dold produkt i indexet ser ett
  // val ut att sakna givare, eller en tvetydig fil ser entydig ut.
  let katalog;
  try {
    const svep = await listCatalogProductMedia(sajt, { deadline: t0 + SVEP_BUDGET_MS });
    if (!svep.complete) return fel(503, "katalogsvepet blev inte klart — ingenting planeras på en halv katalog");
    if (svep.produkter.length < MIN_KATALOG) return fel(503, `katalogsvepet såg bara ${svep.produkter.length} produkter`);
    const antal = await countProducts(sajt);
    if (svep.produkter.length < antal - KATALOG_TOLERANS) {
      return fel(503, `katalogsvepet såg ${svep.produkter.length} av ${antal} produkter`);
    }
    katalog = svep.produkter;
  } catch (e) {
    console.error(`[fargbilder] svepet: ${e instanceof Error ? e.message : String(e)}`);
    return fel(500, "katalogen gick inte att läsa");
  }
  const dolda = doldaPerFil(katalog);
  let skrivna: Set<string>;
  let auktioner: Set<string>;
  try {
    skrivna = new Set(
      (await lager.lasSkrivnaVal()).flatMap((r) => [valNyckel(r.wixProductId, r.choiceId), valNyckel(r.wixProductId, "*")]),
    );
    // Bara LIVE: kön har en rad per produkt i katalogen, så "queued" är varje sida.
    auktioner = new Set((await queryAuctions(["live"])).map((a) => a.productId));
  } catch (e) {
    console.error(`[fargbilder] tabellen/auktionerna: ${e instanceof Error ? e.message : String(e)}`);
    return fel(500, "tabellen eller auktionerna gick inte att läsa");
  }
  const kandidater = valjSidor(katalog, dolda, skrivna);

  // ── Planen, ur färska läsningar ──────────────────────────────────────────
  // `hogst` räknar sidor som GÅR att skriva. En sida med ett hinder står kvar
  // bland kandidaterna tills någon löst det, och hade den räknats hade samma
  // hindrade sidor fyllt varje körning. De redovisas ändå, och läsningen har
  // ett tak så att en lång rad hindrade sidor inte äter tidsbudgeten. Ingen
  // klocka här, med flit: planen ska bli densamma i `plan` och `skriv`.
  const planer: SidPlan[] = [];
  const saknas: string[] = [];
  const ko = sidor.length ? sidor : kandidater;
  const maxLasta = sidor.length ? sidor.length : hogst + MAX_EXTRA_LASTA;
  let skrivbara = 0;
  try {
    for (const id of ko.slice(0, maxLasta)) {
      if (!sidor.length && skrivbara >= hogst) break;
      const hinder = auktioner.has(id) ? ["oppen_auktion"] : [];
      const las = await lasSidaIn({ wix, lager }, id, dolda, hinder);
      if (!las) {
        saknas.push(id);
        continue;
      }
      const plan = planeraSida(las.in, { taMedGranskade });
      planer.push(plan);
      if (plan.hinder.length === 0) skrivbara++;
    }
  } catch (e) {
    console.error(`[fargbilder] läsningen: ${e instanceof Error ? e.message : String(e)}`);
    return fel(500, "en sida gick inte att läsa — se Vercel-loggen");
  }
  const sha = planSha(planer, taMedGranskade);
  const sidRaknare = planer.map(raknare);
  const summa = {
    sidor: planer.length,
    hindrade: planer.filter((p) => p.hinder.length > 0).length,
    andrasIWix: planer.filter((p) => p.hinder.length === 0 && p.andrarWix).length,
    baraTabell: planer.filter((p) => p.hinder.length === 0 && !p.andrarWix && p.andrarTabell).length,
    nyaIGalleriet: sidRaknare.reduce((n, r) => n + r.nyaIGalleriet, 0),
    urGalleriet: sidRaknare.reduce((n, r) => n + r.urGalleriet, 0),
    overflow: sidRaknare.reduce((n, r) => n + r.overflow, 0),
    granskas: sidRaknare.reduce((n, r) => n + r.granskas, 0),
    altNya: sidRaknare.reduce((n, r) => n + r.altNya, 0),
  };
  const bas = {
    ok: true,
    lage,
    taMedGranskade,
    sha,
    kandidaterTotalt: kandidater.length,
    saknasIWix: saknas,
    summa,
    sidor: sidRaknare,
  };
  console.log(
    `[fargbilder] ${lage.toUpperCase()}: ${planer.length} sidor av ${kandidater.length} kandidater, `
      + `${summa.andrasIWix} ändras i Wix, ${summa.hindrade} hindrade, ${summa.overflow} i overflow, `
      + `${summa.granskas} granskas${taMedGranskade ? " (tas med)" : ""}`,
  );
  if (lage === "plan") return NextResponse.json(bas);

  // ── Skriv ────────────────────────────────────────────────────────────────
  if (bekrafta !== sha) {
    return fel(409, "planen har ändrats sedan bekrafta räknades — kör plan igen, läs den och skicka dess sha", {
      lage,
      taMedGranskade,
    });
  }
  const utfallen: SkrivUtfall[] = [];
  let stoppadAv: "klart" | "avvikelse" | "tidsbudget" = "klart";
  for (const p of planer) {
    if (p.hinder.length > 0 || (!p.andrarWix && !p.andrarTabell)) continue;
    if (Date.now() - t0 > TIDSBUDGET_MS - 30_000) {
      stoppadAv = "tidsbudget";
      break;
    }
    const u = await skrivSida(p, { wix, lager });
    utfallen.push(u);
    if (!u.ok) {
      stoppadAv = "avvikelse";
      break;
    }
  }
  const lyckade = utfallen.filter((u) => u.ok).length;
  await audit(
    "fargbilder",
    "skriv",
    `${lyckade} sidor skrivna, stopp ${stoppadAv}${taMedGranskade ? ", med granskade" : ""}`,
  ).catch(() => {});
  return NextResponse.json(
    {
      ...bas,
      ok: stoppadAv !== "avvikelse",
      stoppadAv,
      skrivna: lyckade,
      // Utfall per sida: wix-id, ok, stegen (räknare) och felet (fasta texter).
      utfall: utfallen,
    },
    { status: stoppadAv === "avvikelse" ? 500 : 200 },
  );
}
