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
*Kategori att ta bort* i `FLAGGADE-VEVOR.md` (kort och kategorinamn), och passar ingen
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
vilket land lagret ligger i. Märkningen avgörs vid publiceringen och är inte avgjord än:
publicera utan den.

**Frakt och retur** *(Leonard 2026-10-30)*. Frakten kontrolleras inte före publiceringen, och
priset räknar med att VEVOR tar 0 kr i frakt. Butiken har ingen returadress för VEVOR, så en
kund som returnerar får adressen per mejl.
