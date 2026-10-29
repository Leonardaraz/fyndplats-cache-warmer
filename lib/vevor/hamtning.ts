// Hämtningen av VEVOR-sidor: en i taget, ärligt, och aldrig förbi en spärr.
//
// Leonards villkor 2026-10-28, ordagrant i sak:
//   - en sida i taget, högst en per sekund i snitt, ingen parallellitet
//   - ärlig User-Agent med info@fyndplats.com
//   - vid 403, 429, captcha eller tomma sidor: stoppa, frys alla skrivningar
//     och larma. Ingen kringgång: inga proxyer och ingen låtsad webbläsare.
//   - aldrig spärrade sökvägar (robots.txt) och aldrig /api/*
//
// Klassningen här är ren (`klassaSvar`), så att reglerna går att testa utan
// nät. `hamta` gör själva anropet och följer ALDRIG en omdirigering: en flyttad
// sida läses om i en senare körning, som vilken sida som helst.

import { VEVOR_BAS, sokvagUr, webbIdUr } from "./sida";

/** Vem vi är. Ärligt, med en adress VEVOR kan svara på. */
export const ANVANDARAGENT = "FyndplatsBot/1.0 (+https://www.fyndplats.se; info@fyndplats.com)";

/** Minsta tid mellan två anrop till VEVOR, oavsett vilka. */
export const MIN_MELLANRUM_MS = 1_000;

/** Ett anrop som inte svarat på 20 sekunder ger vi upp. */
const TIDSGRANS_MS = 20_000;

/** Större än så är ingen produktsida (de mätta är 0,3–0,4 MB). */
const MAX_KROPP = 5_000_000;

/** Kortare än så är en tom sida. Den kortaste mätta, en 404, är 183 kB. */
export const MIN_KROPP = 2_000;

/**
 * Det som står på en spärrsida och aldrig på en produktsida. Mätt 2026-10-29:
 * ingen av orden finns på 36 riktiga sidor, varken produkter eller 404.
 */
const SPARRMARKORER = [
  /captcha/i,
  /\bchallenge-platform\b|\bcf-chl/i,
  /awswaf/i,
  /Just a moment\.\.\./,
  /Attention Required!/,
  /Access Denied/,
  /Request blocked/i,
  /Too Many Requests/i,
];

export type Blockering = "403" | "429" | "captcha" | "tom";

export type Svar =
  | { typ: "sida"; html: string }
  /** 404 eller 410: sidan finns inte. En signal, inget beslut — se lib/vevor/lasare.ts. */
  | { typ: "saknas"; status: number }
  /** En omdirigering. `till` är sökvägen när den pekar på en annan produktsida här. */
  | { typ: "omdirigerad"; till: string | null }
  | { typ: "blockerad"; skal: Blockering }
  /** Serverfel, nätfel, tidsgräns. Försöks igen senare, larmar inte. */
  | { typ: "tillfalligt"; skal: string };

/** Avgör vad ett svar betyder. Ren: status och kropp in, klass ut. */
export function klassaSvar(status: number, kropp: string, plats: string | null = null): Svar {
  if (status === 403) return { typ: "blockerad", skal: "403" };
  if (status === 429) return { typ: "blockerad", skal: "429" };
  if (status === 404 || status === 410) return { typ: "saknas", status };
  if (status >= 300 && status < 400) {
    const till = plats ? sokvagUr(new URL(plats, VEVOR_BAS).toString()) : null;
    return { typ: "omdirigerad", till: till && webbIdUr(till) ? till : null };
  }
  if (status >= 500) {
    // En spärr kan svara 503 med en utmaning. Då är det en spärr, inte ett serverfel.
    if (SPARRMARKORER.some((m) => m.test(kropp.slice(0, 20_000)))) return { typ: "blockerad", skal: "captcha" };
    return { typ: "tillfalligt", skal: `http ${status}` };
  }
  if (status !== 200) return { typ: "tillfalligt", skal: `http ${status}` };
  if (kropp.length < MIN_KROPP || !/<html/i.test(kropp)) return { typ: "blockerad", skal: "tom" };
  // En spärrsida har ingen produktdata. En riktig sida kan nämna vad som helst i
  // en recension, så markörerna räknas bara när produktdatan saknas.
  if (!/window\.PRODUCT_DATA\s*=/.test(kropp) && SPARRMARKORER.some((m) => m.test(kropp))) {
    return { typ: "blockerad", skal: "captcha" };
  }
  return { typ: "sida", html: kropp };
}

/**
 * Får sökvägen läsas? Bara produktsidor och sajtkartan. Aldrig /api/*, och
 * aldrig det robots.txt spärrar för alla (/products/, /collections/, /product/).
 */
export function tillatenSokvag(sokvag: string): boolean {
  if (!sokvag.startsWith("/")) return false;
  if (/^\/(api|products|collections|product|wp-admin|wp)\//i.test(sokvag)) return false;
  return webbIdUr(sokvag) !== null || /^\/sitemap\/sitemap[\w-]*\.xml(\.gz)?$/.test(sokvag);
}

export type Hamtare = (url: string, init: RequestInit) => Promise<Response>;

/**
 * Håller takten: väntar tills minst `MIN_MELLANRUM_MS` gått sedan förra
 * anropet började. Alla anrop till VEVOR i en körning går genom samma takt.
 */
export class Takt {
  private senast = Number.NEGATIVE_INFINITY;
  constructor(
    private readonly klocka: () => number = Date.now,
    private readonly vanta: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
  ) {}

  async invanta(): Promise<void> {
    const kvar = this.senast + MIN_MELLANRUM_MS - this.klocka();
    if (kvar > 0) await this.vanta(kvar);
    this.senast = this.klocka();
  }
}

async function lasKropp(res: Response): Promise<string> {
  const langd = Number(res.headers.get("content-length"));
  if (Number.isFinite(langd) && langd > MAX_KROPP) throw new Error("kroppen är för stor");
  const text = await res.text();
  if (text.length > MAX_KROPP) throw new Error("kroppen är för stor");
  return text;
}

/** Hämtar en sökväg på VEVOR:s EU-sajt, i takt, och klassar svaret. */
export async function hamta(
  sokvag: string,
  opts: { takt: Takt; hamtare?: Hamtare; fraga?: string },
): Promise<Svar> {
  if (!tillatenSokvag(sokvag)) throw new Error(`otillåten sökväg för VEVOR-läsaren`);
  await opts.takt.invanta();
  const hamtare = opts.hamtare ?? ((u, i) => fetch(u, i));
  let res: Response;
  try {
    res = await hamtare(`${VEVOR_BAS}${sokvag}${opts.fraga ?? ""}`, {
      method: "GET",
      redirect: "manual",
      headers: {
        "User-Agent": ANVANDARAGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "sv-SE,sv;q=0.9",
      },
      signal: AbortSignal.timeout(TIDSGRANS_MS),
    });
  } catch (e) {
    const namn = e instanceof Error ? e.name : "";
    return { typ: "tillfalligt", skal: namn === "TimeoutError" || namn === "AbortError" ? "tidsgräns" : "nätfel" };
  }
  try {
    return klassaSvar(res.status, await lasKropp(res), res.headers.get("location"));
  } catch {
    return { typ: "tillfalligt", skal: "kroppen gick inte att läsa" };
  }
}

/** Hämtar en binär fil (sajtkartans .gz) i takt. Svarar med byten, eller med ett svar som inte är en sida. */
export async function hamtaFil(
  sokvag: string,
  opts: { takt: Takt; hamtare?: Hamtare },
): Promise<{ typ: "fil"; data: Uint8Array } | Exclude<Svar, { typ: "sida" }>> {
  if (!tillatenSokvag(sokvag)) throw new Error(`otillåten sökväg för VEVOR-läsaren`);
  await opts.takt.invanta();
  const hamtare = opts.hamtare ?? ((u, i) => fetch(u, i));
  let res: Response;
  try {
    res = await hamtare(`${VEVOR_BAS}${sokvag}`, {
      method: "GET",
      redirect: "manual",
      headers: { "User-Agent": ANVANDARAGENT },
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    return { typ: "tillfalligt", skal: "nätfel" };
  }
  if (res.status !== 200) {
    const kropp = await res.text().catch(() => "");
    const k = klassaSvar(res.status, kropp, res.headers.get("location"));
    return k.typ === "sida" ? { typ: "tillfalligt", skal: `http ${res.status}` } : k;
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.length > 50_000_000) return { typ: "tillfalligt", skal: "filen är för stor" };
  return { typ: "fil", data: buf };
}
