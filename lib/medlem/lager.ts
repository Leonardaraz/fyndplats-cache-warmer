// lib/medlem/lager.ts
//
// Medlemmarnas tabeller i Wix CMS (Leonards beslut A4, 2026-11-04: Wix, inte
// Postgres). Samma klient och regler som butikens övriga tabeller
// (lib/wix-lager.ts): inga null-fält, `_id` ur `wixNyckel` eller en hash,
// anspråk som inserts som vägrar ett id som finns.
//
// Kollektionerna skapas med behörigheten ADMIN och index på det som filtreras
// och sorteras (se butikens CLAUDE.md, "Medlemskapet"). Ingen besökare läser
// dem direkt; allt går genom butikens server.
//
// ☠️ Inga transaktioner i Wix. Varje skrivning här är idempotent på sitt id:
// orderliggaren på Wix order-id, medlemmen på e-postens hash, inloggningen på
// tokenens hash. En upprepad webhook skriver samma rad igen.

import { randomUUID } from "node:crypto";
import {
  K,
  allaRader,
  andringar,
  fraga,
  hamta,
  infoga,
  patcha,
  rakna,
  satt,
  spara,
  sparaManga,
  taBortFalt,
  taBortManga,
  type Rad,
} from "@/lib/wix-lager";
import { liggarradUrWix, type Liggarrad } from "./orderliggare";
import { liggarradArKop } from "../order-raknas";
import { REGLER_V1, reglerFel, type Regler, type Varning } from "./niva";
import { medlemsId, taForsok } from "./inloggning";
import { VILLKOR_FORETAG_VERSION, foretagsprofilId, foretagsprofilUrRad, type Foretagsansokan, type Foretagsprofil } from "./foretag";

export const MK = {
  medlemmar: "FyndplatsMedlemmar",
  profiler: "FyndplatsMedlemsprofiler",
  inloggningar: "FyndplatsInloggningar",
  orderliggare: "FyndplatsOrderliggare",
  nivaer: "FyndplatsMedlemsnivaer",
  regler: "FyndplatsMedlemsregler",
  logg: "FyndplatsMedlemslogg",
  /** E2: ett beslut per låst varukorg, sparat i sju år [D1]. */
  prisbeslut: "FyndplatsPrisbeslut",
} as const;

const nu = () => new Date().toISOString();
const text = (v: unknown): string | undefined => (typeof v === "string" && v ? v : undefined);

// ─────────────────────────────────────────────────────────────────────────────
// Växeln: av, tyst eller på
// ─────────────────────────────────────────────────────────────────────────────

/**
 * av:   ingen kan logga in; orderliggaren fylls ändå.
 * tyst: /konto fungerar för den som har adressen; ingen länk dit.
 * pa:   som tyst, och tacksidan erbjuder konto.
 *
 * En rad i Wix (`FyndplatsButikInstallningar/medlemskap`, fältet `lage`), så
 * att påslaget inte kostar ett bygge. Saknas raden är det av.
 */
export type Lage = "av" | "tyst" | "pa";
export const LAGE_ID = "medlemskap";
let lageCache: { lage: Lage; at: number } | null = null;

export async function medlemsLage(nuMs = Date.now()): Promise<Lage> {
  if (lageCache && nuMs - lageCache.at < 60_000) return lageCache.lage;
  try {
    const rad = await hamta(K.installningar, LAGE_ID);
    const v = rad?.lage;
    const lage: Lage = v === "pa" || v === "tyst" ? v : "av";
    lageCache = { lage, at: nuMs };
    return lage;
  } catch (e) {
    console.error("[medlem] kunde inte läsa växeln:", e instanceof Error ? e.message.slice(0, 120) : e);
    const forra = lageCache?.lage ?? "av";
    lageCache = { lage: forra, at: nuMs - 50_000 };
    return forra;
  }
}

/**
 * Medlemspriset (E2) har en egen växel i samma rad, fältet `pris`:
 *
 * av:   ingen får medlemspris. Förvalt, och läget när fältet saknas.
 * test: bara medlemmar med `testare: true` på sin rad, för prov i produktion.
 * pa:   alla inloggade medlemmar.
 *
 * Skild från `lage`, så att Mina sidor kan vara öppna utan medlemspris, och
 * medlemspriset kan stängas av utan att någon loggas ut. Aldrig `pa` under
 * Black Week 23–29/11 (planen).
 *
 * Kan raden inte läsas gäller förra läget en kort stund, och sedan `av`.
 */
export type Prislage = "av" | "test" | "pa";
let prisCache: { lage: Prislage; at: number } | null = null;

/** Medlemspris och företagskonto: för alla i läget `pa`, bara för testare i läget `test`. */
export function prisOppet(lage: Prislage, medlem: { testare?: boolean }): boolean {
  return lage === "pa" || (lage === "test" && medlem.testare === true);
}

export async function prisLage(nuMs = Date.now()): Promise<Prislage> {
  if (prisCache && nuMs - prisCache.at < 60_000) return prisCache.lage;
  try {
    const rad = await hamta(K.installningar, LAGE_ID);
    const v = rad?.pris;
    const lage: Prislage = v === "pa" || v === "test" ? v : "av";
    prisCache = { lage, at: nuMs };
    return lage;
  } catch (e) {
    console.error("[medlem] kunde inte läsa prisväxeln:", e instanceof Error ? e.message.slice(0, 120) : e);
    const forra = prisCache && nuMs - prisCache.at < 10 * 60_000 ? prisCache.lage : "av";
    prisCache = { lage: forra, at: nuMs - 50_000 };
    return forra;
  }
}

/** Hemligheten, eller null: utan den är inloggningen stängd. */
export function medlemsHemlighet(): string | null {
  const h = (process.env.MEDLEM_JWT_SECRET || "").trim();
  return h.length >= 32 ? h : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Reglerna
// ─────────────────────────────────────────────────────────────────────────────

let reglerCache: { regler: Regler; at: number } | null = null;

/**
 * Den senaste giltiga versionen i `FyndplatsMedlemsregler` (fältet `json`,
 * `giltigFran` ISO). Saknas den eller är den trasig gäller version 1 i koden,
 * som är specens beslutade tabell.
 */
export async function aktuellaRegler(nuMs = Date.now()): Promise<Regler> {
  if (reglerCache && nuMs - reglerCache.at < 5 * 60_000) return reglerCache.regler;
  let regler = REGLER_V1;
  try {
    const [rad] = await fraga(MK.regler, {
      filter: { giltigFran: { $lte: new Date(nuMs).toISOString() } },
      sort: [{ fieldName: "giltigFran", order: "DESC" }],
      limit: 1,
    });
    const kandidat = rad?.json as Regler | undefined;
    if (kandidat && !reglerFel(kandidat)) regler = kandidat;
    else if (rad) console.error(`[medlem] regelraden är trasig (${reglerFel(kandidat)}) — version 1 gäller`);
  } catch (e) {
    console.error("[medlem] kunde inte läsa reglerna — version 1 gäller:", e instanceof Error ? e.message.slice(0, 120) : e);
  }
  reglerCache = { regler, at: nuMs };
  return regler;
}

// ─────────────────────────────────────────────────────────────────────────────
// Medlemmarna
// ─────────────────────────────────────────────────────────────────────────────

export interface Medlem {
  id: string;
  epost: string;
  status: "aktiv" | "sparrad";
  skapad: string;
  senastInloggad?: string;
  valkomstSkickad?: string;
  /** Senaste nivå som mejlats (eller gällde vid registreringen). */
  meddeladNiva?: string;
  varnadFor?: Varning;
  /** Senast räknade läget, av nattjobbet. */
  kOre?: number;
  niva?: string;
  beraknad?: string;
  /** Satt för hand i motorns admin, med orsak i loggen. */
  manuellNiva?: string;
  manuellTill?: string;
  /** false: medlemmen har avregistrerat sig från mejlen om nivån. Saknas: mejlen går. */
  nivamejl?: false;
  /** Får medlemspris redan i prisväxelns läge `test`. */
  testare?: boolean;
}

function medlemUrRad(d: Rad): Medlem {
  const v = d.varnadFor as Varning | undefined;
  return {
    id: String(d._id),
    epost: String(d.epost ?? ""),
    status: d.status === "sparrad" ? "sparrad" : "aktiv",
    skapad: String(d.skapad ?? ""),
    senastInloggad: text(d.senastInloggad),
    valkomstSkickad: text(d.valkomstSkickad),
    meddeladNiva: text(d.meddeladNiva),
    varnadFor: v && typeof v.fran === "string" && typeof v.datum === "string" ? { fran: v.fran, datum: v.datum } : undefined,
    kOre: typeof d.kOre === "number" ? d.kOre : undefined,
    niva: text(d.niva),
    beraknad: text(d.beraknad),
    manuellNiva: text(d.manuellNiva),
    manuellTill: text(d.manuellTill),
    nivamejl: d.nivamejl === false ? false : undefined,
    ...(d.testare === true ? { testare: true } : {}),
  };
}

export async function hamtaMedlem(id: string): Promise<Medlem | null> {
  const d = await hamta(MK.medlemmar, id);
  return d ? medlemUrRad(d) : null;
}

/**
 * Skapar kontot vid första inloggningen. `ny` bara för den som skapade raden,
 * så välkomstmejlet skickas en gång även om två inloggningar möts.
 */
export async function skapaMedlem(epost: string, meddeladNiva: string): Promise<{ medlem: Medlem; ny: boolean }> {
  const id = medlemsId(epost);
  const tid = nu();
  const utfall = await infoga(MK.medlemmar, id, { epost, status: "aktiv", skapad: tid, meddeladNiva });
  if (utfall === "skapad") {
    await infoga(MK.profiler, `${id}__privat`, { medlemsId: id, typ: "privat", status: "aktiv", aktiv: true, skapad: tid });
    await logga({ omrade: "konto", typ: "registrerad", medlemsId: id, aktor: "kund" });
  }
  const medlem = await hamtaMedlem(id);
  if (!medlem) throw new Error("medlemmen gick inte att läsa tillbaka");
  return { medlem, ny: utfall === "skapad" };
}

export async function uppdateraMedlem(id: string, falt: Rad): Promise<void> {
  await patcha(MK.medlemmar, id, andringar(falt));
}

/**
 * Mejlen om nivån av eller på. Av sparas som `nivamejl: false`; på tar bort
 * fältet, så att en medlem utan fältet får mejlen. "saknas": ingen sådan medlem.
 */
export async function sattNivamejl(id: string, pa: boolean): Promise<"klar" | "saknas"> {
  const r = await patcha(MK.medlemmar, id, andringar({ nivamejl: pa ? undefined : false }));
  return r.utfall === "not-found" ? "saknas" : "klar";
}

export async function allaMedlemmar(): Promise<Medlem[]> {
  return (await allaRader(MK.medlemmar)).map(medlemUrRad);
}

// ─────────────────────────────────────────────────────────────────────────────
// Företagsprofilen (E3)
// ─────────────────────────────────────────────────────────────────────────────

/** Kontots företagsprofil (`<medlemsId>__foretag`), eller null. */
export async function hamtaForetagsprofil(id: string): Promise<Foretagsprofil | null> {
  return foretagsprofilUrRad(await hamta(MK.profiler, foretagsprofilId(id)));
}

/**
 * Sparar en ansökan med status "granskas". En nekad ansökan får skickas igen
 * och skrivs då över (villkoret: fortfarande nekad). En profil som granskas
 * eller är godkänd ändras inte här: svaret är "finns".
 *
 * ☠️ Numret loggas aldrig: för en enskild firma är det ett personnummer.
 */
export async function sparaForetagsansokan(id: string, a: Foretagsansokan): Promise<"skapad" | "finns"> {
  const pid = foretagsprofilId(id);
  const tid = nu();
  const rad: Rad = { medlemsId: id, typ: "foretag", status: "granskas", aktiv: false, ...a, villkorGodkant: tid, ansokt: tid, skapad: tid };
  let utfall: "skapad" | "finns" = (await infoga(MK.profiler, pid, rad)) === "skapad" ? "skapad" : "finns";
  if (utfall === "finns") {
    const ny = { ...rad, leverans: a.leverans ?? null, beslutad: null, godkandMejlad: null };
    const p = await patcha(MK.profiler, pid, andringar(ny), { status: "nekad" });
    if (p.utfall === "applied") utfall = "skapad";
  }
  if (utfall === "skapad") await logga({ omrade: "foretag", typ: "ansokan", medlemsId: id, aktor: "kund", efter: { form: a.form } });
  return utfall;
}

/** Den gällande villkorsversionen godkänd på en godkänd profil (E3-12). */
export async function godkannForetagsvillkor(id: string): Promise<boolean> {
  const tid = nu();
  const p = await patcha(MK.profiler, foretagsprofilId(id), [satt("villkorVersion", VILLKOR_FORETAG_VERSION), satt("villkorGodkant", tid)], {
    status: "aktiv",
  });
  if (p.utfall !== "applied") return false;
  await logga({ omrade: "foretag", typ: "villkor", medlemsId: id, aktor: "kund", efter: { version: VILLKOR_FORETAG_VERSION } });
  return true;
}

/** Godkända företag vars kund inte har fått mejlet om det än (timjobbet). */
export async function foretagAttMejla(limit: number): Promise<Foretagsprofil[]> {
  const rader = await fraga(MK.profiler, {
    filter: { $and: [{ typ: "foretag" }, { status: "aktiv" }, { godkandMejlad: { $exists: false } }] },
    limit,
  });
  return rader.map(foretagsprofilUrRad).filter((p): p is Foretagsprofil => p !== null);
}

/** Mejlet om godkännandet är skickat; skrivs bara en gång. */
export async function markeraGodkandMejlad(id: string): Promise<boolean> {
  const p = await patcha(MK.profiler, foretagsprofilId(id), [satt("godkandMejlad", nu())], { godkandMejlad: { $exists: false } });
  return p.utfall === "applied";
}

/** Märket bort efter ett mejl som inte gick iväg, så att nästa körning försöker igen. */
export async function avmarkeraGodkandMejlad(id: string): Promise<void> {
  await patcha(MK.profiler, foretagsprofilId(id), [taBortFalt("godkandMejlad")]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Inloggningarna
// ─────────────────────────────────────────────────────────────────────────────

export interface Inloggning {
  id: string;
  epost: string;
  skapad: string;
  giltigTill: string;
  kodHash: string;
  forsok: number;
  anvand?: string;
  ipHash?: string;
  /** Ordern från tacksidan, som läses in direkt efter inloggningen. */
  order?: string;
  mal?: string;
}

function inloggningUrRad(d: Rad): Inloggning {
  return {
    id: String(d._id),
    epost: String(d.epost ?? ""),
    skapad: String(d.skapad ?? ""),
    giltigTill: String(d.giltigTill ?? ""),
    kodHash: String(d.kodHash ?? ""),
    forsok: Number(d.forsok) || 0,
    anvand: text(d.anvand),
    ipHash: text(d.ipHash),
    order: text(d.order),
    mal: text(d.mal),
  };
}

export async function sparaInloggning(r: Omit<Inloggning, "forsok" | "anvand">): Promise<void> {
  const { id, ...data } = r;
  const utfall = await infoga(MK.inloggningar, id, { ...data, forsok: 0 });
  if (utfall !== "skapad") throw new Error("inloggningens id fanns redan");
}

export async function hamtaInloggning(id: string): Promise<Inloggning | null> {
  const d = await hamta(MK.inloggningar, id);
  return d ? inloggningUrRad(d) : null;
}

/** Den senaste koden till e-posten som ännu inte gått ut. */
export async function senasteInloggning(epost: string, nuIso: string): Promise<Inloggning | null> {
  const [d] = await fraga(MK.inloggningar, {
    filter: { epost, giltigTill: { $gt: nuIso } },
    sort: [{ fieldName: "skapad", order: "DESC" }],
    limit: 1,
  });
  return d ? inloggningUrRad(d) : null;
}

export async function forfragningarSedan(falt: "epost" | "ipHash", varde: string, sedanIso: string): Promise<number> {
  return rakna(MK.inloggningar, { [falt]: varde, skapad: { $gt: sedanIso } });
}

export async function senastSkapad(epost: string): Promise<string | null> {
  const [d] = await fraga(MK.inloggningar, { filter: { epost }, sort: [{ fieldName: "skapad", order: "DESC" }], limit: 1 });
  return text(d?.skapad) ?? null;
}

/** Tar inloggningen i anspråk. Falskt om någon annan hann först. */
export async function markeraAnvand(id: string): Promise<boolean> {
  const r = await patcha(MK.inloggningar, id, [satt("anvand", nu())], { anvand: { $exists: false } });
  return r.utfall === "applied";
}

/**
 * Tar ett kodförsök i anspråk innan koden prövas (lib/medlem/inloggning.ts,
 * `taForsok`). Villkorad skrivning på räknarens värde: av samtidiga anrop
 * vinner bara ett per steg, så högst fem koder prövas per inloggning.
 */
export function taForsokPaInloggning(id: string): Promise<"ok" | "slut" | "saknas"> {
  return taForsok(
    async () => (await hamtaInloggning(id))?.forsok ?? null,
    async (fore) => (await patcha(MK.inloggningar, id, [satt("forsok", fore + 1)], { forsok: fore })).utfall === "applied",
  );
}

/**
 * Strypningen per e-post: en rad per trettiosekundersfönster, skapad med en
 * insert som vägrar ett id som finns. Falskt om fönstret redan är taget.
 * Raden bär ingen e-post (räknarna filtrerar på `epost`) och gallras med
 * inloggningarna efter 30 dagar.
 */
export async function taStrypning(id: string, nuIso: string): Promise<boolean> {
  return (await infoga(MK.inloggningar, id, { typ: "strypning", skapad: nuIso })) === "skapad";
}

/** Gallringen: inloggningsförsök äldre än `fore` tas bort (integritetstexten, 30 dagar). */
export async function gallraInloggningar(foreIso: string): Promise<{ borttagna: number; fel: number }> {
  let borttagna = 0;
  let fel = 0;
  for (let varv = 0; varv < 10; varv++) {
    const rader = await fraga(MK.inloggningar, { filter: { skapad: { $lt: foreIso } }, limit: 1000 });
    if (!rader.length) break;
    const u = await taBortManga(MK.inloggningar, rader.map((r) => String(r._id)));
    borttagna += u.borttagna;
    fel += u.fel.length;
    if (u.borttagna === 0) break;
  }
  return { borttagna, fel };
}

// ─────────────────────────────────────────────────────────────────────────────
// Orderliggaren
// ─────────────────────────────────────────────────────────────────────────────

export type Kalla = "webhook" | "avstamning" | "bakat" | "inloggning";

function liggarData(rad: Liggarrad, kalla: Kalla): Rad {
  return { ...rad, kalla, uppdaterad: nu() } as unknown as Rad;
}

export async function hamtaLiggarrad(orderId: string): Promise<Liggarrad | null> {
  const d = await hamta(MK.orderliggare, orderId);
  return d ? liggarradUrWix(d) : null;
}

export async function sparaLiggarrad(rad: Liggarrad, kalla: Kalla): Promise<void> {
  await spara(MK.orderliggare, rad.orderId, liggarData(rad, kalla));
}

export async function sparaLiggarrader(rader: Liggarrad[], kalla: Kalla): Promise<{ sparade: number; fel: number }> {
  if (!rader.length) return { sparade: 0, fel: 0 };
  const u = await sparaManga(MK.orderliggare, rader.map((r) => ({ id: r.orderId, data: liggarData(r, kalla) })));
  return { sparade: u.sparade, fel: u.fel.length };
}

/** Raderna för de givna orderna, i en fråga per hundra. */
export async function liggarraderFor(orderIdn: string[]): Promise<Map<string, Liggarrad>> {
  const ut = new Map<string, Liggarrad>();
  for (let i = 0; i < orderIdn.length; i += 100) {
    const del = orderIdn.slice(i, i + 100);
    for (const d of await fraga(MK.orderliggare, { filter: { _id: { $in: del } }, limit: 100 })) {
      const r = liggarradUrWix(d);
      ut.set(r.orderId, r);
    }
  }
  return ut;
}

/**
 * E-postens rader som är köp. Obetalda och avbrutna försök ur vår kassa
 * (lib/order-raknas.ts) visas aldrig på Mina sidor, inte heller de som skrevs
 * innan liggaren började hoppa över dem (2026-11-06).
 */
export async function liggarraderForEpost(epost: string): Promise<Liggarrad[]> {
  return (await allaRader(MK.orderliggare, { filter: { epost } })).map(liggarradUrWix).filter(liggarradArKop);
}

/** Alla rader betalda efter `sedanIso`: underlaget för nattens nivåer. */
export async function liggarraderBetaldaSedan(sedanIso: string): Promise<Liggarrad[]> {
  return (await allaRader(MK.orderliggare, { filter: { betald: { $gt: sedanIso } } })).map(liggarradUrWix);
}

// ─────────────────────────────────────────────────────────────────────────────
// Liggarens tillstånd: bakåtläsningen och avstämningen
// ─────────────────────────────────────────────────────────────────────────────

export const LIGGARE_ID = "medlemsliggare";

export interface Liggarlage {
  /** När liggaren började fyllas: ordrar ändrade före det är inte avvikelser. */
  startad?: string;
  bakatKlar?: boolean;
  /** `createdDate` för den senast bakåtlästa ordern. */
  bakatPosition?: string;
  senastAvstamd?: string;
}

export async function liggarlage(): Promise<Liggarlage> {
  const d = await hamta(K.installningar, LIGGARE_ID);
  return {
    startad: text(d?.startad),
    bakatKlar: d?.bakatKlar === true,
    bakatPosition: text(d?.bakatPosition),
    senastAvstamd: text(d?.senastAvstamd),
  };
}

export async function sparaLiggarlage(l: Liggarlage): Promise<void> {
  const forra = (await hamta(K.installningar, LIGGARE_ID)) ?? {};
  await spara(K.installningar, LIGGARE_ID, { ...forra, ...l });
}

// ─────────────────────────────────────────────────────────────────────────────
// Nivåbytena och loggen
// ─────────────────────────────────────────────────────────────────────────────

/** En rad per medlem och dag då nivån ändrades. */
export async function sparaNivabyte(v: { medlemsId: string; datum: string; fran: string | null; till: string; kOre: number }): Promise<void> {
  await spara(MK.nivaer, `${v.medlemsId}__${v.datum}`, { ...v, fran: v.fran ?? "", tid: nu() });
}

export interface Logghandelse {
  omrade: "konto" | "niva" | "avstamning" | "admin" | "mejl" | "foretag" | "offert";
  typ: string;
  aktor: "kund" | "system" | "admin";
  medlemsId?: string;
  orderId?: string;
  fore?: Rad;
  efter?: Rad;
  orsakKod?: string;
  orsakText?: string;
  falt?: string[];
}

/** Loggen är bara tillägg: varje händelse får ett nytt id. */
export async function logga(h: Logghandelse): Promise<void> {
  const tid = nu();
  await infoga(MK.logg, `l_${tid.replace(/[^0-9]/g, "")}_${randomUUID().slice(0, 8)}`, { ...h, tid } as unknown as Rad);
}

/** Best effort: en logg som inte skrivs får aldrig fälla det den beskriver. */
export async function loggaTyst(h: Logghandelse): Promise<void> {
  try {
    await logga(h);
  } catch (e) {
    console.error(`[medlem] loggen kunde inte skrivas (${h.omrade}/${h.typ}):`, e instanceof Error ? e.message.slice(0, 120) : e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Prisbeslutsloggen (E2-9)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ett prisbeslut per låst varukorg, nycklat på korgens id. `purchaseFlowId`
 * paras med ordern när webhooken kommer, så att beslutet kan slås upp på
 * ordernummer i admin. Sparas i sju år [D1]: det är underlag för priset kunden
 * betalade. ☠️ Raden bär kostnaden; kollektionen har behörigheten ADMIN och
 * läses bara av butikens och motorns server.
 */
export interface Prisbeslutspost {
  cartId: string;
  purchaseFlowId: string;
  medlemsId: string;
  profil: string;
  /** E3: företagets namn när korgen prissattes som företag (till kvittot). */
  foretagNamn?: string;
  niva: string;
  procent: number;
  kalla: string;
  basOreExMoms: number;
  summaAOre: number;
  summaPOre: number;
  rabattOre: number;
  friFraktSkydd: boolean;
  rader: {
    produktId: string;
    variantId?: string;
    antal: number;
    aOre: number;
    kostnadOre?: number;
    golvOre?: number;
    procent: number;
    pOre: number;
    begransning: string;
    undantag?: string;
  }[];
  skapad: string;
}

export async function sparaPrisbeslut(post: Prisbeslutspost): Promise<void> {
  // Inga null-fält i Wix: valfria fält utelämnas i stället.
  const rader = post.rader.map((r) => Object.fromEntries(Object.entries(r).filter(([, v]) => v !== undefined && v !== null)));
  await spara(MK.prisbeslut, post.cartId, { ...post, rader } as unknown as Rad);
}

/**
 * Är varukorgen en medlemskorg med låsta priser? Bara en sådan har ett
 * prisbeslut. Mejlen om övergiven kassa hoppar över den: länken pekar på en
 * kassa som tas bort efter ett dygn, och kupongen är låst i den.
 */
export async function harPrisbeslut(cartId: string): Promise<boolean> {
  if (!cartId) return false;
  return (await hamta(MK.prisbeslut, cartId)) !== null;
}

/** Beslut vars låsta korg ännu saknar utfall, skapade mellan `efter` och `fore` (ISO), äldst först. */
export async function prisbeslutUtanUtfall(
  efter: string,
  fore: string,
  limit: number,
): Promise<{ cartId: string; purchaseFlowId: string }[]> {
  const rader = await fraga(MK.prisbeslut, {
    filter: { $and: [{ skapad: { $gte: efter } }, { skapad: { $lte: fore } }, { utfall: { $exists: false } }] },
    sort: [{ fieldName: "skapad", order: "ASC" }],
    limit,
  });
  return rader.map((r) => ({ cartId: text(r.cartId) ?? "", purchaseFlowId: text(r.purchaseFlowId) ?? "" }));
}

/** Finns en order med köpflödets id i orderliggaren? */
export async function orderMedKopflode(purchaseFlowId: string): Promise<boolean> {
  if (!purchaseFlowId) return false;
  return (await fraga(MK.orderliggare, { filter: { purchaseFlowId }, limit: 1 })).length > 0;
}

/** Utfallet för en låst korg; skrivs bara en gång (villkoret: inget utfall än). */
export async function sattKorgutfall(cartId: string, utfall: "kopt" | "borttagen" | "saknades"): Promise<void> {
  await patcha(MK.prisbeslut, cartId, [satt("utfall", utfall), satt("utfallTid", nu())], { utfall: { $exists: false } });
}
