# Kontaktarken — lästa FÖRE brödtexten (regeln från runda J1)

Arbetsgången är att bygga kontaktarket först och läsa det, inte att skriva
texten och sedan hämta bilder för alt-texterna. Det kostar ingenting extra —
bilderna ska ändå hämtas — och det flyttar granskningen till innan felet är
skrivet i stället för efter att det står i Wix.

## Tyska grafiker

| kort | rena | tyska | beslut |
|---|---:|---:|---|
| 358f4559 barnquad | 5 | 0 | — |
| bd24e5f9 sidobord | 5 | 0 | — |
| 7f1a45a6 fotbollsnät | 5 | 0 | — |
| b45d2544 byrå | 4 | **1** | pos 4 `VERSTELLBARE FUSSPOLSTER` bort |
| 62d2a0a9 väggdekor | 5 | 0 | — |
| 85c4c097 sittpuff | 5 | 0 | — |
| 77d3bfc2 sit-up-bänk | 5 | 0 | — |
| 8df525e3 agilityset | 4 | **1** | pos 4 `UPGRADE-SCHWIERIGKEIT` bort |
| 9ab9eda7 hantlar | 5 | 0 | — |

De två tyska bilderna tas bort och faktakortet tar deras plats, så båda
produkterna landar på fem mediaposter som resten.

## ☠️ f5964946 byttes ut — TRE av fem bilder var tyska

Frukostsetet (vattenkokare + fyrskivs brödrost) bar inbränd tysk text på
positionerna 3, 4 och 5:

```
pos 3   "Servieren Sie jederzeit heiße Getränke / 1700 ml ≈ 7 Tassen"
pos 4   "3 Funktionstasten / Stornieren / Aufwärmen / Auftauen"
pos 5   "Produktdetails / Krümelfach / Kalkfilter / Rutschfeste Füße"
```

Två rena bilder räcker inte för en produktsida, och tre egna kort är ett eget
jobb. Produkten är därför **flyttad, inte förkastad** — samma hylla som N6:s
`c7c74ab2`, som råkar vara samma sorts frukostset och föll på exakt samma sak.
Det är alltså inte en slump utan ett familjedrag: hushållsapparat-familjen bär
tyska funktionsgrafiker på 3–5.

☠️ **Och namnet var fel oavsett.** Produkten heter "Wasserkocher" i feeden men
ÄR ett set: vattenkokare OCH fyrskivs brödrost, vilket bara syns i bilden och i
källtextens brödtext. Hade jag skrivit texten före kontaktarket hade sidan hetat
"Vattenkokare 2 200 W" och beskrivit halva produkten.

Ersättare: `9ab9eda7` justerbara hantlar 2 × 5 kg (1 029 kr, gap 100) — största
gapet bland reserverna, och fem rena bilder.

## ☠️ HOMCOM är TRYCKT PÅ VARAN på två produkter — bilderna rörs inte

`7f1a45a6` (fotbollsnätet) bär husmärket på ramens stoppning i fyra av fem
bilder, och `77d3bfc2` (sit-up-bänken) på dynan.

Leonards regel gäller: **vi beskär inte bort märken som är tryckta på
produkten.** Avgörande-testet är om det skulle synas när kunden packat upp
varan — och det skulle det. Det som ska bort är märket i TEXTEN och i SKU:n,
inte i pixlarna.

## Vad bilderna sa som källan inte sa

- **`bd24e5f9`**: brickan LYFTS AV, och korgen under är en öppen trådkorg.
  Källan säger bara "mit Stauraum". Det som förvaras syns alltså igenom.
- **`85c4c097`**: källan säger `Farbe: Beige`, fotona visar gräddvitt. Och det
  är en oval SITTPUFF, inte en bänk — den står som fotpall vid en fåtölj.
- **`62d2a0a9`**: källans `Lieferumfang` säger "1 x Metall-Wandkunst" men
  produkten är TRE paneler. Namnet och beskrivningen säger tre; leveranslistan
  är den som har fel.
- **`358f4559`**: position 3 är en riktig måttritning med bara siffror, och
  `RACING`/`SPEED` är gjutet i plasten — alltså på varan, inte pålagt.
