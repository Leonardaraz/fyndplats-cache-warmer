# runda-stadning-16 — städrunda, våg 4

20 publicerade sidor ur tidigare rundor, redan skrivna till Wix. Katalogsvepet 2026-10-15
(text, alt-texter och länkar på alla publicerade sidor) hittade text som husreglerna
förbjuder och som ingen grind såg när sidorna skrevs. Ögonblicksbilden i `fore/` är hämtad
direkt ur Wix före bygget. Allt som inte står här är orört.

## Vad som ändrades

För hand (`handrattelser.tsv`, före och efter ordagrant): html × 35, namn × 1,
seo titel × 1, seo meta × 4, slug × 5, sku × 7.

| klass | sidor | rättelse |
|---|---|---|
| Leverantörsröst och metakommentarer om vad underlaget saknar ("vi anger ingen maxlast", "underlaget säger emot sig självt", "vi gissar inte", "framgår inte av produktdatan") | a8cf27cd, c0770388, a75fcfde, f6e3098e, 4249df4d, cd6b31a9, e71acc53, d6666869, c26677bf, 71f0a30a, dd5216cc, f267a4e2 | meningen eller frågan tas bort, eller byts mot en fråga som sidan kan svara på. Inget nytt påstående läggs till. En rubrik som själv var en metakommentar byts (a8cf27cd) |
| Rundans egna ord i kundtext ("rundans längsta formningsjobb") | bdc71526, d09b1b4c | bisatsen tas bort |
| Avsändarland ("skickat från vårt lager i Polen", runbooken: Leonard 2026-08-15) | 9b0bc89f, 3a58adbd, 987dd4a1 | texten, FAQ:n "Varifrån skickas det?" och metabeskrivningen. Bara EU-lager-ribbonen får visa landet |
| Superlativ om sortimentet ("familjens högsta") | d6666869 | öppningsmeningen skrivs om till måtten |
| Osynligt tecken (mjukt bindestreck) | 975c9daf | tecknet tas bort |
| Lånord: marmoroptik → marmorlook (även namn och SEO), polypropylen → polypropen | f4ed1264, 265b0f61 | husets ord |

## Adress och SKU

Ruttens artikelnummerform (tre tecken, bindestreck, minst tre till och en siffra, till exempel
`230-gra`) gäller varje fält i planen, också sådant som redan är publicerat. Sex sidor bar
formen i adressen eller SKU:n sedan före regeln, och planen hade vägrats. Grinden är orörd.

- **Ny adress, 301 från den gamla** (`omdirigeringar.tsv`): c0770388, a75fcfde, 71f0a30a,
  bdc71526, d09b1b4c. Redirecten läggs med workflowen "Lägg till 301-redirect" (batch)
  EFTER skrivningen, eftersom en källa som fortfarande är en synlig produkt avvisas.
- **Ny SKU:** c0770388, a75fcfde, 4249df4d, e71acc53, d6666869, bdc71526, d09b1b4c.
- c0770388 och a75fcfde länkade till varandra med de gamla adresserna. Länken är borttagen
  (produkttext ska inte länka) och meningen "Samma stall finns också i …" står kvar som text.
- d6666869 länkade till en sida vars adress bär formen (`tra-179`). Den länken är borttagen.

## Så kontrollerades det

- `python3 ../../polish-gates/diffgrind.py` kör hela grindkedjan före (ur `fore/`) och efter.
  Den går REN: inga nya fynd och inga fynd kvar i målklasserna.
- `grind-undantag.txt` kvitterar gate.py, gate-alt.py, gate-seo.py, gate-lager.py och
  bygg-axelfacit.py med de äldre avvikelserna uppräknade: länkar i äldre texter, fraktvikt,
  titlar utan suffix, slutsålda varor och saknad måttrad. De fanns på sidorna före rundan.
- sbygg.py kör ruttens artikelnummerform över namn, adress, text, SEO, SKU, alt-texter och
  kategorier innan något byggs.
- De nya adresserna är kontrollerade mot Wix: ingen produkt har dem.

## Så körs den

Workflowen **"Polering — skriv en runda till Wix"** med `ref` satt till poleringsgrenen:

- `runda`: `runda-stadning-16`
- `plan_sha256`: `d417ad12713e1329541085e4a946b5ced7c4c15949952b86fcc911a841063efc`
- lägen i ordning: `torr` → `skriv` → `verifiera` → `stampla`

Därefter 301:orna för de fem bytta adresserna.
