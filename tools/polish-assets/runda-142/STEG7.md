# Runda 142 — Steg 7: elva texter skrivna, fem egna fel fångade av grindar

**11 av 11 hashgrindade mot facit, noll avvikelser.** Alla elva står kvar på
`visible:false` med varianten på `visible:true`.

## ☠️ RÅ HTML GÅR INTE ATT JÄMFÖRA — Wix omserialiserar

Första kvittot såg ut som ett fel: `56cca82a` kom tillbaka som **4 103 tecken**
mot mina 3 920. Orsaken är husets egen mätning från 2026-08-21 — Wix skriver om
`<strong>` till `<span style="font-weight: 700">`:

```
skickat:      <p><strong>Vad ingår?</strong></p>
tillbaka:     <p><span style="font-weight: 700">Vad ingår?</span></p>
```

En rak stränghash hade alltså fällt **varje korrekt skrivning**, och ett
falsklarm som alltid fyrar lär läsaren att hoppa över grinden.

✅ **Grinden jämför TAGGFRI text** (`kvitto.py`), och det är dessutom rätt
mätobjekt: batch 64:s nio fel var stavfel och ett husregelbrott i den SYNLIGA
texten, inte i markupen.

| pid | synlig längd | fnv-1a | Wix |
|---|--:|---|:--:|
| `56cca82a` | 3 274 | `3366fdf3` | ✅ |
| `ce8813ce` | 3 188 | `1822f2d4` | ✅ |
| `93073695` | 2 956 | `861d4844` | ✅ |
| `4fe5959f` | 2 973 | `d7c86817` | ✅ |
| `136a4671` | 2 876 | `268ec320` | ✅ |
| `2730de6f` | 2 888 | `809bf52c` | ✅ |
| `2a13cbbe` | 3 546 | `c9bf1937` | ✅ |
| `95f6280b` | 3 099 | `7866f7a3` | ✅ |
| `c8f6b93f` | 3 072 | `9a2635ca` | ✅ |
| `a8daef42` | 3 060 | `cb7e2bb9` | ✅ |
| `f0430bc5` | 3 393 | `c11d4606` | ✅ |

Checksumman räknas identiskt i båda ändar (FNV-1a över kodpunkter). Texten är
kontrollerat BMP-ren, så JS `charCodeAt` och Python `ord` ger samma tal —
annars hade grinden varit en tvilling som glider isär.

## Fem egna textfel, alla fångade FÖRE skrivningen

| pid | vad jag skrev | varför det är fel |
|---|---|---|
| `4fe5959f` | *"Vikten anges inte för den här modellen"* | Mot kunden är **vi** leverantören |
| `93073695` | *"har något de andra i familjen saknar"* | Intern inramning |
| `ce8813ce` | *"Nästa steg upp i familjen är"* | Intern inramning |
| `95f6280b` | *"Till skillnad från de flesta fristående säckar"* | Omätt marknadspåstående |

Plus rundans fyra tidigare (två superlativ, två inramningar) — **nio egna fel
på elva produkter**, och inget av dem hittades med ögonen.

## ☠️ Tre grindar som INTE KUNDE FYRA

Det allvarligaste fyndet i steget är inte texten utan grindarna.

### 1. Negationsursäkten gällde HELA tabellen

`loftestraff` släpper varje träff i en mening som bär en negation. Det är
**rätt för exakt ett förbud** — `LOVAR FYLLNING`, där *"sanden ingår INTE"* är
precis vad texten ska säga.

På alla andra förbud är den en tyst blindhet, för negationen är **oberoende av
defekten**. Två fall mättes upp i rad:

| mening | negationen | grinden |
|---|---|---|
| *"Vikten **anges inte** för den här modellen"* | del av defekten | slapp igenom |
| *"behöver **varken** vatten **eller** sand"* | helt orelaterad | slapp igenom |

I båda fallen är meningen fortfarande fel. Ursäkten är därför **opt-in**
(`rad[2]`), inte standard. Båda planterade mutationerna gick igenom före
ändringen — och de äkta meningarna med dem.

### 2. `INTERN INRAMNING` var för smalt skriven

Mönstret tog `familjens` och `seriens` men släppte `i familjen` och
`de andra i familjen` — samma defekt, annan böjning, **två meningar genom en
grön grind**. Breddat till `familj\w*`.

⚠️ `omgång` är MEDVETET UTE: *"en lång omgång"* är ett träningsord i den här
familjen, och `Vanliga frågor` är en OBLIGATORISK flikrubrik som aldrig får
kunna fällas.

### 3. `MARKNADSPÅSTÅENDE` krävde exakt ordet `boxningssäck`

`95f6280b` skrev *"de flesta fristående **säckar**"* — ett ord ifrån att fällas.
Jämförelseorden står nu för sig och produktordet är en bred lista.

☠️ **Och `\w*` måste stå FÖRE substantivet**: svenskan bygger sammansättningar,
och `boxningssäckar` börjar inte på `säck`. Utan prefixet föll rundans egen
planterade mutation — grinden lagades och gick sönder i samma ändring.

## Mätt på köpet: SKU-krocken från runda 108 finns här, live

Återläsningen visar att Wix fortfarande bär importens tyska SKU på alla elva,
och att **två av dem delar sträng**:

```
56cca82a   FP-punchingball-set   ☠️
ce8813ce   FP-punchingball-set   ☠️
```

Det är #388 ordagrant: mappningsstämplingen ensam rör inte Wix egen variant-SKU.
Steg 8:s andra halva är alltså inte en formalitet i den här rundan — den rättar
en krock som redan finns. Efter steget: **11 distinkta av 11**.

## Vad Steg 7 INTE skickade

`visible` står inte i kroppen. Uppmätt på alla elva: produkten ligger kvar på
`visible:false` och varianten på `visible:true` — precis vad runda 120 mätte,
och motsatsen till vad ett utskrivet `false` ger.
