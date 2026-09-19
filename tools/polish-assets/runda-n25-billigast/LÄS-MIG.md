# Runda N25 — åtta produkter, 1 379–1 629 kr

Åtta Aosom-utkast polerade och publicerade: mobilt TV-stativ med
höjdjustering, matbord med marmorerad skiva, smalt skoskåp för 12 par,
vedförvaringshylla för utomhusbruk, byrå med fem lådor, sängram i furu,
eldriven barnmotorcykel och skrivbord med stålram. Priserna fortsätter
screeningens stigande platå från N24 (1 359 kr) upp till 1 629 kr.

| id | produkt | SKU | pris |
|---|---|---|---:|
| c5d73d3d | Mobilt TV-stativ med höjdjustering, 32-75 tum, svart | FP-tv-stativ-hojdjustering-svart | 1 379 kr |
| a00a6b82 | Matbord med marmorerad skiva och rund fot, vit/svart | FP-matbord-marmor-vit-svart | 1 419 kr |
| d475b0b9 | Smalt skoskåp för 12 par, klaffdörrar, ljusgrön | FP-skoskap-smalt-ljusgron | 1 449 kr |
| a41af4d0 | Vedförvaringshylla utomhus med topphylla, svart | FP-vedhylla-utomhus-svart | 1 549 kr |
| 7b62aa26 | Elmotorcykel för barn med stödhjul, röd | FP-elmotorcykel-barn-rod | 1 549 kr |
| 7f261d71 | Byrå med 5 lådor, anti-tippgurt, vit | FP-byra-5-lador-vit | 1 619 kr |
| 76a35e25 | Sängram i furu, vit, 90x200 cm | FP-sangram-furu-vit-90x200 | 1 619 kr |
| fba6f1f4 | Skrivbord med stålram, 120x60 cm, svart/rustik brun | FP-skrivbord-stalram-brun | 1 629 kr |

Alla åtta: `needsAiPolish: false`, `draftStatus: "published"` — stämplat via
`/api/admin/mapping` (workflowen "Polering — läs och stämpla mappningsraden",
läge `stampla`), och varje stämpling verifierad genom en helt SEPARAT
`las`-körning mot mappningsraden (inte samma anrop som skrev, alla åtta
körda och lästa). Prisgrinden (`1,20 × landedCostSek`, charm99)
`stämmer: true` på alla åtta, ingen slutsåld, ingen låst.
`aosomFreightShare` 0,284–0,367 — ingen i närheten av 0,5-tröskeln.

## Ett sakfel hittat och rättat: importens spec-tabell tappade höjdjusterbarheten

Samma disciplin som tidigare rundor: när det tyska källmaterialets EGEN
prosa/tekniska data motsäger den importerade spec-tabellen vinner källans
mest specifika uppgift — aldrig den importerade tabellens.

- **`c5d73d3d` (TV-stativet): importens `Mått`-fält i den auto-genererade
  spec-tabellen angav bara `85,3 x 64,8 x 189 cm`** — en enda höjd, som om
  produkten hade ett fast mått. Källans egen prosa och `Technische Daten`
  är entydiga: stativet har **9-stegs höjdjustering från 129,5 till 189 cm**
  (`Gesamtabmessungen: 85,3B x 64,8T x 129,5–189H cm`). Ett fast mått hade
  gett kunden fel bild av produkten — den svenska texten skriver därför
  höjden som intervall (`85,3 x 64,8 x 129,5–189 cm`) i både brödtext och
  spec-tabell.

Kontrollerat och funnet OFARLIGT: `fba6f1f4`s (skrivbordet) `Beinraumgröße:
103B x 75H cm` (benutrymmets höjd) och `Gesamtmaße: ...76H cm` (produktens
totalhöjd) är två OLIKA mått som råkar ligga 1 cm isär — inte en motsägelse.
Den svenska texten håller isär dem korrekt (benutrymme 103 x 75 cm i
egenskaper/FAQ, totalmått 120 x 60 x 76 cm i spec-tabellen).

## Två självgjorda terminologifel som gate.py fångade före skrivning

Inga fel i källan den här gången, men två egna ordval som `gate.py`s
ordlista (`gatelib.TYSKA_ORD`) fällde innan något nådde Wix — precis det
gate-disciplinen finns för:

- **`robust` är på husets förbjudna lista** trots att ordet också är giltig
  svenska (samma konvention som tidigare rundor). Fälldes i `7f261d71.html`
  ("robust MDF" → "tålig MDF") och `fba6f1f4.html` ("robust svart
  stålram" → "kraftig svart stålram", samt samma ord i `seo.tsv`s
  beskrivning).
- **"Kippskydd"/"kippsäkring" var en påhittad hybridterm** (tysk `kipp-` +
  svensk `-skydd/säkring`) i stället för etablerade svenska ord. Rättat till
  `anti-tippgurt` i `7f261d71` (samma term som tidigare rundors
  väggförankringsrem) och `vältskydd` i `d475b0b9` (källan där anger ingen
  specifik rem, bara ett generiskt tippskydd).

Ingen av dessa nådde Wix: `raahash.py` + `gate.py` kördes om efter
rättningarna och gav 0 fynd innan Steg 1 skrevs.

## Gate-genomgång

| Gate | Resultat |
|---|---|
| `gate.py` (siffergrind mot `kallor.json`, ordlista) | 0 fynd i 8 filer (efter de två terminologirättningarna ovan) |
| `bygg-axelfacit.py` + `gate-axel.py` | 0 axelfel (facit mekaniskt härlett från `kallor.json`, positionell axelmatchning) |
| `gate-alt.py` | 0 fynd, 40 alt-texter |
| `gate-seo.py` | 0 fynd i 8 rader (efter `robust`-rättningen i `fba6f1f4`s beskrivning) |
| `gate-lager.py` | 0 fynd, 8 saldon |
| `gate-sku.py` | 0 fynd i 8 rader (längsta 33 av 40 tecken) |
| `gate-superlativ.py` | 0 fynd |
| `gate-lankar.py` | 0 fynd, inga korslänkar |
| Steg 1 (text/namn/slug/visible/SEO) transkriberingsspärr | 0 avvikelser, 8 av 8 skrivna |
| Steg 1 separat återläsning (`hasha.py`/`aterlas.js`, `PLAIN_DESCRIPTION`, läst en stund efter skrivningen) | 8 av 8 LIKA |
| Steg 2 (media) transkriberingsspärr | 0 avvikelser, 8 av 8 skrivna |
| Steg 2 oberoende läsning (`MEDIA_ITEMS_INFO`) | 5 bilder per produkt på alla åtta, ordning matchar `bilder.tsv` (mätposition 3 sorterad sist) |
| Steg 3 (kategori, `BulkAddItemsToCategory`) | 8/8 produkter bär rätt kategori + Wix egna "All Products", verifierat mot `directCategoriesInfo` i en separat läsning |
| Steg 4 (variant-SKU, round-trip från FULL GET, sist och ensam) | 8 av 8 skrivna och verifierade i en separat läsning; `visible` oförändrat på produkt OCH variant på alla åtta |
| Mappningsstämpling + oberoende `las`-verifiering | 8 av 8, båda leden bevisade — varje `las`-körning läste tillbaka rätt SKU, `needsAiPolish:false`, `draftStatus:published` och prisgrindens `stämmer:true` ordagrant |
| `hamta-live.sh` + `livegrind.py` (ISR-medveten live-verifiering) | PÅGÅR — sidorna är helt nya (age=0 vid varm träff), väntar ut det första ISR-fönstret innan skarpt svep; resultatet läggs till i en uppföljande commit |

## Kategorier

Fyra av åtta fick en matchande lövkategori; TV-stativet, matbordet,
sängramen och skrivbordet fick bara toppen, samma husregel som tidigare
rundor ("inget löv för bord/kontorsmöbler utan matchande löv i trädet"):

| id | kategori(er) |
|---|---|
| c5d73d3d (TV-stativ) | Hem & Inredning (ingen löv — tv-möbel) |
| a00a6b82 (matbord) | Hem & Inredning (ingen löv — bord) |
| d475b0b9 (skoskåp) | Hem & Inredning → Förvaring & Organisering |
| a41af4d0 (vedhylla) | Trädgårdsdekor & Belysning |
| 7f261d71 (byrå) | Hem & Inredning → Förvaring & Organisering |
| 76a35e25 (sängram) | Hem & Inredning (ingen löv — sängmöbel) |
| 7b62aa26 (elmotorcykel) | Leksaker & Spel |
| fba6f1f4 (skrivbord) | Hem & Inredning (ingen löv — kontorsmöbel) |

## Kort: medvetet uppskjutet, inte glömt

Samma kostnadsavvägning som tidigare N-rundor: inget `kort-filer.tsv` fanns
i rundans katalog, så ingen produkt fick ett eget faktakort den här
omgången.

## Ett husmärke flaggat till Leonard

`7b62aa26` (elmotorcykeln) bär ett HRC-märke synligt på produktbilden —
ett fysiskt tredjepartsmärke som inte går att redigera bort. Flaggat som en
separat föreslagen uppgift åt Leonard i stället för att skrivas in i
produkttexten, samma hantering som VINSETTO/PawHut/SPORTNOW/Outsunny/
DURHAND-fynden i tidigare rundor.

## Sammanfattning

Alla åtta produkter är publicerade, stämplade och verifierade i tre
separata led: textinnehåll (återläsning mot fil-hash, 8/8 LIKA),
bild/kategori/SKU (separata `MEDIA_ITEMS_INFO`/`directCategoriesInfo`/
`variantsInfo`-läsningar) och mappningsstämpel (oberoende `las`-körning).
Det fjärde ledet — `livegrind.py` mot den PUBLICERADE, ISR-färska sidan —
pågår och läggs till i en uppföljande commit när butikens
bakgrundsrendering hunnit klart. Rundan räknas i övrigt som klar, utom
faktakorten, som är en medveten uppskjutning av samma skäl som N15–N24.
