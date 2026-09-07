# Runda 97 — läge

Sex foderstationer. **Allt utom skrivningarna är klart.** Publiceringen är
blockerad: Wix-kopplingen föll ur sessionen efter Steg 7, och runbooken är
tydlig om vad som gäller då — *"Poleringen väntar; en halvfärdig runda skadar
ingen."*

## De sex

| id8 | slug | vad | produktmått |
|---|---|---|---|
| `e8102582` | `upphojd-matskal-hund-hojdjusterbar-11-33-cm` | stållställ, steglös höjd | 40,5 × 22 × 39 |
| `1fc55b3d` | `matskalsstall-hund-fyra-hojder-lutbart` | fyra höjder, tre lutningar | 48 × 26 × 36,5 |
| `2e2b2366` | `matplats-hund-tre-hojder-kaffebrun` | tre höjder, öppet under | 54 × 31,5 × 47 |
| `868cc038` | `matskap-hund-34-cm-skjutdorrar` | lågt skåp, skjutdörrar | 60 × 30 × 34 |
| `7628983b` | `matskap-hund-42-cm-30-liter` | högt skåp, 30 L | 60 × 30 × 42 |
| `75556831` | `husdjursskap-82-cm-matplats-i-lada` | möbel, skålar i låda | 61 × 35,5 × 82 |

## Grindarna

| grind | utfall |
|---|---|
| `lint.py` | **0 brister** på alla sex |
| självtest i `lint.py` | **25/25** |
| `mutationstest.py` | **72/72** |
| prisgrind (`polish-mapping.yml` läge `las`) | sex körningar gröna |
| bilder | 29 av 30 behållna, tre ritningar kapade |
| kort | sex byggda, 163–210 kB, alla under taket |
| alt-texter | 6/5/6/6/6/6, inbördes unika, kontrollerat i `facitgen` |

Facit-hashar: 587862068 · 475712955 · 157234975 · 561100201 · 254874862 ·
216094046.

## ☠️ Det som INTE går att göra just nu

Wix- och GitHub-kopplingarna finns inte längre i sessionen. Utan dem går
Steg 8, 9, 10, 11 och 13 inte att köra — de skriver alla till katalogen, och
det finns ingen nyckel-lös omväg: `EXTENSION_API_TOKEN` bor bara i Vercel och
`CRON_SECRET` är märkt Sensitive.

**Kvar när kopplingen är tillbaka**, i ordning:

1. PATCH namn, slug, seoData och beskrivning — med hashgrind före och efter.
2. Ladda upp de sex korten och skriv galleriet med alt-texterna.
3. Koppla kategorier (två löv var).
4. Sätt SKU + publicera, priset orört.
5. Stämpla mappningsraden (`stampla`).
6. `livegrind.py` mot de sex live-sidorna.

Allt underlag ligger färdigt: `texter.py` bär texten, `facit.json` hasharna,
`bilder/` och `kort/` bilderna, `media-alt.json` alt-texterna.

## Fyra fynd

### ☠️ 1. Kategorins standardpåstående är fel åt andra hållet

Fem av sex utkast säljer den upphöjda skålen på hälsa. Glickman m.fl. (JAVMA
2000, Purdue, ~1 600 stora och jättestora hundar) fann **förhöjd** risk för
magomvridning med upphöjd skål — ~20 % av fallen hos stora raser, 52 % hos
jätteraser. Pipan m.fl. 2012 fann ingen effekt. Motstridigt är aldrig ett
säljargument. Ingenting av det följde med; grinden är en ordlista.

### ☠️ 2. Min egen första mätning läste PAKETMÅTTET

Och det var fel åt **båda** hållen: det grupperade ihop produkter som delar
kartong, och missade en äkta tvilling som packats annorlunda. Se `STEG1-2.md`.

### ☠️ 3. En regel som mätte sin egen normalisering

Dubbla blanksteg kontrollerades på `lasform()`, som normaliserar `\s+` till
ett mellanslag **först**. Regeln kunde alltså aldrig fälla. Flyttad till den
råa html:en. Samma familj som runda 96:s två läsformer, men värre: där gav
blandningen falska träffar, här gav den tysta missar.

### ☠️ 4. En mutation som inte muterade

Mutationstestet bytte `förvaring` mot `Stauraum` — men två av sex texter
innehåller inte ordet, så mutationen blev en no-op och rapporterades som
"slapp igenom". Grinden var oskyldig; testet mätte ingenting. En mutation
måste bytas mot något som står i **alla** texter.

## Två frågor som väntar på Leonard

1. **De fyra tvillingklustren.** Tretton av 26 utkast delar produktmått i
   fyra grupper. Om de är färgsyskon eller äkta dubbletter avgörs på
   artikelnumrets bas, och numret bor i mappningsraden — tolv `las`-körningar.
2. **`868cc038` har två oförenliga axelhöjder.** Bildens ruta sa 50–60 cm,
   brödtexten säger 55–65 cm. Ingen av dem står på sidan; den anger höjden
   till skålen (34 cm) i stället.
