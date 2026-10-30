// Familjeregeln på de utkast som redan finns (Leonard 2026-10-30: "Följ
// rekommendationen").
//
// Importen följer regeln för nya artiklar (lib/vevor/axelklass.ts,
// lib/vevor/familj.ts). Utkasten från före följer den inte: en länkad familj
// med en axel för funktion ligger på en sida, och artiklar med samma SPU ligger
// på var sin. Planen säger vilka utkast som ska raderas, så att importen bygger
// om dem med regeln:
//
//   dela     en familj med en axel för funktion. Importen gör en sida per artikel.
//   slaIhop  ensamma utkast som blir en familj med samma SPU. Importen slår ihop dem.
//   grans    en axel som inte går att avgöra. Listas för Leonard och raderas inte.
//
// Fem egenskaper som inte ska tas bort:
//
// 1. ☠️ Bara opolerade VEVOR-utkast (`arOpoleratVevorUtkast`). En polerad eller
//    publicerad sida rörs aldrig, och dess artiklar är upptagna.
// 2. ☠️ Samma funktioner som importen: `regelFor` på familjens val, och
//    `byggSpuFamilj` med ankaret importen skulle välja (första artikeln i
//    artikelnummerordning som kan importeras). En plan som räknade på ett eget
//    sätt hade raderat utkast som sedan importerats likadant igen.
// 3. ☠️ En SPU-grupp som väntar på läsaren eller blir egna sidor rörs inte.
//    Bara en grupp som blir en familj raderar sina utkast.
// 4. ☠️ Ett gränsfall raderas inte, varken en befintlig familj eller en
//    SPU-grupp. Leonard avgör.
// 5. ☠️ Planen bär bara Wix-id, axelnamn och antal. Axelnamnen är VEVOR:s egna
//    svenska rubriker ("Material"), aldrig ett artikelnummer eller ett värde.
//
// Ren modul.

import type { ProductMappingRecord } from "@/lib/store";
import { vevorSkuOf } from "@/lib/store/supplier";
import type { Avlasning } from "./lager";
import { axelklass } from "./axelklass";
import { byggSpuFamilj, familjeVarden, regelFor, skiljandeAxlar, specAxlar, syskonSkus } from "./familj";
import { importhinder, medlemshinder, vevorSupplierProductId } from "./to-product";
import { arOpoleratVevorUtkast } from "./radera-utkast";

/** Det läsaren vet om en artikel, för att hitta SPU-grupperna utan att läsa hela avläsningen. */
export type SpuRad = Pick<Avlasning, "sku" | "spu" | "syskon" | "borta">;

/** Fält som räcker för `spuKandidater`. */
export const SPU_FALT = ["sku", "spu", "syskon", "borta"] as const satisfies readonly (keyof Avlasning)[];

export interface Gransfall {
  axel: string;
  /** Familjer eller SPU-grupper med axeln. */
  antal: number;
  /** Upp till tjugo Wix-id: familjens sida eller gruppens utkast. */
  wixIds: string[];
}

export interface FamiljeregelPlan {
  /** Opolerade VEVOR-utkast. */
  utkast: number;
  /** Av dem: familjer (fler än en artikel). */
  familjer: number;
  /** Wix-id för familjer med en axel för funktion. */
  dela: string[];
  /** Wix-id för ensamma utkast som blir en familj med samma SPU. */
  slaIhop: string[];
  /** Hur många familjer `slaIhop` blir. */
  slaIhopFamiljer: number;
  /** Axlar som inte går att avgöra, sorterade på antal. */
  grans: Gransfall[];
  /** SPU-grupper som väntar på läsaren. */
  spuVantar: number;
  /** SPU-grupper som blir egna sidor (funktion, olika titlar, olika betyg …). */
  spuEnsamma: number;
}

const MAX_ID_PER_GRANSFALL = 20;

/** Artiklarna raden bär, med prefix. */
function radensArtiklar(m: ProductMappingRecord): string[] {
  const ut = new Set(m.vevorArtiklar ?? []);
  if (m.supplierProductId) ut.add(m.supplierProductId);
  for (const v of m.variants ?? []) if (v.supplierVariantId) ut.add(vevorSupplierProductId(v.supplierVariantId));
  return [...ut];
}

/** Ett ensamt utkast: en artikel på raden. */
function arEnsamt(m: ProductMappingRecord): boolean {
  return radensArtiklar(m).length <= 1;
}

/**
 * SPU:er där minst två artiklar utan länkar finns och minst en av dem är ett
 * ensamt opolerat utkast. Bara de behöver läsas i sin helhet.
 */
export function spuKandidater(rader: readonly SpuRad[], mappningar: readonly ProductMappingRecord[]): string[] {
  const ensamma = new Set<string>();
  for (const m of mappningar) {
    const sku = vevorSkuOf(m);
    if (sku && arOpoleratVevorUtkast(m) && arEnsamt(m)) ensamma.add(sku);
  }
  const grupper = new Map<string, { antal: number; harUtkast: boolean }>();
  for (const r of rader) {
    if (!r.spu || r.borta || syskonSkus(r as Avlasning).length > 0) continue;
    const g = grupper.get(r.spu) ?? { antal: 0, harUtkast: false };
    g.antal++;
    if (ensamma.has(r.sku)) g.harUtkast = true;
    grupper.set(r.spu, g);
  }
  return [...grupper].filter(([, g]) => g.antal >= 2 && g.harUtkast).map(([spu]) => spu).sort();
}

function laggTill(grans: Map<string, Gransfall>, axel: string, ids: readonly string[]) {
  const g = grans.get(axel) ?? { axel, antal: 0, wixIds: [] };
  g.antal++;
  for (const id of ids) if (g.wixIds.length < MAX_ID_PER_GRANSFALL && !g.wixIds.includes(id)) g.wixIds.push(id);
  grans.set(axel, g);
}

/** De skiljande axlarnas namn som är oklara. */
function oklaraAxlar(axlar: readonly string[], varden: readonly Record<string, string>[]): string[] {
  return skiljandeAxlar(axlar, varden)
    .filter((a) => axelklass(a.namn, a.varden) === "oklar")
    .map((a) => a.namn);
}

export function planeraFamiljeregel(underlag: {
  /** Alla VEVOR-rader. */
  mappningar: readonly ProductMappingRecord[];
  /** SPU → alla avläsningar med SPU:n (`spuKandidater`, lasSpuGrupper). */
  grupper: ReadonlyMap<string, readonly Avlasning[]>;
  nu: number;
}): FamiljeregelPlan {
  const utkast = underlag.mappningar.filter(arOpoleratVevorUtkast);
  const grans = new Map<string, Gransfall>();
  const plan: FamiljeregelPlan = {
    utkast: utkast.length,
    familjer: 0,
    dela: [],
    slaIhop: [],
    slaIhopFamiljer: 0,
    grans: [],
    spuVantar: 0,
    spuEnsamma: 0,
  };

  // Befintliga familjer: regeln på valen, som importen skrev dem.
  for (const m of utkast) {
    if (arEnsamt(m)) continue;
    plan.familjer++;
    const varden = (m.variants ?? []).map((v) => v.choices ?? {});
    const axlar = [...new Set(varden.flatMap((v) => Object.keys(v)))];
    const regel = regelFor(axlar, varden);
    if (regel === "funktion") plan.dela.push(m.wixProductId);
    else if (regel === "oklar_axel") for (const axel of oklaraAxlar(axlar, varden)) laggTill(grans, axel, [m.wixProductId]);
  }

  // Ensamma utkast med samma SPU.
  const utkastFor = new Map<string, ProductMappingRecord>();
  for (const m of utkast) {
    const sku = vevorSkuOf(m);
    if (sku && arEnsamt(m)) utkastFor.set(sku, m);
  }
  // Upptagen: artikeln sitter på en rad som inte är ett ensamt opolerat utkast.
  const upptagna = new Set<string>();
  for (const m of underlag.mappningar) {
    const sku = vevorSkuOf(m);
    if (sku && utkastFor.get(sku) === m) continue;
    for (const a of radensArtiklar(m)) upptagna.add(a);
    if (m.importSparr) upptagna.add(m.importSparr);
  }
  const upptagen = (sku: string) => upptagna.has(vevorSupplierProductId(sku));

  for (const [, alla] of [...underlag.grupper].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    const medlemmar = alla
      .filter((a) => !a.borta && syskonSkus(a).length === 0)
      .sort((a, b) => (a.sku < b.sku ? -1 : a.sku > b.sku ? 1 : 0));
    if (medlemmar.length < 2 || !medlemmar.some((a) => utkastFor.has(a.sku))) continue;
    // Ankaret är den första artikeln importen skulle ta: i artikelnummerordning,
    // utan hinder och inte upptagen.
    const ankare = medlemmar.find((a) => !upptagen(a.sku) && importhinder(a, underlag.nu) === null);
    if (!ankare) {
      plan.spuVantar++;
      continue;
    }
    const familj = byggSpuFamilj(ankare, medlemmar.filter((a) => a.sku !== ankare.sku), underlag.nu, upptagen);
    const ids = medlemmar.map((a) => utkastFor.get(a.sku)?.wixProductId).filter((id): id is string => !!id);
    if (familj.typ === "familj") {
      const iFamiljen = familj.medlemmar.map((a) => utkastFor.get(a.sku)?.wixProductId).filter((id): id is string => !!id);
      if (iFamiljen.length === 0) continue;
      plan.slaIhop.push(...iFamiljen);
      plan.slaIhopFamiljer++;
    } else if (familj.typ === "vanta") {
      plan.spuVantar++;
    } else if (familj.typ === "ej_sammanslagen" && familj.skal === "oklar_axel") {
      const urval = [ankare, ...medlemmar.filter((a) => a.sku !== ankare.sku && !upptagen(a.sku) && medlemshinder(a, underlag.nu) === null)];
      const sa = specAxlar(urval);
      const namn = typeof sa === "object" ? oklaraAxlar(sa.axlar, urval.map((a) => familjeVarden(a, sa.axlar))) : [];
      for (const axel of namn.length > 0 ? namn : ["(okänd axel)"]) laggTill(grans, axel, ids);
    } else {
      plan.spuEnsamma++;
    }
  }

  plan.dela.sort();
  plan.slaIhop = [...new Set(plan.slaIhop)].sort();
  plan.grans = [...grans.values()].sort((a, b) => b.antal - a.antal || (a.axel < b.axel ? -1 : 1));
  return plan;
}
