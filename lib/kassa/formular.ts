// lib/kassa/formular.ts
//
// Kassans formulär (vår egen kassa på /kassa, Leonards val 2026-11-05):
// kontakt och leveransadress, prövade och normaliserade innan något skickas
// till Wix. Ren modul utan importer, så att node --test kan köra den.
//
// Texterna är kundens. Varje fel säger vad som ska stå i fältet, inte vad som
// är fel med det kunden skrev.

export type Falt = "epost" | "fornamn" | "efternamn" | "telefon" | "gata" | "rad2" | "co" | "postnr" | "ort" | "lan" | "kupong";

export interface KassaIn {
  epost?: unknown;
  fornamn?: unknown;
  efternamn?: unknown;
  telefon?: unknown;
  gata?: unknown;
  rad2?: unknown;
  co?: unknown;
  postnr?: unknown;
  ort?: unknown;
  lan?: unknown;
  kupong?: unknown;
}

export interface KassaVarden {
  epost: string;
  fornamn: string;
  efternamn: string;
  /** E.164, till exempel +46701234567. */
  telefon: string;
  gata: string;
  /**
   * Adressrad 2 som kunden skrev den ("lgh 1201", "c/o Berg"), utan tillägg.
   * Stripes adressfält har en sådan rad; kassans egna fält har c/o i stället.
   * Tom när kunden inte skrev något.
   */
  rad2: string;
  /** Tom när kunden inte skrev något. Skickas som "c/o …". */
  co: string;
  /** "152 44", som Wix skriver svenska postnummer. */
  postnr: string;
  ort: string;
  /** Länet som ISO 3166-2 ("SE-N"): kundens val, annars ur postnumret. Tomt när det inte går att avgöra. */
  lan: string;
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
  rad2: { saknas: "", fel: "Högst 60 tecken." },
  co: { saknas: "", fel: "Högst 60 tecken." },
  postnr: { saknas: "Skriv postnumret.", fel: "Fem siffror, som 152 44." },
  ort: { saknas: "Skriv staden." },
  lan: { saknas: "" },
  kupong: { saknas: "", fel: "Rabattkoden ser inte rätt ut." },
};

const MAX: Record<Falt, number> = { epost: 254, fornamn: 60, efternamn: 60, telefon: 20, gata: 100, rad2: 60, co: 60, postnr: 6, ort: 50, lan: 5, kupong: 40 };

/**
 * Fälten i den ordning kunden ser dem på sidan. Fokus går till det första
 * felet uppifrån: provaKassa lägger felen i en annan ordning, och kassan
 * hoppade därför förbi ett tomt mobilnummer till förnamnet under det.
 */
export const FALT_ORDNING: readonly Falt[] = ["epost", "telefon", "fornamn", "efternamn", "gata", "rad2", "co", "postnr", "ort", "lan", "kupong"];

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
    case "lan":
      return arLanKod(t);
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

  const rad2 = r("rad2");
  langd("rad2", rad2);
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
      rad2,
      co,
      postnr: postnr!,
      ort: r("ort"),
      // Kundens val när det är ett län, annars ur postnumret (Wix och leverantörerna vill ha det).
      lan: arLanKod(r("lan").toUpperCase()) ? r("lan").toUpperCase() : (lanFranPostnr(postnr) ?? ""),
      kupong,
    },
  };
}

// ── Länet ──────────────────────────────────────────────────────────────────
// Länet i kundens leveransadress (Leonard 2026-11-06: "stad och län, så det
// blir samma som vi ger till Aosom och VEVOR"). Wix vill ha det som ISO
// 3166-2 ("SE-N"), och motorn gör om det till leverantörens provinsfält
// (deriveProvince i motorns lib/orders/tasks.ts; Aosoms klumporder har en
// kolumn "Province"). Kunden behöver aldrig välja: länet kommer ur Googles
// adressförslag ("Hallands län") eller ur postnumret, och går att ändra.
//
// Postnumren pekar ut länet: två siffror räcker för det mesta, och de kända
// blandzonerna avgörs på tre. Tabellen är motorns (provinceFromSwedishPostalCode,
// order #10015, 2026-08-08) med länskoder i stället för AliExpress-namn.

export interface Lan {
  kod: string;
  namn: string;
}

/** De 21 länen i bokstavsordning, som de står i valet. */
export const LAN: readonly Lan[] = [
  { kod: "SE-K", namn: "Blekinge län" },
  { kod: "SE-W", namn: "Dalarnas län" },
  { kod: "SE-I", namn: "Gotlands län" },
  { kod: "SE-X", namn: "Gävleborgs län" },
  { kod: "SE-N", namn: "Hallands län" },
  { kod: "SE-Z", namn: "Jämtlands län" },
  { kod: "SE-F", namn: "Jönköpings län" },
  { kod: "SE-H", namn: "Kalmar län" },
  { kod: "SE-G", namn: "Kronobergs län" },
  { kod: "SE-BD", namn: "Norrbottens län" },
  { kod: "SE-M", namn: "Skåne län" },
  { kod: "SE-AB", namn: "Stockholms län" },
  { kod: "SE-D", namn: "Södermanlands län" },
  { kod: "SE-C", namn: "Uppsala län" },
  { kod: "SE-S", namn: "Värmlands län" },
  { kod: "SE-AC", namn: "Västerbottens län" },
  { kod: "SE-Y", namn: "Västernorrlands län" },
  { kod: "SE-U", namn: "Västmanlands län" },
  { kod: "SE-O", namn: "Västra Götalands län" },
  { kod: "SE-T", namn: "Örebro län" },
  { kod: "SE-E", namn: "Östergötlands län" },
];

const KODER = new Set(LAN.map((l) => l.kod));

export function arLanKod(v: unknown): v is string {
  return typeof v === "string" && KODER.has(v);
}

export function lanNamn(kod: string): string | null {
  return LAN.find((l) => l.kod === kod)?.namn ?? null;
}

/** Län som delar tvåsiffrigt prefix med ett annat: tre siffror avgör. */
const TRE: Record<string, string> = {
  "285": "SE-G", // Markaryd (Skåneprefix)
  "293": "SE-K", // Olofström
  "294": "SE-K", // Sölvesborg
  "361": "SE-H",
  "577": "SE-H",
  "579": "SE-H",
  "598": "SE-H",
  // Kungsbacka och Varberg ligger i Halland trots Göteborgsprefixet 43.
  "430": "SE-N",
  "432": "SE-N",
  "434": "SE-N",
  "439": "SE-N",
  "610": "SE-D", // Nyköpings omland
  "611": "SE-D",
  "613": "SE-D",
  "619": "SE-D",
  "662": "SE-O",
  "666": "SE-O",
  "668": "SE-O",
  "814": "SE-C",
  "815": "SE-C",
  "819": "SE-C",
  "841": "SE-Y",
  "933": "SE-BD",
  "938": "SE-BD",
};

const TVA: Record<string, string> = {};
const satt = (fran: number, till: number, kod: string) => {
  for (let n = fran; n <= till; n++) TVA[String(n)] = kod;
};
satt(10, 19, "SE-AB");
satt(20, 29, "SE-M");
satt(30, 31, "SE-N");
satt(33, 33, "SE-F");
satt(34, 36, "SE-G");
satt(37, 37, "SE-K");
satt(38, 39, "SE-H");
satt(40, 47, "SE-O");
satt(50, 54, "SE-O");
satt(55, 57, "SE-F");
satt(58, 61, "SE-E");
satt(62, 62, "SE-I");
satt(63, 64, "SE-D");
satt(65, 68, "SE-S");
satt(69, 71, "SE-T");
satt(72, 73, "SE-U");
satt(74, 75, "SE-C");
satt(76, 76, "SE-AB"); // Norrtälje, Rimbo, Hallstavik
satt(77, 79, "SE-W");
satt(80, 82, "SE-X");
satt(83, 84, "SE-Z");
satt(85, 89, "SE-Y");
satt(90, 93, "SE-AC");
satt(94, 98, "SE-BD");

/** Länskoden ur ett svenskt postnummer ("434 41", "43441"), annars null. */
export function lanFranPostnr(postnr: unknown): string | null {
  const s = typeof postnr === "string" ? postnr.replace(/\D/g, "") : "";
  if (!/^[1-9]\d{4}$/.test(s)) return null;
  return TRE[s.slice(0, 3)] ?? TVA[s.slice(0, 2)] ?? null;
}

/** "Västra Götalands län" → "vastra gotaland": små bokstäver, utan prickar och utan "län". */
const nyckel = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\b(lan|county)\b/g, "")
    .replace(/[^a-z]+/g, " ")
    .trim();

const NAMN = new Map<string, string>();
for (const l of LAN) {
  const n = nyckel(l.namn);
  NAMN.set(n, l.kod);
  // Genitivets s: "hallands" → "halland", "stockholms" → "stockholm" (inte "skane", "kalmar", "uppsala", "orebro").
  if (n.endsWith("s")) NAMN.set(n.slice(0, -1), l.kod);
}

/**
 * Länskoden ur ett länsnamn som Google eller kunden skriver det ("Hallands
 * län", "Halland", "Skåne län", "Stockholm County"), eller ur en kod ("SE-N").
 * Annars null.
 */
export function lanFranText(text: unknown): string | null {
  if (typeof text !== "string") return null;
  const t = text.trim();
  if (!t) return null;
  const kod = t.toUpperCase();
  if (KODER.has(kod)) return kod;
  return NAMN.get(nyckel(t)) ?? null;
}

// ── Stripes adressfält ─────────────────────────────────────────────────────

/** Det kassan läser ur Stripes adressfält (StripeAddressElementChangeEvent["value"]). */
export interface StripeAdressVarde {
  firstName?: string | null;
  lastName?: string | null;
  address?: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
  } | null;
}

/**
 * Adressfältets värde som kassans fält. Länet kommer ur Googles förslag
 * ("Hallands län" i `state`, fast det svenska formuläret inte visar något
 * länsfält), annars ur postnumret. Postnumret skrivs "434 41" när det är giltigt.
 */
export function adressFranStripe(v: StripeAdressVarde): { fornamn: string; efternamn: string; gata: string; rad2: string; postnr: string; ort: string; lan: string } {
  const a: NonNullable<StripeAdressVarde["address"]> = v.address ?? {};
  const pnRa = text(a.postal_code);
  return {
    fornamn: text(v.firstName),
    efternamn: text(v.lastName),
    gata: text(a.line1),
    rad2: text(a.line2),
    postnr: normalPostnr(pnRa) ?? pnRa,
    ort: text(a.city),
    lan: lanFranText(a.state) ?? lanFranPostnr(pnRa) ?? "",
  };
}

/** Fälten som står i Stripes adressfält när kassan använder det (resten är kassans egna). */
export const ADRESS_FALT: readonly Falt[] = ["fornamn", "efternamn", "gata", "rad2", "co", "postnr", "ort"];

// ── Plånboken (snabbkassan) ────────────────────────────────────────────────

/**
 * Det kassan läser ur Apple Pay och Google Pay (Stripes Express Checkout
 * Element, händelsen "confirm"): e-post och telefon i `billingDetails`, namn
 * och adress i `shippingAddress`.
 */
export interface PlanbokVarde {
  billingDetails?: { name?: string | null; email?: string | null; phone?: string | null } | null;
  shippingAddress?: {
    name?: string | null;
    address?: {
      line1?: string | null;
      line2?: string | null;
      city?: string | null;
      state?: string | null;
      postal_code?: string | null;
      country?: string | null;
    } | null;
  } | null;
}

/**
 * Ett namn på en rad ("Anna Maria Svensson") som kassans två fält: efternamnet
 * är sista ordet och förnamnet resten, eftersom dubbla förnamn är vanligare än
 * dubbla efternamn. Apple Pay har för- och efternamn var för sig, men Stripe
 * skickar dem som en rad, och Google Pay har bara raden. Hela namnet står
 * ändå kvar i samma ordning på ordern och paketet.
 */
export function delaNamn(namn: unknown): { fornamn: string; efternamn: string } {
  const ord = text(namn).split(" ").filter(Boolean);
  if (ord.length < 2) return { fornamn: ord[0] ?? "", efternamn: "" };
  return { fornamn: ord.slice(0, -1).join(" "), efternamn: ord[ord.length - 1] };
}

/**
 * Plånbokens uppgifter som kassans formulär. provaKassa prövar dem sedan som
 * om kunden skrivit dem själv. Namnet kommer från leveransadressen; saknar den
 * efternamn används kortets namn om det har både för- och efternamn. Länet
 * kommer ur plånbokens region ("Hallands län"), annars ur postnumret.
 * `epost` ersätter plånbokens e-post när kassan redan vet vem kunden är
 * (medlemmens korg): köpet ska räknas på kontot.
 */
export function kundFranPlanbok(p: PlanbokVarde, o: { kupong?: string; epost?: string | null } = {}): KassaIn {
  const lev = p.shippingAddress ?? {};
  const a = lev.address ?? {};
  const kandidater = [text(lev.name), text(p.billingDetails?.name)].filter(Boolean);
  const namn = kandidater.find((n) => n.includes(" ")) ?? kandidater[0] ?? "";
  const { fornamn, efternamn } = delaNamn(namn);
  const pn = text(a.postal_code);
  return {
    epost: text(o.epost) || text(p.billingDetails?.email),
    telefon: text(p.billingDetails?.phone),
    fornamn,
    efternamn,
    gata: text(a.line1),
    rad2: text(a.line2),
    co: "",
    postnr: pn,
    ort: text(a.city),
    lan: lanFranText(a.state) ?? lanFranPostnr(pn) ?? "",
    kupong: o.kupong ?? "",
  };
}
