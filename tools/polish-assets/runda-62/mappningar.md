# Runda 62 — mappningsrader och prisgrind (Steg 3/4)

Lästa via workflowen "Polering — läs och stämpla mappningsraden", läge `las`.

| id8 | artikelnummer | landedCostSek | förväntat | faktiskt | grind | frakt­andel |
|---|---|--:|--:|--:|---|--:|
| 67bd3628 | 921-789V00**LG** | 984,43 | 1199 | 1199 | ✅ | 0,338 |
| b97ac1d8 | 921-789V00**GY** | 860,58 | 1039 | 1039 | ✅ | 0,386 |
| b5d8eb9c | 921-789V00**CW** | 797,69 | 959 | 959 | ✅ | 0,417 |
| 6d64de9b | 921-589V00**CW** | 949,33 | 1149 | 1149 | ✅ | 0,338 |
| 9d626528 | 921-589V00**CG** | 737,32 | 899 | 899 | ✅ | 0,451 |
| c3e0af3f | 921-589V00**BU** | 805,98 | 969 | 969 | ✅ | 0,412 |
| 05cc1f9c | 921-589V00**BK** | 867,72 | 1049 | 1049 | ✅ | 0,383 |
| 9e656e81 | **921-589** | 783,83 | 949 | 949 | ✅ | 0,424 |

**Åtta av åtta prisgrindar gröna.** Ingen fraktandel över 0,5, så ingen behöver
skjutas till sist.

Baserna bekräftar modellindelningen mekaniskt: modell D är `921-789V00`, modell
G är `921-589V00`. Runda 61:s regel — basen är modellen, suffixet är färgen —
håller på båda familjerna.

☠️ **Suffixet `CG` avgör färgfrågan en tredje gång.** 9d626528 bär `…V00CG`,
alltså *charcoal grey*, medan spec-tabellen sa `Grau`. Pixlarna sa `#575956`.
Leverantörens eget artikelnummer, den tyska texten, alt-texten och mätningen
säger alla samma sak mot spec-tabellens ena röst.

⚠️ **Men artikelnumret är inte ALLTID bas + V00 + färg.** 9e656e81 bär `921-589`
rakt av — ingen `V00`, inget färgsuffix — medan dess fyra syskon bär hela
formen. Det såg först ut som en stympad rad, och en stympad rad hade varit
allvarlig: synken slår upp `supplierProductId` mot feeden, så en produkt vars
nummer inte matchar något skulle aldrig få lager eller pris uppdaterat, och
dubblettspärren hade släppt in en andra sida för samma vara.

**Det är det inte.** `aosomSyncedAt` står på 2026-09-02, fem dygn efter
importens `createdAt` — alltså HAR synken matchat raden mot en feedrad. Numret
är kort på riktigt: Aosom säljer både en basartikel och `V00`-suffixade
färgvarianter av samma modell.

**Regeln: en syskongrind får inte KRÄVA formen `bas + V00 + färg`.** Den missar
basartikeln, som är en fullvärdig syskon. Och kontrollera alltid `aosomSyncedAt`
mot `createdAt` innan ett kort nummer rapporteras som trasigt — skillnaden
mellan de två talen är kvittot på att feeden känner igen raden.

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
