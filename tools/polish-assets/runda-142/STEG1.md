# Runda 142 — Steg 1: familjemätning, batch och två bevisade dubbletter

Familjen är **boxningssäckar och punchingbollar** — 27 tyska utkast mot **3**
publicerade sidor. Det är katalogens glesaste familj av den här storleken, och
den ligger i samma kategorilöv som runda 141 nyss öppnade.

## Katalogsvepet

`products/search`, filter bara på första sidan, markör därefter. Kontrollmätning:
**unika = lästa**, `avhuggen: false`.

| | |
|---|--:|
| Unika produkter | **5 695** |
| Utkast (`visible:false`) | 2 949 |
| Publicerade | **2 746** |

☠️ **Publicerat-talet är KORSMÄTT mot sitemapen** — 2 746 produktsidor i
`sitemap.xml`, exakt samma tal. Två oberoende källor som möts är skillnaden mot
ett tal man hoppas på. Sitemapen är dessutom gratis (en hämtning, noll
Wix-anrop) och används för familjemätningen av publicerade sidor, precis som
runda 93 lärde.

## ☠️ Det breda mönstret hittade ÅTTA UTKAST TILL

Första mätningen grupperade på huvudord och gav `boxsack: 8`. Det breda
mönstret — `boxsack|standbox|punchingball|boxbirne|boxsackst|boxpuppe|boxdummy`
— gav **27**. De nitton som saknades heter `Punchingball…`, `Standboxsack…`,
`Boxdummy…` och `Boxstand…`; ordet `Boxsack` står inte i namnet på någon av dem.

Det är #494 en gång till, och riktningen spelar roll: en huvudordsräkning
UNDERSKATTAR en familj, så man väljer bort den på ett för lågt tal.

## Två BEVISADE dubbletter mot publicerade sidor

Avgjorda på varenda tal ur den publicerade sidans spec-tabell — hämtad från
butiken, inte från Wix.

| utkast | pris | publicerad sida | pris | bevisen |
|---|--:|---|--:|---|
| `01f3293a` | 1 619 | `fristaende-boxningssack-156-cm` | 2 289 | 156 cm · säck Ø26 × 120 · fot 36 × 36 · platta 34 × 34 · 12 sugproppar · Q195-stål · röd/svart |
| `3c41342e` | 1 999 | `fristaende-boxningssack-160-230-cm` | 2 329 | 88 × 50 × 160–230 · 13,3 kg · 45 kg sand / 30 l vatten / 40 kg blandning · röd |

☠️ **FÄRGEN avgjorde den andra, och den hade annars pekat på fel utkast.** Två
utkast delar måtten 88 × 50 × 160–230 och vikten 13,3 kg exakt: `3c41342e` (Rot)
och `f0430bc5` (Schwarz). Den publicerade sidan säger `Färg: röd` i sin egen
spec-tabell — alltså är `3c41342e` dubbletten och `f0430bc5` dess svarta syskon,
som får en egen sida med korslänk.

Utan färgavläsningen hade rundan pensionerat fel utkast och publicerat en
dubblett. Det är #532 ordagrant: **måtten är inget bevis** — de är ett såll, och
det som fäller är en egenskap till.

⚠️ **Båda utkasten är BILLIGARE än sidan vi säljer i dag** (670 respektive
330 kr). Det är ommappningsfallet Leonards regel finns för: behåll-sidan pekas
om till Aosoms artikelnummer, utkastet pensioneras.

## En INTERN dubblett mellan två utkast

`4fe5959f` (899 kr) och `336172a7` (939 kr) delar **allt**: Ø48 × 136–154 cm,
5 kg, paketmått 48 × 24 × 50, färg `Schwarz, Rot`, samma `Lieferumfang`
(punchingboll + boxhandskar). Det är inte färgsyskon — det är samma vara två
gånger, med 40 kr i prisskillnad.

Den billigare poleras; den andra lämnas som ett sortimentsbeslut.

## ☠️ En PUBLICERAD sida står som `rejected` i mappningen — och säljs ändå

`7aa1e2f5` (`fristaende-boxningssack-160-230-cm`) läser tillbaka:

```
supplier       null          ← alltså AliExpress
needsAiPolish  false
draftStatus    "rejected"    ← pensionerad
```

Men produkten är `visible: true` i Wix (revision 23), svarar 200 på sin URL och
ligger i sitemapen. En sida som bokförts som pensionerad säljs alltså vidare.

Stämpeln `rejected` + `needsAiPolish: false` är exakt vad ommappningen sätter på
den dubblett som ska bort — men `supplier` är kvar på `null`, så ingen
ommappning har skett. Någon har pensionerat raden utan att avpublicera sidan.

**Det är ett eget fynd, inte poleringens jobb**, och det går åt det farliga
hållet: en sida som ingen räknar som levande men som kunder kan köpa.

## Batchen: elva distinkta produkter

| pid | pris | vad |
|---|--:|---|
| `56cca82a` | 729 | punchingboll på ställ, 126–144 cm, 3,5 kg |
| `ce8813ce` | 769 | punchingboll 133–151 cm, fot 45 × 45 |
| `93073695` | 899 | punchingboll 125–145 cm med 15 kg viktsäck |
| `4fe5959f` | 899 | punchingboll Ø48, 136–154 cm |
| `136a4671` | 1 039 | punchingboll Ø48, 147–165 cm, 7 kg |
| `95f6280b` | 1 179 | fristående säck Ø38 × 135 cm, 10 sugproppar |
| `2730de6f` | 1 199 | boxställ 48 × 48, 145–180 cm |
| `2a13cbbe` | 1 349 | punchingboll med reflexstång, 160–205 cm |
| `c8f6b93f` | 1 759 | stående säck 88 × 48, 155–205 cm, svart och röd |
| `a8daef42` | 1 799 | samma modell, svart — färgsyskon |
| `f0430bc5` | 2 019 | 88 × 50, 160–230 cm, svart — syskon till en PUBLICERAD röd |

Alla elva: `visible:false`, `IN_STOCK`, `variantCount: 1`.

**Kvar till nästa runda**, och de är en egen produkttyp: de tunga ställen och
boxdockorna (`f8d974b3`, `49d6d56f`, `d307632a`, `7eeb7497`, `74602345`,
`1409d762`, `c5c228ab`, `0deb6901`, `9119599f`, `c00988e3`, `702c7795`,
`6f603856`) plus väggfästet `b6c4c619`.

## Sökordsdelningen

Två svenska huvudord, inte ett — det undviker krock inom den egna batchen och
ger var sida ett ord med egen köpintention:

| huvudord | gäller |
|---|---|
| **punchingboll** | boll på fjädrande stång, `56cca82a` `ce8813ce` `93073695` `4fe5959f` `136a4671` `2a13cbbe` `2730de6f` |
| **boxningssäck** | fristående säck, `95f6280b` `c8f6b93f` `a8daef42` `f0430bc5` |

De tre publicerade sidorna bär redan `fristaende-boxningssack-…` och
`smart-boxningsdyna`, så kvalificeraren måste stå i namn, slug OCH titel.
