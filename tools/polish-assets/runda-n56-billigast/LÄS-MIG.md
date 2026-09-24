# Runda N56 — femton produkter för 799–839 kr

Femton Aosom-utkast polerade och publicerade, billigast först utan
prisjämförelse, på samma arbetssätt som N45–N55. Rundan började med N55:s
reserv, toaletthyllan i bambu för 799 kr, och gick sedan vidare till 819–839
kr. Två snabba dubblettskärmar prövade 48 kandidater, och 20 av dem gick
vidare till prisgrinden och bildgranskningen. Två hölls för husmärken tryckta
på varan, och tre är reserver till nästa runda.

| id | produkt | SKU | pris | saldo |
|---|---|---|---:|---:|
| 1355eec8 | Handbagagekoffert 56 cm i mörkgrått – 40 liter, TSA-lås och fyra snurrhjul | FP-handbagage-koffert-56-gra | 829 kr | 87 |
| 1c908b3f | Pokerset med 400 marker i väska – två kortlekar, fem tärningar och spelmatta | FP-pokerset-marker-400 | 829 kr | 71 |
| 1da6b037 | Gnistskydd för öppen spis i svart metall – tre paneler, 122 × 75 cm, bågmönster | FP-gnistskydd-svart-bagmonster | 819 kr | 186 |
| 3ad8c7a4 | Klättervägg för katt i fyra delar – sisalstolpe, hängbro, liggskål och trappa | FP-klattervagg-katt-fyra-delar | 829 kr | 197 |
| 6d0e2d27 | Gnistskydd i guldfärg med dubbeldörrar – tre paneler, 122 × 75 cm | FP-gnistskydd-guld-dubbeldorrar | 819 kr | 197 |
| 6f4baeef | Vinställ för 30 flaskor – sex plan, rustik skiva och svart metallram, 88,5 cm | FP-vinstall-30-flaskor | 819 kr | 43 |
| 7e3d0a23 | Vedställ 0,33 m³ med överdrag och bärväska – svart metall, 120 cm, bär 150 kg | FP-vedstall-overdrag-barvaska | 829 kr | 101 |
| 856bdf7e | Hantlar och skivstång i ett – 20 kg, åtta viktskivor och stjärnlås | FP-hantlar-skivstang-20kg | 839 kr | 54 |
| 868b82c8 | Leksaksaffär i trä med kassa och skanner – 34 tillbehör, 92,5 cm hög, från 3 år | FP-leksaksaffar-tra-kassa | 829 kr | 197 |
| 95a0993c | Fotpall i gräddvit manchester – 70 × 46 × 40 cm, ben i gummiträ, bär 120 kg | FP-fotpall-manchester-graddvit | 819 kr | 10 |
| 98da447a | Staffli i bokträ med låda – ställbar höjd upp till 190 cm, dukar upp till 92 cm | FP-staffli-boktra-lada | 829 kr | 197 |
| b62bb65c | Hantelställ med två hyllor – gul och svart stålram, bär 270 kg | FP-hantelstall-tva-hyllor | 829 kr | 34 |
| e248e9db | Smalt badrumsskåp i bambu – 30 × 30 × 80 cm, öppet fack och lamelldörr | FP-badrumsskap-bambu-30 | 819 kr | 114 |
| ed39cd4c | Toaletthylla i bambu med tre hyllplan – 68 × 20 × 165 cm, bär 15 kg | FP-toaletthylla-bambu | 799 kr | 50 |
| f2756389 | Satsbord i tre storlekar – skivor i trämönster och svart stålram | FP-satsbord-tre-stalram | 819 kr | 13 |

**Inget pris är rört.** Alla 20 `las`-körningar (4370–4389), en för varje
kandidat och reserv, gick gröna, alltså stämde prisgrinden på varje rad.
Källtexterna, bild-id och variant-id lästes i Wix med artikelnumren
redigerade i själva anropet och togs ur sessionens logg med ett skript. Steg
4:s färska läsning gav samma variant-id som rundans fil på alla 15. Inget
skrevs av för hand.

## Bilder före text

Kontaktarken och högpassarken för alla 20 kandidater lästes före texten. Två
kandidater hölls, fyra bilder ströks, och fyra gånger skilde sig källan och
bilderna åt.

Hölls för husmärke tryckt på varan, enligt regeln från N36:

- takboxen `8bc0dd26`, med Outsunny tryckt på själva väskan. Bild 3 och 4 har
  dessutom tysk text.
- golvspegeln `ffc507bf`, med en HOMCOM-etikett på spegelglaset i bild 1, 3
  och 5

Båda var `las`-gröna och står i `FLAGGADE.md`.

4 bilder ströks (`bilder-bort.tsv`):

- bild 3 på båda gnistskydden, `1da6b037` och `6d0e2d27`: engelsk text
  inbränd i måttbilden (*Expanded*, *Folded*), samma slags bild som N42 och
  N55 strök
- vedställets `7e3d0a23` bild 2: husmärket Outsunny på en skylt på eldkorgen i
  bakgrunden. Vedstället självt bär inget märke, så produkten hölls inte.
- vedställets bild 4: tysk text inbränd i bilden

71 bilder återstår, och måttbilden ligger sist på de 13 produkter som har en
kvar. Fyra förstoringar gjordes där kontaktarket inte räckte: på kofferten,
på staffliets låda, på hantelställets gymbild och på eldkorgen i vedställets
bild 2, där skylten hittades. I gymbilden står ett tryck på ett slagträ i
bakgrunden. Det är inget av Aosoms husmärken, och bilden står kvar.
Högpassarken (`bygg-ghost.py`, två produkter per ark) visade inga andra
märken eller texter än de som redan hittats i kontaktarken.

Så här valde texten när källan och bilderna inte sa samma sak:

- Klätterväggens källtext säger aldrig hur många delar setet har. Det står
  bara i namnet, som inte räknas till källtexten. Bild 1 och 2 visar fyra
  delar. Hängbrons två plattformar räknades på bild 1 och 3, och källan kallar
  delen *Doppelplattform*. Båda talen står i `foto-tal.txt`.
- Staffliets totalmått i källan slutar på ett redigerat fält, eftersom
  höjdintervallet har samma form som ett artikelnummer. Måttbilden visar
  150–190 cm och spec-raden 190 cm. Texten säger upp till 190 cm och nämner
  inte den lägsta höjden.
- Hantelställets gymbild visar stället fullt med hantlar, men enligt källans
  lista ingår bara stället och en manual. Texten säger att hantlarna inte
  ingår.
- Toaletthyllans källa säger att den passar över de flesta toaletter.
  Bilderna visar den också över en tvättmaskin, så texten nämner det och ber
  kunden mäta maskinen först.

Alla andra räkneord i texterna har sin siffra eller sitt tyska räkneord i
källtexten.

## Andra varor av samma slag i katalogen

Tidigare rundor har bland annat publicerat två pokerset (`10fe3278` med 300
marker och `0dff6d43` med 500), fyra vedställ (`5fce6a95`, `ad88f2b4`,
`aa7637fb` och N54:s `f267fdc4` på 0,6 m³), två barnstafflin 3-i-1
(`c7424c37` och `ac160e8e`) och satsbord i glas (`b7b5b37e`). Rundans pokerset
har 400 marker, vedstället rymmer 0,33 m³ och har bärväska, staffliet är i
bokträ och upp till 190 cm högt, och satsborden är tre med stålram. Ingen av
dem är alltså samma vara.

Fyra gnistskydd var redan publicerade: `ae2ac5e5` från N37, `988ac121` från
N42 och `4f0fa784` och `53386372` från N55. Rundans två är 122 × 75 cm, och
dubblettskärmen gav ingen träff mot de fyra. De två träffade däremot
varandra, eftersom måtten är desamma, men de är olika varor: det ena är svart
med bågmönster och det andra guldfärgat med dubbeldörrar.

## Kategorier: den nya grenen Möbler

Kategoriträdet fick en ny gren, Möbler, 2026-09-23 kl. 22:19 UTC. Den har åtta
löv: Fåtöljer, Kontorsstolar, Matbord & stolar, Rumsavdelare, Skrivbord,
Soffbord & småbord, Soffor & bäddsoffor och Sängar & sovrum. Grenen hade 713
produkter när N56 läste den och 715 efter skrivningen. N56 använder den för
de två rena möblerna. Fotpallen `95a0993c` står bara under Möbler, eftersom
inget löv passar en fotpall, och satsborden `f2756389` står under Möbler och
Soffbord & småbord. Badrumsskåpet, toaletthyllan och vinstället står under
Hem & Inredning och dess löv, precis som förvaringen i tidigare rundor.

N55:s möbler (sängramen, de två pallarna, sittpuffen och nattduksbordet) står
fortfarande bara under Hem & Inredning. Rundan flyttar dem inte.

## Wix, i den ordning det skrevs

| steg | utfall |
|---|---|
| 1a text, namn, slug, SEO, synlighet (8 produkter) | 8 av 8 skrivna, transkriberingsspärren ren |
| 1b text, namn, slug, SEO, synlighet (7 produkter) | 7 av 7 skrivna, transkriberingsspärren ren |
| 2 media | 15 av 15 skrivna, 71 bilder, spärren ren |
| 3 kategorier | 28 av 28 rader success i 13 kategorier, `bulkActionMetadata` 0 fel överallt |
| 4 variant-SKU (sist och ensam) | 15 av 15 skrivna; alla varianter synliga före, priset orört (799–839 kr) |
| 5 separat återläsning | 15 av 15 helt verifierade vid första läsningen (text-hash, namn, slug, SEO två taggar, media, kategorier, SKU, synlig variant); priset som förut, alla `IN_STOCK` |
| stämpel (`stampla`, körningar 4390–4404) | 15 av 15 gröna; rutten läser tillbaka raden själv och svarar 500 om den inte stämmer |

## Grindar

Alla rena: `gate.py` (0 fynd i 15 filer mot källan; 0 varningar sedan
klätterväggens två räkneord kvitterats i `foto-tal.txt`), `gate-axel.py`
(0 axelfel), `gate-alt.py` (71 alt-texter, 0 fynd), `gate-seo.py` (0 fynd i
15 rader), `gate-lager.py` (lägsta saldo 10), `gate-sku.py` (längsta SKU 31 av
40 tecken), `gate-superlativ.py`, `gate-lankar.py` och läck- och teckensvepet
(0 fynd i 20 filer). Formsvepet för artikelnummer: 41 filer och 0 träffar.

Formsvepet slog först till på pokersetets slug och SKU, där talet 400
följdes av ett bindestreck och ett ord. Det är samma form som ett
artikelnummer, så talet flyttades sist (`pokerset-marker-vaska-400`,
`FP-pokerset-marker-400`) innan något skrevs till Wix.

Korrekturpasset ändrade 20 ställen före skrivningen, bland annat:

- två *både* som stod före fler än två led, på klätterväggen och
  leksaksaffären
- två meningsfragment som fick eget verb, på pokersetet och hantlarna
- *kommer färdigt att använda*, som blev *levereras klart att använda* på båda
  gnistskydden
- *belastning*, som blev *maxbelastning* på klätterväggen och kofferten
- *vattentanken*, som blev *spolcisternen* på toaletthyllan, och *Skruva fast
  benen*, som blev *Montera pallen* på fotpallen
- en mening om att det svarta gnistskyddet passar både öppna spisar och
  gaskaminer. Källorna säger bara att designen passar ihop med gaskaminer, så
  meningen ströks.

SEO-beskrivningen för det svarta gnistskyddet sa *kommer utan montering* och
fick *kräver ingen montering*. Grindarna och hela byggkedjan kördes om efter
ändringarna.

## Live

`hamta-live.sh 130`: alla 15 gav HTTP 200. Vid den skarpa hämtningen fick
vinstället `6f4baeef` först HTTP 000, ett anslutningsfel, och 200 vid
omförsöket fem sekunder senare. Tolv sidor hade `age` 184–244 s vid den
skarpa hämtningen. Tre hade 572–600 s: det guldfärgade gnistskyddet
`6d0e2d27`, badrumsskåpet `e248e9db` och toaletthyllan `ed39cd4c`. De visade
alltså den rendering som gjordes vid den första varma träffen, när sidan
visades för första gången under sitt nya slug. Den varma träffen började
00:14:54 UTC, ungefär sju minuter efter den sista Wix-skrivningen (steg 4,
00:07 UTC), så alla femton renderingar gjordes efter Wix-skrivningarna.

`livegrind.py`: orddiff 0 på alla 15, alltså 0 avvikelser i den publicerade
texten. `livekoll.py`: 15 av 15 OK med brödsmula, `InStock`, SEO-titel och
metabeskrivning som i `seo.tsv` och samma pris som i `ids.tsv` (799–839 kr),
och 71 av 71 alt-texter. Brödsmulan visar Möbler på fotpallen och
satsborden.

## Hölls

Alla med en rad i `FLAGGADE.md`:

- två med husmärke tryckt på varan: takboxen med Outsunny och golvspegeln med
  HOMCOM
- tre reserver, förvaringspallen `a96f4c7e`, väggspeglarna `ac1cc9a5` och
  växtpiedestalerna `af2ca910`. De är `las`-prövade och bildgranskade men inte
  skrivna.
- fyra slutsålda, varav två dessutom har en skärmträff
- två där skärmen inte kunde läsa några mått, och två julgranar som behöver en
  riktad kontroll av höjd och diameter
- tolv säsongsvaror och nio i familjer som redan är täckta
- 20 med en skärmträff mot en publicerad sida av samma slag, och två med
  oklara träffar

Alla kandidater på 819–839 kr är alltså publicerade, flaggade, reserver eller
rörda av main-serien. Nästa runda börjar med de tre reserverna och fortsätter
på 849 kr, där 27 utkast ligger utanför main-serien och inget är skärmat.

Gnistskydden och vedstället ligger ute lagom till eldningssäsongen.
