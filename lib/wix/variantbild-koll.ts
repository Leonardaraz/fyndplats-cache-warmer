// Den dagliga kollen av variantbilderna (lib/wix/variant-media.ts).
//
// Svepet går över HELA katalogen, utkast och AliExpress-sidor med, och
// jämför varje variants bild med den förväntade på alla produkter med fler än
// en variant. `variantsInfo` finns aldrig i sökprojektionen (CLAUDE.md), så
// varje sådan produkt kostar en GET, och `variantSummary.variantCount` går
// inte att filtrera på (400 "not declared as filterable", uppmätt 2026-10-03).
// Urvalet görs därför här, ur katalogsvepet.
//
// Nattens cron kör skarpt (Leonards ja 2026-10-03: "kör den så det fungerar
// fullt ut"), utkast med. Två steg: först läses alla flervariantsprodukter,
// fyra i taget, utan att något skrivs. Sedan rättas de med fel bild EN I
// TAGET, och minsta avvikelse efter en skrivning stoppar körningen. En
// produkt som redan är rätt kostar alltså bara en läsning.

import type { WixAnrop } from "../polish/skrivplan";
import { mapWithConcurrency } from "../concurrency";
import { refreshVariantMedia, type VariantbildUtfall } from "./variant-media";

type Obj = Record<string, unknown>;

/** Sidtak för katalogsvepet: 100 per sida, alltså 30 000 produkter. */
const MAX_SIDOR = 300;
/** Paus mellan katalogsidor, som prislistan. */
const SIDPAUS_MS = 120;
/** Återförsök på svepets POST (skapaWixAnrop försöker bara om GET). */
const SVEP_PAUS_MS = [1_000, 3_000, 8_000];
/**
 * Samtidiga produktläsningar i torrt läge. Fyra GET i taget är ungefär tio
 * anrop i sekunden, under Wix gränser; ett 429 tas av skapaWixAnrop:s
 * återförsök. Rättningen i steg 2 går en i taget.
 */
const SAMTIDIGA_TORRT = 4;

export interface KatalogRad {
  id: string;
  visible: boolean;
  varianter: number;
}

const obj = (v: unknown): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});

/**
 * Hela katalogen: id, synlighet och antal varianter. Utan synlighetsvillkor,
 * med flit — utkasten ska med. Kastar hellre än returnerar en halv lista.
 */
export async function listaKatalogen(
  wix: WixAnrop,
  vanta: (ms: number) => Promise<void>,
): Promise<KatalogRad[]> {
  const ut: KatalogRad[] = [];
  let cursor: string | undefined;
  for (let sida = 0; sida < MAX_SIDOR; sida++) {
    if (sida > 0) await vanta(SIDPAUS_MS);
    const cursorPaging: Obj = cursor ? { limit: 100, cursor } : { limit: 100 };
    let svar: Obj | null = null;
    let sistaFel = "";
    for (let forsok = 0; forsok <= SVEP_PAUS_MS.length; forsok++) {
      try {
        svar = obj(await wix("POST", "/stores/v3/products/query", { query: { cursorPaging } }));
        break;
      } catch (e) {
        sistaFel = String((e as Error)?.message ?? e).slice(0, 200);
        const overgaende = /Wix (429|5\d\d)|nätverksfel/.test(sistaFel);
        if (!overgaende || forsok === SVEP_PAUS_MS.length) break;
        await vanta(SVEP_PAUS_MS[forsok]);
      }
    }
    if (!svar) throw new Error(`katalogsvepet föll på sida ${sida}: ${sistaFel}`);
    const produkter = Array.isArray(svar.products) ? (svar.products as Obj[]) : [];
    for (const p of produkter) {
      if (typeof p.id !== "string") continue;
      ut.push({
        id: p.id,
        visible: p.visible !== false,
        varianter: Number(obj(p.variantSummary).variantCount ?? 0),
      });
    }
    const meta = obj(svar.pagingMetadata);
    cursor = typeof obj(meta.cursors).next === "string" ? (obj(meta.cursors).next as string) : undefined;
    if (produkter.length === 0 || !cursor || meta.hasNext === false) return ut;
  }
  throw new Error(`katalogsvepet nådde sidtaket (${MAX_SIDOR} sidor, ${ut.length} produkter) med markören kvar`);
}

export interface KollOpts {
  /** Default: torrt. Nattens cron kör `torr: false`. */
  torr?: boolean;
  /** `false` hoppar utkast. Default: utkast rättas också. */
  utkast?: boolean;
  /** Tidpunkt (ms) då inga nya produkter påbörjas. */
  deadline: number;
  /** Fortsätt från den här positionen i listan över flervariantsprodukter. */
  start?: number;
  /** Högst så många produkter den här körningen. */
  limit?: number;
  /** Bara de här produkterna (provet på ett utkast). Svepet hoppas då över. */
  ids?: string[];
  vanta?: (ms: number) => Promise<void>;
}

export interface KollProdukt {
  id: string;
  visible: boolean;
  status: VariantbildUtfall["status"];
  /** Antal varianter på fel bild. */
  fel: number;
  /** Valens namn för de första, t.ex. ["Blå", "Rosa"]. Inga SKU:er. */
  exempel: string[];
  okanda?: number;
  avvikelser?: string[];
  felText?: string;
}

export interface KollRapport {
  torr: boolean;
  utkast: boolean;
  katalogen: number;
  flervariant: number;
  start: number;
  kontrollerade: number;
  /** Nästa `start`, eller null när listan är genomgången. */
  nasta: number | null;
  fullstandig: boolean;
  stoppad: boolean;
  summa: Partial<Record<VariantbildUtfall["status"], number>>;
  /** Publicerade / utkast med fel bild. */
  medFelBild: { publicerade: number; utkast: number; varianter: number };
  /** Produkterna som inte var rätt, utom `en_variant`. */
  produkter: KollProdukt[];
}

export async function korVariantbildKoll(wix: WixAnrop, opts: KollOpts): Promise<KollRapport> {
  const torr = opts.torr !== false;
  const utkast = opts.utkast !== false;
  const vanta = opts.vanta ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));

  let katalogen = 0;
  let lista: KatalogRad[];
  if (opts.ids?.length) {
    lista = opts.ids.map((id) => ({ id, visible: true, varianter: 2 }));
  } else {
    const alla = await listaKatalogen(wix, vanta);
    katalogen = alla.length;
    lista = alla.filter((p) => p.varianter > 1);
  }
  const start = Math.max(0, Math.trunc(opts.start ?? 0));
  const slut = opts.limit && opts.limit > 0 ? Math.min(lista.length, start + opts.limit) : lista.length;
  const urval = lista.slice(start, slut);

  // Steg 1: läs alla, fyra i taget. Skriver ingenting.
  const utfall: (VariantbildUtfall | null)[] = await mapWithConcurrency(
    urval,
    SAMTIDIGA_TORRT,
    async (p) => {
      if (Date.now() > opts.deadline) return null;
      return refreshVariantMedia(wix, p.id, { torr: true, utkast, vanta });
    },
  );

  // Steg 2: rätta dem med fel bild, en i taget. En avvikelse stoppar.
  let stoppad = false;
  if (!torr) {
    for (let i = 0; i < utfall.length; i++) {
      const u = utfall[i];
      if (!u || u.status !== "torr") continue;
      if (u.visible === false && !utkast) {
        utfall[i] = { ...u, status: "utkast_hoppat" };
        continue;
      }
      if (stoppad || Date.now() > opts.deadline) break;
      const ny = await refreshVariantMedia(wix, u.productId, { utkast, vanta });
      utfall[i] = ny;
      if (ny.status === "avvikelse") stoppad = true;
    }
  }

  // Positionen efter den sista som hann kontrolleras i följd.
  let kontrollerade = 0;
  while (kontrollerade < utfall.length && utfall[kontrollerade] !== null) kontrollerade++;
  const nastaPos = start + kontrollerade;
  const nasta = nastaPos < lista.length ? nastaPos : null;

  const summa: KollRapport["summa"] = {};
  const medFelBild = { publicerade: 0, utkast: 0, varianter: 0 };
  const produkter: KollProdukt[] = [];
  for (const u of utfall) {
    if (!u) continue;
    summa[u.status] = (summa[u.status] ?? 0) + 1;
    const synlig = u.visible !== false;
    if (u.avvikande.length > 0 && u.status !== "rattad") {
      medFelBild[synlig ? "publicerade" : "utkast"]++;
      medFelBild.varianter += u.avvikande.length;
    }
    if (u.status === "ratt" && u.okanda.length === 0) continue;
    if (u.status === "en_variant") continue;
    produkter.push({
      id: u.productId,
      visible: synlig,
      status: u.status,
      fel: u.avvikande.length,
      exempel: u.avvikande.slice(0, 5).map((a) => a.namn),
      ...(u.okanda.length ? { okanda: u.okanda.length } : {}),
      ...(u.avvikelser ? { avvikelser: u.avvikelser } : {}),
      ...(u.fel ? { felText: u.fel } : {}),
    });
  }

  return {
    torr,
    utkast,
    katalogen,
    flervariant: lista.length,
    start,
    kontrollerade: utfall.filter(Boolean).length,
    nasta,
    // Skarpt: också varje produkt med fel bild ska ha hunnit rättas.
    fullstandig: nasta === null && !stoppad && (torr || !utfall.some((u) => u?.status === "torr")),
    stoppad,
    summa,
    medFelBild,
    produkter,
  };
}
