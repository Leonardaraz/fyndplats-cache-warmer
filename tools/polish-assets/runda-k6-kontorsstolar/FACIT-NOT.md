# Var facit-talen kommer ifrån

`kallor-tal.json` byggdes MEKANISKT ur den levande tyska källtexten
(`plainDescription`) med en regex i ExecuteWixAPI — inte avskrivet.

Två tal är TILLAGDA för hand, och båda är lästa ur produktens EGEN
måttritning (bild 3), inte uppfunna:

| kort | tal | var det står |
| :-- | :-- | :-- |
| `f3f45d87` | `47`, `55` | sitthöjd 47–55 cm i måttritningen — källTEXTEN saknar sitthöjd helt |
| `a3128b31` | `47`, `55` | samma ritning, samma stol i ljusgrå |

Skälet: båda stolarna anger `Größe der Sitzfläche: 54B x 51T x 12H` men ingen
`Sitzhöhe`. Ritningen gör det. En kontorsstol utan sitthöjd i specen är en
sämre sida, och talet ÄR sourcat — bara i bilden i stället för i texten.

⚠️ Allt annat i facit kommer ur texten. Ett tal som varken står i texten eller
i ritningen ska aldrig läggas till här; då är det texten som ska skrivas om.
