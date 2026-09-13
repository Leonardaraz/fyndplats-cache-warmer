# Korslänken går åt BÅDA håll nu (uppgift #530, regeln i #480)

`a4d8feca` (klostunna-60-cm-brun) är färgsyskon till den publicerade
`klostunna-60-cm-ljusgra`. Rundans sida länkade dit från början; den grå
sidan länkade INTE tillbaka.

Mätt före skrivningen: `pekarPaBrun: false`. Den grå sidan pekade på två
andra tunnor (49 cm sjögräs, 70 cm tre hålor) men inte på sin egen färgtvilling.

| | |
|---|---|
| produkt | `e43b623c-c17c-49c0-9fa8-6a30fca49e5a` |
| revision | 5 → 6 |
| `visible` efter | **true** (satt explicit i PATCHen) |
| längddelta | +109 tecken |
| **resten av sidan orörd** | **true** |

Formuleringen speglar vår: *"samma tunna i ljusgrått"* ↔ *"samma tunna i
naturbrunt"*, och ärver den grå sidans egen stil (`target="_self"`).

## Två spärrar i skrivningen

1. ☠️ **Unikhetsvakt på ankarsträngen.** Förekommer den noll eller flera
   gånger skrivs ingenting — en ankarsträng som träffar fel ger en tyst
   halvskrivning på en PUBLICERAD sida.
2. ☠️ **`restenOrord` är kvittot, inte en 200:a.** Den lagrade texten
   bak-ersätts med ankaret och jämförs mot originalet: `true` betyder att
   INGET annat än korslänkraden rörde sig. En sida som redan låg ute får
   inte skrivas om i sin helhet för en länk.

`visible: true` sattes explicit — husets regel gäller i varje PATCH, inte
bara i publiceringen, och en `plainDescription`-PATCH utan den är just hur
utkast råkat publiceras förr.
