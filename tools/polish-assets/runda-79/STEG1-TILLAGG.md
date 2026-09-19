# Runda 79, Steg 1 — tillägget som svepet på `body:` avslöjade

Steg 1 listade sju utkast. Ett korrekt svep ger **tio**, och ett av de sju är
en exakt dubblett av en publicerad sida. Båda felen har samma orsak.

## ☠️ `wix.request` tar bodyn under `body` — `data` slukas TYST

Runbooken dokumenterar det sedan 2026-09-05, och den här sessionen gick ändå
i fällan. Symtomen är precis de två som står där:

| kroppsnyckel | `cursorPaging.limit` | filtret | utfall |
|---|--:|---|---|
| `data:` | 10 → **100 rader** | ignorerat | V3:s DEFAULTSIDA |
| `body:` | 10 → **10 rader** | tillämpat | rätt svar |

Kontrollen som avslöjade det tog ett anrop: **tre olika filter gav
byte-identiska svar.** Ett filter som ignoreras kan ge samma rader som ett
annat; ett filter som TILLÄMPAS kan inte.

⚠️ Och `visible` är inte filtrerbart alls på `/products/search` — den svarar
200 och returnerar hela katalogen. Sålla i koden.

## Familjen är tio utkast, inte sju

Svep på fyra tyska prefix (`Rollhocker`, `Arbeitshocker`, `Drehhocker`,
`Salonhocker`):

| id8 | pris | mått | sits | last | vad |
|---|--:|---|---|--:|---|
| 983fe163 | 799 | 32 × 40 × 70–86 | Ø32,5, sitthöjd 48–64 | 120 | rygg, vit |
| 98c1b3cb | 799 | 32 × 40 × 70–86 | Ø32,5, sitthöjd 48–64 | 120 | rygg, svart |
| 9c6fde71 | 749 | Ø35,5 × 51–67 | Ø35,5, kryss Ø48,5 | 120 | utan rygg, rutstickad |
| 711f7859 | 899 | Ø50 × 63–83 | Ø35, sitthöjd 53–73 | 120 | låg rygg, vit |
| 93b7d87b | 919 | 45 × 54 × 73–88 | Ø36, sitthöjd 51–66 | 120 | rygg 38 × 28, svart |
| c328a7c0 | 1 229 | 38 × 38 × 57–72 | 37 × 33, sitthöjd 47–62 | 120 | ☠️ **2-PACK** |
| 12ce97db | 829 | 48 × 47 × 45–59 | 35 × 36 | 120 | sadel, svart fot |
| 20782c24 | 899 | 52 × 53 × 49–61 | 35 × 36 | 120 | sadel, rosa |
| df3a97c6 | 949 | 50 × 50 × 83–98 | Ø35, sitthöjd 51–67 | 120 | ☠️ **DUBBLETT** |
| 1d0ba82d | 829 | Ø42 × 50–64 | Ø32 | **110** | utan rygg, vit |

De tre sista prefixen fanns inte i Steg 1:s lista. `Salonhocker`-svepet ensamt
gav två utkast (`93b7d87b`, `1d0ba82d`) som ingen tidigare runda sett.

⚠️ `Hocker`-prefixet ger tolv träffar till, men alla är **förvaringspuffar**
(`Hocker mit Stauraum`, `Polsterhocker`) — en annan familj. Sveptermen måste
vara smalare än ordet.

## ☠️ `df3a97c6` är en EXAKT dubblett av en publicerad sida

| | utkast `df3a97c6` | publicerad `arbetsstol-hjul-51-67-cm-avtagbar-rygg` |
|---|---|---|
| yttermått | 50 × 50 × 83–98 cm | 50 × 50 × 83–98 cm |
| sits | Ø35, sitthöjd 51–67 | Ø35, sitthöjd 51–67 |
| sitstjocklek | 7 cm | 7 cm |
| ryggstöd | 25 × 40 cm | 25 × 40 cm |
| maxlast | 120 kg | 120 kg |
| färg | svart | svart |
| **pris** | **949 kr** | **1 189 kr** |

Sju identiska tal räcker inte som bevis — det gjorde de inte i Steg 1 heller.
**Bilden avgör.** Huvudbilderna jämförda pixel för pixel (gråskala, 256 × 256):

| par | medelavvikelse |
|---|--:|
| utkastet mot den publicerade svarta | **1,0** |
| utkastet mot den publicerade VITA syskonsidan | 30,4 |
| de två publicerade sidorna mot varandra | 30,7 |

**1,0 är samma fotografi omkodat.** 30 är vad en äkta färgvariant kostar. Det
är alltså inte ett färgsyskon — det är samma vara, samma kulör, samma bild.

☠️ **Och priserna skiljer 240 kr.** Hade utkastet publicerats sålde butiken
samma pall på två sidor till två priser — värre än en vanlig dubblett, för då
konkurrerar sidorna inte bara om sökordet utan om samma kund.

Utkastet **pensioneras** (`draftStatus: "rejected"`, `needsAiPolish: false`) —
inte raderas. Ett osynligt utkast kostar ingenting medan det ligger, och en
radering går inte att ångra om matchningen visar sig vara fel.

⚠️ **Sidoupptäckt, inte den här rundans jobb:** de två publicerade sidorna är
samma modell i svart och vitt men heter `arbetsstol-…` respektive
`sadelstol-…`. Samma namnmönstersplittring som #300.

## ☠️ `c328a7c0` är ett TVÅPACK

Den tyska brödtexten säger *"Dieses Set aus 2 … Stühlen"* och
`Lieferumfang: 2 x Hocker`. Steg 1 förde upp den som en ensam pall. Priset
1 229 kr blir ~615 kr per pall, vilket ligger i familjens spann — ensam hade
den varit dubbelt så dyr som sina syskon utan att vara dubbelt så bra.

Samma klass som runda 60:s fynd att tolv av tretton vattenkokarutkast var SET.

## Rundans åtta

`983fe163` · `98c1b3cb` · `9c6fde71` · `711f7859` · `93b7d87b` · `c328a7c0`
· `12ce97db` · `20782c24`

Skjuts: `df3a97c6` (pensioneras), `1d0ba82d` (nästa runda), `b9ab45db` (#310,
snurrstol).

## Krockunderlaget — svept på SVENSKA denna gång

Hela katalogen läst i två anrop: **5 502 rader, `unika == rader`,
`avhuggen: false`**. Publicerade sidor vars slug bär `pall|stol|hocker|sits`:
249 stycken. De som äger den här familjens sökord:

| publicerad sida | nyckeltal |
|---|---|
| `arbetspall-med-hjul` | 48–63, Ø35,5, kryss Ø48,5, 120 kg |
| `arbetsstol-hjul-51-67-cm-avtagbar-rygg` | 50 × 50 × 83–98, Ø35, 51–67, 120 kg |
| `sadelstol-med-ryggstod-vit` | samma, vit |
| `arbetsstol-med-hjul-och-rygg` | 46 × 51 × 78–93, Ø35, 50–64, rygg 33 × 29 |
| `arbetsstol-salong-hoj-och-sankbar` | ⚠️ **inga mått alls i texten** |
| `sadelpall-hjul-49-61-cm-brun` | 52 × 53, 35 × 36, 49–61, 120 kg |
| `verkstadspall-med-verktygsbricka-37-cm` | 38 × 35 × 37, 100 kg |
| runda 78:s åtta rullpallssidor | — |

⚠️ `arbetsstol-salong-hoj-och-sankbar` är publicerad och innehåller **inte ett
enda mått** — varken sitthöjd, maxlast eller yttermått. Den går därför inte att
krockpröva mot, och en kund kan inte avgöra om den passar. Egen åtgärd, inte
den här rundans.
