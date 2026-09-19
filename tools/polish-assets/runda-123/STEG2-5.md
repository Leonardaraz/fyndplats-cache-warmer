# Runda 123 Steg 2–5 — nio öppna verktygsvagnar

## Steg 3: mappningsraden, nio av nio

| id | pris | prisgrind | saldo | EU-lager | fraktandel | SKU idag |
|---|--:|---|--:|:--:|--:|---|
| `887d388d` | 819 | ✅ stämmer | 30 | ja | 0,489 | `FP-werkzeugwagen-mit-3` |
| `7be028f5` | 829 | ✅ | 165 | ja | 0,483 | `FP-werkzeugwagen-mit-3` |
| `46a5eeda` | 929 | ✅ | **0** | ja | 0,477 | `FP-werkzeugwagen` |
| `c8105590` | 939 | ✅ | 184 | ja | 0,417 | `FP-werkstattwagen-mit-3` |
| `df9475dc` | 969 | ✅ | 90 | ja | 0,457 | `FP-3-stufiger-werkzeugwagen` |
| `4e0a06c0` | 999 | ✅ | 73 | ja | 0,442 | `FP-werkstattwagen-2-etagen` |
| `db2f05f9` | 1 119 | ✅ | **0** | ja | 0,47 | `FP-werkzeugwagen-2-stockige` |
| `2bf00891` | 1 199 | ✅ | 162 | ja | 0,335 | `FP-werkzeug-trolley` |
| `12cb8a2c` | 1 279 | ✅ | 74 | ja | 0,408 | `FP-werkzeugwagen-mit` |

**9 av 9 gröna prisgrindar.** Ingen fraktandel över 0,5. Ingen produkt rörs
prismässigt.

⚠️ **Två är SLUTSÅLDA hos Aosom** — `46a5eeda` och `db2f05f9`, båda med
`aosomSyncedAt` den 2 september, alltså åtta dygn utan att raden kommit
tillbaka i feeden. Enligt husregeln är en försvunnen rad ett LAGERBESKED, inte
en utgången produkt: de poleras färdigt men **publiceras inte**, precis som
runda 122 gjorde med `832f9eec`.

## Steg 2: laglighetsgrind — ingen spärr, en grind som binder

Öppna verkstadsvagnar är varken elprodukt, leksak, djurbostad eller
livsmedelsnära. Ingen LVD, ingen EN 71, ingen SJVFS, inget bygglov.

**Det som binder är maxlasten.** Ett lasttal på en sida är en instruktion
kunden följer med händerna. Runda 121 och 122 satte regeln: står talet inte
att lita på skrivs det inte alls. Här är läget bättre — se Steg 5 — men en
produkt faller ändå.

Två bruksbesked hör hemma på varje sida, och de är inte juridik utan
användning: **lås de bromsade hjulen innan du lastar**, och **lägg det tyngsta
längst ner**. En hög smal vagn på hjul tippar annars, och `46a5eeda` är
familjens smalaste i förhållande till sin höjd.

## Steg 4: 45 bilder granskade — noll tysk text, noll logotyp

| kontroll | utfall |
|---|---|
| tysk text inbränd i pixlarna (position 3, 4, 5) | **0 av 27** |
| leverantörslogotyp i övre vänstra hörnet (uppgift #282) | **0 av 9** |
| overlay-banderoller, vattenstämplar | 0 |
| byte-identiska bilder mellan produkter | 0 |

Position 3 är **måttritningen på alla nio** — rena siffror, inga ord utom
`KG`. Position 4 och 5 är livsstilsbilder utan pålagd text.

☠️ **Två fysiska etiketter, och de rörs inte.** `df9475dc` och `4e0a06c0` bär
en liten vit dekal på en stolpe. Uppförstorad är texten oläslig och märket
bara ett rött streck. Leonards regel gäller: *"om märket sitter fysiskt på
varan så gör vi inget åt det, det är så produkten ser ut."*

⚠️ **En nedladdning som "lyckades" var 63 byte.** `curl` gav exit 0 och skrev
kroppen `bad file: media/…` som en `.jpg`. Filen fanns, kommandot var grönt,
och bilden gick inte att öppna. Hämtningen har nu ett storleksassert och tre
försök — **kontrollera filen, inte exitkoden.** Nionde gången samma familj: ett
svar utan fel är inget kvitto.

## Steg 5: tre källor, inte två — och sju fynd

Uppgift #447 kräver tre källor. De är: feedens **svenska spec-block**, den
**tyska brödtexten**, och leverantörens egen **måttritning** (bild 3).

**Måtten stämmer på nio av nio** mellan alla tre. Sju av nio ritningar trycker
dessutom lasttalet, och det stämmer mot spec-blocket varje gång.

### 1. ☠️ `c8105590` bär ett RÅ JSON-OMSLAG i kundtexten

Utkastets beskrivning börjar ordagrant så här:

```
{ "Long Description": { "Sind Sie es leid, ständig nach Werkzeugen zu suchen? …" }}
```

Nyckelnamn, klammer och citattecken har följt med hela vägen in i produkten.
Samma stycke stoppar dessutom in `bei diesem montagewagen`, `bei diesem
etagenwagen` och `an diesem servicewagen` mitt i meningarna — gemena tyska
substantiv inskjutna som sökord. Ingetdera överlever översättningen, men det
säger något om källan: **texten är maskinhopsatt, inte skriven.**

### 2. `df9475dc` bär en tom märkesplats

`"Entdecken Sie die optimale Werkzeugaufbewahrung von :"` — `[BRAND NAME]`
ströks vid importen och lämnade ett hängande `von :`. Mekaniskt, skrivs om.

### 3. ☠️ `2bf00891` — spec-blocket säger RÖD, bilden säger NEJ

| källa | färg |
|---|---|
| tyska specen | `Schwarz+Rot` |
| svenska spec-blocket | `Schwarz` |
| **bilderna** | **svart plast på blank stålstolpe — noll rött på varan** |

Mätt, inte tittat: en röd-pixelsökning över alla fem bilderna ger **noll**
träffar på bild 1. Det röda i bild 2, 4 och 5 sitter i scenen — en orange
stege, en röd borrmaskin, en gul-svart lageretikett. **Bilden vinner.**

### 4. `7be028f5` — samma fråga åt andra hållet

Namnet och alt-texten säger bara `Schwarz`. Tyska specen säger `Schwarz+Rot`,
och bilden visar **röda stolpar**. Här är det NAMNET som är ofullständigt.
Sidan skrivs som svart och röd.

☠️ Det är samma fält, samma familj, samma dag — och facit ligger åt olika håll
i de två fallen. En regel av formen "specen vinner" eller "namnet vinner" hade
haft fel i ett av dem. **Bara bilden avgör.**

### 5. ☠️ `4e0a06c0` — två olika stålsorter för samma ram

| källa | material |
|---|---|
| tyska tekniska data | `Kaltgewalzter Stahl` (kallvalsat) |
| svenska spec-blocket | `Legierter Stahl` (legerat) |

Två olika påståenden om samma konstruktion, och bilden kan inte skilja dem åt.
Sidan skriver **`stål`** utan bestämning — det enda båda källorna är eniga om.

### 6. ☠️ `12cb8a2c` — svenska spec-blocket TAPPAR stålet

| källa | material |
|---|---|
| tyska tekniska data | `Stahl, Kunststoff` |
| tyska brödtexten | *"robusten Stahlrahmen"*, *"pulverbeschichtete Oberfläche"* |
| **svenska spec-blocket** | **`Kunststoff`** — bara plast |
| bilden | pulverlackerad stålvagn med stållåda och nyckel |

Tre källor mot en. Spec-blocket har fel; sidan skriver stål med pulverlackerad
yta. Det är inte en detalj: en låsbar låda i plast och en i stål är olika varor
för den som ska låsa in dyra verktyg.

### 7. `2bf00891` — hopfällt är 30 cm HÖGRE än utfällt

`Gesamtabmessungen 64 × 37 × 84 cm` mot `Gefaltete Abmessungen 39 × 18,5 ×
114 cm`. En vagn kan inte bli 30 cm högre av att fällas ihop.

Ritningen löser det: den hopfällda vagnen ligger **plant och står på högkant**,
så 114 är dess LÄNGD, inte en höjd. Paketmåttet `116 × 18 × 41 cm` bekräftar
det. Sidan skriver därför bara leverantörens eget rubriktal —
**"fälls ihop till 18,5 cm tjocklek"** — och påstår ingen höjd.

### 8. ☠️ `db2f05f9` — 227 kg på familjens enda plastvagn med två plan

| vagn | material | plan | angiven maxlast |
|---|---|--:|--:|
| `df9475dc` | stål | 3 | 150 kg |
| `4e0a06c0` | stål | 2 | 150 kg |
| `c8105590` | metall | 3 | 120 kg |
| `12cb8a2c` | stål | 3 | 90 kg |
| **`db2f05f9`** | **plast** | **2** | **227 kg** |

Talet står i både spec-blocket och ritningen, så ingenting **motsäger** det —
till skillnad från runda 122, där hinkvolymen fällde talet direkt. Men det är
familjens högsta lastvärde, det sitter på dess enda plastvagn med två plan, och
det ligger 51 % över de stålvagnar som väger lika mycket.

**Beslut: talet står inte på sidan.** Samma väg som runda 121 och 122. Frågan
går till Leonard: be Aosom bekräfta 227 kg innan siffran används. Produkten är
ändå slutsåld och publiceras inte den här rundan.

### Maxlast på de övriga åtta

| vagn | totalt | per plan | skrivs |
|---|--:|--:|---|
| `887d388d` | 91 kg | — | totalt |
| `7be028f5` | 68 kg | — | totalt |
| `46a5eeda` | 91 kg | — | totalt |
| `c8105590` | 120 kg | 40 kg | **båda** |
| `df9475dc` | 150 kg | 50 kg | **båda** |
| `4e0a06c0` | 150 kg | 75 kg | **båda** |
| `2bf00891` | 68 kg | — | totalt |
| `12cb8a2c` | 90 kg | 30 kg | **båda** |

Fyra vagnar ger både totalen och siffran per plan, och de multiplicerar ihop
sig exakt (3 × 40 = 120, 3 × 50 = 150, 2 × 75 = 150, 3 × 30 = 90). Där skrivs
båda, för det per-plan-talet är det kunden faktiskt kan följa. De fyra som bara
ger en total skrivs som **"totalt för hela vagnen"**, så ingen läser det som
per hyllplan.

## Dubblettgrinden mot den publicerade `5b27721d`

Uppgift #453 har redan bevisat att utkastet `a389ddaa` ÄR den publicerade
`verktygsvagn-3-hyllplan-halskiva`. `46a5eeda` liknar den på beskrivningen —
tre plan, hålskivor, krokar — och måste därför mätas, inte antas.

| | `5b27721d` (publicerad) | `46a5eeda` (utkast) |
|---|---|---|
| totalmått | **95 × 43 × 96 cm** | **56,5 × 47,5 × 89 cm** |
| hyllplan | 66 × 43 cm | 48 × 27 cm |
| maxlast | 130 kg, 40 per plan | 91 kg totalt |
| krokar | 8 | **10** |
| hink | ingår | ingår inte |

**38,5 cm i breddskillnad.** Inte samma vara. Sidan korslänkar dit i stället.
