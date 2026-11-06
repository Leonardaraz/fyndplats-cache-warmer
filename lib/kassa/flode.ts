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
}

export interface Korg {
  id?: string;
  lineItems?: KorgRad[];
  coupons?: { id?: string; code?: string }[];
  orderPlaced?: boolean;
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
  };
}

export interface Kund {
  epost: string;
  fornamn: string;
  efternamn: string;
  telefon: string;
  gata: string;
  co: string;
  postnr: string;
  ort: string;
  kupong: string;
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
  const uppgifter = [kund.epost.toLowerCase(), kund.fornamn, kund.efternamn, kund.telefon, kund.gata, kund.co, kund.postnr, kund.ort, kund.kupong.toLowerCase()];
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
