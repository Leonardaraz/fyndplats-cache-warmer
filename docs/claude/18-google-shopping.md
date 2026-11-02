## Google Shopping: huvudfeed i butiksrepot, TILLÄGGSFEED här (2026-09-15)

Butiksrepot (`fyndplats-headless`, gren `headless-site`) har sedan 2026-07 en
huvudfeed till Merchant Center: `/feed/google.xml`, RSS på variantnivå med
`g:id` = Wix-variantens id, `g:item_group_id` = produktens, brand Fyndplats,
`identifier_exists` no, kategori via kollektionens slug, upp till tio bilder,
ISR en gång i timmen. **Den behöver ingen tvilling.** Briefens "ingen feed
finns" gällde det här repot.

⚠️ **Huvudfeeden skickar `g:mpn` = Wix-variantens SKU ("FP-…").** Det är vårt
eget, inte Aosoms nummer, så det läcker inget — men briefens beslut #3 är
"ingen mpn", och Google förväntar sig ingen mpn på en rad med
`identifier_exists: no`. Tas bort i butiksrepot (marknadsplan v3, vecka 1).

Det huvudfeeden inte kan bära är det som bara finns i mappningarna här:
prisgruppen (A/B), prisbandet och konkurrensläget. Därför
en **tilläggsfeed** (`lib/feed/google-shopping.ts`,
`/api/feed/google-shopping-tillagg?nyckel=<GOOGLE_FEED_SECRET>`): bara `id`
+ `custom_label_0/1/2`. Merchant Center slår ihop den med huvudfeeden på `id`,
och kampanjen väljer produkter på `custom_label_0` (A/B — tom = inte med).
`?lage=status` (räknarna) nås även med CRON_SECRET — workflow
**"Google Shopping — tillaggsfeedens status"**.

### Fyra egenskaper som inte ska tas bort

1. ☠️ **Id:t är VARIANTENS** (`variants[0].wixVariantId`), inte produktens.
   En rad på produkt-id matchar ingenting i huvudfeeden och etiketten sätts
   tyst aldrig. Utan variant-id utelämnas raden och räknas.
2. ☠️ **Inget artikelnummer, inget inköpspris, inget belopp** — etiketterna
   är ord. Inga belopp står i feeden. Testet låser det.
3. ☠️ **Band och läge räknas på BUTIKENS pris** (`listV3ProductPrices`),
   aldrig på mappningens `grossSek`. Tvetydigt pris → ingen etikett.
4. ☠️ **Under 200 rader svarar rutten 503**, så Google behåller förra
   tilläggsfeeden. Ett tomt svar hade strukit varje etikett — och därmed
   varje produkt ur kampanjen — tills nästa hämtning.

Nyckeln ligger bara på Vercel och matas in i Merchant Center för hand; fel
nyckel ger 404, inte 401. Nio tester.

⚠️ **Prisgrupp och konkurrensläge är avvecklade 2026-10-21** (Leonard: vi jämför inte med
dealproffsen). Ingen rad har `prisgrupp`, så `custom_label_0` är tomt för alla och en kampanj som
väljer på den får inga produkter. Vad kampanjen väljer på i stället är Leonards beslut.
Tilläggsfeeden svarar 503 under 200 rader, så Google behåller förra versionen.
