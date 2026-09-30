// Leverantörens övriga bilder, uppladdade för granskning.
//
// VARFÖR DEN FINNS (2026-09-30)
//
// Importen hämtar bara feedens position 1, 2, 3, 8 och 9 (RENA_BILDPOSITIONER),
// och poleringen stryker sedan det som bär tysk text, ett märke eller en logga.
// 222 publicerade sidor stod därför kvar med två eller tre bilder. Leonards
// fråga: finns det rena bilder bland de positioner vi aldrig hämtade?
//
// Det gick inte att svara på. Feeden är enda källan till bildlistan, och dess
// adress får aldrig lämna produktionen. Wix minns inte heller var de importerade
// bilderna kom ifrån: filerna är Wix egna kopior, och originalen är bortstädade.
//
// VAD DEN GÖR
//
// Slår upp produktens Aosom-artikel i mappningen, läser feedens bildlista och
// laddar upp de begärda positionerna till Media Manager, UTAN att röra
// produkten. Svaret bär bara Wix egna fil-id och wixstatic-adresser, så det kan
// stå i en publik Actions-logg. En människa tittar på bilderna, och de som är
// rena skrivs till produkten med poleringens skrivplan.
//
// Bilder som ingen väljer blir föräldralösa och tas av nattens bildstädning
// (`/api/cron/aosom-media-cleanup`, 03:50 UTC), eftersom de bär en
// leverantörsadress i `sourceUrl`. En vald bild måste alltså sitta på sin
// produkt före nästa städning.
//
// FYRA SAKER SOM INTE SKA TAS BORT
//
// 1. ☠️ Svaret bär aldrig artikelnumret, feedens bildadresser eller Aosoms
//    produktadress. Ett uppladdningsfel räknas per position; felmeddelandet
//    följer inte med, för `importMediaByUrl` skriver källadressen i det.
// 2. ☠️ Filnamnet byggs av Wix-id och position, aldrig av källadressen eller
//    titeln. Media Manager visar namnet, och en adress kan bära numret.
// 3. ☠️ Positionerna tas exakt. `valjBilder` släpper igenom HELA listan när
//    ingen önskad position finns, vilket är rätt vid en import men fel här:
//    en tom träff ska vara en tom träff.
// 4. Torrkörning är default. Den säger hur många bilder feeden har och vilka
//    positioner som finns, utan att ladda upp något.

import type { ProductMappingRecord } from "../store";
import type { AosomRow } from "./feed";
import { isAosomMapping } from "../store/supplier";
import { aosomArtikelbild } from "./artiklar";

/** Positionerna importen aldrig hämtar. Feeden har högst nio. */
export const STANDARD_POSITIONER: readonly number[] = [4, 5, 6, 7];
export const MAX_POSITION = 9;
export const MAX_PRODUKTER = 50;
/**
 * Budgeten prövas före varje produkt, och en produkt tar högst nio
 * uppladdningar. Med importens återförsök (1, 3 och 8 s) kan en produkt ta
 * drygt två minuter, så 150 s plus en sista produkt ryms i ruttens 300.
 */
export const STANDARD_TIDSBUDGET_MS = 150_000;
/** Samma paus som importen håller mellan uppladdningar. */
export const STANDARD_PAUS_MS = 150;

export type Hinder =
  | "ingen_mappning"
  | "inte_aosom"
  | "utan_artikel"
  | "flera_artiklar"
  | "saknas_i_feeden"
  | "inga_bilder";

export interface Kandidat {
  pos: number;
  fileId: string;
  url: string;
}

export interface ProduktKandidater {
  wixProductId: string;
  /** Antal bilder feeden har för artikeln, 0 vid hinder före feedslagningen. */
  feedBilder: number;
  /** De begärda positioner som finns i feeden. */
  positioner: number[];
  kandidater: Kandidat[];
  /** Positioner som inte gick att ladda upp. */
  missar: number[];
  hinder?: Hinder;
}

export interface Bildkandidater {
  dryRun: boolean;
  positioner: number[];
  produkter: ProduktKandidater[];
  uppladdade: number;
  missar: number;
  /** Produkter som tidsbudgeten inte räckte till. Skicka dem i nästa anrop. */
  kvar: string[];
}

export interface BildkandidatDeps {
  hamtaMappning(wixProductId: string): Promise<ProductMappingRecord | null>;
  hamtaFeed(): Promise<AosomRow[]>;
  laddaUpp(url: string, displayName: string): Promise<{ id: string; url: string }>;
  vanta?(ms: number): Promise<void>;
  nu?(): number;
}

export interface BildkandidatOpts {
  positioner?: readonly number[];
  dryRun?: boolean;
  tidsbudgetMs?: number;
  pausMs?: number;
}

const WIX_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function arWixProduktId(id: string): boolean {
  return WIX_ID.test(id);
}

/** Heltal 1–9, sorterade och utan dubbletter. Allt annat ignoreras. */
export function tolkaPositioner(varden: readonly unknown[] | undefined): number[] {
  if (!varden || varden.length === 0) return [...STANDARD_POSITIONER];
  const ut = new Set<number>();
  for (const v of varden) {
    const n = Number(v);
    if (Number.isInteger(n) && n >= 1 && n <= MAX_POSITION) ut.add(n);
  }
  return [...ut].sort((a, b) => a - b);
}

/** Filnamnet i Media Manager. Byggs aldrig av källadressen eller titeln. */
export function kandidatNamn(wixProductId: string, pos: number): string {
  return `kandidat-${wixProductId.slice(0, 8)}-${pos}.jpg`;
}

export async function hamtaBildkandidater(
  wixProductIds: readonly string[],
  opts: BildkandidatOpts,
  deps: BildkandidatDeps,
): Promise<Bildkandidater> {
  const dryRun = opts.dryRun !== false;
  const positioner = tolkaPositioner(opts.positioner);
  const budget = opts.tidsbudgetMs ?? STANDARD_TIDSBUDGET_MS;
  const paus = opts.pausMs ?? STANDARD_PAUS_MS;
  const nu = deps.nu ?? (() => Date.now());
  const vanta = deps.vanta ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const start = nu();

  const ids = [...new Set(wixProductIds.map((s) => s.trim()).filter(Boolean))];
  const produkter: ProduktKandidater[] = [];
  const kvar: string[] = [];
  let uppladdade = 0;
  let missar = 0;
  let feed: Map<string, AosomRow> | null = null;
  let forstaUppladdning = true;

  for (const [i, wixProductId] of ids.entries()) {
    if (nu() - start > budget) {
      kvar.push(...ids.slice(i));
      break;
    }
    const svar: ProduktKandidater = {
      wixProductId, feedBilder: 0, positioner: [], kandidater: [], missar: [],
    };
    produkter.push(svar);

    const mappning = await deps.hamtaMappning(wixProductId);
    if (!mappning) { svar.hinder = "ingen_mappning"; continue; }
    if (!isAosomMapping(mappning)) { svar.hinder = "inte_aosom"; continue; }
    const bild = aosomArtikelbild(mappning);
    if (bild.typ !== "en") { svar.hinder = "flera_artiklar"; continue; }
    if (!bild.artikel) { svar.hinder = "utan_artikel"; continue; }

    // Feeden hämtas först när en produkt faktiskt behöver den, och bara en gång.
    if (!feed) feed = new Map((await deps.hamtaFeed()).map((r) => [r.sku, r]));
    const rad = feed.get(bild.artikel);
    if (!rad) { svar.hinder = "saknas_i_feeden"; continue; }

    svar.feedBilder = rad.imageUrls.length;
    svar.positioner = positioner.filter((p) => p <= rad.imageUrls.length);
    if (svar.positioner.length === 0) { svar.hinder = "inga_bilder"; continue; }
    if (dryRun) continue;

    // Tidsbudgeten prövas bara mellan produkter. En produkt som avbröts mitt i
    // hade lämnat uppladdade filer som inget svar nämner, och en omkörning hade
    // laddat upp dem igen.
    for (const pos of svar.positioner) {
      if (!forstaUppladdning && paus > 0) await vanta(paus);
      forstaUppladdning = false;
      try {
        const fil = await deps.laddaUpp(rad.imageUrls[pos - 1], kandidatNamn(wixProductId, pos));
        if (!fil.id || !fil.url) throw new Error("tomt svar");
        svar.kandidater.push({ pos, fileId: fil.id, url: fil.url });
        uppladdade++;
      } catch {
        // Felmeddelandet bär källadressen och följer därför inte med.
        svar.missar.push(pos);
        missar++;
      }
    }
  }

  return { dryRun, positioner, produkter, uppladdade, missar, kvar };
}
