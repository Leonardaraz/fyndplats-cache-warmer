# Runda 87, Steg 4 — 40 bilder granskade

Två kontaktark (`kontaktark-b1.jpg`, `kontaktark-b2.jpg`), en hörnremsa och
tre zoomar.

## ✅ Ingen inbränd tysk text — och ingen leverantörslogotyp

Fyrtio bilder, noll med tysk overlay-text. Måttritningarna bär rena siffror
med `cm`/`m` och inga ord alls. `RENA_BILDPOSITIONER = [1,2,3,8,9]` i
`to-product.ts` gör sitt jobb.

Hörnremsan (`zoom-horn.jpg`) visar det övre VÄNSTRA hörnet på bild 1 och 2
för alla åtta — sexton hörn, alla rena. Runda 64 mätte upp att leverantörens
logotyp kan ligga inbränd just där, och att en `grep` över källkoden då
svarar grönt medan kundens öga läser leverantörens namn. Här finns ingen.

## ✅ Alla åtta färgrader stämmer — mätt, inte antaget

Runda 86 hade tre fel av sju. Den här rundan har noll:

| id8 | tyskan | bilden |
|---|---|---|
| `72051417` | Hellgrau | ljusgrå ✓ |
| `a165b178` | Dunkelgrau | mörkgrå ✓ |
| `5f6592ad` | Dunkelgrau | mörkgrå ✓ |
| `20c0942e` | Hellgrau | ljusgrå ✓ |
| `8bdba748` | Dunkelgrau | mörkgrå ✓ |
| `0f5e3fea` | Dunkelgrau | mörkgrå ✓ |
| `6a419d8b` | Dunkelgrau | mörkgrå ✓ |
| `95a9d7cc` | Hellgrau | ljusgrå ✓ |

⚠️ Den svenska `Färg`-raden är däremot **oöversatt tyska** på alla åtta
(`Färg: Dunkelgrau`). Rätt värde, fel språk — översätts i Steg 7.

## ✅ Måttritningarna bekräftar tyskan siffra för siffra

| id8 | ritningen säger | Technische Daten |
|---|---|---|
| `72051417` | 120 / 179 / 165 / 134 / 106 / 126 | samma |
| `5f6592ad` | 162 / 221,5 / **163** | samma |
| `20c0942e` | 162 / 221,5 / **163** | samma |
| `8bdba748` | 245 / 120 / 200 | samma |
| `0f5e3fea` | 1,9 / 2,3 / 2,2 m + 1,47 / 1,85 + 33 / 36 | samma |
| `6a419d8b` | 300 / 300 / 210 | samma |
| `95a9d7cc` | 300 / 447 / 255 + 47 / 56 + 20 | samma |

☠️ **En felläsning som nästan blev ett fel i texten.** I miniatyren såg
`5f6592ad`/`20c0942e` ut att säga **165 cm** där tyskan säger 163, och det
hade blivit ett fynd om "leverantören säger emot sig själv". Zoomat till full
upplösning står det **163 cm**. Läs ritningen i den upplösning den är
gjord för, inte i kontaktarket — arket hittar vad som är värt att titta på,
det avgör ingenting.

## ☠️ Bilden fällde en takform som tyskan har fel om

`20c0942e`/`5f6592ad` heter `… Satteldach` i NAMNET men brödtexten säger
*"Schrägdach bietet mehr Kopffreiheit"* — pulpettak. Zoomen visar ett
tydligt **symmetriskt sadeltak med nock på mitten**. Namnet har rätt,
brödtexten fel. Sidorna säger sadeltak.

## ☠️ Fyra bilder är SAMMA SCEN omfärgad — färgsyskonen delar dem

`72051417` och `a165b178` delar bild 3, 4 och 5 (samma trädgård, samma
skottkärra, samma vedtrave). `5f6592ad` och `20c0942e` delar bild 2, 3, 4
och 5 (samma altan, samma hortensia, samma skuggor).

Det är runda 85:s lärdom en gång till: två av VÅRA egna URL:er blir nästan
identiska om texten inte gör jobbet. Här skiljer sig **bild 1 och 2** mellan
`72051417` (vedtrave och trädgårdsbord) och `a165b178` (cykel mot grönt
plank), så huvudbilden och delningsbilden är olika. Det andra paret delar
även bild 2 — där är texten det enda som skiljer, och den skrivs därefter.

## ☠️ `6a419d8b`: tyskan lovar ett fönster som ingen bild visar

`Fensterabmessungen: 47L x 40B cm` står i Technische Daten, och ingressen
säger *"Garagenzelt mit Fenster"*. Fem bilder, fyra vinklar, inget fönster
på någon sida.

Det som DÄREMOT syns på varje bild är att dörrens **övre del rullas upp och
buntas i en rulle högst upp** — och tyskan kallar det
*"aufrollbares Reißverschluss-Türfenster"*. Det är rimligen samma sak, men
det är en tolkning, inte en mätning.

**Sidan beskriver därför den upprullbara dörrdelen, som syns, och lovar
inget separat fönster.** Samma sak med *"Aufrollbare Seitenlüftungen"* —
inga sidluckor syns på någon bild, så de nämns inte.

`95a9d7cc` är motsatsen och därför värd att jämföra med: dess fönster
(47 × 56 cm) syns tydligt på tre bilder OCH står i måttritningen. Där finns
fönstret, och det får stå i texten.

## Formerna skiljer sig, och det är vad som gör åtta sidor värda att ha

| id8 | takform | vad bilden visar inuti |
|---|---|---|
| `72051417` / `a165b178` | sadeltak, låg nock | skottkärra, ved, cykel |
| `5f6592ad` / `20c0942e` | sadeltak | cykel, arbetsbänk, motorcykel |
| `8bdba748` | **bågformat tunneltak** | två cyklar bredvid varandra, vedtrave |
| `0f5e3fea` | sadeltak, hög | gräsklippare, räfsor, spadar, cykel |
| `6a419d8b` | sadeltak med lång nock | hyllställ + åkgräsklippare |
| `95a9d7cc` | sadeltak, störst | motorcykel + hyllställ |

`8bdba748` är den enda med bågformat tak i hela rundan. Det är den formen
som gör den låg och bred (245 × 120) i stället för djup, och det är exakt
vad ett cykelgarage ska vara.
