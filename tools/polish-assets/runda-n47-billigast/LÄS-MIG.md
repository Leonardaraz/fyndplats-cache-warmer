# Runda N47 — femton produkter för 599–639 kr

Femton Aosom-utkast polerade och publicerade, billigast först utan
prisjämförelse, på samma snabbare arbetssätt som N45 och N46: en träff mot en
publicerad sida av samma slag i dubblettskärmen betyder att kandidaten hoppas
över, stämpelns egen återläsning ersätter den separata `las`, och resultaten
loggas här direkt efter varje steg. Tre av produkterna var reserver från N46.

| id | produkt | SKU | pris | saldo |
|---|---|---|---:|---:|
| ccae0705 | Medicinskåp i rostfritt stål – låsbar glasdörr med tryckspärr, 30 × 18 × 50 cm | FP-medicinskap-rostfritt-tryck | 599 kr | 135 |
| f787a854 | Julgirlang 180 cm med 50 LED – snöpudrade kvistar, kottar, bär och timer | FP-julgirlang-180-50-led | 599 kr | 197 |
| f6e74878 | Skrivbord med hylla, 84 × 45 cm – vit metallram, ekfärgad skiva och kabelhål | FP-skrivbord-hylla-84-vit-ek | 599 kr | 48 |
| 0d42d53f | Väggspegel med hylla – svart metallram med rundade övre hörn, 70 × 50 cm | FP-vaggspegel-hylla-svart-70 | 619 kr | 24 |
| 114d37e5 | Halloweenfigur fågelskrämma 77 cm – rör sig, fnissar och lyser | FP-halloween-fagelskramma-77 | 619 kr | 197 |
| 760dd23c | Hopfällbar transportvagn för 200 kg – utdragbart flak och justerbart handtag | FP-transportvagn-hopfallbar-200 | 619 kr | 66 |
| b8002629 | Skärmtak för dörr och fönster, 100 × 75 cm – polykarbonat med UV-skikt | FP-skarmtak-100x75-polykarbonat | 619 kr | 124 |
| 26ec5761 | Gåvagn i trä med aktiviteter – formsortering, kulram och förvaring, från 1 år | FP-gavagn-tra-aktivitet-gron | 629 kr | 197 |
| 3b3705f5 | Bokhylla i trädform, 136 cm – nio plan, vit, med tippskydd | FP-bokhylla-tradform-136cm-vit | 629 kr | 136 |
| 934297b1 | Upphöjd hundsäng med tak, 106 × 76 cm – liggyta av nät, stålram och väska | FP-hundsang-solskydd-106cm | 629 kr | 29 |
| a62db5fd | Uppblåsbar tomte i släde med ren, 200 cm – LED-belysning, för inne och ute | FP-uppblasbar-tomte-slade-ren | 629 kr | 184 |
| b51b6e6c | Två konstgjorda granar 120 cm i kruka – 170 grenspetsar per gran | FP-tva-granar-120cm-kruka | 629 kr | 155 |
| b94fab48 | Badrumsspegel med hyllor, 60 × 48 cm – vit MDF, tre hyllplan | FP-badrumsspegel-hyllor-60-vit | 629 kr | 183 |
| f2aa99d9 | Hängande halloweenfigur 183 cm – lysande ögon och mun, rörelse och ylande | FP-halloween-hangande-183 | 629 kr | 197 |
| 0db7e560 | Hage för smådjur med 36 gallerpaneler – dörr ingår, 146 × 73 × 73 cm | FP-smadjurshage-36-paneler | 639 kr | 128 |

**Inget pris är rört.** Alla 15 `las`-körningar (4083–4097) gick gröna, alltså
stämde prisgrinden på varje rad. Variant-id lästes ur en enda Wix-GET i stället
för ur femton loggar.

## Bilder

Kontaktarken lästes före texten. Fyra bilder ströks: transportvagnens bild 2
(ett främmande varumärke på en kartong i bakgrunden) och bild 4 (tyska
etiketter), skärmtakets bild 4 (tyska etiketter) och girlangens bild 4, som är
nästan samma bild som bild 2. Transportvagnen har därför tre bilder, girlangen
och skärmtaket fyra.

Bilderna styrde också texten på tre ställen. Spegeln `0d42d53f` har källans
axlar omkastade mot bilden (källan kallar 70 cm för längd, bilden visar det som
höjd), så texten anger måtten utan axelord. Hundsängens måttbild visar 20 cm
vid ramen där källan anger 18 cm markfrigång, så texten anger inget av talen. Girlangens
måttbild säger 182,88 cm; texten följer källans 180 cm och alt-texten nämner
bara diametern.

## Wix, i den ordning det skrevs

| steg | utfall |
|---|---|
| 1a text, namn, slug, SEO, synlighet (8 produkter) | 8 av 8 skrivna, transkriberingsspärren ren |
| 1b text, namn, slug, SEO, synlighet (7 produkter) | 7 av 7 skrivna, transkriberingsspärren ren |
| 2 media | 15 av 15 skrivna, 71 bilder, spärren ren |
| 3 kategorier | 33 av 33 rader success i 13 kategorier, `bulkActionMetadata` 0 fel överallt |
| 4 variant-SKU (sist och ensam) | 15 av 15 skrivna; alla varianter synliga före, priserna orörda |
| stämpel (`stampla`, körningar 4098–4112) | 15 av 15 gröna; rutten läser tillbaka raden själv och svarar 500 om den inte stämmer |
| 5 separat återläsning | 15 av 15 helt verifierade vid första läsningen (text-hash, namn, slug, SEO två taggar, media, kategorier, SKU, synlig variant); priserna som förut |

## Grindar före skrivningen

Alla rena: `gate.py` (0 fynd i 15 filer mot källan; ett räknetal kvitterat i
`foto-tal.txt`), `gate-axel.py` (0 axelfel), `gate-alt.py` (71 alt-texter, 0
fynd), `gate-seo.py`, `gate-lager.py` (lägsta saldo 24), `gate-sku.py`,
`gate-superlativ.py`, `gate-lankar.py` och läck- och teckensvepet (0 fynd i
20 filer). SKU och slug krockar inte med någon tidigare runda. Tomteslädens slug
byttes före skrivningen till `…-slade-ren-led`, eftersom den första versionen
(ordet "ren" följt av talet 200) fastnade i formsvepet för artikelnummer.

## Live

`hamta-live.sh 130` (alla 15 med HTTP 200, `age` 148–149 s vid den skarpa
hämtningen) följt av `livegrind.py`: orddiff 0 på alla 15, 0 avvikelser i den
publicerade texten. `livekoll.py`: 15 av 15 OK med brödsmula, pris och
`InStock`, och 71 av 71 alt-texter.

## Hölls

Alla med en rad i `FLAGGADE.md`: tre träffar mot publicerade sidor av samma
slag, tre som är slut i lager, två som "Runda …"-serien på `main` har rört och
skrivbordens två tvillingar. Reserverna till N48 står sist i filen.

⚠️ **Hundsängen `934297b1` borde ha väntat till våren.** `FLAGGADE.md` (N38)
lägger upphöjda hundbäddar med solskydd under FEL SÄSONG. Regeln namnger
klustret "Hundeliege Outdoor mit Dach", och den här sängen bär ett annat tyskt
namn, så urvalet kopplade inte ihop dem. Sidan är publicerad och korrekt; den
får bara få besökare före våren. Dubblettskärmen i N48 mätte samtidigt klustret
mot den: ingen av de fem utkasten har samma mått, så sängen är ingen tvilling.
