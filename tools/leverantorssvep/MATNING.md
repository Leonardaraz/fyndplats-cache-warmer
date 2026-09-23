# Leverantörssvepet — "mot kunden är VI leverantören"

Leonards uppdrag 2026-09-08: *"Fixa alla som hänvisar till leverantören, vi ska
va leverantören ingen annan."*

## Utfallet

| | före | efter |
|---|--:|--:|
| Produkter med aktörsord i brödtexten | **408** | **0** |
| Förekomster | **~754** | **0** |
| Andel av det publicerade sortimentet | 17 % | 0 % |
| Fel under skrivningarna | — | **0** |

Verifierat över **hela** katalogen, 5 553 produkter, båda halvorna körda till
`cursor: null` — inte till ett radantal. Grinden i verifieringen är bredare än
den svepet jagade med, så "noll" betyder noll och inte "noll av det jag råkade
söka på".

## Så gick det till

Två mekaniska pass och elva handskrivna batchar, totalt **470 exakta
`gammal → ny`-par**.

| pass | vad | sidor | byten |
|---|---|--:|--:|
| Fas A | ` enligt leverantören/tillverkaren` före `[.,;: ]` eller radslut | 38 | 41 |
| Fas A2 | samma fras men före en **TAGG** (spec-celler) | 34 | 36 |
| Batch 1–2 | första handskrivna paren | 29 | 26 |
| Batch 3 | mallpar för 28 kamin-/värmaresidor + 72 enskilda | 69 | 135 |
| Batch 4 | djurbostäder, klösträd, lampor, gym | 45 | 74 |
| Batch 5 | knästolar, kontorsstolar, växthus | 42 | 59 |
| Batch 6 | byggd ur RÅ HTML | 24 | 24 |
| Batch 7 | barnmöbler, sandlådor, uppresningsfåtöljer | 41 | 77 |
| Batch 8 | tält, verktyg, kläder, byggsatser | 32 | 54 |
| Batch 9 | kaffe, väskor, leksaker | 41 | 60 |
| Batch 10 | sista svansen | 34 | 40 |
| Batch 11 | två parenteser | 2 | 2 |

☠️ **En sök-och-ersätt hade gått sönder.** Svansen var 213 olika formuleringar
på 228 förekomster i slutfasen — den ENDA formen som återkom fem gånger var
*"Tillverkaren rekommenderar 3–7 år."* Allt annat var i praktiken unikt, och
en generisk regel som stryker `Tillverkaren anger` hade lämnat *"…att
uppsättningen dessutom går att anpassa."* som huvudsats: svensk bisatsordföljd
sätter adverbet före verbet, huvudsatsordföljden tvärtom.

## Fem saker som mätningen lärde, och som inte ska tas bort

1. ☠️ **Den avtaggade meningen LJUGER om vad som går att byta.** `Leverantören
   anger att de <span style="font-weight: 700">övre</span> grenarna` blir
   `Leverantören anger att de övre grenarna` när taggarna strippas — och ett
   exakt par byggt på den strängen kan aldrig matcha. Fem par bommade på precis
   det. Bygg paret ur den RÅA `plainDescription` när ett par missar, och kapa
   fragmentet före taggen.

2. ☠️ **`missade` räknas PER ANROP, inte per batch.** Ett par som bet på sidan
   12 står som missat i anropet som börjar på sidan 33. Två par såg ut att ha
   fallit i batch 3 och var i själva verket redan rättade — läs listorna
   tillsammans, och kontrollera i katalogen innan du bygger om ett par.

3. ☠️ **En lookahead som räknar upp avslutningstecken missar det tecken den
   inte tänkte på.** Fas A krävde `[.,;: ]` efter frasen, Fas A2 krävde `<`.
   De två sista förekomsterna i hela katalogen var `(enligt tillverkaren)` —
   en högerparentes, som ingen av dem täckte.

4. **Ärlighetsmeningar ska INTE strykas, bara skrivas om.** *"Leverantörens
   egen sida uppger 1,76 kg på ett ställe och 1,9 kg på ett annat"* är
   information kunden har nytta av. Motsägelsen står kvar: *"Uppgifterna går
   isär: 1,76 kg på ett ställe och 1,9 kg på ett annat."*

5. **Grinden fällde sig själv två gånger under arbetet.** Ordningsregeln i
   `grind.py` var INVERTERAD — den flaggade den rätta ordningen och kunde
   därför aldrig fyra. Den är lagad och har ett självtest som återinför fällan.

## Grinden som gör att det inte kommer tillbaka

`tools/polish-assets/runda-101/lint.py`, regel 8, var **för smal i månader**:

```
gammal=nej  Tillverkaren anger 160 kg.
gammal=nej  160 kg enligt tillverkaren.
gammal=nej  Tillverkarens ritning visar 160 kg.
gammal=nej  Producenten rekommenderar 160 kg.
gammal=JA   Leverantören anger 160 kg.
```

Fyra av fem former passerade. Det är hela förklaringen till att 408 publicerade
sidor kunde bära formuleringen medan varje runda rapporterade grön grind.

Regeln delar nu aktörslistan med `grind.py` här, och fyra nya muteringar i
`lint.py`s självtest — en per aktörsord som svepet faktiskt hittade på
publicerade sidor. **31/31 muteringar fångade.**

## Kör en batch

```
python3 grind.py batch07        # fäller på kvarvarande aktör, dubbletter,
                                # ordningsfällan, osynliga tecken, artefakter
python3 -c "import json, batch07; print(json.dumps(
    [[g, n] for _, g, n in batch07.PAR], ensure_ascii=False))"
```

Paren skickas sedan till Wix som exakta strängbyten med räknade träffar per
par. **Texten skrivs alltid i en FIL först** — husregeln från batch 64: nio fel
inline mot noll via fil.
