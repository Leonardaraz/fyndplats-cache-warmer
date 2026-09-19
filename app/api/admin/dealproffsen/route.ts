// GET /api/admin/dealproffsen — prisjämförelse mot dealproffsen.se.
//
//   ?lage=feed-info            vilka kolumner Aosoms feed FAKTISKT har
//   ?lage=ean-jakt             finns EAN-koden i Aosoms produktmanualer?
//   ?lage=vara-sidor           wix-id → vår slug + vårt namn (för rapporten)
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
import { pdfLankar, sokEanIPdf } from "@/lib/aosom/ean-jakt";
import {
  listV3ProductInfo,
  listV3ProductPrices,
  listVisibleV3ProductIds,
} from "@/lib/wix/v3-products";
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
import { PAUS_MS, hamtaPrefix, sov } from "@/lib/pricing/dealproffsen-hamta";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Tidsbudget räknad från REQUESTENS början, inte från svepets. */
const TIDSBUDGET_MS = 210_000;

/**
 * Rader per packad loggrad.
 *
 * ☠️ TALET ÄR UPPMÄTT, INTE VALT. Första versionen packade hundra produkter
 * per rad, och då kom 1 304 av ~4 200 fram: varje loggrad kapas vid EXAKT
 * 2 000 tecken på vägen ut, och 31–32 produkter är vad som ryms. Kapningen är
 * tyst — raden ser komplett ut, den bara slutar, och en fil byggd på den hade
 * saknat två tredjedelar av katalogen utan att något sagt ifrån.
 *
 * En produktrad är ~55 tecken, så trettio ger ~1 650 och håller sig innanför
 * med marginal. Höjs fälten per rad måste talet räknas om.
 */
const RADER_PER_LOGGRAD = 30;

/**
 * Rader per packad loggrad i `vara-sidor`.
 *
 * ☠️ EGET TAL, inte samma som ovan, och det är HELA poängen med att
 * kommentaren vid `RADER_PER_LOGGRAD` säger att talet måste räknas om när
 * fälten ändras. En sidrad är ~150 tecken (uuid + slug + namn) mot
 * detaljradens ~55, så trettio hade kapats vid 2 000-teckenstaket och
 * tappat två tredjedelar — exakt buggen från 2026-09-14. Tolv ger ~1 800.
 */
const RADER_PER_SIDLOGGRAD = 12;

/**
 * Tak på en manual vi ens laddar ner.
 *
 * ☠️ UPPMÄTT AV EN KRASCH, inte valt. Utan tak dog lambdan på
 * `instance was killed because it ran out of available memory` — en död som
 * inte går via try/catch, för processen tar slut i stället för att kasta.
 */
const MAX_PDF_BYTE = 20_000_000;

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

  // ── Läge 1b: finns EAN-koden i produktMANUALEN? ───────────────────────────
  //
  // Feedens EAN-kolumn är mätt tom — 0 av 6 095, och den ligger som kolumn TVÅ
  // så den går inte att missa. Samma mätning visade en kolumn ingen läst:
  // `pdf`, ifylld på 5 917 rader. Det är produktmanualen, och en manual trycker
  // nästan alltid streckkoden. Det är den enda vägen till EAN som finns kvar
  // utan att fråga Aosom, och den har aldrig prövats.
  //
  // ☠️ SVARET PARAR ALDRIG IHOP EN KOD MED EN PRODUKT, och bär aldrig
  // pdf-adressen — den innehåller artikelnumret. Koden ensam är ofarlig (den
  // ska publiceras i Merchant Center om den finns); PARET kod↔artikel är vårt
  // inköpsled, precis som par↔wixProductId är det i jämförelseläget nedan.
  if (lage === "ean-jakt") {
    const antal = Math.min(Math.max(Number(sp.get("antal") ?? 5), 1), 25);
    try {
      const res = await fetch(await resolveAosomFeedUrl());
      if (!res.ok) throw new Error(`feed HTTP ${res.status}`);
      const lankar = pdfLankar(await res.text(), antal);

      let hamtade = 0;
      let olasliga = 0;
      let medGiltig = 0;
      let medTysk = 0;
      let forStoraPdf = 0;
      let kandidaterTotalt = 0;
      let giltigaTotalt = 0;
      const exempel = new Set<string>();
      const fel: string[] = [];

      for (const lank of lankar) {
        if (Date.now() - t0 > TIDSBUDGET_MS) break;
        try {
          const r = await fetch(lank);
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          // ☠️ TAK PÅ NEDLADDNINGEN. En Aosom-manual är mest foton och kan vara
          // tiotals megabyte; utan taket dog lambdan på minnet (2026-09-15) —
          // och den döden går INTE via try/catch, för processen tar slut i
          // stället för att kasta. Samma familj som den obegränsade fan-outen.
          const langd = Number(r.headers.get("content-length") ?? 0);
          if (langd > MAX_PDF_BYTE) {
            forStoraPdf++;
            continue;
          }
          const buf = Buffer.from(await r.arrayBuffer());
          if (buf.byteLength > MAX_PDF_BYTE) {
            forStoraPdf++;
            continue;
          }
          hamtade++;
          const fynd = sokEanIPdf(buf);
          // ☠️ EN OLÄSLIG MANUAL RAPPORTERAS SOM OLÄSLIG, inte som "inga fynd".
          // Skillnaden mellan "hittade ingen kod" och "kunde inte titta" är hela
          // skillnaden mellan en grind och en vana — samma lärdom som SKU-kollen
          // som itererade en tom lista och svarade "inga krockar".
          if (fynd.strommar > 0 && fynd.upppackade === 0) olasliga++;
          kandidaterTotalt += fynd.kandidater;
          giltigaTotalt += fynd.giltiga.length;
          if (fynd.giltiga.length > 0) medGiltig++;
          if (fynd.tyska.length > 0) {
            medTysk++;
            for (const k of fynd.tyska) if (exempel.size < 5) exempel.add(k);
          }
        } catch (e) {
          // ⚠️ Adressen aldrig med i felet — den bär artikelnumret.
          fel.push(e instanceof Error ? e.message : String(e));
        }
        await sov(PAUS_MS);
      }

      console.log(
        `[dealproffsen] EAN-JAKT ${hamtade} manualer, ${forStoraPdf} for stora, `
        + `${olasliga} olasliga, `
        + `${medGiltig} med giltig GTIN-13, ${medTysk} med tyskt prefix, `
        + `${kandidaterTotalt} kandidater / ${giltigaTotalt} giltiga, ${fel.length} fel`,
      );

      return NextResponse.json({
        ok: true,
        lage,
        pdfLankarIFeeden: lankar.length,
        hamtade,
        forStoraPdf,
        olasliga,
        medGiltigGtin: medGiltig,
        medTysktPrefix: medTysk,
        // ⚠️ RÅTALET STÅR BREDVID MED FLIT. En slumpmässig trettonsiffring
        // klarar kontrollsiffran i ETT fall av tio, så `giltiga` ensamt säger
        // ingenting. Ligger kvoten kring 10 % är det brus; ligger den högt, och
        // koderna dessutom bär tyskt GS1-prefix, är det något annat.
        kandidater: kandidaterTotalt,
        giltiga: giltigaTotalt,
        exempelkoder: [...exempel],
        fel: fel.slice(0, 5),
      });
    } catch (e) {
      return NextResponse.json(
        { ok: false, error: e instanceof Error ? e.message : String(e) },
        { status: 500 },
      );
    }
  }

  // ── Läge 1c: wix-id → VÅR slug och VÅRT namn ──────────────────────────────
  //
  // Leonard 2026-09-15: *"namnet som står är deras, länken som står är deras
  // och vi har inget mot oss."* Prisjämförelsen kunde bara peka på
  // konkurrentens sida — vår egen gick inte att hitta.
  //
  // ⚠️ RADERNA GÅR TILL VERCELS PRIVATA LOGG, inte hit. Inte för att de är
  // hemliga — vår slug står i sitemapen och vårt wix-id i produktsidans
  // JSON-LD, båda publika — utan för att de är ~4 000 och en publik
  // Actions-logg som till nio tiondelar är brus är en logg ingen läser.
  // Samma skäl som `bulk-import-worker` tystades av.
  if (lage === "vara-sidor") {
    const [mappningar, info] = await Promise.all([
      getStore().listMappings(),
      listV3ProductInfo(),
    ]);

    const rader: string[] = [];
    let utanInfo = 0;
    for (const m of mappningar) {
      if (isAliExpressMapping(m)) continue;
      if (!artikelnummerAv(m)) continue;
      const i = info.get(m.wixProductId);
      if (!i) {
        // ☠️ EN MAPPNING UTAN PRODUKT RÄKNAS, den tigs inte ihjäl. Det är
        // signaturen för en föräldralös rad — samma klass som `utanLagerrader`
        // i lagersynken, där en tyst nolla bokförde produkten som synkad.
        utanInfo++;
        continue;
      }
      // ☠️ NAMNET KAPAS men kapas MÄRKBART. Ett tyst avkortat namn ser ut som
      // vårt riktiga namn; med ett ellipstecken syns det att det är kapat.
      const namn = i.namn.length > 70 ? i.namn.slice(0, 69) + "…" : i.namn;
      rader.push(`${m.wixProductId}|${i.slug}|${i.visible ? 1 : 0}|${namn}`);
    }

    // ☠️ SKIVNINGEN ÄR INTE BEKVÄMLIGHET — DEN ÄR EN UPPMÄTT GRÄNS.
    //
    // Loggläsaren kapar ett svar som blir för stort, och den kapar TYST: en
    // första körning skrev 398 loggrader och 248 av dem gick att läsa
    // tillbaka. Uppslaget täckte då 62 % av rapporten, och ett uppslag som
    // saknar var tredje rad är samma klass som den avkortade produktlistan i
    // `listVisibleV3ProductIds` — en halv mätning som ser hel ut.
    //
    // `av` delar arbetet i lika stora skivor och `del` väljer en. Ett svep är
    // alltså `del=1..av`, och svaret bär BÅDA talen så en delkörning aldrig
    // kan förväxlas med en hel.
    const av = Math.min(Math.max(Number(sp.get("av") ?? 1), 1), 20);
    const del = Math.min(Math.max(Number(sp.get("del") ?? 1), 1), av);
    const perDel = Math.ceil(rader.length / av);
    const skiva = rader.slice((del - 1) * perDel, del * perDel);

    const delar = Math.ceil(skiva.length / RADER_PER_SIDLOGGRAD) || 1;
    for (let i = 0; i < skiva.length; i += RADER_PER_SIDLOGGRAD) {
      const n = i / RADER_PER_SIDLOGGRAD + 1;
      console.log(
        `[dealproffsen] SIDOR ${del}:${n}/${delar} `
        + skiva.slice(i, i + RADER_PER_SIDLOGGRAD).join(" "),
      );
    }
    console.log(
      `[dealproffsen] VARA-SIDOR del ${del}/${av}: ${skiva.length} av `
      + `${rader.length} rader, ${utanInfo} utan produkt, `
      + `${info.size} produkter i katalogen`,
    );

    return NextResponse.json({
      ok: true,
      lage,
      katalogen: info.size,
      rader: rader.length,
      del,
      av,
      iDennaDel: skiva.length,
      utanProdukt: utanInfo,
      loggrader: delar,
      // ⚠️ Samma roll som `fullstandig` i jämförelsen: en delkörning får inte
      // se ut som en hel, för det är på den man annars bygger rapporten.
      fullstandig: av === 1,
    });
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
