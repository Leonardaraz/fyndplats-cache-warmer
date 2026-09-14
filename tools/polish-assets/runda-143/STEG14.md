# Runda 143 — Steg 14: 445 fel på sjutton KORREKTA sidor, och alla 445 är ETT tecken

Live-grinden gav **445 fel** över rundans sjutton publicerade sidor. Noll av
dem är rundans. Det är #560 en gång till — men den här gången är orsaken inte
bara beskriven utan **mätt till ett tal och en fix**.

## Det tre mätningarna säger

| kontroll | utfall |
|---|--:|
| offline-grinden (`grind.py`) | **0 fel** |
| rundans självtest (`grind.sjalvtest`) | 12 fall, **0 fel** |
| delade grindmodulens självtest | 90 fall, **0 fel** |
| ☠️ **live-grindens REGLER mot MIN EGEN html** | **0 textfel** |
| live-grinden mot de renderade sidorna | **445 fel** |

Den fjärde raden är den som avgör, och den kördes exakt som runda 142 gjorde:
`granska(pid, html=butikstvatt(B.HTML[pid]), live=True)`. Varenda TEXTREGEL
ger noll. Alltså har varje fynd i Steg 14 sitt ursprung **utanför min text**.

⚠️ Den mätningen ger 51 rader `struktur: FLIKEN … är ingen <summary>` (3 × 17),
och de är ett **mätartefakt, inte ett fynd**. `G.flikfel` letar efter butikens
RENDERING; min källtext bär `<h2>`-rubriker som storefronten gör om till
`<details>/<summary>`. Att köra en live-only-regel mot offline-text kan bara
falla. De 51 saknas också helt i det skarpa utfallet — sidorna renderar sina
flikar rätt, precis som Steg 13 mätte.

## Alla 445 är HOMOGLYF — inte en enda annan regel

```
=== fel per REGEL:
    445 live: HOMOGLYF
```

Noll `kortfel` (alla sjutton bär sitt eget Fyndplats-kort), noll `struktur`,
noll pris-, ålders-, superlativ- eller leveranslöftesfynd.

| tecken | namn | antal | var det kommer ifrån |
|---|---|--:|---|
| `★` | BLACK STAR | **320** | rekommendationsradens stjärnbetyg |
| `→` | RIGHTWARDS ARROW | 68 | `Visa produkt →` i samma rad |
| `🚚` | DELIVERY TRUCK | 17 | butikens `<title>`-rad, 1 per sida |
| `·` | MIDDLE DOT | 17 | samma rad |
| `⤢` | NORTH EAST AND SOUTH WEST ARROW | 17 | bildzoomens knapp, 1 per sida |
| `ø` | LATIN SMALL LETTER O WITH STROKE | 2 | **en GRANNES produktnamn** |
| `🔥` | FIRE | 2 | `🔥 Endast N kvar i lager` |
| `−` | MINUS SIGN | 2 | antalsväljarens minusknapp |

☠️ **Inget av de åtta tecknen finns i något av våra fält.** Mätt mot
`plainDescription`, `name`, `seoTitle`, `metaDescription`, `slug`, sökorden och
alla 97 alt-texter för alla sjutton produkter: **0 träffar**.

## ☠️ SUBTRAKTIONEN FALLER PÅ SITT EGET FÖNSTER — och 99 % är fixbart

Kontrollsidan `smart-boxningsdyna` drog bort **84 träffar**. Mekaniken KÖR
alltså. Varför blev 445 kvar ändå?

För att `liverunda.kontrollfynd` subtraherar på **EXAKT STRÄNG**, och
fyndsträngen bär ett fyrtiotecken brett FÖNSTER ur sidan:

```
HOMOGLYF ('★', 'BLACK STAR', 'tål, 6 rygglägen, svart. ★★★★★ ★★★★★ 4,5')
HOMOGLYF ('★', 'BLACK STAR', 'lägen, dips, max 120 kg. ★★★★★ ★★★★★ 5,0')
```

Samma tecken, samma chrome, **två olika strängar** — för fönstret svepte in
grannens produktnamn. Mängdsubtraktionen kan per konstruktion aldrig ta bort
dem. Det är #538 (ett LÄGE gjorde strängen unik), #560 (ett PRIS gjorde det)
och nu ett tredje ansikte: **grannens namn**.

Och här är talet som gör det till en åtgärd i stället för en suck. Om
fyndnyckeln vore TECKNET i stället för tecken + fönster:

| | |
|---|--:|
| Fel i dag | 445 |
| Varav tecknet ALLTID finns på kontrollsidan | **441 (99 %)** |
| Kvar | **4** |

**Fixen är alltså inte fler kontrollsidor — det är en smalare nyckel.**
Kontrollsidan såg `·→−★✓⤢🚚`; våra sidor såg `·ø→−★⤢🔥🚚`. Sju av åtta tecken
var redan bevisat butikens.

⚠️ **Och de fyra som blir kvar är de två fall som faktiskt förtjänar ögon:**

1. `🔥` × 2 — `Endast 3 kvar i lager` (`c5c228ab`) och `Endast 5 kvar`
   (`87ec8a16`). Chromen är **VILLKORAD på lagersaldot**: kontrollsidan hade
   fullt lager och renderade den aldrig. En enda kontrollsida kan alltså av
   princip inte täcka butikens alla lägen — bara de lägen den råkar stå i.
2. `ø` × 2 — se nedan. Ett ÄKTA fel, på en annan sida än rundans.

Det är exakt vad en grind ska göra: tysta det som är butikens, lämna kvar det
som är någons fel.

## ☠️ Fyndet grinden faktiskt hittade: en GRANNE stavar Ø som ø

Den publicerade sidan **`boxboll-vaggfaste-plattform-60-cm`** heter

> Boxboll med väggfäste – roterande plattform **ø**60 cm

med gement `ø` (LATIN SMALL LETTER O WITH STROKE) där husets alla andra sidor
skriver `Ø`. Den syns i rekommendationsraden på `d307632a` och `87ec8a16`, och
alltså är det GRANNENS namn som fäller — inte vårt.

Sidan är inte rundans och rörs inte härifrån. Fyndet är fört som en egen
uppgift.

## Vad som INTE är gjort, och varför inte här

⚠️ **Nyckeln är inte omlagd.** Fixen bor i `liverunda`/`grindar` — delad kod —
och #452 har redan mätt upp vad ett hastigt ingrepp i just den tvätten kostar
(12 fel på 8 korrekta sidor). Att skriva om subtraktionen i slutet av en runda,
på en hypotes, är fel tillfälle. Skillnaden mot runda 142 är att hypotesen nu
har ett tal: **441 av 445.**

Rundans sjutton sidor är bevisade rena på fyra oberoende sätt, och det är
rundans egen fråga — den är besvarad.

## Reproducerbarhet

Körningen gjordes **två gånger** och gav 445 båda gångerna. Andra körningen går
via `steg14.py`, som anropar `liverunda.kor` OFÖRÄNDRAD och bara TEE:ar sidornas
html till `live/`. Ingen egen loop, ingen egen regel — en tvilling här
hade varit precis det fel hela avsnittet ovan handlar om. Sidorna ligger kvar,
så varje ny fråga om utfallet besvaras mot SAMMA bytes i stället för mot en ny
hämtning av en sida som kan ha hunnit ändras.

Alla sjutton svarade `x-vercel-cache: HIT`.

⚠️ Sidorna och råutskriften ligger i `live/`, som `.gitignore` redan täcker
(`*/live/`, "hämtade LIVE-sidor från Steg 14 … re-fetchbara"). Talen i det här
dokumentet är kvittot; 2,8 MB renderad HTML och 445 nästan identiska rader är
det inte.
