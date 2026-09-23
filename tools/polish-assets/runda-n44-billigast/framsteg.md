# Runda N44 — framsteg

Uppdateras efter varje steg. Om rundan avbryts: läs den här filen först.

## Start

- Femte rundan utan agenter, i huvudsessionen, tio produkter per vända
  (Leonards besked 2026-09-23). Urvalsregeln är densamma som i N40–N43: de
  billigaste opolerade utkasten i hela katalogen, billigast först, **utan
  prisjämförelse**. Kontrollerna som skyddar kunden gäller fortfarande.
- Grenen `claude/seo-polering-runbook-review-uq6fwl` på `15742e6` (main #640
  inmergad efter N43). `origin/main` är `2fbcfaa`, och senaste "Runda …"-commit
  är fortfarande Runda 147. Mängden id som serien rör är alltså oförändrad
  sedan N40.

## Urval — billigast först, utan prisjämförelse

Ett nytt svep (61 sidor, 6 025 rader: 3 159 publicerade, 2 866 utkast) listade
234 utkast upp till 649 kr. Varje kandidat prövades mot alla rundors `ids.tsv`
(605 id), `FLAGGADE.md` (269 id) och main-serien (1 661 id). Ingen fanns i
main-serien.

⚠️ **Ett id som bara NÄMNS i `FLAGGADE.md` är inte flaggat.** Ett rent
id-uppslag mot filen ströp i N43 även utkast som bara förekom som
jämförelseobjekt. N44 läste därför raden bakom varje träff upp till 559 kr:

| id | vad raden säger | utfall |
|---|---|---|
| `cf92c3bd` konstväxt 95 cm, 519 kr | N42: "en ANNAN växt än `2cfd222e`" — avgjord | **kandidat**, vald |
| `e36dab73` julgran, 519 kr | N41: namntvilling, "Det är inte prövat" | **prövad**, vald (se nedan) |
| `a7186f2b` skobänk, 529 kr | N41: samma tyska namn som `7febe06d` | **prövad**, hålls (se nedan) |
| `2cb5b77e` LED-björk, 559 kr | N40: namntvilling till publicerade `3d3f90d3` | **prövad**, reserv |

Övriga träffar i spannet har egna rader med skäl (färgsyskon, tvilling,
säsong, husmärke, main-seriens växthus) och står kvar som flaggade.

| id | öde |
|---|---|
| `cf92c3bd` konstgjord dieffenbachia 95 cm | **vald** (saldo 119) |
| `e36dab73` julgran 150 cm, Ø46 cm | **vald** (saldo 79) |
| `a7186f2b` skobänk i bambu, grå | **hålls** — samma bänk som den PUBLICERADE `8f0a4df1` eller ett färgsyskon till den, se nedan |
| `a7e88a1b` ergonomisk sittdyna | **vald** (N43:s reserv, saldo 155) |
| `b5b3b852` elektronisk darttavla | **vald** (N43:s reserv, saldo 197) |
| `e90dcc5a` balansstenar i TPR | **vald** (N43:s reserv, saldo 144) |
| `0dfaa38b` medicinskåp 25 × 12 × 48 cm | **vald** (saldo 197) |
| `10cd6afb` konsolbord 75 cm | **vald** (saldo 197) |
| `723b56c3` paviljongdraperier | hoppad över för säsongen |
| `aaa9f500` tvättkorg i bambu 72 L | **hålls** — tvilling till den PUBLICERADE `15746de3`, se nedan |
| `00d6f785` LED-björk 150 cm, 120 LED | **vald** (saldo 197) |
| `0feec456` tipitält för husdjur | **vald** (saldo 92) |
| `1476f00c` leksakshylla, grön | **vald** (saldo 52) |
| `173bc5bd` smal julgran 195 cm | **reserv** |
| `2cb5b77e` LED-björk 180 cm, 96 LED | **reserv** — storlekssyskon till publicerade `3d3f90d3` (120 cm) |
| `300d3415` julby i trä med 10 LED | **reserv** |
| `40b7dfa0` springcykel, grön | **hålls** — färgsyskon till den PUBLICERADE `6f101f90`, se nedan |
| `45bd0805` häcksax, `6f972315` paviljongtak | hoppade över för säsongen |
| `447234be` leksakshylla, rosa | **hålls** — färgsyskon till `1476f00c`, som publiceras i rundan |
| `2ffa80f1` gnistskydd 96 cm | **hålls** — oprövad mot den PUBLICERADE `ae2ac5e5`, se nedan |

**Dubblettskärmen** kördes i N43:s form över hela katalogen (61 sidor, 6 025
rader, `fields` på varje sida, självtest 9 av 9, `utanText` 0): 3 159
publicerade (2 537 med trippel), 2 866 utkast, med saldot i samma anrop för 25
kandidater (52–197, alla `IN_STOCK`). Svaret kapades vid 6 000 tokens mitt i
de egna listorna, så de hämtades om i ett andra, kompakt anrop: publicerade
julgranar (63), darttavlor, balansstenar, medicinskåp (16), konsolbord,
tvättkorgar, LED-björkar, tipitält, julbyar, springcyklar, nattduksbord,
gnistskydd och halloweenfigurer. Specifikationerna för kandidaterna och 38
närmaste motsvarigheter hämtades sedan server-side, med artikelnumren
redigerade innan något lämnade anropet.

**De fyra som hålls** (tre avgjorda, gnistskyddet inte):

- `aaa9f500` (549 kr) mot den publicerade `15746de3` (459 kr): samma
  40 × 30 × 60 cm, samma 72 liter, båda bambu med lock. **Samma korg**, och
  utkastet är dyrare än den publicerade sidan.
- `a7186f2b` (grå och natur, 529 kr) mot den publicerade `8f0a4df1` (629 kr):
  samma 60 × 29 × 49 cm och 4,8 kg. Den publicerade sidan anger färgerna
  mörkgrå och vit, utkastet grått och naturträ, och namntvillingen `7febe06d`
  (499 kr) är krämvit och naturträ. **Samma bänk eller ett färgsyskon** —
  bilderna är inte jämförda, men båda skälen räcker för att hålla den.
  (Rättat när rundan skrevs ihop: en tidigare version av raden sa bara
  "samma bänk", vilket färgerna inte bär.)
- `40b7dfa0` (grön och vit, 559 kr) mot den publicerade `6f101f90` (vit och
  brun, 659 kr): samma 56 × 27 × 39 cm och 2,8 kg. **Färgsyskon.** Utkastet
  `1dfa992a` (brun och vit, 599 kr) är sannolikt samma cykel som den
  publicerade.
- `2ffa80f1` (96 × 1,3 × 56 cm, 3 kg, 569 kr) mot den publicerade `ae2ac5e5`
  (96 × 1 × 60 cm, 2,8 kg, 569 kr): samma bredd och pris men olika höjd och
  paketmått. Kan vara ett annat gnistskydd — inte prövat med bilder, så det
  hålls tills det är gjort.

**Och de som kunde se ut som dubbletter men inte är det:**

- **`cf92c3bd`** mot den publicerade `2cfd222e` (95 cm, 33 blad): N42:s
  bedömning står sig. Krukan är Ø17 × 14,5 cm och 4,7 kg mot Ø15 × 13 cm och
  3 kg, och bladen skiljer sig på bild (utsnitt sida vid sida): `cf92c3bd` har
  gulspräckliga dieffenbachiablad. Källan säger `Typ: Dieffenbachie`.
  Namntvillingen `376caddc` (120 cm, samma kruka) är ett storlekssyskon.
- **`e36dab73`** (Ø46 × 150 cm, 294 spetsar) i familjen bakom N41:s
  rättelserad: `520cc521` är Ø55 × 180 cm (den gröna versionen av publicerade
  `1f887213`), `7727e1bf` Ø55 × 210 cm och `792562e3` Ø60 × 210 cm. **Fyra
  storlekar, inte fyra kopior** — frågan N41 lämnade öppen är nu mätt.
  Ingen publicerad gran är Ø46 × 150 cm.
- **`0dfaa38b`** (25 × 12 × 48 cm, tre plan på 14 cm) mot de publicerade
  medicinskåpen: `5a825b3f` (N43) är 20 × 12 × 58 cm, `6d653305` 30 × 12 × 60
  cm och `715b4acd` 30 × 14 × 46 cm. **Ett annat skåp.**
- **`10cd6afb`** (75 × 24 × 76 cm, vit) mot de publicerade konsolborden
  (55, 80, 90, 100, 101 och 110 cm) och det smala sidobordet `ff10ccf5`
  (43 × 18 × 62,5 cm): inget är 75 cm.
- **`00d6f785`** (20 × 20 × 150 cm, 120 LED, tre ljusstyrkor) mot publicerade
  `68911c57` (22 × 22 × 150 cm, 96 kallvita, brun stam) och `3d3f90d3` (120 cm,
  72 LED): **en annan björk.** Utkastet `dafe6f89` är en körsbärsblomsvariant.
- **`e90dcc5a`** mot N43:s publicerade `60f84a27`: ett annat set (21,5–34,3 cm
  och TPR, mot 23–37,5 cm och TPE), som N43 redan konstaterade.
- **`1476f00c`**: ingen publicerad hylla har sex tygboxar och 63 × 30 × 66 cm.
  Trippelträffen `447234be` är den rosa versionen, ett utkast.

## Källorna och bilderna

- ☠️ **`kallor.json` är inte transkriberad för hand.** Källtexterna för 13
  produkter (de tio och tre reserver) hämtades server-side med artikelnumren
  redigerade, och filen skrevs mekaniskt ur verktygssvaren i sessionsloggen.
  **Noll redigeringar** behövdes. Kontrollen server-side räknade längd, h·31
  och varje block om 250 tecken — **10 av 10 LIKA** — och `bilder.tsv` mot
  `media.itemsInfo.items` i ordning — **10 av 10 LIKA**. Alla tio
  `visible: false`, revision 1–3.
- `las` (polish-mapping.yml, `ref: main`, utan kostnadsvisning): körningarna
  3992–4001, var och en bevisad som min på `PRODUCT_ID` och `wixProductId` i
  loggen. Alla `supplier: aosom`, `needsAiPolish: true`, `pending_review`,
  prisgrind `stämmer: true`, inget `LÅST PRIS`, ingen `SLUTSALD`, fraktandel
  0,417–0,469. Saldo 52–197. `lager.tsv` och `variant.tsv` är skrivna
  mekaniskt ur loggarna.
- Kontaktarken granskades före texten. Strukna bilder (`bilder-bort.tsv`):
  - `a7e88a1b` bild 2 — tysk text inbränd ("Nur Kissen").
  - `b5b3b852` bild 4 — tysk text inbränd (rubrik och text om pilhållaren).
  - `b5b3b852` bild 3 — **måttbilden säger 44 × 53 × 2,8 cm, källan
    47 × 41 × 2,5 cm.** Paketet är 44 × 50,5 × 5,5 cm och rymmer inte en
    tavla på 53 cm, så källan är den som går ihop. Texten följer källan, och
    en bild som motsäger texten ska inte stå bredvid den. Tavlan har därmed
    tre bilder och ingen måttbild.
  - `0feec456` bild 4 — tysk text inbränd (rubrik och text om den halkfria
    duken).
- Iakttagelser ur bilderna som styr texten:
  - **`1476f00c`**: boxarna är tre små, två mellanstora och en stor (bild 1,
    3 och 5). Källan ger bara de tre storlekarna, så antalet per storlek är
    fotoräknat och kvitterat i `foto-tal.txt`. Trycket "Keep exploring" sitter
    på själva boxen, på engelska — ingen inbränd text och inget husmärke.
  - **`0dfaa38b`**: bild 5 är en tryckspärr med ordet "PUSH" präglat i
    metallen. Det är produktens egen del, på engelska, och alt-texten säger
    bara "spärren". Texten påstår ingen tryckfunktion, för källan gör det inte.
  - **`10cd6afb`**: bild 5 visar två bord bredvid varandra, och alt-texten
    säger att ett ingår.
  - **`e36dab73`**: bild 2 är pyntad. Pyntet ingår inte (källan säger det
    uttryckligen), och både texten och en fråga säger det. Måttbildens
    siluett är märkt 180 cm, ett tal som inte finns i källan, så alt-texten
    säger bara "en mänsklig siluett".
  - **`0feec456`**: katten i bild 5 är svartvit; bild 2 är en annan katt.

## Grindar

| Grind | Resultat |
|---|---|
| `gate.py` | **0 fynd, 0 varningar** (efter kvittot i `foto-tal.txt`) |
| `bygg-axelfacit.py` + `gate-axel.py` | **0 axelfel** i 10 texter (2 axelkonflikter i källan, ingen i texten; raderna om saknade egna mått är upplysningar) |
| `gate-alt.py` | **REN**, 46 alt-texter |
| `gate-seo.py` | **0 fynd** — efter att två namn kortats (82 → 77 och 79 tecken) |
| `gate-lager.py` | **0 fynd**, lägsta saldo 52 |
| `gate-sku.py` | **0 fynd** (längsta 33 av 40 tecken) |
| SKU-krock (66 `sku.tsv`, 529 SKU:er) | **0** |
| Slug-krock (6 025 slugs i katalogen, server-side + 689 i rundornas `slugs.txt`) | **0** |
| `gate-superlativ.py` | **REN** |
| `gate-lankar.py` | **0 fynd** |
| Läck- och teckensvep, 15 kundvända filer | **0 fynd** |
| Formsvep efter artikelnummer i hela rundkatalogen | **0 träffar** (bara slug-delarna `294-grenspetsar` och `120-varmvita`) |
| `npx vitest run lib/polish` | **97 av 99** — de två felen finns redan på main, se nedan |
| `bygg-media.py` | **OK**, 46 bilder, måttbilden (källposition 3) sist på nio av tio |

⚠️ **`vitest`: två fel som inte är rundans.** `gate-kopior.test.ts` fäller på
42 `livegrind.py`-kopior i main-seriens kataloger (`runda-94` till
`runda-138`), och `artikelnummer-lackage.test.ts` fäller på 259 fynd i
main-seriens kataloger och `tools/polish-assets/grindar.py`. Alla de filerna
är byte-identiska med `origin/main` (noll diffrader), och ingen av dem är en
N-runda. N43:s 99 av 99 kördes före mergen av main #640.

## Korrektur och skeptisk granskning

**Under skrivningen** ströks tre påståenden som källan inte bär: att
sittdynan "kan ersätta en dyna" (källan: "Ergänzung oder Ersatz für
verschiedene Stühle", tvetydigt), en rad "220–240 V, 3,6 W" i björkens
egenskaper (ingång och uteffekt ihopblandade), och att växtens blad går att
böja (källan säger grenarna).

**Korrekturläsningen** av alla tio texter som helhet gav:

- **Julgranen:** "fyllig" stod tre gånger. Inledningen säger nu "naturtrogna
  grenar", avsnittet "ett frodigt intryck".
- **Medicinskåpet:** "Stommen är av rostfritt stål" stod två gånger.
  Inledningen säger nu "i rostfritt stål", och avsnittet "Stålet är av typen
  430 och rostar inte".
- **Sittdynan:** "ger bekvämt stöd" (källan säger komfort, inte stöd) →
  "gör dynan bekväm att sitta på i flera timmar".
- **Darttavlan:** en lång mening delad, och "Kasta med de mjuka spetsarna" →
  "Använd pilarna med mjuka spetsar".
- **Växten:** krukans mått flyttade till första meningen om krukan.
- **Leksakshyllan:** "låg" struket (källan säger bara att höjden passar barn
  3–8 år).
- **Balansstenarna:** "tar lite plats" → "är lätta att förvara" (källan:
  "für ordentliche Aufbewahrung").
- **Tipitältet:** "Under dynan ligger en halkfri bottenmatta" → "Tältet har en
  halkfri bottenmatta" (källan anger inte var mattan ligger).

Grindarna kördes om efter ändringarna: alla rena.

## Stegfilerna

`bygg-steg.py` är N43:s med bara rundnamnet ändrat (kontrollerat med `diff`).
Byggt från rundans katalog: `raahash.py`, `hasha.py`, `bygg-media.py`,
`bygg-medieskrivning.py` (skriver `steg2.js`), `bygg-skrivning.py >
steg1-bas.js` och `bygg-steg.py steg1-bas.js > steg1.js` (skriver även
`steg3.js`–`steg5.js`). Alla fem stegfiler parsar i Node. `media-hash.tsv` har
tio rader, och `bygg-steg.py --stampla` ger en variant-SKU per produkt ur
`variant.tsv` och `sku.tsv`.

## Skrivningen och stämpeln

Rundans filer pushades före Wix (`544ad5a`). Main var oförändrad på
`2fbcfaa`, och senaste "Runda …"-commit var fortfarande Runda 147.

| steg | resultat |
|---|---|
| 1 namn/slug/brödtext/`visible`/SEO, spärr över text OCH namn/slug/SEO i samma anrop | **10 av 10**, ingen spärr utlöst (revision 1→2 eller 3→4) |
| 2 media (fil-id + alt, måttbilden sist) | **10 av 10**, 46 bilder (darttavlan tre, sittdynan och tipitältet fyra, övriga fem) |
| 3 kategorier (bulk add-items, uppslag på namn i samma anrop, 54 kategorier) | **21 av 21 rader success** i tolv kategorier, `totalFailures: 0` överallt |
| 4 variant-SKU sist och ensam, round-trip med `options` och `visible` | **10 av 10**; variant och produkt synliga före, priset före skrivningen 519–559 kr |
| 5 separat återläsning | **10 av 10 helt verifierade** vid första läsningen: text, namn, slug, SEO, bilder, kategorier, SKU, variantens synlighet, pris och `IN_STOCK` |
| stämpel (`stampla`, körningarna 4002–4011) | **10 av 10** `OK … uppdaterad`, var och en bevisad som min på `PRODUCT_ID` |
| stämpeln verifierad med en EGEN `las` per produkt (4012–4021) | **10 av 10** `needsAiPolish: false`, `published`, rätt SKU, prisgrind `stämmer: true` |

Ingen kategori släpade den här gången. Darttavlan `b5b3b852` har en ensam
toppkategori (`Sport & Fritid`, inget löv passar), precis som N42:s
brasskärm och N43:s sidobord, men den syntes i projektionen redan vid första
återläsningen (två kategorier med `All Products`).

Saldot i `las` efter stämpeln: 52–197, samma som i urvalet.

## Live

`hamta-live.sh 130`: alla tio `HTTP 200`, `age` 142–144. `livegrind.py`:
**orddiff 0 på alla tio, 0 avvikelser**. `livekoll.py`: **10 av 10 OK**, 46 av
46 alt-texter, brödsmulan rätt på alla, priserna 519–559 kr (samma som före
SKU-skrivningen).

Den andra korrekturläsningen av den publicerade texten gjordes INTE i N44
(Leonards önskan om högre tempo 2026-09-23): orddiffen bevisar att live-texten
är exakt filen, och filen korrekturlästes före skrivningen.
