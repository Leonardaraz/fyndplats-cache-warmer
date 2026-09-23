# Runda 89 — läge

**Sex barnsparkcyklar i tre modeller, alla klara, publicerade och
live-verifierade.** Familjen är samma som runda 88:s, men de här sex ligger
en storleksklass över: 100 kg maxlast mot 50, luftdäck mot massiv EVA.

| id8 | modell | slug | pris | SKU |
|---|---|---|--:|---|
| `c4375606` | A2 | `sparkcykel-barn-143-cm-16-tum-svart` | 1379 | `FP-sparkcykel-143-cm-svart` |
| `79186373` | A2 | `sparkcykel-barn-143-cm-16-tum-rosa` | 1439 | `FP-sparkcykel-143-cm-rosa` |
| `479e9c2e` | D | `sparkcykel-barn-120-cm-lagt-styre-svart` | 1129 | `FP-sparkcykel-120-cm-svart` |
| `d9239c8e` | D | `sparkcykel-barn-120-cm-lagt-styre-turkos` | 1249 | `FP-sparkcykel-120-cm-turkos` |
| `4fd26086` | F | `sparkcykel-barn-stort-framhjul-orange` | 1179 | `FP-sparkcykel-framhjul-orange` |
| `89deaca7` | F | `sparkcykel-barn-stort-framhjul-turkos` | 1229 | `FP-sparkcykel-framhjul-turkos` |

Priserna är **orörda** — de står här som mätvärde, inte som beslut.

## Kvitton

| steg | utfall |
|---|---|
| Lint | 0 fel i 6 produkter |
| Mutationstest | **29/29 fångade** |
| Steg 7/8 (text + SKU) | 6/6 skrivna bakom facit-grinden, återlästa: längd OCH hash stämmer |
| Steg 9 (galleri) | 35 bilder, kortet på plats 3 överallt, 0 utan alt-text, 0 utan url |
| Steg 10 (kategorier) | 12/12 lyckade, 3 kategorier per produkt |
| Steg 12 (klart) | **`brister: []` på alla sex** |
| Steg 13 (stämpling) | 6/6 workflow-körningar `success`; två rader återlästa: `needsAiPolish false`, `draftStatus published`, rätt SKU på rätt `wixVariantId`, prisgrinden `stammer true` |
| Steg 13 (publicering) | 6/6 `PUBLICERAD`, texten orörd av publiceringen |
| Steg 14 (live) | 6/6 `200` med `x-vercel-cache: MISS`, facit `lika` på både längd och hash; 8 korslänkmål på 200 |

## Fyra fynd

### ☠️ 1. Fotbollsmönstret finns inte i någon bild

Modell F:s feedtext lovar *"Gummiräder im Fußballdesign"*. Tio F-bilder
granskade i Steg 4 — **ingen visar ett bollmönster**. Framhjulet är ett
vanligt grovmönstrat gummidäck på ekerfälg. Det är rundans enda påstående
där leverantören lovar något bilden motsäger, och ordet är förbjudet i
texten (`FOTBOLL_RE`, både i linten och i live-grinden).

### ☠️ 2. Luftdäcken är INVERTERADE mot runda 88

Runda 88:s modeller hade massiva EVA-hjul och fick rådet *"ingenting att
pumpa"*. Alla sex här har **luftdäck**. Ett kopierat skötselråd hade fått
kunden att aldrig pumpa ett däck som går platt.

Grinden är delad i två, och delningen är poängen:

- **Hård** (`MASSIV_HARD_RE`): `punkteringsfri`, `EVA-`, `slanglös`,
  `ingenting att pumpa`, `behöver aldrig pumpas`, `utan innerslang`. De kan
  bara handla om DEN HÄR produkten och fälls alltid.
- **Kontrast** (`MASSIV_KONTRAST_RE`): ordet *massiv* om ett hjul är
  tillåtet — texten säger med flit *"uppblåsbara gummidäck, **inte**
  massiva plasthjul"* — men bara med en kontrastmarkör inom 44 tecken FÖRE
  ordet. Ett första utkast frikände hela meningen om markören stod var som
  helst i den; `där` och `som ett` är för vanliga för att duga till det.

En POSITIV halva krävs också, och den ligger på **skötselblocket**, inte på
hela sidan: orden `luftdäck` och `uppblåsbar` står i spec-raden och går i
praktiken inte att tappa. Det som verkligen kan falla bort är `LUFT`-stycket
ur `skotsel`-listan — och då står kunden utan det enda råd som skiljer
luftdäck från runda 88:s massiva hjul.

### ☠️ 3. Styrhöjden, inte åldern, är rundans storleksaxel

Alla tre modellerna anges *"ab 5 Jahren"*. Men **A2:s LÄGSTA styrläge
(92 cm) ligger ÖVER D:s HÖGSTA (80 cm)** — samma åldersuppgift kan inte
vara vägledande för båda. Ett lånat spann flyttar produkten en hel
storleksklass, och åldern kan inte avslöja bytet.

⚠️ **Mutationstestet hittade en lucka som lintningen missade.** Grinden
jämförde bara den STRECKADE formen (`75–80`), men texten skriver spannet på
TVÅ sätt: spec-raden `75–80 cm`, punktlistan `75 till 80 cm över marken`.
En mutation som gav modell F modell D:s styrhöjd i punktlistan slapp
styrgrinden och fälldes bara av talgrinden — alltså på fel regel, med ett
felmeddelande som pekade åt fel håll. `_spannformer()` känner nu båda.

### ☠️ 4. "Röd fälg" var påhittat — Steg 4 fällde det

Texten till `479e9c2e` sa *"Svart ram med röd framgaffel och röd fälg"*.
En förstoring av framhjulet visar en **SILVERFÄRGAD ekerfälg**; bara
gaffeln är röd. Felet var redan skrivet till Wix och rättades bakom samma
facit-grind.

`FALG_FARG_RE` fäller nu **varje färgord före "fälg"** — alla sex har
silverfärgad ekerfälg, så vilket färgord som helst där är ett omätt
påstående. `ekerfälg` innehåller inget färgord och passerar.

⚠️ Wix skriver om `<strong>` till `<span style="font-weight: 700">`, så en
rättelse som söker efter den GAMLA strängen i det lagrade HTML:et hittar den
inte. Rättelsen gjordes därför som en hel omskrivning ur skrivplanen, med
facit-grinden på den SYNLIGA texten — som är oförändrad av taggbytet.

## Två husregelbrott rättade FÖRE skrivningen

1. **"Leverantören anger den från 5 år"** stod i två modellblock. Mot kunden
   är VI leverantören (batch 64:s regel). Ändrat till "Den är avsedd från
   5 år." Ordet fångas av `grindar.ATTRIBUTION`, som självtestar sig mot vår
   egen text innan någon grind körs — det var alltså ordlistans självtest
   som hade fällt hela rundan om texten skrivits som den var.
2. **"16 tum fram och 12 tum bak"** om en ANNAN produkt stod i vår egen
   mening i stället för i ankartexten. Flyttat in i länken, där talgrinden
   läser det som det är.

## ☠️ En bild plockades bort: `c4375606-3` bär TYSK TEXT i pixlarna

*"PERFEKTES GESCHENK FÜR IHR KIND!"* med fyra tyska punkter, inbränt i
bilden. Den syns inte i en `grep` över källkoden — det är samma klass som
logotypfyndet i runda 64. Produkten har därför **fem bilder, inte sex**, och
den har inte heller någon måttritning (bara det rosa syskonet har en, och
den ritningen visar en rosa sparkcykel).

⚠️ Grinden i Steg 12 hårdkodade tidigare sex bilder. Antalet läses nu ur
media-planen per produkt — en fast sexa hade fällt en korrekt sida.

⚠️ Filen ligger kvar i Media Manager och blir föräldralös. Nattens
`aosom-media-cleanup` städar den; en vanlig radering frigör ingen lagring.

## Kvar i familjen

**Hållna tills vidare** (alla har publicerade syskon att polera MOT):

- **Modell G**: `aef9a8d9` (grön), `5129f6b0` (vit) — G är axel för axel
  identisk med publicerade `bd3bdc1b`. Ska poleras mot den sidan, och
  samtidigt måste dess *"blå eller grön"*-påstående rättas (#330).
- **Modell C**: `9518db1e`, `473084eb`, `85be4535`
- **Modell E**: `369b4b2c`, `feac1d03`, `c851d101`, `1b1d4842`
- **Modell H**: `ea013fde`

**Nyfunna, inte inräknade i familjen**: `7d4cfd1b` (E-Scooter), `19fc1a9e`
(Pro Stunt-Scooter), `ab68ed78` (vuxen-Cityroller), `eb4418ad` (hopfällbar),
`68f8f1a7` (12 Zoll), `28d7dfd9` / `50b28808` (Kinderscooter Leichtbau).

## Öppet från Steg 1, inte åtgärdat här

- **#329** — runda 88 skapade en LIVE dubblett: `b1dcd424` (1039 kr) mot
  publicerade `a06e46b7` (1229 kr, AE-inköpt, samma modell axel för axel).
  Åtgärden är Leonards (ommappning + pensionering enligt 2026-09-03-regeln).
- **#330** — `bd3bdc1b` säljer "blå eller grön" på en envariantssida.
- **#327** — sparkcykelfamiljen ligger i fem olika kategorikombinationer.
  De sex nya lades i `Barn & Familj` + `Leksaker & Spel`, samma löv som
  `b1dcd424`. ⚠️ Mätt på vägen: `e4e5a8ef` ligger i **noll** kategorier.
