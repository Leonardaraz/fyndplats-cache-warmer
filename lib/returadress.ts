// lib/returadress.ts
//
// Vart en retur ska skickas. Leonards beslut 2026-10-16: returer går till
// leverantörens returlager, inte till oss. Hemadressen som stod som
// returadress förut (lib/return-address.ts) är borttagen. Den är fortfarande
// företagsadressen på sajten och i mejlens sidfot, men aldrig en returadress
// (lib/returadress.test.ts).
//
// EN ADRESS PER LEVERANTÖR. Nästan hela sortimentet kommer i dag från Aosom,
// med returlager i Neu Wulmstorf. Fler leverantörer med egna returlager kommer
// (Vevor). En ny leverantör läggs till i två steg:
//   1. dess returadress i RETURADRESSER nedan, när den är bekräftad,
//   2. ett sätt för lib/returadress-order.ts att känna igen dess varor. I dag
//      vet butiken bara säkert om en vara är Aosom (motorns /api/gpsr svarar
//      200 bara för Aosom-varor, med Aosoms tillverkare), så en Vevor-vara ger
//      ingen adress förrän motorn kan svara på vilken leverantör en produkt har.
//
// ADRESSEN VISAS BARA NÄR DEN ÄR SÄKER. Varje vara i returen måste höra till
// samma leverantör, och den leverantören måste ha en adress här. Blandat,
// okänt eller en leverantör utan adress ger ingen adress, och kvittot säger
// att vi mejlar den inom 1 arbetsdag. En fel adress är värre än ingen:
// paketet hamnar på fel lager, och kunden har redan betalat utrikesfrakten.
//
// Motorn säger vilken leverantör produkten har NU, inte vem som skickade en
// äldre order. Därför krävs också att raden skickats med ett av Aosoms
// fraktbolag (skickadMedAosom nedan).
//
// LEVERANTÖRENS NAMN NÅR INTE KUNDEN. Mottagaren är bolaget som redan står som
// tillverkare i produktsidans säkerhetsflik (lib/gpsr-flik.ts), aldrig
// leverantörens varumärke (lib/leverantor.test.ts, "Vi är leverantören för
// kunden"). Leonard 2026-10-17: Aosom ska inte stå med på adressen.
//
// Ren modul utan importer, så att node-testköraren laddar den.

export interface Returadress {
  /** Mottagaren, överst på paketet. */
  mottagare: string;
  /** Adressraderna under mottagaren, utan land. */
  rader: readonly string[];
  /** Landet, sist på paketet. Kvittot säger också att frakten blir utrikes. */
  land: string;
}

/** Leverantörer med en bekräftad returadress. */
export const RETURADRESSER = {
  // Aosoms returlager, enligt deras returvillkor (aosom.de/page/return-home,
  // kontrollerat av Leonard 2026-10-16). MH Handel GmbH är Aosoms tyska bolag
  // och samma tillverkare som säkerhetsfliken visar.
  aosom: {
    mottagare: "MH Handel GmbH",
    rader: ["Retourenlager", "Bei der Lehmkuhle 4a", "21629 Neu Wulmstorf"],
    land: "Tyskland",
  },
} as const satisfies Readonly<Record<string, Returadress>>;

export type Leverantor = keyof typeof RETURADRESSER;

/**
 * Tillverkaren som motorns /api/gpsr anger för varje Aosom-vara (motorns
 * lib/gpsr/aosom.ts, AOSOM_ANSVARIG). Butiken känner igen en Aosom-vara på den
 * och inte bara på att motorn svarar: får motorn en dag uppgifter även för en
 * annan leverantörs varor (Vevor) ska de inte få Aosoms returadress.
 */
export const AOSOM_TILLVERKARE = "MH Handel GmbH";

/**
 * Är tillverkaren i motorns svar Aosoms? Null när svaret inte gick att läsa:
 * då vet vi ingenting, och returen får ingen adress.
 */
export function arAosomTillverkare(namn: string | null | undefined): boolean | null {
  if (typeof namn !== "string" || !namn.trim()) return null;
  return namn.trim() === AOSOM_TILLVERKARE;
}

/**
 * Returadressen för en retur, eller null när den inte är säker.
 *
 * `leverantorer` har en post per vara i returen: leverantören, eller null när
 * den inte gick att avgöra. `adresser` är registret ovan; testerna skickar in
 * ett eget för att pröva en leverantör till.
 */
export function valjReturadress(
  leverantorer: readonly (string | null)[],
  adresser: Readonly<Record<string, Returadress>> = RETURADRESSER,
): Returadress | null {
  const forsta = leverantorer[0];
  if (!forsta || !leverantorer.every((l) => l === forsta)) return null;
  return Object.hasOwn(adresser, forsta) ? adresser[forsta] : null;
}

/** Adressen rad för rad, som kunden skriver den på paketet. */
export function returadressRader(a: Returadress): string[] {
  return [a.mottagare, ...a.rader, a.land];
}

// ── Orderns rader ────────────────────────────────────────────────────────────

export interface OrderRad {
  /** Radens namn i de former Wix ger det: originalet, översättningen, namnet. */
  namn: string[];
  /** Katalogens produkt-id, eller null när raden inte har något. */
  produktId: string | null;
  /** Radens eget id i ordern, som Wix-sändningarna pekar på. */
  radId: string | null;
}

const text = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

/**
 * Raderna i en Wix-order (ecom/v1/orders) med namn och produkt-id.
 *
 * Produkt-id:t tas ur katalogreferensen, aldrig ur radens eget _id. Det id:t
 * finns på varje rad men pekar inte på någon produkt, och motorn hade svarat
 * "inte en Aosom-vara" på det, vilket är fel svar på fel fråga.
 */
export function orderRaderUr(order: Record<string, unknown>): OrderRad[] {
  const lineItems = order.lineItems ?? order.items;
  if (!Array.isArray(lineItems)) return [];
  return lineItems.map((rad: Record<string, unknown>) => {
    const pn = rad?.productName as { original?: unknown; translated?: unknown } | string | undefined;
    const namn = [
      typeof pn === "string" ? text(pn) : text(pn?.original),
      typeof pn === "string" ? null : text(pn?.translated),
      text(rad?.name),
    ].filter((n): n is string => n !== null);
    const ref = rad?.catalogReference as { catalogItemId?: unknown; productId?: unknown } | undefined;
    const produktId = text(ref?.catalogItemId) ?? text(ref?.productId) ?? text(rad?.productId) ?? text(rad?.catalogItemId);
    return { namn, produktId, radId: text(rad?.id) ?? text(rad?._id) };
  });
}

// Formuläret skickar namnet som ordern bar, kapat vid 200 tecken
// (app/api/angra/route.ts). Versaler och mellanslag ska inte spela roll.
const normNamn = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 200);

/**
 * Orderns rader för varje vald vara, i samma ordning som `varunamn`. Null för
 * en vara som inte går att knyta till ordern, eller där någon matchande rad
 * saknar produkt-id. Utan valda varor gäller hela ordern, en post per rad.
 */
export function raderFor(varunamn: readonly string[], rader: readonly OrderRad[]): (OrderRad[] | null)[] {
  if (varunamn.length === 0) return rader.map((r) => (r.produktId ? [r] : null));
  return varunamn.map((namn) => {
    const sokt = normNamn(namn);
    const traffar = rader.filter((r) => r.namn.some((n) => normNamn(n) === sokt));
    if (traffar.length === 0 || traffar.some((r) => !r.produktId)) return null;
    return traffar;
  });
}

// ── Hur raden skickades ─────────────────────────────────────────────────────
//
// En produkt kan mappas om från AliExpress till Aosom efter att en kund köpt
// den (Leonards regel 2026-09-05). Motorns svar säger då Aosom, och kvittot
// hade gett Aosoms returlager för en vara som kom från AliExpress, där ingen
// känner till den (granskningen 2026-10-17). Raden måste därför också ha
// skickats med ett fraktbolag som Aosom använder. AliExpress-paket bär
// AliExpress egna namn, som motorn skriver på sändningen ("Seller Shipping ES
// Local", "DHL PL", "DHL to EU"), och de står aldrig här.

/** Fraktbolag som Aosom skickar med till Sverige, som de står i Wix. */
export const AOSOM_FRAKTBOLAG: ReadonlySet<string> = new Set(["dhl", "dpd", "dsv", "gls", "postnord"]);

/**
 * Skickades raden med Aosom? Ja bara när minst en sändning bär raden och varje
 * sändning som bär den har ett av Aosoms fraktbolag. En rad som inte skickats
 * än, eller som bara markerats skickad utan sändning, går inte att avgöra.
 */
export function skickadMedAosom(radId: string | null, sandningar: readonly Record<string, unknown>[]): boolean {
  if (!radId) return false;
  const medRaden = sandningar.filter(
    (f) => Array.isArray(f?.lineItems) && (f.lineItems as Record<string, unknown>[]).some((r) => text(r?.id) === radId),
  );
  if (medRaden.length === 0) return false;
  return medRaden.every((f) => {
    const bolag = text((f?.trackingInfo as Record<string, unknown> | undefined)?.shippingProvider);
    return bolag !== null && AOSOM_FRAKTBOLAG.has(bolag.toLowerCase());
  });
}

/**
 * Leverantören för en vald vara: Aosom bara när motorn säger Aosom om varje
 * produkt och varje rad skickats med Aosom. Annars null, och kvittot säger att
 * vi mejlar adressen. `sandningar` är null när de inte gick att läsa.
 */
export function leverantorForRader(
  rader: readonly OrderRad[] | null,
  arAosom: (produktId: string) => boolean | null,
  sandningar: readonly Record<string, unknown>[] | null,
): Leverantor | null {
  if (!rader || rader.length === 0 || !sandningar) return null;
  const aosom = rader.every(
    (r) => r.produktId !== null && arAosom(r.produktId) === true && skickadMedAosom(r.radId, sandningar),
  );
  return aosom ? "aosom" : null;
}
