// lib/medlem/admin.ts
//
// Motorns admin för medlemskapet (/admin/medlemmar, Leonards beslut A3
// 2026-11-04). Kollektionerna ägs av butiken (headless-site, lib/medlem/),
// som skrev dem 2026-11-04 med behörigheten ADMIN; motorn läser dem och gör
// bara de manuella ändringarna här.
//
// E1-11: varje manuell ändring kräver en orsakskod och en text, och skrivs
// till `FyndplatsMedlemslogg` med före- och efterläge. Loggen är bara tillägg.
//
// ☠️ Inga e-postadresser i motorns loggar eller svar: repot är publikt och
// Actions-loggar går att läsa utan inloggning. Sidan visar adressen för den
// som är inloggad i admin; det är allt.

import { createHash, randomUUID } from "node:crypto";
import { allaRader, fraga, hamta, infoga, patcha, satt, spara, taBort, taBortFalt, taBortManga } from "@/lib/db/wix-data-klient";

export const MEDLEM_KOL = {
  medlemmar: "FyndplatsMedlemmar",
  profiler: "FyndplatsMedlemsprofiler",
  inloggningar: "FyndplatsInloggningar",
  orderliggare: "FyndplatsOrderliggare",
  nivaer: "FyndplatsMedlemsnivaer",
  regler: "FyndplatsMedlemsregler",
  logg: "FyndplatsMedlemslogg",
  installningar: "FyndplatsButikInstallningar",
  /** Butikens prisbeslut per låst varukorg; motorn läser företaget till kvittot (faktura-deps.ts). */
  prisbeslut: "FyndplatsPrisbeslut",
  /** Butikens sparade varukorgar (E3); de går med kontot. */
  sparade: "FyndplatsSparadeKorgar",
} as const;

/** Raderna i butikens inställningar: växeln och orderliggarens tillstånd. */
export const VAXEL_ID = "medlemskap";
export const LIGGARE_ID = "medlemsliggare";

export const ORSAKSKODER = {
  bolagsverket: "Företaget kontrollerat hos Bolagsverket",
  kompensation: "Kompensation (reklamation eller försening)",
  felrakning: "Fel i orderliggaren eller nivån",
  kundtjanst: "Kundtjänstbeslut",
  missbruk: "Missbruk av villkoren",
  radering: "Kundens begäran om radering",
  lansering: "Lansering eller avstängning",
  ovrigt: "Övrigt",
} as const;
export type Orsakskod = keyof typeof ORSAKSKODER;

export const NIVAER = ["Brons", "Silver", "Guld", "Platina", "Diamant", "VIP"] as const;
export const LAGEN = ["av", "tyst", "pa"] as const;
export type Lage = (typeof LAGEN)[number];

/** Samma id som butiken (`lib/medlem/inloggning.ts`). Låst av ett test med samma vektor. */
export function medlemsId(epost: string): string {
  return `m_${createHash("sha256").update(`fyndplats-medlem|${epost}`, "utf8").digest("hex").slice(0, 40)}`;
}

export function normaliseraEpost(v: string): string | null {
  const e = v.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(e) ? e : null;
}

export function maskeradEpost(epost: string): string {
  const [namn, doman] = epost.split("@");
  return doman ? `${namn.slice(0, 1)}•••@${doman}` : "•••";
}

export interface Orsak {
  kod: Orsakskod;
  text: string;
}

/** Orsaken, eller felet som visas i admin. */
export function lasOrsak(kod: unknown, text: unknown): Orsak | string {
  if (typeof kod !== "string" || !(kod in ORSAKSKODER)) return "Välj en orsakskod.";
  const t = typeof text === "string" ? text.trim() : "";
  if (t.length < 5) return "Skriv en orsak på minst fem tecken.";
  if (t.length > 500) return "Orsaken får vara högst 500 tecken.";
  return { kod: kod as Orsakskod, text: t };
}

/** En manuell nivå: namnet, eller "" för att ta bort den, och ett valfritt slutdatum. */
export function lasManuellNiva(niva: unknown, till: unknown, idag: string): { niva: string; till: string | null } | string {
  const n = typeof niva === "string" ? niva : "";
  if (n !== "" && !(NIVAER as readonly string[]).includes(n)) return "Okänd nivå.";
  const t = typeof till === "string" ? till.trim() : "";
  if (!t) return { niva: n, till: null };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t) || Number.isNaN(Date.parse(`${t}T00:00:00Z`))) return "Datumet ska skrivas ÅÅÅÅ-MM-DD.";
  if (t < idag) return "Slutdatumet har redan passerat.";
  return { niva: n, till: t };
}

// ─────────────────────────────────────────────────────────────────────────────
// Läsningar
// ─────────────────────────────────────────────────────────────────────────────

export type Rad = Record<string, unknown>;

/** "NNNNNN-NNNN" ur tio eller tolv siffror, med eller utan bindestreck; annars null. */
export function orgnrForSok(q: string): string | null {
  const rent = q.replace(/[\s-]/g, "");
  if (!/^(\d{10}|\d{12})$/.test(rent)) return null;
  const tio = rent.length === 12 ? rent.slice(2) : rent;
  return `${tio.slice(0, 6)}-${tio.slice(6)}`;
}

/** Medlemmen för en e-post, ett ordernummer eller ett organisationsnummer (E3), och e-posten som söktes. */
export async function sokMedlem(q: string): Promise<{ epost: string | null; medlem: Rad | null }> {
  const epost = normaliseraEpost(q);
  if (epost) return { epost, medlem: await hamta(MEDLEM_KOL.medlemmar, medlemsId(epost)) };
  const orgnr = orgnrForSok(q);
  if (orgnr) {
    const [profil] = await fraga<Rad>(MEDLEM_KOL.profiler, { filter: { typ: "foretag", orgnr }, limit: 1 });
    const medlem = typeof profil?.medlemsId === "string" ? await hamta<Rad>(MEDLEM_KOL.medlemmar, profil.medlemsId) : null;
    const e = typeof medlem?.epost === "string" && medlem.epost ? medlem.epost : null;
    return { epost: e, medlem };
  }
  const nummer = q.trim().replace(/^#/, "");
  if (!/^\d{3,10}$/.test(nummer)) return { epost: null, medlem: null };
  const [rad] = await fraga<Rad>(MEDLEM_KOL.orderliggare, { filter: { ordernummer: nummer }, limit: 1 });
  const e = typeof rad?.epost === "string" && rad.epost ? rad.epost : null;
  return { epost: e, medlem: e ? await hamta(MEDLEM_KOL.medlemmar, medlemsId(e)) : null };
}

export async function liggarraderForEpost(epost: string): Promise<Rad[]> {
  const rader = await allaRader<Rad>(MEDLEM_KOL.orderliggare, { filter: { epost } });
  return rader.sort((a, b) => String(b.bestalld ?? "").localeCompare(String(a.bestalld ?? "")));
}

export async function loggFor(filter: Rad, antal = 50): Promise<Rad[]> {
  return fraga<Rad>(MEDLEM_KOL.logg, { filter, sort: [{ fieldName: "tid", order: "DESC" }], limit: antal });
}

export async function nivabyten(medlem: string): Promise<Rad[]> {
  return fraga<Rad>(MEDLEM_KOL.nivaer, { filter: { medlemsId: medlem }, sort: [{ fieldName: "tid", order: "DESC" }], limit: 30 });
}

export async function oversikt(): Promise<{ lage: Lage; liggare: Rad | null; medlemmar: number; avvikelser: Rad[] }> {
  const [vaxel, liggare, medlemmar, avvikelser] = await Promise.all([
    hamta<Rad>(MEDLEM_KOL.installningar, VAXEL_ID),
    hamta<Rad>(MEDLEM_KOL.installningar, LIGGARE_ID),
    allaRader<Rad>(MEDLEM_KOL.medlemmar).then((r) => r.length),
    loggFor({ omrade: "avstamning" }, 20),
  ]);
  const v = vaxel?.lage;
  return { lage: v === "pa" || v === "tyst" ? v : "av", liggare, medlemmar, avvikelser };
}

// ─────────────────────────────────────────────────────────────────────────────
// Företagen (E3): kön och beslutet
// ─────────────────────────────────────────────────────────────────────────────

/** Butikens id för kontots företagsprofil (lib/medlem/foretag.ts i butiken). */
export const foretagsprofilId = (medlem: string) => `${medlem}__foretag`;

export type Foretagsbeslut = "aktiv" | "nekad";

/** Företag som väntar på granskning, äldst först, med kontots e-post. */
export async function foretagsko(antal = 50): Promise<{ profil: Rad; epost: string }[]> {
  const profiler = await fraga<Rad>(MEDLEM_KOL.profiler, {
    filter: { $and: [{ typ: "foretag" }, { status: "granskas" }] },
    sort: [{ fieldName: "ansokt", order: "ASC" }],
    limit: antal,
  });
  return Promise.all(
    profiler.map(async (profil) => {
      const m = typeof profil.medlemsId === "string" ? await hamta<Rad>(MEDLEM_KOL.medlemmar, profil.medlemsId) : null;
      return { profil, epost: typeof m?.epost === "string" ? m.epost : "" };
    }),
  );
}

export function foretagFor(medlem: string): Promise<Rad | null> {
  return hamta<Rad>(MEDLEM_KOL.profiler, foretagsprofilId(medlem));
}

/**
 * Godkänner eller nekar ett företag, eller återkallar ett godkännande (aktiv →
 * nekad). Beslutet skrivs bara om profilen fortfarande har läget som lästes
 * (villkoret), så att två admins inte skriver över varandra. Butikens timjobb
 * mejlar kunden om ett godkännande inom en timme.
 *
 * ☠️ Loggen får namnet och formen, aldrig numret: för en enskild firma är det
 * ett personnummer.
 */
export async function beslutaForetag(medlem: string, beslut: Foretagsbeslut, orsak: Orsak): Promise<string> {
  const fore = await foretagFor(medlem);
  if (!fore || fore.typ !== "foretag") return "Kontot har inget företag.";
  const forut = String(fore.status ?? "");
  if (forut === beslut) return beslut === "aktiv" ? "Företaget är redan godkänt." : "Företaget är redan nekat.";
  const tid = new Date().toISOString();
  const u = await patcha(MEDLEM_KOL.profiler, foretagsprofilId(medlem), [satt("status", beslut), satt("beslutad", tid)], { status: forut });
  if (u !== "applied") return "Någon annan ändrade företaget samtidigt. Ladda om sidan.";
  await logga({
    omrade: "foretag",
    typ: beslut === "aktiv" ? "foretag-godkant" : forut === "aktiv" ? "foretag-aterkallat" : "foretag-nekat",
    medlemsId: medlem,
    fore: { status: forut, namn: String(fore.namn ?? ""), form: String(fore.form ?? "") },
    efter: { status: beslut },
    orsakKod: orsak.kod,
    orsakText: orsak.text,
  });
  return "ok";
}

// ─────────────────────────────────────────────────────────────────────────────
// Manuella ändringar (E1-11)
// ─────────────────────────────────────────────────────────────────────────────

async function logga(h: Rad): Promise<void> {
  const tid = new Date().toISOString();
  await infoga(MEDLEM_KOL.logg, `l_${tid.replace(/[^0-9]/g, "")}_${randomUUID().slice(0, 8)}`, { ...h, aktor: "admin", tid });
}

export async function sattManuellNiva(id: string, niva: { niva: string; till: string | null }, orsak: Orsak): Promise<string> {
  const fore = await hamta<Rad>(MEDLEM_KOL.medlemmar, id);
  if (!fore) return "Medlemmen finns inte.";
  const andringar = niva.niva
    ? [satt("manuellNiva", niva.niva), niva.till ? satt("manuellTill", niva.till) : taBortFalt("manuellTill")]
    : [taBortFalt("manuellNiva"), taBortFalt("manuellTill")];
  const u = await patcha(MEDLEM_KOL.medlemmar, id, andringar);
  if (u !== "applied") return "Ändringen gick inte igenom.";
  await logga({
    omrade: "admin",
    typ: niva.niva ? "manuell-niva" : "manuell-niva-bort",
    medlemsId: id,
    fore: { manuellNiva: fore.manuellNiva ?? "", manuellTill: fore.manuellTill ?? "", niva: fore.niva ?? "" },
    efter: { manuellNiva: niva.niva, manuellTill: niva.till ?? "" },
    orsakKod: orsak.kod,
    orsakText: orsak.text,
  });
  return "ok";
}

export async function sattSparr(id: string, sparrad: boolean, orsak: Orsak): Promise<string> {
  const fore = await hamta<Rad>(MEDLEM_KOL.medlemmar, id);
  if (!fore) return "Medlemmen finns inte.";
  const u = await patcha(MEDLEM_KOL.medlemmar, id, [satt("status", sparrad ? "sparrad" : "aktiv")]);
  if (u !== "applied") return "Ändringen gick inte igenom.";
  await logga({
    omrade: "admin",
    typ: sparrad ? "sparrad" : "aktiverad",
    medlemsId: id,
    fore: { status: fore.status ?? "aktiv" },
    efter: { status: sparrad ? "sparrad" : "aktiv" },
    orsakKod: orsak.kod,
    orsakText: orsak.text,
  });
  return "ok";
}

/**
 * Tar bort kontot på kundens begäran: medlemmen, profilerna (privat och
 * företag), nivåbytena (id och
 * belopp per dag), inloggningsförsöken (adressen i klartext) och de sparade
 * varukorgarna (E3; vad kunden brukar köpa, ingen bokföring). Orderliggaren
 * och prisbesluten står kvar: de bär ordrarna och priserna, som bokföringslagen
 * kräver, och inget konto. Loggen får bara den maskerade adressen.
 *
 * Nivåbytena, inloggningarna och korgarna tas bort först. Faller det står kontot kvar,
 * så att ett nytt försök hittar allt; annars hade raderna blivit kvar utan
 * konto att ta bort dem från.
 */
export async function taBortKonto(id: string, orsak: Orsak): Promise<string> {
  const fore = await hamta<Rad>(MEDLEM_KOL.medlemmar, id);
  if (!fore) return "Medlemmen finns inte.";
  const epost = String(fore.epost ?? "");
  const [byten, inloggningar, korgar] = await Promise.all([
    allaRader<Rad>(MEDLEM_KOL.nivaer, { filter: { medlemsId: id } }),
    epost ? allaRader<Rad>(MEDLEM_KOL.inloggningar, { filter: { epost } }) : Promise.resolve([] as Rad[]),
    allaRader<Rad>(MEDLEM_KOL.sparade, { filter: { medlemsId: id } }),
  ]);
  const b = await taBortManga(MEDLEM_KOL.nivaer, byten.map((r) => String(r._id)));
  const i = await taBortManga(MEDLEM_KOL.inloggningar, inloggningar.map((r) => String(r._id)));
  const k = await taBortManga(MEDLEM_KOL.sparade, korgar.map((r) => String(r._id)));
  const fel = b.fel.length + i.fel.length + k.fel.length;
  if (fel) return `Nivåbytena, inloggningarna eller de sparade varukorgarna gick inte att ta bort (${fel} fel). Kontot står kvar; försök igen.`;
  await taBort(MEDLEM_KOL.profiler, `${id}__privat`);
  // E3: företagsprofilen bär en enskild firmas personnummer och går med kontot.
  await taBort(MEDLEM_KOL.profiler, foretagsprofilId(id));
  await taBort(MEDLEM_KOL.medlemmar, id);
  await logga({
    omrade: "admin",
    typ: "konto-borttaget",
    medlemsId: id,
    fore: { epost: maskeradEpost(epost), niva: fore.niva ?? "" },
    efter: { nivabyten: b.borttagna, inloggningar: i.borttagna, sparadeKorgar: k.borttagna },
    orsakKod: orsak.kod,
    orsakText: orsak.text,
  });
  return "ok";
}

/** Växeln: av, tyst eller på. Butiken läser raden högst en gång i minuten. */
export async function sattLage(lage: Lage, orsak: Orsak): Promise<string> {
  const fore = (await hamta<Rad>(MEDLEM_KOL.installningar, VAXEL_ID)) ?? {};
  await spara(MEDLEM_KOL.installningar, VAXEL_ID, { ...fore, lage, andrad: new Date().toISOString() });
  await logga({
    omrade: "admin",
    typ: "lage",
    fore: { lage: typeof fore.lage === "string" ? fore.lage : "av" },
    efter: { lage },
    orsakKod: orsak.kod,
    orsakText: orsak.text,
  });
  return "ok";
}
