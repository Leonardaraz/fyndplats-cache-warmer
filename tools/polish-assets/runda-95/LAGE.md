# Runda 95 — läge

**Alla fyra är PUBLICERADE och live-verifierade.**

| id8 | wixProductId | slug | pris | SKU | variant-id |
|---|---|---|--:|---|---|
| `b6ebc5ba` | `b6ebc5ba-1fb0-462a-9b85-3c4056a8e81d` | `paviljongtak-3x3-dubbeltak-morkgron` | 749 | `FP-paviljongtak-3x3-morkgron` | `5631997a-e13e-4a3e-bf3c-46d80f5c22f1` |
| `271327e1` | `271327e1-bab8-4bbf-b491-ca33a6a4b41b` | `paviljongtak-3x3-dubbeltak-rostrod` | 779 | `FP-paviljongtak-3x3-rostrod` | `998a472c-05c0-4149-a237-b68b0965426e` |
| `ef0a812d` | `ef0a812d-e06c-4470-9a57-f62db2ee71e5` | `paviljongtak-3x4-dubbeltak-rostrod` | 819 | `FP-paviljongtak-3x4-rostrod` | `836f5cb2-e883-435d-8b36-4a6bae8173e6` |
| `dc7d2513` | `dc7d2513-788c-4952-9412-72c57ee853d6` | `paviljongtak-3x4-dubbeltak-cremevit` | 769 | `FP-paviljongtak-3x4-cremevit` | `acefd23e-d737-47d0-9642-c6463e3184a0` |

## Kvitton

| kontroll | utfall |
|---|---|
| `lint.py` | 0 brister |
| `lint.py --sjalvtest` | **30/30** regler faller på sin egen skada |
| `mutationstest.py` | **32/32** mutationer rätt utfall, 2 dokumenterade blinda fläckar |
| Prisgrind (`las`) | 622,86 / 643,34 / 679,14 / 638,93 → 749 / 779 / 819 / 769, `stammer: true` × 4 |
| Transkriberingshash FÖRE skrivning | 4/4 lika facit |
| Återläst hash EFTER skrivning | 4/4 lika facit |
| Galleri | 6 bilder × 4, exakt ordning, alla alt-texter återlästa |
| Kategorier | båda löven på alla fyra, verifierat med återläsning |
| SKU + publicering | `visible: true`, unik SKU, **priset orört** (för = efter) |
| Live-grind | **0 brister** på fyra publicerade sidor |
| JSON-LD live | 749 / 779 / 819 / 769 SEK, `InStock` |

## Tre fynd som inte hör till just de här fyra

1. ✅ **ExecuteWixAPI svarar igen.** 403:an var mekanismen bakom runda 94:s
   `yttterm ått`. Hela skrivningen grindas nu i samma anrop, före OCH efter.
2. ☠️ **`list-categories-for-item` har ingen `categories`-array** —
   `directCategoryIds` / `allCategoryIds`. En läsning av `r.categories` ger `[]`
   på en produkt som ligger i två löv.
3. ☠️ **Tre av fyra bar SAMMA SKU** (`FP-ersatzdach-fur-pavillon`) före rundan.
   Det är importen som skapar krocken, inte poleringen (uppgift #272).

## Kvar i familjen efter runda 95

`9a3600f8` (639, 2,85 × 2 m) · `3f9fda98` (729, 3 × 3 m, påstår **"wasserdicht"**
— kräver egen kontroll) · `2bfaf6dd` (779, huvudbildens filnamn är
`aosom-84C-041-2.jpg`, uppgift #340) · `22dbd372` (729, pergola/soltak,
OUT_OF_STOCK).
