// VEVOR steg 8: de opolerade VEVOR-utkasten raderas, och importen börjar om
// (Leonard 2026-10-29: "ja, om du tycker att det är bättre att radera dom och
// sen börja om").
//
// Utkasten från steg 4 är en artikel per produkt. Med steg 8 blir en familj en
// produkt, betyget under 3,8 stoppar artikeln och recensionerna följer med.
// Att slå ihop 1 048 utkast i efterhand hade krävt sammanslagningsverktyget
// per familj. Att radera dem och importera om ger samma resultat på en natt.
//
// Sju egenskaper som inte ska tas bort:
//
// 1. ☠️ Bara opolerade VEVOR-utkast: `supplier` vevor, `needsAiPolish` och
//    inte publicerade. En polerad eller publicerad rad rörs aldrig.
// 2. ☠️ Produkten läses färskt precis före raderingen, och bara en dold
//    produkt raderas. En läsning som faller hoppar över produkten.
// 3. ☠️ En radering räknas först när en läsning efteråt svarar 404. En
//    obekräftad radering tar inte bort mappningsraden, och tre i följd stoppar
//    körningen.
// 4. ☠️ En produkt som någon order pekar på rörs inte.
// 5. ☠️ Importen måste vara avstängd. Annars kan den skapa nya utkast medan
//    de gamla raderas.
// 6. ☠️ Godkännandet är planens antal. Första varvet kräver `bekrafta` lika
//    med antalet raderbara, och följande varv får ha färre men aldrig fler.
// 7. När allt är raderat nollställs importens markör, så att nästa varv
//    börjar från början. Importen slås inte på: det gör Leonard.
//
// Bilderna ligger kvar i Media Manager (uppmätt för pensionerade utkast
// 2026-09-28). Bildstädningen tar dem.
//
// ☠️ Svaret bär bara antal och Wix-id.

import type { ProductMappingRecord } from "@/lib/store";
import { vevorSkuOf } from "@/lib/store/supplier";
import type { ProduktForRadering } from "@/lib/wix/v3-products";
import type { Importtillstand } from "./import-lager";

/** Tre obekräftade raderingar i följd stoppar körningen. */
export const OBEKRAFTADE_I_FOLJD = 3;

export interface UtkastRaderingDeps {
  /** VEVOR-raderna (Store.listMappingsMedPrefix). */
  mappningar(): Promise<ProductMappingRecord[]>;
  /** Wix-produkt-id som någon order pekar på. */
  produkterIOrdrar(): Promise<Set<string>>;
  lasProdukt(wixProductId: string): Promise<ProduktForRadering | null>;
  raderaProdukt(wixProductId: string): Promise<"raderad" | "fanns_inte">;
  raderaMappning(wixProductId: string): Promise<void>;
  lasImport(): Promise<Importtillstand>;
  uppdateraImport(andring: Partial<Importtillstand>): Promise<void>;
  nu?: () => number;
}

export interface UtkastRaderingVal {
  dryRun: boolean;
  /** Planens antal (första varvet) eller taket (följande). Krävs för en skarp körning. */
  bekrafta: number | null;
  budgetMs: number;
}

export interface UtkastRaderingSvar {
  dryRun: boolean;
  /** VEVOR-rader som är opolerade utkast, före hindren. */
  utkast: number;
  /** De som går att radera nu. */
  raderbara: number;
  hinder: { iOrder: number; synlig: number; lasfel: number };
  raderade: number;
  /** Produkten fanns inte i Wix: bara raden togs bort. */
  fannsInte: number;
  obekraftade: number;
  fel: number;
  /** Raderbara som inte hanns med i körningen. */
  kvar: number;
  importNollstalld: boolean;
  stoppadAv: "klart" | "tidsbudget" | "obekraftade" | null;
  /** Upp till tjugo Wix-id för produkter som hoppades över för att de är synliga eller har en order. */
  hoppade: string[];
}

export class RaderingsFel extends Error {}

/** Raden är ett opolerat VEVOR-utkast. */
export function arOpoleratVevorUtkast(m: ProductMappingRecord): boolean {
  return vevorSkuOf(m) !== null && m.needsAiPolish === true && m.draftStatus !== "published" && !!m.wixProductId;
}

export async function raderaOpoleradeUtkast(
  deps: UtkastRaderingDeps,
  val: UtkastRaderingVal,
): Promise<UtkastRaderingSvar> {
  const nu = deps.nu ?? (() => Date.now());
  const start = nu();
  const t = await deps.lasImport();
  if (t.aktiv) throw new RaderingsFel("importen är påslagen: stäng av den först (workflowen \"VEVOR — importen\", läget av)");

  const utkast = (await deps.mappningar()).filter(arOpoleratVevorUtkast);
  const iOrder = await deps.produkterIOrdrar();
  const raderbara = utkast.filter((m) => !iOrder.has(m.wixProductId));
  const svar: UtkastRaderingSvar = {
    dryRun: val.dryRun,
    utkast: utkast.length,
    raderbara: raderbara.length,
    hinder: { iOrder: utkast.length - raderbara.length, synlig: 0, lasfel: 0 },
    raderade: 0,
    fannsInte: 0,
    obekraftade: 0,
    fel: 0,
    kvar: raderbara.length,
    importNollstalld: false,
    stoppadAv: null,
    hoppade: utkast.filter((m) => iOrder.has(m.wixProductId)).map((m) => m.wixProductId).slice(0, 20),
  };
  if (val.dryRun) return svar;
  if (val.bekrafta === null || !Number.isInteger(val.bekrafta) || val.bekrafta < 0) {
    throw new RaderingsFel("en skarp körning kräver bekrafta: planens antal raderbara");
  }
  if (raderbara.length > val.bekrafta) {
    throw new RaderingsFel(`planen har ${raderbara.length} raderbara, fler än bekrafta (${val.bekrafta}): kör planen igen`);
  }

  let obekraftadeIFoljd = 0;
  for (const m of raderbara) {
    if (nu() - start >= val.budgetMs) {
      svar.stoppadAv = "tidsbudget";
      break;
    }
    const id = m.wixProductId;
    svar.kvar--;
    const fore = await deps.lasProdukt(id);
    if (fore === null) {
      svar.hinder.lasfel++;
      continue;
    }
    if (fore.finns && fore.visible) {
      svar.hinder.synlig++;
      if (svar.hoppade.length < 20) svar.hoppade.push(id);
      continue;
    }
    try {
      if (fore.finns) {
        await deps.raderaProdukt(id);
        const efter = await deps.lasProdukt(id);
        if (!efter || efter.finns) {
          svar.obekraftade++;
          obekraftadeIFoljd++;
          if (obekraftadeIFoljd >= OBEKRAFTADE_I_FOLJD) {
            svar.stoppadAv = "obekraftade";
            break;
          }
          continue;
        }
        svar.raderade++;
      } else {
        svar.fannsInte++;
      }
      obekraftadeIFoljd = 0;
      await deps.raderaMappning(id);
    } catch (err) {
      // Hela felet bara i Vercels logg.
      console.error("[vevor-utkast-radera] raderingen föll:", err instanceof Error ? err.message : String(err));
      svar.fel++;
    }
  }

  if (svar.stoppadAv === null) svar.stoppadAv = "klart";
  if (
    svar.stoppadAv === "klart" &&
    svar.kvar === 0 &&
    svar.obekraftade === 0 &&
    svar.fel === 0 &&
    svar.hinder.lasfel === 0
  ) {
    await deps.uppdateraImport({
      markor: null,
      varvImporterade: 0,
      varvGranskade: 0,
      vilaTill: null,
      foraldralosa: [],
      senasteKorning: null,
    });
    svar.importNollstalld = true;
  }
  return svar;
}
