# Runda 137 — Steg 14: live-grind av de åtta publicerade sidorna

```
grind.sjalvtest():     31 fall, 0 fel
grindar._sjalvtest():  75 fall, 0 fel
kontrollsida klostrad-200-cm-sex-nivaer   0 träffar som är BUTIKENS

c7bd00b9  klostrad-takspant-ek        HIT   0 fel
a73a1a1c  klostrad-takspant-gratt     HIT   0 fel
f5f71f5d  klostrad-90-cm-cremevit     HIT   0 fel
dd3b541b  klostrad-90-cm-gratt        HIT   0 fel
f489937f  klospelare-91-morkgra       HIT   0 fel
5616c567  klospelare-91-ljusbrun      HIT   0 fel
1ae60dbc  kattrappa-66-cm-beige       HIT   0 fel
819bf51c  kattrappa-66-cm-ljusgra     HIT   0 fel

SUMMA: 8 sidor, 0 fel
```

## ☠️ Men det första svepet gav 112 fel — och min första diagnos var fel

Grindens egen historia den här rundan är fyndet, inte sidorna. Tre mätningar
i ordning:

| svep | fel | vad som ändrades |
|---|--:|---|
| 1 | **112** | — |
| 2 | **102** | live-underlaget lagat (`livetext`) |
| 3 | **0** | reglerna delade (`ENDAST_KALLTEXT` + homoglyfgrinden) |

### Kontrollen som avgjorde att det var grinden, inte sidorna

Runda 136:s live-grind kördes **samma dag, samma butik, samma familj** och gav
`8 sidor, 0 fel`. Utan den hade de 112 lika gärna kunnat vara åtta trasiga
sidor — och den rimliga första åtgärden hade varit att skriva om texterna.

### ☠️ Orsak 1: underlaget — och det förklarade bara TIO av de 112

Runda 137:s live-gren läste hela den tvättade sidan genom `strak_grannar`.
Runda 136 läser sidans EGNA meningar genom `egna_meningar`. Det såg ut som hela
förklaringen. Det var det inte, och skillnaden är mätt på en verklig sida:

| underlag | tecken |
|---|--:|
| `strak_grannar` över hela sidan | 4 552 |
| `egna_meningar` (nu `G.livetext`) | 4 482 |

**Sjuttio tecken skiljer dem, och de är GRANNENS NAMN.** Allt annat står kvar i
båda — prisblocket `879 kr`, sidfotens telefonnummer, `🚚` i sidrubriken, `→` i
rekommendationskorten, `⤢` på zoomknappen. Inget av det ligger i en
PRODUKTLÄNK, så `dela_pa_ankare` kan inte flytta det till `kors`.

⚠️ **Jag skrev först hela svepet på den här orsaken.** Det var en slutsats dragen
ur en kodläsning (två live-grenar som ser olika ut) i stället för ur en mätning.
Rättat innan det committades, men kommentaren hann skrivas — och hade den blivit
kvar hade nästa runda bytt underlag, sett 102 kvarvarande fel och trott att
grinden var trasig på ett tredje sätt.

### ☠️ Orsak 2: reglerna — 102 av 112

Tre grindar kördes i live-läget som bara får läsa källtexten. Alla tre träffar
butikens EGET chrome på varje korrekt publicerad sida:

| grind | vad den träffade |
|---|---|
| PRIS I BRÖDTEXTEN | prisblocket och sidfotsraden `… Vanliga frågor 879 kr` |
| LEVERANSLÖFTE | butikens `Beräknad leverans 3–7 arbetsdagar` |
| OSYNLIGT TECKEN | `🚚 · ⤢ →` — ~15 träffar per sida |

Det är butikens verkliga erbjudande, skrivet av Leonard i mallen — inte ett
fabricerat löfte (uppgift #423). Runda 136 hade delningen; runda 137 hade tappat
den.

**Källgrinden biter fortfarande — verifierat genom mutation, inte antaget.**
Ett inskjutet `Den kostar 879 kr.` ger 2 fel, `Levereras inom 3 dagar.` ger 1.

### ☠️ Kontrollsidans subtraktion täckte INTE upp

`kontrollfynd` hittade **0 träffar som är butikens** — under alla tre svepen.
Den går på EXAKT STRÄNG, och varje träffs utdrag bär VÅR produkts namn
(`… Vanliga frågor 839 kr Kattrappa 66 cm i beige – fyr`). Samma chrome ger
alltså olika strängar på olika sidor och subtraheras aldrig. Skyddet finns, det
räknar noll, och det ser ut att fungera.

## Vad som byggdes så att det inte kan hända igen

1. **`grindar.livetext()`** äger kompositionen och står i `ADE_FUNKTIONER`.
   Dess docstring namnger den KÄNDA GRÄNSEN — att chromet står kvar — så nästa
   runda inte tror att ett bytt underlag räcker.
2. **`grindar.egen_livekomposition()` + `livetextsvep()`** fäller en runda från
   137 som bygger sitt eget live-underlag. Det är grinden `tvillingsvep` inte
   kunde vara: den fäller den som DEFINIERAR om ett ägt namn, och runda 137
   definierade ingenting — den lånade `strak_grannar` och `strip_taggar`, båda
   delade och båda rätt, och komponerade dem fel.
3. **Rundans `sjalvtest` läser BÅDA reglistorna.** Första utkastet läste bara
   `FORBJUDET`, och i samma sekund prisregeln flyttade till `ENDAST_KALLTEXT`
   släppte två självtestfall igenom. Ett självtest som inte följer med sin egen
   regel är tvillingen i miniatyr.
4. **Självtestets egen vakt fällde två av mina nya fall** — ett förväntat värde
   som inte är `bool` kan aldrig fälla. Den hade rätt.

**Regeln, och den är ny:** två rätta delar kan bli en fel helhet, och en grind
som vaktar delarna ser det inte. Den gamla, som gäller igen: ☠️ **en tvilling
glider isär** — och ⚠️ **en kodläsning är ingen mätning.**
