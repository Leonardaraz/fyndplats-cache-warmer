# Runda N39 — åtta produkter, 599–629 kr

Åtta Aosom-utkast polerade och publicerade: en hopfällbar balansbom på
236 cm i blått, en golvlampa med trebensstativ och vit tygskärm, en
tvätthylla i bambu med två tygkorgar, en skohylla i svart metall med fyra
hyllplan, ett hörnblomställ i tre plan, en pall med stoppad sits i mörkgrått,
en hopfällbar pilatesbräda med tillbehör och en tvättsorterare i bambu.

Rundan kördes PARALLELLT med Runda N38, i en egen git-worktree på en lokal
gren, och delade urvalet med N38 på wix-id:ts första tecken: **N39 tog bara
id som börjar på `8`, `9` eller `a`–`f`**, N38 `0`–`7`. N38:s `ids.tsv`
lästes efter urvalet och en gång till omedelbart före Wix-steg 1, dess
`slugs.txt` och `sku.tsv` omedelbart före steg 1 och `sku.tsv` en gång till
omedelbart före steg 4: **noll överlapp** i id, slug och SKU vid alla
tillfällena. Allt pushat på grenen `claude/seo-polering-runbook-review-uq6fwl`
med rebase ovanpå N38:s commits.

| id | produkt | SKU | pris | dealproffsen | saldo |
|---|---|---|---:|---:|---:|
| a9360e2a | Balansbom 236 cm i blått – hopfällbar, halkfri undersida, från 3 år, bär 80 kg | FP-balansbom-236-bla | 599 kr | 619 kr | 70 |
| c694dcaa | Golvlampa med trebensstativ i svart metall – vit tygskärm Ø37 cm, höjd 152 cm | FP-golvlampa-trebensstativ-vit-skarm | 599 kr | 619 kr | 8 |
| d3655c3e | Tvätthylla i bambu med två tygkorgar – två hyllplan, 44 × 34 × 96 cm | FP-tvatthylla-bambu-tva-korgar | 599 kr | 619 kr | 44 |
| e514191b | Skohylla i svart metall med fyra hyllplan – blomdekor, 59,5 × 30 × 92 cm | FP-skohylla-fyra-plan-blomdekor | 599 kr | 649 kr | 62 |
| f75a8a17 | Hörnblomställ i tre plan – kvartscirkelformade hyllor, svart metall, bär 30 kg | FP-hornblomstall-tre-plan-svart | 599 kr | 619 kr | 104 |
| ba454107 | Pall med stoppad sits i mörkgrått tyg – svarta stålben, 42 × 42 × 44 cm | FP-pall-morkgra-stoppad-sits | 619 kr | 659 kr | 153 |
| f4bdb64c | Pilatesbräda med tillbehör – hopfällbar, gummiband, glidplattor, bär 150 kg | FP-pilatesbrada-hopfallbar | 619 kr | 729 kr | 186 |
| 95b6f5bd | Tvättsorterare i bambu – tvättpåse och förvaring i tre fack, 70 × 36 × 70 cm | FP-tvattsorterare-bambu-vit | 629 kr | 639 kr | 36 |

Vi är billigast på alla åtta, 10–110 kr under dealproffsen. **Inget pris är
rört** — prisgrinden stämde (`x1,2`, `charm99`) både i urvalets `las` och i
verifieringen efter stämpeln, och JSON-LD på de publicerade sidorna bär
samma åtta belopp.

Wix-siten verifierades FÖRST mot N37:s publicerade `81a3065e` ("Väggkrukor
3-pack i svart stål – runda, akrylfront, Ø30,5, Ø20,5 och Ø15,5 cm") — namn
och `visible: true` stämde.

## Urvalet — Leonards regel, reserverna först

Ingen körning av `dealproffsen.yml` från de senaste två timmarna började på
599 kr eller lägre med full lista, så rundan startade en egen: körning
**35809913730** (`mode: jamfor`, `fran_pris: 599`,
`ref: claude/seo-polering-runbook-review-uq6fwl`). Den var fullständig: varv 2
slutade på `0 prefix kvar` och loggen har inga `FEL <prefix>`-rader.

| | |
|---|---:|
| granskade | 4 950 |
| **vi billigare, totalt** | **3 767** |
| **varav opolerade** | **2 105** |
| listans topp 40 (opolerade, billigast uppåt från 599 kr) | 599–639 kr |
| …i N39:s halva (`8`–`f`) | **24** |
| kvar efter förfiltreringen | 11 (599–629 kr) |
| valda | 8 (599–629 kr) |

### Förfiltreringen av de 24

| skäl | antal | id |
|---|---:|---|
| i `FLAGGADE.md` utanför reservraden (miniugnsklustret, växthusen, balansbomssyskonen i N36:s klusterrad) | 5 | `ff145fb1`, `b46705f9`, `8d3d1de1`, `8f351be4`, `a17cf506` |
| rörd av main:s "Runda …"-serie (Runda 125/126) | 1 | `d16f677e` |
| slutsåld — omprövad från N37: fortfarande `OUT_OF_STOCK` | 1 | `b6cdf76b` |
| fel säsong: dynor för trädgårdsbänk | 3 | `c8e3c2d6` (reserv), `91b18246`, `c519b4fe` |
| fel säsong: trädgårdsbord och trampolinkant | 2 | `ffc26041`, `e375834f` |
| husmärket TRYCKT på en medföljande del (bärväskan) | 1 | `8ad49cfe` |

### De sex reserverna från N37

| reserv | öde |
|---|---|
| `a9360e2a` balansbom, blå | **publicerad** — billigast av fem kulörer, ingen av dem publicerad |
| `c694dcaa` golvlampa | **publicerad** |
| `d3655c3e` tvätthylla | **publicerad** (bild 4 struken, tysk text) |
| `e514191b` skohylla | **publicerad** |
| `f75a8a17` hörnblomställ | **publicerad** |
| `c8e3c2d6` bänkdyna, röd | **föll på säsongen** — en dyna för trädgårdsbänk i slutet av september, samma skäl som N2 och N36; dessutom bara tre rena bilder |

Alla sex stod kvar i den färska listan, alltså fortfarande billigare än
dealproffsen och fortfarande opolerade.

Dubblettskärmen svepte katalogen OFILTRERAT (60 sidor, 5 984 rader, `fields`
på varje sida, `utanText` 0) med trippelmönstrets självtest i samma anrop:
9 av 9 former. Publicerade 3 103 (2 480 med trippel), utkast 2 881. Ingen av
de åtta träffar en publicerad sida eller ett billigare utkast; balansbommens
fyra träffar är färgsyskon (se `FLAGGADE.md`), och den blå är billigast.

`las` (polish-mapping.yml, `ref: main`) kördes på de åtta och två reserver:
alla `supplier: aosom`, `needsAiPolish: true`, `pending_review`, prisgrind
`stämmer: true`, ingen `LÅST PRIS`, ingen `SLUTSALD`, ingen `prisgrupp`,
fraktandel 0,368–0,496. Varje körning bevisad som min på `wixProductId` i
loggen.

## Bilderna — granskade FÖRE texten, och de rättade källan fyra gånger

Kontaktark för 13 kandidater byggdes innan en rad text skrevs.

- **`c694dcaa`**: bild 4 och 5 visar en glödlampa med ett lampmärke och en
  energimärkningslogotyp — ett TREDJEPARTSMÄRKE, och lampan ingår inte.
  Strukna. Tre bilder kvar.
- **`c694dcaa`**: källans spec-rad säger "Blau, Orange, Gelb"; källans egen
  tekniska data och bilderna säger svart och vit. Texten följer bilderna.
- **`d3655c3e`**: bild 4 bär tysk text inbränd — struken. Fyra bilder kvar.
- **`f4bdb64c`**: källan säger "Hellblau"; brädan är lavendelfärgad på alla
  fem bilderna — lavendelblå i texten. Källan är dessutom oense med sig själv
  om antalet övningar; texten räknar upp de fem källan namnger.
- **`e514191b`**: källans namn säger växttrappa — bilderna visar en rak hylla
  med fyra lika djupa plan.
- **`ba454107`**: källan säger kashmirlook — bilderna visar ett lockigt,
  noppigt tyg. Texten påstår ingen kashmir.
- **`f75a8a17`**: måttbilden visar tre koncentriska kvartscirklar; 85, 56 och
  28 cm är mätta från ände till ände, inte längs den böjda framkanten.

## Grindar före skrivningen

| Grind | Resultat |
|---|---|
| `kallor.json` mot skarpa V3 (server-side h·31) | **8 av 8 LIKA**, inget artikelnummer att redigera |
| `bilder.tsv` mot skarpa V3 | **8 av 8 LIKA** |
| `gate.py` | **0 fynd, 0 varningar** |
| `bygg-axelfacit.py` + `gate-axel.py` | **0 axelfel** i 8 texter |
| `gate-alt.py` | **REN**, 37 alt-texter |
| `gate-seo.py` | **0 fynd** |
| `gate-lager.py` | **0 fynd**, lägsta saldo 8 |
| `gate-sku.py` | **0 fynd** (längsta 36 av 40 tecken) |
| SKU-krock (61 `sku.tsv`, 479 SKU:er, inkl. N38) | **0** |
| Slug-krock (5 984 slugs + N38:s `slugs.txt`) | **0** |
| `gate-superlativ.py` | **REN** |
| `gate-lankar.py` | **0 fynd** |
| Läck- och teckensvep, 13 kundvända filer | **0 fynd** |
| `npx vitest run lib/polish` | **99 av 99** |

⚠️ **Balansbommens bredd skrivs "har en bredd på 10 cm", inte "10 cm bred".**
Källans måttrad är `236L x 10/15B x 6,5H`, och axelfacit läser position 2
som djup. Texten säger rätt sak i en form grinden inte binder; grinden
ändrades inte mitt i en parallellrunda.

## Två granskningar före skrivningen

**Korrekturläsningen (steg 3):** sexton ändringar i sju filer, varav fem
sakliga (ett okällat "smalt", kordan kallad "framkant", ett okällat "stöd av
stången och gummibanden", två alt-texter som påstod vilket rum bilden visar)
och elva språkliga (idiom, särskrivning, haltande jämförelser). Hela
tabellen står i `framsteg.md`.

**Den oberoende, skeptiska granskningen (steg 5):** ett fynd, och det var ett
ord med fel betydelse. `d3655c3e` hette **tvättställ** — på svenska ett
HANDFAT. Bytt till **tvätthylla** i namnet, SEO-taggarna, fyra alt-texter,
brödtexten, slugen och SKU:n, och ordet sökt i alla rundans filer efteråt.

## Skrivningen, stämpeln och verifieringen

| steg | resultat |
|---|---|
| 1 namn/slug/brödtext/`visible`/SEO, spärr i samma anrop | **8 av 8**, ingen spärr utlöst |
| 2 media (fil-id + alt, måttbilden sist) | **8 av 8**, 37 bilder |
| 3 kategorier (bulk add-items) | **19 av 19 rader success**, `totalFailures: 0` |
| 4 variant-SKU sist och ensam, round-trip med `options` och `visible` | **8 av 8** |
| 7 separat återläsning | **8 av 8 helt verifierade** |
| 9 stämpel (`stampla`) | **8 av 8** `OK: <id> uppdaterad` |
| 9 stämpeln verifierad med en EGEN `las` per produkt | **8 av 8** `needsAiPolish: false`, `published`, rätt SKU, pris orört |

Stämpeln gick inom en halvtimme efter urvalets `las` (02:31 → 02:58). Varje
workflow-körning bevisades som min på produktens id i loggen innan dess
utfall lästes.

## Live-verifieringen och den andra korrekturläsningen

`hamta-live.sh 130` gav alla åtta `HTTP 200` med `age` 140–181 — den
rendering den varma träffen utlöste. `livegrind.py`: **8 av 8 REN, orddiff
0**, med homoglyf-, sid-, alt- och SEO-svep rena, alla tre flikarna
ordagranna, kategori i brödsmulan och köpbarheten ren. Ur samma sidor:
JSON-LD `InStock` och oförändrat pris på alla åtta.

Den andra korrekturläsningen gjordes på den PUBLICERADE texten — brödtexten
plockad mekaniskt ur de hämtade sidorna, 319 meningar och listrader — med
källan och kontaktarket bredvid. **Två fynd, båda korrekturfel i
golvlampan:**

- **`c694dcaa`**: "dragkedja" (ingressen, Egenskaper, FAQ och
  metabeskrivningen) är på svenska i första hand ett BLIXTLÅS — samma klass
  som "tvättställ". Källan säger *Zugschalter* och bilderna visar en
  kulkedja → "genom att man drar i en kulkedja", "Dragströmbrytare med
  kulkedja", "Dragströmbrytare".
- **`c694dcaa`**: "köps till separat" (två ställen) → "köps separat".

Rättat i filerna, alla filgrindar omkörda (gröna), och BARA de två berörda
fälten omskrivna med kontrollsumman i samma anrop: `plainDescription` med
`bygg-steg.py --rattelse` (**1 av 1**) och `seoData` med ett nytt läge i
rundans byggskript, `--seo-rattelse` (**1 av 1**). En separat återläsning
av alla åtta efteråt: **8 av 8 helt verifierade**. En ny live-hämtning och
`livegrind.py` mot de rättade filerna: **8 av 8 REN, orddiff 0** — "kulkedja"
finns på golvlampans sida, "dragkedja" inte, och den nya metabeskrivningen
står i sidans beskrivningstaggar.

## `FLAGGADE.md` — nya rader

Inga befintliga rader rörda. Nya, alla under "Bortvalda av andra skäl":

- N37:s reserver: vilka fem som publicerades och varför `c8e3c2d6` föll.
- Balansbommens fyra färgsyskon till den nu publicerade `a9360e2a`:
  `8d3d1de1` (ljusröd), `8f351be4` (rosa), `a17cf506` (flerfärgad) och
  `02f935c8` (violett och rosa) — kulörerna nu uppmätta ur källan.
- `8ad49cfe` (agilityset för hundar) — husmärket tryckt på den medföljande
  bärväskan.
- Fel säsong: bänkdynorna `c8e3c2d6`, `91b18246`, `c519b4fe`,
  trädgårdsbordet `ffc26041` och trampolinkanten `e375834f` (hela familjen
  står i N38:s säsongsrad; `14ff500d`, som `framsteg.md` först kallade en
  identisk tvilling, är mätt till en annan diameter, Ø305 mot Ø366).
- Reserver från N39: `a6657b3d` (konstgjord fikus), `bd61c238` (viktväst) och
  `eb029d50` (pedalhink 20 L).

`FARGSYSKONEN.md`: inga nya rader.

## Frågor till Leonard

1. **Husmärke tryckt på en del av leveransen** — `8ad49cfe`:s bärväska. Samma
   fråga som N37:s `fd85cf0b`/`b2175a65`, nu för en medföljande del och inte
   själva varan.
2. **Balansbommens färgfamilj.** Den blå är publicerad; fyra kulörer till
   väntar på beslutet i `FARGSYSKONEN.md`.

Inga licensfigurer i rundan. Golvlampans bild 4 och 5 bar ett
tredjepartsmärke (på en glödlampa som inte ingår) och ströks — sidan har
därför tre bilder.

## Faktakort

Faktakorten är medvetet uppskjutna, som i N15–N37. Rundan räknas som klar
utom dem.

## Filer i katalogen

Skrivna för rundan: `bygg-kallor.py` (som bygger `kallor.json`), de åtta
`<id>.html`, `namn.tsv`, `slugs.txt`, `seo.tsv`, `sku.tsv`, `alt.tsv`,
`bilder.tsv`, `bilder-bort.tsv`, `kategori.tsv`, `lager.tsv`, `variant.tsv`,
`ids.tsv`, `framsteg.md`. Genererade av `polish-gates` ur dem:
`axelfacit.json`, `raa-hash.tsv`, `vantat-hash.tsv`, `nyttolast-media.json`,
`medieskrivning.json`, `media-hash.tsv`, `steg1-bas.js`, `steg2.js`.
Genererade av rundans `bygg-steg.py` (kopierad från N37 med rundnamn och
docstring ändrade, plus ett nytt läge `--seo-rattelse` som skriver BARA
`seoData` ur `seo.tsv` med kontrollsumman i samma anrop): `steg1.js`
(gitignorad), `steg3.js`, `steg4.js`, `steg5.js`. De hämtade live-sidorna
(`live/`) är gitignorerade, som i tidigare rundor.
