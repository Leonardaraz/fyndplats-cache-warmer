# Runda B6 — två kök, ett sminkbord och fem barnfordon ur den äldsta änden

Sjätte rundan från den ÄLDSTA änden av poleringskön. Alla åtta är tyska
feed-utkast från 2026-08-27: två leksakskök, ett sminkbord, en trampbil,
två trehjulingar och två elbilar. Alla passar som julklappar.

| id | produkt | SKU | pris | saldo |
|---|---|---|---:|---:|
| bb7160d3 | Leksakskök i rosa och vitt – smalt kök med tillbehör i trä, för 3–6 år | FP-leksakskok-rosa-tratillbehor | 1 069 kr | 40 |
| 3fbd5e8c | Sminkbord för barn med hjärtvingar och pall – avtagbar spegel, rosa, från 3 år | FP-sminkbord-barn-hjartvingar | 999 kr | 82 |
| 321f878a | Leksakskök med rinnande vatten och ånga – 85 delar, musik och ljus, 3–6 år | FP-leksakskok-vatten-anga | 949 kr | 176 |
| 5b69e81c | Trampbil för barn – hjullastare med skopa och släpvagn, gul, från 3 år | FP-trampbil-hjullastare-slap | 1 139 kr | 123 |
| 0bab65e3 | Trehjuling med skjuthandtag och solskydd – grå, fempunktssele, 12–60 månader | FP-trehjuling-skjuthandtag-gra | 1 119 kr | 84 |
| ad8facdb | Trehjuling 6-i-1 med skjuthandtag – vit, solskydd och korg, 12–60 månader | FP-trehjuling-6-i-1-vit | 879 kr | 38 |
| 2daff9fd | Elbil för barn 12 V i rosa – terrängbil med fjärrkontroll, 3–5 km/h, 3–6 år | FP-elbil-barn-rosa-terrang | 2 159 kr | 141 |
| 6a2451c4 | Elbil för två barn 24 V – terrängbuggy med fjärrkontroll, 5–7 km/h, 3–8 år | FP-elbil-tva-barn-buggy-bla | 4 269 kr | 197 |

**Inget pris är rört.**

## Så valdes de åtta

Efter B5 låg nästa 135 äldsta utkast (ur ett osorterat svep över hela
katalogen, sorterat på skapandedatum i koden) nästan bara i barnfordon, i
färgfamiljer. 103 av dem var fria i `FLAGGADE.md`. Fyra regler sållade:

- ☠️ **Licensierade märken i namnet hålls**, som i N32 och N33: Audi, BMW,
  Vespa, Mercedes, Lamborghini, Honda, McLaren och Caterpillar.
  Licensfrågan är Leonards. Hela listan står i `FLAGGADE.md`.
- **Färgsyskon till publicerade sidor hålls**: elmotorcykelfamiljen
  `bc9f1cef`/`5fafabd9`/`0a27ed50` (två gemensamma måttripplar med
  publicerade `372ee931`) och SUV-elbilen `989dbf87` (`479f7291`).
- **En färg per familj** där ingen är publicerad: den grå trehjulingen
  `0bab65e3` (saldo 84) ur familjen med ryggkorg, och det turkosa köket
  `321f878a` (saldo 176) framför det rosa (15).
- **Saldo 0–5 hoppas över**: åkhästen `9f0ade76`, bubbelmotorcykeln
  `1416e4a4` och tre till.

## Bilder före text

Kontaktarken lästes före texten. Tretton bilder ströks
(`bilder-bort.tsv`), och 27 står kvar:

- elva med tysk text inbränd: tre måttbilder med *Empfohlenes Alter* och
  *Gewichtsgrenze*, och åtta rubrikbilder (*MEHR DETAILS*, *VIEL
  FAHRSPASS*, *INKLUSIVE FERNBEDIENUNG*, *EIN WUNDERBARES GESCHENK* med
  flera)
- två med engelsk text: *PRODUCT DETAILS* och *MORE DETAILS* på
  trehjulingarna

⚠️ Den vita trehjulingen (`ad8facdb`) står därmed med två bilder, och
fyra produkter med tre.

⚠️ **Märken tryckta på själva produkten** syns på bilderna men nämns inte
i texten: *LOVELY* på båda trehjulingarnas ram, *KCK* på terrängbuggyns
front och *HOME CHEF* på det turkosa köket. Samma hantering som
VINSETTO-stolarna (#195).

## Där källan och bilden inte sa samma sak

- Det turkosa köket (`321f878a`) har *Farbe: Grün+Weiß+Gelb* i källan.
  Bilderna visar turkos, gräddvitt och gult, och det är vad sidan säger.
- Den rosa elbilen (`2daff9fd`) har *4X4* på sidan men två motorer.
  Sidan kallar den terrängbil och säger inte fyrhjulsdrift.
- Sminkbordets två vingar räknades på bilderna och har en rad i
  `foto-tal.txt`.

## Grindar

Alla rena: `gate.py` (0 fynd, 0 varningar), `gate-alt.py` (27
alt-texter), `gate-seo.py`, `gate-sku.py` (längsta SKU 31 av 40 tecken),
`gate-lager.py` (lägsta saldo 38), `gate-axel.py` (0 axelfel),
`gate-superlativ.py` och `gate-lankar.py`. Formsvepet för artikelnummer
gav 0 träffar i 22 filer, och hela `lib/polish` gick grönt (132 test).
Ingen av de åtta slugarna fanns i butiken, och kategorierna Elbilar för
barn, Leksakskök och Barnmöbler finns.

## Wix, i den ordning det skrevs

☠️ **Första torrkörningen föll, och skrev ingenting** (körning
36285031905, plan `7d61ada3…`). Serverns planspärr underkände slug och
SKU för båda elbilarna på *artikelnummerform*: `12v-rosa` och
`24v-fjarrkontroll` fastnar i den breda formen, alltså tre tecken med en
siffra, bindestreck och minst tre tecken till. Det lokala formsvepet
körde bara gatelibs smala `ARTNR` och såg det inte. Slugarna och SKU:erna
bär inte spänningen längre, och rundan sveptes om med båda formerna ur
`lib/polish/skrivplan.ts`: 0 träffar. Svepet provades åt båda hållen, och
det fäller de gamla formerna och släpper de nya.

Den rättade planen, `f7d997a9…`, gick igenom:

| steg | utfall |
|---|---|
| torr (körning 36285131459) | text, media och SKU 8 av 8 lästa, kategorier 20 av 20 rader planerade |
| text, namn, slug, SEO och synlighet | 8 av 8 skrivna (körning 36285315894) |
| media | 8 av 8 skrivna, 27 bilder |
| kategorier | 20 av 20 rader kopplade |
| SKU, sist och ensam | 8 av 8 skrivna, sista skrivningen 01:22:52 UTC |
| separat återläsning efter 90 s | 8 av 8 helt verifierade |
| stämpel | 8 av 8 stämplade, 0 stämpelfel |

Pushen med den första planen (`e85b0ebb`) hoppades över i båda projekten
(`CANCELED`). Pushen med den rättade planen (`e7aff177`) rörde också bara
`tools/`, men `fyndplats-cache-warmer` byggde den: `READY` på 59 sekunder.
Det är läkningsbygget som CLAUDE.md beskriver. Spannet från förra
`READY` (`49c16bf`, runda B1) till `e7aff177` är tio commits och rör noll
filer utanför `docs/`, `tools/` och markdown. Pekaren låg alltså utanför
den grunda klonen, och bygget flyttade fram den. `fyndplats-headless`
avbröt som vanligt.

## Live

`hamta-live.sh 130`: alla 8 gav HTTP 200. Alla åtta hade `age` 139 s
vid den skarpa hämtningen 01:35:30–01:35:38 UTC, alltså renderade omkring
01:33, efter den sista skrivningen 01:22:52.

`livegrind.py`: orddiff 0 på alla 8. `livekoll.py`: 8 av 8 OK med
brödsmula i rundans kategori, och 27 av 27 alt-texter står på sidorna. En
separat kontroll av JSON-LD gav `InStock` och samma pris som i `ids.tsv`
på alla åtta.

## Kategorier

Alla åtta under Barn & Familj. Köken under Leksaker & Spel och Leksakskök,
sminkbordet under Barnmöbler, trampbilen under Leksaker & Spel,
trehjulingarna under Leksaker & Spel och Baby & Småbarn, och elbilarna
under Elbilar för barn.

## Inga egna kort

Samma praxis som B1–B5 och N40–N56.
