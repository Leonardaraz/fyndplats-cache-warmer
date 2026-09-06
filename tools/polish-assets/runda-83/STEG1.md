# Runda 83, Steg 1 — åtta mobila massagebänkar

Familjen `Massageliege`/`Massagetisch` är **125 massage-utkast** i kön, men
bänkarna är den enda delen med **noll krock mot de 28 publicerade
massagesidorna** — de är alla stolar och fåtöljer. Åtta bänkar poleras här.

| id8 | pris | vad det är |
|---|--:|---|
| `a353ea02` | 1629 | 3 zoner, aluminium, vit — syskon till `5078bedf` |
| `5078bedf` | 1639 | 3 zoner, aluminium, svart/röd |
| `a9555a7d` | 1679 | bokstomme, konstläder, creme — syskon till `754a4749` |
| `754a4749` | 1599 | bokstomme, konstläder, svart |
| `251f0429` | 1629 | träställ, 215 totalt / 185 bädd × 70, egen modell |
| `ed7a86fd` | 1539 | aluminium **med armstöd och handbrädor** — egen modell |
| `2cfd373a` | 1499 | 2 zoner, bokstomme, cremevit — syskon till `d7eca2ba` |
| `d7eca2ba` | 1449 | 2 zoner, bokstomme, svart |

---

## ☠️ Importens spec-flik anger FEL MATERIAL på fyra av åtta

Den maskinsatta svenska fliken motsäger leverantörens egen brödtext — och
inte i en detalj, utan i vad bänken är gjord av:

| id8 | brödtexten säger | spec-fliken säger |
|---|---|---|
| `a9555a7d` | `Buchenholz, Kunstleder` | ☠️ **`Kunststoff`** (plast) |
| `754a4749` | `Buchenholz, Kunstleder` | ☠️ **`Kunststoff`** (plast) |
| `2cfd373a` | `Buchenholz` | ☠️ **`Pappelholz`** (poppel) |
| `d7eca2ba` | `Buchenholz` | ☠️ **`Pappelholz`** (poppel) |

Bok och poppel är inte samma sak — bok är hårdare och styvare, och det är
precis det som betyder något i ett hopfällbart underrede någon ligger på.
**Poleringen följer brödtexten**, som runda 81 gjorde med `Edelstahl`-fliken.

⚠️ Men de två sista paren får ingen träslagsrad alls: när två källor pekar på
två olika träslag är rätt svar att skriva *"stomme i trä"* och låta bli att
välja. Samma regel som runda 82:s liggmått.

## ☠️ Måttens BOKSTÄVER är opålitliga — och 81 cm är INTE bäddens bredd

`a353ea02` anges `215B x 81T` (bredd 215, djup 81). En massagebänk som är
215 cm BRED och 81 cm djup finns inte. Ritningen löser båda frågorna på en
gång, och den andra är den som betyder något för kunden:

| ritningen visar | `a353ea02` |
|---|---|
| totallängd med ansiktsstöd | 215 cm |
| **bäddens längd** | **185 cm** |
| **bäddens BREDD** | **60 cm** |
| totalbredd med armhyllor | 81 cm |

☠️ **De 81 centimetrarna är bredden ÖVER ARMHYLLORNA, inte liggytan.** Samma
sak på `a9555a7d` och `754a4749` (210 totalt / 185 bädd / 60 bred / 81 över
hyllorna). Bäddens bredd är det en köpare jämför på, och en spec som säger
"81 cm bred" om en 60 cm bädd är vilseledande.

⚠️ **Jag hade fel i första utkastet av den här filen.** Jag kallade
`2cfd373a`/`d7eca2ba` "smala (60 cm)" i kontrast mot de andra. De är inte
smalare — **alla utom två har 60 cm bädd**. De två som verkligen är bredare
är `251f0429` (70 cm) och `ed7a86fd` (71 cm), och de har ingen armhylla.

Vi skriver `L × B × H` genomgående, med bäddens bredd som B, och redovisar
totalbredden som en egen rad där armhyllor finns.

## ☠️ Alla åtta ritningarna lästes om — och grinden hade nästan fel facit

Mutationstestet fällde en lucka: en spec som säger `Liggyta 185 × 81 cm`
passerade linten, eftersom 81 cm står i produktens egen spec — som
**totalbredd över armhyllorna**. Ingenting höll fast vilken AXEL ett tal
hörde till. Alla åtta måttritningarna (`rawbilder/<id8>-3.jpg`) lästes
därför om och ställdes rad för rad mot texten.

| id8 | ritningen visar | källtexten säger | utfall |
|---|---|---|---|
| `a353ea02` | 215 · 185 × 60 · 81 · 61–84 | samma | ✅ |
| `5078bedf` | 215 · 81 · 61–84 (inga bäddmått) | bäddmåtten ärvs från syskonet | ✅ |
| `a9555a7d` | 210 · 185 × 60 · 81 · 67–92 | samma | ✅ |
| `754a4749` | 210 · 185 × 60 · 81 · 67–92 | samma | ✅ |
| `251f0429` | 215 × 70 · 61–86 | **`Liegefläche: 185L x 70B`** | ✅ |
| `ed7a86fd` | **186 × 71 × 62–83** | ☠️ **`185L x 70B x 58-82H`** | konflikt |
| `2cfd373a` | 186 × 60 × 61–87 | samma | ✅ |
| `d7eca2ba` | 186 × 60 · 58–81 · 13 | 61–87 · 17 (syskonets text) | konflikt |

☠️ **Den viktigaste lärdomen är ett fel jag höll på att skriva in.** När bara
ritningarna var lästa såg TVÅ specar ut att vara fel, och en grind byggdes på
att ritningen vinner. Sedan lästes den tyska källtexten:

* `251f0429` anger **`Liegefläche: 185L x 70B cm`** ordagrant. De 185
  centimetrarna såg ut att vara min egen subtraktion (215 minus
  ansiktsstödet) — de är leverantörens egen uppgift. Grinden hade **strukit
  en riktig siffra** ur specen och gjort sidan sämre.
* `ed7a86fd` har en fullständig, produktspecifik `Technische Daten`-block:
  **`Gesamtmaße: 185L x 70B x 58-82H cm`**, `Faltbare Größe: 92,5L x 70B x
  18H cm`. Ingen slarvig avskrift — en ÄKTA konflikt mot ritningen.

**Regeln: läs primärkällan innan en avvikelse döms som ett fel.** Två
sekundärkällor som är eniga med varandra — ritningen och mina egna
Steg 1-anteckningar, som båda sa 71 — bevisar ingenting om vad leverantören
faktiskt skrivit.

### Vad som gäller vid konflikt

Skiljer texten och ritningen sig med **högst en centimeter** följer vi
texten. Skiljer de sig **materiellt** utelämnas talet, precis som runda 82
gjorde och som `d7eca2ba` redan gör här.

`ed7a86fd`:s höjd är **58–82 mot 62–83** — fyra centimeter i botten på det
mått en massagebänk faktiskt väljs på. Sidan anger därför **inget
höjdspann alls**. Det den anger är `Höjdlägen: 7`, som båda källorna är
eniga om (`7-stufig verstellbare Höhe`), och en vanlig fråga säger rakt ut
varför spannet saknas och länkar till träställsbänken, vars källor är eniga.

⚠️ **`Paketmått` skiljer sig med flit från `Hopfälld`.** Kartongen är större
än den hopfällda bänken (`a9555a7d`: hopfälld 91 × 60 × 16, kartong
93,5 × 18,5 × 62) och kommer från feedens egen kolumn. Ingen motsägelse —
läs inte de två som samma mått.

✅ **Grinden heter `MATTRADER` i `lint.py`** och låser varje måttrad vid exakt
sträng, med de omtvistade talen i `UTELAMNAT`. Mutationstestet står på
**23 av 23**.

## ☠️ Samma mekanism som runda 82 — texten är LÅNAD, ritningen är EGEN

`d7eca2ba` och `2cfd373a` har ordagrant identisk tysk text. Deras EGNA
måttritningar säger olika saker:

| | `2cfd373a` (vit) | `d7eca2ba` (svart) |
|---|---|---|
| ritningens höjd | 61–87 cm | ☠️ **58–81 cm** |
| ritningens hopfällda tjocklek | 17 cm | ☠️ **13 cm** |
| tyska texten på BÅDA | 61-87, 17 | 61-87, 17 |

Och renderingarna visar **två olika underreden** — `2cfd373a` har bredare
träpanel och annan kryssbandning än `d7eca2ba`. Det är alltså inte en
omfärgad render.

☠️ **Det här är andra rundan i rad med exakt samma fynd.** Runda 82:s
`2a16c507` hade ordagrant syskonets text och en egen ritning som sa något
annat. Mekanismen ser ut att vara: **leverantören kopierar den tyska texten
mellan färgsyskon men ritar måttritningen per produkt.**

⚠️ **Men rundan ändrar INTE regeln mitt i.** Runda 82 utelämnade det omtvistade
måttet; runda 83 gör likadant. `d7eca2ba` får ingen höjdrad och ingen rad för
hopfälld tjocklek, och sidans första vanliga fråga säger varför och hänvisar
till syskonet vars två källor är eniga. Att byta princip på ett fynd vore att
gissa; att skriva ned mekanismen låter huset besluta med underlag.

## ☠️ Maxlasten spänner 130 till 250 kg — och två av dem säger REKOMMENDERAD

| id8 | källans ord | tal |
|---|---|--:|
| `a9555a7d` · `754a4749` | `Maximale Belastung` | 250 kg |
| `a353ea02` · `5078bedf` · `251f0429` | `Belastbarkeit` | 225 kg |
| `2cfd373a` · `d7eca2ba` | ☠️ **`Maximal empfohlene Belastung`** | 150 kg |
| `ed7a86fd` | `Maximale Belastbarkeit` | **130 kg** |

**Kvalificeringen följer med.** De två som säger *rekommenderad* får
"rekommenderad maxlast", inte "maxlast" — på en möbel någon LIGGER på är det
inte en nyans.

⚠️ **`ed7a86fd` är familjens svagaste och ser starkast ut.** Den är den enda
med armstöd och handbrädor, alltså mest yta och mest "proffsig" — och bär
130 kg mot syskonens 225–250. Den skillnaden ska stå tidigt i texten, inte
gömd i spec-tabellen.

## Steg 2 — laglighetsgrinden för den här familjen

☠️ **En massagebänk är ingen medicinteknisk produkt.** Ingen text får antyda
behandling, lindring, rehabilitering eller effekt på besvär. Ordet *massage*
beskriver möbeln, aldrig ett resultat. Linten fäller på hela runda 81:s
`HALSA_RE` plus `behandl|terapi|rehab|lindr|smärt`.

⚠️ **Ingen norm är angiven.** Leverantören citerar ingen EN-standard och
ingen CE-märkning för någon av de åtta. Vi påstår därför ingen — talen är
leverantörens uppgift, och det ska framgå.

⚠️ **Ansiktsöppningen är en säkerhetsdetalj, inte en bekvämlighet.** Sex av
åtta har hål eller kudde för ansiktet. Den som ligger på mage med ansiktet i
ett hål ska kunna andas fritt; texten säger det rakt ut i villkorsblocket.

## Dubblettkontroll

**Noll krock.** De 28 publicerade massagesidorna är stolar, fåtöljer och
uppresningsfåtöljer — ingen bänk, inget bord. Sökordet `massagebänk` /
`massagebord` finns inte i katalogen.

⚠️ **Två utkast i samma sökträff är INTE bänkar och ska bedömas för sig:**
`013de4a2` (Rollenhocker, höjdjusterbar 72–87,5 cm) och `1a851435`
(Sattelstuhl med PU-läder). Båda är pallar och riskerar krocka med runda 79:s
publicerade rullpallar och med uppgift #300:s namnmönster-problem. De
poleras i en pallrunda, inte här.
