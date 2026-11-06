// lib/medlem/offert.ts
//
// Offerten för företag (E3-9, E3-10, F7). Ett företagskonto begär en offert
// från varukorgen när korgen har minst 6 exemplar av samma vara eller en
// rabattberättigad bas från 20 000 kr exkl. moms (prismotorns `offert`).
// Admin sätter styckpriser i motorn, aldrig under golvet och aldrig över
// listpriset; offerten gäller i 14 dagar. Företaget öppnar den på
// /offert/<id> och betalar i Wix-kassan i en låst korg med offertens priser.
// Offertens priser ersätter ordertrappan för raderna.
//
// Status: skickad → prissatt → accepterad (kassan öppnad) → betald, eller
// avböjd av admin, eller utgången när giltighetstiden passerat utan betalning.
//
// Ren modul utan lokala imports.

export const OFFERT_GILTIG_DAGAR = 14;
/** Högst så många obesvarade förfrågningar per konto, mot spam. */
export const MAX_OBESVARADE = 3;
export const MEDDELANDE_MAX = 1000;

export type Offertstatus = "skickad" | "prissatt" | "accepterad" | "betald" | "utgangen" | "avbojd";

const STATUSAR: readonly Offertstatus[] = ["skickad", "prissatt", "accepterad", "betald", "utgangen", "avbojd"];

export interface Offertrad {
  produktId: string;
  variantId?: string;
  appId: string;
  namn: string;
  antal: number;
  /** Listpriset per styck inkl. moms när förfrågan skickades, i öre. */
  aOre: number;
  /** Offertens styckpris inkl. moms, i öre. Satt av admin. */
  offertOre?: number;
}

export interface Offert {
  id: string;
  medlemsId: string;
  foretagNamn: string;
  status: Offertstatus;
  rader: Offertrad[];
  meddelande?: string;
  skapad: string;
  prissatt?: string;
  giltigTill?: string;
  accepterad?: string;
  betald?: string;
  /** Mejlet "Offerten är klar" är skickat. */
  meddelad?: string;
}

/** "o_" och tolv hexsiffror ur slumpen. */
export function offertId(slumpHex: string): string {
  const h = slumpHex.toLowerCase().replace(/[^0-9a-f]/g, "");
  if (h.length < 12) throw new Error("för lite slump till offertens id");
  return `o_${h.slice(0, 12)}`;
}

export function arOffertId(v: unknown): v is string {
  return typeof v === "string" && /^o_[0-9a-f]{12}$/.test(v);
}

const text = (v: unknown): string | undefined => (typeof v === "string" && v ? v : undefined);
const heltal = (v: unknown): number | undefined => (typeof v === "number" && Number.isSafeInteger(v) && v >= 0 ? v : undefined);

function radUr(v: unknown): Offertrad | null {
  if (!v || typeof v !== "object") return null;
  const r = v as Record<string, unknown>;
  const produktId = text(r.produktId);
  const appId = text(r.appId);
  const antal = heltal(r.antal);
  const aOre = heltal(r.aOre);
  if (!produktId || !appId || !antal || aOre === undefined) return null;
  const offertOre = heltal(r.offertOre);
  return {
    produktId,
    ...(text(r.variantId) ? { variantId: text(r.variantId) } : {}),
    appId,
    namn: text(r.namn) ?? "Vara",
    antal,
    aOre,
    ...(offertOre !== undefined ? { offertOre } : {}),
  };
}

/** Offerten ur en rad i `FyndplatsOfferter`, eller null om raden är trasig. */
export function offertUrRad(d: Record<string, unknown> | null | undefined): Offert | null {
  if (!d) return null;
  const id = text(d._id);
  const medlemsId = text(d.medlemsId);
  const status = STATUSAR.find((s) => s === d.status);
  const rader = Array.isArray(d.rader) ? d.rader.map(radUr) : [];
  if (!id || !arOffertId(id) || !medlemsId || !status || rader.length === 0 || rader.some((r) => r === null)) return null;
  const o: Offert = {
    id,
    medlemsId,
    foretagNamn: text(d.foretagNamn) ?? "",
    status,
    rader: rader as Offertrad[],
    skapad: text(d.skapad) ?? "",
  };
  for (const k of ["meddelande", "prissatt", "giltigTill", "accepterad", "betald", "meddelad"] as const) {
    const v = text(d[k]);
    if (v) o[k] = v;
  }
  return o;
}

/** Läget som kunden ska se: en prissatt eller accepterad offert efter sista dagen är utgången. */
export function aktuellStatus(o: Offert, nuMs: number): Offertstatus {
  if ((o.status === "prissatt" || o.status === "accepterad") && o.giltigTill && nuMs >= Date.parse(o.giltigTill)) return "utgangen";
  return o.status;
}

/** Kan offerten betalas nu? Prissatt eller accepterad, alla rader prissatta och inom giltighetstiden (E3-10). */
export function kanBetalas(o: Offert, nuMs: number): boolean {
  const s = aktuellStatus(o, nuMs);
  return (s === "prissatt" || s === "accepterad") && o.rader.every((r) => typeof r.offertOre === "number" && r.offertOre > 0);
}

/** Offertens sista giltiga ögonblick: 14 dygn efter prissättningen. */
export function giltigTill(prissattMs: number): string {
  return new Date(prissattMs + OFFERT_GILTIG_DAGAR * 86_400_000).toISOString();
}

export interface Offertsummor {
  /** Listpriset för alla rader när förfrågan skickades, inkl. moms. */
  listaOre: number;
  /** Offertens summa inkl. moms; null tills alla rader har pris. */
  offertOre: number | null;
}

export function offertSummor(o: Offert): Offertsummor {
  const listaOre = o.rader.reduce((s, r) => s + r.aOre * r.antal, 0);
  const prissatta = o.rader.every((r) => typeof r.offertOre === "number");
  const offertOre = prissatta ? o.rader.reduce((s, r) => s + (r.offertOre as number) * r.antal, 0) : null;
  return { listaOre, offertOre };
}

/** Kundens meddelande: kontrolltecken och vinkelparenteser bort, högst 1 000 tecken. */
export function rensaMeddelande(v: unknown): string {
  return String(v ?? "")
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f<>]/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim()
    .slice(0, MEDDELANDE_MAX);
}

const DAG = new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "long", timeZone: "Europe/Stockholm" });

/** En rad om läget, för kunden. */
export function offertStatusText(o: Offert, nuMs: number): string {
  switch (aktuellStatus(o, nuMs)) {
    case "skickad":
      return "Skickad. Vi svarar inom en arbetsdag.";
    case "prissatt":
      return o.giltigTill ? `Klar. Gäller till och med ${DAG.format(new Date(Date.parse(o.giltigTill) - 1))}.` : "Klar.";
    case "accepterad":
      return o.giltigTill ? `Öppnad i kassan. Gäller till och med ${DAG.format(new Date(Date.parse(o.giltigTill) - 1))}.` : "Öppnad i kassan.";
    case "betald":
      return "Betald.";
    case "utgangen":
      return "Utgången. Begär en ny offert från varukorgen.";
    case "avbojd":
      return "Vi kunde inte lämna en offert den här gången.";
  }
}
