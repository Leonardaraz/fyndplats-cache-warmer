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
// Allt efter ingången är gemensamt: avdraget för sålda enheter, prislåset,
// auktionslåset, spärren på 40 % och butiken som facit. Varje leverantör ger en
// adapter som lämnar `Leverantorsrad`, och en profil här som säger vad en
// saknad rad betyder, vilken buffert som gäller, när listan är trasig, hur
// länge en beställd order dras av och om ett nytt pris kräver två avläsningar.
//
// Sedan steg 5 (2026-10-29) kör samma motor för båda leverantörerna
// (`korSynk` i lib/aosom/sync.ts). Aosoms feed och VEVOR:s avläsningar
// (lib/vevor/synk.ts) är två källor till den.

import type { Leverantor, MappingSupplier } from "../store";
import { AOSOM_ID_PREFIX, VEVOR_ID_PREFIX } from "../store/leverantorsprefix";
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
  /**
   * Landad kostnad vid FÖREGÅENDE avläsning av artikeln, när källan har en.
   * Läses bara när profilen kräver två lika avläsningar för ett nytt pris
   * (`prisKraverTvaAvlasningar`). Saknas den skrivs inget nytt pris.
   */
  forraLandadKostnadSek?: number | null;
  /** När beskedet lästes, ISO 8601. */
  lastAt: string;
}

/** Vad en artikel betyder som inte finns bland leverantörens rader. */
export type SaknadRad = "slut" | "okand";

export interface Leverantorsprofil {
  saknadRad: SaknadRad;
  /** Gäller konkurrentregeln (dealproffsens pris) för leverantörens varor? */
  konkurrentregel: boolean;
  /** Prefixet i `supplierProductId`. Synkens urval och radens artikel läses på det. */
  prefix: string;
  /**
   * Vi visar leverantörens saldo minus bufferten, och saldon på eller under
   * den som slut (`synligtSaldo` i lib/aosom/sync.ts).
   */
  buffert: number;
  /**
   * Under så här många rader är leverantörens lista trasig, inte sortimentet,
   * och körningen avbryts. null: listan kan inte halvhämtas till ett
   * lagerbesked, eftersom en saknad rad redan är okänd (`saknadRad: "okand"`).
   */
  minRader: number | null;
  /**
   * Hur länge en order som markerats beställd dras av från leverantörens
   * saldo (`vantarPaFlodet` i lib/aosom/sync.ts). Leverantörens tal visar
   * ordern först efter en stund, och till dess hade samma enhet kunnat säljas
   * igen. Visar talet redan ordern dras den av två gånger, och det är åt det
   * säkra hållet.
   */
  bestalldOsynligMs: number;
  /**
   * Skrivs ett nytt pris först när två avläsningar i rad ger samma regelpris?
   * Raden bär då föregående avläsnings kostnad (`forraLandadKostnadSek`).
   */
  prisKraverTvaAvlasningar: boolean;
}

const TIMME = 60 * 60 * 1000;

/**
 * Aosom. Feeden ger alla rader i ett anrop, tre gånger per dygn.
 *
 *   - En saknad rad är ett lagerbesked. Aosoms B2B-guide: "Items with low stock
 *     may be temporarily removed to avoid overselling." Sidan ligger kvar med 0.
 *   - Bufferten är 0 sedan 2026-10-06 (Leonard: "ta bort den där 1 kvar
 *     bufferten"). Se `LAGER_BUFFERT` i lib/aosom/sync.ts.
 *   - Under 2 000 rader är feeden trasig (`MIN_FEED_RADER`): den har legat på
 *     ~6 000, och en halvhämtad CSV får aldrig nolla katalogen.
 *   - En beställd order dras av i tolv timmar (`NYSS_BESTALLD_MS`): feeden
 *     exporteras tre gånger per dygn, högst åtta timmar emellan, plus fyra
 *     timmars marginal.
 *   - Ett nytt pris skrivs direkt. Feeden är Aosoms egen prislista i euro.
 */
export const AOSOM_PROFIL = {
  saknadRad: "slut",
  konkurrentregel: true,
  prefix: AOSOM_ID_PREFIX,
  buffert: 0,
  minRader: 2000,
  bestalldOsynligMs: 12 * TIMME,
  prisKraverTvaAvlasningar: false,
} satisfies Leverantorsprofil;

/**
 * VEVOR. Sajten läses en sida i taget (lib/vevor/lasare.ts), och en
 * avläsning är högst tolv timmar gammal innan den är okänd (lib/vevor/rad.ts).
 *
 *   - En sida som inte gick att läsa betyder att vi inte vet. Okänt rör aldrig
 *     lagret och blir aldrig 0.
 *   - Konkurrentregeln gäller inte VEVOR-varor (Leonard 2026-10-21).
 *   - Ingen buffert (Leonard 2026-10-28).
 *   - Ingen gräns för antal rader: varje avläsning är sitt eget besked, och en
 *     som saknas är okänd. Läsarens egna spärrar stoppar en trasig körning
 *     innan något skrivs.
 *   - En beställd order dras av i tolv timmar, lika länge som en avläsning
 *     håller. ☠️ Det är inte en gissning om VEVOR:s fördröjning: en avläsning
 *     tagen FÖRE ordern är antingen yngre än tolv timmar, och då dras ordern
 *     av, eller okänd. Kortare än avläsningens livstid får fönstret aldrig bli
 *     (testat i lib/vevor/synk.test.ts).
 *   - Ett nytt pris skrivs först när två avläsningar i rad ger samma regelpris.
 *     VEVOR räknar om sina priser från euro, och ett pris som hoppar fram och
 *     tillbaka ska inte nå kunden.
 */
export const VEVOR_PROFIL = {
  saknadRad: "okand",
  konkurrentregel: false,
  prefix: VEVOR_ID_PREFIX,
  buffert: 0,
  minRader: null,
  bestalldOsynligMs: 12 * TIMME,
  prisKraverTvaAvlasningar: true,
} satisfies Leverantorsprofil;

/** Leverantörerna som synkas här, alltså de med en profil. */
export type SynkadLeverantor = "aosom" | "vevor";

/** Profilen för en leverantör som synkas här. Alltid en profil, aldrig null. */
export const SYNKPROFILER: Record<SynkadLeverantor, Leverantorsprofil> = {
  aosom: AOSOM_PROFIL,
  vevor: VEVOR_PROFIL,
};

/**
 * Profilen per leverantör. En `Record`, så att en ny leverantör måste få en.
 * null betyder att leverantören inte synkas här: synken rör ingenting på dess
 * rader.
 */
export const PROFILER: Record<Leverantor, Leverantorsprofil | null> = {
  ...SYNKPROFILER,
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
  /** Landad kostnad vid föregående avläsning, eller null (`forraLandadKostnadSek`). */
  forraLandad: number | null;
}

const OKANT: Lagerbesked = {
  kant: false,
  synligt: 0,
  ejLevererbar: false,
  saknas: false,
  slut: false,
  landad: null,
  forraLandad: null,
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
        return { kant: true, synligt: 0, ejLevererbar: false, saknas: true, slut: false, landad: null, forraLandad: null };
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
      return { kant: true, synligt: 0, ejLevererbar: false, saknas: true, slut: false, landad: null, forraLandad: null };
    case "ej_levererbar":
      return {
        kant: true,
        synligt: synligtSaldo(rad.saldo),
        ejLevererbar: true,
        saknas: false,
        slut: false,
        landad: null,
        forraLandad: null,
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
        forraLandad: rad.forraLandadKostnadSek ?? null,
      };
    }
    default:
      return assertNever(rad.status, "radstatus");
  }
}
