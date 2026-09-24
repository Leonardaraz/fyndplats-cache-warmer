# Runda N53 — femton produkter för 749–769 kr

Femton Aosom-utkast polerade och publicerade, billigast först utan
prisjämförelse, på samma arbetssätt som N45–N52. En kandidat byttes ut efter
kontaktarket: konstbambun `49b41e8c` säger emot sig själv om antalet (se
nedan). Den första reserven, hundtoaletten `d0e14ad8`, har en PawHut-etikett
på brickan i alla fem bilderna och föll på samma regel som i N36. Den andra
reserven, skjutdörrsbeslaget `d8af896a`, tog platsen.

| id | produkt | SKU | pris | saldo |
|---|---|---|---:|---:|
| 1e139971 | Gåvagn 3-i-1 i trä med dubbelsidig aktivitetstavla – för barn från 1 år | FP-gavagn-3-i-1-tra | 749 kr | 197 |
| 3dc622f9 | Klädställ i bambu med två krokar och skohylla – 116 × 43,5 × 160 cm | FP-kladstall-bambu-skohylla | 749 kr | 90 |
| 4d7268c1 | Två runda sidobord i vit marmorlook med guldfärgad ram – kan skjutas ihop | FP-sidobord-marmorlook-guld | 749 kr | 163 |
| 560edb9f | Konstgjord bambu 140 cm i svart kruka – 780 blad, för inne och ute | FP-konstbambu-140-svart-kruka | 749 kr | 22 |
| aa7637fb | Vedställ i svart stål med fyra brasredskap – 75 cm, bär 100 kg | FP-vedstall-brasredskap-svart | 749 kr | 79 |
| bd664764 | Smal bokhylla i vitt, 30 cm bred – två lådor, skåp och öppna fack, 158 cm | FP-bokhylla-smal-vit-lador | 749 kr | 142 |
| eca2fa1e | Sittbänk i furu med svarta ben – 102 cm, två sittplatser, bär 220 kg | FP-sittbank-furu-svart-102 | 749 kr | 55 |
| 1ae506e3 | Byrå för barnrummet i rosa och vitt – tre lådor, 60 cm hög, för barn 3–8 år | FP-byra-barn-rosa-tre-lador | 759 kr | 28 |
| 85b1a737 | Leksaksmotor att reparera – traktor med 55 delar, ljud och dimeffekt | FP-leksaksmotor-traktor | 759 kr | 197 |
| a778baf1 | Sensorsoptunna 30 liter i rostfritt stål – lock som öppnas och stängs själv | FP-sensorsoptunna-30-rostfri | 759 kr | 183 |
| b398fe7b | Stegbräda för aerobics med tre höjder – 10, 15 eller 20 cm, bär 150 kg | FP-stegbrada-tre-hojder | 759 kr | 61 |
| db1f6697 | Hopfällbart skrivbord i vitt med avtagbar skärmhylla – 100 cm, 5,5 cm hopfällt | FP-skrivbord-hopfallbart-vit | 759 kr | 73 |
| 12704344 | Konstgjord kaktus 95 cm med tre stammar – i ljus kruka, Ø22 cm | FP-konstkaktus-95-tre-stammar | 769 kr | 76 |
| 2af51f93 | Gåvagn i trä med xylofon, kulram och formlåda – fem klossar, från 18 månader | FP-gavagn-tra-xylofon | 769 kr | 197 |
| d8af896a | Skjutdörrsbeslag 122 cm för vikdörr i ladudörrsstil – svart stål, bär 90 kg | FP-skjutdorrsbeslag-vikdorr-122 | 769 kr | 173 |

**Inget pris är rört.** Alla 16 `las`-körningar gick gröna: 4273–4287 för de
15 första kandidaterna, konstbambun inräknad, och 4288 för skjutdörrsbeslaget.
Prisgrinden stämde alltså på varje rad. Variant-id lästes ur källhämtningens
Wix-anrop och togs ur sessionens logg med ett skript, och steg 4:s färska
läsning gav samma id på alla 15. Inget skrevs av för hand.

## Bilder före text

Kontaktarken lästes före texten, och fyra gånger stämde källan inte med sig
själv eller med bilderna. Så här valde texten:

- Konstbambuns tyska namn säger att det är ett set om två, och huvudbilden
  visar två växter, men källans lista över vad som ingår säger en. Vikten, 8,1 kg mot 5,2 kg för
  den ensamma bambun på 140 cm i samma runda, talar för två. En sida som lovar
  två när kunden får en är det dyra felet, och en sida som lovar en motsäger
  sin egen huvudbild. Den hölls.
- Leksaksmotorn kallas bilmotor i källan. Bilderna visar en grön traktor med
  traktorgrill, avgasrör och ratt baktill, och texten beskriver en traktor.
- Sensorsoptunnans höjd står som 51,5 cm i källtexten och 55,5 cm i
  spec-raden, och vikten som 2,6 och 3,5 kg. Måttbilden visar 51,5 cm.
  Texten följer källtexten och måttbilden.
- Stegbrädans färg heter *Grün* i källan, men bilderna visar mintgrönt, nära
  turkos. Texten säger mintgrön.

4 bilder ströks (`bilder-bort.tsv`): gåvagnens och sensorsoptunnans måttbilder bär
tysk text, och skrivbordets bild 2 och 5 bär husmärket som vattenstämpel (se
nästa avsnitt). 71 bilder återstår. Måttbilden ligger sist på de 13
produkter som har en. Gåvagnen och sensorsoptunnan har ingen kvar.

Ett räkneord i texterna saknar sin siffra i källtexten: sidobordens *två*.
Källan säger ett stort och ett litet bord, och bilderna visar två. Talet är
kvitterat i `foto-tal.txt`, så att siffergrinden släpper igenom det.

## Vattenstämpeln som kontaktarket nästan missade

Skrivbordets bild 2 och 5 bär *HOMCOM by Aosom* uppe till höger, vitt på vita
persienner och en ljus vägg. I kontaktarket syntes märket bara som en svag
ljusning, och det upptäcktes för att arket råkade läsas extra noga.

Ett högpassfilter gör det till tydliga konturer. Filtret drar av en suddad
kopia av bilden och förstärker det som är ljusare än omgivningen, så att
text och logotyper på släta ytor lyser. Det ligger nu i
`tools/polish-gates/bygg-ghost.py` och körs efter `bygg-ark.py`, två
produkter per ark.

Alla 75 bilder i rundan och reservernas 15 gick genom filtret, och inga fler
vattenstämplar hittades. N52:s 68 publicerade bilder kördes genom samma
filter i efterhand, också utan fynd. **Rundorna före N52 är inte svepta**, så
en vattenstämpel av samma slag kan ligga ute där.

## Wix, i den ordning det skrevs

| steg | utfall |
|---|---|
| 1a text, namn, slug, SEO, synlighet (8 produkter) | 8 av 8 skrivna, transkriberingsspärren ren |
| 1b text, namn, slug, SEO, synlighet (7 produkter) | 7 av 7 skrivna, transkriberingsspärren ren |
| 2 media | 15 av 15 skrivna, 71 bilder, spärren ren |
| 3 kategorier | 30 av 30 rader success i 10 kategorier, `bulkActionMetadata` 0 fel överallt |
| 4 variant-SKU (sist och ensam) | 15 av 15 skrivna; alla varianter synliga före, priserna orörda (749, 759 och 769 kr) |
| stämpel (`stampla`, körningar 4289–4303) | 15 av 15 gröna; rutten läser tillbaka raden själv och svarar 500 om den inte stämmer |
| 5 separat återläsning | 15 av 15 helt verifierade vid första läsningen (text-hash, namn, slug, SEO två taggar, media, kategorier, SKU, synlig variant); priserna som förut |

## Grindar

Alla rena: `gate.py` (0 fynd i 15 filer mot källan, 0 varningar),
`gate-axel.py` (0 axelfel), `gate-alt.py` (71 alt-texter, 0 fynd),
`gate-seo.py` (0 fynd i 15 rader), `gate-lager.py` (lägsta saldo 22),
`gate-sku.py` (längsta SKU 31 av 40 tecken), `gate-superlativ.py`,
`gate-lankar.py` och läck- och teckensvepet (0 fynd i 20 filer). Formsvepet för
artikelnummer: 41 filer och 9 träffar, alla på strängarna `140-svart` och `ben-102`, alltså konstbambuns höjd och färg i dess SKU och sittbänkens ben och längd i dess slug, i stegfilerna och i den här filen. Inget artikelnummer.

Siffergrinden fällde en gång före skrivningen: leksaksmotorns *60 delar* står
i det tyska namnet men inte i källtexten, som säger 55 reparationsdelar.
Texten, namnet, SEO-titeln, sluggen och SKU:n säger nu 55 eller ingenting.
Omkörda på de slutliga filerna efter skrivningen, med samma utfall.

## Live

`hamta-live.sh 130`: alla 15 gav HTTP 200 vid båda hämtningarna, utan ett
enda omförsök. Vid den skarpa hämtningen var `age` 148–150 s på alla 15
sidor, alltså gjordes alla renderingar efter Wix-skrivningarna.

`livegrind.py`: orddiff 0 på alla 15, alltså 0 avvikelser i den publicerade
texten. `livekoll.py`: 15 av 15 OK med brödsmula, pris 749, 759 eller 769 kr
och `InStock`, och 71 av 71 alt-texter.

## Hölls

Alla med en rad i `FLAGGADE.md`:

- en där källan säger emot sig själv om antalet (konstbambun)
- en med husmärke på varan (hundtoaletten)
- ett färgsyskon till en produkt i rundan (sittbänken med vita ben)
- fjorton träffar mot publicerade sidor av samma slag
- fyra som var slut eller nästan slut i lager
- fem där skärmen inte kunde läsa några mått ur källan
- sju i familjer som redan är täckta eller inte gick att avgöra utan utredning
- tre djurboenden, filtrerade bort före skärmen
- en reserv till N54, vedstället `f267fdc4` med överdrag

Alla 52 kandidater på 749–769 kr är alltså antingen publicerade eller
flaggade. Nästa runda börjar på 779 kr, med reserven först.

Vedstället och brasredskapen går ut i god tid före eldningssäsongen.
