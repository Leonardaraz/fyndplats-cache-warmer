# Runda 100 — Steg 1: familjevalet och dubblettgrinden

## Familjen valdes på FÖRHÅLLANDET, mätt över hela katalogen

Katalogen svept 2026-09-07 (56 sidor, alla produkter): **5 527 totalt,
3 248 utkast, 2 279 publicerade**.

☠️ **En mätning på TYSKA huvudord ser noll publicerade sidor — alltid.** Första
svepet grupperade på det ledande ordet och gav `publicerade: 0` för varenda
familj, eftersom de publicerade sidorna bär SVENSKA namn. Talet såg ut som
"orörd familj" på tio rader i rad. Andra svepet frågade båda språken i samma
pass, och då föll rangordningen isär:

| familj | utkast | publicerade | kvot |
|---|--:|--:|--:|
| gartentisch/gartenmöbel | 77 | 12 | **6,4** |
| massagesessel | 42 | 9 | 4,7 |
| kinder-elektroauto | 98 | 22 | 4,5 |
| kleintierstall | 42 | 12 | 3,5 |
| hundewagen/hundebuggy | 47 | 18 | 2,6 |
| beistelltisch | 51 | 25 | 2,0 |
| hochbeet | 35 | 18 | 1,9 |
| mülleimer | 46 | 25 | 1,8 |
| hocker | 72 | 75 | 1,0 |
| wandspiegel | 26 | 46 | 0,6 |

## ⚠️ Men den vinnande raden var en BLANDAD PÅSE

`gartenmöbel` är ett paraplyord, inte en familj. De 77 träffarna delade sig:

| vad de faktiskt är | antal |
|---|--:|
| SET / sittgrupp | **49** |
| riktiga bord | 12 |
| sidobord | 6 |
| stol eller bänk | 7 |
| solsäng | 1 |
| övrigt | 2 |

Samma fälla som runda 97:s Steg 1, där ett svep på foder-ord drog in fågelburar
och kaninhyddor. **Kvoten mäter det sökordet fångar, inte en familj** — dela upp
träffen innan den blir en runda.

Kvar efter uppdelningen: **tolv riktiga trädgårdsbord**, varav åtta matbord och
fyra små balkong-/sidobord. Rundan tar matborden; de fyra små får ett eget
huvudord senare och krockar därför inte.

## ☠️ Dubblettgrinden: ETT bord är redan publicerat

Nio publicerade trädgårdsbord finns i katalogen. Måtten jämfördes först, och
där de stämde avgjorde bilden — runbokens ordning, för pixelgrinden BEVISAR en
dubblett men utesluter ingen.

| utkast | mått | publicerad kandidat | mått | dom |
|---|---|---|---|---|
| `06e3fd94` massiv gran, hjulben | 110 × 60 × 65 | `542cbd16` | 110 × 60 × 65 | ☠️ **DUBBLETT** |
| `65a730a4` aluminium, 8 pers | 190 × 90 × 74 | `fa683626` | 190 × 90 × 74 | ⚠️ färgsyskon |
| `f806eebf` WPC teak | 140 × 80 | `ead4a4e4` komposit | 140 × 90 | ✅ olika |
| `e71acc53` alu lamell | 145 × 90 | `9c7a51fe` alu **glas** | — | ✅ olika |
| `c71418ca` utdragbart | 160/220 | `26747ba2` | 180–240 | ✅ olika |
| `29c688dc` utdragbart **plast** | 80/160 | `2dccee2f` utdragbart **glas** | 80/160 | ✅ olika |

**`06e3fd94` är samma render som den publicerade sidan**, sedd från motsatt
håll: samma massiva träskiva, samma två vagnshjul, samma svarvade fötter, samma
110 × 60 × 65 cm. Den ska INTE poleras. Utkastet är dessutom prissatt 1 699 kr
mot den publicerade sidans 2 099 kr.

⚠️ **`65a730a4` delar mått och stomme med `fa683626` men har TRÄLIK skiva där
den publicerade har SVART.** Det är #275:s färgsyskonsmönster, inte en dubblett
— men det måste bekräftas mot artikelnumrets BAS innan sidan skrivs, och texten
ska då korslänka i stället för att upprepa.

## Rundans batch

Sex bord är fria, plus `65a730a4` om artikelnumret bekräftar färgsyskonet.

| id8 | vad | mått | pris |
|---|---|---|--:|
| `e71acc53` | aluminium med lamellskiva, 6 pers | 145 × 90 × 74 | 1 959 |
| `65a730a4` | aluminium med trälik skiva, 8 pers | 190 × 90 × 74 | 2 629 |
| `f806eebf` | WPC i teakton på metallram, 6 pers | 140 × 80 × 75 | 2 779 |
| `4249df4d` | säkerhetsglas med hylla under, polyrotting | 150 × 85 × 74 | 3 039 |
| `29c688dc` | utdragbart, plastskiva på aluminium | 80/160 × 80 × 75 | 3 299 |
| `74d3c11c` | utdragbart, lamellskiva i aluminium | 81/162 × 80 × 75 | 3 899 |
| `c71418ca` | utdragbart med fjärilsmekanism, aluminium | 160/220 × 90 × 73 | 5 579 |

## Redan sett i råtexten (går vidare till Steg 5)

- ☠️ **Fyra bär ett LEVERANSLÖFTE som inte är vårt att ge**: *"WICHTIG: Wir
  liefern Ihnen den Artikel kostenfrei bis Bordsteinkante"* på `4249df4d`,
  `c71418ca`, `74d3c11c` och `29c688dc`. Fri leverans till trottoarkanten är
  leverantörens villkor mot oss, inte vårt mot kunden.
- ☠️ **`e71acc53` säger BÅDE "für 6 Personen" OCH "für vier Personen"** i samma
  stycke.
- ☠️ **`4249df4d` har två vikter**: 26 kg i brödtexten, 30 kg i spec-raden. Och
  två materiallistor: `Metall, Sicherheitsglas, Polyrattan` mot bara `Metall`.
- ☠️ **`c71418ca`:s spec-rad säger `220L`** på ett bord som är 160/220 — raden
  utelämnar det hopskjutna måttet och lovar därmed ett bord som alltid är 220 cm.
- ⚠️ Maxlasten skiljer per bord (50, 70, 80 kg) och får inte ärvas mellan dem.

## ⚠️ Två mätfel jag gjorde själv, båda värda att minnas

1. **`bilder: 0` på alla tolv** — jag läste med `?fields=PLAIN_DESCRIPTION` och
   drog slutsatsen att borden saknade galleri. `MEDIA_ITEMS_INFO` måste begäras;
   utan fältet är listan tom. Alla tolv har fem bilder.
2. **En hjältebild svarade `bad file`** och såg raderad ut. Samma fil svarade
   `200` vid nästa försök och renderas på live-sidan. **Ett enda misslyckat
   bildanrop är inget bevis** — hämta två gånger, precis som mot ISR-cachen.

---

## ☠️ ANDRA DUBBLETTEN, OCH DEN VÄRRE SORTEN: samma bord, två leverantörer

`65a730a4` såg ut som ett färgsyskon till den publicerade `fa683626` — samma
mått, samma stomme, olika skivfärg i bilden. Artikelnumren avgjorde, och de
säger något annat:

| | utkastet `65a730a4` | publicerade `fa683626` |
|---|---|---|
| `supplierProductId` | **`aosom:84B-915ND`** | **`1005012416577337`** (AliExpress) |
| skickas från | DE | ES |
| bilder | aosom-renderingar | `alicdn.com` / `aliexpress-media.com` |
| pris | 2 629 kr (utkast) | 2 429 kr (live) |
| `landedCostSek` | 2 185,16 | 1 845,44 |

**Och varenda specifikation är densamma:**

| | båda |
|---|---|
| mått | 190 × 90 × 74 cm |
| ribbtjocklek | 1,2 cm |
| maxlast skiva | 50 kg |
| sittplatser | 8 |
| material | aluminium + plast med träimitation |

Den publicerade sidans egen text säger *"bordsskiva i plast med träimitation
och ådring"* och dess alt-text *"svart bordshörn i **träeffekt**"* — alltså
samma trälika skiva som utkastets bild visar. Skillnaden i hjältebilden är
ljussättning och vinkel, inte kulör. **Det är samma fysiska bord.**

☠️ **Det här är precis den dubblett `CLAUDE.md` kallar den farliga**: en vara vi
redan säljer som en AE-inköpt sida, som feed-importen inte kan se eftersom
dubblettspärren nycklar på `supplierProductId` och AE-id:t ser ut som något
helt annat. 595 av 1 004 mappningsrader är Aosom-varor köpta via AliExpress.

**Leonards regel 2026-09-03 gäller:** sidan vi BEHÅLLER pekas om till Aosoms
artikelnummer, den andra pensioneras. Här är den polerade, indexerade sidan
`fa683626` den som behålls; utkastet `65a730a4` pensioneras.

### ☠️ …men ommappningen GÅR INTE, och grinden sa varför

`plan`-körningen vägrade:

```
artikelnummer
fran            aliexpress
landad kostnad  1845.44 -> 0 kr (inkl. moms)
kundpris        2429 kr (ORORT)
marginal        24.02 -> 100 %
[hinder] saknas_i_feeden
```

**`84B-915ND` finns inte längre i Aosoms feed.** Landad kostnad skulle bli 0
och marginalen 100 % — nonsens, och exakt det spärren finns för att stoppa.

Utkastets egen mappningsrad säger samma sak från andra hållet:
`aosomSyncedQty: 0`. Aosom har alltså slutat lista bordet, och lagersynken har
redan nollat saldot (en rad som försvinner ur feeden är ett lagerbesked, inte
en utgången produkt — `CLAUDE.md`).

**Slutsatsen blir enklare och säkrare än väntat:** den publicerade
AE-sidan `fa683626` står kvar orörd — den är den enda av de två som går att
sälja — och utkastet `65a730a4` pensioneras (`draftStatus: "rejected"`,
`needsAiPolish: false`). Ingen radering: ett osynligt utkast kostar ingenting
medan det ligger, och en radering går inte att ångra.

⚠️ **Bara halva Leonards regel gick att köra.** Ommappningen till Aosom är den
andra halvan, och den är inte möjlig så länge artikelnumret saknas i feeden.
Dyker raden upp igen är `plan`-körningen redan formulerad.

Rundan går vidare med **sex** bord.

## Rundans batch efter båda grindarna

| id8 | vad | mått | pris | prisgrind |
|---|---|---|--:|---|
| `e71acc53` | aluminium med lamellskiva, 6 pers | 145 × 90 × 74 | 1 959 | ✅ |
| `f806eebf` | WPC i teakton på metallram | 140 × 80 × 75 | 2 779 | ✅ |
| `4249df4d` | säkerhetsglas med hylla under | 150 × 85 × 74 | 3 039 | ✅ |
| `29c688dc` | utdragbart, plastskiva | 80/160 × 80 × 75 | 3 299 | ✅ |
| `74d3c11c` | utdragbart, lamellskiva | 81/162 × 80 × 75 | 3 899 | ✅ |
| `c71418ca` | utdragbart, fjärilsmekanism | 160/220 × 90 × 73 | 5 579 | ✅ |

Sex av sex prisgrindar stämmer mot `×1,20` + `charm99`.

## Steg 4: bilderna granskade

Alla sex har fem bilder, och alla fem positionerna är användbara. **Ingen tysk
text i pixlarna** — måttritningarna är rena siffror, och den enda texten är
`50 kg` på `f806eebf-3`.

☠️ **En bild plockas bort: `4249df4d-4`.** Den är en närbild vars hela motiv är
leverantörens ovala **märkesdekal** på rottingväven — inte en produktdetalj
utan en märkesbild.

⚠️ **Samma dekal sitter FYSISKT på ramen** på `e71acc53` och `f806eebf`, liten
och oläslig i galleriformat. Leonards regel: sitter märket på varan gör vi
ingenting åt det, och det nämns aldrig i text eller alt-text.

✅ **Måttritningarna bär båda lägena på de utdragbara.** `29c688dc-3` visar
80 × 80 och 160 × 80; `74d3c11c-3` visar 81 × 80 och 162 × 80. Det är facit
mot den tyska textens `80/160` respektive `81/162`.

☠️ **`c71418ca-3` visar BARA 220 × 90 × 73** — det utdragna läget. Det
hopskjutna måttet 160 finns bara i brödtexten. Måttritningen bekräftar alltså
inte spec-radens fel, den upprepar det: raden säger `220L` som om bordet alltid
vore 220 cm. Sidan ska skriva **160/220**.

⚠️ **Varenda miljöbild visar bordet med STOLAR** som inte ingår. Fyra av de sex
tyska texterna säger ingenting om det (`ef71bb42`, som inte är med i rundan,
har ett uttryckligt `HINWEIS: Stühle nicht enthalten`). Varje sida måste säga
att stolarna inte ingår.
