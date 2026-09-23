# Runda 141 — Steg 10: kategorierna

Trädet läst först, som runbooken kräver: **54 kategorier**, tolv toppnivåer.
Lövet är entydigt.

```
Sport & Fritid   de100f8d-755f-433d-90b2-9b18edb41b9d
  └─ Träning & Gym   56dcc575-bf31-4742-b5be-d9e216b42f52
```

Alla sju kopplade till förälder + löv. **14 av 14 skrivningar lyckades**, och
utfallet är läst per KATEGORI ur `results[].itemMetadata` matchat mot
`originalIndex` — inte ur `totalSuccesses`, som inte säger vilken av de två
som gick igenom.

## ☠️ Och HELA den publicerade familjen ligger utanför trädet

Läsningen gjordes för att rundans sju skulle hamna hos sina syskon. Svaret var
att det inte finns några syskon att hamna hos:

| publicerad sida | kategorier |
|---|---|
| `traningsbank-med-benrullar-gummiband` | **inga** |
| `hopfallbar-traningsbank-justerbart-ryggstod-rod` | **inga** |
| `justerbar-traningsbank` | **inga** |
| `justerbar-traningsbank-hopfallbar` | **inga** |
| `gymstation-traningsbank-65-kg-viktblock` | **inga** |
| `gymstation-207-cm-vridbara-armar` | **inga** |
| `hemmagym-benpress-160-cm-45-kg` | **inga** |

Sju av sju publicerade träningsbänkar står utan kategori. Lövet
**Träning & Gym** finns och är tomt på hela den här produkttypen — en kund som
bläddrar dit hittar ingen bänk, trots att butiken säljer sju.

☠️ **Det är INTE ett falskt tomt svar.** Samma fälla som runda 108 (`fel
svarsnyckel ger noll rader utan fel`) kontrollerades: råsvarets nyckel är
`categoriesForItems` och den finns i svaret. Tomt betyder tomt.

Rättningen är ett svep över publicerade sidor, inte rundans arbete — och
Leonards sekvensering 2026-09-05 säger uttryckligen att strukturen rättas
EFTER poleringen. Noterat som egen uppgift.
