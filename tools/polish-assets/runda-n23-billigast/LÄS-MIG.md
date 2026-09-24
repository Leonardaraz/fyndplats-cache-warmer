# Runda N23 — åtta produkter, 1 349–1 359 kr

Åtta Aosom-utkast polerade och publicerade: julgransset, sammetssittbänk med
förvaring, leksaksförvaring, köksstolar i 2-pack, bambubadrumsskåp, skoskåp,
bågformad helkroppsspegel i guld och en 3-facks köksavfallshink. Fyra ligger
på 1 349 kr (samma platå som N21–N22), fyra på 1 359 kr — screeningen gick
alltså vidare till nästa prisnivå mitt i batchen i stället för att hålla en
enda platå hela vägen.

| id | produkt | SKU | pris |
|---|---|---|---:|
| 62f42597 | Julgransset i 3 storlekar, snötäckta konstgranar, 90–150 cm | FP-julgransset-3-storlekar | 1 349 kr |
| 46843188 | Sittbänk med förvaring, sammet, grön | FP-sittbank-sammet-gron | 1 349 kr |
| 3563d029 | Leksaksförvaring för barn med 6 lådor och bokhylla, vit | FP-leksaksforvaring-6-lador | 1 349 kr |
| 2aa6ff77 | Köksstolar i furu, 2-pack, vit | FP-koksstolar-furu-2pack | 1 349 kr |
| 9ebd976b | Badrumsskåp i bambu med två dörrar | FP-badrumsskap-bambu-2luckor | 1 359 kr |
| 5b5855b9 | Skoskåp för 12 par, med öppna hyllor, vit | FP-skoskap-12par-vit | 1 359 kr |
| 58f8338d | Helkroppsspegel i bågform, guld, 150 cm | FP-helkroppsspegel-bagform-guld | 1 359 kr |
| e42eca69 | Köksavfallshink med 3 fack, 3 x 15 L, svart | FP-avfallshink-3fack-svart | 1 359 kr |

Alla åtta: `needsAiPolish: false`, `draftStatus: "published"` — stämplat via
`/api/admin/mapping` (workflowen "Polering — läs och stämpla mappningsraden",
läge `stampla`), och varje stämpling verifierad genom en helt SEPARAT
`las`-körning mot mappningsraden (inte samma anrop som skrev). Prisgrinden
(`1,20 × landedCostSek`, charm99) `stämmer: true` på alla åtta, ingen
slutsåld, ingen låst. `aosomFreightShare` 0,305–0,464 — ingen över
0,5-tröskeln, men skoskåpet (`5b5855b9`, 0,464) och spegeln (`58f8338d`,
0,407) ligger nära och borde polerats mot slutet av en större batch.

## Två sakfel hittade och rättade under polering

- **`e42eca69` (avfallshinken): importens namn motsäger källan och den egna
  måttbilden.** Det tyska produktnamnet i `kallor.json` anger "3 x 20 L" per
  fack, men källtextens brödtext OCH produktens egen måttbild (källposition 3)
  visar tydligt tre fack om 15 liter vardera, alltså 45 liter totalt. Använde
  det verifierat korrekta talet (15 L/fack, 45 L totalt) genomgående i den
  svenska texten och namnet, och antecknade den visuellt avlästa
  totalvolymen i `foto-tal.txt` (`e42eca69 45 45L-ikonen på hinkens egen
  måttbild (källposition 3) — 3 fack à 15L`) så siffergrinden hade ett facit
  för talet.
- **SKU-kollision:** `FP-badrumsskap-bambu` (första valet för `9ebd976b`)
  kolliderade med `runda-n17-billigast/sku.tsv`s rad för `0caa8b84`. Verifierat
  via cross-round-grep att `0caa8b84` ("Badezimmerschrank, freistehend, 3
  Regalböden") och `9ebd976b` (två lamelldörrar, magnetlås, tippskydd) är
  OLIKA fysiska produkter — inte en intern dubblett, bara en namnkollision.
  Löst genom att döpa om till `FP-badrumsskap-bambu-2luckor`.

## Bilder: två tyska marknadsföringsgrafiker uteslutna

Samma defektklass som N22 dokumenterade (hela infografik-bilder, inte bara
bakgrundstysk text, i positioner `RENA_BILDPOSITIONER` annars klassar som
säkra): `3563d029` och `e42eca69` bar båda en tysk marknadsföringsgrafik i
källposition 4. Båda uteslöts ur `bilder.tsv`/`alt.tsv` innan någon
Wix-skrivning gjordes — ingen `bilder-bort.tsv` behövdes, samma hantering
som N22:s precedent. Ingen av de två produkterna tappade sin måttritning
(källposition 3 användes, sorterad sist i den slutliga bildordningen som
alltid).

## Gate-genomgång

| Gate | Resultat |
|---|---|
| `gate.py` (siffergrind mot `kallor.json`) | 0 fynd i 8 filer (1 icke-fällande varning: utskrivna räkneord) |
| `gate-axel.py` | 0 axelfel (icke-fällande: axelkonflikter i källan samt "mått aldrig med ord" — alla åtta anger mått via spec-tabell, inte prosa) |
| `gate-alt.py` | 0 fynd, 38 alt-texter |
| `gate-seo.py` | 0 fynd i 8 rader (fyra siffror först skrivna som ord i FAQ-svar rättades till decimalform: 62f42597, 3563d029, 2aa6ff77, e42eca69) |
| `gate-lager.py` | 0 fynd, 8 saldon, lägsta 7 (`46843188`) |
| `gate-sku.py` | 0 fynd i 8 rader (längsta 32 av 40 tecken) |
| `gate-superlativ.py` | 0 fynd, 0 kvitterade |
| `gate-lankar.py` | 0 fynd, 0 korslänkar i texterna |
| Steg 1 (text/namn/slug/visible/SEO) transkriberingsspärr | 0 avvikelser, 8 av 8 skrivna |
| Steg 1 separat återläsning (`hasha.py`/`aterlas.js`, `PLAIN_DESCRIPTION`) | 8 av 8 LIKA |
| Steg 2 (media) transkriberingsspärr | 0 avvikelser, 8 av 8 skrivna |
| Steg 2 oberoende läsning (`MEDIA_ITEMS_INFO`) | bildantal matchar `bilder.tsv` exakt på alla åtta (5/5/4/5/5/5/5/4) |
| Steg 3 (kategori) | 8/8 produkter bär rätt kategori(er), verifierat mot `directCategoriesInfo` |
| Steg 4 (variant-SKU, round-trip från FULL GET, sist och ensam) | 8 av 8, `visible` oförändrat på produkt OCH variant |
| Mappningsstämpling + oberoende `las`-verifiering | 8 av 8, båda leden bevisade, prisgrind `stämmer: true` på alla |
| `hamta-live.sh` (ISR-medveten, varm träff + skarpt svep) | 8/8 HTTP 200, age 70–71 s vid det skarpa svepet (bekräftar den egna omrenderingen, inte en gammal cache) |
| `livegrind.py` (orddiff mot källfil) | **0 avvikelser i den PUBLICERADE texten — 8/8 REN** |

## Kategorier

Sju av åtta fick en matchande lövkategori; köksstolarna fick bara toppen,
samma husregel som tidigare rundor ("trädet har ingen möbel-löv för
sittmöbler, och toppkategorin räcker då"):

| id | kategori(er) |
|---|---|
| 62f42597 (julgransset) | Hem & Inredning → Dekoration & Prydnad |
| 46843188 (sittbänk med förvaring) | Hem & Inredning → Förvaring & Organisering |
| 3563d029 (leksaksförvaring) | Hem & Inredning → Förvaring & Organisering |
| 2aa6ff77 (köksstolar) | Hem & Inredning (ingen löv — sittmöbel) |
| 9ebd976b (badrumsskåp) | Hem & Inredning → Badrum & Hemtextil |
| 5b5855b9 (skoskåp) | Hem & Inredning → Förvaring & Organisering |
| 58f8338d (helkroppsspegel) | Hem & Inredning → Badrum & Hemtextil |
| e42eca69 (avfallshink) | Kök & Husgeråd (ingen löv — matchar N15:s kökssoptunna-precedent) |

Kategorivalen är stämda mot direkta precedensfall i tidigare rundor:
skoskåp → Förvaring & Organisering (N15:s `163ce1e2`), sittbänk med förvaring
→ Förvaring & Organisering (N7:s `85c4c097`/N8:s `46f280f7`), helkroppsspegel
→ Badrum & Hemtextil (N20:s `e78ebbb6`) och kökssoptunna/avfallshink → bara
toppkategorin Kök & Husgeråd, utan löv (N15:s `300a9113`).

## Kort: medvetet uppskjutet, inte glömt

Samma kostnadsavvägning som tidigare N-rundor: inget `kort-filer.tsv` fanns i
rundans katalog, så `bygg-medieskrivning.py` skrev bildlistan exakt som
`bygg-media.py` lämnade den, utan tredje post.

## Sammanfattning

Alla åtta produkter är publicerade, stämplade och verifierade i tre separata
led: textinnehåll (återläsning mot fil-hash), mappningsstämpel (oberoende
`las`-körning) och den PUBLICERADE, ISR-färska sidan (`livegrind.py`, 8/8 REN,
0 avvikelser). Rundan räknas som klar utom faktakorten, som är en medveten
uppskjutning av samma skäl som N15–N22.
