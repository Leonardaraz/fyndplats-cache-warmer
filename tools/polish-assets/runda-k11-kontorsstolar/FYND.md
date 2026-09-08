# Runda K11 — vad kontaktarken och källtexterna sa

Kontaktarken lästes FÖRE första meningen (J1-regeln). Tre motsägelser föll ut,
och två av dem hade blivit fel påståenden i kundtexten.

## ☠️ `b78d4cc6` — källan motsäger SIG SJÄLV om måtten

```
i beskrivningen:  Maße: 70 x 70 x (111 – 121) cm (L x B X H)
i spec-tabellen:  62L x 68B x 111 – 121H cm
i måttritningen:  62 cm bredd · 68 cm djup · 111–121 cm höjd
```

Två av tre säger **62 × 68**. Beskrivningens 70 × 70 är den avvikande, och
`VALDA.md` hade tagit just den. Texten skrivs på 62 × 68 × 111–121.

⚠️ Båda talen står i källan, så **siffergrinden hade släppt igenom 70 × 70**.
Det som skiljer är ritningen — ännu ett fall där bara ögat på bilden avgör.

## ⚠️ `b78d4cc6` — värmen: källan säger SITSEN, bilden pekar på RYGGEN

Källtexten: *"Mit integrierter Heizfunktion im Sitz"* och *"6
Schwingmassagepunkte (4 in der Rückenlehne, 2 im Sitz)"*.

Marknadsbilden lägger den RÖDA punkten (värme) mitt i **ryggstödet** och de
blå (massage) i både rygg och sits.

Texten säger därför bara **"inbyggd värmefunktion"** utan att placera den.
Det är sant under båda läsningarna, och att välja en av dem hade varit att
påstå mer än underlaget bär.

## ⚠️ `f809b33e` — fotona ser ut som konstläder, källan säger MIKROFIBER

*"Die Mikrofaser ist atmungsaktiv…"* och *"Material: Mikrofaser (100 %
Polyester)"*. Bilderna visar ett matt svart material med stickade sömmar som
lätt läses som konstläder. Texten följer källan: **mikrofiber**.

Samma klass som `4de34dce` (#189), men åt andra hållet — där sa källan
konstläder och fotot visade vävt tyg. Slutsatsen är densamma: **materialet
går inte att läsa ur ett foto.**

## Vad bilderna gav som källan inte sa

- **`a6c80fe7`** — fotpallen står på en **egen fembensfot med hjul**, inte på
  fasta ben. Källan säger bara "dick gepolsterter Fußschemel". Måtten
  47 × 46 × 49 cm är fotpallens egna.
- **`5afb2c39`** — foten är **guldfärgad**. Källan säger bara
  "Elektroplattierte Fünf-Sterne-Metallbasis" utan färg. Bild 4 och 5 visar
  dessutom tydligt en **loopad bouclé/teddyväv** — källans
  "Teddy-Fleece-Optik" är alltså inte en liknelse utan en beskrivning.
- **`b78d4cc6`** — stolen har **ingen fotstöd**. Sju av åtta i rundan har det;
  den här har vippfunktion i stället.

## Sju tyska grafiker ur sex produkter

Se `bilder-bort.tsv`. `46f475c4` förlorar TVÅ och har bara **tre bilder kvar**
— samma klass som `7cdc167c` (#166) och en kandidat för ett eget spec-kort.

## ✅ Live-verifierat 2026-09-08

| kontroll | utfall |
| :-- | :-- |
| Orddiff mot källfilen | **0 på alla åtta** |
| FNV-1a-hash före/efter skrivning | **8/8 identiska** |
| Wix-revision (synlighet, variant, SKU, pris, bilder, alt, kategori, SEO, lager) | **8 granskade, 0 avvikelser** |
| Bilder | 40 → **33**, alla med svensk alt-text |
| Kategori | Hem & Inredning 8/8, massagelövet 7/7 |

☠️ **Och grinden är verifierad åt BÅDA hållen** — J2:s läxa är att ett svep kan
vara påslaget och blint. Tre fel planterades i de hämtade sidorna och alla tre
fälldes på rätt produkt:

```
alt-svepet   "Massagesessel mit Fußhocker…"        -> ALT/TYSKT 'mit'
SEO-svepet   fel <title> mot seo.tsv               -> SEO/TITEL avviker + SEO/title/TYSKT
sidsvepet    "Leverantören anger att sitsen…"      -> ORDDIFF ×8 + SIDA/LEVERANTOR
```

Återställt underlag ger 0 igen. En grind som inte KAN fälla räknas annars som
gjord.
