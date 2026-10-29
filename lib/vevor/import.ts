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

import { randomUUID } from "node:crypto";
import type { AliExpressProduct } from "@/lib/import/types";
import type { ImportResult } from "@/lib/import/pipeline";
import type { ProductMappingRecord } from "@/lib/store";
import { RabattFel } from "./pris";
import { valjVevorBilder } from "./bilder";
import { vevorGranskning } from "./granskning";
import {
  byggVevorMappning,
  importhinder,
  vevorProdukt,
  vevorSupplierProductId,
  type Prisunderlag,
} from "./to-product";
import {
  TOMT_IMPORTTILLSTAND,
  type Foraldralos,
  type Importsummering,
  type Importtillstand,
  type VevorImportLager,
} from "./import-lager";

/** Wix tak per butik (Stores). */
export const WIX_MAX_PRODUKTER = 50_000;
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
  mappningarFor(ids: string[]): Promise<Pick<ProductMappingRecord, "supplierProductId" | "importSparr">[]>;
  importera(p: AliExpressProduct): Promise<ImportResult>;
  sparaMappning(m: ProductMappingRecord): Promise<void>;
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
    hinder: { ej_i_lager: 0, ej_levererbar: 0, borta: 0, misslyckad: 0, gammal: 0 },
    fel: 0,
    foraldralosa: [],
    bilder: { ny: 0, gammal: 0, okant: 0, utanEgna: 0 },
    medicinteknik: 0,
    gpsr: { manualEjLast: 0, ingenManual: 0 },
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
      for (const m of await deps.mappningarFor(kandidater.map((a) => vevorSupplierProductId(a.sku)))) {
        if (m.supplierProductId) finns.add(m.supplierProductId);
        if (m.importSparr) finns.add(m.importSparr);
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

        const bilder = valjVevorBilder(a.bilder);
        const granskning = vevorGranskning(a, bilder);
        let produkt: AliExpressProduct;
        try {
          produkt = vevorProdukt(a, pris, bilder);
        } catch (err) {
          // Ett pris som inte går att räkna på. Felet säger aldrig vilket.
          console.error("[vevor-import] produkten gick inte att bygga:", err instanceof Error ? err.message : String(err));
          s.fel++;
          markor = a.sku;
          continue;
        }

        if (val.dryRun) {
          raknaUtkast(s, bilder.monster, bilder.egna, granskning);
          s.importerade++;
          platser--;
          markor = a.sku;
          continue;
        }

        let resultat: ImportResult | null = null;
        try {
          resultat = await deps.importera(produkt);
          await deps.sparaMappning(byggVevorMappning(a, resultat, granskning, new Date(nu()).toISOString()));
          raknaUtkast(s, bilder.monster, bilder.egna, granskning);
          s.importerade++;
          varvImporterade++;
          platser--;
          finns.add(id);
          felIFoljd = 0;
          markor = a.sku;
          markorForeFelen = markor;
        } catch (err) {
          // Hela felet bara i Vercels logg: pipelinens fel bär produktens id.
          console.error("[vevor-import] importen föll:", err instanceof Error ? err.message : String(err));
          s.fel++;
          if (resultat) {
            // ☠️ Produkten finns i Wix men saknar mappningsrad. Spärra artikeln,
            // annars skapar nästa varv samma vara en gång till.
            s.foraldralosa.push(resultat.wixProductId);
            nyaForaldralosa.push({ sku: a.sku, wixProductId: resultat.wixProductId, at: new Date(nu()).toISOString() });
            finns.add(id);
            platser--;
          }
          felIFoljd++;
          markor = a.sku;
          if (felIFoljd >= FEL_I_FOLJD) {
            s.stoppadAv = "fel_i_foljd";
            markor = markorForeFelen;
            break yttre;
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
