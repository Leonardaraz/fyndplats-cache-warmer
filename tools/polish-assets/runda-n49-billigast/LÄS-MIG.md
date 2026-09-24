# Runda N49 — femton produkter för 649–669 kr

Femton Aosom-utkast polerade och publicerade, billigast först utan
prisjämförelse, på samma arbetssätt som N45–N48. Sex av produkterna var
reserver från N48. Tre kandidater byttes ut efter kontaktarken och en riktad
kontroll: två med husmärke på varan eller väskan (PawHut på agilitysetets
väska, SPORTNOW på plyoboxen) — samma regel som i N36 — och en uppblåsbar
tomte som troligen är samma vara som en redan publicerad.

| id | produkt | SKU | pris | saldo |
|---|---|---|---:|---:|
| 115d3831 | Springcykel i trä för barn 3–5 år – justerbar sadel och tysta EVA-hjul | FP-springcykel-tra-ljusbla | 649 kr | 135 |
| 5eb079d2 | Rund förvaringspall i beige tyg med juteyta – 19 l och lock som blir bord | FP-forvaringspall-jute-beige | 649 kr | 181 |
| 0dff6d43 | Pokerset med 500 marker i aluminiumväska – kortlekar, tärningar och dealerknapp | FP-pokerset-aluminiumvaska | 659 kr | 178 |
| 12c11f43 | Pall i fransk lantstil – stoppad sits i beige tyg och ram i gummiträ | FP-pall-fransk-lantstil-beige | 659 kr | 54 |
| 4c8d9de4 | Smal konstgjord julgran 183 cm med konstsnö – 479 grenspetsar och stålfot | FP-smal-julgran-konstsno | 659 kr | 90 |
| 63a725ab | Golvlampa i guld med tygskärm – fjärrkontroll, 11 ljuslägen och fotbrytare | FP-golvlampa-guld-fjarrkontroll | 659 kr | 46 |
| 7720d168 | Lekkök för barn 3–6 år med 92 delar – ljud, ljus, ångeffekt och vattenkran | FP-lekkok-92-delar-mintgron | 659 kr | 73 |
| 8382289b | Hopfällbart blomställ med sex runda hyllor – svart metall, 80 cm | FP-blomstall-sex-runda-hyllor | 659 kr | 21 |
| 875ca38b | Vinhylla för väggen – åtta flaskor i svart stålrör, 93,5 cm | FP-vinhylla-vagg-atta-flaskor | 659 kr | 182 |
| 96451d83 | Rutschkana för småbarn formad som en giraff – basketkorg och boll, 1–3 år | FP-rutschkana-giraff-bla | 659 kr | 34 |
| b69e5b38 | Blomställ i trappform med tre plan – svart metall med gallerhyllor, 75 cm | FP-blomstall-trappform-tre-plan | 659 kr | 97 |
| cc7ab001 | Agilityset för hund i tre delar – hinder, slalom och ring med väska | FP-agilityset-hund-tre-delar | 659 kr | 44 |
| ce59dcf5 | Bambuhylla med fyra plan – för badrum, kök eller vardagsrum, 112 cm | FP-bambuhylla-fyra-plan | 659 kr | 197 |
| f0817bea | Julby i trä med 20 LED – vinterlandskap med hus, barn och lyktor, 45 cm | FP-julby-tra-20-led | 659 kr | 197 |
| e0d0d880 | Pedalhink 20 l i gräddvitt – mjukstängande lock som kan stå öppet | FP-pedalhink-gradvit-20l | 669 kr | 197 |

**Inget pris är rört.** Alla 18 `las`-körningar (4146–4163: de 15 första
kandidaterna och de tre som ersatte dem) gick gröna, alltså stämde
prisgrinden på varje rad. Variant-id lästes ur en enda Wix-GET och togs ur
sessionens logg med ett skript, inte avskrivna.

## Bilder

Kontaktarken lästes före texten. Tre bilder ströks för att de bär tysk text
inbränd i pixlarna (`bilder-bort.tsv`): springcykelns måttbild och bild 4 hos
pokersetet och lekköket. 72 bilder återstår. Måttbilden ligger sist på de 14
produkter som har en; springcykeln har ingen kvar.

Bilderna bär några tal som källan saknar eller anger annorlunda — granens
bild säger 180 cm där källan säger 183, och lampans, hinkens och
agilitysetets bilder har egna tal — så alt-texterna håller sig till källans
tal. Vinhyllans bild 4 och 5 visar två hyllor bredvid varandra, och
alt-texterna säger det.

## Wix, i den ordning det skrevs

| steg | utfall |
|---|---|
| 1a text, namn, slug, SEO, synlighet (8 produkter) | 8 av 8 skrivna, transkriberingsspärren ren |
| 1b text, namn, slug, SEO, synlighet (7 produkter) | 7 av 7 skrivna, transkriberingsspärren ren |
| 2 media | 15 av 15 skrivna, 72 bilder, spärren ren |
| 3 kategorier | 31 av 31 rader success i 15 kategorier, `bulkActionMetadata` 0 fel överallt |
| 4 variant-SKU (sist och ensam) | 15 av 15 skrivna; alla varianter synliga före, priserna orörda (649, 659 och 669 kr) |
| stämpel (`stampla`, körningar 4164–4178) | 15 av 15 gröna; rutten läser tillbaka raden själv och svarar 500 om den inte stämmer |
| 5 separat återläsning | 15 av 15 helt verifierade vid första läsningen (text-hash, namn, slug, SEO två taggar, media, kategorier, SKU, synlig variant); priserna som förut |

## Grindar

Alla rena: `gate.py` (0 fynd i 15 filer mot källan), `gate-axel.py` (0
axelfel), `gate-alt.py` (72 alt-texter, 0 fynd), `gate-seo.py` (0 fynd i 15
rader), `gate-lager.py` (lägsta saldo 21), `gate-sku.py` (längsta SKU 31 av 40
tecken), `gate-superlativ.py`, `gate-lankar.py`, läck- och teckensvepet (0
fynd i 20 filer) och formsvepet för artikelnummer (0 träffar i 40 filer).
Omkörda på de committade filerna efter skrivningen, med samma utfall.

Före skrivningen rättades två sorters fynd: läcksvepet flaggade det tyska
"Natur" i färgraderna (nu "Naturträ, blå", "Naturfärgad" och "Naturträ med
målade detaljer"), och formsvepet träffade lampans sockelbeteckning när den
stod före ett bindestreck (nu "sockeln E27"). SKU:er och slugar formulerades
om där formsvepet annars hade träffat, till exempel pokersetets SKU utan
antalet marker.

## Live

`hamta-live.sh 130` (alla 15 med HTTP 200, `age` 148–179 s vid den skarpa
hämtningen utom golvlampan `63a725ab` med 513 s: den serverades från
renderingen som den varma träffen utlöste, och den är yngre än
Wix-skrivningarna) följt av `livegrind.py`: orddiff 0 på alla 15, 0
avvikelser i den publicerade texten. `livekoll.py`: 15 av 15 OK med
brödsmula, pris 649, 659 eller 669 kr och `InStock`, och 72 av 72
alt-texter.

## Hölls

Alla med en rad i `FLAGGADE.md`: tre med husmärke på varan eller väskan och
ett syskon till en av dem, en trolig tvilling till en publicerad tomte, åtta
träffar mot publicerade sidor av samma slag, fyra färgsyskon, fotbollsmålet
och nio trädgårdsvaror för säsong, och två kattlådor som redan är
pensionerade. Det finns inga reserver till N50, som börjar med en ny skärm
från 669 kr.

Julgranen och julbyn går ut tre månader före jul, så att sidorna hinner bli
indexerade före säsongen. Blomställen och bambuhyllan fungerar inomhus och
räknas inte som trädgårdsvaror.
