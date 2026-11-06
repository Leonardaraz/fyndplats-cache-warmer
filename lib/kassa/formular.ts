// lib/kassa/formular.ts
//
// Kassans formulär (vår egen kassa på /kassa, Leonards val 2026-11-05):
// kontakt och leveransadress, prövade och normaliserade innan något skickas
// till Wix. Ren modul utan importer, så att node --test kan köra den.
//
// Texterna är kundens. Varje fel säger vad som ska stå i fältet, inte vad som
// är fel med det kunden skrev.

export type Falt = "epost" | "fornamn" | "efternamn" | "telefon" | "gata" | "co" | "postnr" | "ort" | "kupong";

export interface KassaIn {
  epost?: unknown;
  fornamn?: unknown;
  efternamn?: unknown;
  telefon?: unknown;
  gata?: unknown;
  co?: unknown;
  postnr?: unknown;
  ort?: unknown;
  kupong?: unknown;
}

export interface KassaVarden {
  epost: string;
  fornamn: string;
  efternamn: string;
  /** E.164, till exempel +46701234567. */
  telefon: string;
  gata: string;
  /** Tom när kunden inte skrev något. */
  co: string;
  /** "152 44", som Wix skriver svenska postnummer. */
  postnr: string;
  ort: string;
  /** Tom när kunden inte skrev någon kod. */
  kupong: string;
}

export type KassaProv = { ok: true; varden: KassaVarden } | { ok: false; fel: Partial<Record<Falt, string>> };

const text = (v: unknown): string => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");

const EPOST = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** "152 44", "15244", " 152-44 " → "152 44". Annars null. Svenska postnummer börjar aldrig med 0. */
export function normalPostnr(v: unknown): string | null {
  const s = text(v).replace(/[\s-]/g, "");
  return /^[1-9]\d{4}$/.test(s) ? `${s.slice(0, 3)} ${s.slice(3)}` : null;
}

/**
 * Telefonnumret i E.164. Svenska nummer skrivs ofta med nolla först
 * ("070-123 45 67"), utländska med + eller 00. Annars null.
 */
export function normalTelefon(v: unknown): string | null {
  let s = text(v).replace(/[\s\-().]/g, "");
  if (s.startsWith("00")) s = `+${s.slice(2)}`;
  else if (/^0\d/.test(s)) s = `+46${s.slice(1)}`;
  if (!/^\+\d{7,15}$/.test(s)) return null;
  // +460… är ett felskrivet svenskt nummer (nollan följde med).
  if (s.startsWith("+460")) s = `+46${s.slice(4)}`;
  if (s.startsWith("+46") && !/^\+46\d{7,10}$/.test(s)) return null;
  return s;
}

export const KASSA_TEXT: Record<Falt, { saknas: string; fel?: string }> = {
  epost: { saknas: "Skriv din e-postadress.", fel: "Skriv den som namn@exempel.se." },
  fornamn: { saknas: "Skriv ditt förnamn." },
  efternamn: { saknas: "Skriv ditt efternamn." },
  telefon: { saknas: "Skriv ditt mobilnummer.", fel: "Skriv det som 070 123 45 67." },
  gata: { saknas: "Skriv gatuadress och nummer." },
  co: { saknas: "", fel: "Högst 60 tecken." },
  postnr: { saknas: "Skriv postnumret.", fel: "Fem siffror, som 152 44." },
  ort: { saknas: "Skriv orten." },
  kupong: { saknas: "", fel: "Rabattkoden ser inte rätt ut." },
};

const MAX: Record<Falt, number> = { epost: 254, fornamn: 60, efternamn: 60, telefon: 20, gata: 100, co: 60, postnr: 6, ort: 50, kupong: 40 };

/**
 * Fälten i den ordning kunden ser dem på sidan. Fokus går till det första
 * felet uppifrån: provaKassa lägger felen i en annan ordning, och kassan
 * hoppade därför förbi ett tomt mobilnummer till förnamnet under det.
 */
export const FALT_ORDNING: readonly Falt[] = ["epost", "telefon", "fornamn", "efternamn", "gata", "co", "postnr", "ort", "kupong"];

/** Det första fältet uppifrån som har ett fel, eller null. */
export function forstaFel(fel: Partial<Record<Falt, string>>): Falt | null {
  return FALT_ORDNING.find((f) => Boolean(fel[f])) ?? null;
}

/**
 * Är fältet ifyllt som kassan vill ha det? Samma regler som provaKassa, ett
 * fält i taget: kassan visar en bock när kunden lämnat ett giltigt fält.
 * c/o och rabattkoden är frivilliga och får ingen bock när de är tomma.
 */
export function faltGiltigt(f: Falt, v: unknown): boolean {
  const t = text(v);
  switch (f) {
    case "epost":
      return EPOST.test(t) && t.length <= MAX.epost;
    case "telefon":
      return normalTelefon(t) !== null;
    case "postnr":
      return normalPostnr(t) !== null;
    case "kupong":
      return false;
    default:
      return t.length > 0 && t.length <= MAX[f];
  }
}

/**
 * Ett svenskt mobilnummer som kunden känner igen det: "0701234567",
 * "+46 70 123 45 67" och "070-123 45 67" blir "070 123 45 67". Allt annat
 * (fasta nummer, utländska, ofullständiga) lämnas som kunden skrev det.
 */
export function snyggtTelefon(v: string): string {
  const e164 = normalTelefon(v);
  if (!e164 || !/^\+467\d{8}$/.test(e164)) return v;
  const d = `0${e164.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
}

/** Prövar hela formuläret. Alla fel på en gång, så att kunden ser allt som saknas. */
export function provaKassa(inn: KassaIn): KassaProv {
  const fel: Partial<Record<Falt, string>> = {};
  const r = (f: Falt) => text(inn[f]);
  const langd = (f: Falt, v: string) => {
    if (v.length > MAX[f]) fel[f] = KASSA_TEXT[f].fel ?? `Högst ${MAX[f]} tecken.`;
  };

  const epost = r("epost");
  if (!epost) fel.epost = KASSA_TEXT.epost.saknas;
  else if (!EPOST.test(epost) || epost.length > MAX.epost) fel.epost = KASSA_TEXT.epost.fel;

  for (const f of ["fornamn", "efternamn", "gata", "ort"] as const) {
    const v = r(f);
    if (!v) fel[f] = KASSA_TEXT[f].saknas;
    else langd(f, v);
  }

  const telRa = r("telefon");
  const telefon = normalTelefon(telRa);
  if (!telRa) fel.telefon = KASSA_TEXT.telefon.saknas;
  else if (!telefon) fel.telefon = KASSA_TEXT.telefon.fel;

  const pnRa = r("postnr");
  const postnr = normalPostnr(pnRa);
  if (!pnRa) fel.postnr = KASSA_TEXT.postnr.saknas;
  else if (!postnr) fel.postnr = KASSA_TEXT.postnr.fel;

  const co = r("co");
  langd("co", co);

  const kupong = r("kupong").replace(/\s/g, "");
  if (kupong && (kupong.length > MAX.kupong || !/^[\p{L}\p{N}_-]+$/u.test(kupong))) fel.kupong = KASSA_TEXT.kupong.fel;

  if (Object.keys(fel).length > 0) return { ok: false, fel };
  return {
    ok: true,
    varden: {
      epost,
      fornamn: r("fornamn"),
      efternamn: r("efternamn"),
      telefon: telefon!,
      gata: r("gata"),
      co,
      postnr: postnr!,
      ort: r("ort"),
      kupong,
    },
  };
}
