# Städrundan 2026-09-27

Leonards uppdrag: *"ta en städrunda inga tyska ord rundan etc…"*. Rundan svepte alla publicerade
produktsidor efter det som inte ska stå på en svensk produktsida och rättade det via skrivplan
och workflow, aldrig för hand.

**Svepet letade efter:** tyska rester, rundans egna ord ("rundans", "omgången"), leverantörs-
och garderingsfraser, lagerland och EU-lager, ✔/⚠ och osynliga tecken, stavfel, raden
"Artikelnummer: FP-…", tyska eller tomma alt-texter, bilder med inbränd tysk text eller
husmärke, egna kort som läcker källan, och jämförelser med andra varor i vårt sortiment.

## Rundorna

| runda | sidor | vad | skriven och verifierad |
|---|--:|---|---|
| `runda-stadning-01` | 20 | våg 1: 4 textställen, 92 alt-texter, 9 bilder strukna, 297 ✔/⚠/osynliga tecken | 20 av 20 |
| `runda-stadning-02` | 20 | våg 1: 10 textställen, 83 alt-texter, 12 bilder strukna, 295 ✔/⚠/osynliga tecken | 20 av 20 |
| `runda-stadning-03` | 20 | våg 1: 32 textställen, 3 alt-texter, 2 bilder strukna, 4 SKU:er, 28 ✔/⚠/osynliga tecken | 20 av 20 |
| `runda-stadning-04` | 20 | våg 1: 32 textställen, 18 ✔/⚠/osynliga tecken | 20 av 20 |
| `runda-stadning-05` | 20 | våg 1: 51 textställen, 3 SKU:er, 2 ✔/⚠/osynliga tecken | 20 av 20 |
| `runda-stadning-06` | 20 | våg 1: 26 textställen | 20 av 20 |
| `runda-stadning-07` | 15 | våg 1: 35 textställen, 5 SKU:er | 15 av 15 |
| `runda-stadning-08` | 20 | våg 2: 53 textställen | 20 av 20 |
| `runda-stadning-09` | 20 | våg 2: 51 textställen, 13 alt-texter, 1 bild struken, 2 SKU:er | 20 av 20 |
| `runda-stadning-10` | 20 | våg 2: 50 textställen, 5 alt-texter, 1 SKU | 20 av 20 |
| `runda-stadning-11` | 20 | våg 2: 60 textställen, 12 alt-texter, 1 SKU | 20 av 20 |
| `runda-stadning-12` | 20 | våg 2: 67 textställen, 3 SKU:er | 20 av 20 |
| `runda-stadning-13` | 14 | våg 2: 49 textställen | 14 av 14 |
| `runda-stadning-14` | 6 | läckande kort: 7 bilder strukna | 6 av 6 |
| `runda-stadning-15` | 11 | våg 3: 13 textställen | 11 av 11 |
| **alla** | **266** (255 unika) | 533 textställen, 208 alt-texter, 31 bilder strukna, 19 SKU:er, 640 ✔/⚠/osynliga tecken | |

Körningarna är nummer 105–135 av workflowen **"Polering — skriv en runda till Wix"**, 2026-09-27
13:09–14:44 UTC, och alla 31 är gröna. En skrivning blir grön först när den separata återläsningen
har verifierat varje produkt och stämplingen har gått igenom.

Varje runda har en `LÄS-MIG.md` med vad som ändrades, och `handrattelser.tsv` med före och efter
ordagrant. `fore/` är ögonblicksbilden rättelserna gjordes mot.

## Så kontrollerades det

- `diffgrind.py` REN på varje runda: inga nya fynd och inga fynd kvar i målklasserna.
- `valideraPlan` godkänner varje plan. Varje produkt hade samma revision i Wix som i
  ögonblicksbilden när rundan byggdes, och för rundorna 14 och 15 kontrollerades det igen
  direkt före skrivningen (17 av 17).
- Workflowens egen återläsning: se kolumnen ovan.
- Livekontroll: se nedan.

## Livekontrollen

Sidorna hämtades genom butiken efter skrivningen med `hamta-live.sh`. Först kommer en träff som
startar omrenderingen, sedan fem minuters paus och sist den skarpa hämtningen. Rundorna 01–08 hämtades
14:15–14:38 UTC. Rundorna 09–15 hämtades 14:44–15:03 UTC, efter att runda 15 skrivits. Runda 15:s elva
sidor finns bara i den högra kolumnen, med runda 15:s filer som facit.

| | rundorna 01–08 | rundorna 09–15 |
|---|--:|--:|
| sidor hämtade genom butiken | 144 | 111 |
| publicerad text ordagrant = källfilen (`livegrind.py`) | 144 | 111 |
| `livekoll.py` OK (namn, SEO, pris, i lager, brödsmula) | 134 | 98 |
| alt-texter som står på sidan | 787 av 787 | 617 av 617 |
| visar slutsåld, saldo 0 redan före rundan | 10 av 10 | 12 av 12 |
| saknar en eller flera flikar (äldre, se nedan) | 46 | 21 |

**Allt som står på sidorna är det rundorna skrev:** 255 av 255 sidor har ordagrant samma text som
källfilen. Alla 1 404 alt-texter står på sidan.

`livekoll.py` godkänner 232 av 255 sidor. De 23 som faller är alla äldre än städningen:

- **22 visar slutsåld**, och alla 22 hade saldo 0 redan i ögonblicksbilden. Sidan stämmer alltså.
- **`82bf19ed`:** metabeskrivningen var avklippt mitt i en mening redan före rundan ("…i ett inre
  rum på"). Filen har ett blanksteg sist som butiken tar bort, och det är den enda skillnaden.

⚠️ **14 av de 255 metabeskrivningarna slutar mitt i ett ord eller en mening** ("…timer på 1",
"…en halogenlamp", "…ett handtag oc"). Alla klipptes vid 155 tecken före städningen. På fem av dem
tog rundan bort en jämförelse ("— bredast av våra sju") men lämnade det avklippta slutet kvar. De
lagas i en egen liten runda: klipp tillbaka till senaste hela satsen och avsluta med punkt.

**Äldre och utanför städningen:**

- **67 sidor saknar en eller flera flikar** (*Tekniska specifikationer*, *Användning och skötsel*,
  *Vanliga frågor*). Rubriken saknas både i källfilen och i ögonblicksbilden, så felet fanns före
  rundan och står i `grind-undantag.txt`. Att laga det betyder att skriva ny text, inte att rätta.
- **Kyrilliska tecken på `163bd142`:** "Х.Е." är initialerna i en kundrecension, inte vår text.

**`livekoll.py` är rättad under kontrollen.** Den jämförde bara det första steget i brödsmulan
med rundans kategorier. Sedan #647 visar butiken *Hem / förälder i trädet / smal kategori / produkt*,
och föräldern är ofta en kategori produkten inte ligger i. Därför föll tio korrekta sidor. Nu räcker
det att något steg mellan Hem och produkten är en av rundans kategorier. Kontrollen fäller
fortfarande när den rätta kategorin byts mot en fel.

## Sidor som skrivvägen inte når (37)

Skrivplanen tar bara produkter med **en variant**. `valideraPlan` fäller dessutom ord med formen
tre tecken, bindestreck och minst tre till, med en siffra någonstans (`FORM` i koden), **även i en
slug som inte ändras**. Båda gränserna är kod i `lib/polish/skrivplan.ts` som körs i produktion,
så en lagning når först efter en merge.

Förslag, inte gjort:

1. Kontrollera formen bara i text som skrivs, och jämför slugen mot den som redan ligger i Wix.
2. Låt en flervariantsprodukt gå igenom text-, media- och kategoristegen och hoppa över SKU-steget.

### 20 sidor vars slug fälls av skrivplanens formkontroll

| slug | ordet som fäller | vad som behöver rättas |
|---|---|---|
| `tresitssoffa-212-manchester-stalram-450kg` | `212-manchester` | rundans egna ord |
| `minidrivhus-i-tra-90x52-cm` | `tra-90x52` | ✔/⚠-tecken, tyska ord |
| `drivbank-tra-polykarbonat-gra-90x46x40-cm` | `gra-90x46x40` | ✔/⚠-tecken |
| `smadjursstall-230-natur` | `230-natur` | leverantörs- eller garderingsfras |
| `julgran-120-cm-i-lykta-med-100-led` | `med-100` | rundans egna ord |
| `smadjursstall-230-gra` | `230-gra` | leverantörs- eller garderingsfras |
| `vaxthusskap-i-tra-58x44-cm` | `tra-58x44` | ✔/⚠-tecken, tyska ord |
| `snotackt-julgran-180-cm-med-250-led` | `med-250` | rundans egna ord |
| `vaggnara-fatolj-brun-150-grader` | `150-grader` | rundans egna ord |
| `kontorsstol-liggplats-155-grader-vit` | `155-grader` | jämförelse med vårt sortiment (våg 2) |
| `skapbil-byggsats-480-delar` | `480-delar` | jämförelse med vårt sortiment (våg 2) |
| `massagestol-gra-mikrofiber-155-grader` | `155-grader` | jämförelse med vårt sortiment (våg 2) |
| `studsmatta-barn-163-rod` | `163-rod` | jämförelse med vårt sortiment (våg 2) |
| `gamingstol-170-grader` | `170-grader` | jämförelse med vårt sortiment (våg 2) |
| `studsmatta-barn-122-bla` | `122-bla` | jämförelse med vårt sortiment (våg 2) |
| `snogran-180-cm-150-led-fortand` | `150-led` | jämförelse med vårt sortiment (våg 2) |
| `studsmatta-barn-163-svart` | `163-svart` | jämförelse med vårt sortiment (våg 2) |
| `elbil-barn-bmw-i4-12v-115-cm` | `12v-115` | jämförelse med vårt sortiment (våg 2) |
| `badrumsspegel-led-90x70-bluetooth-klocka` | `led-90x70` | jämförelse med vårt sortiment (våg 2) |
| `studsmatta-barn-163-bla` | `163-bla` | jämförelse med vårt sortiment (våg 2) |

### 17 produkter med flera varianter

| slug | varianter | vad som behöver rättas |
|---|--:|---|
| `utsvangda-leggings-rynkad-bakdel` | 45 | lagerland eller EU-lager |
| `halterneck-linne-rynkad-framsida` | 113 | leverantörs- eller garderingsfras |
| `fatolj-fotstod-5-lagen-bjork` | 2 | jämförelse med vårt sortiment (våg 2) |
| `pcp-handpump-luftgevar-4500-psi-3-stegs` | 2 | osynligt tecken |
| `utsvangda-yogabyxor-korsad-midja` | 75 | lagerland eller EU-lager |
| `uppblasbart-campingtalt` | 3 | kyrilliskt tecken i ett ord |
| `yogalinne-omlott-framsida` | 60 | lagerland eller EU-lager |
| `naturehike-cykeltalt-1-person` | 2 | raden "Artikelnummer: …" |
| `traningstopp-halterneck` | 7 | raden "Artikelnummer: …" |
| `popup-talt-6x3-m-sex-vaggar-justerbar-hojd` | 2 | jämförelse med vårt sortiment (våg 2); faktakort 4 och 5 bär husmärke och nummer, och texten säger "Outsunny anger UPF 30+" (KORTLACKAN) |
| `sparkcykel-barn-luftdack-40-cm` | 2 | jämförelse med vårt sortiment (våg 2) |
| `eldriven-trehjuling-barn-6v` | 2 | jämförelse med vårt sortiment (våg 2) |
| `yogabyxor-raka-ben` | 47 | leverantörs- eller garderingsfras |
| `nyckelinkast-genom-dorren` | 2 | raden "Artikelnummer: …" |
| `kopplingsdosa-utomhus-ip67-vattentat-abs-kapsling` | 4 | raden "Artikelnummer: …" |
| `tunnelvaxthus-597x295-cm` | 2 | jämförelse med vårt sortiment (våg 2) |
| `hollywoodgunga-3-sits-randig-dyna` | 2 | faktakort 5 bär husmärke och nummer (KORTLACKAN) |
