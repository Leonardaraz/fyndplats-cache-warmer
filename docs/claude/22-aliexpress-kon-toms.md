## AliExpress-kön töms: väntande AliExpress-recensioner döljs (2026-10-06)

Leonards beslut: de AliExpress-recensioner som ligger i /admin/reviews och
väntar på översättning och godkännande behövs inte. `POST
/api/admin/recensioner-ae-ko` (workflow `recensioner-ae-ko.yml`, torrt som
default) sätter status `rejected` på varje `pending`-rad vars källa är
AliExpress (`source` saknas eller är `"aliexpress"`). Logiken:
`lib/reviews/ae-ko-rensning.ts`.

☠️ Dölj, radera aldrig: den dolda raden är också dubblettspärren, så en
raderad rad hade köats igen nästa gång produktens AliExpress-recensioner
hämtas. ☠️ Publicerade AliExpress-recensioner, Aosom-rader och kundomdömen
rörs inte.

**Inga nya AliExpress-recensioner hämtas** (Leonard 2026-10-06: "jag vill inte
att vi hämtar aliexpress recensioner längre"). Stoppet sitter på tre ställen:

1. `importReviewsForProduct` sparar ingen rad utan källa (= AliExpress). Det
   täcker produktimporten, tillägget (`/api/reviews/import`) och backfillen.
   Aosom-inläsningen skickar `source: "aosom"` och går igenom.
2. `/api/cron/review-queue` svarar med ett tomt svep (`stoppad: true`) utan
   att hämta något.
3. `/api/import` köar inga recensioner efter en produktimport.

`aeRecensionerStoppade()` i `lib/reviews/ae-ko-rensning.ts` styr 2 och 3.
`AE_RECENSIONER=pa` slår på dem igen, men steg 1 gäller ändå. AliExpress-
fotoåterställningen (`review-image-restore`) hämtar bara foton till rader som
redan finns och rörs inte.
