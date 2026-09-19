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

## Klar — alla 30 lagade och verifierade

| kontroll | utfall |
|---|---|
| Fragmentgrind (`gate-fragment.py`) | 0 fynd i 25 + 5 filer |
| Tillägget diffat mot filen (FNV) | **30/30 LIKA** |
| Tre flikar i rätt ordning | **30/30** |
| Kategori utöver All Products | **30/30** |
| `visible` efter skrivningen | **30/30** |
| Tyska i brödtext | **0** |
| Tyska i alt-texter | **0** |

Skötseltexten är skriven per materialgrupp, aldrig som mall:

| grupp | vad texten säger som en mall inte hade sagt |
|---|---|
| sammet, manchester, flanell | borstas i luggens riktning; flanell luddar och tar luddborste, inte tejp |
| konstläder | tål fuktig trasa men aldrig sprit eller aceton |
| avtagbar polyesterklädsel | lufttorkas — torktumling krymper och klädseln går inte tillbaka |
| träfiberskiva, gummiträ | sväller respektive reser fibrer av blötläggning |
| chenille | dammsugs utan borstmunstycke; utdragen fiber ger blank rand |
| hängstolar | krok och kedja kontrolleras lika ofta som skruvarna |
| konstrotting | fälls bara ihop rumsvarm — spröd i kyla |
| vikbara madrasser | viks bara längs sina egna sömmar |
| S-fjädrar i gummiträram | sätt dig ner, släpp dig inte ned |
| golvsoffa | har inga skruvar att efterdra — bara gångjärnet |

☠️ **Sammanfogningen sker SERVER-SIDE.** Den gamla texten läses och konkateneras
inne i API-anropet och passerar aldrig chatten, så den kan inte drabbas av ett
transkriberingsfel av `fontagen-weight`-typen. Bara det nya fragmentet skrivs
för hand — och det är precis det hashen verifierar.

☠️ **Skötselfliken sätts in FÖRE FAQ, inte sist.** De fem produkter som redan
hade FAQ fick fragmentet inskjutet vid `<h2>Vanliga frågor</h2>`. Hade det lagts
sist vore ordningen spec → FAQ → skötsel, och butiken renderar flikarna i
dokumentordning.

## Två fel till som verifieringen hittade

Slutkontrollen ställde alla runbook-kraven, inte bara flikarna — och två av dem
föll:

1. **Alla 30 låg bara i All Products.** Ingen riktig kategori. Lagat: barnmöbler
   till `Barn & Familj` + `Hem & Inredning`, hängstolar till `Trädgård &
   Utemöbler` + `Utemöbler`, inomhus sittmöbler till `Hem & Inredning` —
   trädet har inget sittmöbel-löv, och då räcker toppkategorin. 42 av 42
   kopplingar lyckades.

2. ☠️ **Fem tyska SEO-titlar levde kvar**, trots att backfillen 2026-09-06
   rapporterade 49 → 0. Den siffran var korrekt för sin klassificerare, som
   krävde ett tyskt FUNKTIONSORD i titeln — och de fem har inget:

   ```
   Schlafsessel Relaxsessel Gästebett. abnehmbarer Bezug
   Polstersessel, Schaumstoff-Füllung, Kautschukholz
   Polstersessel im Skandi-Design, Samtoptik, Massivholz
   ```

   Backfill-anteckningen sa själv att talet var ett GOLV. Det var det.
   Hela den publicerade katalogen är nu svept med en bredare klassificerare
   (tyska substantiv och sammansättningar, inte bara funktionsord):
   **2 244 publicerade produkter, 0 utan SEO-titel, 0 tyska kvar.**

⚠️ **Utkastet `1877cf83` lämnades med flit.** Det är cordfåtöljen som prisgrinden
fällde som slutsåld, den enda av de 31 som inte är publicerad. En sida ingen kan
köpa ska inte poleras — samma skäl som `gate-lager.py` finns för.
