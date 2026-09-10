# Runda 120 Steg 1 — barbordsseten

## Katalogsvepet

Kört i tre etapper till **`cursor === null`**. Kvittot är markören, inte
radantalet (uppgift #404, och odlingslådornas avhuggna svep 2026-09-02).

| | |
|---|--:|
| sidor | **57** |
| utkast | **3 124** |
| publicerade | **2 499** |
| katalogen | **5 623** |

⚠️ **Markören måste skickas tillbaka HEL.** Etapp 2 föll först på
`SE-1142 The cursor … is invalid` — jag hade trunkerat markören till 24 tecken
i min egen felsökningsutskrift och sedan skickat tillbaka den stympade. Ett
svep som avbryts på en stympad markör ser i loggen ut som ett svep som tog
slut; skillnaden är att `avhuggen` säger `true`.

## Familjen: 47 utkast + 20 publicerade

Svept på BÅDE tyska och svenska ord (`barhocker|barstuhl|barstol|barpall|
tresenhocker|thekenhocker`) — uppgift #421 mätte att ett svep på leverantörens
tyska ord tappar de redan polerade syskonen. Här var det avgörande: alla tjugo
publicerade heter `Barstolar …` och hade fallit utanför ett rent tyskt svep.

| | utkast | publicerade |
|---|--:|--:|
| barstolar ensamma (`Barhocker`) | 34 | **20** |
| **barbord MED sittplatser** (`Bartisch-Set`) | **13** | **0** |

☠️ **Barstolshalvan går inte att polera nu.** Tjugo publicerade sidor heter
alla `Barstolar 2-pack …`, och trettiofyra nya sidor på samma huvudord hade
kannibaliserat varenda en. Barborden har ett eget sökord (`barbord med stolar`,
`barset`) och noll publicerade konkurrenter.

## Dubblettgrinden mellan UTKASTEN

Kördes på fyra tal per rad — yttermått, sitthöjd, paketmått och vikt —
eftersom tvillingarna oftare sitter i utkastshögen än mot en publicerad sida.

**Ett par slog ut identiskt på varenda tal:**

| | `c88b5bbb` | `63a37524` |
|---|---|---|
| bord | 100 × 60 × 88 | **100 × 60 × 88** |
| pall | 32 × 32 × 57 | **32 × 32 × 57** |
| paketmått | 113 × 69 × 17,5 cm | **113 × 69 × 17,5 cm** |
| vikt | 26,1 kg | **26,1 kg** |
| pris | 1 559 kr | 1 599 kr |

### ✅ Men bilderna FRIADE dem — det är ett färgsyskon

`c88b5bbb` har **ljus ekskiva**, `63a37524` **mörk rustikbrun**. Identiskt
chassi, identiska mått, identisk vikt, olika träfärg. Uppgift #420 ordagrant:
*identiska mått + identisk vikt = FÄRGSYSKON, inte dubblett.*

⚠️ **Det är den ovanliga riktningen.** Runbookens regel — *"en måttmatchning
är ett SÅLL, inte en dom, avgör med BILDERNA"* — har i tidigare rundor nästan
alltid FÄLLT en produkt som såg unik ut. Här FRIADE den två som såg identiska
ut. Grinden är alltså inte en dubblettdetektor med bilder som formalitet; den
är ett såll där bilderna avgör åt båda hållen.

Båda poleras, som färgsyskon med korslänk till varandra — samma behandling som
runda 91 gav modell E:s fyra färger. Prisskillnaden på 40 kr är Leonards.

## De tretton, mätta och grupperade

**Tre delar — bord + två sittplatser (åtta):**

| id | pris | bord | sittplats | yta |
|---|--:|---|---|---|
| `441d2209` | 1 139 | 80 × 50 × 87 | fyrkantiga pallar | grå stenlook |
| `26d15aa5` | 1 219 | 105 × 40 × 90 | runda pallar Ø30 | rustikbrun |
| `394de213` | 1 259 | 80 × 50 × 90 + hylla | runda pallar Ø30 | vit ram |
| `f4ed1264` | 1 269 | 100 × 40 × 90 | runda pallar Ø41 | vit marmorlook |
| `3b38e191` | 1 349 | 89 × 45 × 87 | **stolar med ryggstöd** | ljus träskiva |
| `51c43e67` | 1 369 | 100 × 40 × 90,5 | **stoppade pallar med rygg** | grå stenlook |
| `c3bda64a` | 1 779 | 100 × 60 × 95 **+ två hyllplan** | fyrkantiga pallar | svart + ljus |
| `a0c8f793` | 2 829 | 116 × 70 × 89,5 **klaffskiva, skåp** | runda pallar Ø35 | ljust trä + svart |

**Fem eller sex delar — bord + fyra sittplatser (fem):**

| id | pris | bord | sittplats | yta |
|---|--:|---|---|---|
| `bc2157d2` | 1 439 | **TVÅ bord**, 80 och 100 × 40 × 90 | fyra pallar Ø29,5 | grå stenlook |
| `c88b5bbb` | 1 559 | 100 × 60 × 88 | fyra pallar 32 × 32 | **ljus ek** |
| `63a37524` | 1 599 | 100 × 60 × 88 | fyra pallar 32 × 32 | **rustikbrun** |
| `35e9609f` | 1 659 | 110 × 50 × 89,5 | fyra pallar Ø30 | rustikbrun |
| `2b03b3e4` | 3 769 | 120 × 60 × 91, A-ben | **fyra stoppade stolar** | trä + grått tyg |

Alla tretton är **i lager** och bär fem bilder var.

## Redan hittat inför Steg 4

☠️ **`c3bda64a`s måttritning bär ENGELSK text i pixlarna** — `374 lbs (170 kg)`
och `308 lbs (140 kg)`. Samma klass som uppgift #408, och den syns inte i något
`grep`: det är pixlar, inte markup. Ritningen är i övrigt språkneutral, så den
går sannolikt att beskära eller tvätta i stället för att kastas.
