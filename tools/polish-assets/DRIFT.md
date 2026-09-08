# Källfilen är INTE den publicerade texten för de tidiga rundorna (2026-09-08)

Rundans `<kort>.html` är facit för `livegrind.py`:s orddiff. Uppmätt över
**239 publicerade sidor i 33 rundor**, FNV-1a på den normaliserade texten,
fil mot Wix:

| | |
|---|---:|
| Granskade | **239** |
| Identiska | **172** |
| Drivit isär | **67** |
| Slug fanns inte i butiken | 8 |

## Var driften ligger

| runda | drift | av |
| :-- | --: | --: |
| a-barnfatoljer · d1 · d2 · e1-polstersessel | 8 | 8 |
| c2-golvfatoljer | 7 | 7 |
| b-oronlappsfatoljer | 6 | 6 |
| g1-seo-backfill · e2-polstersessel | 5 | 5 |
| c1-hangfatoljer · d3-baddfatoljer | 4 | 4 |
| k6-kontorsstolar | 3 | 8 |
| k5-kontorsstolar | 1 | 8 |

**Tjugoen rundor är helt i fas**: e3, f1, f2, g1-gungstolar, g2, h1–h4, i1, j1,
j2, k1–k4, k7–k11.

☠️ **Mönstret är inte slumpmässigt.** Rundorna A–E2 drev isär till 100 %, och
de är precis de rundor som fick sina sidor REPARERADE i efterhand utan att
filen följde med: flikreparationen (#170 · #178, 30 sidor), skötselfliken och
kategorin (#149, 41 sidor), SEO-backfillen (#147) och kodstädningen (#97, 100
sidor). Varje sådan lagning skrev till Wix och lämnade repot orört.

⚠️ **K5 och K6 är en annan sak** — fyra sidor i två färska rundor. De har
ingen känd efterreparation. Orsaken är inte utredd.

## Vad det betyder

1. ☠️ **`livegrind.py`:s orddiff är meningslös på de tio drivande rundorna.**
   Den jämför den publicerade sidan mot en fil som inte längre beskriver den,
   så varje körning rapporterar avvikelser som inte är fel — eller värre,
   döljer ett äkta fel bakom en förväntad diff. Kör inte om live-grinden på
   dem utan att först laga filen.
2. ⚠️ **Att skriva om en sådan sida med HELTEXT ur filen rullar tillbaka
   lagningen.** Den här mätningen gjordes för att en riktad rättelse av
   `1706c47d` läste tillbaka fel hash — och just därför gjordes den
   rättelsen som en RIKTAD strängersättning i Wix egen text i stället för en
   helskrivning. Regeln: **på en gammal runda, ersätt en mening — skriv aldrig
   hela texten.**
3. **Filerna går att laga** genom att hämta hem den publicerade texten till
   respektive `<kort>.html`. Det är en engångsjobb per runda och gör
   live-grinden användbar igen. Inte gjort — det är en beteendeändring på
   tio rundors facit och hör hemma i ett eget pass.

**Regeln, ny: ett facit som ingen uppdaterar slutar vara facit.** Samma familj
som tvillingarna som glider isär, men här är de två kopiorna filen och
verkligheten.
