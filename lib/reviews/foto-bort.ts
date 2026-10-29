// Ta bort ENSKILDA foton från recensioner, och visa en dold recension igen (2026-10-29).
//
// VARFÖR. Leonard såg en femstjärnig recension vars enda foto var en skärmdump
// från telefonens fotoväljare (statusfält, "Abbrechen / 1 Foto ausgewählt /
// Fertig"). Texten var bra, fotot var det som inte skulle vara där. Enda verktyget
// var recension-dolj, som döljer HELA recensionen. Det här tar bort bara bilden
// och lämnar texten, betyget och datumet orörda.
//
// REGLER SOM INTE SKA TAS BORT
//
// 1. EN RAD KAN BARA TA BORT. Raden pekar ut recensionen (produkt-id + recensions-id)
//    och de EXAKTA bildadresser som ska bort. En adress som inte redan står på
//    recensionen läggs aldrig till, så rutten går inte att använda för att peka en
//    recension mot en annan bild.
// 2. Inget annat än bildfälten ändras (och status vid `visaIgen`). Text, betyg,
//    datum, initialer och källa lämnas som de är.
// 3. Inget raderas ur Wix media. Filen ligger kvar i Media Manager, men ingen
//    sida pekar på den längre.
// 4. `visaIgen` flyttar bara en DOLD recension (rejected) tillbaka till "edited",
//    den status recensionen hade när den döljdes via recension-dolj. En väntande
//    (pending) recension publiceras aldrig här: ingen har godkänt den.
// 5. Samma körning två gånger ändrar inget andra gången (en adress som redan är
//    borta räknas som klar).
//
// BILDFÄLTEN. `reviewImageFields` ger ALLA tre nycklarna (hasImage, imageUrl,
// imageUrls) även när det inte finns några bilder kvar, och det är poängen: lagret
// skriver en helersättning av raden, och en nyckel som saknas i en spread hade
// lämnat det gamla värdet kvar (se lib/reviews/images.ts).
import { reviewDocId, type ReviewStatus, type StoredReview } from "../store/reviews";
import { MAX_REVIEW_IMAGES, reviewImageFields, reviewImages } from "./images";

/** Högst så många rader per körning. Fler är en export, inte en rättelse. */
export const MAX_RADER = 200;

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** En rad i nyttolasten, efter tvätt. */
export interface FotoBortMal {
  productId: string;
  reviewIdAE: string;
  /** Exakta adresser att ta bort från recensionen. Tom lista = bara `visaIgen`. */
  bilder: string[];
  /** true = en dold (rejected) recension visas igen. */
  visaIgen: boolean;
}

/**
 * Tvättar nyttolasten. Ogiltiga rader kastas med ett skäl; resten släpps igenom.
 * Är listan för lång, eller inte en lista, kastas allt: en körning som tyst
 * hoppar över halva listan är värre än en som stoppar.
 */
export function tolkaMal(rå: unknown): { mal: FotoBortMal[]; fel: string[] } {
  if (!Array.isArray(rå)) return { mal: [], fel: ["nyttolasten ska vara en lista med rader"] };
  if (rå.length > MAX_RADER) {
    return { mal: [], fel: [`för många rader (${rå.length}, högst ${MAX_RADER} per körning)`] };
  }
  const mal: FotoBortMal[] = [];
  const fel: string[] = [];
  const sedda = new Map<string, number>();
  rå.forEach((x, i) => {
    const nr = i + 1;
    if (!x || typeof x !== "object" || Array.isArray(x)) {
      fel.push(`rad ${nr}: ingen rad`);
      return;
    }
    const o = x as Record<string, unknown>;
    const productId = typeof o.productId === "string" ? o.productId.trim() : "";
    const reviewIdAE = typeof o.reviewIdAE === "string" ? o.reviewIdAE.trim() : "";
    if (!GUID.test(productId)) {
      fel.push(`rad ${nr}: ogiltigt produkt-id`);
      return;
    }
    if (!reviewIdAE || reviewIdAE.length > 64) {
      fel.push(`rad ${nr}: recensions-id saknas eller är för långt`);
      return;
    }
    let bilder: string[] = [];
    if (o.bilder !== undefined) {
      if (!Array.isArray(o.bilder)) {
        fel.push(`rad ${nr}: bilder ska vara en lista`);
        return;
      }
      const lista = o.bilder.map((u) => (typeof u === "string" ? u.trim() : ""));
      if (lista.some((u) => !u || u.length > 500 || !u.startsWith("https://") || /[\s"'<>]/.test(u))) {
        fel.push(`rad ${nr}: ogiltig bildadress`);
        return;
      }
      bilder = [...new Set(lista)];
      if (bilder.length > MAX_REVIEW_IMAGES) {
        fel.push(`rad ${nr}: högst ${MAX_REVIEW_IMAGES} bilder per recension`);
        return;
      }
    }
    const visaIgen = o.visaIgen === true;
    if (bilder.length === 0 && !visaIgen) {
      fel.push(`rad ${nr}: inget att göra (varken bilder att ta bort eller visaIgen)`);
      return;
    }
    const nyckel = reviewDocId(productId, reviewIdAE);
    const tidigare = sedda.get(nyckel);
    if (tidigare !== undefined) {
      fel.push(`rad ${nr}: samma recension två gånger (som rad ${tidigare})`);
      return;
    }
    sedda.set(nyckel, nr);
    mal.push({ productId, reviewIdAE, bilder, visaIgen });
  });
  return { mal, fel };
}

export type Utfall = "andras" | "redan_klar" | "recension_saknas" | "fel";

/** Vad som händer (eller hände) med en rad. Bär bara det som syns på produktsidan. */
export interface RadPlan {
  productId: string;
  reviewIdAE: string;
  utfall: Utfall;
  /** Visningsnamnet, t.ex. "A.B." Aldrig kundens riktiga namn. */
  initialer?: string;
  datum?: string;
  bilderFore: number;
  bilderEfter: number;
  statusFore?: ReviewStatus;
  statusEfter?: ReviewStatus;
  /** Hur många av de begärda adresserna som INTE stod på recensionen. */
  saknade: number;
  anm?: string;
  /** Raden att skriva. Bara satt när utfallet är "andras". */
  ny?: StoredReview;
}

export type RadSvar = Omit<RadPlan, "ny">;

/** Rena planen: vad blir resultatet för varje rad? Skriver ingenting. */
export function planeraFotoBort(rader: readonly StoredReview[], mal: readonly FotoBortMal[]): RadPlan[] {
  const perNyckel = new Map<string, StoredReview>();
  for (const r of rader) perNyckel.set(reviewDocId(r.productId, r.reviewIdAE), r);

  return mal.map((m): RadPlan => {
    const r = perNyckel.get(reviewDocId(m.productId, m.reviewIdAE));
    if (!r) {
      return {
        productId: m.productId,
        reviewIdAE: m.reviewIdAE,
        utfall: "recension_saknas",
        bilderFore: 0,
        bilderEfter: 0,
        saknade: m.bilder.length,
      };
    }
    const nu = reviewImages(r);
    const bort = new Set(m.bilder);
    const kvar = nu.filter((u) => !bort.has(u));
    const borttagna = nu.length - kvar.length;
    const saknade = m.bilder.filter((u) => !nu.includes(u)).length;
    const nyStatus: ReviewStatus = m.visaIgen && r.status === "rejected" ? "edited" : r.status;
    const andras = borttagna > 0 || nyStatus !== r.status;
    const bas = {
      productId: m.productId,
      reviewIdAE: m.reviewIdAE,
      initialer: r.initials,
      datum: r.date,
      bilderFore: nu.length,
      bilderEfter: andras ? kvar.length : nu.length,
      statusFore: r.status,
      statusEfter: nyStatus,
      saknade,
    };
    if (!andras) return { ...bas, utfall: "redan_klar" };
    // Bildfälten skrivs bara när något togs bort: en rad där bara statusen ändras
    // ska inte få sina bildfält omskrivna.
    const ny: StoredReview = { ...r, ...(borttagna > 0 ? reviewImageFields(kvar) : {}), status: nyStatus };
    return { ...bas, utfall: "andras", ny };
  });
}

export interface ButikSvar {
  utfall: string;
  status?: number;
  produkter?: number;
}

export interface FotoBortDeps {
  listByProduct(productId: string): Promise<StoredReview[]>;
  upsert(review: StoredReview): Promise<void>;
  /** Säger till butiken att produkternas recensioner ändrats, så att sidorna förnyas. Best-effort. */
  sagTillButiken(produkter: { id: string; vad: "recensioner" }[]): Promise<ButikSvar>;
}

export interface FotoBortRapport {
  skarp: boolean;
  rader: RadSvar[];
  skrivna: number;
  misslyckade: number;
  butiken?: ButikSvar;
}

const kort = (e: unknown) => String((e as Error)?.message ?? e).slice(0, 120);

/**
 * Kör nyttolasten. Torrt som default: `skarp = false` skriver inget och ropar inte
 * på butiken. Ett fel på en rad, eller på en hel produkt, stoppar inte de andra.
 */
export async function korFotoBort(mal: readonly FotoBortMal[], skarp: boolean, deps: FotoBortDeps): Promise<FotoBortRapport> {
  const planer: RadPlan[] = new Array(mal.length);

  // Läs varje produkt en gång, i den ordning de först förekommer.
  const perProdukt = new Map<string, number[]>();
  mal.forEach((m, i) => {
    const lista = perProdukt.get(m.productId) ?? [];
    lista.push(i);
    perProdukt.set(m.productId, lista);
  });
  for (const [productId, index] of perProdukt) {
    const delmal = index.map((i) => mal[i]);
    let delplan: RadPlan[];
    try {
      delplan = planeraFotoBort(await deps.listByProduct(productId), delmal);
    } catch (e) {
      delplan = delmal.map((m) => ({
        productId: m.productId,
        reviewIdAE: m.reviewIdAE,
        utfall: "fel" as const,
        bilderFore: 0,
        bilderEfter: 0,
        saknade: m.bilder.length,
        anm: `kunde inte läsa produktens recensioner: ${kort(e)}`,
      }));
    }
    index.forEach((i, k) => {
      planer[i] = delplan[k];
    });
  }

  let skrivna = 0;
  let misslyckade = 0;
  const andradeProdukter: string[] = [];
  if (skarp) {
    for (const p of planer) {
      if (p.utfall !== "andras" || !p.ny) continue;
      try {
        await deps.upsert(p.ny);
        skrivna++;
        if (!andradeProdukter.includes(p.productId)) andradeProdukter.push(p.productId);
      } catch (e) {
        misslyckade++;
        p.utfall = "fel";
        p.anm = `skrivningen föll: ${kort(e)}`;
        p.bilderEfter = p.bilderFore;
        p.statusEfter = p.statusFore;
      }
    }
  }

  let butiken: ButikSvar | undefined;
  if (skarp && andradeProdukter.length > 0) {
    try {
      butiken = await deps.sagTillButiken(andradeProdukter.map((id) => ({ id, vad: "recensioner" as const })));
    } catch {
      butiken = { utfall: "misslyckades" };
    }
  }

  const rader: RadSvar[] = planer.map(({ ny: _ny, ...rest }) => rest);
  return { skarp, rader, skrivna, misslyckade, ...(butiken ? { butiken } : {}) };
}
