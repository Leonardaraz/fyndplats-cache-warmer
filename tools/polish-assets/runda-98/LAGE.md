# Runda 98 — läge

**✅ KLAR — publicerad 2026-09-07.** Sex matskåp för hund, live och köpbara.

| id8 | slug | pris | artikelnr | SKU |
|---|---|--:|---|---|
| `9cfc2f50` | `matskap-hund-35-5-cm-44-liter-vitt` | 879 | D08-040V00WT | `FP-matskap-35-5-44l-vit` |
| `18b9ec99` | `matskap-hund-35-5-cm-44-liter-gratt` | 869 | D08-040V00GY | `FP-matskap-35-5-44l-gra` |
| `f8594223` | `matskap-hund-35-5-cm-44-liter-svart` | 899 | D08-040V00BK | `FP-matskap-35-5-44l-svart` |
| `d362f9b3` | `matskap-hund-43-cm-gallerluckor-vitt` | 929 | D08-054V00WT | `FP-matskap-43-galler-vit` |
| `9a600fda` | `matskap-hund-43-cm-gallerluckor-gratt` | 899 | D08-054V00GY | `FP-matskap-43-galler-gra` |
| `143bef7b` | `matskap-hund-46-cm-skjutdorrar-50-liter` | 859 | D08-090V00GY | `FP-matskap-46-skjutdorrar` |

Prisgrinden stämmer på alla sex (×1,20, charm99). Priserna är oförändrade —
lästa före SKU-skrivningen och ekade tillbaka, jämförda efteråt.

## Fynden

Se `STEG1.md` och `STEG4-5.md`. De fyra som är värda att minnas:

1. ☠️ **`143bef7b` har SKJUTDÖRRAR**, och hade fått gångjärn om texten ärvts
   från syskonet. Beviset är mekaniskt, inte visuellt: två dörrbredder som
   tillsammans är 65,5 cm på en 60 cm bred front kan bara överlappa. Runda
   97:s `868cc038` var samma fel åt andra hållet, på tio ställen.
2. ☠️ **Modell B:s alt-text bär syskonets höjd** — 35,5 mot spec-radens och
   måttritningens 43 cm.
3. ☠️ **Färgsyskonen delar INTE bildset.** Grå har en engelsk
   `Ours`-mot-`Others`-infografik på plats 4 där vit och svart har
   produktfoton. En textprocess hade antagit ett gemensamt galleri.
4. ☠️ **#348 avgjord på tre oberoende mått** — beskrivningslängd, feedens
   artikelnummer och kontaktarket. Klustren är färgsyskon, inte dubbletter.

## Mätningar som är nya för huset

* ☠️ **Wix skriver om beskrivningens MARKUP vid sparning.** `<strong>` blir
  `<span style="font-weight: 700">`, `<li>text</li>` blir `<li><p>text</p></li>`,
  och varje `<a>` får `target="_self"`. 4 605 tecken in, 5 328 ut. Den synliga
  texten är oförändrad, så transkriptionshashen stämmer exakt — och det är
  precis därför omskrivningen är osynlig. **Härled aldrig en syskontext ur det
  Wix lagrat.**
* ☠️ **En `variantsInfo`-PATCH ERSÄTTER varianten.** `price` är obligatoriskt
  (utan det: `400 price must not be empty`) och varje fält som inte skickas
  försvinner. SKU-skrivningen tog därmed bort variantens `media` — runda 97:s
  fyra publicerade sidor har den kvar, alltså en regression införd här.
  ☠️ **Och den går inte att skriva tillbaka:** varken `media: {id}` eller den
  fullständiga mediaformen fastnar. Båda svarar 200, revisionen stiger, och
  fältet förblir `null` — mätt i ett EGET anrop efteråt, inte i samma.
  Kundeffekten är noll på en envariantsprodukt utan val: sidan renderar
  galleriet och `media.main`, och alla sex live-sidorna visar rätt bilder.
  Talet är därför mätt och nedskrivet, inte lagat.
* ⚠️ **`fill` i kontroll-URL:en gav FALSKT LARM på fem uppladdningar.**
  `fill/w_600,h_600` centrumbeskär en icke-kvadratisk bild, så de fem kapade
  måttritningarna (900 × 642) jämfördes mot sin egen mitt och gav 0,72–0,81 i
  korrelation. Med `fit/w_900,h_900` blev alla tolv 1,0000. Samma familj som
  runda 97:s `☠️ FEL PLATS` på `868cc038-3`: **mätningens egen URL kan skapa
  avvikelsen den rapporterar.**

## Kvitton

* Lint: **35/35 självtest**, 0 brister på sex sidor.
* Text: hash-exakt före OCH efter varje skrivning, sju korslänkar per sida.
* Bilder: 12 uppladdade, alla `200` och byte-trogna mot lokal fil (`fit`).
  Galleriets ordning, alt-texter och huvudbild återlästa och verifierade.
* Kategorier: **12 av 12** kopplingar, noll fel — `Husdjur` +
  `Mat & Vattenskålar`, samma löv som runda 97:s publicerade syskon.
* SKU: sex unika, kontrollerade mot **hela katalogen** (5 527 produkter,
  56 sidor) — noll krockar. Fem av de sex delade tidigare
  `FP-erhohte-futterstation` (importbugg #272).
* Live: alla sex svarar `200` med rätt `<title>`, rätt meta, faktakortet i
  galleriet och rätt pris. Ingen tyska, inget husmärke, inget avsändarland,
  inget hälsopåstående i sidkällan.
