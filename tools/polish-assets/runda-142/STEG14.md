# Runda 142 — Steg 14: 409 fel på elva KORREKTA sidor

Live-grinden gav **409 fel**. Noll av dem är rundans.

## Beviset är en mätning, inte en bedömning

Tre oberoende körningar på samma elva sidor:

| kontroll | utfall |
|---|--:|
| offline-grinden (`grind.py`) | **0 fel** |
| Steg 12:s hashkvitto mot facit | **11 / 11** |
| ☠️ **live-grinden mot MIN EGEN html** (`live=True`) | **0 fel** |

Den tredje är den som avgör. Live-grindens regler, körda med live-grenen på men
med **min text i stället för sidan**, hittar ingenting. Alltså har varje fynd i
Steg 14 sitt ursprung UTANFÖR min text. Utdraget bekräftar det: stjärnbetygen i
rekommendationsraden, `Visa produkt →`, lastbilsemojin i `<title>`, och sidans
eget pris.

## ☠️ SUBTRAKTIONEN ÄR STRUKTURELLT OMÖJLIG FÖR DEN HÄR CHROMEN

`liverunda.kontrollfynd` drar bort kontrollsidans träffar **på EXAKT STRÄNG**,
och funktionens egen kommentar motiverar det så här: *"Butikens chrome är
byte-identisk mellan sidor; det som skiljer är vår text."*

**Den premissen är falsk för rekommendationsraden.** Fyndsträngen bär ett
UTDRAG ur sidan, och utdraget innehåller sidans eget pris och sidans egen titel:

```
PRISPÅSTÅENDE … 'Vanliga frågor 2 019 kr Boxning'     ← f0430bc5
HOMOGLYF '→'   … ' ) 2 029 kr Visa produkt → Utforska'  ← en GRANNE i raden
```

Två sidor ger alltså två OLIKA strängar för samma chrome-träff, och
mängdsubtraktionen kan aldrig ta bort den. Det är #538 en gång till — där var
det ett LÄGE som gjorde strängen unik, här är det ett PRIS — och tredje ansiktet
på #385 (rekommendationsraden).

⚠️ **Det förklarar också varför runda 140 och 141 var gröna.** Runda 141:s
kontrollsida subtraherade **två** träffar totalt. Boxningssidornas
rekommendationsrad visar produkter som HAR omdömen (`★★★★★ 5,0 ( 3 )`); bänkarnas
gjorde inte det. Chromen skiljer sig alltså per sida på ett sätt grinden inte
räknar med, och det syntes inte förrän en familj råkade rendera en stjärnrad.

## Mitt eget bidrag till bråket — och det är det värsta slaget

`PRISPÅSTÅENDE` hade i sin första version en gren `(?<![0-9])\d{2,5}\s*(?:kr|kronor)`.

☠️ **Den är oanvändbar i en live-grind av konstruktion.** Butiken visar sidans
eget pris, och rekommendationsraden fem till. Regeln fyrar alltså på VARENDA
korrekt produktsida — och eftersom fyndsträngen bär sidans egen prissiffra kan
kontrollsidan aldrig subtrahera bort den.

Det är precis husets egen regel: **ett larm som fyrar på varje korrekt sida är
lika illa som inget larm alls.** Grenen är borttagen. Ordgrenarna (`billig*`,
`prisvärd*`, `kostar mindre`, `lönar sig`) står kvar — och det var de som
faktiskt fångade rundans verkliga fel, `"den enskilt billigaste vägen"`.
Självtestet är fortfarande grönt, mutationen fångas fortfarande.

## Vad som INTE är gjort

⚠️ **Chrome-subtraktionen är inte lagad.** Rätt fix är att stryka
rekommendationsraden FÖRE grindningen, och den strykningen bor i `butikstvatt`
— delad kod, och #452 har redan mätt upp att just den tvätten är husets
farligaste tvilling (12 fel på 8 korrekta sidor). Att skriva om den i slutet av
en runda, på en hypotes, är exakt fel tillfälle.

Fyndet är därför **mätt och nedskrivet, inte lagat**, och rundans elva sidor är
bevisade rena på tre oberoende sätt.
