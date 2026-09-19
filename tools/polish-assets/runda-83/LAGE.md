# Runda 83 — läget

**Åtta mobila massagebänkar, publicerade och live-verifierade 2026-09-06.**

| id8 | slug | SKU | pris |
|---|---|---|--:|
| `a353ea02` | `massagebank-vit-3-zoner-aluminium` | `FP-massagebank-vit-3-zoner` | 1629 |
| `5078bedf` | `massagebank-svartrod-3-zoner` | `FP-massagebank-svartrod-3` | 1639 |
| `a9555a7d` | `massagebank-bok-creme-barvaska` | `FP-massagebank-bok-creme` | 1679 |
| `754a4749` | `massagebank-bok-svart-barvaska` | `FP-massagebank-bok-svart` | 1599 |
| `251f0429` | `massagebank-70-cm-trastall` | `FP-massagebank-70-cm` | 1629 |
| `ed7a86fd` | `massagebank-armstod-handbrador` | `FP-massagebank-armstod` | 1539 |
| `2cfd373a` | `massagebank-cremevit-2-zoner` | `FP-massagebank-cremevit-2` | 1499 |
| `d7eca2ba` | `massagebank-svart-2-zoner` | `FP-massagebank-svart-2` | 1449 |

Kategori: **Massage & Återhämtning** (`56520a1b`) + föräldern **Skönhet &
Hälsa** (`f6fac3c5`), två träffar per produkt, noll fel.

Grindarna: lint 0 fel, mutationstest **23/23**, åtta gröna `las`
(prisgrinden), åtta gröna `stampla`, live-grinden **ren på första passet** —
alla åtta 200 med `x-vercel-cache: MISS`, texten byte för byte lika facit,
och alla åtta korslänksmål 200.

---

## ☠️ Rundans dyraste lärdom: läs primärkällan innan en avvikelse döms

Mutationstestet visade att ingenting höll fast bäddens BREDD — en spec som
sa `Liggyta 185 × 81 cm` passerade linten, eftersom 81 cm står i produktens
egen spec som **totalbredd över armhyllorna**. Alla åtta måttritningar lästes
därför om, två specar såg fel ut, och en grind byggdes på att ritningen
vinner.

Sedan lästes den tyska källtexten. Den sa:

* `251f0429`: **`Liegefläche: 185L x 70B cm`**. De 185 centimetrarna som såg
  ut att vara en egen subtraktion är leverantörens uppgift. Grinden hade
  strukit en riktig siffra ur specen.
* `ed7a86fd`: **`Gesamtmaße: 185L x 70B x 58-82H cm`**, `Faltbare Größe:
  92,5L x 70B x 18H cm` — en fullständig, produktspecifik spec. Ingen
  slarvig avskrift; en ÄKTA konflikt mot ritningens 186 × 71 × 62–83.

**Två sekundärkällor som är eniga med varandra bevisar ingenting om
primärkällan.** Ritningen och Steg 1-anteckningarna sa båda 71; källan sa 70.

**Regeln som blev kvar:** skiljer text och ritning högst en centimeter följer
vi texten; skiljer de sig materiellt utelämnas talet. `ed7a86fd`:s höjd är
58–82 mot 62–83 — fyra centimeter i botten på det mått en bänk väljs på — och
står därför inte på sidan alls. Kvar står `Höjdlägen: 7`, som båda källorna
säger (`7-stufig verstellbare Höhe`).

## ☠️ En tyst dubbeldefinition slog ut en hel grind

`UTELAMNAT` var definierad **två gånger** i `lint.py`: rundans egen lista,
och en kvarglömd kopia från runda 82. Python behåller den sista, så
`d7eca2ba` hade **noll** skydd mot att de omtvistade talen smög tillbaka.
Linten var grön hela tiden. Mutationstestet hittade den.

## ⚠️ En återläsning DIREKT efter skrivningen kan ljuga åt FEL håll

Husets regel är att ett svar utan fel inte är något kvitto — därför läses
media tillbaka i ett separat anrop. Men den läsningen kan kapplöpa:
`2cfd373a` rapporterade **fem av sex bilder** och kortet på fel plats, medan
en ny läsning en stund senare visade alla sex, kortet på plats 3 och
`revision: 5`. Skrivningen var korrekt; kontrollen var för tidig.

**Läs om en gång innan ett misslyckande rapporteras.** En omskrivning på
falskt larm hade gett produkten sex nya uppladdningar utan orsak.

## ✅ Live-grindens ordlista självtestas nu

Runda 81 fällde åtta korrekta sidor för att `oxford` och `khaki` stod i den
tyska ordlistan medan vår egen text innehöll dem. `live.py` kör därför listan
mot rundans EGEN text och vägrar starta om något ord träffar. Familjen är
farligare än de flesta: `massage`, `aluminium`, `creme`, `arm` och `salon`
hade alla fällt oss.

## ⚠️ Kvar att avgöra

* `4106fc63` — barnset med parasoll, behöver egen EN 71-grind.
* `e4a986ad` — sminkstol.
* `bff8e42d` — massagekontorsstol; kräver runda 26:s massagegrind och en
  krockkontroll mot de 28 publicerade massagesidorna.
* `013de4a2` / `1a851435` — Rollenhocker och Sattelstuhl. Båda är PALLAR och
  riskerar krocka med runda 79:s publicerade rullpallar och med #300:s
  namnmönster. Poleras i en pallrunda, inte här.
