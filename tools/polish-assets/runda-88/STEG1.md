# Runda 88 — Steg 1: sparkcyklar för barn (Kinderroller)

## Familjevalet är MÄTT, inte känt

Hela katalogen svept i två halvor (56 sidor à 100): **3 372 tyska utkast,
2 155 publicerade, 919 olika huvudord.** Utkasten räknade per HUVUDORD enligt
runbokens regel — Aosoms titlar sätter alltid produkttypen först.

De sex största familjerna mot vad som redan är publicerat av samma typ:

| familj | utkast | publicerade | kvot |
|---|--:|--:|--:|
| **Kinderroller (sparkcykel)** | **24** | **4** | **6:1** |
| Ersatzdach | 15 | 1 | 15:1 |
| sittbank | 40 | 16 | 2,5:1 |
| växthus + foliengewächshaus | 63 | 27 | 2,3:1 |
| odlingslåda (Hochbeet) | 29 | 18 | 1,6:1 |
| trampolin | 1 | 9 | klar |

`Ersatzdach` har bättre kvot men valdes bort: ett reservtak måste matchas mot
den paviljong det passar, och ett tak som inte passar något vi säljer är en
sämre sida än ingen sida.

## ☠️ Ett halvt svep är en smal regex i annan förklädnad

Rundans första mätning tittade bara på katalogens första 28 sidor och hittade
**ETT** publicerat campingtält. Hela svepet visar **TOLV**, inklusive en hel
Naturehike-serie (`naturehike-star-river-ul-tvamanstalt`,
`naturehike-cloud-up-pro-kupoltalt`, `naturehike-mongar-pro-vandringstalt` …).

Det är runda 87:s lärdom en gång till, i ny form: en smal familjeregex svarar
"jag tittade inte där". **Ett halvt katalogsvep svarar exakt samma sak** — och
resultatet ser precis lika komplett ut. Campingtälten är därför en
DUBBLETTAUDIT, inte en poleringsrunda, och `88fa29aa Tunnelzelt 4 Personen
Familienzelt mit Schlaf- und Wohnzimmer` är med största sannolikhet samma
produkt som den publicerade `tunneltalt-4-personer-530-cm-vardagsrum-takfonster`.

**Kräv `avhuggen: false` på svepet, alltid.**

## Nio modeller i 24 utkast — grupperade på BRÖDTEXTEN

Runda 59:s regel: vikt och paketmått bevisar inte två produkter, den tyska
brödtexten gör det. Varje modell har en egen inledande mening som återkommer
ordagrant hos sina färgsyskon.

| modell | inledning (tyska) | utkast | pris |
|---|---|---|---|
| **A** | *"Ein Tretroller für die ganze Familie… eignet sich für eine kurze"* | `b1dcd424` `41269686` `82b5a517` | 1 039 / 1 059 / 1 099 |
| **A2** | samma inledning + *"Denn für's schnellere Vorankommen zum Bäcker"* (Luftreifen) | `c4375606` `79186373` | 1 379 / 1 439 |
| **B** | *"Erleben Sie… spannende Outdoor-Abenteuer! Für 6-12-Jährige (100-150 cm)"* | `e9cfa7bf` `2b8297df` `9941383e` | 1 059 / 1 139 / 1 159 |
| **C** | *"Für Kinder von 5 bis 12 Jahren konzipiert, wächst dieser Roller mit"* | `9518db1e` `473084eb` `85be4535` | 1 099 / 1 149 / 1 159 |
| **D** | *"ist das ideale Geschenk für Kinder ab 5 Jahren. Höhenverstellbar"* | `479e9c2e` `d9239c8e` | 1 129 / 1 249 |
| **E** | *"bietet Fahrspaß auf höchsten Niveau! Aufblasbare Reifen… Doppelbremssystem"* | `369b4b2c` `feac1d03` `c851d101` `1b1d4842` | 1 169–1 249 |
| **F** | *"Probieren Sie unseren Kickroller an, damit Sie mehr Zeit draußen"* | `4fd26086` `89deaca7` | 1 179 / 1 229 |
| **G** | *"…im Freien hilft nicht nur sich zu bewegen… ausgeglichen zu bleiben"* | `aef9a8d9` `5129f6b0` | 1 199 / 1 269 |
| **H** | *"Fahrspaß für die ganze Familie… Kinder, Jugendliche und Eltern"* (16/12 Zoll) | `ea013fde` | 1 299 |
| **I** | *"ist nicht nur ein Blickfang… doppeltes Bremssystem"* + korg | `e4e5a8ef` `b03784dc` | 1 329 / 1 459 |

## ☠️ Tre publicerade sidor är troliga syskon till utkast

| publicerad | pris | trolig modell |
|---|--:|---|
| `a06e46b7 sparkcykel-barn-5-12-ar` — *"stora 12-tumshjul, broms och justerbart styre, blå"* | 1 229 | **C** |
| `bd3bdc1b sparkcykel-barn-luftdack-40-cm` — *"16 tum från 5 år, luftdäck, 2 bromsar"* | 1 079 | **E** eller **A2** |
| `4080448d sparkcykel-barn-rosa-16-tum-luftdack` — *"16 tum fram och 12 tum bak"* | 1 469 | **H** (`ea013fde`, 16/12 Zoll) |

De två trehjuliga (`d3cf8ebc` 2–6 år, `ed5d6b85` 3-i-1 med sits) har inget
motsvarande utkast — alla 24 utkast är tvåhjuliga för 5–12 år.

**Rundans åtta väljs därför ur modeller UTAN publicerat syskon:** A (3), B (3)
och I (2). Modell C, E och H hålls tillbaka till en runda som poleras MOT den
publicerade syskonsidans text, som runda 69 och 74 gjorde.

## ⚠️ `[BRAND NAME]` lämnade ett hål i grammatiken, inte bara ett tomrum

Sex utkast börjar *"Dieser Tretroller **von** bietet…"* — platshållaren är
struken vid importen (rätt) men prepositionen står kvar och pekar på ingenting.
Det spelar ingen roll för oss, eftersom hela texten skrivs om, men det är ett
kvitto på att strykningen är mekanisk och inte språklig.
