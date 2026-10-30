// Att föra in, ta bort och räkna GPSR-uppgifterna för VEVOR-varor
// (/api/admin/vevor-gpsr, workflowen "VEVOR — produktsäkerhet (GPSR)").
//
// Uppgifterna sparas per artikel i Wix CMS (lib/vevor/gpsr-lager.ts), och
// statusen skrivs på mappningsraden (`vevorGranskning.gpsr`), där poleringen
// och kön läser den. Publiceringsspärren läser raden, inte statusen
// (lib/publicering.ts), så en status som halkat efter släpper aldrig igenom
// en vara.
//
// ☠️ SVAREN BÄR INGET ARTIKELNUMMER. De går till en publik Actions-logg och bär
// Wix-id, status och parterna, som står på den publika produktsidan.
//
// Torrt som default: utan `torr: false` skrivs ingenting.

import type { ProductMappingRecord } from "@/lib/store";
import { vevorSkuOf } from "@/lib/store/supplier";
import { GPSR_STATUSAR, gpsrStatus, type GpsrPart, type GpsrStatus, type VevorGpsr } from "./gpsr";
import type { GpsrLager, VevorGpsrRad } from "./gpsr-lager";
import { lasEffektiva, STANDARD_RAD } from "./gpsr-standard";

export const MAX_PRODUKTER = 50;

export interface GpsrSattDeps {
  mappningar: (wixProductIds: string[]) => Promise<Map<string, ProductMappingRecord>>;
  /** Alla mappningar, för räkningen. */
  allaMappningar: () => Promise<ProductMappingRecord[]>;
  sparaMappning: (rad: ProductMappingRecord) => Promise<void>;
  lager: GpsrLager;
  /** Länkar artikelns produktsida en manual? Ur avläsningarna (lib/vevor/lager.ts). */
  harManual: (skus: string[]) => Promise<Map<string, boolean>>;
  klocka?: () => number;
}

export interface GpsrUtfall {
  wixProductId: string;
  status?: GpsrStatus;
  fel?: string;
}

/** En VEVOR-mappning med artikelnummer, eller felet. */
function vevorRad(id: string, m: ProductMappingRecord | undefined): { m: ProductMappingRecord; sku: string } | { fel: string } {
  if (!m) return { fel: "ingen mappning" };
  const sku = vevorSkuOf(m);
  if (!sku) return { fel: "inte en VEVOR-vara" };
  return { m, sku };
}

/** Mappningen med den nya statusen. Importen sätter fältet; saknas det byggs det försiktigt. */
function medStatus(m: ProductMappingRecord, status: GpsrStatus): ProductMappingRecord {
  const g = m.vevorGranskning ?? { gpsr: status, medicinteknik: false, bildmonster: "okant" as const, bildgranskning: true };
  return { ...m, vevorGranskning: { ...g, gpsr: status } };
}

const lika = (a: GpsrPart | null, b: GpsrPart | null) =>
  a === null || b === null ? a === b : a.namn === b.namn && a.adress === b.adress && a.epost === b.epost;

/**
 * För in samma uppgifter för en eller flera varor (syskon med samma manual).
 * Raden skrivs först och läses tillbaka; mappningens status skrivs bara när
 * raden bevisligen står där.
 */
export async function sattGpsr(
  ids: readonly string[],
  gpsr: VevorGpsr,
  deps: GpsrSattDeps,
  torr: boolean,
): Promise<GpsrUtfall[]> {
  const klocka = deps.klocka ?? Date.now;
  const mappningar = await deps.mappningar([...ids]);
  const ut: GpsrUtfall[] = [];
  for (const id of ids) {
    const r = vevorRad(id, mappningar.get(id));
    if ("fel" in r) {
      ut.push({ wixProductId: id, fel: r.fel });
      continue;
    }
    const status = gpsrStatus(gpsr, r.m.vevorGranskning?.gpsr);
    if (torr) {
      ut.push({ wixProductId: id, status });
      continue;
    }
    try {
      const rad: VevorGpsrRad = { ...gpsr, sku: r.sku, at: new Date(klocka()).toISOString() };
      await deps.lager.spara(rad);
      // ☠️ Räkna efter, lita inte på svaret.
      const efter = (await deps.lager.las([r.sku])).get(r.sku) ?? null;
      if (!efter || !lika(efter.tillverkare, gpsr.tillverkare) || !lika(efter.euAnsvarig, gpsr.euAnsvarig)) {
        ut.push({ wixProductId: id, fel: "raden läste inte tillbaka som den skrevs" });
        continue;
      }
      await deps.sparaMappning(medStatus(r.m, status));
      ut.push({ wixProductId: id, status });
    } catch (e) {
      ut.push({ wixProductId: id, fel: (e instanceof Error ? e.message : String(e)).slice(0, 160) });
    }
  }
  return ut;
}

/** Tar bort uppgifterna. Statusen blir importens igen: manualen finns eller inte. */
export async function rensaGpsr(ids: readonly string[], deps: GpsrSattDeps, torr: boolean): Promise<GpsrUtfall[]> {
  const mappningar = await deps.mappningar([...ids]);
  const rader = ids.map((id) => ({ id, r: vevorRad(id, mappningar.get(id)) }));
  const skus = rader.flatMap(({ r }) => ("sku" in r ? [r.sku] : []));
  const manual = skus.length > 0 ? await deps.harManual(skus) : new Map<string, boolean>();
  const ut: GpsrUtfall[] = [];
  for (const { id, r } of rader) {
    if ("fel" in r) {
      ut.push({ wixProductId: id, fel: r.fel });
      continue;
    }
    const status: GpsrStatus = manual.get(r.sku) === false ? "ingen_manual" : "manual_ej_last";
    if (torr) {
      ut.push({ wixProductId: id, status });
      continue;
    }
    try {
      await deps.lager.taBort(r.sku);
      await deps.sparaMappning(medStatus(r.m, status));
      ut.push({ wixProductId: id, status });
    } catch (e) {
      ut.push({ wixProductId: id, fel: (e instanceof Error ? e.message : String(e)).slice(0, 160) });
    }
  }
  return ut;
}

/** En varas uppgifter och status, för den som ska polera den. */
export async function lasGpsr(
  id: string,
  deps: Pick<GpsrSattDeps, "mappningar" | "lager">,
): Promise<
  | {
      wixProductId: string;
      status: GpsrStatus;
      /** Varifrån uppgifterna kommer: artikelns egen rad eller standardraden. */
      rad: "egen" | "standard" | null;
      uppgifter: (VevorGpsr & { at: string }) | null;
    }
  | GpsrUtfall
> {
  const r = vevorRad(id, (await deps.mappningar([id])).get(id));
  if ("fel" in r) return { wixProductId: id, fel: r.fel };
  const rad = (await lasEffektiva(deps.lager, [r.sku])).get(r.sku) ?? null;
  const status = gpsrStatus(rad, r.m.vevorGranskning?.gpsr);
  if (!rad) return { wixProductId: id, status, rad: null, uppgifter: null };
  return {
    wixProductId: id,
    status,
    rad: rad.sku === STANDARD_RAD ? "standard" : "egen",
    uppgifter: { tillverkare: rad.tillverkare, euAnsvarig: rad.euAnsvarig, kalla: rad.kalla, at: rad.at },
  };
}

/**
 * Standardraden, som gäller alla VEVOR-varor utan egen rad
 * (lib/vevor/gpsr-standard.ts). Skrivs och läses tillbaka. Mappningarnas
 * status skrivs inte om: spärren och /api/gpsr läser raden, inte statusen.
 */
export async function sattStandard(
  gpsr: VevorGpsr,
  deps: Pick<GpsrSattDeps, "lager" | "klocka">,
  torr: boolean,
): Promise<{ status: GpsrStatus; fel?: string }> {
  const status = gpsrStatus(gpsr, undefined);
  if (torr) return { status };
  const klocka = deps.klocka ?? Date.now;
  await deps.lager.spara({ ...gpsr, sku: STANDARD_RAD, at: new Date(klocka()).toISOString() });
  const efter = (await deps.lager.las([STANDARD_RAD])).get(STANDARD_RAD) ?? null;
  if (!efter || !lika(efter.tillverkare, gpsr.tillverkare) || !lika(efter.euAnsvarig, gpsr.euAnsvarig)) {
    return { status, fel: "standardraden läste inte tillbaka som den skrevs" };
  }
  return { status };
}

/** Tar bort standardraden. Varor utan egen rad får då importens status igen. */
export async function rensaStandard(deps: Pick<GpsrSattDeps, "lager">, torr: boolean): Promise<void> {
  if (!torr) await deps.lager.taBort(STANDARD_RAD);
}

/** Standardraden, eller null. */
export async function lasStandard(deps: Pick<GpsrSattDeps, "lager">): Promise<VevorGpsrRad | null> {
  return (await deps.lager.las([STANDARD_RAD])).get(STANDARD_RAD) ?? null;
}

export interface GpsrRakning {
  vevor: number;
  /** Status som spärren ser den: artikelns egen rad, annars standardraden. */
  perStatus: Record<GpsrStatus, number>;
  /** Varor med en egen rad. Övriga följer standardraden, när den finns. */
  egnaRader: number;
  /** Finns standardraden, och vilken status ger den? */
  standard: GpsrStatus | null;
}

/** Alla VEVOR-varor per status. Bara antal. */
export async function raknaGpsr(deps: Pick<GpsrSattDeps, "allaMappningar" | "lager">): Promise<GpsrRakning> {
  const [mappningar, rader] = await Promise.all([deps.allaMappningar(), deps.lager.alla()]);
  const perSku = new Map(rader.map((r) => [r.sku, r]));
  const standardRad = perSku.get(STANDARD_RAD) ?? null;
  const perStatus = Object.fromEntries(GPSR_STATUSAR.map((s) => [s, 0])) as Record<GpsrStatus, number>;
  let vevor = 0;
  let egnaRader = 0;
  for (const m of mappningar) {
    const sku = vevorSkuOf(m);
    if (!sku) continue;
    vevor++;
    const egen = perSku.get(sku) ?? null;
    if (egen) egnaRader++;
    perStatus[gpsrStatus(egen ?? standardRad, m.vevorGranskning?.gpsr)]++;
  }
  return { vevor, perStatus, egnaRader, standard: standardRad ? gpsrStatus(standardRad, undefined) : null };
}
