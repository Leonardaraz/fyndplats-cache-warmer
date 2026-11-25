// POST /api/kassa/stripe/fortsatt — kunden tryckte på "Slutför betalningen hos
// Klarna" i kassans ruta för en öppen betalning (app/kassa/kassa.tsx).
//
// Rutten gör EN sak: skriver en loggrad. ☠️ Utan den gick det inte att se om
// en kund som kom tillbaka till kassan två gånger med betalningen öppen hade
// tryckt på länken eller bara bytt app (2026-11-25). Raden bär webbläsarens
// sort och ingenting annat: aldrig betalningens id, och kroppen läses inte.
// Följs raden av "stripe retur: succeeded" från samma sorts webbläsare tog
// länken kunden hela vägen; följs den av "vantar_kund" kom kunden tillbaka utan köp.
//
// Ingen växelkoll och inget svar att vänta på: sidan skickar med sendBeacon i
// samma tryck som den lämnas.

import { webblasarsort } from "@/lib/kassa/stripe-klient";

export const dynamic = "force-dynamic";

export function POST(req: Request) {
  console.info(`[kassa] stripe fortsätter öppen betalning [${webblasarsort(req.headers.get("user-agent"))}]`);
  return new Response(null, { status: 204, headers: { "Cache-Control": "private, no-store" } });
}
