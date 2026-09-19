# Runda N24 — åtta produkter, 1 359 kr

Åtta Aosom-utkast polerade och publicerade: byrå med fyra lådor, byrå med
nio lådor i tyg, marsvinsbur med lekgård, sminkbord med spegel, skåp för
tvättmaskin, parkbänk i stål, ett frukostset (vattenkokare/brödrost/
äggkokare) och ett fällbart väggskrivbord. Alla åtta på EXAKT samma pris som
N23:s övre hälft (1 359 kr) — screeningen höll alltså kvar samma prisplatå i
stället för att gå vidare till en ny nivå.

| id | produkt | SKU | pris |
|---|---|---|---:|
| 32211896 | Byrå med 4 lådor, grifflös design, vit | FP-byra-4-lador-grifflos-vit | 1 359 kr |
| 859644b3 | Byrå med 9 lådor i tyg, guldfärgade handtag, cremevit | FP-byra-9-lador-tyg-cremevit | 1 359 kr |
| 7ca4d50b | Marsvinsbur med lekgård, balkong och ramp | FP-marsvinsbur-lekgard | 1 359 kr |
| 67be1d62 | Sminkbord med spegel, låda och sidohylla, vit | FP-sminkbord-spegel-vit | 1 359 kr |
| 4e380507 | Skåp för tvättmaskin, öppna hyllor, vit | FP-skap-tvattmaskin-vit | 1 359 kr |
| 477de9da | Parkbänk i stål, 2-sits, svart | FP-parkbank-stal-svart | 1 359 kr |
| 2cd39c3c | Vattenkokare, brödrost och äggkokare i set, svart | FP-frukostset-3-delar-svart | 1 359 kr |
| 0c27c71d | Fällbart väggskrivbord med skrivtavla, svart | FP-vaggskrivbord-fallbart-svart | 1 359 kr |

Alla åtta: `needsAiPolish: false`, `draftStatus: "published"` — stämplat via
`/api/admin/mapping` (workflowen "Polering — läs och stämpla mappningsraden",
läge `stampla`), och varje stämpling verifierad genom en helt SEPARAT
`las`-körning mot mappningsraden (inte samma anrop som skrev). Prisgrinden
(`1,20 × landedCostSek`, charm99) `stämmer: true` på alla åtta, ingen
slutsåld, ingen låst. `aosomFreightShare` 0,294–0,464 — ingen över
0,5-tröskeln, men sminkbordet (`67be1d62`, 0,464) ligger nära och borde
polerats mot slutet av en större batch.

## Fyra sakfel hittade och rättade under polering

Samma disciplin som tidigare rundor: när det tyska källmaterialets EGEN
prosa/måttbild motsäger den importerade spec-tabellen vinner källans mest
specifika uppgift — aldrig den importerade tabellens.

- **`32211896` (byrån med 4 lådor): importens `Mått`-fält använde LÅDANTALET
  som dimension.** Spec-tabellen sa `Mått: 4 Schubladen` ("4 lådor") i
  stället för ett faktiskt mått. Källans egen `Gesamtabmessungen: 55B x 33T
  x 80H cm` gav det riktiga talet, och den svenska texten skrev `55 x 33 x
  80 cm`.
- **`4e380507` (skåpet över tvättmaskinen): importens `Mått`-fält motsade
  källans egen totalmåttrad.** Spec-tabellen angav `90L...` medan källans
  `Gesamtabmessungen: 96B x 60T x 90,5H cm` är det korrekta måttet —
  bekräftat oberoende av `axelfacit.json`s mekaniskt härledda tal (96 bredd).
  Den svenska texten skrev `96 x 60 x 90,5 cm`.
- **`7ca4d50b` (marsvinsburen): importens färgfält motsade källans egen
  brödtext OCH produktbilderna.** Spec-tabellen sa `Weiß, Grün, Braun`
  ("vit, grön, brun") medan källans egen `Farbe: Weiß+Beige+Blau` stämmer
  med det som faktiskt syns på bilderna (vit bur, beige bottenplatta, blått
  gömställe i tyg). Den svenska texten skrev `Vit, beige, blå`.
- **`477de9da` (parkbänken): introtexten motsade den egna tekniska
  specen.** Inledningen påstod bärighet "bis zu 280 kg" medan
  `Technische Daten` uttryckligen anger `Max. Belastbarkeit: 240 kg` — den
  mer specifika tekniska uppgiften (240 kg) användes genomgående, i både
  brödtext och FAQ-svar.

## Gate-genomgång

| Gate | Resultat |
|---|---|
| `gate.py` (siffergrind mot `kallor.json`) | 0 fynd i 8 filer (2 icke-fällande varningar: utskrivna räkneord "tre"/"två" utan sifferkälla, benigna designfakta) |
| `gate-axel.py` | 0 axelfel (icke-fällande: 5 axelkonflikter i källan ["TYSKAN GÄLLER"], 21 "mått aldrig med ord" — alla åtta anger mått via spec-tabell, inte prosa) |
| `gate-alt.py` | 0 fynd, 36 alt-texter |
| `gate-seo.py` | 0 fynd i 8 rader |
| `gate-lager.py` | 0 fynd, 8 saldon, lägsta 8 |
| `gate-sku.py` | 0 fynd i 8 rader (längsta 31 av 40 tecken) |
| `gate-superlativ.py` | 0 fynd, 0 kvitterade |
| `gate-lankar.py` | 0 fynd, 0 korslänkar i texterna |
| Steg 1 (text/namn/slug/visible/SEO) transkriberingsspärr | 0 avvikelser, 8 av 8 skrivna |
| Steg 1 separat återläsning (`hasha.py`/`aterlas.js`, `PLAIN_DESCRIPTION`) | 8 av 8 LIKA |
| Steg 2 (media) transkriberingsspärr | 0 avvikelser, 8 av 8 skrivna |
| Steg 2 oberoende läsning (`MEDIA_ITEMS_INFO`) | bildantal matchar `bilder.tsv` exakt på alla åtta (5/5/3/5/5/5/3/5) |
| Steg 3 (kategori) | 8/8 produkter bär rätt kategori(er), verifierat mot `directCategoriesInfo` |
| Steg 4 (variant-SKU, round-trip från FULL GET, sist och ensam) | 8 av 8, `visible` oförändrat på produkt OCH variant |
| Mappningsstämpling + oberoende `las`-verifiering | 8 av 8, båda leden bevisade, prisgrind `stämmer: true` på alla |
| `hamta-live.sh` (ISR-medveten, varm träff + skarpt svep) | 8/8 HTTP 200, age 14–15 s vid det skarpa svepet (bekräftar den egna omrenderingen, inte en gammal cache) |
| `livegrind.py` (orddiff mot källfil) | 8/8 REN, 0 avvikelser i den PUBLICERADE texten |

## Bilder: två tyska marknadsföringsgrafiker uteslutna

Samma defektklass som N22–N23 dokumenterade (hela infografik-bilder, inte
bara bakgrundstysk text, i positioner `RENA_BILDPOSITIONER` annars klassar
som säkra): `7ca4d50b` och `2cd39c3c` bar båda tyska
marknadsföringsgrafiker i källpositionerna 4–5. Båda produkterna fick därför
bara 3 bilder i stället för 5 — uteslutna ur `bilder.tsv`/`alt.tsv` innan
någon Wix-skrivning gjordes, samma hantering som N22–N23:s precedent. Ingen
av de två produkterna tappade sin måttritning (källposition 3 användes,
sorterad sist i den slutliga bildordningen som alltid).

## Kategorier

Sex av åtta fick en matchande lövkategori; sminkbordet och väggskrivbordet
fick bara toppen, samma husregel som tidigare rundor ("inget löv för
bord/kontorsmöbler utan matchande löv i trädet"):

| id | kategori(er) |
|---|---|
| 32211896 (byrå 4 lådor) | Hem & Inredning → Förvaring & Organisering |
| 859644b3 (byrå 9 lådor) | Hem & Inredning → Förvaring & Organisering |
| 7ca4d50b (marsvinsbur) | Husdjur → Burar, Kläder & Tillbehör |
| 67be1d62 (sminkbord) | Hem & Inredning (ingen löv — bord) |
| 4e380507 (tvättmaskinsskåp) | Hem & Inredning → Badrum & Hemtextil |
| 477de9da (parkbänk) | Trädgård & Utemöbler → Utemöbler |
| 2cd39c3c (frukostset) | Kök & Husgeråd → Köksmaskiner & Apparater |
| 0c27c71d (väggskrivbord) | Hem & Inredning (ingen löv — kontorsmöbel) |

## Kort: medvetet uppskjutet, inte glömt

Samma kostnadsavvägning som tidigare N-rundor: inget `kort-filer.tsv` fanns
i rundans katalog, så `bygg-medieskrivning.py` skrev bildlistan exakt som
`bygg-media.py` lämnade den, utan tredje post.

## Sammanfattning

Alla åtta produkter är publicerade, stämplade och verifierade i tre
separata led: textinnehåll (återläsning mot fil-hash), mappningsstämpel
(oberoende `las`-körning) och den PUBLICERADE, ISR-färska sidan
(`livegrind.py`, 8/8 REN, 0 avvikelser). Rundan räknas som klar utom
faktakorten, som är en medveten uppskjutning av samma skäl som N15–N23.
