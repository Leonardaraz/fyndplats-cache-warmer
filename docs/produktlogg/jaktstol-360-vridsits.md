# Jaktstol med tyst 360°-vridsits — bildombyggnad 2026-08-21

Produkt `e0e6dd5a-b096-46e9-8e29-6d65d4ad3f98`, slug `jaktstol-360-vridsits`.
Revision 6 → 9. Publicerad hela tiden (`visible: true`).

## Vad som faktiskt var fel

Tre fel, alla i bild — inte i text, pris eller lager.

1. **Hero var hårt beskuren till höger.** Uppmätt: 250 objektpixlar i kolumn
   1521 och 0 i kolumn 1522. Höger armstöd och sitsens högerkant var kapade
   rakt av. Vänsterkanten avtog naturligt (6, 12, 15, 19 …), så det var en
   beskärning, inte produktens form.
2. **Båda variantbilderna var kapade i ryggstödets överkant** — 646 respektive
   557 objektpixlar i bbox:ens första rad.
3. **Kamouflagebilden bar kvar en måttpil ur leverantörens specbild** — en
   3 px bred, 260 px hög svart stapel med pilhuvud, som satt ihop med
   armstödets vred och därför följde med när stolen klipptes ut.

Korten byggdes dessutom av kvadratiska källor. I kortets panel skalar
`object-fit: contain` efter kortaste passningen, så all inbyggd vitmarginal i
källan åt av panelen och stolen krympte.

## Åtgärd

Stolen plockades ut som **största sammanhängande komponent** ur leverantörens
original i stället för att beskäras ur butiksbilden:

| Bild | Källa | Stolens bbox i källan |
|---|---|---|
| hero | `ae-0` (Sd23c8d1a…) | 1112 × 1560, ren vit bakgrund |
| variant kamouflage | `ae-6` (Sd7d1766b…) | 842 × 1158 |
| variant svart | `ae-7` (S88568a8a…) | 794 × 1161 |

`ae-6` och `ae-7` är samma fotouppställning, så de två utförandena står i
identisk pose bredvid varandra på jämförelsekortet.

Måttpilen raderades på **uppmätta** koordinater, inte gissade: allt med
x ≥ 1569 under y = 530 i `ae-6` är pil, inget är stol (grannkolumnerna slutar
vid y ≈ 551–565). Raderingen sker FÖRE komponentmärkningen — annars sitter
pilen fortfarande ihop med stolen.

Två spärrar i `bygg.py` fäller bygget om något går fel:

- `kontrollera_hel` — mer än 12 % objektpixlar i en kantrad/-kolumn betyder
  rak kapning. Fångar exakt det fel som fanns i de gamla bilderna.
- `smal_stapel` — en tunn (≤ 14 px) men hög (> 35 % av bbox) struktur är en
  måttpil. Den fällde `ae-6` innan raderingen lades in.

## Resultat på korten

Snäv beskärning (stolens bbox + 2,5 % marginal) i stället för kvadratisk duk:

| | gammalt | nytt |
|---|---|---|
| måttkortet, stolens bredd | 1054 px | **1237 px** (+17 %) |
| jämförelsekortet, svarta stolen | 1181 × 1703 | **1213 × 1804** |

Stolen är nu 1702 px hög i en panel med 1786 px innerhöjd — **95 % av taket**.
Mer går inte att vinna på måttkortet: produkten är stående (bildförhållande
0,72) och panelen är liggande, så höjden är den bindande gränsen.

## Ordningen som fungerar

`media.itemsInfo.items` vägrar släppa en bild som ett val fortfarande pekar på
(404 `PRODUCT_MEDIA_NOT_EXIST`). Tre steg:

1. PATCH galleriet med **nya OCH gamla** bilder — gamla `linkedMedia` validerar.
2. PATCH `options` + `variantsInfo` med nya `linkedMedia`, explicita `choiceId`
   och variant-`id` så inget döps om.
3. PATCH galleriet till slutliga sju.

Verifierat efteråt: GET `?fields=MEDIA_ITEMS_INFO` gav sju rätt bilder i rätt
ordning, och lagret var orört (kamouflage 2 st, svart 3 st, inventory-revision
kvar på 1).

## Noterat, inte åtgärdat

- **PDP:ns LCP-bild är variantbilden, inte `media.main`.** Sidans
  `<link rel=preload>` pekar på det förvalda utförandets `linkedMedia`. Det är
  alltså variantbilden kunden ser som "hero" på produktsidan; `media.main`
  används i kategorilistor och `og:image`.
- **`variantsInfo.variants[].media` speglar produktens huvudbild** och går inte
  att sätta per variant här — båda varianterna visade gamla hero före ändringen
  och nya hero efter, utan att fältet rörts. Den svarta stolen får därför en
  kamouflage-miniatyr i kundvagnen.
