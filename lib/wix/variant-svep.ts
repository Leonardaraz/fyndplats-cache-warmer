// Ett svep över alla varianter i butiken, ur Read-Only Variants API
// (`POST /stores/v3/products/query-variants`).
//
// EN definition. Kostnadsverktyget (lib/wix/varukostnad.ts) och rea-jobbet
// (lib/pricing/rea-kor.ts) läser samma sidor med samma tak och samma omförsök;
// två kopior av loopen hade glidit isär (CLAUDE.md, tvillingarna).
//
// Uppmätt 2026-10-24 och 2026-10-28: 1 000 per sida, en markör, och `productId`
// går inte att filtrera på. Sida två och framåt skickar `fields` på nytt
// tillsammans med markören (annars saknas fältet tyst, som `products/search`).
// Utan `fields` kommer pris, jämförpris, synlighet och `productData` (produktens
// id, namn, adress och synlighet) med ändå.
//
// ☠️ KASTAR HELLRE ÄN RETURNERAR EN HALV KATALOG. Ett tak som nås, en markör som
// saknas trots att det finns mer och ett svep under golvet är fel, inte slutet.

import type { WixAnrop } from "../polish/skrivplan";

type Obj = Record<string, unknown>;

const obj = (v: unknown): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const paus = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Wix felkropp (`Wix 400: …`) är fritext, och en validering kan eka värdet som skickades: kostnaden är vårt
 * inköpsled och loggen är publik. Decimaltal och Aosoms artikelnummer byts därför innan texten lämnar modulen.
 * Formerna för artikelnumret är husets (samma som `redigera()` i workflowerna). Det här är det första skyddet:
 * rutten och workflowen redigerar på nytt.
 */
export function redigeraFeltext(text: string): string {
  return text
    .replace(/\b(?:\d{2}[A-Z]|[A-Z]\d{2}|\d[A-Z]\d|\d{3})-\d{3}(?!\d)[A-Z0-9]*\b/g, "‹REDIGERAT›")
    .replace(/aosom:\S+/g, "aosom:‹REDIGERAT›")
    .replace(/\b\d+[.,]\d+\b/g, "‹tal›");
}

const VARIANTER_PER_SIDA = 1000;
/** 40 sidor är 40 000 varianter. Katalogen hade ungefär 20 600 den 2026-11-01. Ett tak ska kasta, aldrig kapa. */
export const MAX_SIDOR = 40;
const SIDPAUS_MS = 250;
const SVEP_PAUS_MS = [1_000, 3_000, 8_000];

export interface SvepOpts {
  /** `fields` i varje anrop, t.ex. `["MERCHANT_DATA"]`. */
  falt?: string[];
  /** Färre varianter än så är ett halvt svep, och kastar. */
  golv: number;
  vanta?: (ms: number) => Promise<void>;
}

/**
 * Varje variant i butiken, som Wix lämnar den (bara varianter med id och
 * produkt-id), en gång per variant-id.
 */
export async function svepaVarianter(wix: WixAnrop, opts: SvepOpts): Promise<Obj[]> {
  const vanta = opts.vanta ?? paus;
  const ut = new Map<string, Obj>();
  let cursor: string | undefined;
  for (let sida = 0; sida < MAX_SIDOR; sida++) {
    if (sida > 0) await vanta(SIDPAUS_MS);
    const body = {
      fields: opts.falt ?? [],
      query: { cursorPaging: cursor ? { limit: VARIANTER_PER_SIDA, cursor } : { limit: VARIANTER_PER_SIDA } },
    };
    let svar: Obj | null = null;
    let sistaFel = "";
    for (let forsok = 0; forsok <= SVEP_PAUS_MS.length; forsok++) {
      try {
        svar = obj(await wix("POST", "/stores/v3/products/query-variants", body));
        break;
      } catch (e) {
        const rått = String((e as Error)?.message ?? e).slice(0, 200);
        const overgaende = /Wix (429|5\d\d)|nätverksfel/.test(rått);
        sistaFel = redigeraFeltext(rått);
        if (!overgaende || forsok === SVEP_PAUS_MS.length) break;
        await vanta(SVEP_PAUS_MS[forsok]);
      }
    }
    if (!svar) throw new Error(`katalogsvepet föll på sida ${sida}: ${sistaFel}`);
    const rader = Array.isArray(svar.variants) ? (svar.variants as Obj[]) : [];
    for (const v of rader) {
      const id = str(v.id);
      const productId = str(obj(v.productData).productId);
      if (!id || !productId) continue;
      ut.set(id, v);
    }
    const meta = obj(svar.pagingMetadata);
    cursor = str(obj(meta.cursors).next) || undefined;
    if (meta.hasNext === false || rader.length === 0) break;
    // ☠️ "Det finns mer" utan markör är ett trasigt svar, inte slutet.
    if (!cursor) throw new Error("query-variants svarade hasNext utan markör");
    if (sida === MAX_SIDOR - 1) throw new Error(`katalogsvepet nådde sidtaket (${MAX_SIDOR} sidor) med markören kvar`);
  }
  if (ut.size < opts.golv) {
    throw new Error(`bara ${ut.size} varianter lästes, golvet är ${opts.golv}: svepet är halvt`);
  }
  return [...ut.values()];
}
