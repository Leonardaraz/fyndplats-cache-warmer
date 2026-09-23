# Runda 94 — läge

**Fyra sidor publicerade och live-verifierade 2026-09-07.** Priserna orörda.

| id8 | slug | pris | SKU | variant-id | galleri |
|---|---|--:|---|---|--:|
| `df5a7190` | `paviljongtak-3x3-tvafargat-dubbeltak-gra` | 899 | `FP-paviljongtak-tvafarg-gra` | `8503f829-45bd-4d82-bebb-84bc304e553e` | 5 |
| `60eaf40e` | `paviljongtak-3x3-tvafargat-dubbeltak-brun` | 859 | `FP-paviljongtak-tvafarg-brun` | `55fa6f88-3849-4e7d-b586-672132a220d7` | 5 |
| `d52c6d1d` | `paviljongtak-3x3-oxfordvav-370-beige` | 779 | `FP-paviljongtak-oxford-beige` | `e4ece14d-b81b-4d5b-a1c4-b7fa3a56695f` | 5 |
| `d01a6d2b` | `paviljongtak-3x3-oxfordvav-370-morkgra` | 749 | `FP-paviljongtak-oxford-morkgra` | `3d40616c-16ed-4437-89ae-2a8b4776d108` | 5 |

Alla fyra bar `FP-ersatzdach-fur-pavillon` som SKU före rundan — samma sträng på
fyra produkter, importens kända SKU-krock (#272).

## Kvitton

| kontroll | utfall |
|---|---|
| `lint.py` | 0 brister på alla fyra |
| `lint.py --sjalvtest` | **22/22 regler faller PÅ SIN EGEN skada** |
| `mutationstest.py` | **23/23 mutationer ger rätt utfall** |
| Prisgrinden (`polish-mapping.yml`, läge `las`) | 750,64 / 708,44 / 641,97 / 616,98 → 899 / 859 / 779 / 749, `stammer: true` |
| Kategorier | 2/2 löv per produkt, `success: true` per rad |
| Galleri (återläst med `MEDIA_ITEMS_INFO`) | 5 poster, kortet på plats 3 |
| Mappningarna | stämplade: `needsAiPolish: false`, `draftStatus: published` |
| `livegrind.py` mot live-sidorna | **0 brister på fyra sidor** |
| JSON-LD på live-sidan | pris 899/859/779/749, alla `InStock` |

Kategorilöven är desamma som den publicerade `paviljongtak-3x3-dubbeltak-creme`
ligger i — avläst, inte antaget: `5d75e733-…` och `653ab052-…`.

## Tre fynd som gick in i runboken

1. ☠️ **`product.name` tar högst 80 tecken.** 400 INVALID_ARGUMENT på 91.
   Toppfärgen flyttades till seo-titeln; `utan stomme` behölls.
2. ☠️ **Fil-regeln skyddar författandet, inte transkriberingen.** Filen var rätt,
   JSON-kroppen fick `yttterm ått` i två av fyra. Hittat på en återläsning,
   rättat före publicering.
3. ✅ **Live-grinden kan jämföra VARJE MENING ordagrant** — och gör det nu.
   Bevisad mot den faktiska skadan: rätt text 0 brister, samma text med
   felstavningen återinförd faller på rätt mening.

☠️ Grinden fällde först alla fyra korrekta sidor på butikens egen
EU-lager-ribbon och på Klarna-/kortlogotypernas alt-texter. Avgränsad till
beskrivningsdelen och till våra egna fem alt-texter.

## Kvar i familjen — åtta utkast

| id8 | pris | vad |
|---|--:|---|
| `9a3600f8` | 639 | 2,85 × 2 m, utdragbart |
| `ef0a812d` | 819 | 3 × 4 m polyester |
| `3f9fda98` | 729 | 3 × 3 m, **"wasserdicht"** — kolla om påståendet håller |
| `dc7d2513` | 769 | 3 × 4 m |
| `b6ebc5ba` | 749 | 3 × 3 m |
| `271327e1` | 779 | 3 × 3 m |
| `2bfaf6dd` | 779 | ☠️ huvudbildens filnamn är `aosom-84C-041-2.jpg` (#340) |
| `22dbd372` | 729 | pergola/solsegel, slut i lager |

⚠️ **#340 fick sin mekanism mätt i den här rundan.** Wix behåller filnamnet från
adressen man laddar upp ifrån: våra egna filer heter nu `df5a7190-3.jpg` och
`60eaf40e.jpg` i mediabiblioteket. Det är alltså importen som skrivit in
`aosom-84C-041-2.jpg` — den passerade en URL med det basnamnet.
