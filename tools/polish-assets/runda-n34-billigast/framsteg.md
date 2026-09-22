# Runda N34 — framsteg

Uppdateras efter varje skrivsteg. Om rundan avbryts: läs den här filen först.

## Urval

Sweep av hela katalogen (5 984 rader, 60 sidor): 2 913 utkast totalt, 164 i
gapfönstret 1 600–1 858 kr (139 i lager), 2 007 utkast under 1 600 kr (ny
observation, ej tidigare känd — se LÄS-MIG.md).

Screenade 11 kandidater i spannet 1 619–1 799 kr (laundry-skåp, väggkamin,
tv-bänk, högskåp, skoskåp, sminkbord, 2 stolar, matgrupp, CD-hylla-reserv).
`las` kördes på alla 11 (run 35788676912–35788697405 + 106952075918/
106952085307): 10 av 11 `supplier: aosom, needsAiPolish: true,
draftStatus: pending_review, prisgrind stämmer: true`. **`01f3293a`
(Boxsack) var redan `draftStatus: rejected` — uteslöts.**

Full trippeldedup (7/7 självtest, 5 984 rader, 0 utanText) mot hela katalogen
körd två gånger (första regex missade "cm efter varje tal"-formen, fixad och
omkörd). Två kandidater uteslutna efter textjämförelse mot sina träffar:
- `aa8ce611` (Klappbarer Esstisch) — fyrvägs internt dubblettkluster,
  billigaste syskonet 1 359 kr; min kandidat var den DYRASTE i klustret.
- `b3a83f02` (Modernes Sideboard) — exakt tripplet 100×40×80 mot TVÅ
  publicerade produkter (en av dem N33:s egen `07565140`).

Tre gränsfall verifierade genom att läsa träffarnas egen text (inte bara
mått): `5022e9e5` mot `d2b4b403` (en är tvättskåp, andra är ett klaffbart
matbord — olika produkter), `3739257b` mot `53644ed2` (2-pack vardagsstol
mot en enstaka fransk karmstol — olika produkter), `8085d0b6` mot `50a808d5`
(180 cm HÖGT skåp mot 180 cm BRETT sideboard — permutationsträff, olika
möbeltyp). Alla tre bedömda som äkta olika produkter.

**Slutgiltigt urval (8, pris 1 619–1 699 kr) + 1 reserv (1 799 kr):**

| kort | produkt | pris | saldo |
|---|---|---:|---:|
| 5022e9e5 | Tvättskåp med två tippbara korgar | 1 619 kr | 43 |
| 32140f01 | Elektrisk väggkamin | 1 619 kr | 84 |
| 4f9ef409 | TV-bänk med skåp och öppet fack | 1 669 kr | 185 |
| 8085d0b6 | Högskåp med tre hyllor och tre lådor | 1 679 kr | 33 |
| bd2c7da3 | Skoskåp i sju nivåer | 1 699 kr | 40 |
| 6b91821a | Sminkbord med LED-spegel | 1 699 kr | 83 |
| 3739257b | Matstolar 2-pack i linnelook | 1 699 kr | 83 |
| 3bf5bd08 | Matgrupp 5 delar | 1 699 kr | 40 |
| 5c53dbfb (reserv) | Regal för CD/DVD | 1 799 kr | 70 |

Gapet 1 600–1 858 kr är **inte** uttömt av det här — 8 av 8 valda produkter
ligger under 1 700 kr, alltså gott om utrymme kvar i den nedre halvan av
fönstret. 156 utkast återstår där.

## Bilder — sakfel och strukna

- `5022e9e5`: zoomat på bild 1 — INGA separata öppna hyllor upptill, bara två
  spjälsdörrar som tippar fram (en av dem visas mitt i rörelsen, vilket ser ut
  som ett öppet fack om man inte zoomar). Rättat i texten innan den skrevs.
- `6b91821a`: zoomat på bild 1 — bekräftar att spegeln ÄR en dörr (gångjärn
  synliga) med två fack och krokar bakom, plus tre öppna fack per sida.
  Stämmer med källan.
- `8085d0b6`: bild 4 (fyra bildtexter "Anti-Kipp-Kits", "Silberne Griffe",
  "Leichtgängige Gleitschienen", "Gebogener Sockel") har TYSK TEXT INBRÄND —
  struken. Ingen av dessa detaljer (handtagsfärg, glidskenor, sockelform) togs
  med i texten eftersom de bara stod i den strukna bildens bildtexter, inte i
  källtexten.
- `bd2c7da3`: räknat 7 rader skor i bild 4 — bekräftar "sechs anpassbaren
  Regalen" (6 hyllplan) ger "siebenstufige" (7 nivåer), ingen motsägelse.
- `3bf5bd08`: källans egen Swedish-auto-spec säger "Färg: Hellgrau" men
  källans TYSKA Technische Daten säger "Naturholzmaserung + Weiß", och bilden
  visar ljust trämönster + vit ram, INTE grått. Skrev "Vit med ljust
  trämönster" i min egen spec-tabell i stället för att kopiera "Hellgrau" rakt
  av — samma familj som N33/N23:s axelkonflikt, fast på FÄRG.
  Motsvarande: samma produkts auto-spec sa "Material: Metall" men källans
  Technische Daten säger "MDF, Metall" — skrev "MDF och metall".

Inga husmärken hittade på någon produkt i någon bild.

## Oberoende granskning (efter första pushen)

Läste om alla åtta som en skeptisk utomstående, letade efter sakfel mot
bilderna, motsägande tal och kvarvarande tyska/engelska. Ett fynd:

- `6b91821a`: intron sa "Spegeln ÄR en dörr" men H2-stycket sa "Spegeln
  SITTER PÅ en dörr" — två olika mekanismer för samma spegel inom samma
  text. Rättat till "Spegeln går att fälla upp som en dörr" i båda styckena.

Inga ytterligare sakfel, inga motsägande tal, inga tyska/engelska kvar
(egen läcksvep + engelsksvep, 0 träffar), ingen SEO över gränserna.
Hashar, axelfacit och steg1–5 omgenererade efter rättelsen; alla grindar
och `npx vitest run lib/polish` (99/99) omkörda och gröna.

## Läge

- `kallor.json`: 8/8 LIKA mot skarpa V3 (h·31, server-side, artikelnummer
  redigerat på `6b91821a`, exakt 1 träff).
- Alla filgrindar rena efter tre rättningar (SKU-krock mot N32, slug-prefix
  mot en befintlig produkt, två SEO-siffror utan täckning i kroppstexten) —
  se LÄS-MIG.md för detaljer. `npx vitest run lib/polish`: 99/99, inklusive
  en verklig `artikelnummer-lackage`-träff i min EGEN docstring-kommentar
  (skrev av det riktiga numret i förklaringstexten i stället för "…") —
  hittad av testet, rättad.
- steg1.js/steg3.js/steg4.js/steg5.js byggda av `bygg-steg.py`.
- **Ännu INTE skrivet till Wix.** Nästa steg: push av filerna ogrindade-till-
  Wix, sedan den oberoende granskningen (N33:s steg), sedan skrivning.

| kort | steg 1 | steg 2 | steg 3 | steg 4 | steg 5 | steg 6 stämpel | steg 7 live |
|---|---|---|---|---|---|---|---|
| 5022e9e5 | – | – | – | – | – | – | – |
| 32140f01 | – | – | – | – | – | – | – |
| 4f9ef409 | – | – | – | – | – | – | – |
| 8085d0b6 | – | – | – | – | – | – | – |
| bd2c7da3 | – | – | – | – | – | – | – |
| 6b91821a | – | – | – | – | – | – | – |
| 3739257b | – | – | – | – | – | – | – |
| 3bf5bd08 | – | – | – | – | – | – | – |
