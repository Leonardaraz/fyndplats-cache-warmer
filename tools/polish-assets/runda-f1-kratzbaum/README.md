# Runda F1 — klösträd (`^Kratzbaum`), Steg 1 gjord

⏸ **STEG 1 KLART, INGET SKRIVET.** Familjen är vald, mätt och grupperad. Inga
texter är skrivna och Wix är orört.

## Varför just den här familjen

Fåtöljbanan är slut för min del: `FORDELNING.md` (den andra sessionens gren)
ger **"Fåtöljresten" till runda 62–73-sessionen**, status *"pågår (runda 74)"*.
Det stod där sedan `072f212` kl 10:20 den 2026-09-06 — och att jag inte läste om
filen innan runda E3 är vad som orsakade kollisionen samma dag (#144).

`^Kratzbaum` nämns inte någonstans i fördelningen, ligger utanför hela
`Sessel`-rymden och har varken elsäkerhets- eller hälsopåståendegrind. Den är
dessutom den största rena familjen i utkastfloran efter `^Bürostuhl`.

☠️ **Jag kan inte skriva in mitt anspråk i `FORDELNING.md`** — filen ligger bara
på den andra sessionens gren. Det är precis problemet #144 beskriver. Anspråket
står därför här, och filen bör flyttas till `main` så båda arbetsträden ser den.

## Katalogmätningen (2026-09-06)

Läst i ETT svep: **5 502 produkter, `unika == lästa`, `avhuggen: false`** —
3 485 utkast, 2 017 publicerade.

⚠️ **Fördelningens histogram undermäter grovt** (bekräftar #134):

| familj | fördelningen sa | uppmätt |
|---|--:|--:|
| `^Bürostuhl` | 13 | **100** |
| `^Schaukelstuhl` | 13 | **35** |

Största utkastfamiljerna utanför fåtöljerna: `Bürostuhl` 100, `2er-Set` 66,
**`Kratzbaum` 40**, `Sitzbank` 40, `Gewächshaus` 36, `Schaukelstuhl` 35.

## Läget: 40 utkast mot 28 redan publicerade klösträd

Batch 34 polerade sju klösträd; totalt ligger **28 publicerade** sidor ute,
519–2 099 kr. Dubblettgrinden i Steg 1 ska mäta mot dem, inte mot namnen.

## ☠️ Fyra kluster: tio utkast är fem produkter

Grupperat på **vikt + paketmått**, inte på namn. Husets egen regel: två olika
möbler kan råka dela ett yttermått, men inte vikten på hektogrammet OCH
kartongens tre sidor.

| fingeravtryck | antal | id | prisspann |
|---|--:|---|--:|
| 8,8 kg / 58 × 29 × 28 cm | **3** | `75391d11` 899 · `8db487c1` 839 · `6f0b43f0` 799 | **100 kr** |
| 8,6 kg / 43,5 × 36 × 28 cm | **3** | `62f7cf98` 899 · `75293096` 849 · `8ab169e8` 839 | **60 kr** |
| 11 kg / 64 × 41 × 36 cm | 2 | `c802ac19` 1099 · `cc31a73b` 1079 | 20 kr |
| 7 kg / 48 × 23 × 52 cm | 2 | `f489937f` 859 · `5616c567` 819 | 40 kr |

**10 av 40 ligger i ett kluster; 30 är unika på fingeravtrycket.**

Namnen döljer det: de tre i första klustret heter alla *"Kratzbaum Deckenhoch
höhenverstellbar, stabiler Katzenbaum mit"* — men det gör även `75293096` och
`8ab169e8`, som ligger i ETT ANNAT kluster. **Namnet grupperar fel åt båda
hållen.** Samma fynd som runda 70 och 72, och som E3:s manchesterfåtöljer.

⚠️ Om klustren är färgsyskon (troligast, samma mönster som E3) ska de poleras i
samma runda och slugga in i en gemensam familj — annars blir "finns i fler
färger" ofullständig på varje sida som publiceras först. Det är INTE bevisat
ännu: färg är omätt, och feedens färgetikett är enligt E3 fel i 4 fall av 10.
**Mät på pixlar innan rundan låses.**

## ☠️ Dubblettmätningen gick INTE att köra — och det är fyndet

Resultatet blev `kollisioner: []`. **Det betyder inte "inga dubbletter".** Det
betyder att jämförelsen inte kunde göras:

| | |
|---|--:|
| Utkast med läsbart trippelmått | **5 av 40** |
| Publicerade med läsbart trippelmått | **4 av 28** |

Skälet är att **varje poleringsrunda har hittat på sin egen spec-etikett**.
Alla 40 utkast bär `Mått` — importens fem svenska etiketter är fasta. De 28
publicerade bär sex olika ord för samma sak, vart och ett på exakt EN sida:

```
Yttermått · Totalmått · Totala mått · Mått totalt · Basmått · Basens mått
```

Och `Vikt` finns på 7 av 28, `Paketmått` på **1 av 28** — trots att båda är
importens egna etiketter och står på alla utkast. Poleringen har alltså
konsekvent kastat bort det bästa dubblett-fingeravtrycket huset har.

☠️ **Följden: dubblettdetektering mellan rundor är mekaniskt omöjlig.**
Runbookens egen regel säger att vikt plus kartongens tre sidor är det som
skiljer två möbler åt — men den uppgiften finns inte på sidorna. Varje
framtida dubblettkoll måste läsas för hand, precis som den här.

Det är samma klass som `SHIP_AXIS_RE` och `EU_TULL_CODES`: **en uppgift utan
en enda definition glider isär.** Här har den glidit isär i sex riktningar.

⚠️ Mina egna rundor (D, E) skriver konsekvent `Mått (B × D × H)`, `Vikt` och
`Paketmått`. Klösträden är äldre rundor. Se #146.

## Kvar att göra

1. ~~Dubblettmätning mot de 28 publicerade~~ — **går inte** förrän spec-orden
   är enhetliga, se ovan. Måste läsas för hand för den här rundan.
2. Färgmätning på klustrens bild 1 (pixlar, inte etiketter).
3. Välj åtta, med hela kluster hållna ihop.
4. Saldokoll i Wix FÖRE texten — E2:s lärdom, kostar ett anrop för hela rundan.
5. Prisgrind ×8 genom workflowen.
6. Texter → filgrind → checksumma → alt-texter → SKU → publicera → stämpla →
   live-grind.
