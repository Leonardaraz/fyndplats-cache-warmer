## Recensionernas svenska ska låta som en kund, inte som en AI (2026-09-24)

Leonard 2026-09-24: recensionerna var välskrivna men såg AI-skrivna ut —
tankstreck, perfekt grammatik och stela fraser. 709 av 4 268 publicerade
Aosom-texter hade tankstreck. Stilen från och med nu, för all översättning
(även prompten i `buildTranslatePrompt` för /admin/reviews):

- Inga tankstreck (`–`, `—`, ` - `), inga semikolon, inga citattecken, ingen `…`.
- Vardagliga ord och korta meningar: "lätt att sätta ihop", "funkar bra",
  "prisvärd", "rekommenderar". Inga AI-fraser: "Sammantaget",
  "Sammanfattningsvis", "helt och hållet", "förhållandet mellan pris och
  kvalitet", "kan varmt rekommenderas", "ett riktigt blickfång".
- Samma längd och ton som originalet — ett slängigt original får bli lite
  slängigt. Inga påhittade stavfel: vardaglig, inte slarvig.
- Det ska låta som en människa skrev det (Leonard 2026-10-31). Saknar originalet
  punkt sist saknar svenskan den också, och smilisar och emojis står kvar som de
  är (`:)`, `;)`, `😊`). Stilgrinden (`stilfel` i `lib/reviews/polering.ts`)
  släpper semikolonet i en smilis.
- Handlar recensionen bara om leveransen döljs den. Handlar den om produkten och
  säger också något allmänt om leveransen (snabb leverans, väl förpackat) står
  den kvar med den raden (Leonard 2026-10-31). Budfirmans namn stryks.
- Innehållet ändras aldrig, och tvätten gäller som förut (inga varumärken,
  butiker, budfirmor, namn, priser, leveranstider, kundtjänst, diagnoser).

**Omskrivning av det som redan är publicerat:** `POST /api/admin/recensioner-omskrivning`
(logik `lib/reviews/omskrivning.ts`, workflow `recensioner-omskrivning.yml` med
`payload_file` i en tillfällig gren, torrt som default). Den ENDA vägen som
byter text på en synlig rad, och bara när: raden är `source: "aosom"`, raden är
synlig, den lagrade texten fortfarande är exakt `fore` (en människas ändring
skrivs aldrig över), och den nya texten klarar `validateTranslation`. En rad
med `dolj: true` döljer en recension som visat sig handla om en annan produkt.
