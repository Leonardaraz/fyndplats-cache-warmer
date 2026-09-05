# Runda D2 — åtta bäddfåtöljer och en golvsoffa

Andra av tre rundor i familj D. Två färgfamiljer, ett färgsyskon till en
publicerad sida, och två egna produkter.

| id | slug | pris | familj |
|---|---|---:|---|
| `82798d95` | baddfatolj-manchester-90-cm-morkgra | 3 149 kr | F3 |
| `dd2f1769` | baddfatolj-manchester-90-cm-beige | 3 229 kr | F3 |
| `0f6ea98d` | baddfatolj-gastsang-180-cm-beige | 2 969 kr | F2 |
| `1663062d` | baddfatolj-gastsang-180-cm-bla | 2 829 kr | F2 |
| `8800a1b5` | baddfatolj-gastsang-180-cm-morkgra | 2 759 kr | F2 |
| `0761c9d0` | baddfatolj-sidofickor-183-cm | 2 659 kr | ensam |
| `0559bbb2` | baddfatolj-190-cm-beige | 2 619 kr | F4 |
| `3c81a3a6` | golvsoffa-2-sits-193-cm | 2 569 kr | ensam |

Inga priser rörda.

## ☠️ En nionde produkt togs UR rundan: `a6eb718c`

`a6eb718c` (2 499 kr) var planerad som F4:s andra medlem. Den är i stället
samma stol som den redan publicerade `baddfatolj-190-cm` (`667ca8f9`,
2 519 kr, mörkgrön):

- **Måttritningen** är identisk i varje tal: bädd 190 × 72 × 25, stol
  79 × 78 × 72, ryggkudde 41, sits 62, sitthöjd 38, 120 kg.
- **Färgen**, mätt på tre skilda beskärningar av huvudbilderna:
  `rgb(51,105,101)`, `rgb(27,73,71)`, `rgb(44,88,86)` — identiska till
  siffran på alla tre. Samma foto.

Två Aosom-artikelnummer (`839-875V00DG` mot `839-875V03DG`), skilda saldon
(22 mot 86) och skilda kostnader — men en produkt för kunden. Den ligger
kvar som **osynligt utkast** och Leonard avgör om den ska pensioneras.

⚠️ **md5 på bildfilerna skiljer sig, och det är INTE motbevis.** Wix
importerar om varje bild och kodar om den, så filsumman skiljer sig även för
samma foto. Jag läste först md5-skillnaden som "olika foton" och hade fel.
Rätt instrument för *samma bild?* är pixlarna.

## Dubblettkollen för resten — alla avgjorda på ritningarna

| familj | mot publicerad | dom |
|---|---|---|
| F2 (tre) | `baddfatolj-gastsang-180-cm` | samma möbel, äkta färgsyskon |
| F4 (`0559bbb2`) | `baddfatolj-190-cm` | samma möbel, äkta färgsyskon |
| F3 (två) | — | egen produkt, 90 × 190 bädd |
| `0761c9d0` | — | egen produkt, 183 × 57 bädd, sidofickor |
| `3c81a3a6` | — | egen produkt, golvsoffa 193 × 138 |

Färgerna är mätta, inte antagna: F2:s mörkgrå ligger på ljushet 38 % mot den
publicerade systerns 51 %, alltså två urskiljbara gråtoner. `0559bbb2` är
beige `rgb(215,208,194)` mot den publicerades mörkgröna.

## ☠️ Steg 2 — maxlasten, och varför D1:s regel INTE gällde här

F2:s tre utkast säger **150 kg**. Den identiska publicerade systern säger
**120 kg**. Båda talen står på var sin måttritning från leverantören.

I runda D1 avgjordes samma sorts konflikt (bäddmåttet 183 mot 185) med
*varje sida bär sitt eget tal*. Den regeln gäller inte här, och skillnaden
är vad felet kostar:

| talet | fel åt något håll betyder |
|---|---|
| bäddlängd | kunden blir förvånad |
| **maxlast** | **någon sätter sig på en möbel som inte bär dem** |

Asymmetrin avgör. **120 kg skrivs** — det lägre av två leverantörsuppgifter
om samma möbel, alltså det enda vi kan stå för. Motiveringen står i varje
`kalla/`-fil.

## Tre fel jag skrev själv och grindade bort

1. **"den bredaste av våra bäddfåtöljer"** (F3) — ett superlativ vars
   sanning hänger på var jag själv drar kategorigränsen; golvsoffan i samma
   runda är 138 cm bred. Struket.
2. **"tjugo centimeter bredare än de flesta"** (F3) — härlett tal som bara
   stämmer mot ETT syskon. Ersatt med den jämförelse jag faktiskt länkar
   till: 72 mot 90 cm.
3. **"tillverkaren anger…"** (`0761c9d0` och `3c81a3a6`) — mot kunden är
   **vi** leverantören. Omskrivet.

## SKU:er — sju av åtta delade

| gammal SKU | delades av |
|---|---|
| `FP-klappsessel-mit` | **fem** produkter |
| `FP-schlafsessel-3-in-1` | två |
| `FP-schlafsessel-2-in-1-mit` | en (tysk) |

Alla åtta har nu en egen svensk SKU på båda sidorna.

## Alt-texterna

Fyra produkter bar **tysk** alt-text, fyra hade **tom**. Alla 40 är
omskrivna på svenska efter att bilderna granskats i kontaktark — bild 3 är
en måttritning på samtliga åtta, bild 2 och 4 miljöbilder, bild 5 en
detaljbild.

## Grindarna

| grind | utfall |
|---|---|
| Filgrind (mönster + tal) | 0 fynd |
| Mutationstest av grinden | 3 injicerade fel → 3 fynd, 0 falska |
| Prisgrind (workflow, åtta körningar) | stämmer |
| Checksumma fil mot Wix | 8/8 identiska |
| Alt-texter | 40 st, 0 tomma |
| Live-grind | **8/8 REN**, 0 orddiffar mot källfilerna |

Filgrinden fällde en riktig sak: `0559bbb2`:s länk**text** lovar "90 cm bred
bädd" om en systerprodukt, och 90 finns inte i den egna källan. Talet är
dokumenterat som korsreferens i stället för struket — en länktext som
beskriver en annan produkt är ett påstående som ska gå att belägga.

## Live-grinden, körd efter ISR-fönstret

Alla åtta sidor svarar 200 på sin nya slug, och orddiffen mot källfilerna är
noll på var och en (294 / 294 / 294 / 355 / 352 / 352 / 363 / 312 ord).
`age` låg på 53–79 sekunder, alltså nyrenderade sidor och inte cachat
innehåll från före skrivningen.

⚠️ En hämtning föll på en tillfällig anslutning (`000`, inte 404) och
skrevs aldrig till disk — samma sak hände i runda C2. Omkörning gav 200 på
första försöket. Ett `000` är inte ett fynd; kontrollera att filen finns
innan grinden körs, annars ser en utebliven hämtning ut som en ren sida.
