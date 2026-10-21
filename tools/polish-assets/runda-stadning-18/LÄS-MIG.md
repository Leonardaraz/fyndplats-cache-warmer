# runda-stadning-18 — städrunda, våg 6

20 publicerade sidor ur tidigare rundor, redan skrivna till Wix. Ett nytt katalogsvep efter
våg 4 och 5 sökte i alla publicerade texter efter metakommentarer om vad underlaget saknar
("underlaget säger inte", "vi anger inget", "inte angivet", "uppgifterna går isär") och efter
jämförelser med andra varor i sortimentet ("till skillnad från fällstolar i vårt sortiment").
Ögonblicksbilden i `fore/` är hämtad direkt ur Wix före bygget. Allt som inte står här är orört.

## Vad som ändrades

För hand (`handrattelser.tsv`, före och efter ordagrant): html × 43, alt × 1, slug × 4, sku × 2.

| klass | sidor | rättelse |
|---|---|---|
| Metakommentar om vad underlaget saknar | 2253c509, 06a712e1, 776ef75a, 77a5c07e, cc4aad40, c93648cc, 6490e360, b0b76114, 23ba27a5, fb142c5c, 738ca991, 0c05c1a0, ae436a28, a6128860, 3e9796c2, 98b15e9d, 6bce6e3a, e6d2e70b | meningen tas bort. Inget nytt påstående läggs till |
| Fråga som bara kunde besvaras med en metakommentar | 2253c509, 776ef75a, b07189d2, 23ba27a5, 6bce6e3a | frågan byts mot en som sidan kan besvara, eller tas bort (staplingsfrågan på 776ef75a och batterifrågan på 23ba27a5) |
| "Åldern som anges" | 23ba27a5, fb142c5c, 738ca991, 0c05c1a0 | "rekommenderad ålder" |
| Jämförelse med andra varor i sortimentet och korslänkar | d6a11ae3, 776ef75a | meningen och länkstycket tas bort |
| Superlativ om sortimentet | 2253c509, 3e9796c2 | "den enda delen" och "den högsta vattenpelaren i sortimentet" skrivs om. Påståendena gäller nu bara sidans egna delar och versioner |

## Adress och SKU

Ruttens artikelnummerform (tre tecken, bindestreck, minst tre till och en siffra, till exempel
`141-natur`) gäller varje fält i planen, också sådant som redan är publicerat (se våg 4).

- **Ny adress, 301 från den gamla** (`omdirigeringar.tsv`): 2253c509, 77a5c07e, 3e9796c2, 98b15e9d.
  Redirecten läggs med workflowen "Lägg till 301-redirect" (batch) EFTER skrivningen.
- **Ny SKU:** 2253c509, 77a5c07e.
- Texten på 3e9796c2 och a6128860 skrev tygen som `20D-nylon`, vilket formen också fäller. Orden
  står nu som "nylon på 20D". Alt-text 9 på 3e9796c2 är rättad likadant.
- d6a11ae3 länkade till tre andra solsängar, varav en med formen i adressen. Hela
  länkstycket är borttaget (produkttext ska inte länka).

## Så kontrollerades det

- `python3 ../../polish-gates/diffgrind.py` kör hela grindkedjan före (ur `fore/`) och efter.
  Den går REN: inga nya fynd och inga fynd kvar i målklasserna.
- `grind-undantag.txt` kvitterar de äldre avvikelserna som fanns före rundan: länkar i äldre
  texter, fraktvikt, flikrubriker, titlar utan suffix och siffror i äldre alt-texter.
- sbygg.py kör ruttens artikelnummerform över namn, adress, text, SEO, SKU, alt-texter och
  kategorier innan något byggs.
- De nya adresserna är kontrollerade mot Wix: ingen produkt har dem.

## Så körs den

Workflowen **"Polering — skriv en runda till Wix"** med `ref` satt till poleringsgrenen:

- `runda`: `runda-stadning-18`
- `plan_sha256`: `f5766da7184e45aa8e8d4b374ef195ba09ea1f4c4728c1601464c1a776f528ec`
- lägen i ordning: `torr` → `skriv` → `verifiera` → `stampla`

Därefter 301:orna för de fyra bytta adresserna.
