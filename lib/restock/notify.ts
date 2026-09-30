// Mejlar dem som bevakar en produkt när den kommit tillbaka i lager.
//
// Anropas av båda synkerna när en produkt går från slutsåld till köpbar i
// butiken: AliExpress-synken (lib/sync/aliexpress-sync.ts) och, sedan
// 2026-09-30, Aosom-synken (lib/aosom/sync.ts). Anroparen avgör ATT produkten
// kommit tillbaka. Den här funktionen avgör om ett mejl kan gå, bygger det ur
// butiken och bokför vilka som fått det.
//
// ☠️ ALLT I MEJLET LÄSES ÄNNU EN GÅNG UR BUTIKEN. Namnet var mappningens
// `seoTitle`, alltså leverantörens engelska sidtitel från importen, och bilden
// var leverantörens källbild. Produkten läses nu färskt ur Wix precis före
// utskicket, och mejlet innehåller bara det kunden ser på sidan.
//
// ☠️ EN BEVAKARE STÄMPLAS BARA NÄR RESEND TAGIT EMOT MEJLET. Den gamla vägen
// stämplade alla, också när `sendEmail` svarade `skipped` (torrläge eller
// saknad nyckel). Då var bevakningen förbrukad utan att något mejl gått. Nu
// ligger en sådan bevakare kvar.
//
// ☠️ PRODUKTEN MÅSTE GÅ ATT KÖPA PÅ SIDAN. Dold produkt, saknad adress eller
// ingen synlig variant stoppar utskicket. En sida vars enda variant är dold
// visar "Slutsåld" med fullt lager i Wix (31 sidor 2026-09-06), och ett mejl
// som säger att varan finns igen får inte leda dit.
//
// Lagret kontrolleras INTE här. Anroparen har just skrivit det och fått det
// bekräftat, och Wix läsning släpar efter en skrivning (se CLAUDE.md,
// "PRODUKTläsningen släpar"). En färsk läsning kunde alltså ha sagt "slut" om
// en vara som finns, och då hade bevakarna aldrig fått sitt mejl.

import { storeProductUrl } from "../admin-links";
import { sendEmail, type SendEmailInput, type SendEmailResult } from "../email/resend";
import { uppfriskaProduktsida, type Uppfriskning } from "../headless/produktsida";
import { getV3ProduktKort, type V3ProduktKort, type V3ProduktVariant } from "../wix/v3-products";
import { byggRestockMejl } from "./mejl";
import { getRestockStore, type RestockSubscriber } from "./store";

/** Varför inget mejl byggdes. */
export type RestockStopp =
  | "lasfel"
  | "saknas_i_butiken"
  | "dold"
  | "saknar_adress"
  | "saknar_namn"
  | "ingen_synlig_variant"
  | "varianten_dold";

export interface RestockUtskick {
  /** Väntande bevakare när utskicket började. */
  bevakare: number;
  /** Mejl som Resend tog emot. Bara de bevakarna stämplas. */
  skickade: number;
  /** Mejl som inte gick iväg (torrläge, saknad nyckel eller fel). Bevakaren ligger kvar. */
  ejSkickade: number;
  /** Satt när inget mejl byggdes alls. Bevakarna ligger kvar. */
  stopp?: RestockStopp;
  /** Satt när mejlen gick iväg men stämplingen föll. Då kan de få mejlet igen. */
  markeringsfel?: string;
  /** Hur det gick att tömma butikens cache för sidan. Saknas när inget mejl byggdes. */
  sidan?: Uppfriskning;
  /** Butikens namn på varan, för loggen. */
  butiksnamn?: string;
}

export interface RestockDeps {
  listaVantande: (wixProductId: string) => Promise<RestockSubscriber[]>;
  markeraMejlade: (ids: string[]) => Promise<void>;
  lasProdukt: (wixProductId: string) => Promise<V3ProduktKort | null>;
  skicka: (input: SendEmailInput) => Promise<SendEmailResult>;
  uppfriskaSida: (slug: string) => Promise<Uppfriskning>;
  produktUrl: (slug: string) => string;
}

export function standardRestockDeps(): RestockDeps {
  const store = getRestockStore();
  return {
    listaVantande: (id) => store.listPendingForProduct(id),
    markeraMejlade: (ids) => store.markNotified(ids),
    lasProdukt: getV3ProduktKort,
    skicka: sendEmail,
    uppfriskaSida: (slug) => uppfriskaProduktsida(slug),
    produktUrl: storeProductUrl,
  };
}

/** Kontrollerar att produkten går att visa och köpa. Null = mejlet kan gå. */
export function restockStopp(kort: V3ProduktKort | null): RestockStopp | null {
  if (!kort) return "saknas_i_butiken";
  if (!kort.visible) return "dold";
  if (!kort.slug) return "saknar_adress";
  if (!kort.namn) return "saknar_namn";
  if (!kort.harSynligVariant) return "ingen_synlig_variant";
  return null;
}

export interface RestockOpts {
  /**
   * Visa butikens pris i mejlet. Default ja. Anroparen säger nej när den själv
   * nyss skrev ett nytt pris: Wix läsning släpar efter en skrivning, och ett
   * mejl får inte visa ett annat pris än sidan.
   */
  visaPris?: boolean;
  /**
   * Wix-varianterna som kom tillbaka. Utelämnat = hela produkten (AliExpress-
   * synken, som bara ser produkten). Aosom-synken ser varje variant.
   */
  varianter?: string[];
}

/**
 * Vad mejlet ska visa när bara några varianter kom tillbaka.
 *
 * ☠️ PÅ EN SIDA MED FLERA FÄRGER VÄNTAR BEVAKAREN PÅ EN FÄRG. Formuläret visas
 * när den valda färgen är slut, också när en annan finns. Den 2026-09-30
 * väntade två av fyra bevakare så: på vitt sängbord och beige klättervägg,
 * medan ekdekor och grå fanns. Ett mejl som bara säger "den finns igen" är
 * då otydligt, så mejlet namnger färgen och visar dess bild och pris.
 *
 * Null = mejla om hela produkten: inga varianter angivna, alla synliga kom
 * tillbaka, eller namnen går inte att läsa.
 */
export function aterkomnaVarianter(
  kort: V3ProduktKort,
  varianter: string[] | undefined,
): V3ProduktVariant[] | null {
  if (!varianter?.length) return null;
  const synliga = kort.varianter.filter((v) => v.visible);
  const aterkomna = synliga.filter((v) => varianter.includes(v.id));
  if (aterkomna.length === 0 || aterkomna.length === synliga.length) return null;
  if (aterkomna.some((v) => !v.namn)) return null;
  return aterkomna;
}

export async function mejlaBevakare(
  wixProductId: string,
  opts: RestockOpts = {},
  deps: RestockDeps = standardRestockDeps(),
): Promise<RestockUtskick> {
  const vantande = await deps.listaVantande(wixProductId);
  const ut: RestockUtskick = { bevakare: vantande.length, skickade: 0, ejSkickade: 0 };
  if (vantande.length === 0) return ut;

  let kort: V3ProduktKort | null;
  try {
    kort = await deps.lasProdukt(wixProductId);
  } catch {
    return { ...ut, ejSkickade: vantande.length, stopp: "lasfel" };
  }
  const stopp = restockStopp(kort);
  if (stopp || !kort) return { ...ut, ejSkickade: vantande.length, stopp: stopp ?? "saknas_i_butiken" };

  // Kom bara dolda varianter tillbaka syns ingenting nytt på sidan.
  if (opts.varianter?.length && kort.varianter.length > 0) {
    const kanda = kort.varianter.filter((v) => opts.varianter?.includes(v.id));
    if (kanda.length > 0 && kanda.every((v) => !v.visible)) {
      return { ...ut, ejSkickade: vantande.length, stopp: "varianten_dold" };
    }
  }

  const aterkomna = aterkomnaVarianter(kort, opts.varianter);
  const priser = (aterkomna ?? []).map((v) => v.pris);
  const variantpris = aterkomna && priser.every((x): x is number => typeof x === "number")
    ? { min: Math.min(...priser), max: Math.max(...priser) }
    : undefined;
  const mejl = byggRestockMejl({
    produktnamn: kort.namn,
    produktUrl: deps.produktUrl(kort.slug),
    bildUrl: aterkomna?.find((v) => v.bildUrl)?.bildUrl ?? kort.bildUrl,
    pris: opts.visaPris === false ? undefined : aterkomna ? variantpris : kort.pris,
    varianter: aterkomna?.map((v) => v.namn),
  });
  const sidan = await deps.uppfriskaSida(kort.slug);

  const mejlade: string[] = [];
  let ejSkickade = 0;
  for (const bevakare of vantande) {
    try {
      const svar = await deps.skicka({
        to: bevakare.email,
        subject: mejl.subject,
        bodyHtml: mejl.html,
        bodyText: mejl.text,
        mottagare: "kund",
        forhandstext: mejl.forhandstext,
      });
      if (svar.skipped) ejSkickade++;
      else mejlade.push(bevakare.id);
    } catch {
      // Adressen skrivs aldrig ut: loggarna är inte kundens.
      ejSkickade++;
    }
  }

  let markeringsfel: string | undefined;
  if (mejlade.length > 0) {
    try {
      await deps.markeraMejlade(mejlade);
    } catch (err) {
      markeringsfel = err instanceof Error ? err.message.slice(0, 200) : String(err);
    }
  }

  return {
    bevakare: vantande.length,
    skickade: mejlade.length,
    ejSkickade,
    sidan,
    butiksnamn: kort.namn,
    ...(markeringsfel ? { markeringsfel } : {}),
  };
}

/** En rad för loggen: bara räknare och utfall, aldrig en adress. */
export function beskrivUtskick(u: RestockUtskick): string {
  const delar = [`${u.bevakare} bevakare`, `${u.skickade} mejlade`];
  if (u.ejSkickade > 0) delar.push(`${u.ejSkickade} EJ SKICKADE`);
  if (u.stopp) delar.push(`stopp: ${u.stopp}`);
  if (u.sidan && u.sidan !== "uppfriskad") delar.push(`sidans cache: ${u.sidan}`);
  if (u.markeringsfel) delar.push(`STÄMPELN FÖLL: ${u.markeringsfel}`);
  return delar.join(", ");
}
