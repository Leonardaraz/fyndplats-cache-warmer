// VEVOR steg 4: importen. Läsarens avläsningar → Wix, som osynliga utkast.
//
// Samma pipeline som Aosom (lib/aosom/import-run.ts): adaptern
// (lib/vevor/to-product.ts) gör en avläsning till pipelinens gemensamma format,
// `importProduct` skapar produkten i rått läge, och en mappningsrad med
// leverantören vevor och id:t `vevor:<artikelnummer>` skrivs efteråt. Rått läge
// betyder noll AI-anrop och `visible:false` ovillkorligt (pipeline.ts: "RAW →
// ALLTID draft").
//
// ALLA PÅ EN GÅNG, SÅ FORT WIX TAR EMOT DEM (Leonard 2026-10-28). Cronen
// (`/api/cron/vevor-import`) kör var femte minut när importen är påslagen och
// tar så många utkast som ryms i 240 sekunder, en i taget: bilderna laddas upp
// i följd, för Wix svarar 429 när takten blir för hög (Aosom-svepet
// 2026-08-27). Varje körning fortsätter där förra slutade (`markor`). När
// avläsningarna tar slut börjar nästa varv från början, och ett varv som gick
// igenom avläsningar utan att importera något vilar i 20 timmar. Ett varv som
// inte hittade någon avläsning alls vilar inte: då har läsaren inte hunnit
// läsa än, och importen ska börja så fort den har.
//
// Sju egenskaper som inte ska tas bort:
//
// 1. ☠️ En omkörning skapar 0 nya. Dubblettspärren läser mappningarna för
//    tuggans id (`supplierProductId` och `importSparr`), och en produkt som
//    skapades utan mappningsrad står i `foraldralosa` och spärrar artikeln.
// 2. ☠️ Wix tak, 50 000 produkter per butik, kontrolleras före första
//    produkten och räknas ned under körningen. Marginalen är 1 000.
// 3. ☠️ Rabatten läses ur konfigurationen. Saknas den importeras ingenting.
// 4. ☠️ Står läsaren fryst efter en spärr står importen också still.
// 5. ☠️ Fem fel i följd stoppar körningen, och markören står kvar före
//    felen. Ett avbrott hos Wix får inte hoppa över artiklar i ett helt varv.
//    Ett enstaka fel flyttar markören: artikeln prövas igen i nästa varv.
// 6. Torrläget skriver ingenting, inte ens markören.
// 7. ☠️ Svaret, loggraden och larmet bär bara antal och Wix-id.
//
// Steg 8 (Leonard 2026-10-29): syskonen blir en produkt (lib/vevor/familj.ts),
// betyget under 3,8 med minst fem recensioner stoppar artikeln
// (lib/vevor/to-product.ts), och sidans recensioner sparas som dolda rader.
//
// 8. ☠️ En artikel vars familj redan finns som en produkt importeras inte
//    (`syskon_finns`): den hade blivit samma familj på två sidor. Den läggs
//    till på familjen för hand.
// 9. Recensionerna är bara ett tillägg. Ett fel där fäller inte importen och
//    räknas för sig.

import { randomUUID } from "node:crypto";
import type { AliExpressProduct } from "@/lib/import/types";
import type { ImportResult } from "@/lib/import/pipeline";
import type { AERReview } from "@/lib/import/review-import";
import type { ProductMappingRecord } from "@/lib/store";
import { VEVOR_ID_PREFIX } from "@/lib/store/leverantorsprefix";
import { artiklarPaRaden } from "@/lib/aosom/artiklar";
import { WIX_MAX_PRODUKTER } from "@/lib/wix/limits";
import { RabattFel } from "./pris";
import { valjVevorBilder } from "./bilder";
import { vevorGranskning } from "./granskning";
import type { Avlasning } from "./lager";
import { FAMILJ_SKAL, arPaVag, byggFamilj, syskonSkus, vevorFamiljeProdukt, type Familj, type FamiljSkal } from "./familj";
import {
  byggVevorMappning,
  importhinder,
  vevorArtiklarFor,
  vevorProdukt,
  vevorRecensioner,
  vevorSupplierProductId,
  type Hinder,
  type Prisunderlag,
} from "./to-product";
import {
  TOMT_IMPORTTILLSTAND,
  type Foraldralos,
  type Importsummering,
  type Importtillstand,
  type VevorImportLager,
} from "./import-lager";

/** Wix tak per butik (Stores). Definitionen bor i lib/wix/limits.ts. */
export { WIX_MAX_PRODUKTER };
/** Så många platser lämnas åt allt annat som skapar produkter. */
export const TAK_MARGINAL = 1_000;
/** Avläsningar per fråga. En sida om 100 är ~1 MB. */
export const TUGGA = 100;
/** Ett varv utan något nytt vilar så länge innan nästa börjar. */
export const VILA_MS = 20 * 3_600_000;
/** Så många fel i följd stoppar körningen. */
export const FEL_I_FOLJD = 5;
/** Larmet går när så många körningar i följd stoppats av fel. */
export const STOPP_FOR_LARM = 3;
const LARM_MELLANRUM_MS = 24 * 3_600_000;
const LAS_TTL_MS = 6 * 60_000;
/** De föräldralösa sparas i tillståndet, högst så många. */
const MAX_FORALDRALOSA = 500;

export interface ImportDeps {
  lager: VevorImportLager;
  /** Mappningsraderna som bär något av id:na (Store.mappningarForLeverantorsId). */
  mappningarFor(
    ids: string[],
  ): Promise<Pick<ProductMappingRecord, "supplierProductId" | "importSparr" | "vevorArtiklar" | "variants">[]>;
  importera(p: AliExpressProduct): Promise<ImportResult>;
  sparaMappning(m: ProductMappingRecord): Promise<void>;
  /**
   * Sidans recensioner som dolda rader på produkten (källa "vevor"), genom
   * husets filter. Svarar med antalet sparade.
   */
  sparaRecensioner(wixProductId: string, recensioner: AERReview[]): Promise<number>;
  /**
   * Bildernas innehåll: adress → md5 (lib/vevor/bildinnehall.ts). En familjs
   * storlekar bär samma foto under olika adresser, och utan nyckeln hade varje
   * foto laddats upp en gång per storlek. En adress utan nyckel är ett eget foto.
   */
  bildnycklar(urls: string[]): Promise<Map<string, string>>;
  /** Rabatten ur konfigurationen och dollarkursen. Kastar `RabattFel` när rabatten saknas. */
  prisunderlag(): Promise<Prisunderlag>;
  antalProdukter(): Promise<number>;
  larma(amne: string, text: string): Promise<void>;
  nu?: () => number;
}

export interface Importval {
  /** Torrläge: räknar men skriver ingenting. */
  dryRun: boolean;
  /** Körd för hand (workflowens prov): går även när importen är avstängd eller vilar. */
  manuell: boolean;
  /** Högst så många utkast (eller försök) i körningen. */
  limit: number;
  budgetMs: number;
}

function tomSummering(start: number, dryRun: boolean): Importsummering {
  return {
    start: new Date(start).toISOString(),
    slutAt: new Date(start).toISOString(),
    utfall: "klar",
    skal: null,
    dryRun,
    granskade: 0,
    importerade: 0,
    redanImporterade: 0,
    hinder: {
      ej_i_lager: 0,
      ej_levererbar: 0,
      borta: 0,
      misslyckad: 0,
      gammal: 0,
      lagt_betyg: 0,
      betyg_okant: 0,
      spec_okant: 0,
      recension_okand: 0,
      syskon_finns: 0,
      syskon_vantar: 0,
    } satisfies Record<Hinder, number>,
    fel: 0,
    foraldralosa: [],
    bilder: { ny: 0, gammal: 0, okant: 0, utanEgna: 0 },
    medicinteknik: 0,
    gpsr: { manualEjLast: 0, ingenManual: 0 },
    familjer: {
      sammanslagna: 0,
      varianter: 0,
      gemensammaBilder: 0,
      ejSammanslagna: Object.fromEntries(FAMILJ_SKAL.map((k) => [k, 0])) as Record<FamiljSkal, number>,
    },
    recensioner: { lasta: 0, sparade: 0, produkter: 0, fel: 0 },
    produkterIWix: null,
    varvKlart: false,
    stoppadAv: null,
  };
}

/** Loggraden. Bara antal. */
export function importloggrad(s: Importsummering): string {
  return (
    `[vevor-import] ${s.utfall}${s.dryRun ? " (torr)" : ""}${s.skal ? ` (${s.skal})` : ""}: ` +
    `${s.granskade} granskade, ${s.importerade} importerade, ${s.redanImporterade} fanns redan, ` +
    `${s.fel} fel, ${s.foraldralosa.length} föräldralösa, ` +
    `hinder ${Object.entries(s.hinder).map(([k, v]) => `${k} ${v}`).join(", ")}, ` +
    `bilder ny ${s.bilder.ny} gammal ${s.bilder.gammal} okänt ${s.bilder.okant} utan egna ${s.bilder.utanEgna}, ` +
    `medicinteknik ${s.medicinteknik}, ` +
    (s.familjer
      ? `familjer ${s.familjer.sammanslagna} (varianter ${s.familjer.varianter}, gemensamma bilder ${s.familjer.gemensammaBilder ?? 0}), ej sammanslagna ` +
        `${Object.entries(s.familjer.ejSammanslagna).map(([k, v]) => `${k} ${v}`).join(", ")}, `
      : "") +
    (s.recensioner
      ? `recensioner lästa ${s.recensioner.lasta} sparade ${s.recensioner.sparade} på ${s.recensioner.produkter} produkter fel ${s.recensioner.fel}, `
      : "") +
    `produkter i Wix ${s.produkterIWix ?? "-"}, stopp ${s.stoppadAv ?? "-"}${s.varvKlart ? ", varvet klart" : ""}`
  );
}

export async function korVevorImport(deps: ImportDeps, val: Importval): Promise<Importsummering> {
  const nu = deps.nu ?? (() => Date.now());
  const start = nu();
  const s = tomSummering(start, val.dryRun);
  const avsluta = (utfall: Importsummering["utfall"], skal: string | null = null): Importsummering => {
    s.utfall = utfall;
    s.skal = skal;
    s.slutAt = new Date(nu()).toISOString();
    return s;
  };

  const t: Importtillstand = { ...TOMT_IMPORTTILLSTAND, ...(await deps.lager.lasImport()) };
  // Tyst när det inte finns något att göra: ingen skrivning, bara svaret.
  if (!val.manuell && !t.aktiv) return avsluta("avstangd");
  if (!val.manuell && t.markor === null && t.vilaTill && Date.parse(t.vilaTill) > start) {
    return avsluta("vilar");
  }
  const frysning = await deps.lager.lasarensFrysning();
  if (frysning) return avsluta("fryst", "läsaren är fryst efter en spärr hos VEVOR");

  const agare = randomUUID();
  if (!(await deps.lager.tagLas(agare, start, LAS_TTL_MS))) return avsluta("upptagen");
  try {
    let pris: Prisunderlag;
    try {
      pris = await deps.prisunderlag();
    } catch (err) {
      if (err instanceof RabattFel) return await stoppa(deps, t, val, avsluta("stoppad", err.message), nu);
      throw err;
    }
    const antal = await deps.antalProdukter();
    s.produkterIWix = antal;
    let platser = WIX_MAX_PRODUKTER - TAK_MARGINAL - antal;
    if (platser <= 0) {
      s.stoppadAv = "tak";
      return await stoppa(deps, t, val, avsluta("stoppad", "katalogen är nära Wix tak på 50 000 produkter"), nu);
    }

    const sparrade = new Set(t.foraldralosa.map((f) => vevorSupplierProductId(f.sku)));
    // Artiklar som sitter på en produkt med fler än en artikel (en familj).
    const iFamilj = new Set<string>();
    const nyaForaldralosa: Foraldralos[] = [];
    let markor = t.markor;
    let varvImporterade = t.varvImporterade;
    let varvGranskade = t.varvGranskade;
    let felIFoljd = 0;
    // Markören före en svit fel: dit går den tillbaka om sviten stoppar körningen.
    let markorForeFelen = markor;

    yttre: for (;;) {
      if (nu() - start >= val.budgetMs) {
        s.stoppadAv = "tidsbudget";
        break;
      }
      const kandidater = await deps.lager.kandidater(markor, TUGGA);
      if (kandidater.length === 0) {
        s.varvKlart = true;
        s.stoppadAv = "klart";
        break;
      }
      const finns = new Set(sparrade);
      // Kandidaternas och deras syskons id: ett syskon som sitter på en
      // familj gör kandidaten till `syskon_finns`, och ett som sitter på en
      // egen produkt följer inte med i familjen.
      const fragade = new Set<string>();
      for (const a of kandidater) {
        fragade.add(vevorSupplierProductId(a.sku));
        for (const sy of syskonSkus(a)) fragade.add(vevorSupplierProductId(sy));
      }
      for (const m of await deps.mappningarFor([...fragade])) {
        if (m.importSparr) finns.add(m.importSparr);
        const artiklar = new Set(m.vevorArtiklar ?? []);
        if (m.supplierProductId) artiklar.add(m.supplierProductId);
        for (const a of artiklarPaRaden({ supplierProductId: m.supplierProductId, variants: m.variants ?? [] }, VEVOR_ID_PREFIX)) {
          artiklar.add(vevorSupplierProductId(a));
        }
        for (const id of artiklar) {
          finns.add(id);
          if (artiklar.size > 1) iFamilj.add(id);
        }
      }

      for (const a of kandidater) {
        if (s.importerade + s.fel >= val.limit) {
          s.stoppadAv = "limit";
          break yttre;
        }
        if (nu() - start >= val.budgetMs) {
          s.stoppadAv = "tidsbudget";
          break yttre;
        }
        if (platser <= 0) {
          s.stoppadAv = "tak";
          break yttre;
        }
        s.granskade++;
        varvGranskade++;

        const hinder = importhinder(a, nu());
        const id = vevorSupplierProductId(a.sku);
        if (hinder) {
          s.hinder[hinder]++;
          markor = a.sku;
          continue;
        }
        if (finns.has(id)) {
          s.redanImporterade++;
          markor = a.sku;
          continue;
        }
        if (syskonSkus(a).some((sy) => iFamilj.has(vevorSupplierProductId(sy)))) {
          s.hinder.syskon_finns++;
          markor = a.sku;
          continue;
        }

        let familj: Familj = { typ: "ensam" };
        let produkt: AliExpressProduct;
        const bilder = valjVevorBilder(a.bilder);
        let granskning = vevorGranskning(a, bilder);
        try {
          if (syskonSkus(a).length > 0) {
            const lasta = await deps.lager.lasAvlasningar(syskonSkus(a));
            // Syskon som inte lästs alls: står sidan i läsarens kö väntar familjen.
            const olasta = (a.syskon ?? []).filter((sy) => sy.sku && sy.sku !== a.sku && !lasta.has(sy.sku) && sy.webbId);
            const pavag = new Set<string>();
            if (olasta.length > 0) {
              const sidor = await deps.lager.lasSidor(olasta.map((sy) => sy.webbId));
              for (const sy of olasta) if (arPaVag(sidor.get(sy.webbId))) pavag.add(sy.sku);
            }
            familj = byggFamilj(a, lasta, nu(), (sku) => finns.has(vevorSupplierProductId(sku)), pavag);
          }
          if (familj.typ === "familj") {
            // Fotonas innehåll, så att samma foto i flera storlekar laddas upp en
            // gång. Torrläget laddar inte upp något och hämtar därför inga bilder.
            const nycklar =
              familj.bildaxel && !val.dryRun
                ? await deps.bildnycklar(familj.medlemmar.flatMap((m) => valjVevorBilder(m.bilder).urls))
                : new Map<string, string>();
            produkt = vevorFamiljeProdukt(familj, pris, bilder, (m) => valjVevorBilder(m.bilder), (u) => nycklar.get(u) ?? u);
          } else {
            produkt = vevorProdukt(a, pris, bilder);
          }
        } catch (err) {
          // Syskonen gick inte att läsa, eller ett pris som inte går att räkna
          // på. Felet säger aldrig vilket.
          console.error("[vevor-import] produkten gick inte att bygga:", err instanceof Error ? err.message : String(err));
          s.fel++;
          markor = a.sku;
          continue;
        }
        if (familj.typ === "vanta") {
          s.hinder.syskon_vantar++;
          markor = a.sku;
          continue;
        }
        if (familj.typ === "ej_sammanslagen") s.familjer!.ejSammanslagna[familj.skal]++;
        // En familj visar varje artikels bilder, så bildgranskningen gäller dem alla.
        if (familj.typ === "familj" && familj.medlemmar.some((m) => valjVevorBilder(m.bilder).granskas)) {
          granskning = { ...granskning, bildgranskning: true };
        }
        const medlemmar: Avlasning[] = familj.typ === "familj" ? familj.medlemmar : [a];
        // ☠️ Bara recensioner om artiklar som finns på produkten (2026-10-30).
        const egna = new Set(medlemmar.map((m) => m.sku));
        const recensioner = medlemmar.flatMap((m) => vevorRecensioner(m, egna));

        if (val.dryRun) {
          raknaUtkast(s, bilder.monster, bilder.egna, granskning);
          raknaFamilj(s, medlemmar.length, recensioner.length);
          s.importerade++;
          platser--;
          for (const m of medlemmar) {
            finns.add(vevorSupplierProductId(m.sku));
            if (medlemmar.length > 1) iFamilj.add(vevorSupplierProductId(m.sku));
          }
          markor = a.sku;
          continue;
        }

        let resultat: ImportResult | null = null;
        try {
          resultat = await deps.importera(produkt);
          await deps.sparaMappning(byggVevorMappning(a, resultat, granskning, new Date(nu()).toISOString()));
          raknaUtkast(s, bilder.monster, bilder.egna, granskning);
          raknaFamilj(s, resultat.variantMappings.length, recensioner.length);
          s.familjer!.gemensammaBilder = (s.familjer!.gemensammaBilder ?? 0) + (produkt.gemensammaBilder?.length ?? 0);
          s.importerade++;
          varvImporterade++;
          platser--;
          const artiklar = vevorArtiklarFor(resultat);
          for (const aid of artiklar) {
            finns.add(aid);
            if (artiklar.length > 1) iFamilj.add(aid);
          }
          finns.add(id);
          felIFoljd = 0;
          markor = a.sku;
          markorForeFelen = markor;
        } catch (err) {
          // Hela felet bara i Vercels logg: pipelinens fel bär produktens id.
          console.error("[vevor-import] importen föll:", err instanceof Error ? err.message : String(err));
          s.fel++;
          if (resultat) {
            // ☠️ Produkten finns i Wix men saknar mappningsrad. Spärra varje
            // artikel på den, annars skapar nästa varv samma vara en gång till.
            const wixProductId = resultat.wixProductId;
            s.foraldralosa.push(wixProductId);
            for (const m of medlemmar) {
              nyaForaldralosa.push({ sku: m.sku, wixProductId, at: new Date(nu()).toISOString() });
              finns.add(vevorSupplierProductId(m.sku));
            }
            platser--;
          }
          felIFoljd++;
          markor = a.sku;
          if (felIFoljd >= FEL_I_FOLJD) {
            s.stoppadAv = "fel_i_foljd";
            markor = markorForeFelen;
            break yttre;
          }
          continue;
        }

        // Recensionerna, när produkten och raden finns. Ett fel här fäller
        // inte importen: produkten är skapad och raden skriven.
        if (recensioner.length > 0) {
          try {
            const sparade = await deps.sparaRecensioner(resultat.wixProductId, recensioner);
            s.recensioner!.sparade += sparade;
            if (sparade > 0) s.recensioner!.produkter++;
          } catch (err) {
            console.error("[vevor-import] recensionerna gick inte att spara:", err instanceof Error ? err.message : String(err));
            s.recensioner!.fel++;
          }
        }
      }
    }

    if (val.dryRun) return avsluta(s.stoppadAv === "fel_i_foljd" ? "stoppad" : "klar");

    const andring: Partial<Importtillstand> = {};
    if (nyaForaldralosa.length > 0) {
      andring.foraldralosa = [...t.foraldralosa, ...nyaForaldralosa].slice(-MAX_FORALDRALOSA);
    }
    if (s.varvKlart) {
      andring.markor = null;
      andring.varvImporterade = 0;
      andring.varvGranskade = 0;
      const vila = varvGranskade > 0 && varvImporterade === 0;
      andring.vilaTill = vila ? new Date(nu() + VILA_MS).toISOString() : null;
    } else {
      andring.markor = markor;
      andring.varvImporterade = varvImporterade;
      andring.varvGranskade = varvGranskade;
    }
    if (s.stoppadAv === "fel_i_foljd") {
      avsluta("stoppad", `${FEL_I_FOLJD} fel i följd, markören står kvar före felen`);
      return await stoppa(deps, t, val, s, nu, andring);
    }
    avsluta("klar");
    andring.senasteKorning = s;
    andring.stoppIFoljd = 0;
    await deps.lager.uppdateraImport(andring);
    return s;
  } finally {
    await deps.lager.slappLas(agare).catch(() => undefined);
  }
}

/** En familj och dess recensioner till räknarna. En ensam artikel är ingen familj. */
function raknaFamilj(s: Importsummering, varianter: number, recensioner: number): void {
  if (varianter > 1) {
    s.familjer!.sammanslagna++;
    s.familjer!.varianter += varianter;
  }
  s.recensioner!.lasta += recensioner;
}

/** Ett utkast till räknarna: bildmönster, medicinteknik och GPSR. */
function raknaUtkast(
  s: Importsummering,
  monster: "ny" | "gammal" | "okant",
  egna: number,
  g: { medicinteknik: boolean; gpsr: "manual_ej_last" | "ingen_manual" },
): void {
  s.bilder[monster]++;
  if (egna === 0) s.bilder.utanEgna++;
  if (g.medicinteknik) s.medicinteknik++;
  if (g.gpsr === "manual_ej_last") s.gpsr.manualEjLast++;
  else s.gpsr.ingenManual++;
}

/**
 * En körning som stoppades: räknas i följd, och larmar vid tredje stoppet i
 * följd, högst en gång per dygn. Torrläget skriver ingenting.
 */
async function stoppa(
  deps: ImportDeps,
  t: Importtillstand,
  val: Importval,
  s: Importsummering,
  nu: () => number,
  andring: Partial<Importtillstand> = {},
): Promise<Importsummering> {
  if (val.dryRun) return s;
  const stoppIFoljd = t.stoppIFoljd + 1;
  const ut: Partial<Importtillstand> = { ...andring, stoppIFoljd, senasteKorning: s };
  const tid = nu();
  const sistaLarm = t.larmAt ? Date.parse(t.larmAt) : 0;
  if (stoppIFoljd >= STOPP_FOR_LARM && !(tid - sistaLarm < LARM_MELLANRUM_MS)) {
    await deps
      .larma(
        "VEVOR-importen har stannat",
        `Importen har stoppats ${stoppIFoljd} körningar i följd.\n\nSenaste skälet: ${s.skal ?? "okänt"}.\n\n` +
          `Läs läget med workflowen "VEVOR — importen", läget status.`,
      )
      .catch((err) => console.error("[vevor-import] larmet gick inte:", err instanceof Error ? err.message : String(err)));
    ut.larmAt = new Date(tid).toISOString();
  }
  await deps.lager.uppdateraImport(ut);
  return s;
}
