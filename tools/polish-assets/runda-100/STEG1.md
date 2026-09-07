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
