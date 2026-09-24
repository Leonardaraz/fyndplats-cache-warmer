# Runda N51 — femton produkter för 699–719 kr

Femton Aosom-utkast polerade och publicerade, billigast först utan
prisjämförelse, på samma arbetssätt som N45–N50. N50:s reserv, spökbrudgummen
`279635e9`, leder rundan. En kandidat byttes ut efter kontaktarket:
spegelskåpet `a32ac465` har en HOMCOM-etikett på själva skåpet, och samma regel
som i N36 gäller. Det ersattes av fotbollsbordet `7a70db2c`.

| id | produkt | SKU | pris | saldo |
|---|---|---|---:|---:|
| 279635e9 | Spökbrudgum till halloween, 189 cm – rörelsesensor, ylande ljud och röda ögon | FP-spokbrudgum-halloween-189 | 699 kr | 197 |
| 3068a60b | Sittbänk med förvaring i beige sammetslook – guldfärgade ben, bär 120 kg | FP-sittbank-forvaring-beige | 699 kr | 53 |
| 3ae559f2 | Smalt badrumsskåp i vitt och trä – öppen hylla och mjukstängande dörr, 71,5 cm | FP-badrumsskap-smalt-vitt | 699 kr | 28 |
| 5646de67 | Pedaltränare med display – ställbart motstånd och fotremmar, för ben och armar | FP-pedaltranare-display | 699 kr | 167 |
| 5a65a0ea | Rund pall med förvaring i gräddvit sherpa – 38 cm, bär 120 kg | FP-rund-pall-sherpa-38 | 699 kr | 165 |
| 73457d36 | Blomställ i vitt med sju nivåer – stål och MDF, 94,5 cm, för inne och ute | FP-blomstall-sju-nivaer | 699 kr | 25 |
| 7d09edd9 | Vägghylla med fem kuber i vitlackat granträ – liggande eller stående, 86 cm | FP-vagghylla-kuber-vit | 699 kr | 37 |
| 90c066c0 | Datorbord i svart, 80 cm – utdragbar tangentbordshylla och fack för datorn | FP-datorbord-svart-80 | 699 kr | 5 |
| 9b3b4255 | Pianobänk i svart konstläder med förvaring – för två personer, bär 200 kg | FP-pianobank-forvaring-svart | 699 kr | 92 |
| aab0a1e5 | Uppblåsbar snögubbe 240 cm – roterande ljus i tre färger, för inne och ute | FP-snogubbe-uppblasbar-240 | 699 kr | 48 |
| c7424c37 | Barnstaffli 3-i-1 i grått – krittavla, whiteboard, pappersrulle och två lådor | FP-barnstaffli-pappersrulle | 699 kr | 75 |
| ce77f5c4 | Vägghylla i svart metall med nio fack – 87,5 × 100 cm, bär 30 kg | FP-vagghylla-metall-nio-fack | 699 kr | 170 |
| d227861d | Fågelmatare i granträ på stativ, 130 cm – åttakantigt tak och öppen plattform | FP-fagelmatare-stativ | 699 kr | 182 |
| db607b53 | Rutschkana för småbarn i raketdesign – 1,35 m rutschbana, för 1,5–3 år | FP-rutschkana-raket-bla | 699 kr | 76 |
| 7a70db2c | Fotbollsbord 84,5 cm med 22 spelare – långa och korta ben för golv eller bord | FP-fotbollsbord-22-spelare | 719 kr | 82 |

**Inget pris är rört.** Alla 16 `las`-körningar gick gröna: 4211–4225 för de
15 första kandidaterna, spegelskåpet inräknat, och 4226 för fotbollsbordet.
Prisgrinden stämde alltså på varje rad. Variant-id lästes ur källhämtningens
Wix-anrop och togs ur sessionens logg med ett skript. Inget skrevs av för hand.

Spökbrudgummen bar samma variant-SKU från importen som spökdockan och
spökbruden i N50, `FP-halloween-dekoration`. Nu har alla tre var sin.

## Bilder

Kontaktarken lästes före texten. Tre bilder ströks (`bilder-bort.tsv`):
kubhyllans bild 4 bär tysk rubrik och text inbränd i pixlarna, snögubbens bild
5 bär husmärket och en italiensk reklamtext, och fotbollsbordets måttbild bär
husmärket. 72 bilder återstår. Måttbilden ligger sist på de 14 produkter som
har en. Fotbollsbordet har ingen kvar.

Tre tal i texterna står som ord och är räknade på produktfotona: blomställets
sju nivåer och tre höjder och metallhyllans tre rader. De är kvitterade i
`foto-tal.txt`, så att siffergrinden släpper igenom dem.

## Wix, i den ordning det skrevs

| steg | utfall |
|---|---|
| 1a text, namn, slug, SEO, synlighet (8 produkter) | 8 av 8 skrivna, transkriberingsspärren ren |
| 1b text, namn, slug, SEO, synlighet (7 produkter) | 7 av 7 skrivna, transkriberingsspärren ren |
| 2 media | 15 av 15 skrivna, 72 bilder, spärren ren |
| 3 kategorier | 31 av 31 rader success i 13 kategorier, `bulkActionMetadata` 0 fel överallt |
| 4 variant-SKU (sist och ensam) | 15 av 15 skrivna; alla varianter synliga före, priserna orörda (699 och 719 kr) |
| stämpel (`stampla`, körningar 4227–4241) | 15 av 15 gröna; rutten läser tillbaka raden själv och svarar 500 om den inte stämmer |
| 5 separat återläsning | 15 av 15 helt verifierade vid första läsningen (text-hash, namn, slug, SEO två taggar, media, kategorier, SKU, synlig variant); priserna som förut |

## Grindar

Alla rena: `gate.py` (0 fynd i 15 filer mot källan), `gate-axel.py` (0
axelfel), `gate-alt.py` (72 alt-texter, 0 fynd), `gate-seo.py` (0 fynd i 15
rader), `gate-lager.py` (lägsta saldo 5), `gate-sku.py` (längsta SKU 28 av 40
tecken), `gate-superlativ.py`, `gate-lankar.py`, läck- och teckensvepet (0
fynd i 20 filer) och formsvepet för artikelnummer (0 träffar i 41 filer).
Omkörda på de slutliga filerna efter skrivningen, med samma utfall.

`gate-seo.py` fällde två produktnamn före skrivningen, eftersom de var längre
än Wix gräns på 80 tecken: sittbänken och kubhyllan. Båda kortades.

## Live

`hamta-live.sh 130`: alla 15 gav HTTP 200, och `age` var 149–190 s vid den
skarpa hämtningen, alltså renderingar som gjordes efter Wix-skrivningarna.
Badrumsskåpet och fotbollsbordet gav först HTTP 000 och gick igenom vid
omförsöket fem sekunder senare.

`livegrind.py`: orddiff 0 på alla 15, alltså 0 avvikelser i den publicerade
texten. `livekoll.py`: 15 av 15 OK med brödsmula, pris 699 eller 719 kr och
`InStock`, och 72 av 72 alt-texter.

## Hölls

Alla med en rad i `FLAGGADE.md`:

- en med husmärke på varan
- en ersättare där källans färg inte stämmer med bilderna
- arton träffar mot publicerade sidor av samma slag
- sju i familjer som redan är täckta eller inte gick att avgöra utan utredning
- fem som var slut i lager
- ett djurboende
- två färgsyskon till produkter i rundan
- tjugosju trädgårds- och utevaror, som väntar på säsongen

De åtta utkast i prisspannet som "Runda …"-serien på `main` rör är samma som i
N50 och filtrerades bort igen. Reserven till N52 är trehjulingen `80aac077`,
med ren skärm men utan granskat kontaktark.

Spökbrudgummen går ut en dryg månad före halloween, snögubben i god tid före
jul och fågelmataren lagom till vintermatningen.
