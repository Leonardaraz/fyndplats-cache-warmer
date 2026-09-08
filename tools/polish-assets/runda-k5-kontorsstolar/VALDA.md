# Runda K5 — åtta kontorsstolar 969–1 959 kr

Femte kontorsstolsrundan (K1 1 099–1 669, K2 1 039–2 099, K4 1 799–3 239).
Prisbandet är det lägsta hittills: 969–1 959 kr.

| kort | pris | saldo | slug | SKU |
| :-- | --: | --: | :-- | :-- |
| `b452bfe0` | 1 959 | 180 | `kontorsstol-linnelook-vita-armstod-fotstod` | `FP-kontorsstol-linnelook-vita-armstod` |
| `d710da91` | 1 869 | 69 | `snurrstol-armlos-chenille-81-cm-djup` | `FP-snurrstol-armlos-chenille` |
| `3b9124cb` | 1 799 | 26 | `kontorsstol-bojtra-valnot-avtagbart-nackstod` | `FP-kontorsstol-bojtra-valnot` |
| `d894f76e` | 1 639 | 62 | `chefsstol-svart-konstlader-73-cm-rygg` | `FP-chefsstol-svart-73-cm-rygg` |
| `e134f532` | 1 479 | 17 | `kontorsstol-cremevit-guld-fjaderpaket` | `FP-kontorsstol-cremevit-guld` |
| `cdc03206` | 1 279 | 20 | `kontorsstol-natvav-uppfallbara-armstod-90-grader` | `FP-kontorsstol-natvav-90-grader` |
| `1c6759a8` | 1 149 | 134 | `kontorsstol-natvav-landkudde-60-cm-bred` | `FP-kontorsstol-natvav-landkudde` |
| `e6236dd0` | 969 | 57 | `kontorsstol-rosa-teddy-8-kg` | `FP-kontorsstol-rosa-teddy` |

## Urvalet: bildgrinden i stället för en spec-etikett (#187)

K4 valde ut sina åtta med en måttbaserad tvillingmätning. Den underrapporterade
i två omgångar, och rotorsaken är #146 — varje runda hittar på sin egen
spec-etikett, så en extraktor som letar `Mått:` missar `Totalmått:` och
`Mått upprätt (bredd × djup × höjd):`.

Den här rundan använde `tools/polish-gates/dubblettgrind.py`, som jämför
BILDER och därför inte bryr sig om vad etiketten heter. 21 kandidater mot den
publicerade katalogen: **lägsta avstånd 11,54** mot tröskeln 1,0, och inget
internt par under 6,0. Ingen av de åtta är alltså en tvilling till något vi
redan säljer.

## Lagergrinden (#173)

Tre kandidater föll på saldo i urvalssteget: `e86bff15` (0), `ba1fd352` (0) och
`19b0c6c8` (5, hoppades över). Lägsta saldo bland de åtta valda är **17**
(`e134f532`).

## Fem tyska/engelska grafiker borta, plus en bildlös mediapost

| kort | pos | vad |
| :-- | --: | :-- |
| `d710da91` | 4 | tysk text inbränd (360° DREHBAR, Stabiler Kreuzrahmen) |
| `cdc03206` | 4 | tysk text inbränd (HÖHENVERSTELLBAR, Passend zu Ihrem Sitzstil) |
| `cdc03206` | 5 | tysk text inbränd (SCHAUKELFUNKTION, Drücken und Ziehen) |
| `1c6759a8` | 4 | tysk text inbränd (Mesh-Gewebe, Dicke Polsterung, Gaslift) |
| `1c6759a8` | 5 | engelsk text inbränd (ROTATABLE ARMREST, Saving space when not in use) |

`d894f76e` hade dessutom en mediapost med `url` men utan `image` — den togs
bort samtidigt. Efter städningen: 5 · 4 · 5 · 4 · 5 · 3 · 3 · 5 = **34 bilder**,
och lika många alt-texter.

## Grindarna före skrivningen

| grind | utfall |
| :-- | :-- |
| `gate.py` | 0 fynd |
| `gate-alt.py` | 8 produkter, 34 alt-texter, 0 fynd |
| `gate-seo.py` | 0 fynd |
| `gate-lager.py` | 0 fynd, lägsta saldo 17 |
| `gate-lankar.py` | 0 fynd, 1 mål hämtat, 7 interna hoppade |
| `las` (prisgrind) | 8/8 gröna, körningar 1939–1946 |

Två fynd som grindarna tog och som annars nått kund:

1. ☠️ **Två kyrilliska homoglyfer** som jag själv skrivit — `о` (U+043E) och
   `р` (U+0440) i "skuldrorna" i `1c6759a8.html`. Efter lagningen svepte jag
   varenda `*.html`, `*.tsv` och `slugs.txt` efter tecken i U+0370–U+04FF och
   över U+2100: bara de två fanns.
2. **Ett osourcat `45`** i `e6236dd0.html` — ett påstående om andra stolar som
   inte stod i den produktens källa. Omskrivet utan talet.

☠️ **Och `gate-lankar.py` fällde en påhittad slug** för tredje gången i samma
familj: `snurrstol-bojtra-svart-pu-armlos` gav HTTP 000. Jag hade härlett den
ur den publicerade produktens NAMN i stället för att hämta slugen. Den riktiga
är `snurrstol-bojtra-svart-pu`.

## Skrivningen

Alla åtta publicerade i fyra par, var och en med FNV-1a-grinden **före**
skrivningen och en hash på det Wix läste tillbaka:

```
hashLika  8/8      visible  8/8      variantVisible  8/8
namn      8/8      slug     8/8      seoTaggar       2 på alla åtta
```

Alt-texterna skrevs i ett svep med `fieldMask: ["media"]`, `image.url`
strippad och `altText` satt både på posten och inuti `image`. Återläsningen
ger `altStammer: true` på alla åtta, och både produktens och variantens
`visible` överlevde.

Kategori: `Hem & Inredning`, **8 av 8** enligt bulk-svarets
`bulkActionMetadata` — trädet har inget möbellöv, samma som K1, K2 och K4.

Mappningsraderna stämplade i åtta `stampla`-körningar (1947–1954), alla med
`ref: claude/seo-polering-runbook-review-uq6fwl` (#181) — **8/8 success**.
