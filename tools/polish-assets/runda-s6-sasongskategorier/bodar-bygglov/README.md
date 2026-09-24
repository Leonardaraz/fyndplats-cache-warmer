# Bygglovsmeningen på bodarna på 12,4 m² (rättad 2026-09-24)

Upptäckt i runda S4 (se `../../runda-s4-sokordskategorier/README.md`, avsnitt 5).
Fem publicerade produktsidor sade under rubriken *Behöver den bygglov?*:

> 12,4 kvadratmeter är större än vad som är bygglovsfritt i många kommuner.

**Det stämmer inte.** Enligt Boverkets regler om friggebod får en sådan vara
högst 15 kvadratmeter byggnadsarea sammanlagt på tomten och högst 3 meter
till nock. Står den närmare tomtgränsen än 4,5 meter krävs grannens
medgivande
([Boverket, PBL kunskapsbanken: Friggebod](https://www.boverket.se/sv/pbl-kunskapsbanken/lov--byggande/anmalningsplikt/bygglovbefriade-atgarder/friggebod)).
Reglerna är nationella, alltså inte "i många kommuner".

Bodarnas egna beskrivningar, lästa samma natt, anger yttermått 3,85 × 3,4
meter (13,09 m²) och nockhöjd 2 meter på alla fem. De ryms alltså. Meningen
riskerade att skrämma bort köpare av de dyraste bodarna i sortimentet.

## Ändringen

Bara den meningen byttes ut. Meningen efter den (*"Friggebod- och
attefallsreglerna har egna gränser och villkor — kontrollera med din kommun
innan du beställer."*) står kvar, och resten av texten är orörd.

- Gammal mening: `gammal-mening.txt` (73 tecken, FNV-1a 213754845)
- Ny mening: `ny-mening.txt` (286 tecken, FNV-1a 972189789), grindad RENT
  med gatelib (husmärke, artikelnummer, tecken och superlativ).

Skrivanropet hämtade varje text på nytt och räknade om båda
kontrollsummorna. Det krävde att den gamla meningen stod **exakt en gång**
och att produkten var synlig, och det byggde alla fem nya texter innan det
första anropet gick. Hade någon kontroll fallit hade ingenting skrivits.
PATCH:en bar bara `id`, `revision` och `plainDescription`.

| produkt | revision | tecken |
|---|---|---|
| ca2f0e47 ljusgrå | 11 → 12 | 4 214 → 4 427 |
| e74d5f67 brun | 10 → 11 | 4 212 → 4 425 |
| 7f7aa2a4 trälook | 10 → 11 | 4 218 → 4 431 |
| 74e737ee mörkgrön | 9 → 10 | 4 212 → 4 425 |
| 5a30aaa8 antracit | 11 → 12 | 4 220 → 4 433 |

**En separat återläsning** (`?fields=PLAIN_DESCRIPTION`, där fältet fanns i
svaret) gav den nya meningen 1 gång och den gamla 0 gånger på alla fem, med
`visible: true` oförändrat.

**Återställning:** byt tillbaka `ny-mening.txt` mot `gammal-mening.txt` med
samma vakter.

☠️ **Varför 4,1 m²-bodarna inte rördes.** De två mindre bodarna
(ee5ea781 och 333b56d0) säger *"4,1 kvadratmeter ligger under gränsen för
friggebod i många fall, men reglerna beror på tomt, avstånd till granne och
kommun."* Det stämmer i sak. "I många fall" är försiktigt men inte fel,
eftersom 15-kvadratmetersgränsen gäller alla friggebodar på tomten
tillsammans.
