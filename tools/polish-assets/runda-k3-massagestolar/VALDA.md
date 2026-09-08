# Runda K3 — åtta massagestolar 1 439–2 319 kr

Massagestolarna valdes bort med flit i K2 ("de hör hemma i en egen runda där de
kan jämföras mot varandra — och mot de vi redan publicerat"). Det här är den
rundan. Urvalet är gjort mot **nio publicerade massage-kontorsstolar**, spec-rad
mot spec-rad, och mot varandra.

| id | pris | vad som skiljer den från de andra sju |
|---|---:|---|
| `45172748` | 2 319 | **166 cm liggyta** — längst i urvalet. 16 cm sits, ländvärme i tre steg, tryckt sammet |
| `a582967b` | 2 099 | **USB-driven** tvåpunktsmassage, 130°, lös nackkudde. Ingen nätadapter |
| `c7f46a23` | 2 049 | **Bär 135 kg** — högst i urvalet. Fickfjädrar i sitsen, kromad fot, rosa |
| `25ae2ad8` | 2 029 | **17 cm rygg** — tjockast. 155°, sitthöjd 56–64 cm, mikrofiber |
| `60b827f8` | 2 019 | **Sju vibrationspunkter** — enda i katalogen. 75,5 cm rygg, 90–155°, konstläder |
| `f81daa29` | 1 999 | **Sitthöjd 58–68 cm** och bara **62 cm djup** — hög och grund, ovanlig kombination |
| `73adb23e` | 1 969 | **Sitthöjd 41–49 cm** — lägst. Timer 15/30/45 min, nackstöd som flyttas 5 cm, 17 kg |
| `2a046f66` | 1 439 | **Gungfunktion**, inget fotstöd, USB, sidoficka. 115 kg — enda som inte är 120/135 |

## Dubblettprövningen: ingen kollision, men fyra publicerade delar en spec

Alla nio publicerade massage-kontorsstolars spec-tabeller lästes rad för rad.
Ingen av de åtta krockar. Det närmaste paret är `c7f46a23` (67 × 72 × 111–119)
mot den publicerade fyran (65 × 70 × 111–119): samma höjdspann men annan sits
(54 × 53 mot 54 × 51), annan sitthöjd (49–57 mot 45–52) och annan rygg.

☠️ **Fyndet var i stället bland de PUBLICERADE.** `72d1d195` (svart),
`773595bc` (grå), `7cf7473e` (mörkgrå) och `825c51f5` (brun) delar exakt
spec — samma stol i fyra färger, alla fyra live. Två utkast till hör till
familjen. Uppgift #184; det är Leonards beslut, inte poleringens.

SKU-kollen gjordes med **GET per produkt**, inte via sökning: `variantsInfo`
finns aldrig i sökprojektionen, och en kollisionskoll byggd på `search`
itererar en tom lista och kan inte fälla (#143). Nio produkter lästa, alla nio
bar `variantsInfo`, noll krockar mot rundans åtta.

## ☠️ Kontaktarket fällde tio bilder — tre gånger K2:s siffra

**Tio bilder med tysk text INBRÄND i pixlarna** låg kvar bland de fem importen
behöll. Jämför med samma urvalsregel i de två föregående rundorna:

| runda | familj | tyska grafiker av 40 |
|---|---|---:|
| K1 | kontorsstolar | **0** |
| K2 | kontorsstolar | 3 |
| K3 | massagestolar | **10** |

Alla tio sitter på position 4 eller 5 och är samma mall (`Kunstleder` ·
`Dicke Polsterung` · `High-End-Gaslift` · `Stabile Basis`) eller en
funktionsrubrik (`SCHWENKBARES DESIGN` · `VIBRATIONSMASSAGE` ·
`FLEXIBEL UND KOMFORTABEL` · `SCHAUKELFUNKTION`). Uppgift #185.

De är borttagna ur Wix (`bilder-bort.tsv`) och antalen är återlästa: 5 → 4, 5 →
3, 5 → 4, 5 → 4, 5 → 4, 5 → 3, 5 → 3. `f81daa29` hade fem rena och rördes inte.

## ☠️ Kontaktarket avgjorde också en fråga källtexten inte svarar på

`2a046f66`:s tyska text nämner ingen `Fußstütze`, men bild 1 och 2 visar något
framför sitsen som kan läsas som ett infällt fotstöd. Beskuren och förstorad
visar den att det är **sitskudden** — stolen har inget fotstöd alls, och det
är hela dess skillnad mot de andra sju. Hade texten skrivits ur källan ensam
hade frågan lämnats obesvarad på den enda sida där den är avgörande.

Bilden motsäger dessutom sin egen grafik: den borttagna bild 4 påstår
`Kunstleder` medan `Farbe`-raden och fotot visar vävt tyg. Grafiken är en
återanvänd mall.

## ☠️ Två stavfel, sökta i HELA batchen

`sitshöjden` (rätt: `sitthöjden`) stod i två filer, `i klämmet` (rätt:
`i kläm`) i en. Båda söktes över alla åtta texterna innan något skrevs — regeln
från `dögnsvarv`, som lagades tre gånger i tre rundor för att varje fynd
rättades där det syntes.

## Grindar

| grind | utfall |
|---|---|
| `gate.py` | 0 fynd i 8 filer (siffergrind mot `kallor-tal.json`) |
| `gate-alt.py` | 8 produkter, 30 alt-texter, 0 fynd |
| `gate-seo.py` | 0 fynd i 8 rader |
| `gate-lager.py` | 0 fynd, lägsta saldo 24 |
| `gate-lankar.py` | 0 fynd, 2 unika mål hämtade, 7 länkar inom rundan |
| `livegrind.py` | se README-raden nedan |

Siffergrinden fällde sex siffror i spec-tabellerna — `6 vibrationspunkter`,
`3 nivåer`, `2 vibrationspunkter`. Källan skriver dem som ORD (`Sechs`, `drei`,
`Zwei`), så digiten fanns inte i facit. Rättat genom att skriva ut dem på
svenska i alla åtta, inte genom att lägga till dem i `rad-tal.txt`.

`rad-tal.txt` bär bara `72` och `75` — standardhöjden på ett skrivbord, husets
egen placeringsanvisning.

Prisgrinden i `/api/admin/mapping`: **8 av 8 gröna** (workflowen avslutar med
`exit 1` på `stammer: false` och på `EJ AVGORBAR`, så en grön körning ÄR
verdikten). Samtliga körningar startade med `ref: claude/seo-polering-runbook-review-uq6fwl`
— aldrig `main`, se #181.

## Skrivningarna

Transkriptionshashen är en SPÄRR före skrivningen, inte en kontroll efter.
Åtta av åtta skrevs; återläsningen bekräftade namn, slug, hash, `visible`,
variantens `visible`, SKU och två SEO-taggar per produkt.

Alt-texter: 30 av 30 skrivna och återlästa, alla åtta fortfarande `visible`.

Kategori: `Hem & Inredning` + `Skönhet & Hälsa` + `Massage & Återhämtning` —
samma tre som tre av de publicerade massagestolarna bär. **24 av 24** enligt
bulk-svarets `bulkActionMetadata`, som är facit; läsprojektionen är eventuellt
konsistent och kan underrapportera.
