// Omskrivning av PUBLICERADE Aosom-recensioner till mänskligare svenska (2026-09-24).
//
// VARFÖR. Leonard 2026-09-24: recensionerna var välskrivna men såg AI-skrivna
// ut — tankstreck, perfekt grammatik, stela fraser ("Sammantaget", "förhållandet
// mellan pris och kvalitet"). 709 av 4 268 publicerade Aosom-texter hade
// tankstreck. Beslut: skriv om Aosom-recensionerna i vardaglig ton, samma
// innehåll, samma tvätt (inga varumärken, butiker, leveranstider …).
//
// Inläsningen (review-ingest.ts) skriver bara översättningar på rader som
// ligger som `pending` och rör aldrig det som redan är publicerat. Den här
// vägen är den enda som byter text på en SYNLIG rad, och den gör det bara när
// tre saker stämmer:
//
//   1. raden är en Aosom-recension (`source: "aosom"`) — andra källor rörs inte;
//   2. raden är synlig (`approved`/`edited`) — en dold rad väcks aldrig till liv;
//   3. den lagrade svenska texten är EXAKT den som omskrivningen utgick från
//      (`fore`). Har någon redigerat texten sedan dess hoppas raden över —
//      en människas ändring skrivs aldrig över.
//
// Den nya texten passerar samma grind som allt annat: validateTranslation mot
// originalet. En rad kan också bära `dolj: true` — för recensioner som visade
// sig handla om en annan produkt (fem stycken vid omskrivningen 2026-09-24).
//
// ☠️ LOGGEN BÄR BARA RÄKNARE. Nyttolasten ligger i en publik gren: den bär
// svenska texter som redan är publika på butiken, produkt-id och recensions-id
// — aldrig artikelnummer, aldrig namn.

import { isVisibleStatus, type StoredReview } from "../store/reviews";
import { validateTranslation } from "./translate";

/** Rader per anrop — varje omskrivning kostar en läsning och en skrivning. */
export const MAX_OMSKRIVNINGAR_PER_ANROP = 100;
const MAX_TEXT = 2000;

export interface OmskrivRad {
  productId: string;
  reviewIdAE: string;
  /** Den publicerade svenska text omskrivningen utgick från. */
  fore?: string;
  /** Ny svensk text. */
  sv?: string;
  /** Sant = dölj raden (status rejected) i stället för att skriva om den. */
  dolj?: boolean;
}

export function tolkaOmskrivning(body: unknown): { rader: OmskrivRad[]; fel: string[] } {
  const fel: string[] = [];
  const rader: OmskrivRad[] = [];
  const rå = body && typeof body === "object" ? (body as { rader?: unknown }).rader : undefined;
  if (!Array.isArray(rå)) return { rader, fel: ["`rader` saknas eller är inte en lista"] };
  if (rå.length > MAX_OMSKRIVNINGAR_PER_ANROP) {
    return { rader, fel: [`för många rader (${rå.length} > ${MAX_OMSKRIVNINGAR_PER_ANROP}) — dela upp`] };
  }
  rå.forEach((r, i) => {
    if (!r || typeof r !== "object") {
      fel.push(`rad ${i}: inte ett objekt`);
      return;
    }
    const o = r as Record<string, unknown>;
    const productId = typeof o.productId === "string" ? o.productId.trim() : "";
    const reviewIdAE = typeof o.reviewIdAE === "string" ? o.reviewIdAE.trim() : "";
    if (!productId || !reviewIdAE) {
      fel.push(`rad ${i}: productId eller reviewIdAE saknas`);
      return;
    }
    if (o.dolj === true) {
      rader.push({ productId, reviewIdAE, dolj: true });
      return;
    }
    const fore = typeof o.fore === "string" ? o.fore.trim() : "";
    const sv = typeof o.sv === "string" ? o.sv.trim().slice(0, MAX_TEXT) : "";
    if (!fore || !sv) {
      fel.push(`rad ${i}: fore eller sv saknas`);
      return;
    }
    rader.push({ productId, reviewIdAE, fore, sv });
  });
  return { rader, fel };
}

export interface OmskrivDeps {
  listByProduct: (productId: string) => Promise<StoredReview[]>;
  editText: (productId: string, reviewIdAE: string, svenska: string) => Promise<void>;
  setStatus: (productId: string, reviewIdAE: string, status: "rejected") => Promise<void>;
  now: () => number;
  dryRun: boolean;
  tidsbudgetMs?: number;
  startMs?: number;
}

export interface OmskrivSummering {
  dryRun: boolean;
  rader: number;
  behandlade: number;
  /** Raden finns inte i lagret. */
  saknas: number;
  /** Inte en Aosom-recension — rörs inte. */
  annanKalla: number;
  /** Inte synlig (väntande eller dold) — väcks aldrig till liv. */
  ejSynliga: number;
  /** Texten har ändrats sedan omskrivningen gjordes — en människas ändring vinner. */
  andradeSedan: number;
  /** Ny text identisk med den publicerade. */
  oforandrade: number;
  underkanda: number;
  underkandaSkal: Record<string, number>;
  omskrivna: number;
  dolda: number;
  skrivfel: number;
  stoppadAv: "klart" | "tidsbudget";
  kvarFran: number | null;
}

export async function skrivOm(rader: OmskrivRad[], deps: OmskrivDeps): Promise<OmskrivSummering> {
  const s: OmskrivSummering = {
    dryRun: deps.dryRun,
    rader: rader.length,
    behandlade: 0,
    saknas: 0,
    annanKalla: 0,
    ejSynliga: 0,
    andradeSedan: 0,
    oforandrade: 0,
    underkanda: 0,
    underkandaSkal: {},
    omskrivna: 0,
    dolda: 0,
    skrivfel: 0,
    stoppadAv: "klart",
    kvarFran: null,
  };
  const start = deps.startMs ?? deps.now();
  const budget = deps.tidsbudgetMs ?? Infinity;
  const perProdukt = new Map<string, Map<string, StoredReview>>();

  for (let i = 0; i < rader.length; i++) {
    if (deps.now() - start > budget) {
      s.stoppadAv = "tidsbudget";
      s.kvarFran = i;
      break;
    }
    const rad = rader[i];
    s.behandlade++;
    try {
      let lagrade = perProdukt.get(rad.productId);
      if (!lagrade) {
        lagrade = new Map((await deps.listByProduct(rad.productId)).map((r) => [r.reviewIdAE, r]));
        perProdukt.set(rad.productId, lagrade);
      }
      const lagrad = lagrade.get(rad.reviewIdAE);
      if (!lagrad) {
        s.saknas++;
        continue;
      }
      if (String(lagrad.source ?? "").trim() !== "aosom") {
        s.annanKalla++;
        continue;
      }
      if (rad.dolj) {
        if (lagrad.status === "rejected") continue;
        if (!deps.dryRun) await deps.setStatus(rad.productId, rad.reviewIdAE, "rejected");
        s.dolda++;
        continue;
      }
      if (!isVisibleStatus(lagrad.status)) {
        s.ejSynliga++;
        continue;
      }
      const nu = String(lagrad.textSwedish ?? "").trim();
      if (nu !== rad.fore) {
        s.andradeSedan++;
        continue;
      }
      if (rad.sv === nu) {
        s.oforandrade++;
        continue;
      }
      const dom = validateTranslation(lagrad.textOriginal, rad.sv!);
      if (!dom.ok) {
        s.underkanda++;
        const skal = dom.reason ?? "okänd";
        s.underkandaSkal[skal] = (s.underkandaSkal[skal] ?? 0) + 1;
        continue;
      }
      if (!deps.dryRun) await deps.editText(rad.productId, rad.reviewIdAE, rad.sv!);
      s.omskrivna++;
    } catch {
      s.skrivfel++;
    }
  }
  return s;
}
