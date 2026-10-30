// VEVOR-recensionernas foton (Leonard 2026-10-30: "jag vill att alla bilder
// följer också med recensionerna så det inte blir dubbeljobb").
//
// Läsaren tar kundens foton ur sidans egen recensionsdata (`REVIEWS_DATA`,
// lib/vevor/sida.ts). Importen sparar dem med recensionen, och recensioner
// som importerades utan foton får dem här i efterhand.
//
// Varje foto hämtas av oss, med vår användaragent, och läggs i Wix Media med
// den bekräftade vägen (lib/wix/bekraftad-bild.ts): adressen ges först när Wix
// svarat READY. Import File svarar direkt och hämtar senare, och slutade
// hämtningen FAILED stod en död adress kvar på raden. Det kostade var sjätte
// Aosom-bild 2026-09-28.
//
// Fyra egenskaper som inte ska tas bort:
//
// 1. ☠️ Bara VEVOR:s fotoserver hämtas (`RECENSIONSFOTO_VARD`).
// 2. ☠️ En rad som redan har foton rörs inte, och inte heller radens status
//    eller text. Bara fotofälten skrivs.
// 3. Recensionen paras ihop med raden på texten (`textOriginal`), som importen
//    sparade ordagrant ur avläsningen. Blanksteg och versaler räknas inte.
// 4. ☠️ Svaret bär bara antal och Wix-id. Fotonas adresser och recensionernas
//    text går aldrig ut: loggen är publik.
// 5. En dold rad får inga foton (lib/vevor/recensionsartikel.ts döljer
//    recensioner av en annan artikel).

import type { ProductMappingRecord } from "@/lib/store";
import type { StoredReview } from "@/lib/store/reviews";
import { MAX_REVIEW_IMAGES, reviewImageFields, reviewImages } from "@/lib/reviews/images";
import { laddaUppOchBekrafta, type BekraftadDeps } from "@/lib/wix/bekraftad-bild";
import { hamtaVevorByte } from "./bildinnehall";
import type { Avlasning } from "./lager";
import { RECENSIONSFOTO_VARD } from "./sida";

const arFotoVard = (vard: string): boolean => vard === RECENSIONSFOTO_VARD;

/**
 * Ett kundfoto i Wix Media: adressen när Wix svarat READY, annars undefined.
 * Samma form som `ownImageUrlForReview`, så att importen kan använda den.
 */
export async function vevorKundbild(
  kalla: string | undefined,
  namn: string,
  deps: BekraftadDeps = {},
): Promise<string | undefined> {
  if (!kalla) return undefined;
  const byte = await hamtaVevorByte(kalla, arFotoVard, deps.fetch);
  if (!byte) return undefined;
  return (await laddaUppOchBekrafta(byte, `kundbild-${namn}.jpg`, deps)) ?? undefined;
}

/** Texten för att para ihop recension och rad. */
export const recensionsnyckel = (s: string): string => s.replace(/\s+/g, " ").trim().toLowerCase();

export interface RecensionsfotoDeps {
  mappningar(): Promise<ProductMappingRecord[]>;
  avlasningar(skus: string[]): Promise<Map<string, Avlasning>>;
  recensioner(productId: string): Promise<StoredReview[]>;
  spara(rad: StoredReview): Promise<void>;
  /** Ett foto i Wix Media (`vevorKundbild`). */
  laddaUpp(kalla: string, namn: string): Promise<string | undefined>;
  klocka?: () => number;
}

export interface RecensionsfotoVal {
  dryRun: boolean;
  /** Börja vid den här mappningen i listan (svarets `kvarFran`). */
  fran: number;
  budgetMs: number;
}

export interface RecensionsfotoSvar {
  dryRun: boolean;
  produkter: number;
  granskade: number;
  /** Recensioner i avläsningarna som har foton. */
  medFoton: number;
  /** Rader utan foton där avläsningen har foton: de som rättas. */
  attRatta: number;
  redanMedFoton: number;
  /** Recensioner med foton som inte har någon rad (husets filter tog dem). */
  utanRad: number;
  fotonAttHamta: number;
  rattade: number;
  fotonUppladdade: number;
  fotoMissar: number;
  fel: number;
  /** Mappningen nästa körning börjar på, eller null när allt är genomgånget. */
  kvarFran: number | null;
  /** Upp till 50 Wix-id för produkter som har rader att rätta (torrt) eller fick foton (skarpt). */
  idn: string[];
}

/** Fotona per recensionstext i en produkts avläsningar. */
export function fotonPerText(avlasningar: Iterable<Avlasning>): Map<string, string[]> {
  const ut = new Map<string, string[]>();
  for (const a of avlasningar) {
    for (const r of a.recensioner ?? []) {
      if (!r.bilder || r.bilder.length === 0) continue;
      const k = recensionsnyckel(r.text);
      if (!ut.has(k)) ut.set(k, r.bilder.slice(0, MAX_REVIEW_IMAGES));
    }
  }
  return ut;
}

export async function korRecensionsfoton(deps: RecensionsfotoDeps, val: RecensionsfotoVal): Promise<RecensionsfotoSvar> {
  const klocka = deps.klocka ?? Date.now;
  const start = klocka();
  const svar: RecensionsfotoSvar = {
    dryRun: val.dryRun,
    produkter: 0,
    granskade: 0,
    medFoton: 0,
    attRatta: 0,
    redanMedFoton: 0,
    utanRad: 0,
    fotonAttHamta: 0,
    rattade: 0,
    fotonUppladdade: 0,
    fotoMissar: 0,
    fel: 0,
    kvarFran: null,
    idn: [],
  };
  const rader = (await deps.mappningar()).filter((m) => m.wixProductId && m.variants.length > 0);
  svar.produkter = rader.length;
  let i = Math.max(0, val.fran);
  for (; i < rader.length; i++) {
    if (klocka() - start > val.budgetMs) break;
    const m = rader[i];
    svar.granskade++;
    try {
      const avl = await deps.avlasningar(m.variants.map((v) => v.supplierVariantId));
      const foton = fotonPerText(avl.values());
      if (foton.size === 0) continue;
      svar.medFoton += foton.size;
      const sparade = await deps.recensioner(m.wixProductId);
      const traffade = new Set<string>();
      let rattadeHar = false;
      for (const rad of sparade) {
        // En dold rad (en annan artikels recension, eller avvisad) får inga foton.
        if (rad.status === "rejected") continue;
        const k = recensionsnyckel(rad.textOriginal ?? "");
        const kallor = foton.get(k);
        if (!kallor) continue;
        traffade.add(k);
        if (reviewImages(rad).length > 0) {
          svar.redanMedFoton++;
          continue;
        }
        svar.attRatta++;
        svar.fotonAttHamta += kallor.length;
        if (val.dryRun) {
          rattadeHar = true;
          continue;
        }
        const nya: string[] = [];
        for (const [n, kalla] of kallor.entries()) {
          const url = await deps.laddaUpp(kalla, n === 0 ? rad.reviewIdAE : `${rad.reviewIdAE}-${n + 1}`);
          if (url) nya.push(url);
          else svar.fotoMissar++;
        }
        if (nya.length === 0) continue;
        await deps.spara({ ...rad, ...reviewImageFields(nya) });
        svar.rattade++;
        svar.fotonUppladdade += nya.length;
        rattadeHar = true;
      }
      svar.utanRad += [...foton.keys()].filter((k) => !traffade.has(k)).length;
      if (rattadeHar && svar.idn.length < 50) svar.idn.push(m.wixProductId);
    } catch (err) {
      svar.fel++;
      // Bara felets namn: meddelandet kan bära en fotoadress.
      console.warn("[vevor-recensionsfoton] en produkt föll", err instanceof Error ? err.name : "");
    }
  }
  svar.kvarFran = i < rader.length ? i : null;
  return svar;
}
