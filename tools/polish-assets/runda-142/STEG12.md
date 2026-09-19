# Runda 142 — Steg 12: sex fel som en GRÖN grind släppte igenom

Läsningen som kund hittade **sex fel** på elva sidor. Varenda mekanisk grind
var grön på allihop, och alla sex är påhittade uppgifter — inte tonfel.

| pid | stod | vad som var fel |
|---|---|---|
| `56cca82a` | "Färgen går inte att välja … rött, svart eller rött och svart" | ☠️ ingen källa |
| `93073695` | "den enskilt billigaste vägen till ett ställ som inte rör sig" | prispåstående + omätt superlativ |
| `95f6280b` | "ska stå på golvet **en kvart** senare" | påhittad monteringstid |
| `ce8813ce` | "Sand väger **dubbelt så mycket** som vatten på samma volym" | allmän fysikalisk uppgift, och fel |
| `ce8813ce` | "skruvas ihop för hand **i de flesta steg**" | påhittad monteringsdetalj |
| `c8f6b93f` + `a8daef42` | "sanden packar sig i botten och vattnet fyller mellanrummen" | påhittad mekanism |

## ☠️ Det allvarligaste: ett LEVERANSLOTTERI utan källa

`56cca82a` sa åt kunden att varan skickas i en av tre färger och att valet inte
går att styra. **Påståendet finns bara i en kodkommentar** i `matt.py`
(`farg=None,  # leverantoren skickar rod/svart/rod+svart SLUMPMASSIGT`) — inte i
Steg 1, inte i Steg 4, inte i någon mätning.

Två källor säger samma sak, och de säger något annat:

| källa | säger |
|---|---|
| hjältebilden | röd och svart boll, svart fot, röda handskar |
| leverantörens EGET produktnamn | `… Geeignet für Profis und Anfänger **Rot**` |

☠️ **Och samma kommaseparerade färgkolumn lästes rätt på två syskon i samma
runda.** `4fe5959f` fick `farg="svart och röd"` ur `Schwarz, Rot` och `136a4671`
fick sin färg ur `Rot, Schwarz` — båda lästa som PRODUKTENS färger. Bara här
lästes formen som tre leveransalternativ. Regel 16 avgör: bilden vinner över
texten om en SYNLIG egenskap, och färg är synlig.

⚠️ **`56cca82a` var dessutom den ENDA av elva utan `Färg`-rad i spec-tabellen.**
Den saknaden var signalen; sektionen var symptomet. Raden finns nu, och alla
elva har en.

## Grinden var grön — fem nya förbud, alla mutationsbevisade

☠️ **En grön grind betyder att grinden är nöjd, inte att texten är rätt.** De
sex felen står nu som fem förbud i `grind.FORBJUDET`, och varje förbud har en
planterad mutation som är **den verkliga strängen**, inte en omskriven variant:

| förbud | fångar |
|---|---|
| `PRISPÅSTÅENDE` | `billig*`, `prisvärd*`, `kostar mindre`, kronbelopp |
| `OMÄTT TID` | `en kvart`, `N minuter`, `halvtimme` |
| `LEVERANSLOTTERI` | `går inte att välja/styra`, `vilken som kommer`, `slumpmässig*` |
| `OMÄTT TALJÄMFÖRELSE` | `dubbelt så mycket`, `tre gånger så`, `väger dubbelt` |
| `OMÄTT MONTERINGSDETALJ` | `i de flesta steg`, `skruvas ihop för hand` |

**Mutationstestat på grinden själv.** Varje förbud stängdes av i tur och
ordning; varje gång släpptes EXAKT dess egen mutation igenom och ingen annans:

```
PRISPÅSTÅENDE avstängd          → 1 självtestfel: 93073695 "enskilt billigaste vägen"
OMÄTT TID avstängd              → 1 självtestfel: 95f6280b "en kvart senare"
LEVERANSLOTTERI avstängd        → 1 självtestfel: 56cca82a "går inte att styra"
OMÄTT TALJÄMFÖRELSE avstängd    → 1 självtestfel: ce8813ce "dubbelt så mycket"
OMÄTT MONTERINGSDETALJ avstängd → 1 självtestfel: ce8813ce "i de flesta steg"
```

## Det mekaniska halvan: 131 fält, noll osynliga tecken

Mjukt bindestryck, hård blank, nollbredd och BOM passerar varenda vanlig grind
(runda 133:s `gluggar`). Kontrollen går över **allt kundtextfält** — html, namn,
titel, meta, slug, SKU och alla 65 alt-texter — och inte bara brödtexten (#441).
Noll träffar.

## Skrivningen: HASHEN KONTROLLERAS FÖRE SKRIVNINGEN

Nyttolasten var 24 871 tecken, för mycket att klistra, och Wix-sandlådan får
**inte** hämta från `raw.githubusercontent.com` (403). Rättelsen gjordes därför
som elva **exakta strängbyten** i den text Wix redan lagrar — 1 689 tecken.

☠️ **Bytena är TAGGFRIA där det går.** Wix skriver om `<strong>` till
`<span style="font-weight: 700">`, så ett gammalt fragment med `<strong>` i hade
aldrig matchat den live-lagrade texten.

Och ordningen är det som gör det säkert: resultatet hashas och jämförs mot facit
**innan** PATCH:en skickas. En felmatchning når alltså aldrig Wix.

```
skrivning: SKREV 6, VÄGRADE 0
kvitto:    STÄMMER 11, AVVIKER 0     (alla visible: false vid det laget)
```

Bytena är dessutom lokalt bevisade: applicerade på den GAMLA texten ger de
tecken för tecken den NYA.
