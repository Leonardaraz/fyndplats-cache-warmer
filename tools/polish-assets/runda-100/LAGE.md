# Runda 100 — läget

## Batchen: sex trädgårdsbord, alla LIVE

| id8 | slug | pris | SKU | bilder |
|---|---|--:|---|--:|
| `e71acc53` | `tradgardsbord-145-cm-lamellskiva-aluminium` | 1 959 | `FP-tradgardsbord-145-lamell` | 6 |
| `f806eebf` | `tradgardsbord-140-cm-wpc-teakton` | 2 779 | `FP-tradgardsbord-140-wpc` | 6 |
| `4249df4d` | `tradgardsbord-150-cm-glasskiva-med-hylla` | 3 039 | `FP-tradgardsbord-150-glas` | 5 |
| `29c688dc` | `utdragbart-tradgardsbord-160-cm-traimitation` | 3 299 | `FP-tradgardsbord-160-utdrag` | 6 |
| `74d3c11c` | `utdragbart-tradgardsbord-162-cm-lamellskiva` | 3 899 | `FP-tradgardsbord-162-utdrag` | 6 |
| `c71418ca` | `utdragbart-tradgardsbord-220-cm-fjarilsmekanism` | 5 579 | `FP-tradgardsbord-220-utdrag` | 6 |

Priserna är ORÖRDA — samma tal som före rundan, verifierade i varje svar.
Kategori: **Trädgård & Utemöbler → Utemöbler** på alla sex, 12/12 skrivningar
gröna.

## Rundans fyra egna fynd

### ☠️ 1. MÅTTRITNINGEN RÄTTADE EN TEXT SOM REDAN LÅG I WIX

`4249df4d`:s hylla står som `85L x 50B cm` i den tyska brödtexten. Ritningen i
galleriet säger **85 och 60**. Runbokens regel avgör — ritningen är facit — och
här väger den extra tungt: ritningen är en BILD PÅ SAMMA SIDA. En text som sagt
50 hade motsagt något kunden kan mäta med ögat.

**Ritningen lästes bara för att kortet skulle byggas.** Steg 5 hade ställt
brödtexten mot spec-raden och stannat där. Lärdomen: **ställ ritningen mot BÅDA
i Steg 5**, inte bara mot spec-raden.

### ☠️ 2. `visible` I FÄLTMASKEN GÖR VARIANTENS `price` OBLIGATORISK

Runda 99 lärde att SKU-skrivningen PUBLICERAR utkastet om `visible` inte
skickas med. Skickar man det svarar V3 i stället:

```
400  product.variantsInfo.variants[0].price  must not be empty  REQUIRED_FIELD
```

Priset måste alltså läsas först och skickas tillbaka OFÖRÄNDRAT — poleringen
får aldrig röra det. Alla sex kontrollerade efteråt: `actualPriceRange` står
kvar på 1959 / 2779 / 3039 / 3299 / 3899 / 5579.

### ☠️ 3. TVÅ AV MINA EGNA STEG 5-PÅSTÅENDEN HÖLL INTE

`STEG4-5.md` skrev först "alla sex har justerbara eller halkfria fötter" och
"alla sex har anvisning". Läst rad för rad: `e71acc53` säger **ingenting** om
fötterna (påståendet var ärvt från ett SYSKONS närbild), och `4249df4d`:s
`Lieferumfang` listar **ingen anvisning**. Båda sidorna skriver nu därefter,
och grinden låser dem per produkt i stället för per runda.

**En sammanfattning är inte ett underlag.** Alla felen kom av att första
versionen generaliserade över sex produkter i stället för att lista dem.

### ☠️ 4. GRINDEN FÄLLDE MIN EGEN MENING FÖRE FÖRSTA SKRIVNINGEN

Regel 5 tog "lyft den tillsammans med två personer" i monteringsstycket som ett
sittplatsantal på en sida som med flit inte publicerar något. Meningen skrevs om
i stället för att regeln försvagades: en grind som lär sig undantag för
lyftinstruktioner missar nästa riktiga sittplatspåstående.

## Grinden: åtta regler, sex tvåvägs, 58/58 självtest

1. inget leveranslöfte — fyra av sex tyska texter bär "bis Bordsteinkante"
2. fast contra utdragbart — båda längderna i namn, titel OCH meta
3. maxlast per bord: 50 / 50 / 80 / 50 / 70 / 70 kg
4. stolarna ingår inte — ingen tysk text säger det, varje miljöbild visar dem
5. sittplatsantal bara där det går att veta (två sidor publicerar inget)
6. fötterna bara där underlaget säger det, och rätt sort
7. anvisningen likaså
8. träutseende är inte trä (WPC respektive plast med tryckt ådring)

## Steg 1:s två dubbletter, för protokollet

- `06e3fd94` är samma render som publicerade `542cbd16`, sedd från andra hållet.
- `65a730a4` är samma fysiska bord som publicerade `fa683626` — men köpt via en
  annan leverantör. Ommappningen gick inte (`saknas_i_feeden`), och utkastet
  pensionerades i stället.

## Kvar när rundan är slut

Fyra små trädgårdsbord (`a3330f79`, `b135a79c`, `c9422654`, `ef71bb42`) väntar
på ett eget huvudord. `ef71bb42` och `b135a79c` måste dubblettgrindas mot
publicerade `95cd383a` och `13f2cc84` först.
