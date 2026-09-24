# Runda N52 — femton produkter för 719–739 kr

Femton Aosom-utkast polerade och publicerade, billigast först utan
prisjämförelse, på samma arbetssätt som N45–N51. N51:s reserv, trehjulingen
`80aac077`, leder rundan. En kandidat byttes ut efter kontaktarket:
fågellekplatsen `c661b7de` har en PawHut-skylt på själva varan, och samma
regel som i N36 gäller. Den ersattes av cd-hyllan `855bae98`.

| id | produkt | SKU | pris | saldo |
|---|---|---|---:|---:|
| 80aac077 | Trehjuling för småbarn i motorcykeldesign – orange, sitthöjd 29 cm, 18–36 mån | FP-trehjuling-motorcykel-orange | 719 kr | 63 |
| ac160e8e | Barnstaffli 3-i-1 i rosa – krittavla, whiteboard, pappersrulle och två tygkorgar | FP-barnstaffli-rosa-tygkorgar | 719 kr | 150 |
| eb7d67a4 | Uppblåsbar snögubbe 240 cm med hög hatt – kvistarmar, lysdioder och färgljus | FP-snogubbe-hog-hatt-240 | 719 kr | 83 |
| a64af3a4 | Dörrgrind för hund med klämmontage – 75–95 cm, dörr som öppnas åt båda hållen | FP-dorrgrind-hund-klammontage | 719 kr | 125 |
| 0b66ea13 | Tvättkorg i bambu med tre avtagbara tygkorgar i grått – hylla med ribbor ovanpå | FP-tvattkorg-bambu-tre-korgar | 729 kr | 42 |
| 163cd19d | Leksaksdiskmaskin i trä med diskho och kran – 32 tillbehör, för barn från 3 år | FP-leksaksdiskmaskin-tra | 729 kr | 63 |
| 2487e6bb | Blomhylla i svart metall med tre plan och tre krokar – 137 cm, för inne och ute | FP-blomhylla-svart-krokar | 729 kr | 58 |
| 43d46471 | Skoställ i grått och svart med låda – tre hyllor för upp till nio par skor | FP-skostall-gra-lada | 729 kr | 15 |
| cb08e980 | Ministepper med motståndsband och LCD-display – ställbar steghöjd, bär 100 kg | FP-ministepper-band-display | 729 kr | 62 |
| 5f833adb | Spegelskåp för badrummet i grått – två skåp, öppen hylla och dämpade gångjärn | FP-spegelskap-gra-55 | 739 kr | 25 |
| b0f5b1a5 | Två sittpallar i gräddvit plisserad sammet – förvaring i den stora, bär 120 kg | FP-sittpallar-plisse-2-pack | 739 kr | 54 |
| e95efc20 | Whiteboard i glas, 90 × 60 cm – ramlös med pennhylla, fyra pennor och sudd | FP-whiteboard-glas-90 | 739 kr | 66 |
| e4df6dc7 | Väggspegel i organisk form med ram i furufaner – 91,5 × 45 cm, färdig att hänga | FP-vaggspegel-organisk-fura | 739 kr | 197 |
| 3edd4198 | Trappklättrande säckkärra med sex hjul – hopfällbar, bär 70 kg, aluminium | FP-trappkarra-sex-hjul | 739 kr | 83 |
| 855bae98 | Smal cd- och dvd-hylla i vitt, 140 cm – rymmer 260 cd eller 120 dvd | FP-cd-dvd-hylla-vit-140 | 739 kr | 197 |

**Inget pris är rört.** Alla 16 `las`-körningar gick gröna: 4242–4256 för de
15 första kandidaterna, fågellekplatsen inräknad, och 4257 för cd-hyllan.
Prisgrinden stämde alltså på varje rad. Variant-id lästes ur källhämtningens
Wix-anrop och togs ur sessionens logg med ett skript. Inget skrevs av för hand.

## Bilder före text

Kontaktarken lästes före texten, och tre gånger stämde källan inte med sig
själv eller med bilderna. Så här valde texten:

- Säckkärrans spec-rad anger färgen *Beige, Grau, Grün*. Bilderna och källans
  egen beskrivning visar silver och svart.
- Whiteboardens tyska namn säger *6 Magnete*, och huvudbilden visar sex runda
  magneter. Källans lista över vad som ingår nämner inga, och källan säger att
  tillbehören inte är magnetiska. Texten räknar bara upp det som listan tar med
  och säger att tavlan kräver starka magneter. Ingår magneterna ändå får kunden
  mer än sidan lovar, inte mindre.
- Väggspegelns tyska namn säger *Fenster*, alltså fönster. Beskrivningen och
  alla fem bilderna visar en spegel i organisk, asymmetrisk form.

Sex bilder ströks (`bilder-bort.tsv`): snögubbens bild 5 bär husmärket,
dörrgrindens måttbild och bild 4 bär tysk text, leksaksdiskmaskinens måttbild
bär en tysk åldersrad, och ministepperns och spegelskåpets bild 4 bär tysk
rubrik och text. 68 bilder återstår. Måttbilden ligger sist på de 13
produkter som har en. Dörrgrinden och leksaksdiskmaskinen har ingen kvar.

Ett tal i texterna står som ord och är räknat på produktfotona: säckkärrans
tre hjul på varje sida. Källan anger sex hjul totalt. Talet är kvitterat i
`foto-tal.txt`, så att siffergrinden släpper igenom det.

## Wix, i den ordning det skrevs

| steg | utfall |
|---|---|
| 1a text, namn, slug, SEO, synlighet (8 produkter) | 8 av 8 skrivna, transkriberingsspärren ren |
| 1b text, namn, slug, SEO, synlighet (7 produkter) | 7 av 7 skrivna, transkriberingsspärren ren |
| 2 media | 15 av 15 skrivna, 68 bilder, spärren ren |
| 3 kategorier | 35 av 35 rader success i 15 kategorier, `bulkActionMetadata` 0 fel överallt |
| 4 variant-SKU (sist och ensam) | 15 av 15 skrivna; alla varianter synliga före, priserna orörda (719, 729 och 739 kr) |
| stämpel (`stampla`, körningar 4258–4272) | 15 av 15 gröna; rutten läser tillbaka raden själv och svarar 500 om den inte stämmer |
| 5 separat återläsning | 15 av 15 helt verifierade vid första läsningen (text-hash, namn, slug, SEO två taggar, media, kategorier, SKU, synlig variant); priserna som förut |

## Grindar

Alla rena: `gate.py` (0 fynd i 15 filer mot källan, 0 varningar),
`gate-axel.py` (0 axelfel), `gate-alt.py` (68 alt-texter, 0 fynd),
`gate-seo.py` (0 fynd i 15 rader), `gate-lager.py` (lägsta saldo 15),
`gate-sku.py` (längsta SKU 31 av 40 tecken), `gate-superlativ.py`,
`gate-lankar.py` och läck- och teckensvepet (0 fynd i 20 filer). Formsvepet för
artikelnummer: 41 filer och 8 träffar, alla på strängen `vit-140`, alltså cd-hyllans färg och höjd i dess SKU och slug, i stegfilerna och i den här filen. Inget artikelnummer.
Omkörda på de slutliga filerna efter skrivningen, med samma utfall.

## Live

`hamta-live.sh 130`: alla 15 gav HTTP 200 vid båda hämtningarna, utan ett
enda omförsök. Vid den skarpa hämtningen var `age` 149–150 s på fjorton sidor
och 487 s på trehjulingen, som hämtades först i den varma omgången. Alla
renderingar gjordes alltså efter Wix-skrivningarna.

`livegrind.py`: orddiff 0 på alla 15, alltså 0 avvikelser i den publicerade
texten. `livekoll.py`: 15 av 15 OK med brödsmula, pris 719, 729 eller 739 kr
och `InStock`, och 68 av 68 alt-texter.

## Hölls

Alla med en rad i `FLAGGADE.md`:

- en med husmärke på varan
- tjugoen träffar mot publicerade sidor av samma slag
- nio i familjer som redan är täckta eller inte gick att avgöra utan utredning
- fem där skärmen inte kunde läsa några mått ur källan
- en som var slut i lager
- fyra troliga syskon till produkter i rundan, högre upp i priskön
- trettiofem trädgårds- och utevaror, som väntar på säsongen

Alla 52 dubblettskärmade kandidater är alltså antingen publicerade eller
flaggade, och ingen reserv står kvar. Nästa runda börjar på 749 kr. Där rör
"Runda …"-serien på `main` sexton utkast till, utöver de tre som redan var
kända, och de filtrerades bort före skärmen.

Snögubben går ut i god tid före jul.
