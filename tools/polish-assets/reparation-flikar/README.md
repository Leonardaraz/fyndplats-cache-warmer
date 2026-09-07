# Reparation: publicerade sidor utan de obligatoriska flikarna

## Vad som mättes

Klart-kriteriet kräver tre flikar i varje produkttext, och strängen måste
stämma ORDAGRANT — annars matchar butikens splitter inte och spec-tabellen
renderas inline mitt i brödtexten:

```
<h2>Tekniska specifikationer</h2>
<h2>Användning och skötsel</h2>
<h2>Vanliga frågor</h2>
```

Källfilerna i tio rundor granskades (72 filer utan skötselflik), och varje
produkt slogs sedan upp i Wix. **Källfilen och den publicerade texten är två
olika saker** — 41 av de 72 rättades live 2026-09-06 utan att källfilen
uppdaterades, så en filgranskning ensam överdriver skadan.

| | |
|---|---:|
| Källfiler utan skötselflik | 72 |
| Produkter hittade i Wix | 72 |
| **Saknar skötselfliken i Wix** | **31** |
| **Saknar FAQ-fliken i Wix** | **26** |
| Saknar spec-fliken i Wix | 0 |
| Av de 31: publicerade (`visible: true`) | **30** |

Den enda som inte är publicerad är `1877cf83` — cordfåtöljen som prisgrinden
fällde som slutsåld 2026-09-06.

## ⚠️ Varför filgranskningen inte räckte som mått

`grep` i rundkatalogerna sa 72. Wix sa 31. Skillnaden är inte brus utan två
källor som drivit isär: reparationen 2026-09-06 skrev till BUTIKEN, inte till
rundornas källfiler. Samma klass som `jamforelsePris` — mappningen är vad vi
TROR att kunden ser, butiken är vad kunden faktiskt ser.

☠️ **Facit är alltid det publicerade.** En rundas källfil är ett arbetsmaterial
och åldras i samma sekund någon rättar något live.

## Hur texten skrivs

Per MATERIALGRUPP, aldrig som mall. Runda F1/F2-lagningen mätte varför: en mall
hade sagt fel om åtta av produkterna — manchester borstas i luggens riktning,
teddyfleece dammsugs med lågt sug, gummiträ torkas torrt, en snurrfot rensas
från hår, och en golvsoffa har inga skruvar att efterdra.

Materialet står i `BRISTER.tsv`, hämtat ur produktens egen spec-tabell.
