# Runda 144 — Steg 3–5: källäsning och fynd innan en rad skrivs

## Steg 3 — alla åtta lästa (namn, slug, revision, media, kategori, prisgrind)

| pid | wixProductId | revision | media | kategori-id |
|---|---|--:|--:|---|
| `ff590562` | ff590562-1185-45c0-b763-7a8c10750edd | 2 | 5 | 05e96cd6-e4bc-4f55-b31c-6062ede453ff |
| `d44fd4bd` | d44fd4bd-3d69-444e-a4e3-d6cee94e00d1 | 2 | 5 | samma |
| `00e49c84` | 00e49c84-080f-47cf-b38b-89c90994f67b | 2 | 5 | samma |
| `f8d3a8fd` | f8d3a8fd-b17d-4c2c-a2e6-9a37aeb79c18 | 2 | 5 | samma |
| `760f493a` | 760f493a-a88a-4167-ab78-3f2ef13a3b5b | 2 | 5 | samma |
| `52b12860` | 52b12860-0063-442e-bf0b-bb8f847414b1 | 2 | 5 | samma |
| `c816963e` | c816963e-a6f1-4322-a537-6f49c173161d | 2 | 5 | samma |
| `ca16f9ab` | ca16f9ab-99e6-4eee-b156-777fd5e54753 | **1** | 5 | samma |

Alla åtta: `visible:false`, en variant, samma kategori (odlingskategorin). `ca16f9ab`
har `revision 1` (aldrig omsynkad sedan importen) — inget varningstecken, bara
en observation. SKU:erna i mappningen (`FP-foliengewachshaus` osv, lästa i
Steg 3:s prisgrind) matchar variantens `sku` på produkten — id-uppslaget via
`$startsWith` på de åtta tecknens prefix är alltså bekräftat rätt produkt i
samtliga åtta, inte en slump på ett kort prefix.

## Steg 5 — sjutton fynd, tre är riktiga motsägelser

Alla åtta källtexter (`Beschreibung`, `Technische Daten`, `Lieferumfang`) lästa
tre gånger enligt regeln. Lieferumfang är kontraktet — det som INTE står där
får inte påstås ingå, oavsett vad rubriken eller brödtexten antyder.

### ☠️ 1. `d44fd4bd`: titeln säger "mit Sandsäcken", Lieferumfang har inga säckar

Lieferumfang: `1 x Gewächshaus, 4 x Bodenpfahl, 4 x Abspannseil, 1 x
Gebrauchsanleitung` — noll säckar. Det som faktiskt finns är en
**"Seitengewichtstasche: 180L x 18B cm"** i Technische Daten — en insydd
FICKA längs kanten att fylla med egen sand, inte medföljande säckar. Titelns
"mit Sandsäcken" beskriver alltså funktionen (att man KAN tynga ner den med
sand), inte innehållet i kartongen. Svensk text får säga "kantficka för
egen sand/tyngd", aldrig "sandsäckar medföljer".

### ☠️ 2. `ca16f9ab`: brödtexten påstår att markpluggar ingår, Lieferumfang säger nej

Beskrivningen: *"4 Pflöcke für eine feste Verankerung im Boden sind im
Lieferumfang enthalten"* (4 pluggar ingår). Den faktiska Lieferumfang-listan:
`1 x Gewächshaus, 1 x Anleitung` — inga pluggar. Kontraktet vinner:
Lieferumfang är den auktoritativa förpackningslistan, brödtexten är
sannolikt återanvänd mallText. Svensk text nämner INTE markpluggar som
ingående.

### ⚠️ 3. `c816963e`: vikten motsäger sig själv — 6,8 kg mot 7,6 kg

`Technische Daten` (fri text): *"Gewicht: 6,8 kg"*. `Tekniska specifikationer`
(strukturerad spec-tabell, byggd av `buildSpecifications` ur feedens EGNA
kolumner): *"Vikt: 7,6 kg"*. Två olika tal för samma fält på samma produkt.

Ingen bild kan avgöra en vikt (till skillnad från runda 131:s färgfynd).
Regeln här: **spec-tabellen är feedens strukturerade kolumn, brödtexten är
fri text som kan vara delad mall mellan produkter** — spec-tabellen är den
mer tillförlitliga källan. Lösningen är att INTE upprepa vikttalet i den
löpande brödtexten alls; spec-tabellen (som redan visas separat på sidan)
får bära det siffran utan att jag skriver en konkurrerande siffra i prosan.

## Fjorton fynd till — allt stämmer, men kräver precision i ordvalet

- **`52b12860` har en RIKTIG skötselinstruktion, inte bara ett skäl att
  skriva en generisk rad.** Källan säger ordagrant: *"Bitte entfernen Sie
  die Folie im Falle starken Schneefalls, Regens oder Windes"* — ta bort
  duken vid kraftigt snöfall/regn/storm. Det ersätter STEG1-2:s planerade
  generiska "skotta taket"-rad för just den här produkten: den faktiska
  leverantörsinstruktionen är starkare underlag än en egen formulering och
  ska användas ordagrant översatt, inte en egen konstruktion.
- **"wasserabweisend" ≠ "vattentät".** `52b12860`:s folie är
  vattenAVVISANDE (water-repellent), inte vattentät. Skriv "vattenavvisande",
  aldrig "vattentät" — en oversättning åt fel håll är precis den sortens
  påstådda egenskap källan inte ger täckning för.
- **`ca16f9ab` har ett verkligt lasttal, men det är INTE märkt som
  snölast.** `Belastbarkeit: 40 kg/㎡` står bredvid `Windwiderstand: 12 m/s`
  i Technische Daten, utan ordet `Schneelast`. STEG1-2:s allmänna linje
  ("ingen av de åtta anger en snölastklass") gäller fortfarande i sak — det
  här är en allmän BÄRFÖRMÅGA, inte en deklarerad snölast — men talet är
  äkta och får citeras som just belastbarhet: "belastbarhet 40 kg/m²" och
  "vindmotstånd 12 m/s", utan att döpas om till "snölast" eller "stormsäker".
  Ingen skötselrad om att skotta läggs till här — produkten är
  aluminium+polykarbonat, samma undantag som `f8d3a8fd` i STEG1-2.
- **`d44fd4bd`s "Kunststoff-Abdeckung" specificeras ALDRIG som PE** i källan
  (till skillnad från `ff590562` och `00e49c84`, som uttryckligen säger PE).
  Skriv generiskt "plastduk/plastöverdrag", inte "PE-folie" — att lägga till
  PE här vore att hitta på en specifikation källan inte ger.
- **`760f493a`s material har två namn i samma text**: beskrivningen säger
  "transparente Polycarbonat-Platten", Technische Daten säger bara
  "Kunststoff". Polycarbonat är den mer specifika och konsekventa uppgiften
  (den upprepas dessutom i produktnamnets "Pflanzenhaus"-kontext) — används.
- **`f8d3a8fd`s vägganvisning är en REKOMMENDATION, inte ett inkluderat
  tillbehör.** *"Es wird empfohlen... mit Bodenankern zu befestigen"* —
  rekommenderar markankare, påstår inte att de medföljer (och Lieferumfang
  bekräftar: inga ankare listade). Skötselråd: "placera mot en vindskyddad
  vägg och förankra i marken" — utan att påstå att ankare ingår.
- **`52b12860`s Lieferumfång har en vag rad: "Zubehör".** Ingen specificerad
  komponent bakom ordet. Översätts neutralt som "tillbehör" utan att
  specificera INNEHÅLL i den posten — att gissa vad "Zubehör" betyder vore
  att hitta på.
- **Måttordningen skiljer mellan de två textblocken på fyra produkter**
  (`00e49c84`: B×T×H i Technische Daten mot L×B×H i Tekniska spec;
  `c816963e`: samma mönster) — men SIFFRORNA är identiska i båda blocken på
  alla åtta produkter, bara axelbokstäverna skiljer. Ingen sakskillnad,
  bara en etikett-konvention. Tekniska spec-blockets mått används i den
  löpande texten.
- **Vindklasserna ("Windfest Stufe 3-4", "Stufe 4") är leverantörens EGEN
  skala**, ingen EN/ISO-standard nämns någonstans i källorna. Skrivs som
  "tillverkarens vindmotståndsnivå X", aldrig som "certifierad" eller med
  en påstådd standard bakom.
- **`52b12860`s "6 Netzfenster" finns bara i produktnamnet**, inte upprepat
  i brödtexten (som bara säger generiskt "Fenster mit Fliegengitter"), men
  namnet kommer från feedens strukturerade fält, inte fri text — talet
  används som det står, ingen motsägelse att lösa.
- **Ingen av de åtta påstår "glas" eller "härdat glas"** — samtliga
  materialpar (PE-folie/stål, PE-folie/stål, PC/aluminium, trä/PC,
  PE-folie/stål, trä/PC, aluminium-legering/PC) skrivs med sitt faktiska
  namn, aldrig glas. Steg 2:s materialregel håller på alla åtta utan
  undantag.

**Ingen av produkterna faller på Steg 5.** Alla åtta går vidare till Steg 4
(bildgranskning) med ovanstående precisionspunkter som facit för Steg 7:s
text.

## Steg 4 — kontaktark, alla 24 bilder (position 3/4/5 per produkt)

Granskat mot de två kända farorna: leverantörslogotyp i hörnen (runda 64,
89, 113, 141) och färgpåståenden som inte håller vid zoom (runda 131, 143).

**Noll logotyper.** Inga hörn, inga vattenstämplar, ingen tysk text kvar i
någon av de 24 bilderna — alla är måttritningar, monteringsdetaljer eller
generiska livsstilsbilder med marknadsföringstext (`Genießen Sie die
Freude…`), som inte avslöjar leverantör.

Fyra iakttagelser som matchar eller skärper Steg 3–5:

- **`d44fd4bd` bekräftat: vit kropp, GRÖN kantband/stomme genomgående** på
  alla tre granskade bilder (måttritning, infografik, livsstilsfoto). Facit
  för Steg 7: "vit med gröna detaljer", inte bara "vit".
- **`c816963e` är bildmässigt bevisat en SKÅPSMODELL**, inte ett gånghögt
  växthus: dubbeldörr med vridlås, tre hyllplan bakom glaset, 58×44×78 cm.
  Namnger den `växthusskåp`, samma ordklass som de redan publicerade
  `vaxthusskap-*`-sidorna (Steg 1), inte generiskt `växthus`.
- **`ca16f9ab`s ram är genuint GRÖN**, inte en översättningsartefakt av
  "verzinkt" — bekräftat på close-up av takventilen: mörkgrön aluminiumlist,
  klar polykarbonatskiva. Spec-fältets "Grün+Transparent" stämmer alltså
  bokstavligt och ska skrivas rakt av.
- **`760f493a`s trästomme är grå-betsad**, matchar "Grau"/furuträ-claimet;
  gångjärn och vridlås är omärkt blankt metallbeslag — inget att notera.

Inget av de åtta faller på bildgranskningen. Alla går vidare till Steg 7.
