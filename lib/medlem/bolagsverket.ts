// lib/medlem/bolagsverket.ts
//
// Bolagsverkets uppslag för företagskontot (E3-1, E3-3): API:t Värdefulla
// datamängder v1, öppen data utan avgift. Beskrivningen är hämtad ur
// Bolagsverkets utvecklarportal 2026-11-06 (OpenAPI 3.0.3,
// "VärdefullaDatamängder v1"):
//
//   token:   POST https://portal.api.bolagsverket.se/oauth2/token
//            client credentials, scope vardefulla-datamangder:read
//   uppslag: POST https://gw.api.bolagsverket.se/vardefulla-datamangder/v1/organisationer
//            { "identitetsbeteckning": "5560125790" }
//
// En enskild näringsidkare slås upp på personnumret med sekel (tolv siffror),
// och svaret kan då bära flera firmor (skilda åt av namnskyddslopnummer). Varje
// uppgift i svaret kan i stället bära `fel` när en källa inte svarade
// (OTILLGANGLIG_UPPGIFTSKALLA): då vet vi inte, och ansökan går till kön.
//
// Nycklarna är BOLAGSVERKET_CLIENT_ID och BOLAGSVERKET_CLIENT_SECRET (Leonard
// 2026-11-06, Production och Preview). Saknas de blir utfallet "fel", och
// ansökan går till kön som före uppslaget.
//
// ☠️ För en enskild firma är numret ägarens personnummer. Det skickas bara till
// Bolagsverket och skrivs aldrig i en logg; loggraderna bär bara utfallet.
//
// KASTAR ALDRIG. LÖVMODUL: bara typimporter, så att `node --test` kan ladda den.

import type { Orgform } from "./orgnr";

export const BV_TOKEN_URL = "https://portal.api.bolagsverket.se/oauth2/token";
export const BV_API = "https://gw.api.bolagsverket.se/vardefulla-datamangder/v1";
export const BV_SCOPE = "vardefulla-datamangder:read";

/** En ansökan ska inte vänta längre än så på Bolagsverket. */
const TIDSGRANS_MS = 6_000;

/** Varför ett hittat företag inte godkänns direkt. */
export type Orsak =
  /** Avregistrerat hos Bolagsverket. */
  | "avregistrerad"
  /** Pågående avveckling eller omstrukturering: konkurs, likvidation, rekonstruktion … */
  | "forfarande"
  /** SCB säger att företaget inte är verksamt. */
  | "ej-verksam"
  /** En källa svarade inte för namnet, avregistreringen eller förfarandena. */
  | "osaker";

export type Felorsak = "nycklar-saknas" | "token" | "natverk" | "status" | "svar";

export type Uppslag =
  | {
      utfall: "hittad";
      /** Registrerat företagsnamn. */
      namn: string;
      /** Organisationsform, till exempel { kod: "AB", text: "Aktiebolag" }. */
      formKod: string | null;
      formText: string | null;
      /** Inget som hindrar: inte avregistrerat, inget förfarande, verksamt, allt svarade. */
      aktiv: boolean;
      orsaker: Orsak[];
      /** Förfarandenas klartext ("Konkurs", "Likvidation" …) för admin. */
      forfaranden: string[];
    }
  | { utfall: "saknas" }
  | { utfall: "fel"; orsak: Felorsak };

export type Beroenden = {
  fetchImpl?: typeof fetch;
  klientId?: string | undefined;
  klientHemlighet?: string | undefined;
  nuMs?: number;
  /** Det namn kunden skrev: väljer rätt firma när ett personnummer har flera. */
  namnHint?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Numret
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Identitetsbeteckningen som Bolagsverket vill ha. En juridisk person: tio
 * siffror. En enskild firma: personnumret med sekel, räknat så att ägaren är
 * under hundra år (en äldre ägare hittas inte och går till kön).
 */
export function identitetsbeteckning(nummer: string, form: Orgform, nuMs = Date.now()): string | null {
  const tio = String(nummer ?? "").replace(/\D/g, "");
  if (!/^\d{10}$/.test(tio)) return null;
  if (form === "juridisk") return tio;
  const yy = Number(tio.slice(0, 2));
  const nuYY = new Date(nuMs).getUTCFullYear() % 100;
  return `${yy > nuYY ? 19 : 20}${tio}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Svaret
// ─────────────────────────────────────────────────────────────────────────────

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : null);
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
/** En uppgift som bär `fel` är okänd. */
const harFel = (v: unknown): boolean => Boolean(obj(v) && obj(obj(v)!.fel));

function namnUr(o: Obj): string | null {
  const lista = obj(o.organisationsnamn)?.organisationsnamnLista;
  if (!Array.isArray(lista)) return null;
  const namnen = lista.map(obj).filter((x): x is Obj => x !== null && str(x.namn) !== null);
  const huvud = namnen.find((x) => str(obj(x.organisationsnamntyp)?.kod) === "FORETAGSNAMN") ?? namnen[0];
  return huvud ? str(huvud.namn) : null;
}

function tolkaOrganisation(o: Obj): Extract<Uppslag, { utfall: "hittad" }> | null {
  const namn = namnUr(o);
  const orsaker: Orsak[] = [];
  const osaker = harFel(o.organisationsnamn) || harFel(o.avregistreradOrganisation) || harFel(o.pagaendeAvvecklingsEllerOmstruktureringsforfarande);

  const avreg = obj(o.avregistreradOrganisation);
  const avregDatum = avreg?.avregistreringsdatum;
  if (avregDatum !== null && avregDatum !== undefined && avregDatum !== "") orsaker.push("avregistrerad");

  const forf = obj(o.pagaendeAvvecklingsEllerOmstruktureringsforfarande)?.pagaendeAvvecklingsEllerOmstruktureringsforfarandeLista;
  const forfaranden = (Array.isArray(forf) ? forf : [])
    .map(obj)
    .filter((x): x is Obj => x !== null)
    .map((x) => str(x.klartext) ?? str(x.kod) ?? "okänt förfarande");
  if (forfaranden.length > 0) orsaker.push("forfarande");

  if (str(obj(o.verksamOrganisation)?.kod) === "NEJ") orsaker.push("ej-verksam");
  if (osaker || !namn) orsaker.push("osaker");

  // En post utan namn, identitet och form är inget företag.
  if (!namn && !obj(o.organisationsidentitet) && !obj(o.organisationsform)) return null;
  const form = obj(o.organisationsform);
  return {
    utfall: "hittad",
    namn: namn ?? "",
    formKod: str(form?.kod),
    formText: str(form?.klartext),
    aktiv: orsaker.length === 0,
    orsaker,
    forfaranden,
  };
}

const jamfor = (s: string) => s.toLocaleLowerCase("sv-SE").replace(/[^\p{L}\p{N}]/gu, "");

/**
 * Svaret från `POST /organisationer`. En enskild näringsidkare kan ha flera
 * firmor: den med kundens namn väljs först, annars en aktiv, annars den första.
 */
export function tolkaSvar(kropp: unknown, namnHint?: string): Uppslag {
  const lista = obj(kropp)?.organisationer;
  if (!Array.isArray(lista)) return { utfall: "fel", orsak: "svar" };
  const tolkade = lista
    .map(obj)
    .filter((x): x is Obj => x !== null)
    .map(tolkaOrganisation)
    .filter((x): x is Extract<Uppslag, { utfall: "hittad" }> => x !== null);
  if (tolkade.length === 0) return { utfall: "saknas" };
  const hint = namnHint ? jamfor(namnHint) : "";
  return (
    (hint ? tolkade.find((t) => t.namn && jamfor(t.namn) === hint) : undefined) ??
    tolkade.find((t) => t.aktiv) ??
    tolkade[0]
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Anropen
// ─────────────────────────────────────────────────────────────────────────────

let token: { varde: string; tillMs: number } | null = null;

/** Glöm token (prov, och efter ett 401 från Bolagsverket). */
export function glomBolagsverketToken(): void {
  token = null;
}

async function hamtaToken(d: Required<Pick<Beroenden, "fetchImpl" | "nuMs">> & Beroenden): Promise<string | Felorsak> {
  if (token && d.nuMs < token.tillMs) return token.varde;
  if (!d.klientId || !d.klientHemlighet) return "nycklar-saknas";
  try {
    const svar = await d.fetchImpl(BV_TOKEN_URL, {
      method: "POST",
      headers: {
        authorization: `Basic ${btoa(`${d.klientId}:${d.klientHemlighet}`)}`,
        "content-type": "application/x-www-form-urlencoded",
        accept: "application/json",
      },
      body: `grant_type=client_credentials&scope=${encodeURIComponent(BV_SCOPE)}`,
      cache: "no-store",
      signal: AbortSignal.timeout(TIDSGRANS_MS),
    });
    if (!svar.ok) {
      console.warn(`[bolagsverket] token svarade ${svar.status}`);
      return "token";
    }
    const k = obj(await svar.json());
    const varde = str(k?.access_token);
    if (!varde) return "token";
    const sek = Number(k?.expires_in);
    // En minut före utgången hämtas en ny; högst en timme åt gången.
    const giltigSek = Number.isFinite(sek) && sek > 120 ? Math.min(sek, 3600) - 60 : 60;
    token = { varde, tillMs: d.nuMs + giltigSek * 1000 };
    return varde;
  } catch {
    console.warn("[bolagsverket] token gick inte att hämta");
    return "natverk";
  }
}

/**
 * Slår upp ett företag. Numret är "NNNNNN-NNNN" ur orgnr.ts. Svarar alltid:
 * "hittad", "saknas" eller "fel" med orsaken.
 */
export async function slaUppForetag(nummer: string, form: Orgform, beroenden: Beroenden = {}): Promise<Uppslag> {
  const d = {
    ...beroenden,
    fetchImpl: beroenden.fetchImpl ?? fetch,
    nuMs: beroenden.nuMs ?? Date.now(),
    klientId: "klientId" in beroenden ? beroenden.klientId : process.env.BOLAGSVERKET_CLIENT_ID?.trim(),
    klientHemlighet: "klientHemlighet" in beroenden ? beroenden.klientHemlighet : process.env.BOLAGSVERKET_CLIENT_SECRET?.trim(),
  };
  const id = identitetsbeteckning(nummer, form, d.nuMs);
  if (!id) return { utfall: "fel", orsak: "svar" };

  for (let forsok = 0; forsok < 2; forsok++) {
    const t = await hamtaToken(d);
    if (t === "nycklar-saknas" || t === "token" || t === "natverk") return { utfall: "fel", orsak: t };
    let svar: Response;
    try {
      svar = await d.fetchImpl(`${BV_API}/organisationer`, {
        method: "POST",
        headers: { authorization: `Bearer ${t}`, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ identitetsbeteckning: id }),
        cache: "no-store",
        signal: AbortSignal.timeout(TIDSGRANS_MS),
      });
    } catch {
      console.warn("[bolagsverket] uppslaget gick inte att nå");
      return { utfall: "fel", orsak: "natverk" };
    }
    // Token kan ha dragits tillbaka före sin tid: en ny, en gång.
    if (svar.status === 401 && forsok === 0) {
      glomBolagsverketToken();
      continue;
    }
    if (svar.status === 404) return { utfall: "saknas" };
    if (!svar.ok) {
      console.warn(`[bolagsverket] uppslaget svarade ${svar.status}`);
      return { utfall: "fel", orsak: "status" };
    }
    try {
      return tolkaSvar(await svar.json(), d.namnHint);
    } catch {
      return { utfall: "fel", orsak: "svar" };
    }
  }
  return { utfall: "fel", orsak: "token" };
}

// ─────────────────────────────────────────────────────────────────────────────
// Beslutet
// ─────────────────────────────────────────────────────────────────────────────

/** Det som sparas på profilen och visas i adminens kö. */
export interface Bolagsverkskontroll {
  utfall: Uppslag["utfall"];
  /** Registrerat namn när företaget hittades. */
  namn?: string;
  form?: string;
  orsaker: string[];
  kontrollerad: string;
}

/**
 * Leonards regel 2026-11-06 (F4 och "kör allt"): ett företag som Bolagsverket
 * visar som aktivt godkänns direkt, med det registrerade namnet. Allt annat
 * (avregistrerat, förfarande, inte verksamt, osäkert svar, saknas eller fel)
 * går till kön i motorns admin med orsaken.
 */
export function beslutForAnsokan(u: Uppslag, nuMs = Date.now()): { status: "aktiv" | "granskas"; kontroll: Bolagsverkskontroll } {
  const kontrollerad = new Date(nuMs).toISOString();
  if (u.utfall === "hittad") {
    const kontroll: Bolagsverkskontroll = {
      utfall: "hittad",
      ...(u.namn ? { namn: u.namn } : {}),
      ...((u.formText ?? u.formKod) ? { form: (u.formText ?? u.formKod) as string } : {}),
      orsaker: [...u.orsaker, ...u.forfaranden.map((f) => `förfarande: ${f}`)],
      kontrollerad,
    };
    return { status: u.aktiv && u.namn ? "aktiv" : "granskas", kontroll };
  }
  if (u.utfall === "saknas") return { status: "granskas", kontroll: { utfall: "saknas", orsaker: ["finns inte hos Bolagsverket"], kontrollerad } };
  return { status: "granskas", kontroll: { utfall: "fel", orsaker: [`uppslaget föll: ${u.orsak}`], kontrollerad } };
}
