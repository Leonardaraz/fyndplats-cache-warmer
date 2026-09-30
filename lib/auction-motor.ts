// lib/auction-motor.ts
//
// ☠️ FYNDAUKTIONEN LÄSES OCH AVSLUTAS VIA MOTORN, INTE UR WIX DATA DIREKT
// (sedan 2026-09-29).
//
// Fram till dess frågade butiken FyndplatsAuctions i Wix Data själv, både för
// /fyndauktion (lib/auction-view.ts) och för webhookens direktavslut
// (lib/auction-sold.ts). Raderna flyttar till Postgres: Wix CMS har ett
// GLOBALT tak på 4 000 rader, och auktionskön var 3 561 av dem. När
// Wix-raderna raderas hade den gamla vägen inte gått sönder — den hade blivit
// TOM. /fyndauktion hade visat noll fynd, och webhooken hade avslutat
// auktioner i ett lager ingen läser. Varken en kodaudit eller en felräknare
// ser det. Samma lärdom som spårningssidan 2026-09-01 och recensionerna
// 2026-09-02, och därför skrivs butiken om FÖRE raderingen.
//
// Motorn (cache-warmer, grenen main) svarar ur det lager AUCTIONS_BACKEND
// pekar på, så butiken följer med i växlingen utan en egen deploy.
//
// LÖVMODUL med flit: inga sido-importer, så `node --test` kan ladda den.
//
// Hemligheten är REVIEW_INGEST_SECRET — samma värde i båda Vercel-projekten
// sedan 2026-09-02, och den enda de två redan delar. Rutterna kräver den
// eftersom stegen (`ladder`) avslöjar golvet; butikens server räknar nästa
// sänkning ur den och skickar den aldrig till klienten.

/** Motorn äger auktionslagret. Samma mönster som lib/reviews.ts. */
export const AUKTIONS_API =
  process.env.CACHE_WARMER_AUCTIONS_URL
  ?? "https://fyndplats-cache-warmer.vercel.app/api/auctions";

/** Fälten motorn skickar (en allowlist på motorns sida — inget golv). */
export type MotorRad = {
  productId?: string;
  slug?: string;
  name?: string;
  listPrice?: number;
  ladder?: number[];
  stepMinutes?: number;
  slot?: number;
  status?: string;
  startAt?: string;
  endedAt?: string;
  soldPrice?: number;
  /** Steget motorn senast satte i Wix (se nextDropOfLadder). */
  lastPatchedStep?: number;
};

type Hämta = typeof fetch;

type Beroenden = {
  fetchImpl?: Hämta;
  hemlighet?: string | undefined;
  bas?: string;
};

function hemlighetEller(d: Beroenden): string | undefined {
  return "hemlighet" in d ? d.hemlighet : process.env.REVIEW_INGEST_SECRET;
}

/**
 * Live- eller sålda rader. FAIL-OPEN: ett fel ger en tom lista, precis som
 * när butiken läste Wix själv — en trasig motor får inte fälla startsidan.
 * Men felet LOGGAS, så en tom auktion går att skilja från en tyst.
 *
 * Cachen (15 s, taggen "auctions") är densamma som förut: raden bär
 * lastPatchedStep, som avgör när en ny timmes pris är på plats, och webhooken
 * tömmer taggen när ett fynd säljs.
 */
export async function hämtaAuktionsrader(
  status: "live" | "sold",
  d: Beroenden = {},
): Promise<MotorRad[]> {
  const hemlighet = hemlighetEller(d);
  if (!hemlighet) {
    console.error("[auction-motor] REVIEW_INGEST_SECRET saknas — Fyndauktionen kan inte läsas");
    return [];
  }
  const f = d.fetchImpl ?? fetch;
  const url = `${d.bas ?? AUKTIONS_API}/rader?status=${status}${status === "sold" ? "&limit=50" : ""}`;
  try {
    const res = await f(url, {
      headers: { authorization: `Bearer ${hemlighet}` },
      next: { revalidate: 15, tags: ["auctions"] },
    } as RequestInit);
    if (!res.ok) {
      console.error(`[auction-motor] rader?status=${status} svarade ${res.status}`);
      return [];
    }
    const body = (await res.json()) as { rader?: MotorRad[] };
    return (Array.isArray(body.rader) ? body.rader : []).filter((r) => r && r.slug);
  } catch (err) {
    console.error(`[auction-motor] rader?status=${status} föll`, err);
    return [];
  }
}

/** Webhookens request-väg: normal latens tillåts, en hängning får inte äta funktionstiden. */
const AVSLUTA_TIMEOUT_MS = 20_000;

/**
 * Avsluta live-auktioner vars produkt finns bland `productIds` (orderns
 * rader). Motorn återställer priset FÖRST och sparar sedan sold — samma
 * ordning som timcronen. Returnerar avslutade sluggar; tom lista = ingen
 * auktionsprodukt i ordern (det normala).
 *
 * KASTAR när motorn inte svarar eller hemligheten saknas: webhooken fångar
 * felet och loggar det, och timcronens sold-detektering tar över inom timmen.
 * Fel i enskilda rader loggas här och tystar inte de andra.
 */
export async function avslutaHosMotorn(productIds: string[], d: Beroenden = {}): Promise<string[]> {
  if (productIds.length === 0) return [];
  const hemlighet = hemlighetEller(d);
  if (!hemlighet) throw new Error("REVIEW_INGEST_SECRET saknas — kan inte avsluta auktioner hos motorn");
  const f = d.fetchImpl ?? fetch;
  const res = await f(`${d.bas ?? AUKTIONS_API}/avsluta`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${hemlighet}` },
    body: JSON.stringify({ productIds }),
    cache: "no-store",
    signal: AbortSignal.timeout(AVSLUTA_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`auktionsavslut: motorn svarade ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const body = (await res.json()) as { avslutade?: unknown; fel?: unknown };
  if (Array.isArray(body.fel) && body.fel.length > 0) {
    console.error(`[auction-motor] kunde inte avsluta allt (timcronen tar det): ${body.fel.join(" | ")}`);
  }
  return Array.isArray(body.avslutade) ? body.avslutade.filter((s): s is string => typeof s === "string") : [];
}
