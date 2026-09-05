# Runda 62 — mappningsrader och prisgrind (Steg 3/4)

Lästa via workflowen "Polering — läs och stämpla mappningsraden", läge `las`.

| id8 | artikelnummer | landedCostSek | förväntat | faktiskt | grind | frakt­andel |
|---|---|--:|--:|--:|---|--:|
| 67bd3628 | 921-789V00LG | 984,43 | 1199 | 1199 | ✅ stämmer | 0,338 |

## ☠️ `sourceUrl` är en FJÄRDE källa — och den säger emot beskrivningen

Mappningens `sourceUrl` bär Aosoms egen produktadress, och slugen i den är
byggd av deras marknadstitel. För 67bd3628:

```
…/homcom-ergonomischer-kniesessel-mit-wippfunktion-und-verstellbar-
aus-leinenstoff-und-birkenholz-55x85x55-cm-hellgrau~…
```

Två saker som inte står i produkttexten:

1. **`birkenholz`.** Träslagsfrågan står därmed 2–1 för björk (säljpunkten och
   adressen mot Technische Datas `Buchenholz`). Men de två som säger björk
   härrör BÅDA ur marknadstiteln — adressen är inte ett oberoende vittne, den
   är samma text en gång till. Texten står kvar vid "formpressad plywood i
   ljust trä", som är sant oavsett vilket och är det bilden visar.

2. ☠️ **`verstellbar`.** Adressen påstår att modell D är justerbar. Det gör
   varken Technische Daten (inget justerintervall) eller bilderna (inget
   reglage, inga hål, ingen spärr). Steg 1-beslutet att inte påstå justerbarhet
   står alltså kvar — och är nu bättre grundat: påståendet finns, men bara i
   marknadsföringen, och det går inte att verifiera.

**Regeln: läs `sourceUrl` i Steg 3.** Den är gratis, den ligger redan i svaret,
och den bär leverantörens marknadstitel i en form som ofta säger MER än
produktbeskrivningen. Behandla den som marknadsföring, inte som specifikation —
den vinner aldrig över en måttritning eller ett strukturerat fält, men den
visar vad leverantören VILL påstå, och det är värt att veta innan man skriver.
