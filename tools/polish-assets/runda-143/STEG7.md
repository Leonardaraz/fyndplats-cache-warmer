# Runda 143 — Steg 7: texten skriven, och grinden som var trasig innan texten var det

Åtta fel mätta. **Fem satt i GRINDEN, tre i TEXTEN** — och grindfelen var
de som maskerade textfelen: 58 av 65 utfall var falska, alltså hade en snabb
läsning av första körningen sagt "grinden fäller allt, hoppa över den".

## Grindens fem fel

| # | fel | utfall innan |
|---|---|---|
| 1 | `G.meningar()` ger TUPLER, inte strängar | `TypeError` — grinden kraschade |
| 2 | `G.flikfel()` anropad OFFLINE | **51 falska fel** på 17 korrekta sidor |
| 3 | `FORBJUDET_TAL` packades upp BAKVÄNT | två rundspecifika regler körde på förklaringstexten som regex |
| 4 | `G.TREKONSONANT(text)` — objektet är inte anropbart | `TypeError` (lagat i Steg 5) |
| 5 | `SORTIMENTSSUPERLATIV` saknades HELT | **två** riktiga fel passerade |

### ☠️ 2 är den dyra: `flikfel` är en LIVE-grind

`G.flikfel()` letar efter `<summary>`. Butiken skapar dem vid RENDERING; vår
källtext bär `<h2>`. Anropad på källtexten fäller den alltså varje korrekt sida —
tre fel per produkt, 51 totalt, och rundans tre ÄKTA textfel låg begravda i dem.

Runda 134 och 139 har båda skrivit ned exakt det här, ordagrant i sina egna
grindar ("FLIKGRINDEN ÄR EN LIVE-GRIND"). Runda 143 gick i fällan ändå. Att
lärdomen står i en KOMMENTAR i en tidigare rundas fil räcker inte — den måste
stå i koden som körs, och det är därför offline-grenen nu kontrollerar `<h2>`
i stället: exakt en förekomst per rubrik, och i allowlistens ORDNING.

### ☠️ 5: regeln bor nu i den delade modulen, och fångade direkt

Runda 141 bar `\bi\s+sortimentet\b` i sin EGNA `FORBJUDET`-lista. Runda 142 bar
en egen `_superlativ()` som mätte påståendet mot familjens facit. Runda 143 bar
**ingendera** — samma tvillingdrift som `SHIP_AXIS_RE` och `EU_TULL_CODES`.

`grindar.SORTIMENTSSUPERLATIV` finns nu, med sex självtestfall, och rundan ÄRVER
den i stället för att skriva en tredje variant. Den fyrade omedelbart på två
produkter:

| produkt | vad som stod |
|---|---|
| `6f603856` | "bär en säck på upp till 120 kg — **den tyngsta bärigheten i sortimentet**" |
| `702c7795` | "**Den tyngsta fristående säcken i sortimentet**: 180 cm hög…" |

Talen är RÄTT. Det som inte går att belägga är **jämförelsen**: familjens femton
publicerade syskon har aldrig mätts, och katalogen växer varje runda — alltså
åldras påståendet även om det vore sant idag. Båda meningarna står kvar med sina
tal, utan ramen. Samma defektklass som #533 (fem inramade seriesuperlativ, fyra
falska).

Regeln fäller INRAMNINGEN, inte superlativet: "det kraftigaste stålet sitter i
foten" är ett påstående om VARAN och går fritt. Självtestet låser båda
riktningarna.

## Textens tre fel

1. ☠️ **`<h2>☠️ Underlaget avgör, inte fästet</h2>`** på `b6c4c619` — rubriken
   skrevs som den står i mina egna anteckningar, med runbooknotationen kvar.
   Två grindregler fyrade oberoende (RUNBOOKNOTATION och HOMOGLYF), vilket är
   som det ska: en notationssymbol är också en icke-svensk glyf.
2. **`Bär 120 kg.` / `Bär 100 kg.`** i META på `6f603856` och `c00988e3` —
   brödtexten säger korrekt "bär en säck på upp till 120 kg", metan tappade
   ordet `säck` för att få plats. Exakt #548: talet är SÄCKENS vikt, och utan
   ordet läses det som en användarvikt. Båda metabeskrivningarna bär nu ordet.
3. ⚠️ **`Fungerar sugpropparna på alla golv?`** på `1409d762` — en FAQ-FRÅGA
   vars svar är "Nej." i nästa mening. Grinden har rätt att inte läsa två
   meningar som en (#415 är samma familj åt andra hållet: en negation i en
   ANNAN fråga godkände fel text). Frågan är omskriven som en ÖPPEN fråga —
   "Vilka golv fungerar sugpropparna på?" — och svaret är ordagrant detsamma.
   **Grinden försvagades inte.**

## Utfall

```
grindar._sjalvtest(): 84 fall, 0 fel     (78 + rundans sex nya)
runda-143/grind.py:   SJÄLVTEST GRÖNT (12 fall) · TEXTGRIND GRÖN
runda-143/texter.py:  GRIND GRÖN (17 namn, slug, SKU, titel, meta, sökord)
```

**Regeln, en gång till: en grind som fäller allt är inte en sträng grind — den
är en trasig grind, och den döljer exakt de fel den finns för att hitta.**
