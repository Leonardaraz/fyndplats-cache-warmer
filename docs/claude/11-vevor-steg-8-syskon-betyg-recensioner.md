## VEVOR: steg 8, syskon, betyg och recensioner vid importen (2026-10-29)

Leonards tre önskemål 2026-10-29, alla vid importen: syskonen slås ihop till
en produkt, recensionerna följer med (VEVOR har sagt ja till att vi använder
dem), och en artikel med under 3,8 i snitt och minst fem recensioner
importeras inte.

**Läsaren** (`lib/vevor/sida.ts`) sparar betyget (`aggregateRating`) och upp
till tio recensioner (`review`) ur sidans JSON-LD: betyg, text, datum och
namn. Uppmätt på 35 sparade sidor: 33 hade betyg, 2 av dem under 3,8 med
minst fem recensioner. Texterna är på originalspråket (spanska, tyska,
engelska). En avläsning från före steg 8 saknar fälten.

**Betyget** (`betygshinder` i `lib/vevor/to-product.ts`): under `BETYG_GRANS`
(3,8) med minst `BETYG_MIN_ANTAL` (5) recensioner är hindret `lagt_betyg`. En
sida utan betyg är inget hinder. ☠️ En avläsning utan fältet (läst före
steg 8) är `betyg_okant` och väntar på nästa läsning, i stället för att
importeras på okänt betyg.

**Syskonen** (`lib/vevor/familj.ts`): sidans syskonlänkar
(`DETAIL_ATTR_LINK`) och syskonens egna avläsningar blir en produkt med en
variant per artikel och en axel per egenskap (`PRODUCT_DATA.attr`). Varje
variant bär sitt eget artikelnummer, saldo och inköp, och mappningen läses
som en sammanslagen Aosom-sida (`artikelbild`, utfallet `flera`), så synken
skriver lager och pris per variant. Uppmätt: 7 av 35 sidor hade syskon, 2–6
artiklar per familj.

Sju egenskaper som inte ska tas bort:

1. ☠️ **Värdena kommer från syskonets egen sida**, aldrig från länklistan.
   Bara syskon med en egen avläsning följer med.
2. ☠️ **Samma axlar och ingen kombination två gånger**, annars går
   varianterna inte att skilja åt. Då blir artikeln en egen produkt som förut
   och räknas i `familjer.ejSammanslagna`. Det gäller också ett axelnamn
   eller ett värde över 50 tecken (`for_langt_namn`, `WIX_MAX_VALNAMN`):
   Wix avvisar då hela produkten (`400 … choices[1].name has size 58,
   expected 50 or less`, importen 2026-10-30).
3. ☠️ **Ett syskon som redan sitter på en produkt följer inte med**, och en
   artikel vars familj redan finns som produkt importeras inte
   (`syskon_finns`). Den läggs till på familjen för hand. Dubblettspärren ser
   varianternas artiklar genom `vevorArtiklar` på mappningen (`$hasSome`,
   uppmätt mot skarpa Wix 2026-10-29).
4. **Ett syskon som är slut följer med med saldo 0**, så att det inte blir en
   egen produkt när det kommer tillbaka.
5. ☠️ **Ett syskon utan betyg gör att hela familjen väntar**, och så gör ett
   syskon som inte lästs alls men står i läsarens kö (`arPaVag`, sedan
   2026-10-30, Leonard: *"Gör det som blir proffsigast och effektivare"*).
   Annars hade artikeln importerats ensam, och syskonet blivit en egen
   produkt eller blockerats av punkt 3. Väntan räknas som `syskon_vantar`,
   skilt från artikelns eget `betyg_okant`. Ett syskon som inte står i kön, är
   borta, saknas, har flyttat, är spärrat eller inte går att tolka väntar
   familjen inte på, för då hade den väntat för alltid.
6. **VEVOR:s egen svenska skickas som manuella namn** (`variantNameOverrides`,
   `axisNameOverrides`). Ett variantvärde går inte att döpa om i Wix efteråt,
   så en känd felöversättning rättas före: "20 miljoner" på en längdaxel blir
   "20 m" (`rensaVarde`).
7. ☠️ **Varje artikel får sina egna bilder, och varje bild finns en gång**
   (`familjensBilder`, sedan 2026-10-30). Se nästa avsnitt.

### Familjeregeln: bara färg, storlek, längd och förpackning delar en sida (2026-10-30)

Leonard 2026-10-30: *"Följ rekommendationen"*. En VEVOR-familj slås ihop
till en sida bara när varorna är samma produkt i olika färg, mönster,
storlek, längd eller förpackningsstorlek. Varor som fungerar olika (effekt,
kapacitet, modell, ett annat antal lådor) får en egen sida var. Skälet är
recensionerna: en recension av 1 800 W-sågen hör inte hemma på 850 W-sågens
sida, och Googles flöde kräver att varianter är samma vara.

`lib/vevor/axelklass.ts` klassar varje axel som `farg`, `storlek`, `langd`,
`forpackning`, `funktion` eller `oklar`. Uppmätt 2026-10-30 på 923 länkade
familjer: 473 olika axelnamn, vanligast Storlek (197), Färg (131), Kapacitet
(54), Stil (46), Kvantitet (44) och Typ (43).

Fem egenskaper som inte ska tas bort:

1. ☠️ **En funktionsenhet som skiljer gör axeln till `funktion`**, vad den än
   heter (W, kW, V, Ah, bar, psi, liter …). "Storlek: 3 L / 6 L" är
   kapacitet. En enhet som är lika i alla värden avgör inte ("5 kW-Röd").
2. ☠️ **En axel som inte går att avgöra är `oklar`** (Material, Stil, Form,
   ett mått utan tal) och familjen slås inte ihop. Gränsfallen listas för
   Leonard i stället för att gissas.
3. **Ett sammansatt namn avgörs del för del** ("Färg-Size", "Antal och
   färg"), och alla delar måste vara tillåtna.
4. ☠️ **Förpackning är bara ett namn som är en förpackning** ("Antal",
   "Kvantitet", "Antal stycken"). "Antal lådor" och andra antal av en del är
   funktion.
5. **Regeln prövas efter Wix gränser** i `byggFamilj`, så att
   `for_manga_axlar`, `for_langt_namn` och `samma_kombination` säger det
   verkliga skälet. En axel med samma värde för alla avgör inte. Utfallen
   räknas i `familjer.ejSammanslagna` (`funktion`, `oklar_axel`).

**Artiklar med samma SPU utan länkar** (`byggSpuFamilj`, `lasSpuGrupper`):
VEVOR länkar inte alla varianter. Artiklar med samma SPU och samma betyg
(snitt och antal) blir en familj när axlarna ur specifikationen (raderna som
skiljer, högst två, utan vikt, förpackning och artikelnummer) klarar
familjeregeln, titlarna förklaras av artikelns egna värden och ingen rad visar
en funktion som skiljer. Uppmätt 2026-10-30: 637 sådana grupper med 2 271
artiklar. ☠️ Bara artiklar utan länkar räknas till gruppen, så en ensam
artikel i en länkad familjs SPU blir ingen grupp. Sammanslagna SPU-familjer
räknas i `familjer.spu`. Specifikationsrättningen (`spec-ratta.ts`) tar en
SPU-familjs axlar ur mappningens val och en länkad familjs ur egenskaperna,
som importen.

**Recensionerna på en familj bär varianten kunden köpte** (`kopt` på raden,
"Svart / 50 liter", samma namn som familjens flik, `variantEtiketter`).
Importen sätter fältet, `/api/reviews/<id>` skickar det, och butiken visar
"Köpt: …". Recensionsverktyget ("VEVOR — recensioner om en annan artikel")
märker raderna på familjer som redan finns (`attMarka`, `markta`), ur
mappningens val. En produkt med en artikel får inget fält.

**De utkast som fanns före regeln** rättas med workflowen **"VEVOR —
familjeregeln på befintliga utkast"** (`plan` · `radera`) →
`/api/admin/vevor-familjeregel` → `lib/vevor/familjeregel-plan.ts`. Planen
säger vilka familjer som ska delas (`dela`, en axel för funktion), vilka
ensamma utkast som ska slås ihop (`slaIhop`, samma SPU) och vilka gränsfall
Leonard ska avgöra (`grans`, per axelnamn med Wix-id). `radera` raderar
utkasten i `dela` och `slaIhop` med samma spärrar som steg 8 (bara opolerade
och dolda, aldrig en produkt i en order, importen avstängd, `bekrafta` =
planens antal, planen får krympa men aldrig växa) och nollställer importens
markör, så att importen bygger om dem med regeln. ☠️ Gränsfallen raderas
aldrig. Ordningen: `plan`, importen av, `radera`, `plan` igen (raderbara 0),
importen på.

**Körd 2026-10-30** (Leonards ja efter planen). Planen 20:32 UTC: 5 411
opolerade utkast, 292 familjer, 116 att dela, 4 utkast att slå ihop (1
familj), 120 raderbara, 0 hinder och 59 gränsfall på 38 axlar. Importen av
21:16:53, `radera` 21:17–21:19: 118 raderade och 2 obekräftade (Wix läsning
släpade efter), och ett andra varv 21:22 fann dem borta (`fannsInte` 2) och
nollställde markören. Planen 21:23 gav 0 raderbara och 5 291 utkast, och
importen slogs på 21:24. Första körningen (21:33): 925 granskade, 30
importerade, 0 fel och 0 föräldralösa. Gränsfallen är orörda.

⚠️ **GPSR läses på radens artikel.** En familj har samma tillverkare, och
standardraden gäller alla. ⚠️ **Leverantörslänken pekar på ankarets sida.**
Den som beställer väljer varianten på VEVOR:s sida, som har samma väljare.

**Recensionerna** sparas som dolda rader (`importReviewsForProduct`, källan
`vevor`) med husets filter, och översätts och godkänns i /admin/reviews som
Aosoms. Ett fel där fäller inte importen och räknas i `recensioner.fel`.
Butiken visar källan `vevor` som okänd, utan märkning.

☠️ **Bara recensioner om produktens egna artiklar** (sedan 2026-10-30). VEVOR
visar en familjs recensioner på varje artikel i familjen: på 44 sparade sidor
gällde 129 av 424 recensioner sidans egen artikel och 295 en annan storlek,
färg eller vara i samma familj. 4 044 av 5 182 VEVOR-utkast med recensioner
delade minst en text med ett annat utkast, och en text låg på upp till 31.
Läsaren sparar artikeln kunden köpte (`artikel` på `VevorRecension`, ur
`REVIEWS_DATA.allReview[].goods_sku`, parad på texten), och importen tar bara
recensioner vars artikel finns på produkten (en familj: alla dess artiklar).

Fyra egenskaper som inte ska tas bort:

1. ☠️ **En recension vars artikel inte går att avgöra tas inte med** (`null`:
   saknas, fel form, eller två rader med samma text säger olika).
2. ☠️ **En avläsning från före 2026-10-30 väntar** (`recension_okand`,
   `recensionshinder`): utan artikeln hade produkten blivit utan sina
   recensioner för gott. Ett sådant syskon får familjen att vänta.
3. **Befintliga rader** rättas med workflowen **"VEVOR — recensioner om en
   annan artikel"** (`plan` · `skriv`) → `/api/admin/vevor-recensionsartikel`
   → `lib/vevor/recensionsartikel.ts`. En väntande rad om en annan artikel döljs
   (`rejected`, `doldAv: "annan_artikel"`), och verktyget visar den igen om
   artikeln senare blir en del av produkten. ☠️ Godkända rader och rader en
   människa avvisat rörs aldrig. Kör den före fotoverktyget, som hoppar över
   dolda rader.
4. ☠️ **Svaret bär bara antal och Wix-id.**

**Kundernas foton följer med recensionerna** (Leonard 2026-10-30: *"jag vill
att alla bilder följer också med recensionerna så det inte blir
dubbeljobb"*). JSON-LD bär inga foton, men sidans egen recensionsdata
(`window.REVIEWS_DATA.allReview[].reviewPic[].big_pic`) gör det. Uppmätt på 32
sparade sidor: samma recensioner som JSON-LD (304 mot 303), texten skiljer bara
på radbrytningar, och 36 av dem hade foton, 52 totalt. Läsaren parar ihop dem
på texten och sparar högst tre foton per recension (`bilder` på
`VevorRecension`). Bara `adsimg-custom.vevorstatic.com` tas.

Fem egenskaper som inte ska tas bort:

1. ☠️ **Fotona hämtas av oss och läggs i Wix med den bekräftade vägen**
   (`vevorKundbild` i `lib/vevor/recensionsfoton.ts` →
   `lib/wix/bekraftad-bild.ts`), med vår egen användaragent. Import File svarar
   direkt och hämtar senare, och var sjätte Aosom-bild blev en död adress så.
2. ☠️ **Ett foto som inte gick att ladda upp behåller sin källadress** på den
   dolda raden, som förut. `vevorstatic.com` står därför bland
   leverantörsvärdarna i `lib/wix/media-import.ts`, så att raden flyttas hem
   innan den visas.
3. **Recensioner som importerades utan foton** får dem med workflowen
   **"VEVOR — recensionernas foton"** (`plan` · `skriv`) →
   `/api/admin/vevor-recensionsfoton`. Den parar ihop avläsningens recension
   och raden på texten och skriver bara fotofälten. ⚠️ Fotona finns först när
   läsaren läst om sidan efter 2026-10-30, ungefär ett dygn för hela katalogen.
4. ☠️ **En rad som redan har foton rörs inte**, och en körning till skriver
   ingenting.
5. ☠️ **Svaret bär bara antal och Wix-id**, aldrig fotonas adresser eller
   recensionernas text.

VEVOR:s `big_pic` är en WebP (`?format=webp`, ~1,9 MB). Originalet utan frågan
är en JPEG på ~4,6 MB. Webp används.

**Läsarens prioritering** läser varje artikel på en familj lika ofta som
produkten (`lasPrioritetsunderlag`), eftersom synken behöver en färsk
avläsning av varje variant.

**Beskrivningen städas vid importen** (`rensaBeskrivning` i
`lib/vevor/to-product.ts`, Leonard 2026-10-30). Uppmätt på 1 200 avläsningar:
475 hade rader två gånger eller fler, 57 bar VEVOR:s reklamblock ("Vevor är
ett ledande varumärke …", "30-dagars gratis retur", "Snabb och säker
leverans", "24/7 uppmärksam service") och 218 sloganen "Prestanda på
proffsnivå utan kostnad". Löftena är VEVOR:s, inte våra, och ska inte kunna
följa med genom poleringen. Bara exakta rader tas bort (gemener, rensade
mellanslag), och rubrikerna (Nyckelfunktioner, Specifikationer, Paketets
innehåll) står kvar. Avläsningen rörs inte. Utkasten som importerades före
2026-10-30 ~01:30 UTC bär den gamla texten; poleringen skriver om den.

**VEVOR-synken är påslagen sedan 2026-10-30 19:22 UTC** (Leonard samma kväll:
"Följ rekommendationen"; tidigare "Vi kan sätta på den när vi börjar polera").
Ordningen var status, torr, skarp (408 lagersaldon, 0 fel), torr igen (3 lager
och 0 priser att skriva) och sist `pa`. Körningen 22:50 UTC granskade 5 764
rader, skrev 329 lagersaldon och 0 priser, med 0 fel. 5 216 hade okänt besked
och rördes inte: utkasten läses en gång per dygn, och en avläsning äldre än
tolv timmar är okänd.

### Varje färg får sina egna bilder (2026-10-30)

Leonards fråga om traktorskopskyddet: en grön variant, men galleriet visade
syskonens bilder och bara en grön. Importen gav familjen ankarets sex bilder
och bara huvudbilden från varje syskon, kopplad som färgbild. Ankarets
huvudbild låg dessutom två gånger, en gång i galleriet och en gång som
ankarets färgbild.

Nu får varje artikel sina sex bilder i galleriet, ankaret först, och alla
sex kopplas till artikelns värde på bildaxeln (`valBilder` på produkten,
flera länkar per val i `linkChoiceMedia`). Alt-texten är "<namn> – <värde>",
och ", bild N" från den andra. Wix tar 50 bilder, så över åtta artiklar får
var och en färre, minst en.

☠️ **Ett FOTO tas en gång, inte en adress** (`lib/vevor/bildinnehall.ts`).
VEVOR lägger varje artikels bilder i en egen mapp med en egen `timestamp`, så
storlekar av samma vara bär byte-identiska foton under olika adresser.
Damstövlarna `34777269` fick 36 bilder där sex hade räckt. Filnamnet räcker
inte heller: två färger av traktorskopskyddet heter båda `…-m100-9.jpg` men är
olika foton. Importen hämtar därför de valda bilderna med vår egen
användaragent och jämför md5, som är exakt Wix `hash` på en uppladdad fil
(uppmätt 2026-10-30). Ett foto som bara ett värde har kopplas till värdet. Ett
foto som flera värden har kopplas inte, och alt-texten nämner inget värde
(`gemensammaBilder`): butiken ger varje bild EN ägare, och en bild med ett
färgnamn i alt-texten hade hamnat på den färgen (headless-site
`lib/variant-bilder.ts`). Storlekar som bara har gemensamma foton får alltså
inga kopplingar alls, och alla storlekar visar samma sex bilder. En bild som
inte går att hämta räknas som ett eget foto. `gemensamma bilder` står i
importens loggrad.

⚠️ **Kopplingen kan falla när Wix tar emot bilderna långsamt.** Damstövlarna
loggade `kopplade 0/36 val (media ingest:ades långsamt)`. Rättningen nedan
fångar en sådan familj.

**De familjer som importerades före 2026-10-30** rättas med workflowen
**"VEVOR — rätta familjernas bilder"** (`plan` · `skriv`) →
`/api/admin/vevor-familjebilder` → `lib/vevor/familjebilder.ts`. Torrt som
default, och `skriv` kräver `bekrafta` = planens antal sidor att rätta.
Skrivningen går i steg som färgbilderna: uppladdning, galleriet med de gamla
länkade bilderna kvar sist, länkarna, galleriet utan dem, återläsning,
variantbilden.

1. ☠️ Bara opolerade, dolda VEVOR-utkast med fler än en artikel.
2. ☠️ Bilderna känns igen på sitt innehåll: Wix `hash` för filerna och md5
   för de adresser som inte redan finns som en fil. Utan känt innehåll gäller
   källan (Wix `sourceUrl`). En fil med samma innehåll som en planerad bild
   används i stället för en ny uppladdning, och en kopia av den går ut. En
   bild vars källa inte är någon av artiklarnas egna, och vars innehåll inte
   är planerat, stoppar familjen (`okand_kalla`).
3. ☠️ Faller en uppladdning rörs Wix inte, och första sidan som inte läser
   tillbaka som planen stoppar körningen.
4. ☠️ Svaret bär bara Wix-id, antal och en felkod (`fel.orsak`), aldrig
   felets text. Ett uppladdningsfel bär leverantörens bildadress, och i den
   står artikelnumret. Första skarpa körningen 2026-10-30 skrev ut en sådan
   adress i den publika loggen, och loggen raderades efter två minuter.
5. Svarar Wix 429 på en uppladdning stannar varvet som `strypt`, och
   workflowen väntar 90 sekunder och fortsätter, högst tre gånger i rad.
   Importen laddar upp mot samma gräns, så uppladdningarna går med
   `UPPLADDNING_PAUS_MS` (400) emellan. De filer som hann laddas upp innan en
   sida föll ligger kvar oanvända i Media Manager.

Ordningen: `plan`, `skriv` med planens antal, `plan` igen (att rätta ska
vara 0).

### Radera och börja om

De 1 048 utkasten från steg 4 är en artikel per produkt. Leonard sa ja
2026-10-29 till att radera dem och importera om. Workflowen **"VEVOR — radera
opolerade utkast"** (`plan` · `radera`) → `/api/admin/vevor-utkast-radera` →
`lib/vevor/radera-utkast.ts`.

1. ☠️ Bara rader med leverantören vevor, `needsAiPolish` och inte publicerade.
2. ☠️ Produkten läses färskt, och bara en dold produkt raderas.
3. ☠️ En radering räknas först när en läsning svarar 404. Annars ligger raden
   kvar, och tre i följd stoppar.
4. ☠️ En produkt som en order pekar på rörs inte.
5. ☠️ Importen måste vara avstängd för en skarp körning. Planen (torrt) går att köra
   med importen på och säger `importAktiv`.
6. ☠️ `radera` kräver `bekrafta` = planens antal. Följande varv får ha färre,
   aldrig fler.
7. Mappningsraden tas bort (`Store.deleteMapping`), och när allt är raderat
   nollställs importens markör. Importen slås inte på.

Bilderna ligger kvar i Media Manager (bildstädningen är avstängd helt sedan
2026-10-30).

**Körd 2026-10-30 00:10–00:23 UTC:** 1 043 utkast raderade och bekräftade,
noll i order, noll synliga. Wix läsning släpade efter raderingen på några
produkter, så de räknades som obekräftade och togs först i nästa körning
(`fannsInte`). Fyra körningar, sedan nollställdes markören och importen slogs
på 00:23. Leonard ville inte vänta ett dygn.

**Ordningen som planerades:** vänta ett dygn, så att läsaren har läst varje sida
med betyg (utkasten och katalogen läses en gång per dygn), och kör en torr
`prov` i "VEVOR — importen" (`betyg_okant` ska vara nära noll och `familjer`
över noll). Kör sedan `plan`, `radera` med planens antal, `plan` igen
(raderbara ska vara 0), och sist importen `pa` med Leonards ja.
