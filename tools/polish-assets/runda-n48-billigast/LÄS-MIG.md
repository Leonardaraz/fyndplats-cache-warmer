# Runda N48 — femton produkter för 639–649 kr

Femton Aosom-utkast polerade och publicerade, billigast först utan
prisjämförelse, på samma arbetssätt som N45–N47. Tre av produkterna var
reserver från N47. Tre kandidater byttes ut efter kontaktarken, eftersom ett
husmärke var tryckt på själva varan (HOMCOM på motionscykeln, PawHut på
fladdermusholkarna och kattlådan) — samma regel som i N36.

| id | produkt | SKU | pris | saldo |
|---|---|---|---:|---:|
| 127ec9c8 | Halloweenskelett som kryper upp ur marken, 70 cm – ljus, rörelse och ljud | FP-halloweenskelett-marken-70 | 639 kr | 197 |
| 876e7e89 | Paraplyställ i svart metall – åtta paraplyer, fyra krokar och droppskål | FP-paraplystall-svart-metall | 639 kr | 158 |
| 8cf7b1bb | Agilityset för hund med fyra bågar – justerbar bredd 95–114 cm och väska | FP-agilityset-hund-fyra-bagar | 639 kr | 42 |
| a08404ee | Skyddsöverdrag för utemöbler, 275 × 205 × 90 cm – oxfordtyg med PE | FP-overdrag-utemobler-275 | 639 kr | 73 |
| c031a4bc | Förvaringspall i plisserad sammet – gräddvit med guldben, Ø40 cm | FP-forvaringspall-sammet-guld | 639 kr | 46 |
| c4c404c5 | Skräckdocka till halloween, 76 cm – rör sig, lysande ögon och röst | FP-halloween-docka-76 | 639 kr | 197 |
| e03a7e2e | Hopfällbar växthylla i metall – tre plan och fjärilsdekor, 96 cm | FP-vaxthylla-metall-tre-plan | 639 kr | 49 |
| fa8d498b | Blomställ i trappform med fyra plan – rustikt brun och svart, 81 cm | FP-blomstall-trappform-fyra | 639 kr | 34 |
| fca0d000 | Förvaringspall i vit sherpa – 33 l och vändbart lock, Ø36,5 cm | FP-forvaringspall-sherpa-vit | 639 kr | 145 |
| 0a5d10dc | Skjutdörrsbeslag i svart kolstål – skena 200 cm, bär 90 kg | FP-skjutdorrsbeslag-svart-200cm | 649 kr | 129 |
| 5a6001cf | Gåvagn i trä med aktivitetspanel – xylofon, formsortering, från 18 månader | FP-gavagn-tra-montessori | 649 kr | 123 |
| eefbc35f | Zombieskelett till halloween, 75 cm – rör sig, lyser och ylar | FP-halloween-zombieskelett-75 | 649 kr | 197 |
| a6a16df2 | Fotpall med svängd sits – ljusgrå teddyfleece och ben i bok | FP-fotpall-svangd-ljusgra | 649 kr | 93 |
| af9c163f | Pedalhink 20 l i mattsvart stål – mjukstängande lock och innerhink | FP-pedalhink-mattsvart-20l | 649 kr | 174 |
| c311e18f | Gräsmattsluftare med spikvals, 45 cm – trettio piggar och långt skaft | FP-grasmattsluftare-45 | 649 kr | 73 |

**Inget pris är rört.** Alla 18 `las`-körningar (4113–4130: de 15 första
kandidaterna och de tre som ersatte märkesvarorna) gick gröna, alltså stämde
prisgrinden på varje rad. Variant-id lästes ur en enda Wix-GET och togs ur
sessionens logg med ett skript, inte avskrivna.

## Bilder

Kontaktarken lästes före texten. Inga bilder ströks: 73 bilder, och
agilitysetet har bara tre i källan. Måttbilden ligger sist på alla.

Bilderna bär två räkneord som källan saknar, båda kvitterade i `foto-tal.txt`:
skjutdörrsbeslagets skena "levereras i två delar" (huvudbilden visar två
skendelar och bild 4 skarven, medan källan bara anger 200 cm totalt) och
fotpallens "fyra ben". Zombieskelettets utsträckta armar och dockans klolika
händer kontrollerades också mot bilderna innan texten skrevs till Wix, och
dockans "spruckna ansikte" står i källan.

## Wix, i den ordning det skrevs

| steg | utfall |
|---|---|
| 1a text, namn, slug, SEO, synlighet (8 produkter) | 8 av 8 skrivna, transkriberingsspärren ren |
| 1b text, namn, slug, SEO, synlighet (7 produkter) | 7 av 7 skrivna, transkriberingsspärren ren |
| 2 media | 15 av 15 skrivna, 73 bilder, spärren ren |
| 3 kategorier | 31 av 31 rader success i 14 kategorier, `bulkActionMetadata` 0 fel överallt |
| 4 variant-SKU (sist och ensam) | 15 av 15 skrivna; alla varianter synliga före, priserna orörda (639 och 649 kr) |
| stämpel (`stampla`, körningar 4131–4145) | 15 av 15 gröna; rutten läser tillbaka raden själv och svarar 500 om den inte stämmer |
| 5 separat återläsning | 15 av 15 helt verifierade vid första läsningen (text-hash, namn, slug, SEO två taggar, media, kategorier, SKU, synlig variant); priserna som förut |

## Grindar före skrivningen

Alla rena: `gate.py` (0 fynd i 15 filer mot källan; två räkneord kvitterade i
`foto-tal.txt`), `gate-axel.py` (0 axelfel), `gate-alt.py` (73 alt-texter, 0
fynd), `gate-seo.py` (0 fynd i 15 rader), `gate-lager.py` (lägsta saldo 34),
`gate-sku.py` (längsta SKU 31 av 40 tecken), `gate-superlativ.py`,
`gate-lankar.py`, läck- och teckensvepet (0 fynd i 20 filer) och formsvepet
för artikelnummer (0 träffar).

## Live

`hamta-live.sh 130` (alla 15 med HTTP 200, `age` 149–529 s vid den skarpa
hämtningen) följt av `livegrind.py`: orddiff 0 på alla 15, 0 avvikelser i den
publicerade texten. `livekoll.py`: 15 av 15 OK med brödsmula, pris 639 eller
649 kr och `InStock`, och 73 av 73 alt-texter.

## Hölls

Alla med en rad i `FLAGGADE.md`: tre med husmärke tryckt på varan, fem träffar
mot publicerade sidor av samma slag, tre med träffar som inte gick att bedöma
utan utredning, två som är slut i lager, två som "Runda …"-serien på `main`
har rört, två redan flaggade färgsyskon och hundbäddsklustret, som väntar till
våren. Reserverna till N49 står sist i filen.

Säsongen stämmer den här gången: tre halloweenfigurer en dryg månad före
halloween, vinterskyddet för utemöblerna och gräsmattsluftaren, som texten
själv säger ska användas på hösten.
