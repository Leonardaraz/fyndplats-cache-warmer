# Runda N50 — femton produkter för 669–699 kr

Femton Aosom-utkast polerade och publicerade, billigast först utan
prisjämförelse, på samma arbetssätt som N45–N49. N49 lämnade inga reserver, så
rundan började med en ny skärm från 669 kr. En kandidat byttes ut efter
kontaktarket: armhävningsbrädan har SPORTNOW tryckt på själva brädan, och
samma regel som i N36 gäller. Den ersattes av spökbruden.

| id | produkt | SKU | pris | saldo |
|---|---|---|---:|---:|
| 10fe3278 | Pokerset med 300 marker och kortblandare – spelmatta och väska med aluminiumhörn | FP-pokerset-kortblandare | 669 kr | 55 |
| 5fce6a95 | Vedställ i svart stål, 60 × 100 cm – håller brasveden från golvet, bär 100 kg | FP-vedstall-svart-60 | 669 kr | 85 |
| cc5b0c14 | Spökdocka till halloween, 83 cm – sitter, rör överkroppen och skriker | FP-spokdocka-halloween-83 | 669 kr | 197 |
| e797e8a4 | Tvättkorg i bambu med lock och uttagbar tvättpåse – luftiga ribbor, 60 cm hög | FP-tvattkorg-bambu-lock | 669 kr | 103 |
| e947f7aa | Vattenkokare i glas 1,7 l med tesil – fem temperaturlägen, varmhållning, 2200 W | FP-vattenkokare-glas-tesil | 669 kr | 197 |
| 0598eff2 | Väggskåp för badrummet i vitt och trä – mjukstängande dörr och öppet fack, 67 cm | FP-vaggskap-badrum-vitt | 669 kr | 76 |
| 007c6422 | Sängbord med eluttag och USB-C – två hyllor, fack och sidoficka, rustikt brunt | FP-sangbord-eluttag-brun | 679 kr | 11 |
| 536e0244 | Hopfällbar hage för hund och katt – nätfönster, dörrar och topplucka, 94 × 74 cm | FP-hopfallbar-hage-gra | 679 kr | 11 |
| 7fdf42e9 | Runt sidobord med hylla i rökglas – ekfärgad skiva och svarta metallben, 53,5 cm | FP-sidobord-rokglas-ek | 679 kr | 197 |
| ad88f2b4 | Smalt vedställ i svart stål, 40 × 100 cm – för brasved inne och ute, bär 100 kg | FP-vedstall-smalt-svart-40 | 679 kr | 126 |
| e138b637 | Lyftbock för motorcykel i rött stål – höjdlägen 27,5 och 39,5 cm, bär 150 kg | FP-lyftbock-motorcykel-rod | 679 kr | 46 |
| e7bbadb2 | Tv-bänk med två tyglådor och öppen hylla – för tv upp till 47 tum, 98 cm | FP-tvbank-tyglador-svart | 679 kr | 79 |
| 17595feb | Darttavla i sisal med skyddsring och sex pilar – Ø45,5 cm, 71,5 cm med ringen | FP-darttavla-sisal-ring | 699 kr | 197 |
| 261484e7 | Gnistskydd för öppen spis, 110 cm – tre delar med välvd mittpanel och handtag | FP-gnistskydd-valvd-svart | 699 kr | 197 |
| a6820dd0 | Spökbrud till halloween, 178 cm – rörelsesensor, skrik och röda lysande ögon | FP-spokbrud-halloween-178 | 699 kr | 106 |

**Inget pris är rört.** Alla 16 `las`-körningar gick gröna: 4179–4193 för de
15 första kandidaterna och 4195 för spökbruden. Prisgrinden stämde alltså på
varje rad. Körning 4194 startades med spökbrudens korta id i stället för det
fulla och föll direkt på att varken mappning eller produkt fanns. Den läser
bara och skrev ingenting. Variant-id lästes ur källhämtningens Wix-anrop och
togs ur sessionens logg med ett skript. Inget skrevs av för hand.

Spökdockan och spökbruden bar samma variant-SKU från importen,
`FP-halloween-dekoration`. Nu har de var sin.

## Bilder

Kontaktarken lästes före texten. Fyra bilder ströks för att de bär tysk text
inbränd i pixlarna (`bilder-bort.tsv`): pokersetets bild 4 och 5, vattenkokarens
bild 4 och hagens måttbild. 71 bilder återstår. Måttbilden ligger sist på de
14 produkter som har en. Hagen har ingen kvar.

Sex produkters bilder bär tal som källan saknar eller anger annorlunda.
Vattenkokarens måttbild visar till exempel andra mått än källans 21,7 × 21,4
cm, och tv-bänkens bild anger tv-storlekar i tum. Alt-texterna håller sig
därför till källans tal.

## Wix, i den ordning det skrevs

| steg | utfall |
|---|---|
| 1a text, namn, slug, SEO, synlighet (8 produkter) | 8 av 8 skrivna, transkriberingsspärren ren |
| 1b text, namn, slug, SEO, synlighet (7 produkter) | 7 av 7 skrivna, transkriberingsspärren ren |
| 2 media | 15 av 15 skrivna, 71 bilder, spärren ren |
| 3 kategorier | 27 av 27 rader success i 10 kategorier, `bulkActionMetadata` 0 fel överallt |
| 4 variant-SKU (sist och ensam) | 15 av 15 skrivna; alla varianter synliga före, priserna orörda (669, 679 och 699 kr) |
| stämpel (`stampla`, körningar 4196–4210) | 15 av 15 gröna; rutten läser tillbaka raden själv och svarar 500 om den inte stämmer |
| 5 separat återläsning | 15 av 15 helt verifierade vid första läsningen (text-hash, namn, slug, SEO två taggar, media, kategorier, SKU, synlig variant); priserna som förut |

## Grindar

Alla rena: `gate.py` (0 fynd i 15 filer mot källan), `gate-axel.py` (0
axelfel), `gate-alt.py` (71 alt-texter, 0 fynd), `gate-seo.py` (0 fynd i 15
rader), `gate-lager.py` (lägsta saldo 11), `gate-sku.py` (längsta SKU 26 av 40
tecken), `gate-superlativ.py`, `gate-lankar.py`, läck- och teckensvepet (0
fynd i 20 filer) och formsvepet för artikelnummer (0 träffar i 40 filer).
Omkörda på de committade filerna efter skrivningen, med samma utfall.

Två sorters fynd rättades före skrivningen. `gate-seo.py` fällde tre
produktnamn som var längre än Wix gräns på 80 tecken: vattenkokaren, hagen
och lyftbocken. Läcksvepet flaggade tvättkorgens rubrik "Luft mellan
ribborna", eftersom "Luft" med versal är tyska. Rubriken heter nu "Ventilerade
sidor".

## Live

`hamta-live.sh 130`: alla 15 gav HTTP 200, och `age` var 148–184 s vid den
skarpa hämtningen. Två undantag, båda ofarliga. Vattenkokaren hade `age` 484 s:
den serverades från renderingen som den varma träffen utlöste, och den är
yngre än Wix-skrivningarna. Gnistskyddet gav först HTTP 000 och gick igenom
vid omförsöket fem sekunder senare.

`livegrind.py`: orddiff 0 på alla 15, alltså 0 avvikelser i den publicerade
texten. `livekoll.py`: 15 av 15 OK med brödsmula, pris 669, 679 eller 699 kr
och `InStock`, och 71 av 71 alt-texter.

## Hölls

Alla med en rad i `FLAGGADE.md`:

- en med husmärke på varan
- elva träffar mot publicerade sidor av samma slag
- en tvilling till en produkt som "Runda …"-serien på `main` arbetar med
- tre med för lågt saldo
- en som inte gick att avgöra utan utredning
- ett djurboende
- nio trädgårdsvaror, som väntar på säsongen

Tio utkast i prisspannet rörs av "Runda …"-serien på `main` och filtrerades
bort före skärmen. Reserven till N51 är spökbrudgummen `279635e9`, och åtta
kandidater till står kvar för en riktad kontroll.

Spökdockan och spökbruden går ut en dryg månad före halloween, och
gnistskyddet och de två vedställen före eldningssäsongen.
