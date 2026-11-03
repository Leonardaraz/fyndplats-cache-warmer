# Fyndplats – SEO-polera VEVOR-utkast

> **Startdokumentet för VEVOR-chatten** *(Leonard 2026-10-31: en egen chatt för VEVOR och
> en för Aosom)*. Läs det här först, sedan [runbooken](../seo-polish-runbook.md) från
> *Fasta regler* och *Rundan steg för steg*. Runbooken är gemensam för båda leverantörerna,
> och allt här är det som skiljer. Avsnitten som bara gäller Aosom står uppräknade nedan.
>
> **Två chattar samtidigt.** Varje chatt har en egen gren och egna rundnamn
> (`runda-vevor-<n>`). Båda skriver genom samma workflows, och GitHub kör en skrivning i
> taget per grupp: en körning som står och väntar kan avbrytas av nästa som startas (den
> visas som *cancelled* och har inte skrivit något). Kontrollera att din körning startade,
> och kör om den om den avbröts. Lärdomar skrivs i `tools/polish-gates/FLAGGADE-VEVOR.md`,
> så att de två chattarnas grenar inte krockar i samma fil.

VEVOR:s sortiment importeras sedan 2026-10-29 som osynliga utkast med leverantören `vevor`
på mappningen. Rundan går som för Aosom, med de här skillnaderna.

**Källan är svensk.** Utkastets text är VEVOR:s egen svenska från deras produktsida, utan
reklamblocken (importen tar bort dem). Fliken *Tekniska specifikationer* kommer ur sidans
specifikationstabell. Texten är maskinöversatt och har ofta fel ord och enheter. Läs den som
källa och skriv om den helt, med samma regler för påståenden och siffror som för en Aosom-sida.
På en familj (flera varianter) visar varje rad i fliken som skiljer sig varje varians värde.

**Välj inte de här utkasten:**

- **Utkast utan fliken *Tekniska specifikationer*.** Verktyget **"VEVOR — specifikationen
  på utkast som saknar den"** lade in fliken på 1 119 utkast 2026-10-31. Ett utkast som
  saknar den efter det har ingen specifikation hos VEVOR (2 st den dagen), och då finns
  ingen källa för måtten.
- **Utkast i familjeregelns plan** (**"VEVOR — familjeregeln på befintliga utkast"**, läget
  `plan`): gränsfallen tills Leonard har avgjort dem, och de raderbara (`dela` och `slaIhop`)
  tills planen visar 0 raderbara. Ett utkast som raderas och byggs om av importen tappar
  poleringen, och ett polerat utkast raderas inte alls utan blir en egen sida bredvid familjen.
- **`vevorGranskning.medicinteknik: true` i mappningsraden** (läsningen i runbookens *2. Hämta
  källan*). Flagga utkastet till Leonard. Sedan 2026-10-31 får varje vara i kategorin
  Hjälpmedel flaggan, också när namnet inte låter som vård.
- **`vevorGranskning.vapenskap` eller `vevorGranskning.spritapparat`.** Vapenskåp
  (SS 3492) och spritapparater (alkohollagen 2 kap. 1 §) publiceras aldrig, och
  publiceringsspärren vägrar dem på alla vägar. En polering av dem är bortkastad.
- **Saldo 0 i `lager.tsv`.** Prisgrindens SLUTSALD bygger på synkens stämpel. VEVOR-synken
  är påslagen sedan 2026-10-30 och går minut 50 varje timme, men en artikel vars avläsning är
  äldre än tolv timmar rörs inte (utkasten läses en gång per dygn). Kontrollera med
  **"VEVOR — synken"** (`status`) att `aktiv` är sann före en VEVOR-runda.

**Märket.** Skrivsteget sätter märket VEVOR i Wix. Skriv det inte i namnet eller SEO-titeln
*(Leonard 2026-10-28)*.

**Artikelnumret.** VEVOR:s nummer har 19 eller 22 tecken, versaler och siffror i ett. Det får
aldrig synas, av samma skäl som Aosoms. Sedan 2026-10-30 fäller `gatelib.ARTNR` och
skrivplanen den formen. De nummer som bär bindestreck eller punkt fångas inte: leta efter dem
med ögonen.

**Modellnumret syns aldrig hos oss** *(Leonard 2026-10-31)*. VEVOR:s specifikation bär
raden *Artikelmodellnummer* (och ibland *Modell*, *Artikelnummer*, *Produktmodell* eller
*Modellnummer*), och en sökning på numret leder till VEVOR:s egen sida med deras pris.
Importen tar bort raderna sedan samma dag, och **"VEVOR — specifikationen på utkast som saknar
den"** byter ut fliken på äldre utkast som har dem. Står raden ändå i källan skriver du inte
in den i `kallor.json` (repot är publikt) och inte i texten. Grinden `MODELLNUMMER` i
`gatelib.py` och skrivplanen fäller etiketten. Vårt eget artikelnummer (`FP-…`) och en
modell med ord (*Modell: Premium*) får stå. Ett nummer i löpande text ser grinden inte: leta
efter det med ögonen.

**Bilderna.** Importen tog sex bilder enligt Leonards regel (`lib/vevor/bilder.ts`). Står
`vevorGranskning.bildgranskning` på `true` var mönstret ovanligt, och då granskar du varje
bild extra noga. Blir det färre än fem kvar efter strykningen beskär du enligt undantaget i
runbookens *3. Bilderna före texten*. Räcker inte det flaggar du produkten i
`FLAGGADE-VEVOR.md`: det finns
inget verktyg som hämtar VEVOR:s övriga bilder. En familj som importerades före 2026-10-30
kan ha syskonens bilder blandade: kör **"VEVOR — rätta familjernas bilder"** (`plan`) först.
Planen visade 0 att rätta 2026-10-31.

- VEVOR-loggan på varan får stå *(Leonard 2026-10-28)*.
- **Etiketter och typskyltar på själva varan får stå kvar i fotona, också när de visar
  modellbeteckning och serienummer** *(Leonard 2026-11-02, "Ja" på frågan efter att fyra
  dieselvärmare lyfts ur runda 17 av just det skälet)*. Det gäller bilden av varan: modellnumret
  får fortfarande inte stå i texten, tabellen, namnet eller alt-texten (se ovan). Läs ändå
  nätadapterns kontakt och spänning på varje packbild och på etiketter: en amerikansk
  kontakt eller 100–120 V är en annan variant än sidans 230 V (lärdom *by* i
  `FLAGGADE-VEVOR.md`), och en sådan bild stryks eller varan flaggas.
- **Zooma på packbildens nätadapter och på husets tryckta märkning** *(runda 19)*. Kontakten
  och adapterns spänningsetikett syns bara i originalet, och kontakten ligger ofta bakom
  kabeln (a099f9b4: amerikansk kontakt, 100–120 V och en display i °F, så packbilden ströks).
  En etikett på varan som går att läsa i full storlek är en källa: märkström, startström,
  överhettningsskydd och varningstext får stå i texten, med talen i `foto-tal.txt`. Är
  etiketten snedställd eller för liten skriver du ingenting ur den.
- **Packbildens nätkontakt syns bara när kabeln förstoras** *(runda 20)*. På 5b5ae34d är
  adaptern en liten svart kloss på kontaktarket, och den amerikanska kontakten (två platta
  stift) syns först vid sju gångers förstoring. Förstora nätkabelns ände på varje packbild
  med en adapter. En amerikansk kontakt stryker bilden, och texten nämner då varken adapter,
  eluttag eller nätspänning, fastän källan gör det (frågan till Leonard om vilken adapter
  VEVOR levererar till Sverige är öppen, `FLAGGADE-VEVOR.md` lärdom *fa*).
- **Värmaren inne i fordonets kupé bredvid en människa stryks** *(runda 20)*, som värmaren i
  ett tält bredvid en sovande (lärdom *ep* och *fb*): avgaserna ska ut. Tältbilder där
  värmaren står utanför tältet behålls.
- **Nivåskalan på husets sida avgör tankstorleken** när källan säger 5 liter och 1,3 liter
  *(runda 20)*: skalan är tryckt med liter och procent (5 L vid 100 %), och *1,3* är
  gallonen. Läs skalan innan en tankstorlek utelämnas (lärdom *fc*).
- **Läs `recensioner-kalla.json` efter namn före commit** *(runda 20)*. Läsningens
  namnregel tar bara signaturer på högst två ord, så en signatur med tre ord (*Mvh* och ett
  fullständigt namn) kom med i det publika repot. Redigera bort namnet för hand, märk raden
  `namn: true` och dölj recensionen (lärdom *fd*).
- Bilder med säljtext på engelska eller tyska stryks, som Aosoms tyska *(Leonard 2026-10-30)*.
- Aosom-verktygen för bilder (bildkandidater, färgtillägg och miljöbild) läser Aosoms flöde
  och fungerar inte för VEVOR.
- Ge måttskissen en alt-text som börjar på *Måttbild*. Finns ingen sådan alt-text i
  produkten lägger `bygg-media.py` plats 3 sist, efter Aosoms gamla regel. På ett
  VEVOR-utkast är plats 3 VEVOR:s första bild och ingen måttskiss, så läs ordningen i
  utskriften.

**Kategorierna.** Importen och verktyget **"VEVOR — kategorier till utkasten"** kopplar varje
utkast till en avdelning och en underkategori enligt reglerna i `lib/vevor/kategorier.ts`.
Läs kopplingen i utkastet (`directCategoriesInfo`) **tidigt, i steg 2** (runbookens
*Kontrollera kategorin*), och bedöm den mot varan, inte mot regeln: regeln gissar på VEVOR:s
kategori och produktnamnet och har haft fel. Passar kopplingen skriver du samma namn i
`kategori.tsv`. Passar den inte, eller saknar utkastet kategori, lägger du varan i den
lämpliga (förälder, smalaste löv, och en sökordskategori bara när den passar varan) i
`kategori.tsv` i stället för att bara flagga den *(Leonard 2026-11-01)*. Workflowen lägger
till kategorier men tar aldrig bort någon: den felaktiga kopplingen skriver du som en rad
*Kategori att ta bort* i `FLAGGADE-VEVOR.md` (kort och kategorinamn), och den tas bort i
samma runda med workflowen **"Kategori — ta bort felaktiga kategorilänkar"** (runbookens
*Ta bort en felaktig kategorilänk*, som också beskriver engångsskriptet när verktyget inte
ligger på `main`). Det behöver inte längre Leonards begäran *(Leonard 2026-11-02, "Ja" på
frågan om importens felaktiga länkar får tas bort direkt i kommande rundor)*. Passar ingen
kategori i trädet flaggar du utkastet med ett förslag på en ny.

- De nya kategorierna från 2026-10-31 är dolda i Wix tills de har tio publicerade
  produkter. Cronen `kategorier-synlighet` (minut 37 varje timme) visar dem då av sig själv.
  Polera därför minst tio utkast ur samma nya underkategori innan du går vidare till nästa.
- Butiken bygger brödsmulan av de synliga kategorierna. En vara som bara ligger i dolda
  kategorier får *Hem / Butik / produkt*, och livegrind fäller den som `KATEGORI SAKNAS`
  tills kategorin visats. Kör livegrind igen efter nästa körning av cronen. En vara i en dold
  underkategori under en synlig avdelning (Verktyg & Maskiner, Bil & Garage) får avdelningen
  i brödsmulan och fälls inte.
- Kategoristeget kan skriva till en dold kategori först när PR #841 ligger på `main`
  (planerat till natten mot 2026-11-01). Före det fäller torrkörningen namnet som okänt, och
  då skrivs ingenting.

**Varianter.** En familj är en sida med en VEVOR-artikel per variant. Ge den en rad i
`sammanslagna.tsv`, som en sammanslagen Aosom-sida (se *En sammanslagen sida skrivs om med
`sammanslagna.tsv`* i runbooken). SKU-steget hoppas då över, och varje variant behåller sin SKU.
Sammanslagningsverktyget i *Syskon blir val på sidan* tar bara Aosom-artiklar
(`utkast_ej_aosom`). Hittar du ett VEVOR-syskon som importen inte slog ihop, flaggar du det i `FLAGGADE-VEVOR.md`.

**Paketstorlekar som importen inte slog ihop** *(Leonard 2026-11-02, bordsdukarna: "ja slå ihop
proffsigt", via Wix API)*. VEVOR säljer samma vara som ett 3-, 6- och 10-pack, men varje paket
är en egen artikel utan länkar till de andra, och bara SPU:n är gemensam. Familjeregelns plan
kan inte bygga en familj av dem (de skiljer sig bara på förpackning och vikt), och Aosoms
sammanslagningsverktyg tar bara Aosom-artiklar och axlarna Färg och Storlek. Det finns alltså
inget verktyg för det här, och sammanslagningen gjordes en gång för hand, på Leonards uttryckliga
begäran. Gör inte om den utan en ny sådan begäran, och bygg ett verktyg efter
`lib/aosom/sammanslagning.ts` om fler paketstorlekar ska slås ihop. Metoden, som den kördes:

1. **Spara en ögonblicksbild utanför repot** av de tre produkterna (GET med `MERCHANT_DATA`),
   lagret och de tre mappningsraderna (de bär artikelnummer). Varje skrivning har en flagga som
   bara läser och visar nyttolasten, och den avbryter om ett pris, en variant, en synlighet
   eller en mappningsrad inte är som i ögonblicksbilden. Läs saldot färskt: synken ändrar det
   (tio-packets saldo gick från 3 i rundans underlag 13:43 till 1 i ögonblicksbilden 17:10).
2. **Värdsidan**, den publicerade med längst historia: bildlistan med `PATCH /stores/v3/products`
   (fältmask `media`, bara `{ id, altText }` med id:n som redan ligger i Media Manager, så att
   ingen bild importeras om), sedan **ett** anrop till `products-with-inventory` med optionen
   och alla varianterna. Optionen heter **Förpackning** (`lib/vevor/axelklass.ts` klassar den
   som `forpackning`, som får dela sida; *Antal dukar* hade blivit `funktion`) med val som
   *3-pack*, *6-pack* och *10-pack*, med siffra i varje. Värdens variant behåller sitt id, pris,
   kostnad och saldo. Varje ny variant får givarens pris, `revenueDetails.cost` och saldo, och
   en egen SKU (`FP-…-svart-3-pack`) som skiljer sig från givarnas, så att ingen SKU står på två
   sidor. Därefter länkas varje val till sin pakets bild (`PATCH /stores/v3/products`, fältmask
   `options`, `variantsInfo` och `visible`, `variantsInfo` ordagrant ur en läsning med
   `MERCHANT_DATA` och `revenueDetails` reducerat till `cost`), och Wix läses tillbaka: val,
   varianter, priser, kostnader, saldon och länkar. Faller variantskrivningen återställs
   bildlistan.
3. **Mappningen**: värdens rad får en variant per artikel med `choices: { Förpackning: "…" }`,
   Wix-variantens id och SKU, `aosomSyncedQty` per variant (radens är summan) och `vevorArtiklar`
   med alla tre. `artikelbild` (`lib/aosom/artiklar.ts`) ska ge `flera`: olika artiklar, olika
   Wix-id, och radens artikel bland dem. Kontrollera det innan du skriver. **Skriv raden direkt
   efter Wix (här inom en minut) och aldrig runt minut 50**, när VEVOR-synken går: en variant
   som Wix har men mappningen inte känner till får sitt lager nollat (`okandaVarianter`).
   Wix-skrivningarna gjordes 17:15–17:17 UTC, utanför både minut 50 och Aosoms synkfönster
   (:12–:29 var tredje timme).
4. **Givarna**: den publicerade avpubliceras (smal PATCH, bara `visible: false`, läs tillbaka),
   båda raderna pensioneras som Aosoms dubbletter (`pensioneraDubblett`: `supplierProductId: ""`,
   `draftStatus: "rejected"`, `needsAiPolish: false`, `vevorArtiklar` kvar), och en 301 skrivs
   till `FyndplatsRedirects` **efter** avpubliceringen, eftersom omdirigeringsgrinden vägrar en
   källa som är en synlig produkt och ett mål som inte är det. En dold givare som aldrig varit
   publicerad behöver ingen 301. Givarnas recensioner följer inte med, eftersom recensionerna
   ligger i Postgres och inget VEVOR-verktyg flyttar dem; kontrollera att inga synliga
   recensioner finns på givarna först.
5. **Texten** skrivs som en sammanslagen sida i en egen mini-runda: `sammanslagna.tsv` med
   `kort`, tab och antal varianter, och **tomma** `sku.tsv` och `variant.tsv` (`gate-sku.py`
   avbryter annars). Källan i `kallor.json` är de tre artiklarnas källor efter varandra. Lägg
   paketets stora bild på källposition 3 i `bilder.tsv`, eftersom `bygg-media.py` lägger plats 3
   sist (måttskissregeln). Namn, adress, titel och text får inte bära ett enskilt paket.
   Skrivworkflowen rättar variantbilderna själv före återläsningen.
6. **Adresserna**: byter värden adress i textsteget skrivs en 301 från värdens gamla och från
   givarens adress till den nya, när värden bär den. Den som skrevs före textsteget pekade på
   värdens gamla adress, eftersom ett mål som inte är en synlig produkt bara hade lett till en 404.

**Det här i runbooken gäller bara Aosom:** *Vad källan är värd* (den tyska feedtexten),
*Syskon blir val på sidan*, Aosom-verktygen för bilder och EN 71-beslutet. Resten gäller
båda leverantörerna, också laglighetsgrinden, dubblettskärmen och recensionerna.

**Leksaker.** Beslutet om EN 71 gäller bara Aosom. En VEVOR-leksak vars källa inte nämner
någon standard flaggas.

**Produktsäkerhet.** Tillverkaren och ansvarig i EU kommer från motorn (VEVOR:s standardrad,
Leonards beslut 2026-10-29). Säkerhetsavsnittet skriver du som vanligt, ur källans text.
VEVOR-varor har ingen förhandsöversättning, så utan ditt avsnitt har fliken ingen
säkerhetsinformation.

**Recensionerna.** Steg 7 tar bara med recensioner om produktens egna artiklar. De andra
räknas och kräver inget beslut. Recensionerna om en annan artikel är dolda och kundernas foton
hemflyttade sedan 2026-10-31 (16 756 dolda rader, 1 438 foton på 1 011 recensioner). En
recension vars artikel inte går att avgöra ligger kvar som väntande och syns inte (5 234 rader
samma dag).

**Priset.** Prisgrinden gäller VEVOR-rader sedan 2026-10-30: importen satte regelpriset, och
VEVOR-synken skriver det varje timme när den är påslagen. Säger grinden *PRISGRINDEN FALLER*
är det drift, och då rör du inte priset.

**EU-lager.** Utkasten saknar märkningen "EU-lager", eftersom VEVOR:s sida inte säger
vilket land lagret ligger i. ✅ **Avgjort 2026-11-03** *(Leonard: "Vevors produkter är också eu vara")*:
VEVOR-varor är EU-varor och ska bära märkningen, och hundvagnen `c21cf56b` behåller den den ärvde.
⚠️ Importen (`lib/vevor/to-product.ts`) och poleringens skrivsteg sätter den inte: mätt 2026-11-03 saknade
alla 40 provade av 197 publicerade VEVOR-sidor märket. Tills det är åtgärdat ska ingen sida
publiceras med ett annat besked än Leonards.

**Samma vara som en publicerad AliExpress-sida** *(Leonard 2026-11-03, parkeringsvärmaren `22fb6792` och
`5e964d36`)*. Är VEVOR-dubbletten ett osynligt utkast mappar du om den publicerade AliExpress-sidan, som på hundvagnen
(`FLAGGADE-VEVOR.md` cz–dg). Är **båda sidorna publicerade** behålls den polerade VEVOR-sidan med sina recensioner, eftersom
ingenting flyttar recensionerna (lärdom df): skriv en 301 från AliExpress-sidans adress till VEVOR-sidans med
**"Lägg till 301-redirect"** (en rad i `batch`, `force=true` eftersom källan fortfarande är synlig), dölj sedan AliExpress-sidan
med den smala `visible`-PATCH:en (`{ product: { revision, visible: false }, fieldMask: { paths: ["visible"] } }`), läs tillbaka
och räkna med 12–25 minuter innan adressen svarar 308 (mätt 12 minuter på parkeringsvärmaren och 22 på husbilsvärmaren; cachade karuseller som listar den dolda sidan visar den kvar i upp till sex timmar, och klicket leder vidare). Sök hela `FyndplatsRedirects` efter rader som rör någon av adresserna först,
eftersom workflowens lista bara visar de 200 senaste. AliExpress-sidans mappningsrad rörs inte: den håller dubblettspärren mot en
ny import av samma vara. Bevis för att varan är samma är specifikationen rad för rad och VEVOR-loggan på AliExpress-sidans foton
(se (fs) och (ft)).

**Frakt och retur** *(Leonard 2026-10-30)*. Frakten kontrolleras inte före publiceringen, och
priset räknar med att VEVOR tar 0 kr i frakt. Butiken har ingen returadress för VEVOR, så en
kund som returnerar får adressen per mejl.
