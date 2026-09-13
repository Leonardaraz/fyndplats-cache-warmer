# Runda 141 — Steg 7 och 8

## Steg 7: 7 av 7 gröna på facithashen

Alla sju utkasten fick sin svenska text, sitt namn, sin slug och sina
SEO-fält. `visible:false` är oförändrat på alla sju.

| pid | revision | slug |
|---|---|---|
| `8de3c3ef` | 2 → 3 | `traningsbank-115-cm-benstrackare` |
| `7b818c3b` | 1 → 2 | `traningsbank-med-stallning-98-122-cm` |
| `8a0e05f4` | 1 → 2 | `traningsbank-146-cm-tre-lutningar` |
| `b4961e6f` | 2 → 3 | `traningsbank-butterfly-svart-hopfallbar` |
| `83b2cf8b` | 1 → 2 | `traningsbank-175-cm-med-skivstangsstall` |
| `a4bbe667` | 2 → 3 | `traningsbank-180-cm-vit-med-skivstangsstall` |
| `18b94738` | 1 → 2 | `traningsbank-i-tra-med-hantelfack` |

Återläsningen gjordes som ETT EGET PASS efter alla sju skrivningarna, enligt
runbokens regel: en läsning inne i skrivloopen kan svara med tillståndet FÖRE.
Hashen är husets — taggbefriad, blankstegsnormaliserad synlig text, `h*31 %
1e9+7` — och den räknas identiskt i `facitgen.py` och i återläsningens JS.

**Sju av sju stämmer på både teckenantal och hash.** Handtranskriberingen in i
API-anropen införde alltså noll fel den här rundan.

### ✅ `ExecuteWixAPI` svarar igen — grinden är mekanisk igen

Tidigare i sessionen gav den 403, så kropparna skrevs för hand in i
`CallWixSiteAPI`. Den fungerar nu, med ETT krav som inte stod någonstans:

☠️ **`code` måste vara ett FUNKTIONSUTTRYCK, inte en skriptkropp.**
`const … await … return` på toppnivå avvisas med ett felmeddelande som säger
det rakt ut. Rätt form är `async () => { … return … }` — och anropa den inte
själv.

### ☠️ `?fields=A,B` är INTE tillåtet — ett värde per anrop

Uppmätt mot skarpa V3 idag, båda produkterna, samma svar:

```
?fields=MEDIA_ITEMS_INFO                          → 200
?fields=VARIANT_OPTION_CHOICE_NAMES               → 200
?fields=MEDIA_ITEMS_INFO,VARIANT_OPTION_CHOICE_NAMES → 400 "Failed to parse JSON
                                                        or deserialize protobuf"
```

Samma familj som `fields=VARIANTS_INFO`, som också ger 400 med exakt den
strängen. **Ett 400 här ser ut som ett trasigt anrop, inte som ett ogiltigt
fältnamn** — felmeddelandet nämner varken `fields` eller värdet.

### ☠️ Variantens media ligger i STANDARDPROJEKTIONEN — tvärtom mot galleriet

Mätt samtidigt, och därför inte gissat:

| | utan `fields` | med `MEDIA_ITEMS_INFO` |
|---|---|---|
| `variantsInfo.variants[].media` | **finns** | finns |
| `media.itemsInfo.items` | **tom** | 5 |

Asymmetrin är hela poängen: `getProductMedia` MÅSTE begära `MEDIA_ITEMS_INFO`
för sitt galleri (`CLAUDE.md`), medan variantens media kommer utan att
efterfrågas. Att anta samma regel för båda ger fel åt var sitt håll.

## Steg 8, Wix-halvan: 7 av 7, och SKU-krocken var verklig

`variantsInfo`-PATCH med bara `sku` ändrat, varianten skickad verbatim,
`visible` uttryckligen i BÅDA leden (produkten `false`, varianten `true`).

| pid | före (leverantörens) | efter |
|---|---|---|
| `8de3c3ef` | `FP-hantelbank-verstellbar` | `FP-traningsbank-115-cm` |
| `7b818c3b` | `FP-hantelbank-8-positionen` | `FP-traningsbank-stallning` |
| `8a0e05f4` | `FP-hantelbank-fitnessbank` | `FP-traningsbank-146-cm-tre` |
| `b4961e6f` | `FP-hantelbank-klappbar` | `FP-traningsbank-butterfly` |
| `83b2cf8b` | `FP-hantelbank-ohne-gewichte` | `FP-traningsbank-175-cm` |
| `a4bbe667` | **`FP-hantelbank-mit`** | `FP-traningsbank-180-cm-vit` |
| `18b94738` | **`FP-hantelbank-mit`** | `FP-traningsbank-tra` |

De två feta raderna är importens egen krock: två olika produkter bar SAMMA
SKU, båda kapade ur `Hantelbank mit …`. Exakt mönstret i runbokens
*"Importen skapar SKU-krockarna själv"* och i uppgift #473 — krocken uppstår
i den KAPADE strängen, inte i sluggen, så den syns inte på sidan man tittar på.

Alla sju nya är körda genom den riktiga regeln (`grindar.sku_bas`, som speglar
`lib/import/sku.ts`): sju av sju identiska med regelns utdata, sju distinkta,
alla ≤ 40 tecken. Kontrollerade mot katalogens sju publicerade träningsbänkar
också — noll krockar, och den enda befintliga `FP-traningsbank*` är
`FP-traningsbank-benrullar`.

### ☠️ PATCH:en RADERADE variantens media — trots att den skickades med

Fyra av de sju varianterna bar `media` före skrivningen. Efter den är alla
fyra `null`:

| pid | variantens media före | efter |
|---|---|---|
| `7b818c3b` | `b379ce_92576cbb…` | **null** |
| `8a0e05f4` | `b379ce_a2c0c323…` | **null** |
| `83b2cf8b` | `b379ce_92a91aae…` | **null** |
| `18b94738` | `b379ce_b3894335…` | **null** |
| `8de3c3ef`, `b4961e6f`, `a4bbe667` | saknades redan | null |

Det skärper uppgift #501 från *"även en som inte skickar media"* till **även en
som skickar varianten VERBATIM MED sin media.** Fältet är alltså inte bara
utelämnat-känsligt — det är read-only i den här riktningen, i linje med #352
(*variantens media går inte att skriva via variantsInfo alls*).

**Skadan är mätt, inte uppskattad, och den är noll här:**

1. Produktgalleriet är intakt — 5 bilder på alla sju efter skrivningen.
   `media.main` likaså, med samma fil-id som före.
2. Den publicerade syskonsidan `traningsbank-med-benrullar-gummiband` bär
   `variantMedia: null` sedan sin egen runda. Hämtad skarpt idag: rätt
   `og:image`, 22 distinkta produktbilder i HTML:en — en MER än
   `justerbar-traningsbank`, som HAR variantmedia (21).

Förklaringen är strukturell: en Aosom-rad har EN variant utan optioner, så
kunden väljer aldrig variant och `linkedMedia`/swatchen finns inte. Fältet har
ingen läsare på en sådan sida. **På en flervariantssida vore samma radering
en riktig skada** — det är där #501 fortfarande gäller fullt ut.

## Steg 8, mappningshalvan

Sju körningar av `polish-mapping.yml` i läget `stampla`, en per produkt, med
BARA `variant_skus` satt. `needs_ai_polish` och `draft_status` lämnades tomma
— loggen bekräftar `NEEDS_POLISH:` och `DRAFT_STATUS:` tomma, alltså rördes
fälten inte och ingenting publicerades.

Alla sju gröna. Grönt är inget kvitto i allmänhet, men här är det ett: raden
`[ "$(… .ok)" != "true" ] && exit 1` ligger FÖRE `|| true`-sektionen, så ett
grönt jobb betyder att rutten svarade `ok:true`. Loggen för `18b94738` visar
dessutom ordagrant `uppdaterad — variantSkus`.
