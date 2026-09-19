# Runda 74 — sex manchesterfåtöljer med fotpall och två björkvilstolar

Alla fjorton steg klara. Åtta sidor publicerade och live-verifierade.

| id8 | slug | SKU (i butiken) | pris | färg: källan → skrivs |
|---|---|---|--:|---|
| e1c41327 | `fatolj-petrolbla-manchester-fotpall` | `FP-manchesterfatolj-petrolbla` | 2 499 | Blau → petrolblå |
| 58fb3025 | `fatolj-ljusgra-manchester-fotpall` | `FP-manchesterfatolj-ljusgra` | 2 329 | Grau → ljusgrå |
| 66adcdff | `fatolj-gul-manchester-fotpall` | `FP-manchesterfatolj-gul` | 2 319 | Gelb → gul |
| 4a9c33d2 | `fatolj-grabeige-manchester-fotpall` | `FP-manchesterfatolj-grabeige` | 2 269 | Hellbraun → **gråbeige** |
| 791e7292 | `fatolj-senapsgul-manchester-fotpall` | `FP-manchesterfatolj-senapsgul` | 2 199 | Orange → **senapsgul** |
| bc220489 | `fatolj-orange-manchester-fotpall` | `FP-manchesterfatolj-orange` | 2 059 | Braun → **orange** |
| 84082d41 | `vilstol-bjork-grabrun-fotstod` | `FP-vilstol-bjork-grabrun` | 1 299 | Braun → **gråbrun** |
| 7e00970f | `vilstol-bjork-gra-fotstod` | `FP-vilstol-bjork-gra` | 1 259 | Grau → grå |

Priserna är oförändrade — de lästes och skrevs tillbaka ordagrant, aldrig
räknade om.

## Kvitton

| steg | utfall |
|---|---|
| lint | **0 fel i 8 produkter** |
| mutationstest | **80/80 fångade**, orörd text 0 fel |
| kort | 8/8 importerade, varje byte-storlek identisk med filen på grenen |
| text (Steg 7) | 8/8 `ok`, synlig längd och hash mot facit INNE i anropet |
| media (Steg 9) | 8/8 · 6 bilder · hash **STÄMMER** · 0 tomma alt · kortet på position 3 |
| kategori (Steg 10) | `totalSuccesses: 1` × 8 |
| prisgrind (Steg 11) | 8/8 gröna `las`-körningar (1380–1387), `stammer true` |
| publicering (Steg 12) | 8/8 `visible=true` + `variant.visible=true`, priser oförändrade |
| stämpling (Steg 13) | 8/8 gröna `stampla`-körningar (1392–1400) |
| **live (Steg 14)** | **8/8 `200`, text byte-identisk med facit**, eget kort i sidkällan |

## ☠️ Den andra sessionen skrev SKU och PUBLICERADE mina sex mitt i rundan

Upptäckt när Steg 12 skulle förberedas: `e1c41327` stod som `revision: 8`,
`visible: true` och bar `sku: FP-manchesterfatolj-petrolbla` — en SKU jag
aldrig skrivit. Min egen media-återläsning tio minuter tidigare hade gett
`visible=false` på alla åtta.

**Det var inte en bugg i koden.** `FP-manchesterfatolj-petrolbla` har en
produktdel på 26 tecken; `PRODUCT_PART_MAX` i `lib/import/sku.ts` är **24**,
och `sku_bas` i `grindar.py` kapar vid 24 den också. Ingen kodväg i repot kan
producera strängen. Den är handskriven — alltså den andra sessionen (#262).

Vad som mättes, i den ordning som gör talen meningsfulla:

| | |
|---|---|
| Dubblettsidor skapade | **0** — katalogsvepet på `manchesterfatolj\|vilstol-bjork\|fatolj-<färg>` gav elva träffar: mina åtta plus de två publicerade syskonen plus en orelaterad |
| Mina fält som överlevde | slug, namn, brödtext, SEO, alla sex bilder — **alla åtta** |
| Publicerade av den andra sessionen | **6** (manchesterfåtöljerna) |
| Orörda | **2** (björkvilstolarna, kvar som `visible:false`) |

☠️ **De två björkvilstolarna delade `FP-akzentsessel-relaxsessel`** — importens
SKU, IDENTISK på båda. Det är en äkta krock och den lagades: husets SKU:er
skrevs och båda publicerades. Efteråt är alla åtta SKU:er **unika, 8/8**.

✅ **Beslutet på de sex: butiken vinner, inte min fil.** Mina planerade SKU:er
(`FP-fatolj-petrolbla` …) skrevs ALDRIG. De sex som redan låg i butiken är
distinkta och korrekta, och att skriva om dem hade varit ren churn mot en
session som arbetar samtidigt. Stämplingen skickade därför **butikens**
SKU:er till mappningen, inte `facit.json`:s.

Det är husets egen regel, och den är dyrköpt: `jamforelsePris` byggdes för att
mappningen ska spegla vad kunden FAKTISKT ser, efter att förväxlingen av två
fält som båda heter `sku` lät prissynken skriva till ingenting i en månad. En
mappning som bär ett annat SKU än butiken är samma klass av lögn.

⚠️ **Följden: `facit.json` och `skrivning.json` i den här mappen bär mina
planerade SKU:er, inte butikens.** Textfacit stämmer (live-grinden är 8/8
byte-identisk) — det är bara SKU-fältet som divergerar, med flit. Läs butiken,
inte filen, om du behöver rundans SKU:er.

## ☠️ Färgordet ljuger på två av åtta — och åt varsitt håll

| utkast | källan | uppmätt | skrivs |
|---|---|---|---|
| bc220489 | **Braun** | H 27°, S 54 % | **orange** |
| 791e7292 | **Orange** | H 41° | **senapsgul** |

Runda 73:s skala var L-baserad med S som tiebreak, och alla dess referenser är
neutraler. På en MÄTTAD yta är L nästan informationslöst — en gul och en
orange fåtölj kan ligga på samma luminans. Skalan har därför två grenar sedan
den här rundan (`farg.py`):

- `S < 15 %` → **neutral**, läs L mot husets skala (runda 73:s referenser).
- `S >= 15 %` → **kromatisk**, läs H. L kvalificerar bara (ljus/mörk).

## ☠️ Färgens PLATS i sluggen avgör om SKU:erna krockar

Sex färger av samma möbel. Med färgen SIST
(`manchesterfatolj-…-petrolbla`) kapar `sku_bas` vid 24 tecken och alla sex
får `FP-manchesterfatolj-fotpall` — en sexdubbel krock. Med färgen som ANDRA
ord (`fatolj-petrolbla-manchester-fotpall`) blir alla åtta distinkta.

Det är runbookens hundvagnsfälla, förebyggd i stället för upptäckt. Regeln:
**på en färgfamilj ska färgordet stå så tidigt i sluggen att det ryms innanför
`sku_bas`:s 24 tecken.**

## ☠️ Paketmåttet är ingen modellsignatur

Dubblettgrinden matchar varje `A × B × C`-trippel mot varje publicerad
fåtöljsidas tripplar, och gav en falsk träff: två helt olika möbler delar
kartongmått. Väg tripplarna — yttermått, sits, ryggstöd, maxlast och egenvikt
är signatur; **paketmåttet beskriver leverantörens logistik, inte produkten.**

## ⚠️ `ExecuteWixAPI` utan `siteId` kör i KONTOSKOPE och 403:ar allt

Kortimporten föll åtta gånger på `403 PERMISSION_DENIED`, och en vanlig
produktläsning som fungerat hela rundan föll likadant. Det var inte kroppen och
inte behörigheten: **`siteId` är valfritt i schemat men obligatoriskt för
site-arbete** — utan det går anropet på kontonivå, där varje site-endpoint
nekas. Felet ser ut som en indragen behörighet och är ett saknat argument.

## ⚠️ Två publicerade syskonsidors färglista är nu ofullständig

`manchesterfatolj-med-fotpall-beige` (62161510) och
`vilstol-bjork-femstegs-fotstod` (beacff5a) länkas FRÅN rundans åtta, men
listar inte de nya färgerna själva. Samma sak som #295 — samlas ihop.
