# Runda 101 — Steg 1: familjemätning

## Metod: `$startsWith` på `slug` FUNGERAR på `/products/search`

Runbooken (2026-09-03) säger att `{slug: {$startsWith: …}}` avvisas med
`400 INVALID_FILTER: Operator is not compatible with type in field path`.
Det gäller `POST /products/query`. På **`POST /products/search`** fungerar det —
uppmätt idag, två familjer, fyra sidor. Det gör ett familjesvep till fyra anrop
i stället för ett svep över hela katalogen (5 400+ produkter, 54 sidor).

Två fällor i samma anrop:

- **Markören får INTE följa med filtret.** `{search: {filter, cursorPaging: {cursor}}}`
  svarar `400 SE-1141: Search, filter and aggregations cannot be specified together
  with cursor`. Skicka `{search: {cursorPaging: {limit, cursor}}}` ensamt — filtret
  ligger redan bakat i markören.
- **`limit: 15`.** En V3-produkt i standardprojektionen är ~2 kB och verktygssvaret
  kapas vid 50 000 tecken. 25 spränger taket, 15 ryms.

## Utkasten: `slug $startsWith "massagesessel"` → 28, alla `visible:false`

| id8 | slug | pris | vad det ÄR |
|---|---|--:|---|
| b78d4cc6 | massagesessel-burostuhl-chefsessel-mit-6-punkt-vibrationsmassage-und | 1 939 | KONTORSSTOL |
| 0036618d | massagesessel-chefsessel-gamingstuhl-massageburostuhl-blau | 1 979 | KONTORSSTOL |
| 0583e8e8 | massagesessel-mit-warmefunktion-ergonomischer-schreibtischstuhl | 2 079 | SKRIVBORDSSTOL |
| cd7e9036 | massagesessel-relaxsessel-inkl-fu-hocker-10-vibrationspunkte-1 | 2 149 | fåtölj + fotpall |
| 7062dc79 | massagesessel-mit-hocker-drehbares-relaxsessel-mit-massagefunktion-2 | 2 169 | fåtölj + fotpall |
| 9c8a7a80 | massagesessel-mit-hocker-drehbares-relaxsessel-mit-massagefunktion | 2 299 | fåtölj + fotpall |
| 680d586a | massagesessel-relaxsessel-liegesessel-mit-8-vibrationspunkten-5 | 2 319 | fåtölj (svart) |
| 1932abe1 | massagesessel-mit-hocker-145-neigbarer-relaxsessel-mit | 2 359 | fåtölj + fotpall |
| b38dc41c | massagesessel-relaxsessel-liegesessel-8-vibrationspunkte-5-modi-8 | 2 399 | fåtölj (grå) |
| b8b6fee1 | massagesessel-mit-hocker-neigbare-lehne-78-x-95-x-88-cm-schwarz | 2 399 | fåtölj + fotpall |
| 54d25930 | massagesessel-mit-fu-hocker-ergonomischer-stuhl-mit-10-2 | 2 449 | fåtölj + fotpall |
| 89fead7d | massagesessel-mit-liegefunktion-und-fu-hocker-145-neigung | 2 449 | fåtölj + fotpall |
| c50fa916 | massagesessel-mit-fu-hocker-ergonomischer-stuhl-mit-10 | 2 569 | fåtölj + fotpall |
| af699783 | massagesessel-mit-vibrationsmodi-warmefunktion-leiser-motor | 3 199 | fåtölj |
| e140f9ab | massagesessel-mit-fu-hocker-10-vibrationspunkte-145-verstellbare | 3 599 | fåtölj + fotpall |
| 522103fd | massagesessel-mit-rucklehnfunktion-kunstleder-elektrisch | 3 829 | fåtölj |
| a0760ed1 | massagesessel-mit-warmefunktion-drehbarer-schaukelsessel-mit | 4 419 | gungfåtölj |
| 7a4ec9c6 | massagesessel-mit-8-vibrationskopfen-relaxsessel-verstellbare | 4 529 | fåtölj |
| c396356f | massagesessel-mit-wipp-liege-warmefunktion-3-modi-drehbar-4 | 4 579 | gungfåtölj (hellgrau) |
| a7f029bf | massagesessel-mit-wipp-liege-warmefunktion-3-modi-drehbar-3 | 4 619 | gungfåtölj (dunkelbraun) |
| 7e84e482 | massagesessel-mit-wipp-liege-warmefunktion-3-modi-drehbar-2 | 4 819 | gungfåtölj |
| c79c22f7 | massagesessel-warme-liegefunktion-kunstleder-bis-150kg | 4 899 | fåtölj |
| 297d8979 | massagesessel-mit-wipp-liege-warmefunktion-3-modi-drehbar | 4 979 | gungfåtölj |
| 5439026e | massagesessel-mit-warme-liegefunktion-drehbar-bis-150-kg-2 | 5 239 | fåtölj (blå) |
| e2dee113 | massagesessel-mit-aufstehhilfe-relaxsessel-vibrationskopfe-mit-2 | 5 339 | UPPRESNING (grå) |
| ed03b52f | massagesessel-mit-aufstehhilfe-relaxsessel-vibrationskopfe-mit | 5 399 | UPPRESNING (beige) |
| 505eb413 | massagesessel-mit-warme-liegefunktion-drehbar-bis-150-kg | 5 399 | fåtölj (beige) |
| d3d7b291 | massagesessel-mit-fu-stutze-8-vibrationspunkte-5-modi-inkl | 6 549 | fåtölj + fotpall |

## Publicerade: `slug $startsWith "massage"` + `visible:true` → 25

| grupp | antal | prisspann | tyskt ursprungsord |
|---|--:|--:|---|
| `massagestol-*` | **15** | 1 439–2 799 | `Bürostuhl mit Massage` — KONTORSSTOLAR |
| `massagefatolj-*` | **2** | 7 599–7 999 | uppresningsfåtöljer |
| `massagebank-*` | 8 | 1 399–1 679 | massagebänkar (annan vara) |

## Domen: två skilda familjer i ETT sökord

☠️ **`massagesessel` är inte en familj — det är ett tyskt marknadsföringsord som
leverantören klistrar på tre olika varor.** Tre av de 28 är KONTORSSTOLAR, och
de 15 publicerade `massagestol`-sidorna är polerade ur exakt de tyska
huvudorden (`bürostuhl mit 6-punkt-massage und`,
`ergonomischer massage-bürostuhl mit`, `hochlehner-bürostuhl mit
vibrationsmassage und` — de står kvar som sökord i `seoData`).

De tre kontorsstolarna är alltså **dubblettmisstänkta mot 15 levande sidor** och
ska INTE poleras i den här rundan. De behöver måttgrinden mot hela
`massagestol`-familjen först.

**Den verkliga luckan är massagefåtöljen: 25 utkast mot 2 publicerade**, och de
två publicerade är uppresningsfåtöljer i ett helt annat prisläge (7 599/7 999 mot
utkastens 2 149–6 549).

**Rundans huvudord: `massagefåtölj`.** Batchen väljs ur fotpallsklustret i
2 100–2 600 kr — det tätaste prisbandet och den grupp en kund faktiskt jämför
sida vid sida.
