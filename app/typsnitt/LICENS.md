# Newsreader

Rubriktypsnittet i butiken (`app/layout.tsx`).

- Copyright 2020 The Newsreader Project Authors (http://github.com/productiontype/Newsreader).
- Licens: SIL Open Font License 1.1, https://openfontlicense.org. Typsnittet får
  användas, ändras och spridas fritt, också i en butik, så länge licensen följer med
  och filerna inte säljs för sig.

## Så är filerna gjorda (2026-11-16)

Utgångspunkten är Google Fonts latinska delmängd av Newsreader med båda axlarna
(optisk storlek och vikt): 132 kB rak och 147 kB kursiv. Butiken använder bara en
del av det, så filerna är bantade med fonttools 4.68:

1. `fonttools varLib.instancer`: optisk storlek låst vid 40, vikt 500–700 (rak)
   och 500–600 (kursiv).
2. `pyftsubset`: tecknen U+0020–007E, U+00A0–00FF, U+2009, U+202F, U+2013, U+2014,
   U+2018, U+2019, U+201C, U+201D, U+2022, U+2026, U+20AC och U+2212, med
   funktionerna kern, liga, calt, ccmp, locl, mark, mkmk, tnum, lnum och pnum.

Resultat: `newsreader-rak.woff2` 36 kB och `newsreader-kursiv.woff2` 38 kB.

Ett tecken som saknas i filerna ritas med reservtypsnittet. Behövs fler tecken
eller vikter görs filerna om på samma sätt. `lib/typsnitt-reserv.test.ts` fäller
om en fil växer över 48 kB, så att hela typsnittet inte läggs in av misstag.
