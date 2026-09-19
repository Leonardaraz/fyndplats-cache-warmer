# Runda 101 — läge

| id8 | modell | namn | slug | SKU | pris |
|---|---|---|---|---|--:|
| cd7e9036 | A | Massagefåtölj brun med vridbar fotpall | massagefatolj-brun-vridbar-fotpall | FP-massagefatolj-brun | 2 149 |
| 7062dc79 | A | Massagefåtölj cremevit med vridbar fotpall | massagefatolj-cremevit-vridbar-fotpall | FP-massagefatolj-cremevit | 2 169 |
| 9c8a7a80 | A | Massagefåtölj svart med vridbar fotpall | massagefatolj-svart-vridbar-fotpall | FP-massagefatolj-svart | 2 299 |
| 1932abe1 | B | Massagefåtölj i konstläder | massagefatolj-konstlader-fotpall-forvaring | FP-massagefatolj-konstlader | 2 359 |
| 89fead7d | B | Massagefåtölj i tyg | massagefatolj-tyg-fotpall-forvaring | FP-massagefatolj-tyg | 2 449 |
| 54d25930 | C | Massagefåtölj för 160 kg, cremevit | massagefatolj-160-kg-cremevit | FP-massagefatolj-160-kg | 2 449 |
| c50fa916 | C | Massagefåtölj mörkgrå för 160 kg | massagefatolj-morkgra-160-kg | FP-massagefatolj-morkgra | 2 569 |
| b8b6fee1 | D | Massagefåtölj i linnelook, svart | massagefatolj-156-cm-utfalld-svart | FP-massagefatolj-156-cm | 2 399 |

## Klart

- **Steg 1–5** — familjemätning, dubblettgrind, laglighetsgrind, bilder, påståenden.
- **Steg 7** — text, namn, slug och seoData skrivna på alla åtta.
  **8/8 byte-identiska** med filen vid återläsning (synlig text hashad i kod,
  inte jämförd med ögon): noll transkriberingsfel, noll `<br>`, noll
  ihopsatta FAQ-frågor, noll trasiga länkar. Alla `visible:false`, alla
  priser orörda.
- **Steg 8** — SKU:erna re-synkade. Kropparna byggdes i KOD ur en färsk
  läsning, så varken revision, pris eller variantens `visible` skrevs för hand.

## ☠️ SKU-krocken var värre än väntat: sex av åtta delade två strängar

| gammal SKU | bars av |
|---|--:|
| `FP-massagesessel-mit-hocker` | **4** (7062dc79, 9c8a7a80, 1932abe1, b8b6fee1) |
| `FP-massagesessel-mit-fu` | **2** (54d25930, c50fa916) |
| `FP-massagesessel` | 1 (cd7e9036) |
| `FP-massagesessel-mit` | 1 (89fead7d) |

Importen bygger SKU:n ur den RÅA tyska sluggen och kapar vid 24 tecken. Varje
produkt vars tyska namn börjar "Massagesessel mit Hocker…" får alltså samma
sträng. Åtta produkter delade fyra SKU:er; nu bär de åtta distinkta.

Det är samma latenta bugg som `lib/import/sku.ts` beskrivs ha i runbooken
(uppgift #272) — den skapas av importen, inte av poleringen, och den växer med
varje tysk familj som importeras.

- **Steg 9** — alt-texter, galleriordning, eget Fyndplats-kort på alla åtta.
- **Steg 10** — tre kategorier på alla åtta: `Hem & Inredning`,
  `Skönhet & Hälsa`, `Massage & Återhämtning`. Samma tre som de publicerade
  `massagestol-*`-sidorna, mätt först.
- **Steg 12** — läst som kund. Tre fynd, alla rättade och verifierade live.
- **Steg 13** — åtta mappningsrader stämplade via workflowen (8/8 gröna),
  åtta produkter publicerade. `visible: true` på BÅDE produkt och variant,
  priser oförändrade (2 149–2 569 kr, kontrollerade mot Steg 4 före
  publiceringen).
- **Steg 14** — live-grind med kontrollprov: **8/8 REN**, 141–146 kB per sida.

## ☠️ Kategoriskrivningen såg tyst misslyckad ut — det var ÅTERLÄSNINGEN som låg efter

Bulk-skrivningen svarade `skrivfel: null` på alla åtta. Den omedelbara
återläsningen visade **bara `All Products`** på `9c8a7a80`, `1932abe1` och
`c50fa916` — alltså exakt husets vanligaste felbild, ett svar utan fel som
inte är ett kvitto.

Det var det inte den här gången. Omskrivningen några minuter senare svarade
`totalSuccesses: 0, totalFailures: 1` per kategori — Wix säger *"raden finns
redan"* — och samma läsning gav då alla tre kategorierna på alla åtta.

| | vid skrivningen | några minuter senare |
|---|---|---|
| `9c8a7a80` | `["All Products"]` | alla tre satta |
| `1932abe1` | `["All Products"]` | alla tre satta |
| `c50fa916` | `["All Products"]` | alla tre satta |

☠️ **`directCategoriesInfo` på produktläsningen är en EVENTUELLT KONSISTENT
projektion.** Skrivningen gick till `/categories/v1`, läsningen till
`/stores/v3` — två tjänster, och den andra hann inte i kapp. Uppgift #316
beskriver samma familj åt andra hållet (en återläsning som ljuger POSITIVT);
det här är den negativa varianten, och den är lika dyr: hade jag trott
återläsningen hade jag skrivit om något som redan var rätt, om och om igen.

**Läs om efter en paus innan du dömer en kategoriskrivning som misslyckad.**
Skrivningen är dessutom idempotent — ett andra försök kostar bara ett
`totalFailures: 1` som betyder "fanns redan".

## Steg 12: tre fynd som varje mekanisk grind släppte igenom

Lintet var grönt (15 regler, 20/20 mutationer) och texten byte-identisk mot
filen. Läsningen hittade ändå tre saker:

| # | var | vad | åtgärd |
|---|---|---|---|
| 1 | modell A, B och C, FAQ | *"Det är så konstruktionen är gjord."* | struken |
| 2 | modell C, brödtext | *"finns **modellen** med förvaringslock"* — det finns **två** | pluraliserat |
| 3 | modell D, ingress | *"blir **ekipaget** 156 cm långt"* — hästspråk om en fåtölj | omskrivet |

Den första är den intressanta. Meningen före säger redan allt kunden behöver
(*"Ryggen har en mikrolåsning och låser inte helt fast i varje vinkel — den
ger efter något när du lutar dig bakåt."*). Tillägget är en **ursäkt**, och
det är precis vad Leonards regel förbjuder: upplysningen står kvar, bortförklaringen
går bort. Ingen fältkontroll kan se skillnaden — båda meningarna är sanna,
välformulerade och korrekt stavade.

Den andra är ett räknefel om den EGNA batchen, alltså samma klass som runda
42:s *"den lättaste av våra åtta"*. Skillnaden är att det här inte var ett
superlativ utan en bestämd artikel — och därför fångade batch-superlativgrinden
den inte.

☠️ **Skriv om texten SERVER-SIDE när rättelsen är tre strängbyten.**
`ExecuteWixAPI` har inget filsystem, så alternativet var att klistra in 38 kB
text i anropet — precis den inline-skrivning som mätte upp **9 fel mot 0** i
batch 64. Rutten läser i stället produktens egen `plainDescription`, gör
bytena i JS och skriver tillbaka. Texten passerar aldrig chatten; bara de tre
bytena gör det. Verifierat med hash: 8/8 stämmer mot filen.

☠️ **`plainDescription` ligger INTE i standardprojektionen.** `GET
/stores/v3/products/{id}` ger `undefined`; `?fields=PLAIN_DESCRIPTION` ger
strängen. Samma asymmetri som `MEDIA_ITEMS_INFO` — och precis som där är den
tyst: fältet saknas, inget fel kastas.

## ☠️ Live-grindens FÖRSTA svep fällde 8 av 8 korrekta sidor — på fyra egna buggar

Alla fyra var i grinden, ingen på sidan. Kontrollprovet räddade bara den
femte (`Skickas från`, sajtens EU-lager-ribbon).

| falsklarm | matchade i själva verket | fel i grinden |
|---|---|---|
| `tyskt ord: und` | **under**, **underlag**, **används** | ledande gräns men ingen avslutande |
| `tyskt ord: Massagepunkte` | svenskans **massagepunkter** | tyskt ord som är PREFIX till ett svenskt |
| `intern jargong: runda` | *"var sin **runda** stålfot"* | `runda` är svenska för rund |
| `egen text: NEJ` × 5 | — | proben läste MALLEN, med `{kladsel}` osubstituerat |

☠️ **Gränsen sitter olika för olika ordklasser, och runbookens regel täcker
bara den ena.** Regeln säger *"gränsen sitter i BÖRJAN, inte i slutet, så
böjda tyska former (Sitzbänke) fortfarande fastnar"*. Det stämmer för
sammansatta substantiv och är fel för FUNKTIONSORD: `und`, `mit`, `der`,
`die`, `das` är korta och sitter inuti vanliga svenska ord. De behöver gräns i
BÅDA ändar. Listan är därför delad i två i `livegrind.py`.

☠️ **Och `Massagepunkte` visar gränsen för kurering.** Runbooken lärde av
`Gelb` i re·gelb·undet att välja ord som saknar svensk tvilling. Men
`Massagepunkte` ÄR entydigt tyskt och saknar tvilling — det är bara ett
**prefix** till svenskans `massagepunkter`, så ingen ledande gräns hjälper.
En avslutande gräns hade fällt det tyska ordet också. Enda försvaret är att
inte ha ordet i listan, och `livegrind.py` namnger de bortvalda med skälet.

**Fjärde fyndet är det pinsammaste och det billigaste:** "har sidan min egen
text?" jämförde mot `T.INGRESS[modell]`, som är en MALL med `{kladsel}` kvar.
Modell C och D har ingen platshållare och matchade; A och B gjorde inte det.
En grind som mäter fel sträng säger inget om sidan — och den såg ut som ett
cachefynd, alltså precis det fel runda 60 verkligen hade.

## Kvar / flaggat vidare

- ⚠️ De två redan publicerade `massagefatolj-*`-sidorna ligger BARA i
  `Hem & Inredning` och saknar `Massage & Återhämtning`. Rundans åtta ligger
  rätt; katalogen är alltså inkonsekvent inom samma familj. Hör till
  städningen (uppgift #283).
- Tre kontorsstolsutkast (`b78d4cc6`, `0036618d`, `0583e8e8`) uteslöts i
  Steg 1 som dubblettmisstänkta mot 15 publicerade `massagestol`-sidor och
  behöver en egen runda med måttgrind.
