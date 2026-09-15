// GET /api/admin/konkurrentpris — konkurrentregelns bokföring (2026-09-15).
//
//   ?lage=status                         hur ser lagret av konkurrentpriser ut
//   ?lage=spara                          TORRKÖRNING: vilka rader skulle få
//                                        dealproffsens pris sparat
//   ?lage=spara&dryRun=false             skriver `konkurrent` på raderna
//   ?lage=spara&after=845-               fortsätt från ett prefix (markör)
//   ?lage=lotta                          TORRKÖRNING: vilka rader skulle lottas A/B
//   ?lage=lotta&dryRun=false&bekrafta=N  lottar — N är torrkörningens antal
//   ?lage=lotta&bara=<wix-id,wix-id,…>   begränsa lottningen till ett urval
//
// VARFÖR RUTTEN FINNS. Prisjämförelsen (/api/admin/dealproffsen) mäter och
// kan inte skriva, med flit. Men konkurrentregeln i synken
// (lib/pricing/konkurrentregel.ts) behöver deras pris PÅ RADEN för att kunna
// räkna, var sjätte timme, utan att fråga deras server. Den här rutten är
// bryggan: den hämtar på exakt samma sätt som jämförelsen
// (lib/pricing/dealproffsen-hamta.ts) och bokför priset på mappningen.
//
// ☠️ DEN SKRIVER ALDRIG ETT KUNDPRIS. Den skriver dealproffsens pris och en
// grupp — synken räknar fram kundpriset ur dem, med golv och tak, och synken
// har sin egen torrkörning. Två grindar, inte en.
//
// ☠️ SVARET BÄR ALDRIG AOSOMS ARTIKELNUMMER. Samma skäl som i jämförelsen: det
// hamnar i en publik Actions-logg. Raderna nycklas på `wixProductId`.
//
// ☠️ LOTTNINGEN KRÄVER `bekrafta`. Gruppen avgör vilket pris tusen kunder ser,
// och en lottning går inte att göra ogjord utan att förstöra testet. Samma
// mönster som prishöjningen: kör torrt, läs planen, skicka DESS antal.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getStore } from "@/lib/store/factory";
import { listV3ProductPrices, listVisibleV3ProductIds } from "@/lib/wix/v3-products";
import { prefixLista, samlaDeras, type DerasRad } from "@/lib/pricing/dealproffsen";
import { PAUS_MS, hamtaPrefix, sov } from "@/lib/pricing/dealproffsen-hamta";
import {
  konkurrentStatus,
  planeraLotta,
  planeraSpara,
} from "@/lib/pricing/konkurrentpris-plan";
import { KONKURRENT_MAX_ALDER_DAGAR } from "@/lib/pricing/konkurrentregel";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Tidsbudget räknad från REQUESTENS början — hämtning OCH skrivning ska rymmas. */
const TIDSBUDGET_MS = 200_000;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  const t0 = Date.now();
  if (!auktoriserad(req)) {
    return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  }
  const sp = req.nextUrl.searchParams;
  const lage = sp.get("lage") ?? "status";
  const dryRun = sp.get("dryRun") !== "false";
  const store = getStore();

  // ── status ────────────────────────────────────────────────────────────────
  if (lage === "status") {
    const s = konkurrentStatus(await store.listMappings(), t0);
    console.log(
      `[konkurrentpris] STATUS ${s.aosomRader} aosom-rader, ${s.medKonkurrentpris} med konkurrentpris `
        + `(${s.farska} färska, ${s.gamla} GAMLA), grupp A ${s.medGrupp.A} / B ${s.medGrupp.B}, `
        + `${s.gruppUtanPris} grupp utan pris, äldsta ${s.aldstaDagar ?? "-"} dagar`,
    );
    return NextResponse.json({ ok: true, lage, maxAlderDagar: KONKURRENT_MAX_ALDER_DAGAR, ...s });
  }

  // ── spara: hämta deras priser och bokför dem på raderna ───────────────────
  if (lage === "spara") {
    const mappningar = await store.listMappings();
    const alla = prefixLista(mappningar);
    const after = (sp.get("after") ?? "").trim().toUpperCase();
    const start = after ? alla.findIndex((p) => p > after) : 0;
    const kvarstaende = start < 0 ? [] : alla.slice(start);

    const derasRader: DerasRad[] = [];
    const hamtade: string[] = [];
    const fel: Array<{ prefix: string; skal: string }> = [];
    let stoppadAv: "klart" | "tidsbudget" = "klart";

    for (const prefix of kvarstaende) {
      // Halva budgeten till hämtning: skrivningen nedan behöver resten.
      if (Date.now() - t0 > TIDSBUDGET_MS / 2) {
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

    // ☠️ INGET PREFIX HÄMTAT = INGEN MÄTNING. Då vet körningen ingenting och
    // ska inte se ut som ett svar — och absolut inte skriva något.
    if (hamtade.length === 0) {
      return NextResponse.json(
        { ok: false, lage, error: "Inget prefix gick att hämta — ingenting sparat", fel: fel.slice(0, 10) },
        { status: 502 },
      );
    }

    const plan = planeraSpara(mappningar, samlaDeras(derasRader), new Set(hamtade), Date.now());
    const kvar = kvarstaende.length - hamtade.length - fel.length;

    let sparade = 0;
    let skrivfel = 0;
    if (!dryRun) {
      const hamtad = new Date().toISOString();
      for (const r of plan.attSpara) {
        if (Date.now() - t0 > TIDSBUDGET_MS) {
          stoppadAv = "tidsbudget";
          break;
        }
        try {
          // ☠️ Bara de två fälten. Raden i övrigt är som den lästes — och
          // artikelnumret lämnar aldrig `supplierProductId`.
          await store.saveMapping({ ...r.m, konkurrent: { pris: r.pris, hamtad } });
          sparade++;
        } catch {
          skrivfel++;
        }
      }
      await audit(
        "konkurrentpris",
        "spara",
        `${sparade} konkurrentpriser sparade (${plan.attSpara.length} planerade), `
          + `${plan.oforandrade} oförändrade, ${plan.utanTraff} utan träff, `
          + `${hamtade.length} prefix, ${fel.length} prefixfel, ${skrivfel} skrivfel, `
          + `stoppad på ${stoppadAv}`,
      );
    }

    console.log(
      `[konkurrentpris] SPARA ${dryRun ? "TORR" : "SKARP"} ${hamtade.length} prefix, `
        + `${plan.attSpara.length} att spara, ${sparade} sparade, ${plan.oforandrade} oförändrade, `
        + `${plan.utanTraff} utan träff, ${plan.utanforOmgangen} utanför omgången, `
        + `${fel.length} fel, ${skrivfel} skrivfel, stoppad på ${stoppadAv}, ${kvar} kvar`,
    );

    return NextResponse.json({
      ok: true,
      lage,
      dryRun,
      prefixTotalt: alla.length,
      prefixHamtade: hamtade.length,
      attSpara: plan.attSpara.length,
      // Nya priser mot uppfriskade: säger om marknaden rört sig eller bara klockan.
      nyaPriser: plan.attSpara.filter((r) => r.fran !== r.pris).length,
      sparade,
      skrivfel,
      oforandrade: plan.oforandrade,
      utanTraff: plan.utanTraff,
      utanforOmgangen: plan.utanforOmgangen,
      utanArtikelnummer: plan.utanArtikelnummer,
      // ⚠️ Samma roll som i jämförelsen: en delkörning får inte se ut som en hel.
      // ☠️ OCH EN SKARP KÖRNING SOM INTE HANN SKRIVA ALLT ÄR INTE HEL, även om
      // hämtningen var det: markören går vidare, så de osparade raderna får
      // vänta till nästa varv — det ska synas, inte döljas i ett grönt jobb.
      fullstandig:
        stoppadAv === "klart" && fel.length === 0 && kvar <= 0
        && (dryRun || sparade === plan.attSpara.length),
      stoppadAv,
      kvar: Math.max(0, kvar),
      cursor: hamtade[hamtade.length - 1] ?? null,
      fel: fel.slice(0, 10),
      // Exempel på vad som ändras, nycklat på wix-id — aldrig artikelnummer.
      exempel: plan.attSpara
        .filter((r) => r.fran !== null && r.fran !== r.pris)
        .slice(0, 20)
        .map((r) => ({ wixProductId: r.m.wixProductId, fran: r.fran, till: r.pris })),
    });
  }

  // ── lotta: A/B-grupp på urvalet ───────────────────────────────────────────
  if (lage === "lotta") {
    const baraParam = (sp.get("bara") ?? "").trim();
    const bara = baraParam
      ? new Set(baraParam.split(",").map((s) => s.trim()).filter(Boolean))
      : null;

    const [mappningar, vartPris, publicerade] = await Promise.all([
      store.listMappings(),
      listV3ProductPrices(),
      listVisibleV3ProductIds(),
    ]);
    const plan = planeraLotta(mappningar, vartPris, publicerade, bara);

    let lottade = 0;
    let skrivfel = 0;
    if (!dryRun) {
      const bekrafta = (sp.get("bekrafta") ?? "").trim();
      if (bekrafta !== String(plan.attLotta.length)) {
        return NextResponse.json(
          {
            ok: false,
            lage,
            error: `bekrafta måste vara torrkörningens antal (${plan.attLotta.length}), fick "${bekrafta}"`,
            rad: "Kör torrläget igen, läs planen, och skicka DESS antal.",
          },
          { status: 400 },
        );
      }
      for (const r of plan.attLotta) {
        try {
          await store.saveMapping({ ...r.m, prisgrupp: r.grupp });
          lottade++;
        } catch {
          skrivfel++;
        }
      }
      await audit(
        "konkurrentpris",
        "lotta",
        `${lottade} rader lottade (A ${plan.perGrupp.A} / B ${plan.perGrupp.B}), `
          + `${plan.redanLottade} redan lottade, ${skrivfel} skrivfel`
          + (bara ? `, urval på ${bara.size} wix-id` : ""),
      );
    }

    console.log(
      `[konkurrentpris] LOTTA ${dryRun ? "TORR" : "SKARP"} ${plan.attLotta.length} att lotta `
        + `(A ${plan.perGrupp.A} / B ${plan.perGrupp.B}), ${lottade} lottade, `
        + `${plan.redanLottade} redan lottade, ${plan.utanKonkurrent} utan konkurrentpris, `
        + `${plan.ejPublicerade} ej publicerade, ${plan.utanVartPris} utan vårt pris, ${skrivfel} skrivfel`,
    );

    return NextResponse.json({
      ok: true,
      lage,
      dryRun,
      attLotta: plan.attLotta.length,
      perGrupp: plan.perGrupp,
      lottade,
      skrivfel,
      redanLottade: plan.redanLottade,
      utanKonkurrent: plan.utanKonkurrent,
      ejPublicerade: plan.ejPublicerade,
      utanVartPris: plan.utanVartPris,
      urval: bara ? bara.size : null,
      rader: plan.attLotta.map((r) => ({ wixProductId: r.m.wixProductId, grupp: r.grupp, vartPris: r.vartPris })),
    });
  }

  return NextResponse.json({ ok: false, error: `Okänt läge: ${lage}` }, { status: 400 });
}
