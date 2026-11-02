## ☠️ Butikens kategorilista kapades vid 100 (2026-09-24)

Sökordsrundorna S4–S10 skapade drygt 40 kategorier på ett dygn, och
katalogen passerade 100 kategorier. Butiken (`headless-site`,
`lib/products.ts`) läste kategorierna med `.limit(100)` och hämtade aldrig
nästa sida. Det gällde både menyn och listan över kända slugar.

Wix sorterar på id, så en kategori över plats 100 faller bort oavsett hur
gammal eller stor den är. Den försvinner ur menyn, och dess sida svarar 404.
Så gick det:

- Golvlampor gav 404 i produktion.
- Efter S10 låg nio kategorier utanför, bland dem Skönhet & Hälsa, som är en
  huvudavdelning.

Lagat i #649 (`lib/category-paging.ts`). Lagningen hämtar alla sidor, och taket
kastar i stället för att kapa. Tills den var ute var de åtta nya
S10-kategorierna dolda i Wix. Bara synligheten ändrades, inte kopplingarna.

☠️ **Felet syntes på en GAMMAL sida, inte på de nya.** Hantlar & hantelset, som
var OK i förra förhandsbygget, gav 404 i nästa. Den som skapar kategorier ska
därför hämta minst en befintlig kategorisida i förhandsbygget, inte bara de nya.

☠️ **Sida två får bara bära markören.** `categories/query` svarar `400
INVALID_CURSOR` på filter och markör i samma anrop. Det är samma familj som
`inventory-items/query` och `products/search`. SDK:ts `next()` gör rätt av sig
självt, men en handskriven loop gör det inte.
