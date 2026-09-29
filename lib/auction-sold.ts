// lib/auction-sold.ts
//
// Fyndauktionens DIREKT-FÖRSVINNANDE: så fort någon köper ett live-fynd ska
// det bort från auktionen — inte vid nästa timcron. Anropas från
// app/api/wix-webhook (order_created) med orderns produkt-id:n.
//
// Sedan 2026-09-29 gör MOTORN jobbet (POST /api/auctions/avsluta, se
// lib/auction-motor.ts): priset tillbaka till ordinarie FÖRST, sedan
// status=sold. Butiken hade tidigare en egen port av båda stegen mot Wix Data,
// men raderna flyttar till Postgres, och en butik som fortsatt skriva till Wix
// hade avslutat auktioner i ett lager ingen läser. Två kopior av en
// prisåterställning var dessutom två ställen där ett auktionspris kunde bli
// kvar.
//
// Timcronens sold-detektering ligger kvar som backup: failar något här tar den
// över inom timmen. Idempotent: bara live-dokument träffas, så Wix
// dubbelfyrningar (created + approved + retries) gör ingenting andra gången.

import { avslutaHosMotorn } from "./auction-motor";

/**
 * Avsluta live-auktioner vars produkt finns bland `productIds` (orderns rader).
 * Returnerar sluggarna som avslutades — tom lista = ingen auktionsprodukt i
 * ordern (det normala). Kastar när motorn inte svarar; webhooken loggar det.
 */
export async function endLiveAuctionsForProducts(productIds: string[]): Promise<string[]> {
  return avslutaHosMotorn(productIds);
}
