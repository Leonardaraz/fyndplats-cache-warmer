# Runda 93 — reservdukar till pergola med indragbart tak

## ☠️ Rundans förutsättning: `ExecuteWixAPI` svarar 403 hela vägen

Verktyget som alla tidigare rundor byggt på — det som kör JS inne i anropet och
därmed kan loopa katalogsidor, bygga kroppen och lägga facit-grinden FÖRE
PATCHen — svarar `403 forbidden` på varje anrop, även en läsning av två rader.
`GetSiteContext` fungerar, så det är inte site-bindningen. `CallWixSiteAPI`
fungerar. Fyra omförsök över ~15 minuter, samma svar.

Följder som styrde hela rundan:

| | ExecuteWixAPI | CallWixSiteAPI |
|---|---|---|
| Loopa 56 katalogsidor i ETT anrop | ja | **nej** — ett HTTP-anrop per anrop |
| Bygga kroppen i kod | ja | **nej** — kroppen klistras in |
| Facit-grind FÖRE skrivningen | ja | **nej** — grinden flyttar till återläsningen |
| Trimma svaret | (JS returnerar valda fält) | **nej** — hela projektionen, ~1,4 k tokens/produkt |

☠️ **Fältmask finns inte.** `?fields=products.id,products.name` ger
`400 Failed to parse JSON or deserialize protobuf message`. Enda `fields` som
finns är enum-tillägg (`PLAIN_DESCRIPTION`, `MEDIA_ITEMS_INFO`).

☠️ **En markör får INTE följas av sitt eget filter.** Skickas `filter` eller
`sort` tillsammans med `cursor` svarar V3
`SE-1141: Search, filter and aggregations cannot be specified together with
cursor`. Filtret ligger inbakat i markören. Tidigare rundors svep såg aldrig
det här, för de svepte UTAN filter.

**Vad som ersatte katalogsvepet:** de publicerade sidorna hämtades ur
`https://www.fyndplats.se/sitemap.xml` — 2 197 produktsidor, gratis, utan att
röra API:t. Utkasten hämtades med serversidigt namnfilter i två sidor.

## Steg 1 — familjen

`name $startsWith "Ersatzdach"`, `visible:false` → **15 utkast**, `hasNext:false`.

| grupp | utkast | pris | not |
|---|---|--:|---|
| **A. Pergola 3 × 3 m, indragbart, 250 × 255** | `8ea111a2` beige · `9304f8b8` kaffe · `bef14fba` brun | 599 · 599 · 569 | **rundans tre** |
| B. Paviljong 3 × 3 UPF30+ Oxford 370 g/m² | `d52c6d1d` · `d01a6d2b` | 779 · 749 | tyska texten namnger `01-0867` |
| C. Paviljong 3 × 3 dubbeltak + avrinning | `df5a7190` ljusgrå · `60eaf40e` khaki | 899 · 859 | se dubblettgrinden |
| D. Paviljong 3x3 "wasserabweisend … für" | `b6ebc5ba` · `271327e1` | 749 · 779 | |
| E. övriga singlar | `9a3600f8` `ef0a812d` `3f9fda98` `dc7d2513` `2bfaf6dd` `22dbd372` | 639–819 | |

Slut i lager: `bef14fba` (rundans bruna) och `22dbd372`.

### Dubblettgrinden mot publicerade sidor

Sitemapen har två publicerade takdukar:

- **`paviljongtak-3x3-dubbeltak-creme`** — 859 kr, stora duken 300 × 300, lilla
  taket 86 × 86, 180 g/m² PA-belagd polyester, 8 dräneringshål, färg creme.
  ☠️ **`60eaf40e` (khaki) ligger på exakt samma pris och samma konstruktion.**
  Grupp C är alltså med stor sannolikhet FÄRGSYSKON till en publicerad sida och
  ska poleras mot dess text, inte som nya produkter. Egen uppgift.
- **`paviljongtak-3x3-m-reservtak-polyester`** — 709 kr, **tre färgval**
  (orange, ljusgrå, grön), "ventilerad topp, utan stomme".

Rundans grupp A är **inte** dubblett av någon av dem: A är en PERGOLA-duk för
stommar där taket dras in på skenor, 250 × 255 cm, medan båda de publicerade är
paviljongtak på 3 × 3 m med fast respektive dubbelt tak. Konstruktion och mått
skiljer. Grupp A korslänkar ändå till den publicerade paviljongsidan, för den
kund som mäter och upptäcker att stommen inte är indragbar.

## Steg 2 — grindar innan något skrivs

1. ☠️ **Passformen anges med LEVERANTÖRENS ARTIKELNUMMER i källan.** Tyska
   texten: *"Nur geeignet für 3 x 3 m Pavillons (Sku: 84C-054GY, 84C-054BK)"*.
   Numret är husets farligaste läcka — dealproffsen.se publicerar samma sträng
   som `sku`/`mpn`. Passformen skrivs därför som MÅTT: 250 × 255 cm, 3 × 3 m
   stomme, indragbart tak, och en uttrycklig uppmaning att mäta.
2. ☠️ **Endast duken ingår.** Källan är entydig — varken stomme, takskenor
   eller stänger följer med. Skrivs i punktlista, spec-tabell OCH FAQ.
3. **Sex stångfickor är en gräns**, inte en förmån.
4. **Väderbegränsningen** (ta in vid storm/hård vind/kraftigt regn) är källans
   egen och skrivs som skötsel, aldrig som säkerhetslöfte. Ingen standard nämns
   någonstans → orden "säker"/"vattentät" är förbjudna.
5. **Färgerna mäts i bilden**, inte i tyskan — se Steg 4.

## Steg 4 — bilderna, och rundans allvarligaste fynd

Färg mätt som median-RGB i huvudbildens mittfält:

| utkast | tyskt namn | mätt RGB | svenskt namn |
|---|---|---|---|
| `8ea111a2` | Beige | 189, 177, 147 | beige |
| `9304f8b8` | Kaffee | **89, 63, 52** | **mörkbrun** |
| `bef14fba` | Braun | 146, 122, 99 | brun |

☠️ **"Kaffee" är MÖRKARE än "Braun".** Att översätta båda till "brun" hade gjort
två skilda artiklar omöjliga att skilja åt i butiken.

Pixelgrinden (gråskala 320 × 320, under 1,0 = samma bild): beige/kaffe 29,65 ·
beige/brun 13,99 · kaffe/brun 15,66. Tre skilda bilder — men samma 3D-render
omfärgad, precis som runda 59 mätte.

### ☠️ Tysk text OCH leverantörens logotyp i pixlarna — på 8 av 15 bilder

| bild | beige | kaffe | brun |
|---|---|---|---|
| 1 huvudrender | ren | ren | ren |
| 2 livsstil | **"Nur Dach (ohne Rahmen)"** | **samma** | **samma** |
| 3 måttritning (2,55 m / 2,5 m) | ren | ren | ren |
| 4 livsstil | **text + `Outsunny by Aosom`** | **text + logotyp** | ☠️ **fel färg** |
| 5 livsstil | **text + `Outsunny by Aosom`** | **text + logotyp** | ☠️ **fel färg** |

Två skilda fel, och det andra hade ingen grind letat efter:

- **Text och logotyp** ligger i himlen upptill — bandet går att beskära bort
  enligt runbokens metodtabell, och bilderna är alltså räddningsbara.
- ☠️ **`bef14fba` (brun) bär två bilder av en KHAKI duk.** De är rena från text
  och logotyp och hade passerat varje befintlig grind. Vid hög upplösning är
  duken tydligt grön-khaki mot produktens varmbruna 146,122,99. Leverantörens
  bildset för EN färgvariant innehåller alltså renderingar av EN ANNAN. Det är
  ett färgpåstående i pixlarna, samma familj som runda 89–91:s randfärger men
  på bildnivå.

☠️ **Och ett tredje spår, utanför rundan:** `2bfaf6dd` har huvudbildens filnamn
**`aosom-84C-041-2.jpg`** — leverantörens namn OCH artikelnummer i Wix
filmetadata. En `grep` i HTML:en svarar grönt på det.

## Steg 5 — SKU-krocken finns redan i utkasten

Alla tre bär **samma** SKU från importen: `FP-ersatzdach-fur-3-x-3-m`.
Det bekräftar uppgift #272 en gång till — krocken skapas av IMPORTEN, inte av
poleringen. Rundan skriver tre unika.

| utkast | variant-id | SKU efter |
|---|---|---|
| `8ea111a2` | `520796e8-3818-4358-a58a-807ca056f059` | `FP-pergolatak-250x255-beige` |
| `9304f8b8` | `62a55704-6550-4cae-84f2-958896070e2a` | `FP-pergolatak-250x255-morkbrun` |
| `bef14fba` | `edaf69e4-3b22-4c4f-972c-eb083055caa4` | `FP-pergolatak-250x255-brun` |

## Grindarna

- `lint.py` — självtest **12 regler**, alla fäller.
  ☠️ **Zonerad FÄRGGRIND**, ny för den här rundan: syskonstycket SKA nämna de
  andra två färgerna, så en platt färgkontroll hade varit fel. Främmande
  färgord tillåts bara i stycken som bär en länk — samma zonindelning som
  runda 92 gav TALEN.
  ☠️ **Första `mät`-regeln krävde ingenting.** Den matchade även "mäter" i en
  måttmening, alltså var kravet uppfyllt av text som redan fanns. Självtestet
  fällde den; regeln kräver nu imperativen med ordgräns.
- `mutationstest.py` — **16/16 som förväntat**.
  ⚠️ En mutering är MEDVETET oupptäckbar och redovisas som sådan: vikt 2 → 3 kg
  passerar, för 3 är vitlistat (3 × 3 m). Talgrinden fäller främmande tal, inte
  ombytta tillåtna tal.
  ⚠️ En mutering var först fel byggd: "endast takduken" står på två ställen med
  olika versalisering, så bara det ena byttes och påståendet fanns kvar.
  Grinden hade rätt, muteringen var fel.
