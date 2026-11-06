// lib/kassa/flode.ts
//
// Vår egen kassa (Leonards val 2026-11-05, efter att Wix mobilkassa hoppade och
// lämnade tomrum på iPhone): formuläret ligger på www.fyndplats.se/kassa,
// Wix räknar och skapar ordern, och kunden betalar på Wix betalsida med samma
// betalsätt och samma Wix Payments-konto som i dag.
//
// Flödet, uppmätt mot Wix 2026-11-06 00:00 UTC (testorder på pedalhinken,
// avbruten och återlagrad):
//   1. Besökarens Cart V2 får kontakt, leveransadress och fakturaadress.
//   2. Wix räknar korgen (`calculate`, med katalogen uppfräschad). Wix väljer
//      själv fraktsättet för adressen ("Spårbar standardleverans", fri från
//      500 kr), men korgen måste få det satt innan ordern går att skapa
//      (överträdelsen MISSING_DELIVERY_METHOD annars).
//   3. Ordern skapas ur korgen med Checkout V1 `create-order` (korgens id är
//      kassans id i V2). Ordern blir som Wix kassas egen: INITIALIZED, med
//      checkoutId, cartId, purchaseFlowId, moms och leveranstiden. Wix
//      reserverar lagret direkt.
//   4. En betalningsbegäran på totalen, med manuell betalning blockerad och
//      utgång efter BETALNING_MINUTER. Kunden skickas till dess sida.
//
// ☠️ ORDERN RESERVERAR LAGRET FRÅN STEG 3. En kund som aldrig betalar håller
// varan tills ordern avbryts med återlagring. Därför avbryter nästa försök från
// samma korg den förra ordern, och städjobbet avbryter de som löpt ut.
//
// ☠️ SAMMA KORG, SAMMA UPPGIFTER OCH SAMMA TOTAL GER SAMMA BETALSIDA. En kund
// som går tillbaka från betalsidan och trycker igen får sin väntande betalning,
// inte en ny order (Leonards prov 2026-11-06: varje nytt försök makulerade den
// förra länken, och Wix svarade 429 på den fjärde ordern på en halvtimme för
// samma köpare). Avtrycket av korgen och uppgifterna står sist i betalningens
// externalId; totalen jämförs med Wix räkning, så att ett sjunkande
// auktionspris aldrig betalas med det gamla, högre beloppet.
//
// ☠️ PRISET KOMMER BARA FRÅN WIX. Kunden skickar formuläret och korgens id,
// aldrig ett belopp. Beloppet på betalningsbegäran är Wix egen total för
// ordern som just skapades.
//
// Ren modul: Wix-anropen skickas in (lib/kassa/wix-kassa.ts gör dem på riktigt),
// så att node --test kan pröva varje gren.

export const BETALNING_MINUTER = 120;
/** Står först i betalningsbegärans source.externalId. Städjobbet känner igen våra på den. */
export const KASSA_MARKOR = "fp-kassa";

export interface Pengar {
  amount?: string;
}

export interface Leveranssatt {
  code?: string;
  appId?: string;
  title?: { original?: string };
}

export interface KorgRad {
  id?: string;
  name?: { original?: string; translated?: string };
  quantityInfo?: { confirmedQuantity?: number; requestedQuantity?: number; availableQuantity?: number };
  status?: string;
  source?: { catalogReference?: { catalogItemId?: string; options?: unknown } };
  /** Produktbilden som Wix sparar på raden (Cart V2): mediets id i sajtens Media Manager. */
  attributes?: { image?: { id?: string; altText?: string } };
}

export interface Korg {
  id?: string;
  lineItems?: KorgRad[];
  coupons?: { id?: string; code?: string }[];
  orderPlaced?: boolean;
  /** Ordern som skapades ur korgen (Cart V2 sätter den med orderPlaced). */
  orderId?: string;
  deliveryInfo?: { method?: Leveranssatt };
}

export interface Overtradelse {
  code?: string;
  description?: string;
  severity?: string;
  scope?: { type?: string; name?: string } | string;
}

export interface Rakning {
  cart?: Korg;
  summary?: {
    deliverySummary?: { method?: Leveranssatt; price?: Pengar };
    priceSummary?: { subtotal?: Pengar; discount?: Pengar; delivery?: Pengar; tax?: Pengar; total?: Pengar };
    violations?: Overtradelse[];
    spiViolations?: Overtradelse[];
    /** Wix bevis på att priserna inte ändrats; Place Order nekar om de gjort det (uppmätt 2026-11-06). */
    priceVerificationToken?: string;
  };
}

export interface Kund {
  epost: string;
  fornamn: string;
  efternamn: string;
  telefon: string;
  gata: string;
  /** Adressrad 2 som kunden skrev den (Stripes adressfält), utan "c/o". */
  rad2?: string;
  co: string;
  postnr: string;
  ort: string;
  /** Länet som ISO 3166-2 ("SE-N"); tomt när det inte gick att avgöra. */
  lan?: string;
  kupong: string;
}

/** Adressrad 2: c/o från kassans egna fält, annars raden ur Stripes adressfält som den skrevs. */
export function andraRaden(k: Pick<Kund, "co" | "rad2">): string {
  if (k.co) return `c/o ${k.co.replace(/^c\/o\s*/i, "")}`;
  return k.rad2 ?? "";
}

/**
 * Adressen på Wix-korgen (leverans och fakturering). Länet följer med som
 * `subdivision`: ordern bär det, och motorn fyller leverantörens provinsfält
 * med det (Aosoms klumporder, AliExpress). Utan län gissar Wix ur staden.
 */
export function wixAdress(k: Kund) {
  const rad2 = andraRaden(k);
  return {
    country: "SE",
    ...(k.lan && /^SE-[A-Z]{1,2}$/.test(k.lan) ? { subdivision: k.lan } : {}),
    city: k.ort,
    postalCode: k.postnr,
    addressLine: k.gata,
    ...(rad2 ? { addressLine2: rad2 } : {}),
  };
}

/** En tidigare betalning från samma korg, som kunden lämnade utan att betala. */
export interface Tidigare {
  orderId: string;
  betalningId: string;
}

export interface KassaDeps {
  hamtaKorg(cartId: string): Promise<Korg | null>;
  uppdateraKorg(cartId: string, kund: Kund): Promise<void>;
  laggTillKupong(cartId: string, kod: string): Promise<"ok" | "ogiltig">;
  /** Wix tar bort en kupong på dess id i korgen, inte på koden. */
  taBortKupong(cartId: string, kupongId: string): Promise<void>;
  rakna(cartId: string): Promise<Rakning>;
  sattLeverans(cartId: string, satt: { code: string; appId: string }): Promise<void>;
  skapaOrder(cartId: string): Promise<{ orderId: string }>;
  skapaBetalning(b: {
    orderId: string;
    belopp: string;
    titel: string;
    beskrivning: string;
    utgar: string;
    externtId: string;
    /** Första varans bild, som Wix visar på betalsidan. */
    bild?: { id: string; altText?: string } | null;
  }): Promise<{ id: string; url: string }>;
  /** Makulerar den förra betalningen och avbryter dess order med återlagring, om båda hör till korgen och inte är betalda. */
  slappTidigare(cartId: string, t: Tidigare): Promise<"slappt" | "ej_var" | "betald">;
  /** Kassans betalningar för korgen den senaste timmen (alla lägen), nyaste först. */
  korgensForsok(cartId: string, sedan: Date): Promise<Forsok[]>;
  /** Betalsidans adress för en befintlig betalning (Wix Get Order Payment Request URL). */
  betalsidansAdress(betalningId: string): Promise<string>;
}

/** En betalning från vår kassa, som nästa försök ser den. */
export interface Forsok {
  id: string;
  orderId: string;
  status: string;
  /** ISO-tid då länken slutar gälla. */
  utgar?: string;
  externtId?: string;
  /** Beloppet på betalningen, som Wix skriver det ("1159.00"). */
  belopp?: string;
}

/** En väntande betalning återanvänds bara om länken gäller minst så här länge till. */
export const ATERBRUK_MIN_KVAR_MINUTER = 15;

/** Fler försök än så från samma korg på en timme stoppas: varje försök reserverar lager. */
export const MAX_FORSOK_PER_TIMME = 8;

export type KassaUtfall =
  | { ok: true; url: string; orderId: string; betalningId: string; totalOre: number; utgar?: string; aterbrukad?: boolean }
  | { ok: false; kod: string; meddelanden: string[]; falt?: "kupong" | "postnr" };

/** Betalningens source.externalId: markören, korgen, försöket och avtrycket. Städjobbet och nästa försök känner igen den. */
export function kassaExterntId(cartId: string, forsok: string, avtryck?: string): string {
  return `${KASSA_MARKOR}:${cartId}:${forsok}${avtryck ? `:${avtryck}` : ""}`.slice(0, 100);
}

/** Avtrycket ur ett externalId från kassaExterntId, eller null för äldre betalningar utan avtryck. */
export function avtryckAv(externtId: string | undefined): string | null {
  const delar = (externtId ?? "").split(":");
  return delar.length === 4 && delar[0] === KASSA_MARKOR && /^[0-9a-f]{16}$/.test(delar[3]) ? delar[3] : null;
}

/** FNV-1a, 32 bitar, med valbar start: ren och utan importer. */
function fnv1a(text: string, start: number): number {
  let h = start >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** JSON med sorterade nycklar, så att samma val alltid ger samma text. */
function stabilJson(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stabilJson).join(",")}]`;
  if (v && typeof v === "object") {
    return `{${Object.keys(v as Record<string, unknown>)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stabilJson((v as Record<string, unknown>)[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v ?? null);
}

/**
 * Avtryck av det som gör ordern: varorna (vara, val, antal), kundens uppgifter
 * och rabattkoden. Samma avtryck betyder att den väntande ordern är samma köp.
 * 16 hextecken; inga uppgifter går att läsa ur det.
 */
export function korgAvtryck(korg: Korg, kund: Kund): string {
  const rader = (korg.lineItems ?? [])
    .map((r) => {
      const ref = r.source?.catalogReference;
      const antal = r.quantityInfo?.requestedQuantity ?? r.quantityInfo?.confirmedQuantity ?? 1;
      return `${ref?.catalogItemId ?? r.id ?? ""}|${stabilJson(ref?.options ?? null)}|${antal}`;
    })
    .sort();
  const uppgifter = [kund.epost.toLowerCase(), kund.fornamn, kund.efternamn, kund.telefon, kund.gata, kund.co, kund.postnr, kund.ort, kund.kupong.toLowerCase(), kund.rad2 ?? "", kund.lan ?? ""];
  const text = `${rader.join(";")}#${uppgifter.join("\u0001")}`;
  const hex = (n: number) => n.toString(16).padStart(8, "0");
  return hex(fnv1a(text, 0x811c9dc5)) + hex(fnv1a(text, 0x01000193 ^ 0x9e3779b9));
}

/** Hör betalningen till korgen? */
export function arKorgensBetalning(externtId: string | undefined, cartId: string): boolean {
  return (externtId ?? "").startsWith(`${KASSA_MARKOR}:${cartId}:`);
}

/** "1 159,00" eller "1159.00" → öre. Ett belopp som inte går att läsa blir null. */
export function oreAv(p: Pengar | undefined): number | null {
  const s = (p?.amount ?? "").trim();
  if (!/^-?\d+(\.\d{1,2})?$/.test(s)) return null;
  const [heltal, dec = ""] = s.replace("-", "").split(".");
  const ore = Number(heltal) * 100 + Number((dec + "00").slice(0, 2));
  return s.startsWith("-") ? -ore : ore;
}

/**
 * Wix överträdelser som stoppar köpet, med en text till kunden. Varningar
 * stoppar inte. Med `utanLager` hoppas lagerbristen över: när kundens egen
 * väntande order håller varan räknar Wix den som slut, fast den är kundens.
 */
export function stoppandeOvertradelser(r: Rakning, opts: { utanLager?: boolean } = {}): { meddelanden: string[]; falt?: "kupong" | "postnr" } {
  const ut: string[] = [];
  let falt: "kupong" | "postnr" | undefined;
  const lagg = (t: string) => {
    if (!ut.includes(t)) ut.push(t);
  };
  for (const v of r.summary?.violations ?? []) {
    if (v.severity !== "ERROR") continue;
    switch (v.code) {
      case "EMPTY_CART":
        lagg("Varukorgen är tom.");
        break;
      case "LINE_ITEMS_OUT_OF_STOCK":
        if (!opts.utanLager) lagg("En vara i varukorgen har tagit slut. Ta bort den eller minska antalet.");
        break;
      case "INVALID_COUPON_CODE":
        lagg("Rabattkoden finns inte.");
        falt = "kupong";
        break;
      case "INVALID_COUPON_STATUS":
        lagg("Rabattkoden gäller inte längre, eller inte för de här varorna.");
        falt = "kupong";
        break;
      case "INVALID_POSTAL_CODE":
        lagg("Postnumret finns inte.");
        falt = "postnr";
        break;
      case "MISSING_DELIVERY_ADDRESS":
        lagg("Skriv leveransadressen.");
        break;
      case "MISSING_DELIVERY_METHOD":
      case "DELIVERY_METHOD_NO_LONGER_AVAILABLE":
      case "DELIVERY_METHOD_NOT_APPLIED_TO_ALL_LINE_ITEMS":
        lagg("Vi kan inte leverera till den adressen. Kontrollera postnumret.");
        falt = falt ?? "postnr";
        break;
      case "MEMBERS_ONLY_ITEM":
        lagg("En vara i varukorgen kan bara köpas av medlemmar.");
        break;
      default:
        lagg("Varukorgen kunde inte räknas. Försök igen, eller kontakta oss om det inte går.");
    }
  }
  // Våra egna regler (motorns kassavalidering, till exempel postnummer dit
  // Aosom inte levererar) kommer med svensk text: den visas som den är.
  for (const v of r.summary?.spiViolations ?? []) {
    if (v.severity !== "ERROR") continue;
    lagg((v.description ?? "").trim() || "En vara i varukorgen kan inte levereras till den adressen.");
    falt = falt ?? "postnr";
  }
  for (const rad of opts.utanLager ? [] : r.cart?.lineItems ?? []) {
    const namn = (rad.name?.translated || rad.name?.original || "En vara").trim();
    if (rad.status === "OUT_OF_STOCK" || rad.status === "REMOVED_FROM_CATALOG") {
      lagg(`${namn} finns inte i lager längre. Ta bort den ur varukorgen.`);
    } else if (rad.status === "PARTIALLY_IN_STOCK") {
      const kvar = rad.quantityInfo?.availableQuantity;
      lagg(typeof kvar === "number" ? `${namn}: bara ${kvar} kvar i lager. Minska antalet.` : `${namn}: inte så många kvar i lager. Minska antalet.`);
    }
  }
  return { meddelanden: ut, ...(falt ? { falt } : {}) };
}

/**
 * Bilden på Wix betalsida: första varans bild ur korgen (ett id i sajtens
 * Media Manager, högst 200 tecken som Wix kräver). Null utan bild.
 */
export function betalBild(rader: KorgRad[]): { id: string; altText?: string } | null {
  for (const r of rader) {
    const id = (r.attributes?.image?.id ?? "").trim();
    if (!id || id.length > 200 || /^https?:/i.test(id)) continue;
    const alt = (r.attributes?.image?.altText || r.name?.translated || r.name?.original || "").trim().slice(0, 200);
    return alt ? { id, altText: alt } : { id };
  }
  return null;
}

/** Texten på Wix betalsida: varorna i korthet. Högst 300 tecken, Wix gräns. */
export function betalBeskrivning(rader: KorgRad[]): string {
  const namn = rader
    .map((r) => {
      const n = (r.name?.translated || r.name?.original || "").trim();
      const antal = r.quantityInfo?.confirmedQuantity ?? r.quantityInfo?.requestedQuantity ?? 1;
      return n ? (antal > 1 ? `${antal} × ${n}` : n) : "";
    })
    .filter(Boolean);
  if (namn.length === 0) return "Din beställning hos Fyndplats.";
  let text = namn[0];
  if (text.length > 120) text = `${text.slice(0, 117).trimEnd()}…`;
  if (namn.length > 1) text += ` och ${namn.length - 1} ${namn.length - 1 === 1 ? "vara" : "varor"} till`;
  return `${text}.`.slice(0, 300);
}

/**
 * Hela vägen från formulär till betalsida. Kastar bara när Wix felar på ett
 * sätt som inte är kundens: rutten fångar det och svarar med ett allmänt fel.
 */
export async function betala(
  deps: KassaDeps,
  inn: { cartId: string; kund: Kund; tidigare?: Tidigare | null; forsokId: string },
  nu: Date,
): Promise<KassaUtfall> {
  const { cartId, kund } = inn;
  // Korgen och korgens förra försök läses samtidigt: kunden väntar på båda.
  const [korg, forsok] = await Promise.all([deps.hamtaKorg(cartId), deps.korgensForsok(cartId, new Date(nu.getTime() - 3_600_000))]);
  if (!korg) return { ok: false, kod: "korg_saknas", meddelanden: ["Varukorgen finns inte längre. Gå tillbaka till butiken och lägg i varorna igen."] };
  if (korg.orderPlaced) return { ok: false, kod: "korg_bestalld", meddelanden: ["Den här varukorgen är redan beställd. Kolla din e-post för orderbekräftelsen."] };
  if ((korg.lineItems ?? []).length === 0) return { ok: false, kod: "korg_tom", meddelanden: ["Varukorgen är tom."] };

  // En betald betalning från samma korg betyder att kunden redan har köpt (Wix
  // webhook har bara inte hunnit avsluta korgen): en ny order vore ett dubbelköp.
  if (forsok.some((f) => f.status === "PAID")) {
    return { ok: false, kod: "redan_betald", meddelanden: ["Den här beställningen är redan betald. Kolla din e-post för orderbekräftelsen."] };
  }

  // Samma köp som en väntande betalning: kunden får samma betalsida, ingen ny order.
  const avtryck = korgAvtryck(korg, kund);
  const kvarMs = (f: Forsok) => Date.parse(f.utgar ?? "") - nu.getTime();
  const kandidat = forsok.find((f) => f.status === "UNPAID" && avtryckAv(f.externtId) === avtryck && kvarMs(f) > ATERBRUK_MIN_KVAR_MINUTER * 60_000);
  if (kandidat) {
    const kandidatOre = oreAv({ amount: kandidat.belopp });
    const nuOre = oreAv((await deps.rakna(cartId)).summary?.priceSummary?.total);
    if (kandidatOre !== null && kandidatOre === nuOre) {
      const andra: Tidigare[] = forsok
        .filter((f) => f.status === "UNPAID" && f.id !== kandidat.id)
        .map((f) => ({ orderId: f.orderId, betalningId: f.id }));
      if (inn.tidigare && inn.tidigare.orderId !== kandidat.orderId && !andra.some((t) => t.orderId === inn.tidigare!.orderId)) andra.push(inn.tidigare);
      for (const t of andra) {
        if ((await deps.slappTidigare(cartId, t)) === "betald") {
          return { ok: false, kod: "redan_betald", meddelanden: ["Den här beställningen är redan betald. Kolla din e-post för orderbekräftelsen."] };
        }
      }
      const url = await deps.betalsidansAdress(kandidat.id);
      return { ok: true, url, orderId: kandidat.orderId, betalningId: kandidat.id, totalOre: kandidatOre, utgar: kandidat.utgar, aterbrukad: true };
    }
  }

  // Ett nytt försök: varje försök reserverar lager, så korgen får högst
  // MAX_FORSOK_PER_TIMME i timmen.
  if (forsok.length >= MAX_FORSOK_PER_TIMME) {
    return { ok: false, kod: "for_manga", meddelanden: ["Du har försökt många gånger på kort tid. Vänta en stund, eller kontakta oss så hjälper vi dig."] };
  }
  // Förra betalningar från samma korg släpps före den nya ordern: annars
  // ligger två ordrar och reserverar samma varor, och en vara med ett enda
  // exemplar kvar går inte att beställa igen. Servern letar själv (webbläsaren
  // kan ha glömt dem, eller kunden bytt enhet), och kundens egen uppgift om
  // förra försöket släpps också.
  const attSlappa: Tidigare[] = forsok.filter((f) => f.status === "UNPAID").map((f) => ({ orderId: f.orderId, betalningId: f.id }));
  if (inn.tidigare && !attSlappa.some((t) => t.orderId === inn.tidigare!.orderId)) attSlappa.push(inn.tidigare);
  for (const t of attSlappa) {
    if ((await deps.slappTidigare(cartId, t)) === "betald") {
      return { ok: false, kod: "redan_betald", meddelanden: ["Den här beställningen är redan betald. Kolla din e-post för orderbekräftelsen."] };
    }
  }

  await deps.uppdateraKorg(cartId, kund);

  const forra = (korg.coupons ?? [])[0];
  const nuvarande = forra?.code ?? "";
  const byts = nuvarande.toLowerCase() !== kund.kupong.toLowerCase();
  if (nuvarande && byts && forra?.id) await deps.taBortKupong(cartId, forra.id);
  if (kund.kupong && byts) {
    if ((await deps.laggTillKupong(cartId, kund.kupong)) === "ogiltig") {
      return { ok: false, kod: "kupong", meddelanden: ["Rabattkoden finns inte eller gäller inte för de här varorna."], falt: "kupong" };
    }
  }

  let rakning = await deps.rakna(cartId);
  const satt = rakning.summary?.deliverySummary?.method;
  if (!satt?.code || !satt.appId) {
    return { ok: false, kod: "ingen_leverans", meddelanden: ["Vi kan inte leverera till den adressen. Kontrollera postnumret."], falt: "postnr" };
  }
  if (rakning.cart?.deliveryInfo?.method?.code !== satt.code) {
    await deps.sattLeverans(cartId, { code: satt.code, appId: satt.appId });
    rakning = await deps.rakna(cartId);
  }

  const stopp = stoppandeOvertradelser(rakning);
  if (stopp.meddelanden.length > 0) return { ok: false, kod: "overtradelse", ...stopp };

  const total = rakning.summary?.priceSummary?.total;
  const totalOre = oreAv(total);
  if (totalOre === null || totalOre <= 0) {
    return { ok: false, kod: "total", meddelanden: ["Ordern kunde inte räknas. Försök igen, eller kontakta oss om det inte går."] };
  }

  const { orderId } = await deps.skapaOrder(cartId);
  const utgar = new Date(nu.getTime() + BETALNING_MINUTER * 60_000).toISOString();
  const betalning = await deps.skapaBetalning({
    orderId,
    belopp: total!.amount!,
    titel: "Din beställning hos Fyndplats",
    beskrivning: betalBeskrivning(rakning.cart?.lineItems ?? korg.lineItems ?? []),
    utgar,
    externtId: kassaExterntId(cartId, inn.forsokId, avtryck),
    bild: betalBild(rakning.cart?.lineItems ?? korg.lineItems ?? []),
  });
  return { ok: true, url: betalning.url, orderId, betalningId: betalning.id, totalOre, utgar };
}

/**
 * Samma beroenden, men varje anrop tar tid: `tider[namn]` får en rad per anrop
 * (ms). Rutten loggar dem, så att det syns var kundens väntan går. Fel går
 * vidare som förut.
 */
export function medTider<T extends object>(deps: T, tider: Record<string, number[]>, klocka: () => number = Date.now): T {
  const ut: Record<string, unknown> = {};
  for (const [namn, f] of Object.entries(deps)) {
    if (typeof f !== "function") {
      ut[namn] = f;
      continue;
    }
    ut[namn] = async (...a: unknown[]) => {
      const t0 = klocka();
      try {
        return await (f as (...x: unknown[]) => Promise<unknown>)(...a);
      } finally {
        (tider[namn] ??= []).push(klocka() - t0);
      }
    };
  }
  return ut as T;
}

/** "rakna 1200+900, skapaOrder 1500": tiderna i anropsordning för loggen. */
export function tidrad(tider: Record<string, number[]>): string {
  return Object.entries(tider)
    .map(([namn, ms]) => `${namn} ${ms.join("+")}`)
    .join(", ");
}

/** Pauserna före varje nytt försök när Wix nekar ett anrop (429). */
export const OMFORSOK_MS = [700, 1500];

/**
 * Gör om ett anrop som Wix nekade. Wix svarar 429 när samma köpare skapar
 * många ordrar på kort tid (mätt 2026-11-06: den sjätte på en halvtimme för
 * samma e-post nekades, andra köpare gick igenom). Ett nekat anrop har inte
 * gjort något. Andra fel kastas direkt: en order som kanske skapades ska
 * aldrig skapas två gånger.
 */
export async function medOmforsok<T>(
  anrop: () => Promise<T>,
  arNekat: (e: unknown) => boolean,
  vantan: number[] = OMFORSOK_MS,
  sov: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await anrop();
    } catch (e) {
      if (!arNekat(e) || i >= vantan.length) throw e;
      await sov(vantan[i]);
    }
  }
}

/** Marginal efter utgången, så att en kund som trycker "Betala" i sista stund hinner. */
export const STADNING_MARGINAL_MINUTER = 15;

/** Hur länge en makulerad betalning prövas igen: ordern kan ha blivit kvar om avbrottet föll efter makuleringen. */
export const MAKULERAD_PROVAS_TIMMAR = 24;

/**
 * Betalningar från vår kassa vars order ska släppas: utgångna, eller obetalda
 * vars utgång passerats med marginal. En makulerad betalning prövas också i
 * ett dygn efter utgången: föll avbrottet av ordern efter makuleringen står
 * ordern annars kvar och håller varorna för alltid. De makulerade kommer sist,
 * så att de aldrig tränger undan de obetalda. Betalda rörs aldrig.
 */
export function attSlappa(
  betalningar: { id?: string; orderId?: string; status?: string; expirationDate?: string; source?: { externalId?: string } }[],
  nu: Date,
): { betalningId: string; orderId: string }[] {
  const grans = nu.getTime() - STADNING_MARGINAL_MINUTER * 60_000;
  const makuleradGrans = nu.getTime() - MAKULERAD_PROVAS_TIMMAR * 3_600_000;
  const ut: { betalningId: string; orderId: string }[] = [];
  const makulerade: { betalningId: string; orderId: string }[] = [];
  for (const b of betalningar) {
    if (!b.id || !b.orderId) continue;
    if (!(b.source?.externalId ?? "").startsWith(`${KASSA_MARKOR}:`)) continue;
    const utgang = Date.parse(b.expirationDate ?? "");
    if (!Number.isFinite(utgang) || utgang > grans) continue;
    if (b.status === "EXPIRED" || b.status === "UNPAID") ut.push({ betalningId: b.id, orderId: b.orderId });
    else if (b.status === "VOIDED" && utgang > makuleradGrans) makulerade.push({ betalningId: b.id, orderId: b.orderId });
  }
  return [...ut, ...makulerade];
}

// ─────────────────────────────────────────────────────────────────────────────
// Stripe-kassan (Leonards val 2026-11-06, efter auditen: Klarna är två av tre
// köp, och Wix betalsida lät Klarna-kunden skriva allt två gånger). Kort,
// Klarna, Apple Pay och Google Pay tas på vår sida med Stripe; Wix behåller
// pris, lager, order, mejl och motorns flöde.
//
// Ordningen, uppmätt mot Wix 2026-11-06 (Place Order på en förberedd korg gav
// en obetald order utan debitering, avbruten med återlagring direkt):
//   1. forberedStripe: korgen får kundens uppgifter och fraktsätt, Wix räknar,
//      och en PaymentIntent med Wix total och MANUELL dragning skapas eller
//      uppdateras. Kunden betalar i Stripes fält: beloppet reserveras.
//   2. slutforStripe (webhooken och kundens retur, vilken som kommer först):
//      Wix räknar igen; totalen måste vara den reserverade. Place Order med
//      Wix prisbevis skapar ordern ur korgen. Först då dras pengarna, och
//      betalningen registreras på ordern (Add Payments), som då blir betald.
//   3. Går ordern inte att skapa släpps reservationen: ingen kund betalar utan
//      order, och ingen obetald order blir liggande (Wix betalsidas problem).
//
// ☠️ CREATE ORDER (ecom/v1/orders) ANVÄNDS INTE: Wix tillåter fem anrop i
// timmen för appar som inte är publicerade. Place Order är kassans väg och
// ersätter Checkout V1 create-order, som tas bort 2027-02-01.
//
// ☠️ ETT LÅS PER BETALNING. Webhooken och kundens retur kommer ofta samtidigt.
// Låset (en Wix Data-rad med betalningens id) gör att bara en av dem skapar
// ordern; den andra svarar "pagar" och frågar igen. Låset bär steget, så att
// ett avbrott efter ordern fortsätter med dragningen i stället för att skapa
// en order till.
// ─────────────────────────────────────────────────────────────────────────────

/** Står i PaymentIntentens metadata.kalla: bara kassans egna betalningar slutförs. */
export const STRIPE_KALLA = "fp-kassa-stripe";

/** Ett lås som inte blivit klart på så här lång tid tas över (avbruten körning). */
export const STRIPE_LAS_MS = 120_000;

/** PaymentIntent: bara fälten kassan läser (Stripe API 2025-03-31.basil). */
export interface Avsikt {
  id: string;
  amount: number;
  amount_capturable: number;
  amount_received: number;
  currency: string;
  status: "requires_payment_method" | "requires_confirmation" | "requires_action" | "processing" | "requires_capture" | "canceled" | "succeeded";
  capture_method: "automatic" | "automatic_async" | "manual";
  client_secret: string | null;
  metadata: Record<string, string>;
  latest_charge: string | { id: string; payment_method_details?: { type?: string; card?: { wallet?: { type?: string } | null } | null } } | null;
  payment_method_types?: string[];
  /** Unix-sekunder. */
  created?: number;
}

export interface AvsiktParametrar {
  amount: number;
  currency: "sek";
  capture_method: "manual";
  automatic_payment_methods: { enabled: true };
  description: string;
  metadata: { kalla: string; cartId: string };
  // ☠️ Ingen `shipping` här: se avsiktParametrar.
}

/** Låsets rad: steget och ordern, så att en ny körning fortsätter där den förra slutade. */
export interface StripeLas {
  cartId: string;
  /** pagar: ingen order än. order: ordern finns, pengarna inte dragna. registrera: dragna, betalningen inte registrerad. klar. fel. */
  steg: "pagar" | "order" | "registrera" | "klar" | "fel";
  orderId?: string;
  at: number;
}

export interface StripeKassaDeps {
  hamtaKorg(cartId: string): Promise<Korg | null>;
  uppdateraKorg(cartId: string, kund: Kund): Promise<void>;
  laggTillKupong(cartId: string, kod: string): Promise<"ok" | "ogiltig">;
  taBortKupong(cartId: string, kupongId: string): Promise<void>;
  rakna(cartId: string): Promise<Rakning>;
  sattLeverans(cartId: string, satt: { code: string; appId: string }): Promise<void>;
  /** Cart V2 Place Order med Wix prisbevis: ordern ur korgen, obetald. */
  laggOrder(cartId: string, prisbevis: string | null): Promise<{ orderId: string }>;
  /** Add Payments: Stripes betalning som godkänd betalning på ordern. */
  registreraBetalning(orderId: string, b: { belopp: string; transaktion: string; namn: string; tid: string }): Promise<void>;
  /** Place Orders väntande platshållare markeras avbruten (platshallarbetalningar); antalet. */
  avbrytPlatshallare?(orderId: string): Promise<number>;
  /**
   * Betalningarna som redan står på ordern, som transaktions-id (List
   * Transactions). Add Payments nekar en dubblett och gör då ingenting, och en
   * order med en främmande betalning är betald någon annanstans.
   */
  orderBetalningar(orderId: string): Promise<string[]>;
  /** Avbryter en order som aldrig blev betald, med återlagring och utan mejl. */
  avbrytOrder(orderId: string): Promise<void>;
  skapaAvsikt(p: AvsiktParametrar, idempotens: string): Promise<Avsikt>;
  uppdateraAvsikt(id: string, p: Omit<AvsiktParametrar, "currency" | "capture_method" | "automatic_payment_methods">): Promise<Avsikt>;
  /** Med latest_charge utbyggd, så att betalsättet syns. */
  hamtaAvsikt(id: string): Promise<Avsikt | null>;
  dra(id: string, ore: number): Promise<Avsikt>;
  slappAvsikt(id: string): Promise<void>;
  aterbetala(id: string): Promise<void>;
  markeraAvsikt(id: string, orderId: string): Promise<void>;
  /** "tagen" när låset skapades nu, annars raden som redan fanns. */
  tagLas(avsiktId: string, las: StripeLas): Promise<"tagen" | StripeLas>;
  sparaLas(avsiktId: string, las: StripeLas): Promise<void>;
  logg?(rad: string): void;
}

/** Hur betalningen gjordes, med kundens ord (Wix visar det på ordern och i panelen). */
export function betalsattsnamn(a: Pick<Avsikt, "latest_charge" | "payment_method_types">): string {
  const laddning = typeof a.latest_charge === "object" && a.latest_charge ? a.latest_charge : null;
  const typ = laddning?.payment_method_details?.type ?? (a.payment_method_types?.length === 1 ? a.payment_method_types[0] : undefined);
  const planbok = laddning?.payment_method_details?.card?.wallet?.type;
  if (typ === "klarna") return "Klarna";
  if (typ === "swish") return "Swish";
  if (typ === "card" && planbok === "apple_pay") return "Apple Pay";
  if (typ === "card" && planbok === "google_pay") return "Google Pay";
  if (typ === "card") return "Kort";
  return "Stripe";
}

/** Laddningens id (Stripes transaktion, som Wix sparar på ordern), eller null. */
export function laddningsId(a: Pick<Avsikt, "latest_charge">): string | null {
  if (!a.latest_charge) return null;
  return typeof a.latest_charge === "string" ? a.latest_charge : a.latest_charge.id;
}

/** Öre → "659.00", som Wix skriver belopp. */
export function kronorAv(ore: number): string {
  const tecken = ore < 0 ? "-" : "";
  const a = Math.abs(Math.round(ore));
  return `${tecken}${Math.floor(a / 100)}.${String(a % 100).padStart(2, "0")}`;
}

/**
 * Kundens adress som Stripe vill ha den i faktureringen (faktureringAv).
 * Leveransen på betalningen sätter adressfältet i webbläsaren vid
 * bekräftelsen (se avsiktParametrar).
 */
function stripeAdress(k: Pick<Kund, "gata" | "co" | "rad2" | "postnr" | "ort">) {
  return {
    line1: k.gata,
    line2: andraRaden(k),
    city: k.ort,
    postal_code: k.postnr.replace(/\s/g, ""),
    country: "SE" as const,
  };
}

/** Faktureringsuppgifterna som kassasidan skickar med stripe.confirmPayment. */
export interface Fakturering {
  name: string;
  email: string;
  phone: string;
  address: { line1: string; line2: string; city: string; state: string; postal_code: string; country: "SE" };
}

/**
 * Betalfältet frågar aldrig efter namn och adress (`billingDetails: "never"`,
 * lib/kassa/stripe-klient.ts): kunden har redan skrivit dem. Då kräver Stripe
 * VARJE fält i bekräftelsen, också de som inte används i Sverige (state, och
 * line2 utan c/o): ett saknat fält stoppar betalningen. Servern bygger dem, så
 * att adressen bara formas här.
 */
export function faktureringAv(k: Kund): Fakturering {
  return {
    name: `${k.fornamn} ${k.efternamn}`.trim(),
    email: k.epost,
    phone: k.telefon,
    address: { ...stripeAdress(k), state: "" },
  };
}

/**
 * PaymentIntentens innehåll: Wix total, dragningen och korgen.
 *
 * ☠️ ALDRIG `shipping` från servern. Adressfältet (Address Element, läget
 * "shipping") ligger i samma Elements som betalfältet, och stripe.confirmPayment
 * skickar dess adress som betalningens leverans. Har servern satt `shipping`
 * med den hemliga nyckeln nekar Stripe bekräftelsen med 400
 * `payment_intent_invalid_parameter` ("The shipping information on this
 * PaymentIntent was last set with a secret key and therefore cannot be changed
 * with a publishable key"), och ingen betalning går igenom. Mätt på
 * förhandslänken 2026-11-06 16:06 UTC: varje betalning stoppades så sedan
 * adressfältet kom in (2b241635). Adressfältet måste ligga i samma Elements som
 * betalfältet för att Googles förslag ska vara gratis.
 */
export function avsiktParametrar(cartId: string, totalOre: number, rader: KorgRad[]): AvsiktParametrar {
  return {
    amount: totalOre,
    currency: "sek",
    capture_method: "manual",
    automatic_payment_methods: { enabled: true },
    description: betalBeskrivning(rader).slice(0, 300),
    metadata: { kalla: STRIPE_KALLA, cartId },
  };
}

export type ForberedUtfall =
  | { ok: true; avsiktId: string; clientSecret: string; totalOre: number; fakturering: Fakturering }
  | { ok: true; avsiktId: string; redanBetald: true }
  | { ok: false; kod: string; meddelanden: string[]; falt?: "kupong" | "postnr" };

/** En PaymentIntent som går att uppdatera: kunden har inte betalat ännu. */
const OBETALD = new Set<Avsikt["status"]>(["requires_payment_method", "requires_confirmation", "requires_action"]);

/**
 * Formuläret → Wix räkning → en PaymentIntent på Wix total. Samma korg och
 * samma kund får samma PaymentIntent (uppdaterad om totalen ändrats); är den
 * redan betald säger svaret det, så att kunden slutför i stället för att
 * betala igen. Kastar bara när Wix eller Stripe felar på ett sätt som inte är
 * kundens.
 */
export async function forberedStripe(
  deps: StripeKassaDeps,
  inn: { cartId: string; kund: Kund; avsiktId?: string | null },
): Promise<ForberedUtfall> {
  const { cartId, kund } = inn;
  const [korg, forra] = await Promise.all([
    deps.hamtaKorg(cartId),
    inn.avsiktId ? deps.hamtaAvsikt(inn.avsiktId).catch(() => null) : Promise.resolve(null),
  ]);
  if (!korg) return { ok: false, kod: "korg_saknas", meddelanden: ["Varukorgen finns inte längre. Gå tillbaka till butiken och lägg i varorna igen."] };
  if (korg.orderPlaced) return { ok: false, kod: "korg_bestalld", meddelanden: ["Den här varukorgen är redan beställd. Kolla din e-post för orderbekräftelsen."] };
  if ((korg.lineItems ?? []).length === 0) return { ok: false, kod: "korg_tom", meddelanden: ["Varukorgen är tom."] };

  const egen = forra && forra.metadata?.kalla === STRIPE_KALLA && forra.metadata?.cartId === cartId ? forra : null;
  if (egen && (egen.status === "requires_capture" || egen.status === "succeeded" || egen.status === "processing")) {
    return { ok: true, avsiktId: egen.id, redanBetald: true };
  }

  await deps.uppdateraKorg(cartId, kund);
  const forraKod = (korg.coupons ?? [])[0];
  const nuvarande = forraKod?.code ?? "";
  const byts = nuvarande.toLowerCase() !== kund.kupong.toLowerCase();
  if (nuvarande && byts && forraKod?.id) await deps.taBortKupong(cartId, forraKod.id);
  if (kund.kupong && byts && (await deps.laggTillKupong(cartId, kund.kupong)) === "ogiltig") {
    return { ok: false, kod: "kupong", meddelanden: ["Rabattkoden finns inte eller gäller inte för de här varorna."], falt: "kupong" };
  }

  let rakning = await deps.rakna(cartId);
  const satt = rakning.summary?.deliverySummary?.method;
  if (!satt?.code || !satt.appId) {
    return { ok: false, kod: "ingen_leverans", meddelanden: ["Vi kan inte leverera till den adressen. Kontrollera postnumret."], falt: "postnr" };
  }
  if (rakning.cart?.deliveryInfo?.method?.code !== satt.code) {
    await deps.sattLeverans(cartId, { code: satt.code, appId: satt.appId });
    rakning = await deps.rakna(cartId);
  }
  const stopp = stoppandeOvertradelser(rakning);
  if (stopp.meddelanden.length > 0) return { ok: false, kod: "overtradelse", ...stopp };
  const totalOre = oreAv(rakning.summary?.priceSummary?.total);
  if (totalOre === null || totalOre <= 0) {
    return { ok: false, kod: "total", meddelanden: ["Ordern kunde inte räknas. Försök igen, eller kontakta oss om det inte går."] };
  }

  const p = avsiktParametrar(cartId, totalOre, rakning.cart?.lineItems ?? korg.lineItems ?? []);
  if (egen && OBETALD.has(egen.status)) {
    // Valuta, dragning och betalsätt går inte att ändra på en befintlig betalning.
    const a = await deps.uppdateraAvsikt(egen.id, { amount: p.amount, description: p.description, metadata: p.metadata });
    if (a.client_secret) return { ok: true, avsiktId: a.id, clientSecret: a.client_secret, totalOre, fakturering: faktureringAv(kund) };
  }
  // En ny betalning får en egen nyckel. ☠️ INTE en nyckel ur korgens innehåll:
  // Stripe svarar på en känd nyckel med det SPARADE svaret i ett dygn, också när
  // betalningen sedan släppts. Ett nytt försök efter "Beställningen kunde inte
  // skapas" (samma korg, kund och total) hade fått tillbaka den släppta
  // betalningen och aldrig kunnat betala. Dubbeltrycket stoppas i kassasidan,
  // och kundens försök återanvänds via avsiktId (uppdateras ovan).
  const a = await deps.skapaAvsikt(p, `fp-kassa-${cartId}-${crypto.randomUUID()}`);
  if (!a.client_secret) throw new Error("Stripe gav ingen client_secret");
  return { ok: true, avsiktId: a.id, clientSecret: a.client_secret, totalOre, fakturering: faktureringAv(kund) };
}

export type SlutforUtfall =
  /** ofullstandig: pengarna är dragna och ordern finns, men betalningen står inte på ordern än. Tas om (webhooken och nätet). */
  | { ok: true; orderId: string; ofullstandig?: true }
  /** ostadad: ingen order, men reservationen släpptes inte (eller den dragna betalningen gick inte tillbaka). Tas om. */
  | { ok: false; kod: "okand" | "ej_betald" | "behandlas" | "pagar" | "pris_andrat" | "slut" | "fel"; meddelanden: string[]; ostadad?: true };

/**
 * Inget mer finns att göra för betalningen: ordern är klar med betalningen på,
 * eller det blev ingen order och pengarna är släppta (eller inte kassans).
 */
export function arKlart(u: SlutforUtfall): boolean {
  if (u.ok) return !u.ofullstandig;
  return u.kod !== "pagar" && u.kod !== "behandlas" && !u.ostadad;
}

/**
 * Webhookens svar till Stripe, som styr omförsöken: 2xx = klart, annat = Stripe
 * försöker igen (i upp till tre dygn). ☠️ "Klart" får bara svaras när inget
 * mer finns att göra (arKlart): en betalning som inte står på ordern, som inte
 * släpptes eller som någon annan håller på med ska tas om, annars tar ingen om
 * den (kunden har redan gått vidare).
 */
export function webhookStatus(u: SlutforUtfall): number {
  if (arKlart(u)) return 200;
  return !u.ok && (u.kod === "pagar" || u.kod === "behandlas") ? 503 : 500;
}

/** Utfallet som ett ord för loggen (inga id, belopp eller kunduppgifter). */
export function utfallLage(u: SlutforUtfall): string {
  if (u.ok) return u.ofullstandig ? "ofullstandig" : "ok";
  return u.ostadad ? `${u.kod}-ostadad` : u.kod;
}

/** Nätet tar betalningar som legat godkända utan order så här länge (det vanliga flödet tar sekunder). */
export const NAT_EFTER_SEK = 5 * 60;
/** Ligger en betalning kvar så här länge får Leonard ett mejl. */
export const NAT_LARM_SEK = 30 * 60;

/**
 * Nätet: kassans betalningar som är godkända (eller dragna) men saknar order,
 * äldre än NAT_EFTER_SEK, äldst först (de är närmast larmet). `larm` är de som
 * passerat NAT_LARM_SEK inom det senaste kvarteret, så att samma betalning ger
 * ett mejl, inte ett i kvarten; nätet larmar bara för dem som inte blev klara.
 * En betalning som behandlas ("processing") väntar på Stripes nästa händelse.
 */
export function attSlutfora(
  avsikter: Pick<Avsikt, "id" | "status" | "metadata" | "created">[],
  nuSek: number,
): { ids: string[]; larm: string[] } {
  const traffar: { id: string; alder: number }[] = [];
  for (const a of avsikter) {
    if (a.metadata?.kalla !== STRIPE_KALLA || a.metadata?.wixOrderId) continue;
    if (a.status !== "requires_capture" && a.status !== "succeeded") continue;
    const alder = nuSek - (a.created ?? nuSek);
    if (alder >= NAT_EFTER_SEK) traffar.push({ id: a.id, alder });
  }
  traffar.sort((x, y) => y.alder - x.alder);
  return {
    ids: traffar.map((t) => t.id),
    larm: traffar.filter((t) => t.alder >= NAT_LARM_SEK && t.alder < NAT_LARM_SEK + 15 * 60).map((t) => t.id),
  };
}

const TEXT_PAGAR = "Vi slutför din beställning. Ett ögonblick.";
const TEXT_EJ_DRAGEN = "Ingen betalning drogs. Försök igen, eller kontakta oss om det inte går.";
const TEXT_BETALD_ANNANSTANS = "Den här varukorgen är redan beställd och betald. Ingen betalning drogs här. Kolla din e-post för orderbekräftelsen.";

/**
 * Den reserverade betalningen → en betald order i Wix. Idempotent: webhooken
 * och kundens retur kan anropa samtidigt och hur många gånger som helst.
 * Kastar aldrig efter att pengarna dragits; ett fel därefter loggas och tas om
 * av nästa anrop (låset står då på "registrera").
 */
export async function slutforStripe(deps: StripeKassaDeps, avsiktId: string, nu: Date): Promise<SlutforUtfall> {
  const logg = deps.logg ?? (() => {});
  const a = await deps.hamtaAvsikt(avsiktId);
  const cartId = a?.metadata?.cartId;
  if (!a || !cartId || a.metadata?.kalla !== STRIPE_KALLA) return { ok: false, kod: "okand", meddelanden: ["Betalningen hittades inte."] };
  if (a.metadata.wixOrderId) return { ok: true, orderId: a.metadata.wixOrderId };
  if (a.status === "processing") return { ok: false, kod: "behandlas", meddelanden: ["Betalningen behandlas. Ett ögonblick."] };
  if (a.status !== "requires_capture" && a.status !== "succeeded") {
    return { ok: false, kod: "ej_betald", meddelanden: ["Betalningen är inte genomförd. Välj ett betalsätt och försök igen."] };
  }
  const dragenFran = a.status === "succeeded";
  const nuMs = nu.getTime();

  let las: StripeLas = { cartId, steg: "pagar", at: nuMs };
  const tagen = await deps.tagLas(a.id, las);
  const omtag = tagen !== "tagen";
  if (tagen !== "tagen") {
    if (tagen.steg === "klar" && tagen.orderId) {
      // Klart, men betalningen saknar orderns id (markeringen föll förra gången):
      // märk den nu, annars tar nätet den om var femtonde minut och larmar i onödan.
      await deps.markeraAvsikt(a.id, tagen.orderId).catch((e) => logg(`[kassa] metadata på betalningen: ${e instanceof Error ? e.message.slice(0, 120) : e}`));
      return { ok: true, orderId: tagen.orderId };
    }
    if (tagen.steg === "fel") {
      // Ingen order för den här betalningen, och kunden fick höra att inget
      // drogs. Står pengarna ändå kvar (släppet eller återbetalningen föll, eller
      // dragningen hann gå igenom efter att läget lästs) görs det om här;
      // Stripes idempotensnyckel gör det en gång.
      try {
        if (a.status === "succeeded") await deps.aterbetala(a.id);
        else await deps.slappAvsikt(a.id);
      } catch (e) {
        logg(`[kassa] ☠️ betalningen utan order kunde inte ${a.status === "succeeded" ? "betalas tillbaka" : "släppas"} (tas om): ${e instanceof Error ? e.message.slice(0, 200) : e}`);
        return { ok: false, kod: "fel", meddelanden: [TEXT_EJ_DRAGEN], ostadad: true };
      }
      return { ok: false, kod: "fel", meddelanden: [TEXT_EJ_DRAGEN] };
    }
    if (nuMs - tagen.at < STRIPE_LAS_MS) return { ok: false, kod: "pagar", meddelanden: [TEXT_PAGAR] };
    las = { ...tagen, at: nuMs };
    await deps.sparaLas(a.id, las);
    logg(`[kassa] tar över ett lås i steget ${tagen.steg}`);
  }

  // Tillbaka till kunden utan order: reservationen släpps, eller en redan
  // dragen betalning (betalsätt utan manuell dragning) betalas tillbaka.
  const backa = async (kod: "pris_andrat" | "slut" | "fel", meddelanden: string[]): Promise<SlutforUtfall> => {
    let ostadad = false;
    try {
      if (dragenFran) await deps.aterbetala(a.id);
      else await deps.slappAvsikt(a.id);
    } catch (e) {
      ostadad = true;
      logg(`[kassa] ☠️ kunde inte ${dragenFran ? "betala tillbaka" : "släppa"} betalningen (tas om): ${e instanceof Error ? e.message.slice(0, 200) : e}`);
    }
    await deps.sparaLas(a.id, { ...las, steg: "fel" }).catch(() => {});
    return ostadad ? { ok: false, kod, meddelanden, ostadad: true } : { ok: false, kod, meddelanden };
  };

  // Ordern som Place Order skapade, läst ur korgen (Wix sätter orderPlaced och
  // orderId): för när svaret aldrig kom fram (en timeout, ett 5xx) eller när
  // försöket dog innan låset sparades. Kastar om korgen inte går att läsa, så
  // att nästa försök avgör. ☠️ En order som redan har en betalning är inte vår
  // (korgen betaldes i Wix kassa i en annan flik): "betald", och vår släpps.
  const ordernPaKorgen = async (): Promise<string | "betald" | null> => {
    const korg = await deps.hamtaKorg(cartId);
    if (!korg?.orderPlaced || !korg.orderId) return null;
    return (await deps.orderBetalningar(korg.orderId)).length > 0 ? "betald" : korg.orderId;
  };

  let orderId = las.orderId;
  let reserverat = dragenFran ? a.amount_received : a.amount_capturable;
  if (!orderId && omtag) {
    const fran = await ordernPaKorgen();
    if (fran === "betald") return backa("fel", [TEXT_BETALD_ANNANSTANS]);
    if (fran) {
      logg("[kassa] ordern fanns redan på korgen; den används");
      orderId = fran;
      las = { ...las, steg: "order", orderId };
      await deps.sparaLas(a.id, las);
    }
  }
  if (!orderId) {
    const rakning = await deps.rakna(cartId);
    const totalOre = oreAv(rakning.summary?.priceSummary?.total);
    if (totalOre === null || totalOre !== reserverat) {
      logg(`[kassa] totalen ${totalOre} öre skiljer sig från det reserverade ${reserverat} öre`);
      return backa("pris_andrat", [`Priset ändrades medan du betalade. ${TEXT_EJ_DRAGEN}`]);
    }
    const stopp = stoppandeOvertradelser(rakning);
    if (stopp.meddelanden.length > 0) return backa("slut", [...stopp.meddelanden, TEXT_EJ_DRAGEN]);
    try {
      orderId = (await deps.laggOrder(cartId, rakning.summary?.priceVerificationToken ?? null)).orderId;
    } catch (e) {
      logg(`[kassa] Place Order föll: ${e instanceof Error ? e.message.slice(0, 300) : e}`);
      // Ett 4xx (också 429 efter omförsöken) betyder att ingen order skapades.
      // Annars är utfallet okänt, och korgen säger om ordern ändå finns.
      const status = (e as { status?: unknown } | null)?.status;
      const avgjort = typeof status === "number" && status >= 400 && status < 500;
      const fran = avgjort ? null : await ordernPaKorgen();
      if (fran === "betald") return backa("fel", [TEXT_BETALD_ANNANSTANS]);
      if (!fran) return backa("fel", [`Beställningen kunde inte skapas. ${TEXT_EJ_DRAGEN}`]);
      logg("[kassa] Place Order svarade inte, men ordern finns på korgen; den används");
      orderId = fran;
    }
    las = { ...las, steg: "order", orderId };
    await deps.sparaLas(a.id, las);
  }

  let dragen: Avsikt = a;
  if (las.steg === "order" || las.steg === "pagar") {
    if (!dragenFran) {
      try {
        dragen = await deps.dra(a.id, reserverat);
      } catch (e) {
        logg(`[kassa] dragningen föll: ${e instanceof Error ? e.message.slice(0, 300) : e}`);
        // ☠️ Felet kan ha kommit EFTER att Stripe drog pengarna (svaret nådde oss
        // inte). Läget läses färskt innan ordern avbryts: annars betalar kunden
        // för en avbruten order.
        const farsk = await deps.hamtaAvsikt(a.id).then(
          (x) => x,
          () => undefined,
        );
        if (farsk === undefined) {
          // Okänt läge: varken avbryt eller släpp. Låset står kvar på "order", och
          // nästa försök (webhooken, nätet) drar med samma nyckel och ser utfallet.
          throw new Error("dragningen föll och betalningens läge gick inte att läsa");
        }
        if (farsk?.status === "succeeded") {
          logg("[kassa] dragningen hade gått igenom trots felet; ordern behålls");
          dragen = farsk;
        } else {
          try {
            await deps.avbrytOrder(orderId!);
          } catch (e2) {
            logg(`[kassa] ordern kunde inte avbrytas efter misslyckad dragning: ${e2 instanceof Error ? e2.message.slice(0, 200) : e2}`);
          }
          return backa("fel", [`Betalningen kunde inte genomföras. ${TEXT_EJ_DRAGEN}`]);
        }
      }
      reserverat = dragen.amount_received || reserverat;
    }
    las = { ...las, steg: "registrera" };
    await deps.sparaLas(a.id, las);
  }

  // Pengarna är dragna och ordern finns: härifrån svarar vi alltid ok till
  // kunden. Står betalningen inte på ordern blir svaret ofullstandig, och
  // webhooken (500 → Stripe försöker igen) och nätet (/api/cron/kassa-stripe)
  // tar om det. Låset står då på "registrera".
  const transaktion = laddningsId(dragen) ?? a.id;
  try {
    // Ett tidigare försök kan ha registrerat betalningen utan att hinna spara
    // låset, och Add Payments nekar en dubblett: vid omtag läses ordern först.
    // (Wix sparar högst 100 tecken; Stripes id är under 30.)
    const finns = omtag ? (await deps.orderBetalningar(orderId!)).includes(transaktion.slice(0, 100)) : false;
    if (!finns) {
      await deps.registreraBetalning(orderId!, {
        belopp: kronorAv(reserverat),
        transaktion,
        namn: betalsattsnamn(dragen),
        tid: nu.toISOString(),
      });
    }
  } catch (e) {
    logg(`[kassa] ☠️ betalningen registrerades inte på ordern (tas om): ${e instanceof Error ? e.message.slice(0, 300) : e}`);
    return { ok: true, orderId: orderId!, ofullstandig: true };
  }
  // Ordern är betald av vår betalning; Place Orders väntande platshållare är
  // bara skräp i panelen. Faller det står den kvar, och inget annat påverkas.
  if (deps.avbrytPlatshallare) {
    await deps
      .avbrytPlatshallare(orderId!)
      .catch((e) => logg(`[kassa] platshållarbetalningen står kvar på ordern: ${e instanceof Error ? e.message.slice(0, 120) : e}`));
  }
  await deps.markeraAvsikt(a.id, orderId!).catch((e) => logg(`[kassa] metadata på betalningen: ${e instanceof Error ? e.message.slice(0, 120) : e}`));
  await deps.sparaLas(a.id, { ...las, steg: "klar" }).catch(() => {});
  return { ok: true, orderId: orderId! };
}

// ─────────────────────────────────────────────────────────────────────────────
// Återbetalningar för Stripe-kassans ordrar (2026-11-06)
//
// Leonard återbetalar i Wix som för alla andra ordrar: där väljs raderna och
// frakten, och medlemskapets orderliggare läser uppdelningen per rad.
// Stripe-betalningen står på ordern som en offlinebetalning med Stripes id
// (registreraBetalning, `offlinePayment: true`; som onlinebetalning nekade Wix
// all återbetalning, uppmätt i slutprovet 2026-11-06): Wix bokför
// återbetalningen som manuell, men pengarna ligger i Stripe. Butiken speglar
// den: summan av Wix lyckade återbetalningar på betalningen jämförs med vad
// Stripe redan betalat tillbaka på laddningen, och skillnaden betalas tillbaka
// i Stripe. Wix-webhooken (refund) gör det direkt; nätet
// (/api/cron/kassa-stripe) tar det som blev liggande och larmar.
//
// ☠️ BARA AUKTORITATIV DATA. Wix-webhooken bär ett order-id och kan vara
// lookup-verifierad, inte signerad: beloppen läses alltid ur orderns
// transaktioner i Wix och laddningen i Stripe, aldrig ur meddelandet. Ett
// påhittat meddelande kan bara få butiken att göra det Wix redan säger.
//
// ☠️ EN GÅNG. Idempotensnyckeln är laddningen och det Stripe redan betalat
// tillbaka (fp-ater-<laddning>-<öre i Stripe>), inte Wix summa. Två
// speglingar som läst samma läge i Stripe (webhooken och nätet, eller två
// återbetalningar i Wix tätt efter varandra) får samma nyckel, och Stripe gör
// bara en av dem: samma belopp ger samma svar igen, ett annat belopp nekas, och
// den nekade läser om båda sidor och försöker igen. Efter en återbetalning är
// Stripes summa en annan, och nästa nyckel också. Med Wix summa i nyckeln
// skulle två speglingar som läst olika Wix-summor men samma Stripe-summa båda
// gå igenom, och kunden få tillbaka för mycket. Skillnaden räknas alltid mot
// Stripes egen summa, så en spegling som redan är gjord gör ingenting.
//
// ☠️ STRIPE FÖRE WIX LARMAR, rättas inte. Det som betalats tillbaka i Stripes
// panel har ingen uppdelning per rad att bokföra; det görs i Wix av en
// människa. Därför: återbetala bara i Wix.
// ─────────────────────────────────────────────────────────────────────────────

/** En betalning på ordern (List Transactions For Single Order): fälten speglingen läser. */
export interface WixOrderBetalning {
  id?: string;
  amount?: Pengar;
  status?: string;
  regularPaymentDetails?: { providerTransactionId?: string; offlinePayment?: boolean; paymentOrderId?: string };
}

/**
 * Place Orders egen betalning: Wix lägger en väntande betalning på hela
 * beloppet, kopplad till en Wix Payments-order och utan leverantörens id, som
 * ingen betalar (kunden betalade i Stripe). Uppmätt i slutprovet 2026-11-06
 * (provordern): ordern blir ändå betald av vår betalning (saldo 0), men
 * panelen visar en väntande betalning. Den markeras avbruten när vår betalning
 * står på ordern (avbrytPlatshallare i wix-kassa.ts; Update Payment Status
 * CANCELED gick igenom på provordern). Bara väntande, online, med Wix order-id och
 * utan leverantörens id: en betalning med pengar bakom rörs aldrig.
 */
export function platshallarbetalningar(t: OrderTransaktioner): string[] {
  return t.payments
    .filter((p) => {
      const d = p.regularPaymentDetails;
      return Boolean(p.id) && p.status === "PENDING" && !!d && !d.offlinePayment && !d.providerTransactionId && Boolean(d.paymentOrderId);
    })
    .map((p) => p.id!);
}

/** En återbetalning på ordern, med en transaktion per betalning den gäller. */
export interface WixOrderAterbetalning {
  id?: string;
  transactions?: { paymentId?: string; amount?: Pengar; refundStatus?: string }[];
}

export interface OrderTransaktioner {
  payments: WixOrderBetalning[];
  refunds: WixOrderAterbetalning[];
}

/** Stripes laddning med betalningens metadata (lib/kassa/stripe.ts, hamtaLaddning). */
export interface Laddning {
  id: string;
  /** Dragna öre. */
  dragetOre: number;
  /** Återbetalda öre, också de som pågår. */
  aterbetaltOre: number;
  valuta: string;
  /** Kunden har bestridit betalningen: Stripe tar inga återbetalningar då. */
  tvist: boolean;
  /** Betalningens metadata: kalla, cartId och (efter ordern) wixOrderId. */
  metadata: Record<string, string>;
  /** Unix-sekunder för den senaste återbetalningen i Stripe, eller null. */
  senastAterbetaldSek: number | null;
}

/** En Stripe-betalning på ordern och vad Wix säger är återbetalt på den. */
export interface WixStripeBetalning {
  betalningId: string;
  /** Stripes id som kassan sparade på ordern (laddningen, annars betalningen). */
  transaktion: string;
  beloppOre: number | null;
  /** Summan av Wix lyckade återbetalningar på betalningen. */
  aterbetaltOre: number;
  /** En återbetalning i Wix väntar på sitt utfall. */
  pagar: boolean;
  /** En återbetalning har ett belopp som inte går att läsa. */
  okant: boolean;
}

export type AterLarmskal = "inte_kassans" | "annan_order" | "okant_belopp" | "olika_belopp" | "over_beloppet" | "tvist" | "stripe_fore_wix" | "fel";

export type Speglingsbeslut =
  | { gor: "inget"; skal: "lika" | "inte_var" }
  | { gor: "vanta" }
  | { gor: "larm"; skal: Exclude<AterLarmskal, "fel"> }
  | { gor: "aterbetala"; ore: number; nyckel: string };

/** Står i återbetalningens metadata.kalla i Stripe: speglad från Wix. */
export const STRIPE_ATER_KALLA = "fp-kassa-ater";

const WIX_ATER_PAGAR = new Set(["PENDING", "STARTED", "SCHEDULED"]);

/** Stripes id för en laddning (ch_, py_) eller en betalning (pi_), som kassan sparar på ordern. */
export function arStripeTransaktion(id: string | undefined): id is string {
  return typeof id === "string" && /^(ch|py|pi)_[A-Za-z0-9]+$/.test(id);
}

/**
 * Orderns betalningar med Stripes id, med det Wix säger är återbetalt på var
 * och en. Wix egna betalningar (Wix Payments, Klarna via Wix) bär Wix och
 * leverantörens id och hoppas över; en med ett Stripe-likt id som inte är vår
 * hittas inte i vårt Stripe-konto (speglingsbeslut "inte_var"). Kassan
 * registrerar sina betalningar som offline (registreraBetalning), så offline
 * räknas: Wix behåller Stripes id på dem (uppmätt 2026-11-06). En
 * offlinebetalning utan Stripes id (kontant, bankgiro) hoppas över som förut.
 */
export function wixStripeBetalningar(t: OrderTransaktioner): WixStripeBetalning[] {
  const ut: WixStripeBetalning[] = [];
  for (const p of t.payments) {
    const transaktion = p.regularPaymentDetails?.providerTransactionId;
    if (!p.id || !arStripeTransaktion(transaktion)) continue;
    let aterbetaltOre = 0;
    let pagar = false;
    let okant = false;
    for (const r of t.refunds) {
      for (const tx of r.transactions ?? []) {
        if (tx.paymentId !== p.id) continue;
        if (tx.refundStatus === "SUCCEEDED") {
          const ore = oreAv(tx.amount);
          if (ore === null || ore < 0) okant = true;
          else aterbetaltOre += ore;
        } else if (WIX_ATER_PAGAR.has(tx.refundStatus ?? "")) pagar = true;
      }
    }
    ut.push({ betalningId: p.id, transaktion, beloppOre: oreAv(p.amount), aterbetaltOre, pagar, okant });
  }
  return ut;
}

/**
 * Vad som ska göras med en Stripe-betalning på ordern, ur Wix och Stripes
 * egna siffror. Allt som inte stämmer larmar i stället för att flytta pengar.
 */
export function speglingsbeslut(orderId: string, b: WixStripeBetalning, l: Laddning | null): Speglingsbeslut {
  if (!l) return { gor: "inget", skal: "inte_var" };
  if (l.metadata.kalla !== STRIPE_KALLA) return { gor: "larm", skal: "inte_kassans" };
  if (l.metadata.wixOrderId && l.metadata.wixOrderId !== orderId) return { gor: "larm", skal: "annan_order" };
  if (b.okant || b.beloppOre === null) return { gor: "larm", skal: "okant_belopp" };
  if (b.beloppOre !== l.dragetOre || l.valuta !== "sek") return { gor: "larm", skal: "olika_belopp" };
  if (b.aterbetaltOre > l.dragetOre) return { gor: "larm", skal: "over_beloppet" };
  if (l.aterbetaltOre > b.aterbetaltOre) return { gor: "larm", skal: "stripe_fore_wix" };
  if (l.aterbetaltOre === b.aterbetaltOre) return b.pagar ? { gor: "vanta" } : { gor: "inget", skal: "lika" };
  if (l.tvist) return { gor: "larm", skal: "tvist" };
  return { gor: "aterbetala", ore: b.aterbetaltOre - l.aterbetaltOre, nyckel: `fp-ater-${l.id}-${l.aterbetaltOre}` };
}

export interface AterbetalningDeps {
  orderTransaktioner(orderId: string): Promise<OrderTransaktioner>;
  /** Null när laddningen inte finns i vårt Stripe-konto. */
  hamtaLaddning(id: string): Promise<Laddning | null>;
  /** En del av laddningen tillbaka; Stripes svar (status: pending, succeeded, failed …). */
  aterbetalaDel(laddning: string, ore: number, nyckel: string, metadata: Record<string, string>): Promise<{ id: string; status: string }>;
  logg?(rad: string): void;
  /** Paus före ett omtag efter en krock (proven skickar en som inte väntar). */
  vila?(ms: number): Promise<void>;
}

/** Stripes fel (lib/kassa/stripe.ts, StripeFel) känns igen på namnet: flode.ts importerar inget. */
function stripeFelet(e: unknown): { status: number; typ: string | null; kod: string | null } | null {
  if (!(e instanceof Error) || e.name !== "StripeFel") return null;
  const f = e as Error & { status?: unknown; typ?: unknown; kod?: unknown };
  return { status: typeof f.status === "number" ? f.status : 0, typ: typeof f.typ === "string" ? f.typ : null, kod: typeof f.kod === "string" ? f.kod : null };
}

/** En annan spegling hann före med samma nyckel (samma läge i Stripe): läs om och försök igen. */
function arKrock(e: unknown): boolean {
  const f = stripeFelet(e);
  return !!f && (f.typ === "idempotency_error" || f.kod === "idempotency_key_in_use" || f.status === 409);
}

export interface Speglingslarm {
  skal: AterLarmskal;
  /** Stripes id, för att hitta laddningen i panelen. */
  laddning: string;
  wixOre: number;
  stripeOre: number;
  /** Stripes senaste återbetalning (unix-sekunder): ett larm om Stripe före Wix väntar på den. */
  senastAterbetaldSek: number | null;
  /** Vid fel: Stripes felkod eller återbetalningens status. */
  kod?: string;
}

export interface Speglingsutfall {
  /** Antal återbetalningar som gjordes i Stripe nu. */
  aterbetalda: number;
  /** En återbetalning i Wix väntar på sitt utfall: fråga igen senare. */
  vantar: boolean;
  larm: Speglingslarm[];
}

/** Omtag efter en krock med en samtidig spegling, innan nätet får ta det. */
const SPEGLING_RUNDOR = 3;

/**
 * Orderns återbetalningar i Wix → Stripe. Idempotent och säker att köra
 * samtidigt och hur ofta som helst (se ☠️ ovan). Kastar bara när Wix eller
 * Stripe inte går att läsa; ett nekat återbetalningsanrop blir ett larm, och en
 * krock med en samtidig spegling ett omtag med båda sidor lästa på nytt.
 */
export async function speglaAterbetalningar(deps: AterbetalningDeps, orderId: string): Promise<Speglingsutfall> {
  const vila = deps.vila ?? ((ms: number) => new Promise<void>((klar) => setTimeout(klar, ms)));
  let aterbetalda = 0;
  for (let runda = 1; ; runda++) {
    const r = await speglaEnRunda(deps, orderId);
    aterbetalda += r.aterbetalda;
    if (!r.krock || runda >= SPEGLING_RUNDOR) return { aterbetalda, vantar: r.vantar || r.krock, larm: r.larm };
    await vila(300 * runda);
  }
}

async function speglaEnRunda(deps: AterbetalningDeps, orderId: string): Promise<Speglingsutfall & { krock: boolean }> {
  const logg = deps.logg ?? (() => {});
  const utfall = { aterbetalda: 0, vantar: false, larm: [] as Speglingslarm[], krock: false };
  for (const b of wixStripeBetalningar(await deps.orderTransaktioner(orderId))) {
    const l = await deps.hamtaLaddning(b.transaktion);
    const beslut = speglingsbeslut(orderId, b, l);
    const larm = (skal: AterLarmskal, kod?: string) =>
      utfall.larm.push({
        skal,
        laddning: l?.id ?? b.transaktion,
        wixOre: b.aterbetaltOre,
        stripeOre: l?.aterbetaltOre ?? 0,
        senastAterbetaldSek: l?.senastAterbetaldSek ?? null,
        ...(kod ? { kod } : {}),
      });
    if (beslut.gor === "vanta") utfall.vantar = true;
    else if (beslut.gor === "larm") {
      larm(beslut.skal);
      // Stripe före Wix är oftast en människa mitt i ett steg (pengarna tillbaka i
      // Stripe, Wix inte bokfört än): varning, inte fel. Nätet larmar om det står kvar.
      logg(`[kassa-ater] ${beslut.skal === "stripe_fore_wix" ? "" : "☠️ "}${beslut.skal}: ingen återbetalning gjord`);
    } else if (beslut.gor === "aterbetala") {
      try {
        const r = await deps.aterbetalaDel(l!.id, beslut.ore, beslut.nyckel, { kalla: STRIPE_ATER_KALLA, wixOrderId: orderId });
        if (r.status === "failed" || r.status === "canceled") {
          larm("fel", r.status);
          logg(`[kassa-ater] ☠️ återbetalningen i Stripe blev ${r.status}`);
        } else {
          utfall.aterbetalda++;
          logg(`[kassa-ater] återbetalningen från Wix gjord i Stripe (${r.status})`);
        }
      } catch (e) {
        const f = stripeFelet(e);
        if (arKrock(e)) {
          utfall.krock = true;
          logg("[kassa-ater] en annan spegling hann före: läser om");
        } else if (!f) {
          // Inget svar (nätet, tidsgränsen): återbetalningen kan ha gått igenom.
          // Nästa spegling läser Stripes summa och ser vilket.
          utfall.vantar = true;
          logg(`[kassa-ater] ☠️ inget svar från Stripe på återbetalningen (läses om): ${e instanceof Error ? e.message.slice(0, 200) : e}`);
        } else {
          larm("fel", f.kod ?? f.typ ?? String(f.status));
          logg(`[kassa-ater] ☠️ Stripe nekade återbetalningen: ${f.kod ?? f.typ ?? f.status}`);
        }
      }
    }
  }
  return utfall;
}

/**
 * Ska larmet mejlas nu? Stripe före Wix väntar NAT_LARM_SEK efter Stripes
 * senaste återbetalning (Leonard bokför den kanske i Wix just nu); allt annat
 * direkt. Nätet mejlar varje läge en gång (larmnyckel).
 */
export function larmNu(l: Speglingslarm, nuSek: number): boolean {
  if (l.skal !== "stripe_fore_wix") return true;
  return l.senastAterbetaldSek !== null && nuSek - l.senastAterbetaldSek >= NAT_LARM_SEK;
}

/** Samma läge ger samma nyckel: ett nytt belopp i Wix eller Stripe är ett nytt läge och ett nytt mejl. */
export function larmnyckel(orderId: string, l: Speglingslarm): string {
  return `kassa-ater:${orderId}:${l.laddning}:${l.skal}:${l.wixOre}:${l.stripeOre}`;
}

/**
 * Ordrarna bakom Stripes återbetalningar (nätet läser dem för att se det som
 * gjorts i Stripes panel och inte i Wix): bara kassans betalningar med en
 * order, varje order en gång.
 */
export function ordrarMedStripeAterbetalning(rader: { metadata: Record<string, string> | null }[]): string[] {
  const ut = new Set<string>();
  for (const r of rader) {
    const m = r.metadata;
    if (m?.kalla === STRIPE_KALLA && m.wixOrderId) ut.add(m.wixOrderId);
  }
  return [...ut];
}
