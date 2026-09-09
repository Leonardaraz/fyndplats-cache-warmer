# Runda 113 — åtta kylapparater i tre grupper

**✅ LIVE. 8 av 8 gröna i live-grinden.**

| nyckel | slug | grupp |
|---|---|---|
| `8cfe5171` | `minifrys-35-liter-lasbar-vit` | A — minifrys med nyckellås, 161 W, 135° |
| `a33ece7a` | `minifrys-35-liter-lasbar-gra` | A |
| `9a33e15f` | `minifrys-35-liter-silver` | B — minifrys, 45 W, 180° |
| `b2c76518` | `minifrys-35-liter-svart` | B |
| `47a91a17` | `vinkyl-12-flaskor-smal` | C — 26,5 cm bred, 8–18 °C, 37 dB |
| `15d30e23` | `vinkyl-16-flaskor-bankhojd` | C — 56,5 cm hög |
| `480849a7` | `vinkyl-18-flaskor-hog` | C — 34,5 × 78 cm |
| `fdbfcea0` | `vinkyl-20-flaskor-53-liter` | C — familjens flesta flaskor |

Grupp B är FÄRGSYSKON till den publicerade `minifrys-35-liter-vandbar-dorr`,
och korslänkas åt båda håll. Grupp A delar kabinettmått med den men är en
annan modell — korslänken därifrån säger uttryckligen VAD som skiljer.

## Steg 1 — svepet gick klart, och en dubblett föll

Förra rundans svep läste samma sida trettio gånger. Det här gick klart:
**3 134 utkast / 32 sidor** och **2 446 publicerade / 25 sidor**, båda med
`cursor === null` OCH unika id == radantal.

☠️ **`da0e9379` är BEVISAD dubblett** av den publicerade
`minifrys-35-liter-vandbar-dorr`: `abs(gray(a)-gray(b)).mean()` = **0,00**.
Den ligger utanför rundan och kräver ett ommappningsbeslut.

☠️ **Måttgrinden gav 3/3 på FYRA rader där bara EN var dubblett.** Alla fem
35 L-frysutkasten har exakt 47 × 44,2 × 48,8 cm, samma innermått, samma
−14…−24 ℃ och samma 15 kg. Kabinettet delas av TVÅ modeller, och skillnaden
syns bara i två fält och i pixlarna:

| modell | effekt | dörr | front | utkast |
|---|--:|--:|---|---|
| med lås | 161 W | 135° | nyckellås, ingen logga | `8cfe5171` `a33ece7a` |
| utan lås | 45 W | 180° | logga, inget lås | `9a33e15f` `b2c76518` (+ publicerade) |

Runbookens regel höll ordagrant: **en måttmatchning är ett SÅLL, inte en dom.**

## Steg 2 — ett lagkrav och två obrukbara fält

☠️ **(EU) 2019/2016 kräver energiklassen OCH skalan i varje visuell annons för
en specifik modell, internet inräknat.** Det gäller vinkylar också. Alla åtta
sidorna skriver ut den, och både text- och live-grinden fäller om den saknas.

☠️ **Två fält utelämnas hellre än gissas.** `47a91a17` anger `60 Hz` där
familjens sju andra säger 50; `fdbfcea0` anger `R600` där de säger `R600a`.
Båda är sannolikt databladsfel — men "sannolikt" är ingen källa, och att skriva
det troliga vore att hitta på. Grindarna fäller om de smyger tillbaka.

☠️ **`480849a7` heter "leise" hos leverantören och är familjens HÖGSTA.**
Ordet "tyst" står inte på någon av de fyra sidorna; dB-talet får tala.

## Steg 4 — nitton av fyrtio bilder bar text i pixlarna

Högsta andelen någon runda mätt. 26 behålls, 14 tas bort, 3 beskärs, 1 övermålas.

☠️ **TVÅ av dem var EU-energietiketten med AOSOMS ARTIKELNUMMER tryckt på sig:**
`b2c76518` bild 5 (`800-127V90BK`) och `480849a7` bild 5 (`800-196V90BK`).
Båda är ute ur galleriet.

⚠️ **Och det är en äkta målkonflikt, inte bara ett misstag.** Bilaga VII kräver
att etiketten VISAS vid distansförsäljning, och modellidentifieraren är en
obligatorisk del av den. Regeln säger "visa numret", husregeln säger "publicera
det aldrig". Det som gjordes är det säkra: bilden bort, det reglerade
innehållet i texten. **Etikettfil + EPREL-nummer är en fråga till Aosom, och
den ligger hos Leonard.**

✅ **Men etiketterna LÄSTES innan de plockades bort**, och gav två tal som inte
fanns någon annanstans: **148 kWh/annum** för `b2c76518`, och **43 dB** för
`480849a7` — där spec-blocket och marknadsbilden båda säger 41. Tre källor från
samma leverantör, två tal; etiketten vinner.

## Vad grindarna fällde — mig, inte katalogen

**Textgrinden, fem fel i mitt eget utkast:** `Leverantören anger …` på fem
ställen (mot kunden är VI leverantören), `750 ml` ogrundat, två UTRÄKNADE tal
utan egen källa (`7,5 cm högre`, `nio centimeter mindre golvyta`) — och
grindens EGEN bugg: energiklassen är versal och jämfördes mot gemener, så den
fällde åtta sidor som uppfyllde kravet.

☠️ **Och den fällde fyra KORREKTA sidor** innan löftesgrindarna gjordes
negationsmedvetna: `blir aldrig helt ljudlös` och `behöver du två zoner, och
det har den här inte` är motsatsen till löften. Regeln är språklig, inte en
lista över formuleringar vi råkat skriva — och den provas åt båda hållen.

**Kortbygget:** `15d30e23`:s råbild har botten **249, inte 255**. Panelen fylls
med vitt och kortet är vitt, så produkten blev en grå ruta med hård kant. En
fyllning från hörnen genom sammanhängande bakgrund löser det utan att platta ut
vita dörrars högdagrar — fyra av åtta produkter ÄR vita eller silverfärgade.

## Steg 14 — live-verdiktet

```
självtest: 7 fall, 0 fel
OK  minifrys-35-liter-lasbar-vit    159840 tecken  cache=HIT age=20
OK  minifrys-35-liter-lasbar-gra    159920 tecken  cache=HIT age=20
OK  minifrys-35-liter-silver        151367 tecken  cache=HIT age=23
OK  minifrys-35-liter-svart         152987 tecken  cache=HIT age=40
OK  vinkyl-12-flaskor-smal          145016 tecken  cache=HIT age=263
OK  vinkyl-16-flaskor-bankhojd      153406 tecken  cache=HIT age=115
OK  vinkyl-18-flaskor-hog           153390 tecken  cache=HIT age=137
OK  vinkyl-20-flaskor-53-liter      153081 tecken  cache=HIT age=166

8 av 8 sidor gröna
```

## Öppet efter rundan

1. **Etikettfilerna och EPREL-numren från Aosom** — Leonards beslut.
2. **`da0e9379`** — bevisad dubblett, behöver ett ommappningsbeslut.
3. **Familjen har tio utkast kvar**: fyra kosmetikkylar (två färgpar), två
   minikylskåp (44 L, 91 L), två passiva kylboxar (42,6 L, 70 L), kylvagnen
   `397b845e` och `e6d2e70b`. Alla mätta som unika mot de publicerade.
4. **Svep som saknas:** hur många REDAN PUBLICERADE sidor bär en energietikett
   med artikelnummer som bild? Det är en bildmätning, inte en textmätning —
   leverantörssvepet på 408 sidors HTML kunde inte se det.
