// lib/auction/tick.ts
//
// FYNDAUKTIONENS TICK, utan bindning till Wix: rutten
// (app/api/cron/auction-tick) ger den sina beroenden, och testerna ger den
// låtsade. Vad ett tick gör, i ordning:
//
//   1. SÅLD: ordrarna sedan äldsta live-start läses till slutet. En order på en
//      live-auktions produkt ⇒ priset återställs och raden blir sold.
//   2. DAGSLUT: kl 19:00 (start + 12 h) ⇒ priset återställs och raden blir
//      expired. En raderad produkt tas bort ur auktionen (självläkningen).
//   3. PRISSTEG: varje live-auktion vars målsteg ändrats PATCH:as till sitt
//      nya pris. Ett framtida startAt ger steg 0 och ingen PATCH.
//   4. PÅFYLLNING: färre levande än nästa starts antal (lib/auction/antal.ts) ⇒
//      kö-produkter främjas med start nästa 07:00. Sinar kön återvinns
//      avslutade, men aldrig en som slutade inom 30-dagarsfönstret. En rad
//      över pristaket (2 000 kr, lib/auction/pristak.ts) främjas aldrig.
//   5. BUTIKEN: produkterna vars pris ändrades skickas till butiken, som
//      tömmer och värmer deras sidor.
//
// ☠️ BLACK WEEK (planens del C2, Leonards datum: 50 om dagen 23–29 november och
// 100 fredag 27 november). Ticken skrev förut en produkt i taget och sparade
// varje rad för sig: med 100 fynd blev timslaget 100 läsningar, 100
// skrivningar och 100 sparningar i rad, och dagslutet kl 19 lika många till
// plus 50–100 främjanden. Därför, och inget av det ska tas bort:
//
//   - HÖGST FYRA WIX-ANROP SAMTIDIGT (`SAMTIDIGA`). Wix stryper täta
//     Stores-anrop; prisskrivningen gör om ett strypt försök
//     (lib/auction/store.ts, `PRIS_PAUS_MS`), och `wix429` i rapporten räknar
//     strypningarna.
//   - SPARNINGARNA SAMLAS per steg i ett massanrop (`spara`), i stället för en
//     sparning per rad.
//   - EN TIDSBUDGET (`BUDGET_MS`, 240 s av ruttens 300). Ingen ny skrivning
//     startar efter den. Det som inte hann göras står i `kvar`, och nästa tick
//     (var tionde minut, vercel.json) tar det. Stegen är idempotenta: en rad
//     som inte sparades skrivs om nästa gång.
//   - FRÄMJANDEN STARTAR ALDRIG I AOSOMS SYNKFÖNSTER (lib/wix/synkfonster.ts).
//     Synken läser auktionerna en gång per körning och låter deras pris vara
//     (05-aosom-synken/09-levande-fyndauktion.md). En rad som blev live mitt i
//     en körning hade synken inte sett, och den hade kunnat skriva ett nytt
//     regelpris under startpriset. Återställningen kl 19 väntar däremot aldrig:
//     ett auktionspris får inte stå kvar efter dagens slut.
//   - ORDRARNA LÄSES TILL SLUTET, och ett fel att läsa dem syns i rapporten.
//     Förut lästes högst tre sidor, och ett 403 gav tyst inga ordrar alls.

import { mapWithConcurrency } from "@/lib/concurrency";
import { aggregateOrders } from "@/lib/wix/orders";
import { iSynkfonster, nastaFonsterStart } from "@/lib/wix/synkfonster";
import type { AndradProdukt } from "@/lib/headless/produktsidor";
import { isExpired, nextStartAt, priceAt, stepIndexAt, type AuctionDoc } from "./engine";
import { attFramja, auktionerFor, ledigaSlots } from "./antal";
import { forstaSankning, slutadeInomFonstret } from "./trettio-dagar";
import { framjbar, type ProduktNu } from "./framjbar";
import { overPristak } from "./pristak";
import { isProductGone, type Skrivlage } from "./store";

/** Så många Wix-anrop ticken har i luften samtidigt. */
export const SAMTIDIGA = 4;
/** Ingen ny skrivning startar efter så här lång tid. Rutten har 300 s. */
export const BUDGET_MS = 240_000;
/** Främjanden startar inte så här nära nästa synkfönster. */
export const SYNK_MARGINAL_MS = 60_000;
/** Kön läses från toppen; 200 räcker även när en dag med 100 ska fyllas. */
export const KO_HUVUD = 200;
/**
 * Så många priser som inte gick att läsa (429, 5xx, nätet) tål främjandet per
 * tick. En enstaka trasig produkt hoppas över och nästa i kön läses; felar
 * läsningarna gång på gång är det Wix som stryper, och då väntar resten till
 * nästa tick i stället för att läsa igenom hela kön.
 */
export const FEL_LASNINGAR_MAX = 8;

export type Order = Parameters<typeof aggregateOrders>[0][number];

export interface TickBeroenden {
  nu: () => number;
  lasAuktioner: (statusar: string[], val?: { köHuvud?: number }) => Promise<AuctionDoc[]>;
  /** Alla ordrar sedan `sedanIso`, till slutet. Kastar hellre än svarar tomt. */
  hamtaOrdrar: (sedanIso: string) => Promise<Order[]>;
  /** Ordinarie pris tillbaka och jämförpriset bort (restoreListPrice). */
  aterstall: (a: AuctionDoc, lage: Skrivlage) => Promise<void>;
  /** Auktionens pris för tidpunkten `nuMs` (per variant om trackar finns). */
  stega: (a: AuctionDoc, nuMs: number, lage: Skrivlage) => Promise<void>;
  /**
   * Varans läge i Wix: finns den, och vad kostar varianterna nu. Ett läsfel
   * räknas som "finns" med okänt pris (lib/auction/framjbar.ts).
   */
  produktNu: (productId: string) => Promise<ProduktNu>;
  taBort: (id: string) => Promise<void>;
  /** Massparning. Svarar med de rader som INTE sparades. */
  spara: (docs: AuctionDoc[]) => Promise<{ id: string; fel: string }[]>;
  uppdateraButiken: (produkter: AndradProdukt[]) => Promise<unknown>;
}

export interface TickVal {
  budgetMs?: number;
  samtidiga?: number;
  synkMarginalMs?: number;
}

export interface TickRapport {
  sold: { slug: string; soldPrice: number }[];
  expired: string[];
  priced: { slug: string; price: number }[];
  promoted: { slug: string; slot: number; startAt: string }[];
  removedDead: string[];
  errors: string[];
  recycled?: string[];
  /**
   * Köade rader som inte främjades eftersom startpriset inte är varans pris i
   * Wix (`pris_andrat`), eller priset inte gick att läsa (`pris_okant`). De står
   * kvar i kön, och nästa natts seed uppdaterar dem.
   */
  prisHoppade?: { slug: string; skal: "pris_andrat" | "pris_okant" }[];
  /** Nästa starts antal. */
  mal?: number;
  butiken?: unknown;
  /** Det som inte hann göras i budgeten. Nästa tick tar det. */
  kvar: { salda: number; dagslut: number; prissteg: number; framjanden: number };
  /** Varför främjandena väntar till nästa tick, om de gör det. */
  framjandenVantar?: "synkfonster" | "sparfel" | "tid";
  /** Allt som skulle göras blev gjort (eller försökt) i det här ticket. */
  klar: boolean;
  /** Wix strypningar (429 eller edge-spärrens HTML-sida), även de som gick igenom vid ett nytt försök. */
  wix429: number;
  tidMs: number;
  ok: boolean;
  liveCount: number;
}

const felText = (e: unknown) => (e instanceof Error ? e.message : String(e));

export async function korTick(d: TickBeroenden, val: TickVal = {}): Promise<TickRapport> {
  const start = d.nu();
  const now = start;
  const slutMs = start + (val.budgetMs ?? BUDGET_MS);
  const samtidiga = val.samtidiga ?? SAMTIDIGA;
  const stat = { wix429: 0 };
  const lage: Skrivlage = { slutMs, stat, nu: d.nu };
  const harTid = () => d.nu() < slutMs;

  const r: TickRapport = {
    sold: [],
    expired: [],
    priced: [],
    promoted: [],
    removedDead: [],
    errors: [],
    kvar: { salda: 0, dagslut: 0, prissteg: 0, framjanden: 0 },
    klar: true,
    wix429: 0,
    tidMs: 0,
    ok: true,
    liveCount: 0,
  };

  // Produkter vars Wix-pris ändrades. Butiken töms för dem i slutet, så att
  // produktsidans pris stämmer med kassan från första besöket.
  const prisAndrade: AndradProdukt[] = [];
  const noteraPris = (a: AuctionDoc) => prisAndrade.push({ id: a.productId, ...(a.slug ? { slug: a.slug } : {}) });

  /**
   * Produkten är raderad ur katalogen ⇒ auktionsraden är meningslös och
   * farlig: en live-rad vars pris-PATCH alltid 404:ar kan varken stega, säljas
   * eller avslutas, och den blockerar sin plats. Raden tas bort och markeras
   * avslutad i minnet, så att platsen är ledig redan i det här ticket.
   */
  const retireDead = async (a: AuctionDoc) => {
    try {
      await d.taBort(a._id ?? `auction-${a.productId}`);
      r.removedDead.push(a.slug);
      a.status = "expired";
    } catch (e) {
      r.errors.push(`removeDead ${a.slug}: ${felText(e)}`);
    }
  };

  /** Sparar ett stegs rader i ett anrop. Svarar med antalet som inte sparades. */
  const spara = async (docs: AuctionDoc[], steg: string): Promise<number> => {
    if (docs.length === 0) return 0;
    let fel: { id: string; fel: string }[];
    try {
      fel = await d.spara(docs);
    } catch (e) {
      fel = docs.map((x) => ({ id: x._id ?? `auction-${x.productId}`, fel: felText(e) }));
    }
    for (const f of fel) r.errors.push(`spara ${steg} ${f.id}: ${f.fel}`);
    return fel.length;
  };

  const all = await d.lasAuktioner(["live", "queued"], { köHuvud: KO_HUVUD });
  let live = all.filter((a) => a.status === "live");
  const queued = all.filter((a) => a.status === "queued").sort((a, b) => a.queueOrder - b.queueOrder);
  // Sålda och avslutade som inte gick att spara: lagret säger fortfarande live.
  let sparfel = 0;
  // Sålda vars återställning föll eller inte hann göras. De står kvar som live
  // (platsen är upptagen tills raden sparats), men de avslutas inte som
  // expired och stegas aldrig: en såld vara får inget lägre pris.
  const saldaEjKlara = new Set<AuctionDoc>();

  // 1) Såld — en läsning av ordrarna för alla live-auktioner.
  if (live.length > 0) {
    const oldestStart = live.map((a) => (a.startAt ? Date.parse(a.startAt) : now)).reduce((m, t) => Math.min(m, t), now);
    let ordrar: Order[] | null = null;
    try {
      ordrar = await d.hamtaOrdrar(new Date(oldestStart).toISOString());
    } catch (e) {
      r.errors.push(`sold: ordrarna gick inte att läsa: ${felText(e)}`);
    }
    if (ordrar) {
      const agg = aggregateOrders(ordrar);
      const salda = live.filter((a) => {
        const hit = agg.byProductId[a.productId];
        return !!(hit?.lastSoldAt && a.startAt && Date.parse(hit.lastSoldAt) >= Date.parse(a.startAt));
      });
      const sparas: AuctionDoc[] = [];
      await mapWithConcurrency(salda, samtidiga, async (a) => {
        if (!harTid()) {
          r.kvar.salda++;
          saldaEjKlara.add(a);
          return;
        }
        try {
          try {
            await d.aterstall(a, lage);
          } catch (e) {
            // Produkt raderad efter köpet ⇒ inget pris att återställa, men
            // affären är verklig — sold-historiken sparas ändå.
            if (!isProductGone(e)) throw e;
          }
          const soldPrice = a.lastPatchedPrice ?? a.listPrice;
          sparas.push({ ...a, status: "sold", endedAt: new Date(now).toISOString(), soldPrice });
          r.sold.push({ slug: a.slug, soldPrice });
          noteraPris(a);
          a.status = "sold";
        } catch (e) {
          r.errors.push(`sold ${a.slug}: ${felText(e)}`);
          saldaEjKlara.add(a);
        }
      });
      sparfel += await spara(sparas, "sold");
    }
    live = live.filter((a) => a.status === "live");
  }

  // 2) Dagslut kl 19: återställ och avsluta. Väntar aldrig på synkfönstret.
  const utgangna = live.filter((a) => !saldaEjKlara.has(a) && isExpired(a, now));
  const sparasUt: AuctionDoc[] = [];
  await mapWithConcurrency(utgangna, samtidiga, async (a) => {
    if (!harTid()) {
      r.kvar.dagslut++;
      return;
    }
    try {
      await d.aterstall(a, lage);
      sparasUt.push({ ...a, status: "expired", endedAt: new Date(now).toISOString() });
      r.expired.push(a.slug);
      noteraPris(a);
      a.status = "expired";
    } catch (e) {
      if (isProductGone(e)) await retireDead(a);
      else r.errors.push(`expire ${a.slug}: ${felText(e)}`);
    }
  });
  sparfel += await spara(sparasUt, "expire");
  live = live.filter((a) => a.status === "live");

  // 3) Prissteg. Gate: per-variant på stegindex (så alla trackar följer med även
  //    om visningsstegen står stilla en timme), enkel-pris på visningspriset.
  //    En auktion vars dag är slut stegas aldrig: misslyckades återställningen
  //    ovan hade den annars sänkts till golvet efter kl 19.
  const attStega = live.filter((a) => {
    if (saldaEjKlara.has(a) || isExpired(a, now)) return false;
    const idx = stepIndexAt(a, now);
    return a.variantPrices?.length ? idx !== (a.lastPatchedStep ?? -1) : priceAt(a, now) !== a.lastPatchedPrice;
  });
  const sparasPris: AuctionDoc[] = [];
  await mapWithConcurrency(attStega, samtidiga, async (a) => {
    if (!harTid()) {
      r.kvar.prissteg++;
      return;
    }
    const idx = stepIndexAt(a, now);
    const pris = priceAt(a, now);
    try {
      await d.stega(a, now, lage);
      sparasPris.push({ ...a, lastPatchedStep: idx, lastPatchedPrice: pris });
      r.priced.push({ slug: a.slug, price: pris });
      noteraPris(a);
    } catch (e) {
      if (isProductGone(e)) await retireDead(a);
      else r.errors.push(`price ${a.slug}: ${felText(e)}`);
    }
  });
  // Ett sparfel här lämnar bara lastPatchedStep gammalt: nästa tick PATCH:ar samma pris igen.
  await spara(sparasPris, "price");
  live = live.filter((a) => a.status === "live");

  // 4) Påfyllning tills alla levande (startade + schemalagda) är lika många som
  //    nästa starts antal, med start nästa 07:00. Varje produkt har exakt ETT
  //    dokument (_id = auction-<productId>), så en återvinning är samma dokument
  //    som flippas tillbaka till live.
  const nastaStart = nextStartAt(now);
  const mal = auktionerFor(nastaStart);
  r.mal = mal;
  const behov = attFramja(live.length, mal);
  if (behov > 0) {
    const fonster = nastaFonsterStart(new Date(now)).getTime();
    if (sparfel > 0) r.framjandenVantar = "sparfel";
    else if (iSynkfonster(new Date(now)) || fonster - now < (val.synkMarginalMs ?? SYNK_MARGINAL_MS)) r.framjandenVantar = "synkfonster";
    else if (!harTid()) r.framjandenVantar = "tid";

    if (r.framjandenVantar) {
      r.kvar.framjanden = behov;
    } else {
      // Inga främjanden efter budgeten, och inga in i nästa fönster.
      const framjaSlut = Math.min(slutMs, fonster - (val.synkMarginalMs ?? SYNK_MARGINAL_MS));
      const freeSlots = ledigaSlots(new Set(live.map((a) => a.slot)), behov);
      // Pristaket (lib/auction/pristak.ts): en rad över taket främjas aldrig.
      // Den köade står kvar tills nattens seed tar bort den; den avslutade
      // prövas här, för seeden rör inte avslutade rader.
      const koade = queued.filter((a) => !overPristak(a));
      let pool: AuctionDoc[] = [...koade];
      if (pool.length < freeSlots.length) {
        const ended = await d.lasAuktioner(["sold", "expired"]);
        // 30-dagarsspärren: en vara vars förra auktion slutade inom fönstret får
        // inte gå igen, eftersom dess lägsta pris då var auktionens.
        const tSankning = forstaSankning(nastaStart);
        const recyclable = ended
          .filter((e) => e.floorPrice < e.listPrice) // hoppa produkter utan rabattutrymme
          .filter((e) => !slutadeInomFonstret(e, tSankning))
          .filter((e) => !overPristak(e))
          .sort((x, y) => Date.parse(x.endedAt ?? "1970-01-01") - Date.parse(y.endedAt ?? "1970-01-01"));
        pool = pool.concat(recyclable);
        if (recyclable.length > 0) r.recycled = recyclable.slice(0, freeSlots.length - koade.length).map((x) => x.slug);
      }

      // Kandidater vars produkt raderats ur katalogen hoppas över (och raden
      // slängs): en blind främjning ger en död auktion som bränner platsen en
      // hel dag. Existensen kollas i omgångar om det som fattas, fyra i taget.
      // ☠️ Samma läsning ger varans pris: en rad vars startpris inte är priset
      // i Wix just nu främjas inte (lib/auction/framjbar.ts, fynden 12–14/11).
      const valda: AuctionDoc[] = [];
      let qi = 0;
      let felLasningar = 0;
      while (valda.length < freeSlots.length && qi < pool.length && d.nu() < framjaSlut && felLasningar < FEL_LASNINGAR_MAX) {
        const omgang = pool.slice(qi, qi + (freeSlots.length - valda.length));
        qi += omgang.length;
        const lagen = await mapWithConcurrency(omgang, samtidiga, (k) => d.produktNu(k.productId));
        for (let i = 0; i < omgang.length; i++) {
          const f = framjbar(omgang[i], lagen[i]);
          if (f === "ok") valda.push(omgang[i]);
          else if (f === "borta") await retireDead(omgang[i]);
          else {
            if (f === "pris_okant") felLasningar++;
            (r.prisHoppade ??= []).push({ slug: omgang[i].slug, skal: f });
          }
        }
      }
      const framjade: AuctionDoc[] = valda.map((next, i) => ({
        ...next,
        status: "live",
        slot: freeSlots[i],
        startAt: nastaStart,
        lastPatchedPrice: next.listPrice, // start = listpris, ingen PATCH behövs
        lastPatchedStep: 0,
        endedAt: undefined,
        soldPrice: undefined,
      }));
      let ejSparade = new Set<string>();
      if (framjade.length > 0) {
        let fel: { id: string; fel: string }[];
        try {
          fel = await d.spara(framjade);
        } catch (e) {
          fel = framjade.map((x) => ({ id: x._id ?? `auction-${x.productId}`, fel: felText(e) }));
        }
        for (const f of fel) r.errors.push(`promote ${f.id}: ${f.fel}`);
        ejSparade = new Set(fel.map((f) => f.id));
      }
      for (const p of framjade) {
        if (!ejSparade.has(p._id ?? `auction-${p.productId}`)) r.promoted.push({ slug: p.slug, slot: p.slot, startAt: nastaStart });
      }
      const saknas = behov - r.promoted.length - ejSparade.size;
      // Kön tog slut är inget "kvar"; tiden, fönstret eller ett pris som inte
      // gick att läsa är det (den raden står kvar i kön till nästa tick).
      if (saknas > 0 && (qi < pool.length || felLasningar > 0)) r.kvar.framjanden = saknas;
    }
  }

  // 5) Butiken: töm och värm sidorna vars pris ändrades. Best-effort — ett nej
  //    här fäller inte ticket (butikens cron tar det inom fem minuter).
  if (prisAndrade.length > 0) {
    try {
      r.butiken = await d.uppdateraButiken(prisAndrade);
    } catch (e) {
      r.butiken = { utfall: "misslyckades", fel: felText(e).slice(0, 200) };
    }
  }

  r.wix429 = stat.wix429;
  r.klar = Object.values(r.kvar).every((n) => n === 0) && !r.framjandenVantar;
  r.ok = r.errors.length === 0;
  r.liveCount = live.length + r.promoted.length;
  r.tidMs = d.nu() - start;
  return r;
}
