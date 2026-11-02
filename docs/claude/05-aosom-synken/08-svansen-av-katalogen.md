### ☠️ Synken nådde aldrig svansen av katalogen (2026-10-13)

Leonards rapport: order 10088, en smal bokhylla (`bd664764`), såldes för
**749 kr**. Inköpet var exakt feedens tal, och husets regel på det ger
**819 kr**. Marginalen blev ungefär hälften av husets 17 %. Priset stod orört
sedan 2026-09-24.

Två fel, och båda var synliga i loggraden:

1. ☠️ **Priskörningen åt upp sin tidsbudget innan den började.** Priserna per
   variant för de sammanslagna sidorna lästes före loopen, ett GET per sida,
   för HELA katalogen. Kommentaren sa "de är få"; den 2026-10-13 var de ~360.
   Nattens priskörning granskade 550 av 4 938 och stannade på tidsbudget, och
   en torrkörning samma kväll granskade **noll**. Läsningen görs nu per tugga
   (`lasVariantPriserFor`), bara för de sidor som granskas. Ett test fäller den
   gamla vägen.
2. ☠️ **Ingen körning nådde svansen.** Utan sparad markör började varje körning
   om från början. Lagerkörningen skrev 400 saldon i de första ~2 500
   artiklarna och stannade på `limit` fyra gånger om dagen (`2378 kvar`), och
   priskörningen nådde aldrig förbi de första 550.

Lagningen:

- **`?rotation=lager|pris`** (`lib/aosom/sync-markor.ts`, tabellen
  `sync_markor`). En schemalagd körning fortsätter efter förra körningens
  markör och sparar sin egen. Går den hela vägen börjar nästa om.
- **Priserna körs fyra gånger per dygn** (03, 09, 15 och 21 UTC), lagret som
  förut fyra, och båda har `limit=1200`. Tidsbudgeten är det som stoppar.

Fem egenskaper som inte ska tas bort:

1. ☠️ **Bara skarpa körningar flyttar markören.** En torrkörning för hand hade
   annars fått nattens körning att hoppa över det torrkörningen tittade på.
2. ☠️ **En körning som stannar innan första tuggan behåller den gamla markören.**
   Att nollställa den hade skickat nästa körning till början igen, alltså
   samma fel som markören lagar.
3. ☠️ **Ett okänt rotationsnamn är 400.** En felstavning i `vercel.json` hade
   annars tyst gett en körning utan markör.
4. **En markör som inte går att läsa stoppar inte synken.** Lagret är det
   brådskande; körningen börjar från början och loggraden säger det.
5. ☠️ **Markören är ett artikelnummer och skrivs aldrig ut.** Loggraden säger
   bara `fortsatte från sparad markör` eller `började från början`.

⚠️ **Läs `stoppade på` och `kvar` i loggraden.** Båda felen stod där varje
körning (`stoppade på tidsbudget, 4346 kvar`) utan att något larmade. En
priskörning som stannar på tidsbudget med noll granskade är ett fel, inte en
lugn natt.
