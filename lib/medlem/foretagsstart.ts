// lib/medlem/foretagsstart.ts
//
// Den direkta vägen till ett företagskonto, /konto/foretag (Leonard 2026-11-10).
//
// Förut fanns företagskontot bara som en ruta på Mina sidor: kunden fick bli
// medlem först och sedan själv hitta "Lägg till ett företag". Nu finns en egen
// väg med tre steg (e-post, företaget, klart). Kontot är fortfarande samma
// medlemskonto med en företagsprofil; det är vägen dit som är ny.
//
// Här bor det som går att pröva utan webbläsare: vart /konto/foretag ska
// skicka besökaren, stegens läge, ordertrappans steg för bilden och texterna
// i sista steget.
//
// Ren modul utan lokala imports, så att `node --test` kan läsa den.
// Ordertrappan skickas in av den som anropar (ORDERTRAPPA i pris.ts).

/** Adressen till den direkta vägen. Inloggningens mål och alla länkar dit. */
export const FORETAGSVAG = "/konto/foretag";

export type Foretagsstatus = "granskas" | "aktiv" | "nekad";

export interface Vaglage {
  /** Medlemskontot är öppet (hemligheten finns och läget är inte `av`). */
  oppen: boolean;
  /** Prisväxeln står på `pa`: företagskontot är öppet för alla. */
  prisPa: boolean;
  /** En giltig session för en aktiv medlem. */
  inloggad: boolean;
  /** Inloggad: prisväxeln släpper fram just den här medlemmen (`pa`, eller `test` för en testare). */
  oppetForMedlem?: boolean;
  /** Inloggad: företagets status om kontot redan har ett. */
  foretag?: Foretagsstatus | null;
}

/**
 * Vad /konto/foretag ska göra:
 *
 * - `start`: utloggad, visa steg 1 (organisationsnummer och e-post).
 * - `uppgifter`: inloggad utan företag, visa steg 2 direkt.
 * - `mina-sidor`: kontot har redan ett företag (också ett nekat): allt om det
 *   sköts i rutan på Mina sidor.
 * - `privat`: vägen är inte öppen för besökaren. /konto säger varför (stängt
 *   konto, spärrad medlem) eller visar den vanliga inloggningen.
 *
 * ☠️ Utloggad visas vägen bara när prisväxeln står på `pa`. I läget `test`
 * hade vem som helst annars kunnat skapa ett konto och mötas av "inte öppnat
 * än" i steg 2. En testare loggar in först och går sedan hit.
 */
export function foretagsvag(l: Vaglage): "start" | "uppgifter" | "mina-sidor" | "privat" {
  if (!l.oppen) return "privat";
  if (!l.inloggad) return l.prisPa ? "start" : "privat";
  if (l.foretag) return "mina-sidor";
  return l.oppetForMedlem ? "uppgifter" : "privat";
}

/** Ska /konto visa växeln Privatperson/Företag och raden om företagskonto? */
export function visaForetagsvag(oppen: boolean, prisPa: boolean): boolean {
  return oppen && prisPa;
}

/**
 * Svaret från /api/konto/foretag { steg: "lage" } direkt efter inloggningen i
 * steg 1: gå vidare till steg 2 på samma sida, eller lämna vägen.
 */
export function efterInloggning(svar: { ok?: unknown; oppet?: unknown; foretag?: unknown } | null): "uppgifter" | "mina-sidor" | "privat" {
  if (!svar || svar.ok !== true) return "privat";
  if (svar.foretag === "granskas" || svar.foretag === "aktiv" || svar.foretag === "nekad") return "mina-sidor";
  return svar.oppet === true ? "uppgifter" : "privat";
}

/** Vart webbläsaren ska när vägen lämnas. */
export function utvag(till: "mina-sidor" | "privat"): string {
  return till === "mina-sidor" ? "/konto#foretag" : "/konto";
}

// ─────────────────────────────────────────────────────────────────────────────
// Stegen
// ─────────────────────────────────────────────────────────────────────────────

export const STEG = ["E-post", "Företaget", "Klart"] as const;
export type Stegnummer = 0 | 1 | 2;

/** Stegets läge i raden: redan gjort, det man står på, eller kvar. */
export function stegLage(steg: number, aktivt: number): "klar" | "nu" | "sen" {
  // Sista steget är inget att göra: står man där är det avklarat.
  if (steg < aktivt || (steg === aktivt && aktivt === STEG.length - 1)) return "klar";
  return steg === aktivt ? "nu" : "sen";
}

// ─────────────────────────────────────────────────────────────────────────────
// Ordertrappan som bild
// ─────────────────────────────────────────────────────────────────────────────

export interface Trappsteg {
  procent: number;
  /** Gränsen i hela kronor exklusive moms. */
  kr: number;
  /** "5 000", med hårt mellanslag: beloppet utan enhet, för smala skärmar. */
  tal: string;
  /** "5 000 kr", med hårt mellanslag. */
  text: string;
  /** Stapelns höjd, 0–1, i jämna steg. */
  hojd: number;
}

/** Prismotorns tabell (ORDERTRAPPA i pris.ts): gräns exkl. moms i öre och procent. */
export type Ordertrappa = readonly { franOreExMoms: number; procent: number }[];

const TUSEN = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 });

/**
 * Trappans steg med rabatt, ur prismotorns egen tabell. Bilden kan därför
 * aldrig lova något annat än kassan räknar.
 */
export function trappsteg(trappa: Ordertrappa): Trappsteg[] {
  const steg = trappa.filter((s) => s.procent > 0);
  return steg.map((s, i) => {
    const kr = Math.round(s.franOreExMoms / 100);
    const tal = TUSEN.format(kr).replace(/\s/g, "\u00a0");
    return {
      procent: s.procent,
      kr,
      tal,
      text: `${tal}\u00a0kr`,
      hojd: (i + 1) / steg.length,
    };
  });
}

/** Trappan som en mening, för skärmläsare och för den som inte ser staplarna. */
export function trappmening(trappa: Ordertrappa): string {
  const s = trappsteg(trappa);
  if (s.length === 0) return "";
  const delar = s.map((x) => `${x.procent}\u00a0% från ${x.text}`);
  return `Ordertrappan: ${delar.join(", ")}, räknat exklusive moms.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sista steget
// ─────────────────────────────────────────────────────────────────────────────

export interface Utfall {
  status: "aktiv" | "granskas";
  /** Företagets namn, det registrerade när Bolagsverket hade det. */
  namn?: string;
  /** Profilen växlade till företaget (bara ett godkänt företag kan det). */
  somForetag: boolean;
}

export interface Klartext {
  rubrik: string;
  text: string;
  /** Huvudknappen först. */
  knappar: { text: string; href: string }[];
}

/**
 * Texten i sista steget. Tre lägen:
 * godkänt och växlat (handlar redan som företaget), godkänt men inte växlat
 * (profilbytet svarade inte: valet finns på Mina sidor), och under granskning.
 */
export function klartext(u: Utfall): Klartext {
  const namn = (u.namn ?? "").trim();
  if (u.status === "aktiv") {
    return {
      rubrik: namn ? `${namn} är godkänt` : "Företaget är godkänt",
      text: u.somForetag
        ? "Företagskontot är klart. Du handlar nu som företaget och ser priserna exklusive moms. Momsen läggs på i kassan."
        : "Företagskontot är klart. Välj företaget under Du handlar som på Mina sidor, så visas priserna exklusive moms.",
      knappar: u.somForetag
        ? [
            { text: "Börja handla", href: "/butik" },
            { text: "Till Mina sidor", href: "/konto#foretag" },
          ]
        : [
            { text: "Till Mina sidor", href: "/konto#foretag" },
            { text: "Börja handla", href: "/butik" },
          ],
    };
  }
  return {
    rubrik: "Tack, vi går igenom uppgifterna",
    text: "Vi kontrollerar företaget och mejlar dig när det är godkänt, oftast inom en arbetsdag. Under tiden kan du handla som privatperson med samma konto.",
    knappar: [
      { text: "Till Mina sidor", href: "/konto#foretag" },
      { text: "Fortsätt handla", href: "/butik" },
    ],
  };
}
