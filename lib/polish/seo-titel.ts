// SEO-titel och metabeskrivning på redan PUBLICERADE sidor, och ingenting annat.
//
// ☠️ VARFÖR EN EGEN SKRIVVÄG (2026-11-11). Semrush fann 63 publicerade sidor som
// delade titel med en annan sida och fyra som delade metabeskrivning. Poleringens
// textsteg kan inte rätta dem: det skriver namn, adress, brödtext och synlighet i
// samma anrop, och en plan för det kräver en hel runda per sida. Här skrivs bara
// `seoData`, med fältmask, så namnet, adressen, texten, bilderna, priset och
// varianterna inte kan röras.
//
// Reglerna:
//   - bara sidor som är publicerade nu. Ett utkast poleras i en runda;
//   - titeln slutar på " | Fyndplats" och är högst 60 tecken, beskrivningen
//     högst 160 (samma tal som tools/polish-gates/gate-seo.py);
//   - ingen titel eller beskrivning får stå på en annan publicerad sida eller
//     två gånger i planen (lib/polish/seo-unik.ts);
//   - alla villkor prövas för alla rader före första skrivningen;
//   - skarpt läge kräver antalet sidor som torrkörningen sa att den skriver;
//   - varje skrivning bär en färsk revision, och verifieringen är en egen
//     läsning efteråt. Ett PATCH-svar är inget kvitto.
//
// Vad texterna SÄGER prövas inte här. Det gör grindarna i rundans katalog
// (gate-seo.py mot den publicerade sidan) innan planen byggs.
//
// ☠️ SVARET GÅR TILL EN PUBLIK LOGG: kort-id, fältnamn, utfall och antal.
// Aldrig texterna, och ett Wix-fel tvättas av anroparen (felText).

import { artikelnummerformer, felText, HEX8, MODELLNR, produktAv, RUNDA, type StegRad, type StegUtfall, strang, summera, UUID, type WixAnrop } from "./skrivplan";
import { krocktext, lasPubliceradSeo, seoKrockar, seoKrockarInom, seoUrProdukt } from "./seo-unik";

export const MAX_SEO_RADER = 40;
export const SEO_LAGEN = ["torr", "skriv", "verifiera"] as const;
export type SeoLage = (typeof SEO_LAGEN)[number];

/** Googles klipp, samma tal som gate-seo.py. */
export const MAX_TITEL = 60;
export const MAX_BESK = 160;
/** Kortare än så säger en titel eller beskrivning ingenting om sidan. */
export const MIN_TITEL = 20;
export const MIN_BESK = 50;
const SUFFIX = " | Fyndplats";
/** Paus mellan skrivningarna. Wix edge-spärr utlöses av tempo (docs/claude/05-aosom-synken/02). */
export const SKRIVPAUS_MS = 150;

export interface SeoRad {
  kort: string;
  pid: string;
  seoTitel: string;
  seoBesk: string;
}

export interface SeoPlan {
  namn: string;
  rader: SeoRad[];
}

export interface SeoUtfall extends StegUtfall {
  /** Antalet sidor där titeln eller beskrivningen skiljer sig från planen. */
  attSkriva: number;
}

type Obj = Record<string, unknown>;

export function valideraSeoPlan(x: unknown): { plan: SeoPlan } | { fel: string[] } {
  const fel: string[] = [];
  if (typeof x !== "object" || x === null || Array.isArray(x)) return { fel: ["planen måste vara ett objekt"] };
  const p = x as Obj;
  if (!strang(p.namn, 60) || !RUNDA.test(p.namn)) fel.push("namn saknas eller har fel form");
  if (!Array.isArray(p.rader) || p.rader.length === 0) return { fel: [...fel, "rader saknas"] };
  if (p.rader.length > MAX_SEO_RADER) return { fel: [...fel, `högst ${MAX_SEO_RADER} rader per plan`] };

  const sedda = { kort: new Set<string>(), pid: new Set<string>() };
  const jamfor: Array<{ kort: string; seoTitel: string; seoBesk: string }> = [];
  p.rader.forEach((r: unknown, i: number) => {
    const d = (typeof r === "object" && r !== null ? r : {}) as Obj;
    const var_ = typeof d.kort === "string" && HEX8.test(d.kort) ? d.kort : `rad ${i + 1}`;
    const f = (t: string) => fel.push(`${var_}: ${t}`);

    if (!strang(d.kort, 8) || !HEX8.test(d.kort)) f("kort ska vara 8 hextecken");
    if (!strang(d.pid, 36) || !UUID.test(d.pid)) f("pid ska vara ett uuid");
    else if (typeof d.kort === "string" && !d.pid.startsWith(d.kort)) f("pid börjar inte med kort");

    if (!strang(d.seoTitel, MAX_TITEL)) f(`seoTitel saknas eller är längre än ${MAX_TITEL} tecken`);
    else if (!d.seoTitel.endsWith(SUFFIX)) f(`seoTitel slutar inte på "${SUFFIX}"`);
    else if (d.seoTitel.length - SUFFIX.length < MIN_TITEL) f(`seoTitel är kortare än ${MIN_TITEL} tecken före "${SUFFIX}"`);
    if (!strang(d.seoBesk, MAX_BESK)) f(`seoBesk saknas eller är längre än ${MAX_BESK} tecken`);
    else if (d.seoBesk.length < MIN_BESK) f(`seoBesk är kortare än ${MIN_BESK} tecken`);

    for (const falt of ["seoTitel", "seoBesk"] as const) {
      const v = d[falt];
      if (typeof v !== "string") continue;
      if (v !== v.trim() || /\s{2,}|[\r\n\t]/.test(v)) f(`${falt} har mellanslag i början eller slutet, dubbla mellanslag eller radbrytning`);
      // ☠️ Felet namnger fältet, aldrig träffen — svaret går till en publik logg.
      if (artikelnummerformer(v) > 0) f(`${falt} har artikelnummerform`);
      if (MODELLNR.test(v)) f(`${falt} har ett modellnummer`);
    }

    for (const nyckel of ["kort", "pid"] as const) {
      const v = d[nyckel];
      if (typeof v !== "string") continue;
      if (sedda[nyckel].has(v)) f(`${nyckel} förekommer två gånger i planen`);
      sedda[nyckel].add(v);
    }
    jamfor.push({
      kort: var_,
      seoTitel: typeof d.seoTitel === "string" ? d.seoTitel : "",
      seoBesk: typeof d.seoBesk === "string" ? d.seoBesk : "",
    });
  });
  for (const k of seoKrockarInom(jamfor)) fel.push(`${k.kort}: ${k.falt} är densamma som hos ${k.mot} i planen`);

  return fel.length ? { fel } : { plan: x as SeoPlan };
}

function stopp(avbrutet: string, rader: StegRad[] = []): SeoUtfall {
  return { ok: false, rader, avbrutet, attSkriva: 0, sammanfattning: "0 skrivna" };
}

/** De två taggar huset skriver, i husets ordning, och tomma nyckelord (samma som textsteget). */
function seoData(r: SeoRad): Obj {
  return {
    tags: [
      { type: "title", children: r.seoTitel },
      { type: "meta", props: { name: "description", content: r.seoBesk } },
    ],
    settings: { keywords: [] },
  };
}

const taggar = (produkt: Obj): Obj[] => ((produkt.seoData as Obj | undefined)?.tags as Obj[] | undefined) ?? [];

/**
 * Vad på sidan som skiljer sig från planen: de två texterna, och antalet taggar.
 * Tom lista betyder att sidan redan bär planens texter i husets två taggar.
 *
 * ☠️ Fler än två taggar är ett gömställe (og:title bar tysk text en månad efter
 * att titeln rättats, 2026-09-07). En sådan sida skrivs om även när de två
 * texterna redan stämmer, så att bara husets två taggar står kvar.
 */
function skillnader(r: SeoRad, produkt: Obj): Array<"seoTitel" | "seoBesk" | "taggar"> {
  const tags = taggar(produkt);
  const nu = seoUrProdukt({ seoData: { tags } });
  const ut: Array<"seoTitel" | "seoBesk" | "taggar"> = [];
  if (nu.titel !== r.seoTitel) ut.push("seoTitel");
  if (nu.besk !== r.seoBesk) ut.push("seoBesk");
  if (tags.length !== 2) ut.push("taggar");
  return ut;
}

const SKILLNAD_TEXT = { seoTitel: "titeln är inte planens", seoBesk: "metabeskrivningen är inte planens", taggar: "fler eller färre än två SEO-taggar" } as const;

export async function korSeoTitel(
  plan: SeoPlan,
  wix: WixAnrop,
  lage: SeoLage,
  bekrafta: number | null,
  vanta: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
): Promise<SeoUtfall> {
  // Varje sida läses färskt: synligheten, revisionen och de taggar den bär nu.
  const nu = new Map<string, Obj>();
  const lasfel: StegRad[] = [];
  for (const r of plan.rader) {
    try {
      nu.set(r.pid, produktAv(await wix("GET", `/stores/v3/products/${r.pid}`)));
    } catch (e) {
      lasfel.push({ kort: r.kort, ok: false, fel: felText(e) });
    }
  }
  if (lasfel.length) return stopp("en sida gick inte att läsa — ingenting skrivet", lasfel);

  if (lage === "verifiera") {
    const rader = plan.rader.map((r): StegRad => {
      const p = nu.get(r.pid)!;
      const fel = [...skillnader(r, p).map((f) => SKILLNAD_TEXT[f]), ...(p.visible !== true ? ["sidan är inte publicerad"] : [])];
      return fel.length ? { kort: r.kort, ok: false, fel: fel.join(" · ") } : { kort: r.kort, ok: true };
    });
    return { ...summera(rader, "sidor verifierade"), attSkriva: 0 };
  }

  // Villkoren, för alla rader, före första skrivningen.
  const villkor: StegRad[] = plan.rader
    .filter((r) => nu.get(r.pid)!.visible !== true)
    .map((r) => ({ kort: r.kort, ok: false, fel: "sidan är inte publicerad — ett utkast poleras i en runda" }));
  if (villkor.length) return stopp("ett villkor föll — ingenting skrivet", villkor);

  const krockar = seoKrockar(plan.rader, await lasPubliceradSeo(wix));
  if (krockar.length) {
    return stopp(
      `titel eller metabeskrivning står redan på en annan publicerad sida: ${krocktext(krockar)} — ingenting skrivet`,
      krockar.map((k) => ({ kort: k.kort, ok: false, fel: `${k.falt} står redan på ${k.mot}` })),
    );
  }

  const andras = new Map(plan.rader.map((r) => [r.pid, skillnader(r, nu.get(r.pid)!)]));
  const attSkriva = [...andras.values()].filter((f) => f.length > 0).length;

  if (lage === "torr") {
    const rader: StegRad[] = plan.rader.map((r) => {
      const f = andras.get(r.pid)!;
      return f.length ? { kort: r.kort, ok: true, torr: true, andras: f.join("+") } : { kort: r.kort, ok: true, torr: true, redan: true };
    });
    return {
      ok: true,
      rader,
      attSkriva,
      sammanfattning: `${attSkriva} sidor att skriva, ${plan.rader.length - attSkriva} bär redan planens texter (torrt)`,
    };
  }

  // Skarpt läge: antalet ska stämma med läsningen nu.
  if (bekrafta !== attSkriva) {
    return stopp(`bekrafta ska vara ${attSkriva} (sidor att skriva enligt läsningen nu), inte ${bekrafta ?? "utelämnad"} — ingenting skrivet`);
  }

  const rader: StegRad[] = [];
  let skrivna = 0;
  for (const r of plan.rader) {
    if (!andras.get(r.pid)!.length) {
      rader.push({ kort: r.kort, ok: true, redan: true });
      continue;
    }
    try {
      if (skrivna > 0) await vanta(SKRIVPAUS_MS);
      const fore = nu.get(r.pid)!;
      // ☠️ Bara seoData, med fältmask. Namn, adress, brödtext, synlighet, bilder,
      // pris och varianter står inte i anropet och kan därför inte ändras av det.
      const efter = produktAv(
        await wix("PATCH", `/stores/v3/products/${r.pid}`, {
          product: { revision: fore.revision, seoData: seoData(r) },
          fieldMask: { paths: ["seoData"] },
        }),
      );
      skrivna++;
      rader.push({ kort: r.kort, ok: true, revisionFore: fore.revision, revisionEfter: efter.revision });
    } catch (e) {
      rader.push({ kort: r.kort, ok: false, fel: felText(e) });
    }
  }
  const fel = rader.filter((x) => !x.ok).length;
  return {
    ok: fel === 0,
    rader,
    attSkriva,
    sammanfattning: `${skrivna} sidor skrivna, ${plan.rader.length - attSkriva} bar redan planens texter, ${fel} fel`,
  };
}
