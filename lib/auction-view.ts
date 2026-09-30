// lib/auction-view.ts
//
// Storefrontens läs-vy för Fyndauktionen. Motorn (prisstegning, rotation,
// PATCH:ar) bor i cache-warmer-appen på main-grenen (lib/auction/engine.ts +
// /api/cron/auction-tick); här LÄSER vi bara:
//
//   1. Auktionsraderna — via motorns /api/auctions/rader (lib/auction-motor.ts),
//      inte ur Wix Data direkt sedan 2026-09-29: raderna flyttar till Postgres.
//   2. Produktkatalogen — priset som VISAS är alltid Wix-priset (källan till
//      sanning = det som debiteras i kassan). Skulle cron-ticken faila visas
//      alltså aldrig ett lägre pris än det kunden betalar.
//
// SÄKERHET: golvpriset och prisstegen skickas ALDRIG till klienten — annars
// kan man läsa ut slutpriset och snajpa golvet. Klienten får bara aktuellt
// pris + tidpunkt för NÄSTA sänkning.

import { getFreshPrices, getProducts, type Product } from "./products";
import { synligaFynd } from "./auction-visible";
import { nextDropOfLadder } from "./auction-day";
import { hämtaAuktionsrader, type MotorRad } from "./auction-motor";

type AuctionRow = MotorRad;

/** Det som klienten får se för en live-auktion (inget golv, ingen stege). */
export type LiveAuctionView = {
  slug: string;
  name: string;
  img: string;
  /** Andra galleribild — hover-bytet på korten (samma mönster som butikskorten). */
  img2: string;
  priceNum: number;
  priceFormatted: string;
  listPrice: number;
  discountPercent: number;
  /** ISO för nästa prissänkning, null = golvet nått (sista pris). */
  nextDropAt: string | null;
  /** ISO när auktionsdagen börjar (07:00) om den ligger i framtiden, annars null. */
  startsAt: string | null;
  /** ISO för dagens start (07:00) — även när den passerat. Driver dramaturgin
   *  (färgtemperatur, tändning kl 18). Avslöjar inget: starttiden är publik. */
  startAt: string | null;
  /**
   * Serverns klocka när vyn byggdes. Skickas i stället för färdiga flaggor så
   * att ALLA konsumenter (kort, hjältekort, pill, startsidans banner) kan köra
   * samma rena fasmaskin — `auctionPhase(serverNowMs, …)` före hydrering,
   * `auctionPhase(clientNow, …)` efter. Två tidigare varianter hade i stället
   * en `closed`-boolean plus handrullade ternärer i komponenterna; de hann
   * hinna säga emot maskinen (granskning 2026-08-14) och glömdes bort på
   * startsidan. OBS: värdet är lika gammalt som sidans ISR-fönster — på
   * /fyndauktion 60 s, på startsidan upp till en timme.
   */
  serverNowMs: number;
  slot: number;
  inStock: boolean;
};

export type SoldAuctionView = {
  slug: string;
  name: string;
  img: string;
  soldPrice: number;
  listPrice: number;
  discountPercent: number;
  endedAt: string;
};



// Auktionspriser är alltid hela 9-kronor → visa "369 kr" (rent/premium), inte
// "369,00 kr". Vi formaterar alltid ur priceNum (Wix `p.price`-strängen bär med
// sig ören som vi inte vill visa här).
const fmtKr = (n: number) => `${Math.round(n).toLocaleString("sv-SE")} kr`;

/** Live-auktioner (max 5), joinade mot katalogen. Fail-open: tom lista. */
export async function getLiveAuctions(): Promise<LiveAuctionView[]> {
  const [rows, products] = await Promise.all([hämtaAuktionsrader("live"), getProducts()]);
  const bySlug = new Map<string, Product>(products.map((p) => [p.slug, p]));
  const now = Date.now();
  // Ett sålt fynd ersätts inte samma dag — regeln och skälen i
  // lib/auction-visible.ts.
  const synliga = synligaFynd(rows, now);
  // Priset färskt ur Wix: katalogen i getProducts() kan vara timmar gammal på
  // en varm instans, och auktionspriset byts varje timme.
  const farska = await getFreshPrices(synliga.map((r) => r.slug ?? "").filter(Boolean));
  return synliga
    .map((r) => {
      const katalog = bySlug.get(r.slug ?? "");
      if (!katalog || !r.listPrice) return null;
      const p = { ...katalog, ...farska.get(katalog.slug) };
      const discount = Math.max(0, Math.round((1 - p.priceNum / r.listPrice) * 100));
      return {
        slug: p.slug,
        name: p.name,
        img: p.img,
        img2: p.gallery?.find((g) => g !== p.img) ?? "",
        priceNum: p.priceNum,
        priceFormatted: fmtKr(p.priceNum),
        listPrice: r.listPrice,
        discountPercent: discount,
        nextDropAt: nextDropOfLadder(r, now),
        startsAt: r.startAt && Date.parse(r.startAt) > now ? r.startAt : null,
        startAt: r.startAt ?? null,
        serverNowMs: now,
        slot: r.slot ?? 0,
        inStock: p.inStock,
      } satisfies LiveAuctionView;
    })
    // Slutsålt under dagen syns inte: kunden kan inte köpa det, och sidan
    // lovade ändå "Köp nu". Motorn avslutar raden vid 19 som vanligt.
    .filter((x): x is LiveAuctionView => Boolean(x) && x!.inStock)
    .sort((a, b) => a.slot - b.slot);
}

/** Senast sålda fynd (för social proof-listan). */
export async function getSoldAuctions(limit = 6): Promise<SoldAuctionView[]> {
  // Motorn sorterar (nyast först) och skickar högst 50: med hela katalogen i
  // lagret räcker det inte att sortera 50 rader hämtade i godtycklig ordning.
  const [rows, products] = await Promise.all([hämtaAuktionsrader("sold"), getProducts()]);
  const bySlug = new Map<string, Product>(products.map((p) => [p.slug, p]));
  return rows
    .filter((r) => r.soldPrice && r.listPrice && r.endedAt)
    .sort((a, b) => Date.parse(b.endedAt!) - Date.parse(a.endedAt!))
    .slice(0, limit)
    .map((r) => ({
      slug: r.slug!,
      name: r.name || bySlug.get(r.slug!)?.name || r.slug!,
      img: bySlug.get(r.slug!)?.img || "",
      soldPrice: r.soldPrice!,
      listPrice: r.listPrice!,
      discountPercent: Math.max(0, Math.round((1 - r.soldPrice! / r.listPrice!) * 100)),
      endedAt: r.endedAt!,
    }));
}
