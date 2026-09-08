# Runda K12 — vad kontaktarken visade

Lästa FÖRE första meningen (J1-regeln). Fem fynd.

## ☠️ `522103fd` förlorar TRE av fem bilder — bara två kvar

| bild | vad som står inbränt |
| --: | :-- |
| 3 | måttritningen bär `Benutzerhöhe:` |
| 4 | `SPACE SAVING / Benötigt nur 20 cm Abstand zur Wand` |
| 5 | `Entfernen Sie während der Massage die Rückenpolsterung` |

Kvar: produktbild och en miljöbild. **Ingen måttritning.** Det är sämre än
`46f475c4` (#212) och `7cdc167c` (#166), som båda har tre. Sidan behöver egna
kort — ett måttkort och ett funktionskort — annars är den tunnare än den
förtjänar på 3 829 kr.

⚠️ **Och två av de raderade bilderna bär SÄLJANDE fakta som annars försvinner:**

1. Fåtöljen behöver bara **20 cm mellan rygg och vägg** för att fällas — den
   sortens tal som avgör ett köp i en liten lägenhet.
2. **Ryggdynan ska tas bort under massagen.** Det är en användningsinstruktion,
   inte marknadsföring, och den finns ingen annanstans än i en tysk pratbubbla
   vi tar bort.

Båda måste in i brödtexten. Det är hela skälet till att bilderna läses först.

## ☠️ `c79c22f7` — namnet säger 150 kg, måttritningen säger 135 kg

Produktnamnet är "Massagesessel, Wärme- & Liegefunktion, Kunstleder, **bis
150kg**". Ritningen i bild 3 bär en tydlig **135 kg**-bricka. Båda talen
finns i källans facit, så siffergrinden hade släppt igenom endera.

Samma klass som `b78d4cc6` i K11 (#210): källan motsäger sig själv och bara
ögat på ritningen avgör. **Källtexten är inte hämtad än** — resolvera mot
`Belastbarkeit:` i tekniska data, inte mot namnet. Namnet är marknadsföring.

## ☠️ `ed03b52f` är en UPPRESNINGSFÅTÖLJ, inte en vanlig recliner

Bild 1 och 5 visar stolen framåtlutad på en lyftram. Källan: elektrisk
lyftfunktion 45° och liggfunktion 150°, USB-uttag, "Seniorensessel".
Det är ett hjälpmedel och en helt annan köpare än de sju andra — texten ska
säga det rakt ut i första stycket, inte gömma det bland massagelägena.

⚠️ Ritningen säger **135 kg** och namnet inget; källans tekniska data säger
`Maximale Belastbarkeit: 135 kg`. De stämmer. Facitet bär även "150" — det är
liggvinkeln, inte vikten. En siffergrind som bara ser tal hade inte skilt dem.

## Vad bilderna gav som källtexten inte säger

- **`d3d7b291` och `297d8979` har två mugghållare vardera**, synliga i
  armstöden. Källan nämner dem (`zwei Getränkehalter`) — men bilden visar att
  de sitter infällda i armstödens ovansida, inte som utfällbara hållare.
- **`e140f9ab` har en SEPARAT fotpall** på egen svängfot, 44 × 47 × 40 cm —
  samma form som `a6c80fe7` i K11. Inte en utfällbar fotdel.
- **`505eb413` är TYG (chenille), inte konstläder** — sex av åtta i rundan är
  konstläder, så det är den tydligaste skiljelinjen i gruppen.

## Sju tyska grafiker ur fem produkter

Se `bilder-bort.tsv`. `297d8979`, `ed03b52f` och `e140f9ab` behåller alla fem.

## ✅ Källtexterna avgjorde tre frågor

### `c79c22f7` — 135 kg, inte 150. NAMNET är fel.

Produktnamnet säger "bis 150kg". Både beskrivningens punktlista (*"Stabile
Struktur trägt bis zu 135 kg"*) och tekniska data (*"Belastbarkeit: 135 kg"*)
säger **135**, precis som måttritningen. Namnet är marknadsföring och ska inte
användas som källa för ett tal. Texten skrivs på 135 kg.

☠️ Samma familj som `b78d4cc6` (#210), men här är det inte två specfält som
bråkar — det är NAMNET mot allt annat. Regeln blir skarpare: **hämta aldrig
en siffra ur produktnamnet.**

### ☠️ `522103fd` är LÄDERBLANDNING och KNÅDANDE massage — inget av det
syns i spec-tabellen

Två fynd som ändrar hela texten, båda ur beskrivningen och inte ur specen:

```
Material: Leder-Mischung (20 % Rindsleder, 80 % Polyurethan)
knetende Massagefunktionen … drei Bereichen (Schulter, Lendenwirbel
oder ganzer Rücken)
```

- Den svenska spec-tabellen säger bara `Material: Kunstleder, Stahl`. Att
  skriva "konstläder" hade varit sant men fattigt — **20 % nötläder** är ett
  säljargument OCH en skötselskillnad. Texten säger blandningen ordagrant;
  att kalla den "läderfåtölj" hade varit vilseledande på 20 %.
- **Massagen är knådande, inte vibrerande.** De sju andra i rundan vibrerar.
  Det är den tydligaste skillnaden i hela gruppen och den stod ingenstans i
  urvalsdatan.

⚠️ Instruktionen om att ta bort ryggdynan under massagen finns BARA i den
tyska bild vi raderar — inte i källtexten. Den skrivs ändå in i skötselfliken:
en knådande mekanism arbetar bakom dynan, och att utelämna en
användningsinstruktion är värre än att sakna källhänvisning för den.

### ⚠️ `7a4ec9c6` bär ett förbehåll som MÅSTE stå i klartext

> *"Hinweis: Liegefunktion nur manuell einstellbar und erfordert Kraft.
> Nicht für Senioren geeignet"*

Ryggen fälls för hand och kräver kraft. Källan säger själv att fåtöljen inte
lämpar sig för äldre. Det ska stå rakt ut i brödtexten — inte gömmas bland
massagelägena — särskilt när `ed03b52f` i samma runda är en uppresningsfåtölj
byggd för precis den köparen.
