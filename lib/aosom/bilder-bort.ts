// Bilder ur en publicerad sida — också bilder som ett färgval pekar på (2026-10-14).
//
// Bildplanen (lib/polish/bildplan.ts) och färgbildsverktyget (fargbilder.ts)
// tappar aldrig en bild som ett val pekar på. Det är rätt som regel: Wix svarar
// 404 PRODUCT_MEDIA_NOT_EXIST när en länkad bild faller ur galleriet, och en
// länkad bild är nästan alltid en bild någon vill ha kvar.
//
// Men ibland är just den länkade bilden fel. Cykelkärran 571e37bf fick en tysk
// och en engelsk måttbild med text inbränd i pixlarna när den blå färgen slogs
// ihop med sidan. Båda är länkade till Blå, och då fanns ingen väg ut i
// verktygen, medan runbooken förbjuder att skriva för hand i Wix. Det här
// verktyget är den vägen.
//
// ☠️ ORDNINGEN ÄR OMVÄND MOT FÄRGBILDSVERKTYGETS, av samma skäl:
//
//   1. Valens `linkedMedia` skrivs FÖRST, utan bilderna som ska bort. Med
//      options + variantsInfo ordagrant ur GET:en och `visible` med (en
//      variantsInfo-PATCH publicerar annars ett utkast, och utan options
//      svarar Wix 428; CLAUDE.md).
//   2. Galleriet skrivs sedan ENSAMT (fieldMask media), utan bilderna. Nu pekar
//      inget val på dem, så Wix ger inget 404.
//   3. Återläsning: galleriet, alt-texterna, varje vals lista, synligheten och
//      varje variants synlighet, pris, SKU och val jämförs mot planen.
//   4. Variantbilderna följs upp (lib/wix/variant-media.ts). Den läser först
//      och skriver bara när en variant avviker.
//
// En sida som föll mellan steg 1 och 2 är ofarlig: valen pekar på färre bilder
// och galleriet har alla kvar. En ny plan ser läget (valen redan utan bilderna)
// och gör bara resten.
//
// ☠️ BARA EN MÄNNISKA VÄLJER BILDERNA. Verktyget tar fil-id från anroparen och
// gissar aldrig vilka bilder som är fel. Torrt som default: `skriv` kräver
// `bekrafta` = planens sha, räknad om ur en färsk läsning i samma anrop.
//
// ☠️ Svaret går till en PUBLIK Actions-logg: wix-id, platser, antal och hinder.
// Aldrig alt-texter, namn eller sluggar.

import { createHash } from "node:crypto";
import { felText, type WixAnrop } from "../polish/skrivplan";
import { KOSTNAD_EJ_LASBAR, likaKostnad } from "../wix/produkt-kostnad";
import { refreshVariantMedia, variantbildSteg } from "../wix/variant-media";
import type { Bild, VariantLage } from "./fargbilder";
import {
  GALLERI_OMLASNINGAR,
  KOPPLING_FORSOK,
  KOPPLING_PAUS_MS,
  arOvergaende,
  lasProdukt,
  mediaPost,
  type ProduktLast,
} from "./fargbilder-kor";

type Obj = Record<string, unknown>;

/** Leonard 2026-10-14: "4 är godkänt". Verktyget lämnar aldrig färre bilder än så. */
export const MIN_BILDER = 4;
/** Fler än så här i ett anrop är inte en rättelse utan en ny bildplan. */
export const MAX_BORT = 10;

export interface BortVal {
  /** Valets `choiceId`. */
  valId: string;
  /** Axelns namn ("Färg", "Storlek"), för logg och hinder. */
  axel: string;
  /** `linkedMedia` före, i Wix ordning. */
  lankadeFore: string[];
  /** Samma lista utan bilderna som ska bort, i samma ordning. */
  lankadeEfter: string[];
}

export interface BortPlan {
  id: string;
  galleriFore: Bild[];
  galleriEfter: Bild[];
  /** Bilderna som tas bort, med plats i galleriet FÖRE (1 = huvudbilden). */
  bort: { plats: number; id: string }[];
  /** Alla val på alla axlar, så att sha:n binder hela länkläget. */
  val: BortVal[];
  hinder: string[];
}

const str = (x: unknown) => (typeof x === "string" ? x : "");
const sammaLista = (a: readonly string[], b: readonly string[]) => a.join("|") === b.join("|");

// ── planen (ren) ─────────────────────────────────────────────────────────────

export function planeraBort(p: Pick<ProduktLast, "id" | "bilder" | "optioner">, bort: readonly string[]): BortPlan {
  const ids = [...new Set(bort)];
  const hinder: string[] = [];
  const plats = new Map(p.bilder.map((b, i) => [b.id, i + 1]));
  const okanda = ids.filter((id) => !plats.has(id));
  const bortSet = new Set(ids);

  if (ids.length === 0) hinder.push("inga_bilder_angivna");
  if (ids.length > MAX_BORT) hinder.push(`for_manga_bilder (${ids.length} av högst ${MAX_BORT})`);
  if (okanda.length > 0) hinder.push(`okand_bild (${okanda.length} finns inte i galleriet)`);

  const galleriEfter = p.bilder.filter((b) => !bortSet.has(b.id));
  // Huvudbilden är produktens `media.main` och första valets bild. Att byta
  // den är ett annat beslut än att ta bort en bild med inbränd text.
  if (p.bilder.length > 0 && bortSet.has(p.bilder[0].id)) hinder.push("huvudbilden_far_inte_tas_bort");
  if (ids.length > 0 && okanda.length === 0 && galleriEfter.length < MIN_BILDER) {
    hinder.push(`for_fa_bilder_kvar (${galleriEfter.length}, minst ${MIN_BILDER})`);
  }

  const val: BortVal[] = p.optioner.flatMap((o) =>
    o.val.map((v) => ({
      valId: v.id,
      axel: o.namn,
      lankadeFore: [...v.lankade],
      lankadeEfter: v.lankade.filter((id) => !bortSet.has(id)),
    })),
  );
  // Ett val som hade bilder ska ha kvar minst en. Vem som ska ersätta dem är
  // ett beslut för en människa, och verktyget lämnar aldrig ett val bildlöst.
  for (const v of val) {
    if (v.lankadeFore.length > 0 && v.lankadeEfter.length === 0) hinder.push(`val_skulle_sakna_bild (${v.axel})`);
  }

  return {
    id: p.id,
    galleriFore: p.bilder,
    galleriEfter,
    bort: ids.filter((id) => plats.has(id)).map((id) => ({ plats: plats.get(id)!, id })).sort((a, b) => a.plats - b.plats),
    val,
    hinder,
  };
}

/** sha256 av det planen bygger på: galleriets ordning, vad som tas bort och varje vals länkar före och efter. */
export function bortSha(p: BortPlan): string {
  const kanon = {
    id: p.id,
    galleri: p.galleriFore.map((b) => b.id),
    bort: p.bort.map((b) => b.id),
    val: p.val.map((v) => [v.valId, v.lankadeFore, v.lankadeEfter]),
    hinder: [...p.hinder].sort(),
  };
  return createHash("sha256").update(JSON.stringify(kanon)).digest("hex");
}

/** Räknarna som får stå i en publik logg: wix-id, platser, antal och hinder. */
export function bortRaknare(p: BortPlan) {
  return {
    id: p.id,
    galleri: { fore: p.galleriFore.length, efter: p.galleriEfter.length },
    bort: p.bort.map((b) => b.plats),
    val: p.val
      .filter((v) => !sammaLista(v.lankadeFore, v.lankadeEfter))
      .map((v) => ({ axel: v.axel, fore: v.lankadeFore.length, efter: v.lankadeEfter.length })),
    hinder: p.hinder,
  };
}

// ── utgångsläget och kontrollen (rena) ───────────────────────────────────────

/** Har sidan ändrats sedan planen: galleriets ordning och varje vals länkar före. */
export function sammaUtgangslage(plan: BortPlan, p: Pick<ProduktLast, "bilder" | "optioner">): boolean {
  if (!sammaLista(p.bilder.map((b) => b.id), plan.galleriFore.map((b) => b.id))) return false;
  const nu = new Map(p.optioner.flatMap((o) => o.val.map((v) => [v.id, v.lankade] as const)));
  return plan.val.length === nu.size && plan.val.every((v) => sammaLista(nu.get(v.valId) ?? [], v.lankadeFore));
}

/** Står varje vals länkar redan som planen vill ha dem? */
export function lankarEfterPlanen(plan: BortPlan, p: Pick<ProduktLast, "optioner">): boolean {
  const nu = new Map(p.optioner.flatMap((o) => o.val.map((v) => [v.id, v.lankade] as const)));
  return plan.val.every((v) => sammaLista(nu.get(v.valId) ?? [], v.lankadeEfter));
}

export const BORT_LANK_AVVIKELSE = "ett val pekar inte på de planerade bilderna";
export const BORT_GALLERI_AVVIKELSE = "galleriet är inte det planerade";

/**
 * Återläsningen. `vantat` är galleriet som skrevs (med alt-texterna som de
 * stod när skrivningen byggdes). Avvikelserna är korta fraser utan id, för
 * svaret går till en publik logg.
 */
export function kontrolleraBort(
  plan: BortPlan,
  vantat: readonly Bild[],
  fore: { synlig: boolean; optioner: ProduktLast["optioner"]; varianter: VariantLage[] },
  efter: Pick<ProduktLast, "synlig" | "bilder" | "optioner" | "varianter">,
): string[] {
  const fel: string[] = [];
  if (efter.synlig !== fore.synlig) fel.push("sidans synlighet ändrades");
  if (!sammaLista(efter.bilder.map((b) => b.id), vantat.map((b) => b.id))) fel.push(BORT_GALLERI_AVVIKELSE);
  for (const b of vantat) {
    const e = efter.bilder.find((x) => x.id === b.id);
    if (e && e.alt !== b.alt) {
      fel.push("en alt-text är inte den planerade");
      break;
    }
  }

  const nu = new Map(efter.optioner.flatMap((o) => o.val.map((v) => [v.id, v.lankade] as const)));
  for (const v of plan.val) {
    const e = nu.get(v.valId);
    if (!e) fel.push("ett val saknas efter skrivningen");
    else if (!sammaLista(e, v.lankadeEfter)) fel.push(BORT_LANK_AVVIKELSE);
  }
  if (fore.optioner.length !== efter.optioner.length) fel.push("antalet axlar ändrades");
  for (const o of fore.optioner) {
    const e = efter.optioner.find((x) => x.namn === o.namn);
    if (!e || e.val.length !== o.val.length || e.val.some((v, i) => v.id !== o.val[i].id || v.namn !== o.val[i].namn)) {
      fel.push("en axels val ändrades");
    }
  }
  const iGalleriet = new Set(efter.bilder.map((b) => b.id));
  for (const o of efter.optioner) {
    for (const v of o.val) for (const id of v.lankade) if (!iGalleriet.has(id)) fel.push("en länkad bild saknas i galleriet");
  }

  if (efter.varianter.length !== fore.varianter.length) fel.push("antalet varianter ändrades");
  for (const v of fore.varianter) {
    const e = efter.varianter.find((x) => x.id === v.id);
    if (!e) {
      fel.push("en variant saknas efter skrivningen");
      continue;
    }
    if (v.synlig !== e.synlig) fel.push("en variants synlighet ändrades");
    if ((v.sku ?? "") !== (e.sku ?? "")) fel.push("en variants SKU ändrades");
    if ((v.pris ?? null) !== (e.pris ?? null)) fel.push("en variants pris ändrades");
    if ((v.val ?? "") !== (e.val ?? "")) fel.push("en variants val ändrades");
    if (!likaKostnad(v.kostnad, e.kostnad)) fel.push("en variants kostnad ändrades");
  }
  return [...new Set(fel)];
}

// ── skrivningen ──────────────────────────────────────────────────────────────

/** Valens nya `linkedMedia` i GET:ens options, allt annat ordagrant. */
export function optionerUtanBilderna(ra: Obj, plan: BortPlan): Obj[] {
  const andrade = new Map(
    plan.val.filter((v) => !sammaLista(v.lankadeFore, v.lankadeEfter)).map((v) => [v.valId, v.lankadeEfter] as const),
  );
  return ((ra.options ?? []) as Obj[]).map((o) => {
    const cs = (o.choicesSettings ?? {}) as Obj;
    return {
      ...o,
      choicesSettings: {
        ...cs,
        choices: ((cs.choices ?? []) as Obj[]).map((c) => {
          const kvar = andrade.get(str(c.choiceId));
          return kvar ? { ...c, linkedMedia: kvar.map((id) => ({ id })) } : c;
        }),
      },
    };
  });
}

export interface BortDeps {
  wix: WixAnrop;
  vanta?: (ms: number) => Promise<void>;
}

export interface BortUtfall {
  id: string;
  ok: boolean;
  steg: string[];
  fel?: string;
}

/**
 * Skriver planen och läser tillbaka. `ok: false` betyder att körningen ska
 * stanna: något stämmer inte, och ingen ska röra sidan förrän någon tittat.
 * Kastar aldrig.
 */
export async function skrivBort(plan: BortPlan, deps: BortDeps): Promise<BortUtfall> {
  const vanta = deps.vanta ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const steg: string[] = [];
  const fall = (fel: string): BortUtfall => ({ id: plan.id, ok: false, steg, fel });
  if (plan.hinder.length > 0) return fall(`hinder: ${plan.hinder.join(", ")}`);
  const bortSet = new Set(plan.bort.map((b) => b.id));
  const andrade = plan.val.filter((v) => !sammaLista(v.lankadeFore, v.lankadeEfter));

  try {
    const fore = await lasProdukt(deps.wix, plan.id);
    if (!fore) return fall("sidan gick inte att läsa");
    // Länkarna kan redan vara skrivna (en körning som föll före galleriet), men
    // då har planen räknats om och `lankadeFore` är redan utan bilderna.
    if (!sammaUtgangslage(plan, fore)) return fall("sidan har ändrats sedan planen — kör planen igen");
    const foreLage = { synlig: fore.synlig, optioner: fore.optioner, varianter: fore.varianter };
    if (!fore.kostnadLasbar) steg.push(KOSTNAD_EJ_LASBAR);

    // ── 1: länkarna, före galleriet ──────────────────────────────────────
    if (andrade.length > 0) {
      let klart = false;
      let forsok = 0;
      let sistaFel = "";
      while (!klart && forsok < KOPPLING_FORSOK) {
        forsok++;
        const nu = await lasProdukt(deps.wix, plan.id);
        if (!nu) return fall("sidan gick inte att läsa");
        if (!sammaUtgangslage(plan, nu) && !lankarEfterPlanen(plan, nu)) {
          return fall("sidan ändrades under skrivningen — kör planen igen");
        }
        if (lankarEfterPlanen(plan, nu)) {
          klart = true;
          break;
        }
        try {
          await deps.wix("PATCH", `/stores/v3/products/${encodeURIComponent(plan.id)}`, {
            product: {
              revision: nu.revision,
              visible: nu.ra.visible,
              options: optionerUtanBilderna(nu.ra, plan),
              variantsInfo: nu.ra.variantsInfo,
            },
            fieldMask: { paths: ["options", "variantsInfo", "visible"] },
          });
        } catch (e) {
          sistaFel = felText(e);
          // Bara det övergående försöks om. Allt annat stoppar, och galleriet är orört.
          if (!arOvergaende(e)) return fall(`länkningen föll: ${sistaFel} — galleriet är orört`);
          await vanta(KOPPLING_PAUS_MS);
          continue;
        }
        // PATCH:en tog. Wix läsning kan släpa, så läs om innan något skrivs igen.
        for (let i = 0; i <= GALLERI_OMLASNINGAR && !klart; i++) {
          if (i > 0) await vanta(KOPPLING_PAUS_MS);
          const efter = await lasProdukt(deps.wix, plan.id);
          klart = !!efter && lankarEfterPlanen(plan, efter);
        }
        if (!klart) return fall("länkarna läste inte tillbaka som planen efter skrivningen — galleriet är orört, kör planen igen");
      }
      if (!klart) return fall(`länkarna gick inte att skriva${sistaFel ? ` (sista fel: ${sistaFel})` : ""} — galleriet är orört`);
      steg.push(`länkar: ${andrade.length} val (${forsok} försök)`);
    }

    // ── 2: galleriet, ensamt ─────────────────────────────────────────────
    const nu = await lasProdukt(deps.wix, plan.id);
    if (!nu) return fall("sidan gick inte att läsa");
    if (!lankarEfterPlanen(plan, nu)) return fall("ett val pekar fortfarande på en bild som ska bort — galleriet rördes inte");
    const vantat = nu.bilder.filter((b) => !bortSet.has(b.id));
    if (!sammaLista(vantat.map((b) => b.id), plan.galleriEfter.map((b) => b.id))) {
      return fall("galleriet har ändrats sedan planen — kör planen igen");
    }
    if (nu.bilder.length !== vantat.length) {
      await deps.wix("PATCH", `/stores/v3/products/${encodeURIComponent(plan.id)}`, {
        product: { revision: nu.revision, media: { itemsInfo: { items: vantat.map(mediaPost) } } },
        fieldMask: { paths: ["media"] },
      });
      steg.push(`galleri ${nu.bilder.length} → ${vantat.length}`);
    } else {
      steg.push("galleriet var redan utan bilderna");
    }

    // ── 3: återläsningen ─────────────────────────────────────────────────
    let avvikelser: string[] = ["inte läst"];
    for (let i = 0; i <= GALLERI_OMLASNINGAR; i++) {
      if (i > 0) await vanta(KOPPLING_PAUS_MS);
      const efter = await lasProdukt(deps.wix, plan.id);
      avvikelser = efter ? kontrolleraBort(plan, vantat, foreLage, efter) : ["sidan gick inte att läsa efter skrivningen"];
      if (avvikelser.length === 0) break;
      // Bara det som Wix läsning kan släpa med får vänta; allt annat stoppar direkt.
      if (!avvikelser.every((a) => a === BORT_GALLERI_AVVIKELSE || a === BORT_LANK_AVVIKELSE)) break;
    }
    if (avvikelser.length > 0) return fall(`Wix stämmer inte med planen (${avvikelser.join("; ")}) — kontrollera sidan innan något körs om`);
    steg.push("återläst: galleri, alt-texter, länkar, synlighet och varianter stämmer");

    // ── 4: variantbilderna ───────────────────────────────────────────────
    // Läser först och skriver bara när en variant avviker. Ett val vars första
    // bild är orörd ger ingen avvikelse, och då skrivs ingenting.
    const vb = variantbildSteg(await refreshVariantMedia(deps.wix, plan.id, { vanta }));
    steg.push(vb.rad);
    if (vb.stopp) return fall(`${vb.rad} — galleriet och länkarna är skrivna, kontrollera sidan`);
    return { id: plan.id, ok: true, steg };
  } catch (e) {
    return fall(`${felText(e)} — kontrollera sidan innan något körs om`);
  }
}
