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
| Kort A | `b379ce_129dc6d2c0c7424c97b83f9a8e012019~mv2.jpg` |
| Kort B | `b379ce_e9526a55bbb143d897503d5cec9b34b5~mv2.jpg` |
| Kort C | `b379ce_27eca700713441398b5d50e1ad096adc~mv2.jpg` |
| Kort D | `b379ce_19bde5a540ff485980a2bdf1cc72bd75~mv2.jpg` |
| Kort E | `b379ce_748ff44a7f50465796578f815da0d1e9~mv2.jpg` |
| Kort F | `b379ce_d0ff7c21092c409c9831abe4670ca188~mv2.jpg` |
| Helhet (med laddare + kabel) | `b379ce_10cbf2e46625462c8844b2e183468afb~mv2.jpg` |

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

## Pekskärmslarmet — samma prisfråga

`5352bb04-ae5e-4452-8d3f-3bb4b120d530` har två paket som båda kostar 1 929 kr
trots olika innehåll. Landat 1 464,15 kr, 23 %-golv 1 909 kr, husets 2,0× 2 929 kr.
Föreslagen stege: **3+6 → 1 909 kr** (23,3 %), **4+8 → 2 099 kr** (30,2 %).
Inte heller den är körd.
