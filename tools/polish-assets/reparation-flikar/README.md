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

## Batch 1 — åtta barnfåtöljer och barnsoffor (klar)

`188a80b4 1a73ab8d 31710969 37d254ee 4791575c 4e92e841 8f150623 b24ce3da`

| kontroll | utfall |
|---|---|
| Fragmentgrind (`gate-fragment.py`) | 0 fynd i 8 filer |
| Tre flikar i den sammanfogade texten | 8/8 |
| Flikarna i rätt ordning | 8/8 |
| Tillägget diffat mot filen (FNV) | **8/8 LIKA** |
| `visible` efter skrivningen | 8/8 true |

Texten är per material, inte mall:

- **sammet** (`188a80b4`) borstas i luggens riktning, aldrig i cirklar
- **polyester på träfiberskiva** (`1a73ab8d`) — skivan sväller av blötläggning
  och går inte tillbaka
- **konstläder** (`31710969`, `4791575c`) tål fuktig trasa men aldrig sprit
  eller aceton, som löser ytskiktet
- **manchester** (`37d254ee`) borstas i luggens riktning; mot luggen ger
  strimmor som syns i sidoljus
- **lös kudde** (`4e92e841`) vänds och luftas i stället för att rengöras
- **kortluggat tyg på gummiträ** (`8f150623`, `b24ce3da`) — skummet under
  suger vatten och torkar inifrån

☠️ **Skrivningen sammanfogar SERVER-SIDE.** Den gamla texten läses och
konkateneras inne i API-anropet, så den passerar aldrig chatten — och kan
därför inte drabbas av transkriberingsfel av `fontagen-weight`-typen. Bara
det nya fragmentet skrivs för hand, och det är just det som hashen verifierar.

☠️ **Skrivningen hoppar över en produkt som redan har fliken.** Utan den
grinden hade en omkörning lagt fliken två gånger.
