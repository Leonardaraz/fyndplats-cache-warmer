# Runda 108 — rumsavdelare i polypropen på tallram

Sex av nitton utkast i familjen. En konstruktion i tre panelantal och fyra
färger; de två som INTE poleras är bevisade dubbletter av den publicerade
`d4118d39` (se `STEG1.md`), och den ommappningen är Leonards beslut att fatta.

## Steg 3 + 6 — mappningsraden

Läst med workflowen **Polering — läs och stämpla mappningsraden** (läge `las`).
Sex av sex prisgrindar gröna:

| nyckel | artnr | pris | landedCost | prisgrind | lager | frakt ÷ inköp |
|---|---|--:|--:|:-:|--:|--:|
| `5f14c112` | 830-814V00WT | 1 069 | 888,09 | ✅ | 82 | 0,491 |
| `957b042d` | 830-814V00BN | 1 139 | 942,80 | ✅ | 14 | 0,463 |
| `6649471e` | 830-814V01ND | 1 329 | 1 104,29 | ✅ | 197 | 0,395 |
| `854371fe` | 830-814V01BN | 1 179 | 976,08 | ✅ | 17 | 0,447 |
| `da1a8a75` | 830-814V02WT | 1 499 | 1 251,66 | ✅ | 29 | 0,369 |
| `64c0809d` | 830-814V02ND | 1 429 | 1 187,55 | ✅ | 63 | 0,367 |

Alla sex har EU-lager, EN variant med `supplierVariantId`, och saldo över noll.
Ingen ligger över 0,5 i fraktandel. Steg 6 är därmed ett no-op — men kollat, inte
antaget. Artikelnumren delar basen `830-814`, vilket bekräftar Steg 1:s
familjeavläsning mot MAPPNINGEN och inte bara mot feeden.

## Steg 7 — texten

6 av 6: `LEN ok | HASH ok | namn ok | slug ok | titel ok | meta ok | utkast ok`.
Facit i `facit.json`, 5 663–5 687 tecken normaliserat.

☠️ **Fyra rättelser som bara FOTOT kunde ge**, gjorda före skrivningen:

1. **"ram i MASSIV tall"** — leverantören skriver `Kiefernholz`, inte
   `Massivholz`. Ordet var poleringens eget påhäng, och den publicerade
   syskonsidan skriver riktigt nog bara "tallram". Samma klass som runda 56:s
   "MDF är inte massivt trä", fast åt andra hållet: där ljög leverantören, här
   var det jag som uppgraderade.
2. **"Höjden är 170 cm RAKT IGENOM"** — panelernas ovankant är BÅGFORMAD, och
   måttritningens 170-linje går till bågens topp. Meningen efter påstod dessutom
   att skärmen är "lägre än de flesta vuxna står" — ett tal om människor jag
   inte mätt. Båda omskrivna.
3. **"gulnar inte som pappersfiber"** — texten säger två stycken senare att
   väven INTE är UV-stabiliserad. Två meningar som tar ut varandra, och den som
   var ett LÖFTE fick gå.
4. Närbilderna visade vad materialet faktiskt ÄR: panelen är stående
   **tallspjälor** med plastbanden flätade tvärs över. Det är spjälorna som
   syns som ljusa streck i väven. Ett nytt stycke, mätt i pixlarna.

Och en bekräftelse åt andra hållet: **"tre gångjärn per skarv"** var en
härledning ur 9/15/21 mot 3/5/7 skarvar. Studiobilden och måttritningen visar
tre mässingsgångjärn per skarv. Härledningen fick stanna för att den kunde
SES, inte för att den gick ihop.

## Steg 8 — SKU:n, och en halva jag först hoppade över

Sex distinkta SKU:er ur husregeln, räknade ur sluggen och inte ur minnet.

☠️ **Steg 8 har TVÅ halvor, och jag gjorde först bara den ena.** Workflowen
skriver `variantSkus` till MAPPNINGSRADEN. Wix egen variant-SKU rörs inte av
den — och publiceringens kvitto visade att alla sex fortfarande bar
leverantörens tyska sträng, dessutom identisk inom varje storlekspar:

| Wix-SKU före | satt på |
|---|---|
| `FP-4-teiliger-raumtrenner` | `5f14c112`, `957b042d` |
| `FP-6-teiliger-raumtrenner` | `6649471e`, `854371fe` |
| `FP-8-teiliger-raumtrenner` | `da1a8a75`, `64c0809d` |

Rättat med en `variantsInfo`-PATCH som matchar på `wixVariantId` (ALDRIG på
position — två fält heter `sku` och betyder olika saker) och skickar `visible`
explicit i båda leden. 6 av 6 `sku ok | variant synlig | LIVE | en variant`.

⚠️ **Det var kvittot som hittade det, inte grinden.** Publiceringens egen GET
kollar SKU:n mot den förväntade strängen; hade den bara räknat "finns en SKU"
hade sex sidor gått live med tyska, krockande artikelnummer. Nionde gången:
räkna efter, lita inte på att steget kördes.

## Steg 9 — galleriet och korten

Ordningen är runbookens: 1 hjälte, 2 miljö, 3 vårt kort, 4–5 detaljer,
**måttritningen sist**. Den låg på plats 3 på alla sex. Ingen bild togs bort:
Steg 4 granskade alla trettio och fann noll tysk text i pixlarna, noll
logotyper, och måttritningar som bara bär siffror.

☠️ **ALT-TEXTEN VAR EN LÄCKA.** Alla trettio bilderna bar leverantörens RÅA
TYSKA TITEL — ordagrant, och identisk på varje bild i galleriet:
`4-teiliger Raumtrenner, Faltbarer Sichtschutz, … Weiß`. Trettiosex nya
alt-texter, grindade av `alt.py`, som ÄRVER rundans löftesmönster ur `grind.py`
i stället för att skriva om dem. 9 av 9 självtest, 0 fel.

6 av 6: `6 bilder ok | ordning ok | alt ok | utkast ok`.

### ☠️ Korten: tre mätningar, och den som vann hade huset avskrivit

Väven är det högfrekventaste huset stött på. Fem av sex kort sprängde
215 kB-taket vid q=85. På det värsta (`64c0809d`, 397 197 byte):

| knapp | bästa utfall |
|---|---|
| krympa varan (`sok-fyllnad.py`) | 213 440 vid 42 % av 79 % möjliga |
| nedsampla fotot (`sok-mjukhet.py`) | 269 710 vid 4× — **räckte inte** |
| **oskärpa (`sok-oskarpa.py`)** | **197 470 vid r=3 och FULL storlek** |

⚠️ Runbookens rad *"oskärpa är fel medicin på nät — runda 104 mätte r=1,3 till
~9 %"* är sann om RADIEN och falsk om METODEN. Uppmätt här: r=1 ger 14–23 %,
r=2 ger 27–41 %, r=3 ger 43–50 %. Kurvan är brant strax förbi r=1 — alltså
precis där runda 104 slutade mäta.

Nedsamplingen var min egen hypotes (ett äkta lågpass borde ta mer än en
gaussisk oskärpa). Mätningen slog ihjäl den, och skriptet står kvar så att
ingen prövar den igen.

⚠️ **Och runda 107:s fälla, uppmätt en gång till:** när varan är HÖGRE än
panelen biter fyllnaden inte alls. `957b042d` gav byte för byte identiskt
utfall vid 0,85 och 0,60 — höjden styrde båda. `sok-fyllnad.py`:s tal SER ut
som en skala utan att vara det, och det var därför de första talen pekade fel.

Alla sex ritas nu vid varans geometriska maxstorlek (37–79 % beroende på
modell) och ligger på 204 669–209 878 byte.

Rubriken är **panelantalet**, valt för att det går att RÄKNA i bilden och för
att det skiljer de tre storlekarna åt på kortet. Två alternativ prövades och
står avfärdade i `kort.py`.

## Steg 10 — kategori

**Hem & Inredning** (roten), samma som den publicerade syskonsidan `d4118d39`
redan ligger i. Ingen av lövkategorierna under den beskriver en rumsavdelare —
`Dekoration & Prydnad` hade varit närmast och ändå fel, för skärmen är
funktionell möbel. Att matcha syskonet håller familjen samlad; ett riktigt
möbellöv hör till kategoriträds-städningen (Leonards sekvensering).

☠️ **Svarsnyckeln heter `categoriesForItems`.** Mitt första anrop letade efter
`itemsWithCategories`, fick noll rader UTAN felkod, och såg ut att bevisa att
ingen produkt låg i någon kategori. Samma familj som `/api/tracking-events`
2026-09-01: en läsare som blir TOM ser i koden likadan ut som en frisk. Det som
avslöjade den var att läsa RÅSVARET i stället för att tolka ett tomt resultat.

⚠️ Och båda kategori-anropen kräver `treeReference: {appNamespace: "@wix/stores"}`
i kroppen — utan den svarar API:t 400 och namnger fältet.

6 av 6 `lyckade 1/1 | Hem & Inredning ok`.

## Steg 13 — publicering och stämpel

Wix först, mappningen sedan — samma ordning och samma skäl som `price-repair`.
6 av 6 stämplade (`needsAiPolish: false`, `draftStatus: published`).

Publiceringens kvitto, en EGEN GET per produkt:

```
LIVE | variant synlig | 6 bilder | alla har url | alla har alt | slug ok | sökord svenska
```

## Steg 14 — live-grinden

**6 av 6 sidor gröna**, 159 927–160 263 tecken var.

```
OK  rumsavdelare-160-vit      159927 tecken  cache=HIT age=20
OK  rumsavdelare-160-brun     160037 tecken  cache=HIT age=20
OK  rumsavdelare-240-natur    160263 tecken  cache=HIT age=52
OK  rumsavdelare-240-brun     160060 tecken  cache=HIT age=20
OK  rumsavdelare-320-vit      160043 tecken  cache=HIT age=20
OK  rumsavdelare-320-natur    160257 tecken  cache=HIT age=20
```

Grinden prövar rundans löften med SAMMA funktioner som brödtextgrinden
(`BARRIAR`, `morklaggningslofte`, `UTOMHUSLOFTE` ur `grind.py`), inte med
omskrivna kopior — och den läser HELA HTML:en, alltså även alt-texterna.
Den bär runda 107:s två kontrollmätningar: hjältebildens media-id måste
finnas i svaret, och strykningen av andra produkters identiteter får inte
äta sidans egna alt-texter.

⚠️ Att `morklaggningslofte` släpper igenom sidan är i sig ett utfall värt att
notera: varje sida bär TRE nekande meningar om mörkläggning — H2:n
"Skymmer insyn, mörklägger inte", "ett dåligt mörkläggningsdraperi" och
FAQ-svaret. Ett rent ordmönster hade fällt alla sex.

## Sidorna

| nyckel | slug | pris |
|---|---|--:|
| `5f14c112` | `rumsavdelare-160-vit` | 1 069 |
| `957b042d` | `rumsavdelare-160-brun` | 1 139 |
| `6649471e` | `rumsavdelare-240-natur` | 1 329 |
| `854371fe` | `rumsavdelare-240-brun` | 1 179 |
| `da1a8a75` | `rumsavdelare-320-vit` | 1 499 |
| `64c0809d` | `rumsavdelare-320-natur` | 1 429 |
