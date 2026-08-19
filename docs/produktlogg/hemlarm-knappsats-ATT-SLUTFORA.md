# Knappsatslarmet — förberett, väntar på API-kvot

Produkt `92d0eee3-0276-4558-b760-efbed45977b6`,
slug `tradlost-hemlarm-pgst-knappsats-wifi-4g`, **revision 21, orörd**.

Allt underlag är klart och alla bilder ligger uppladdade i Wix. Bara
skrivningen återstår — `ExecuteWixAPI` slog i sin kvot 2026-08-19 och släppte
inte efter 30 minuters paus, så den får köras i en ny session.

**Produkten är i oförändrat, fungerande skick.** Ingen halvfärdig ändring ligger
ute: PATCH:en gick aldrig igenom, så de sex varianterna A–F finns kvar med
lager och pris 1 469 kr. De åtta nya bilderna ligger oanvända i mediabiblioteket
och stör ingenting.

## Avläst innehåll (leverantörens paketfoton, ett per variant)

Panelen har knappsats och inbyggd SOS. Fristående SOS-knapp ingår först från D.

| Paket | Rörelse | Dörr | SOS | RFID | Fjärr | Lager | Nytt namn |
|---|---|---|---|---|---|---|---|
| A-4G | 1 | 1 | – | 2 | 2 | 33 | 1 rörelse- + 1 dörrsensor |
| B-4G | 2 | 2 | – | 2 | 2 | 40 | 2 rörelse- + 2 dörrsensorer |
| C-4G | 2 | 4 | – | 2 | 2 | 58 | 2 rörelse- + 4 dörrsensorer |
| D-4G | 3 | 6 | 1 | 2 | 2 | 64 | 3 rörelse- + 6 dörrsensorer |
| E-4G | 4 | 8 | 1 | 3 | 3 | 53 | 4 rörelse- + 8 dörrsensorer |
| F-4G | 5 | 10 | 1 | 3 | 3 | 27 | 5 rörelse- + 10 dörrsensorer |

Alla sex har lager — inga varianter ska tas bort här.

## Prisstege

Landad kostnad **1 114,52 kr** för alla sex (samma inköpspris oavsett paket, så
hela prisskillnaden är marginal). Leonards golv 23 % → **1 449 kr**. Husets
kategoriregel för Elektronik & Tillbehör är 2,0× → **2 239 kr**, vilket blir
taket — ingen variant läggs över det.

| Paket | Pris | Marginal |
|---|---|---|
| 1 rörelse- + 1 dörrsensor | 1 449 | 23,1 % |
| 2 rörelse- + 2 dörrsensorer | 1 549 | 28,0 % |
| 2 rörelse- + 4 dörrsensorer | 1 649 | 32,4 % |
| 3 rörelse- + 6 dörrsensorer | 1 849 | 39,7 % |
| 4 rörelse- + 8 dörrsensorer | 1 999 | 44,2 % |
| 5 rörelse- + 10 dörrsensorer | 2 149 | 48,1 % |

## Uppladdade bilder (READY, verifierade 1600² via CDN)

| Roll | Media-ID |
|---|---|
| Hjälte | `b379ce_2c349235079749c092c86647bd117140~mv2.jpg` |
| Kort A | `b379ce_74af7827712045a39af2f7342938a0eb~mv2.jpg` |
| Kort B | `b379ce_3d6e53ea9f094818b098aa21c833b75b~mv2.jpg` |
| Kort C | `b379ce_30f28ce387c249a4b413c4d1a71cb1cf~mv2.jpg` |
| Kort D | `b379ce_41406c9e6abd4d13a09d02c13fdafb74~mv2.jpg` |
| Kort E | `b379ce_36e6b03ec18d41ebabc5c82eab648e78~mv2.jpg` |
| Kort F | `b379ce_de33bd9faf554be08b7818f73379d571~mv2.jpg` |
| Helhet (med laddare + kabel) | `b379ce_10cbf2e46625462c8844b2e183468afb~mv2.jpg` |

**Korten är v2** (Leonard 2026-08-19: *"bilderna i mallarna va en aning för små"*).
Kortets bildyta är **1372 × 731 px, format 1,88** — uppmätt med en magenta-probe
och `fit=False`, inte gissad. Den gamla `rensa()` la produkten på en
**kvadratisk** 1600×1600-duk vid 90 % fyllnad; `object-fit: contain` skalar då
efter HÖJDEN, så bilden fick bara 731 av 1372 px bredd. Produkten renderades
**658 × 524 px**. Med tight urklipp (ingen kvadratisk duk, 2,5 % marginal) blir
det **879 × 724** för minsta paketet och **1416 × 732** för det största — knappt
dubbla ytan. Se `scratchpad/larm2/bygg-kort.py`.

Pekskärmslarmets två kort är ombyggda på samma sätt och ligger uppladdade:
kort D `b379ce_0777bb3f9a8f4a4f8dbb884bdf44843a~mv2.jpg`,
kort E `b379ce_9b9bd0e810924f54ac995890a29ede2d~mv2.jpg`.
De ersätter `3e8b26b0…` respektive `5d65ae18…` i galleri och `linkedMedia`.

Behålls ur gamla galleriet: specifikationskortet
`b379ce_7c808e4b02224f88ad10416116d4d351~mv2.png` och egenskapskortet
`b379ce_2c02b7a4e65c46eaaa2e2e97eb7b40b6~mv2.png`. Resten utgår — de sex råa
paketfotona ersätts av korten (som innehåller samma foto, logotvättat) och den
gamla huvudbilden var 1000×864 och brevlådades.

Byggskript: `scratchpad/larm2/bygg-hjalte.py`, `bygg-kort.py`.
Källbilder och backup: `scratchpad/larm2/`.

## Kvar att köra

1. **PATCH** produkten: axel `Modell` → `Paket`, de sex nya namnen med
   `linkedMedia` till respektive kort, priserna ovan, galleriet i ordningen
   hjälte → kort A–F → helhet → spec → egenskaper, plus de tre
   beskrivningsbytena som tar bort "modellerna A–F".
2. **Lagerposter.** Alla sex namn ändras, så alla sex får nya variant-id och
   lagret nollställs. Återskapa omedelbart via
   `POST /stores/v3/bulk/inventory-items/create`: 33/40/58/64/53/27.
3. **Mappningen.** Peka om `FyndplatsMappings.variants[].wixVariantId` och
   `.choices` (nyckeln byter från `Modell` till `Paket`).
4. Verifiera live.

## Pekskärmslarmet — prisstege + större kort

Två saker kvar där, båda i samma PATCH:
1. Byt kort D/E till v2-bilderna ovan (galleri + `linkedMedia`).
2. Sätt prisstegen nedan.

### Prisfrågan

`5352bb04-ae5e-4452-8d3f-3bb4b120d530` har två paket som båda kostar 1 929 kr
trots olika innehåll. Landat 1 464,15 kr, 23 %-golv 1 909 kr, husets 2,0× 2 929 kr.
Föreslagen stege: **3+6 → 1 909 kr** (23,3 %), **4+8 → 2 099 kr** (30,2 %).
Inte heller den är körd.
