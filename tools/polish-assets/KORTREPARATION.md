# Kortreparationen: runda 121–128 saknade eget Fyndplats-kort

Leonard, 2026-09-11: *"du har kört flera batcher utan att göra fyndplats kort
varför?"*

Han hade rätt, och det gick att räkna i git:

| runda | spårade `kort/*.jpg` FÖRE | produkter |
|---|--:|--:|
| 110–120 | 6–9 per runda | — |
| **121** | **0** | 8 |
| **122** | **0** | 4 |
| **123** | **0** | 9 |
| **124** | **0** | 11 |
| **125** | **0** | 10 |
| **126** | **0** | 6 |
| **127** | **0** | 8 |
| **128** | **0** | 9 |

**65 produkter, 62 av dem publicerade**, utan det enda i galleriet som är
vårt. Klart-kriteriet stod i runbooken på två ställen (rad 2292 och 4912) och
i **ingen kod** — därför glömdes det åtta rundor i rad utan att något sa till.

## Vad som gjordes

Alla 65 kort är byggda, granskade på kontaktark, uppladdade och inlagda på
**galleriplats 3** med alt-text som börjar `Faktakort: `. Måttritningen flyttades
samtidigt **sist** på varje sida, enligt runbokens bildordning — den låg på
plats 3 på samtliga (uppgift #371, som därmed är åtgärdad för dessa 65).

Varje skrivning lästes tillbaka: rätt antal bilder, kortet på plats 3, alt-texten
exakt, noll bilder utan alt-text, `media.main` orörd.

## Grinden, så att det inte kan hända igen

| funktion | fäller |
|---|---|
| `grindar.kortfel(html)` | live sida utan `Faktakort`, kort på plats 1, fel alt-form, ELLER oläsbart galleri |
| `grindar.kortfiler(har, produkter)` | kort som finns lokalt men inte är SPÅRAT i grenen |

`kortfel` körs i Steg 14 på **rå** html, före `butikstvatt` — tvätten stryker
bildattributen, och alt-texten är det grinden granskar. En grind som körts efter
tvätten hade varit en tom läsare som alltid ser grön ut.

☠️ **Den säger också till när den inte kan LÄSA galleriet.** En grind som
tystnar på ändrad markup är samma tomma läsare som `/api/tracking-events` blev
efter Postgres-migreringen: grön för att den inte ser något alls.

Mutationstestad mot verkligheten, inte bara mot syntetiska strängar: den fäller
på runda 121, 123, 125 och 127:s live-sidor och är tyst på runda 128:s.

## Sju rubriker av 65 fick skrivas om — alla samma fel

Ingen textgrind kan fånga det här. Kontaktarket kan, på en sekund:

| kort | stod | varför det föll |
|---|---|---|
| `2bf00891` | "18,5 cm hopfälld" | vagnen är fotad UTFÄLLD |
| `7b544155` | "Fem fack i tre plan" | lådan är fotad STÄNGD |
| `bdd01b5f` | "Arbetsytan dras ut" | vagnen är fotad HOPSKJUTEN |
| `1b534b0e`, `5447468e` | "Fem lådor med EVA-matta" | mattan ligger i stängda lådor |
| `941867cb` | "Hålplank med trettio krokar" | planket är fotat TOMT |
| `4d5b3bb5` | "Smal med löstagbart pennfack" | facket är INVÄNDIGT; pennkoppen i bilden är rekvisita |

Mönstret: **rubriken tog ett tal ur spec-tabellen i stället för ett intryck ur
fotot.** Talen är sanna och står kvar i raderna. Ett åttonde kort, `887d388d`,
ändrades av motsatt skäl — rubriken var sann men pekade inte på verktygshålen,
som är hela skillnaden mot syskonet `7be028f5` en rad ner i kategorilistan.

## Fem fel i verktygen, lagade i den DELADE modulen

1. ☠️ **Versalbugg i måttkravet.** `"Mått".endswith("mått")` är FALSKT när M:et
   är versalt. Runda 121:s `Yttermått` och 123:s `Totalmått` passerade bara för
   att deras m ligger inuti ordet — grinden fungerade alltså av en **slump** på
   två rundor och föll på den tredje.
2. ☠️ **Grinden läste kortets etikett i stället för spec-tabellens**, och fällde
   därför ett kort som bar måttraden. Falsklarm på korrekt data.
3. ☠️ **Hjältebilderna i `rawbilder/` ligger i 760 px** i runda 121. Ett
   återbrukat filnamn hade byggt kortet på en UPPFÖRSTORAD bild — skarp i ett
   kontaktark, grötig på kundens skärm. Egen `kortfoto/`-mapp nu; att skriva
   över `rawbilder/` hade dessutom fått bildgranskningens underlag att ljuga.
4. ☠️ **Ett hämtningsfel namngav inte produkten.** Femte gången huset skriver
   ned samma sak.
5. **Grindlistan finns i två former** i rundorna — `(regex, etikett)` och naken
   regex. Att kräva den ena hade tvingat fram en tvilling till listan i
   `grind.py`.

## Filer

| fil | roll |
|---|---|
| `kortbygge.py` | själva kortet (fanns) |
| `kortrunda.py` | **NY** — allt rundageneriskt; en runda skriver bara `KORT` och `RADER` |
| `kortkvitto.py` | **NY** — kvitterar uppladdningen FÖRE media-PATCHen |
| `kortsvep.py` | **NY** — kör `kortfel` mot varje LIVE sida |
| `grindar.kortfel` / `kortfiler` | **NY** — grinden |

☠️ `kortrunda.py` finns för att runda 120:s `kort.py` bar `specrader`,
`kontroll` och hela `__main__`-blocket, och runda 128 ärvde en kopia. Sju rundor
till hade blivit sju kopior — och runda 104–106 visar vad det kostar: de ärvde
en mall UTAN copy-raden till `kort/` och laddade upp sex kort från 404-adresser.

## En sidoeffekt som är värd att komma ihåg

Tre av de 65 är UTKAST som hålls tillbaka på slutsålt lager (`832f9eec`,
`46a5eeda`, `db2f05f9`). De fick kort ändå, så sidorna är kompletta den dag
lagret kommer tillbaka — och återläsningen gav en mätning huset behövde:

✅ **En media-PATCH med `fieldMask: ["media"]` PUBLICERAR INTE ett utkast.**
Alla tre kom tillbaka `visible: false`. Det är tvärtom mot `variantsInfo`, som
tar en produkt från `visible:false` till `visible:true` även med oförändrat pris
(mätt 2026-08-28). Asymmetrin är nu mätt i båda riktningarna.
