# runda-stadning-15 — städrunda, våg 3

11 publicerade sidor ur våg 1 (rundorna 01–06), redan skrivna till Wix. Samma svep
som gav våg 2 — jämförelser med andra varor i vårt sortiment som grinden inte ser —
kördes efteråt även på våg 1:s texter och hittade de här: "Till jämförelse tål vår
trädformade bokhylla …", "skillnaden mot det ljusa syskonet", "Mittemellan de andra två",
"tydligast av alla klädslar i sortimentet", en FAQ "Vad är skillnaden mot det största
tältet?". Ögonblicksbilden i `fore/` är hämtad EFTER våg 1:s skrivning, och texten i Wix
var ordagrant den som våg 1 skrev (normaliserat, 11 av 11). Allt annat är orört.

## Vad som ändrades

För hand (`handrattelser.tsv`, före och efter ordagrant): html × 13.

## Så kontrollerades det

- `python3 ../../polish-gates/diffgrind.py` kör hela grindkedjan före (ur `fore/`) och efter.
  Den går REN: inga nya fynd och inga fynd kvar i målklasserna.
- `grind-undantag.txt` kvitterar gate.py, gate-seo.py, gate-lager.py, bygg-axelfacit.py med de äldre avvikelserna uppräknade.
  De fanns på sidorna före rundan (flikrubriker, fraktvikt, fungerande korslänkar,
  saknad måttrad, slutsålda varor) och ligger utanför städningen.
- `valideraPlan` (lib/polish/skrivplan.ts) godkänner planen.
- Varje produkt är synlig, har en variant, oförändrad slug och samma revision i Wix
  som i ögonblicksbilden rundan byggdes från.

## Så körs den

Workflowen **"Polering — skriv en runda till Wix"** med `ref` satt till poleringsgrenen:

- `runda`: `runda-stadning-15`
- `plan_sha256`: `f5c38cb37c7c51a5700b2f068a20033d4045264d85eac3415eed31ff9263d374`
- lägen i ordning: `torr` → `skriv` → `verifiera` → `stampla`
