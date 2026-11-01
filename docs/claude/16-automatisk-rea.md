## Automatisk rea: jämförpriset följer lagen (`lib/pricing/rea.ts`, 2026-11-01)

Leonards fråga: får en produkt en reaskylt när synken sänker priset? Nej. Synken
skriver bara `actualPrice`, och butikens "Rea", sidan /rea och Google-flödets
`sale_price` kommer från Wix `compareAtPrice`. Samma dag fanns 50 reaskyltar
utanför fyndauktionen, och 49 av dem visade ett överstruket pris som inte var det
lägsta de senaste 30 dagarna. De 49 jämförpriserna togs bort i Wix 2026-11-01,
lästes tillbaka och mättes på de publicerade sidorna. Leonard sa sedan "Fixa" till
förslaget: en reaskylt av sig själv när priset verkligen har sänkts, med rätt
överstruket pris, i högst 30 dagar, och bara för sänkningar på minst 10 %.

**Lagen** (7 a § prisinformationslagen): det tidigare priset ska vara det lägsta
som tillämpats de 30 dagarna före sänkningen, och vid en gradvis sänkning priset
före den första sänkningen. Regeln, och varje försiktigt val, står i
`lib/pricing/rea.ts`.

Timjobbet `/api/cron/rea?dryRun=false` (minut 40, utanför Aosoms synkfönster och
före VEVOR-synken) → `lib/pricing/rea-kor.ts`:

1. Läser varje variants pris och jämförpris ur Read-Only Variants API
   (`lib/wix/jamforpris.ts`, svepet i `lib/wix/variant-svep.ts`, som
   kostnadsverktyget delar).
2. För prisförloppet per variant i `FyndplatsPrisforlopp` (`lib/pricing/rea-lager.ts`,
   en rad per produkt, bara produkter som någon gång gått att köpa).
3. Bestämmer varje variants jämförpris och skriver ändringarna produkt för produkt
   (`skrivJamforpriser`), med läsning tillbaka och uppföljning av variantbilden.

Workflowen **"Rea — automatisk reaskylt vid verklig prissänkning"** (`rea.yml`):
`status` · `torr` · `skarp` · `seed-torr` · `seed` · `pa` · `av`.

**Jobbet äger jämförpriset utanför auktionen.** Ett jämförpris som inte följer av
historiken tas bort, också ett som satts för hand. En produkt i en levande auktion
(`live`, också en schemalagd) rörs inte alls.

Tre spärrar innan ett jämförpris skrivs, och alla tre ska stå kvar:

1. ☠️ **`seedKlar`**: historiken är fylld bakåt ur butikens dagliga prisavläsning.
2. ☠️ **`skriv`** (strömbrytaren, `pa`/`av`): av som standard. Historiken förs ändå.
3. ☠️ **Historiken för körningen sparades.** Föll den rörs inga priser, och
   `senast` står kvar så att nästa körning ser luckan.

Tio egenskaper som inte ska tas bort:

1. ☠️ **Jämförpriset blir aldrig högre än lagens, i den strängaste läsningen.** En
   prisändring syns upp till ett dygn sent (timavläsningen, och dygnsavläsningen
   bakåt), så fönstret räknas ett dygn längre (`MARGINAL_MS`), en sänkning räknas
   till en gradvis följd bara när den säkert låg inom 30 dagar, och det lägsta
   priset tas från den tidigaste sänkning lagen kan räkna. Ett egenskapstest kör
   20 000 slumpade förlopp mot facit på det verkliga förloppet.
2. ☠️ **En ny produkt har ingen rea.** Historiken måste täcka hela fönstret, och
   varianten måste ha gått att köpa när det började.
3. ☠️ **En tid då varianten inte gick att köpa är inget pris.** Ett utkasts pris
   hade annars gett en sänkning som ingen kund sett.
4. ☠️ **En lucka (mer än tre timmar mellan två körningar) i fönstret ger ingen rea.**
5. ☠️ **En auktion i fönstret ger ingen automatisk rea**: auktionens lägsta pris är
   ett tillämpat pris som historiken inte ser. Auktionens seed köar inte en produkt
   med jämförpris, så en vara med rea går inte till auktionen förrän skylten är borta.
6. ☠️ **Ett jämförpris sätts bara på det pris beslutet gällde.** Har synken skrivit
   ett nytt pris under tiden väntar varianten till nästa körning.
7. ☠️ **Ett nytt pris tar bort jämförpriset** (`updateV3VariantPrices`). Annars hade
   en höjning stått som "Rea" tills jobbet hann räkna om.
8. ☠️ **Bakåtfyllningen gäller bara produkter med en variant.** Butikens avläsning
   sparar det lägsta priset bland produktens varianter, och när en billigare färg
   slogs ihop med sidan hade den nya färgens historik visat en sänkning som aldrig
   hänt. Flervariantsprodukter får rea först efter 30 dagar egen timhistorik.
9. ☠️ **Masspärren** (`MAX_NYA` = 200 nya reaskyltar per körning). Fler än så skrivs
   inte, bara borttagningarna. Läs planen (`torr`) och kör `skarp` med `max_nya`
   om den stämmer.
10. ☠️ **Svaret och loggen bär bara antal och Wix-id, aldrig priser.**

⚠️ **Vad historiken inte ser:** det som fyllts bakåt ur butikens avläsning (02:30
UTC varje dag, sedan 2026-09-17) ser ett pris om dagen. En sänkning som kom och gick
mellan två avläsningar syns inte där. Det gäller bara de första 30 dagarna efter
starten; från första körningen läses priset varje timme.

**Efter mergen,** i den ordningen: timjobbet för historiken från första körningen
(strömbrytaren är av). Kör `seed-torr` och läs talen, sedan `seed`, sedan `torr`
och läs planen (nya, byten, borttagningar och `medRea`). Titta på några produkter i
planen. Slå sedan på med `pa`, och mät sidorna live efter nästa körning.
