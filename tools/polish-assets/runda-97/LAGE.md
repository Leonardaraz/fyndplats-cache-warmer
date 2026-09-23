# Runda 97 — läge

Sex foderstationer för hund ur Aosom-familjen. Familjen valdes på mätning:
26 utkast / 0 publicerade — den enda kollisionsfria familjen i kön.

| id8 | slug | mått | status |
|---|---|---|---|
| `e8102582` | `upphojd-matskal-hund-hojdjusterbar-11-33-cm` | 40,5 × 22 × 39 | **LIVE** |
| `1fc55b3d` | `matskalsstall-hund-fyra-hojder-lutbart` | 48 × 26 × 36,5 | **LIVE** |
| `2e2b2366` | `matplats-hund-tre-hojder-kaffebrun` | 54 × 31,5 × 47 | **LIVE** |
| `868cc038` | `matskap-hund-34-cm-tva-dorrar` | 60 × 30 × 34 | **LIVE** |
| `7628983b` | `matskap-hund-42-cm-30-liter` | 60 × 30 × 42 | **LIVE** |
| `75556831` | `husdjursskap-82-cm-matplats-i-lada` | 61 × 35,5 × 82 | **LIVE** |

## Klart och verifierat mot Wix

Steg 1–7, 9, 10 och 12 är gjorda. Klart-kriteriet kördes mot Wix och gav
**0 brister** på hash, slug, galleriets antal och alt-texter, kortets plats,
korslänkar, kategori, husmärke, artikelnummer, namn- och metalängd samt
sifferstil.

* **Texterna** — alla sex hash-exakta (`facit.json`), 2 110–2 377 synliga tecken.
* **Galleriet** — 6/5/6/6/6/6 bilder, svensk alt-text på varje, Fyndplats-kortet
  på plats 3, måttritningen efter det.
* **Kategori** — `Husdjur` + `Mat & Vattenskålar` på alla sex, 2/2 per produkt
  bekräftat per kategori (inte bara `totalSuccesses`).
* **Korslänkar** — fyra sidor länkar till 868cc038, som fick ny slug.

## ✅ KLAR — publicerad 2026-09-07

GitHub-kopplingen kom tillbaka mitt i sessionen och de tre sista stegen kördes:

| steg | vad | kvitto |
|---|---|---|
| 8 | Nya svenska SKU:er till Wix-varianterna | sex unika, `visible` explicit på produkt OCH variant |
| 13 | Publicering | `visible: true` på båda nivåerna, alla sex |
| — | Stämpling via `polish-mapping.yml` | `needsAiPolish:false`, `draftStatus:published`, `variantSkus` |

`las` efteråt på `868cc038` läser tillbaka `sku: FP-matskap-34-cm-tva-dorrar`,
`draftStatus: published`, `needsAiPolish: false` — och prisgrinden står kvar på
`stammer: true` (781,62 → 939, charm99).

Live-kontroll: alla sex svarar 200 med rätt titel och faktakortet i galleriet.

☠️ **Två fällor fångades i sista stund, båda av runbokens egna regler:**

1. **`1fc55b3d` och `2e2b2366` hade `variant.visible: false`.** De två är
   precis de som fick extra PATCHar under rundan (kortbytet), och produktens
   `visible:false` hade speglats ned. Hade de publicerats rakt av vore sidan
   live men varan omöjlig att lägga i varukorgen — och det syns inte i
   produktvyn. Steg 8 och Steg 13 sätter nu `visible: true` på båda nivåerna.

2. **Tre av sex delade SKU `FP-futterstation-erhohte`** — importens kända
   krock (#272), där 24-teckenkapningen äter det som skiljer produkterna åt.
   De nya svenska SKU:erna är unika, kontrollerat i skrivningen.

De sex SKU:erna:

```
FP-upphojd-matskal-11-33          e8102582
FP-matskalsstall-fyra-hojder      1fc55b3d
FP-matplats-tre-hojder-kaffebrun  2e2b2366
FP-matskap-34-cm-tva-dorrar       868cc038
FP-matskap-42-cm                  7628983b
FP-husdjursskap-82-cm             75556831
```

## Fynden

Se `STEG1-2.md`, `STEG4.md` och commit-meddelandena. De fyra som är värda att
minnas:

1. ☠️ **`868cc038` såldes som "skjutdörrar" — den har dörrar på GÅNGJÄRN.**
   Tre svarta gångjärnsplattor syns i produktbilden, och måttritningen visar
   båda dörrarna utslagna utåt. Felet satt i namn, slug, SEO, ingress, en
   egenskapsrad, ett helt skötselstycke om ett spår som inte finns,
   kortrubriken, alt-texten och fyra syskonsidors korslänk.
2. ☠️ **`7628983b`:s förvaring är en låda som dras ut från kortsidan.** Bild 5
   visar den utdragen, bild 1 och 2 handtaget. Texten sa bara "inuti finns
   30 liter" och lämnade kunden att gissa; alt-texten kallade bild 5 "sett
   från sidan".
3. ☠️ **Tre kortrubriker skrev spec-tabellens starkaste TAL i stället för
   fotots starkaste MOTIV.** Ingen var osann — därför var de svåra att se.
4. ☠️ **Fjorton kommalistor av tal**, varav en i meta-beskrivningen. Regeln
   fanns i runboken men inte i rundans lint; den fångades först av
   klart-kriteriet mot Wix.

⚠️ `75556831` bär husmärket FYSISKT på lådfronten. Leonards regel gäller:
märket sitter på varan, bilden rörs inte, och det nämns aldrig i text eller
alt-text.

⚠️ `868cc038` har två oförenliga mankhöjder (bild 50–60 cm, brödtext 55–65 cm).
Ingen av dem skrivs; sidan anger höjden till skålen (34 cm) i stället.

## Mätningar som är nya för huset

* ☠️ **`plainDescription` ligger inte i GET:ens standardprojektion.** Utan
  `?fields=PLAIN_DESCRIPTION` saknas fältet helt — min verifiering hashade
  tomma strängen och rapporterade `hashOK: false` på en skrivning som gått
  igenom. Samma asymmetri som `MEDIA_ITEMS_INFO`.
* ☠️ **Två fält i samma `?fields=` ger 400.** `PLAIN_DESCRIPTION,MEDIA_ITEMS_INFO`
  svarar *"Failed to parse JSON or deserialize protobuf message"*. Ett fält
  per anrop.
* ☠️ **Transkriptionshashen är BLIND för länkar.** `synlig()` strippar taggar,
  så de fyra syskonsidorna hashar identiskt före och efter att deras href
  pekats om. Länkar måste räknas separat.
* **`UploadImageToWixSite` svarar i samma ordning som anropet** — mätt, inte
  antaget: alla nio uppladdade filer är byte-identiska med den lokala fil de
  påstås vara.
