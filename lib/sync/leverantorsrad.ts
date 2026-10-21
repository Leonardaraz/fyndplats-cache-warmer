// Synkens ingång: en leverantörs besked om en artikel, i ett format som inte
// är byggt för en viss leverantör.
//
// VARFÖR (steg 3 i VEVOR-uppdraget, 2026-10-21). Aosom-synken tog emot Aosoms
// feedrad (`AosomRow`) rakt in i planeringen. Av raden använde den saldot,
// skeppbarheten och den landade kostnaden, och regeln "en rad som saknas i
// feeden betyder saldo 0". Regeln stämmer för Aosom, vars B2B-guide säger att
// en vara med lågt lager plockas bort tillfälligt. För VEVOR, som läses en sida
// i taget, betyder en saknad avläsning att vi inte vet. Då ska synken inte röra
// något: okänt blir aldrig 0.
//
// Allt efter ingången är gemensamt: bufferten, avdraget för sålda enheter,
// prislåset, auktionslåset, spärren på 40 % och butiken som facit. Varje
// leverantör ger en adapter som lämnar `Leverantorsrad`, och en profil här som
// säger vad en saknad rad betyder.

import type { Leverantor, MappingSupplier } from "../store";
import { assertNever } from "../assert-never";

/**
 * Leverantörens besked om artikeln.
 *
 * - `i_lager` / `slut`: leverantören har artikeln, med saldot i `saldo`.
 * - `ej_levererbar`: artikeln finns men skickas inte till Sverige.
 * - `borta`: artikeln är borttagen hos leverantören (bekräftat).
 * - `okand`: vi vet inte — tidsgräns, blockering, tolkningsfel, för gammal
 *   avläsning. Synken rör ingenting.
 */
export type Radstatus = "i_lager" | "slut" | "ej_levererbar" | "borta" | "okand";

export interface Leverantorsrad {
  leverantor: MappingSupplier;
  /** Artikelnumret utan vårt prefix. */
  artikel: string;
  status: Radstatus;
  /** Leverantörens eget saldo, före bufferten. 0 när det inte är känt. */
  saldo: number;
  /** Landad kostnad INKLUSIVE moms (husets konvention), eller null när den inte är känd. */
  landadKostnadSek: number | null;
  /** När beskedet lästes, ISO 8601. */
  lastAt: string;
}

/** Vad en artikel betyder som inte finns bland leverantörens rader. */
export type SaknadRad = "slut" | "okand";

export interface Leverantorsprofil {
  saknadRad: SaknadRad;
  /** Gäller konkurrentregeln (dealproffsens pris) för leverantörens varor? */
  konkurrentregel: boolean;
}

/**
 * Profilen per leverantör. En `Record`, så att en ny leverantör måste få en.
 * null betyder att leverantören inte synkas här: synken rör ingenting på dess
 * rader.
 *
 * Bufferten, minsta antal rader och fönstret för beställda enheter är kvar som
 * Aosom-konstanter i lib/aosom/sync.ts. De flyttar hit i steg 5, när VEVOR:s
 * värden är bestämda; att hitta på dem nu hade gett profilen tal ingen beslutat.
 */
export const PROFILER: Record<Leverantor, Leverantorsprofil | null> = {
  // Aosoms guide: "Items with low stock may be temporarily removed to avoid
  // overselling." En saknad rad är ett lagerbesked; sidan ligger kvar med 0.
  aosom: { saknadRad: "slut", konkurrentregel: true },
  // En sida som inte gick att läsa betyder att vi inte vet. Konkurrentregeln
  // gäller inte VEVOR-varor (Leonard 2026-10-21). Ingen synk läser VEVOR än.
  vevor: { saknadRad: "okand", konkurrentregel: false },
  // AliExpress har en egen synk (lib/sync/aliexpress-sync.ts).
  aliexpress: null,
  okand: null,
};

/** Vad en rad, eller avsaknaden av en, betyder för lagret och priset. */
export interface Lagerbesked {
  /** false = vi vet inte. Synken skriver varken saldo eller pris, och stämplar inget. */
  kant: boolean;
  /** Saldot vi visar, alltså efter bufferten, eller 0. */
  synligt: number;
  /** Artikeln skickas inte hit. Saldot nollas, men det räknas inte som slut. */
  ejLevererbar: boolean;
  /** Raden saknades, eller artikeln är borta hos leverantören. */
  saknas: boolean;
  /** Leverantören har artikeln men inget att visa. */
  slut: boolean;
  /**
   * Landad kostnad att prissätta på, eller null: raden saknas, levereras inte
   * hit, är okänd eller har ingen känd kostnad. Då rörs priset inte.
   */
  landad: number | null;
}

const OKANT: Lagerbesked = {
  kant: false,
  synligt: 0,
  ejLevererbar: false,
  saknas: false,
  slut: false,
  landad: null,
};

/**
 * Tolkar en rad enligt leverantörens profil. `synligtSaldo` är leverantörens
 * buffert: leverantörens saldo in, det vi visar ut.
 *
 * ☠️ `slut` RÄKNAS UR DET SYNLIGA SALDOT, inte ur statusen, och aldrig för en
 * rad som inte levereras hit. "Leverantören har slut" och "leverantören skickar
 * den inte hit" är olika besked, och en buffert kan göra ett litet saldo till 0.
 */
export function lagerbesked(
  rad: Leverantorsrad | undefined,
  profil: Leverantorsprofil,
  synligtSaldo: (saldo: number) => number,
): Lagerbesked {
  if (!rad) {
    switch (profil.saknadRad) {
      case "slut":
        return { kant: true, synligt: 0, ejLevererbar: false, saknas: true, slut: false, landad: null };
      case "okand":
        return OKANT;
      default:
        return assertNever(profil.saknadRad, "regel för saknad rad");
    }
  }
  switch (rad.status) {
    case "okand":
      return OKANT;
    case "borta":
      return { kant: true, synligt: 0, ejLevererbar: false, saknas: true, slut: false, landad: null };
    case "ej_levererbar":
      return {
        kant: true,
        synligt: synligtSaldo(rad.saldo),
        ejLevererbar: true,
        saknas: false,
        slut: false,
        landad: null,
      };
    case "i_lager":
    case "slut": {
      const synligt = synligtSaldo(rad.saldo);
      return {
        kant: true,
        synligt,
        ejLevererbar: false,
        saknas: false,
        slut: synligt === 0,
        landad: rad.landadKostnadSek,
      };
    }
    default:
      return assertNever(rad.status, "radstatus");
  }
}
