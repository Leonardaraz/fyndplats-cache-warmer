# runda-stadning-17 — städrunda, våg 5

17 publicerade sidor ur tidigare rundor, redan skrivna till Wix. Samma katalogsvep som
våg 4 (`runda-stadning-16`) hittade lånord som husets ordlista inte godtar, en rå importsida
och två sidor med tyska alt-texter. Ögonblicksbilden i `fore/` är hämtad direkt ur Wix före
bygget. Allt som inte står här är orört.

## Vad som ändrades

För hand (`handrattelser.tsv`, före och efter ordagrant): html × 17, alt × 12,
seo titel × 1, slug × 1, sku × 1.

| klass | sidor | rättelse |
|---|---|---|
| Lånordet gaslift → gaslyft (husets ord) | 5afb2c39, 67cc5f53, c0d9c97a, 1476d1ea, 239b20b7, 8a11ee33, 1ac305ac | ordet byts överallt i texten, även i böjda former |
| Lånordet polypropylen → polypropen (husets ord) | 7c7e20ec, bc58d428, c88057cc, 19c880ca, 7c3d438a, f6089d31, ae4fec6e | samma |
| Ruttens artikelnummerform: "360-graders" | 8a11ee33 | "en sits som vrider sig 360 grader" |
| Rå importsida (c816963e, växthusskåp) | c816963e | texten skrivs om i husets format ur sidans egna uppgifter (mått, material, bärighet, hyllplan, rostskydd, förpackning), svenska alt-texter på alla fem bilder, SEO-titeln får husets suffix, ny adress och SKU |
| Tyska alt-texter | a7d1a29b (5 bilder), a76e97f1 (2 bilder) | svenska alt-texter efter att bilderna setts |

## Bilder

a76e97f1 (trehjuling 5-i-1) hade tre bilder med tysk text inbränd i pixlarna (position 5–7:
måttbild, "Reisefreundliche Konstruktion" och "Produktdetails"). De är borttagna med
workflowen "Bilder — ta bort bilder ur en publicerad sida" före rundan: galleriet 7 → 4,
det rosa valets länkade bilder 5 → 2, planens sha `e31baa3c79aa1cfb54011d9556a85695703d38b3f508bd542eec9df68999393d`.
Sidan har fyra bilder (Leonard: "4 är godkänt"). Alt-texterna i rundan är skrivna på de fyra
som finns kvar.

## Adress och SKU

c816963e hade formen `58x44` i adress och SKU (ruttens artikelnummerform, se våg 4).
Ny adress `vaxthusskap-tra-polykarbonat-58-cm` med 301 från `vaxthusskap-i-tra-58x44-cm`
(`omdirigeringar.tsv`), ny SKU `FP-vaxthusskap-polykarbonat-58-cm`.

## Så kontrollerades det

- `python3 ../../polish-gates/diffgrind.py` kör hela grindkedjan före (ur `fore/`) och efter.
  Den går REN: inga nya fynd och inga fynd kvar i målklasserna.
- `grind-undantag.txt` kvitterar de äldre avvikelserna som fanns före rundan: fraktvikt,
  flikrubriker, en länk, siffror i äldre alt-texter, slutsålda varor och saknad måttrad.
- sbygg.py kör ruttens artikelnummerform över namn, adress, text, SEO, SKU, alt-texter och
  kategorier innan något byggs.
- Den nya adressen är kontrollerad mot Wix: ingen produkt har den.

## Så körs den

Workflowen **"Polering — skriv en runda till Wix"** med `ref` satt till poleringsgrenen:

- `runda`: `runda-stadning-17`
- `plan_sha256`: `af8ca668088fd428f693735eb8a1b7632f3baab8683308f5ec1426ef37d218d3`
- lägen i ordning: `torr` → `skriv` → `verifiera` → `stampla`

Därefter 301:an för den bytta adressen.

## Utanför rundan

- **6870d76a** (massagekontorsstol i sammetslook) har samma lånord. Galleriet har 18 bilder, en per
  färg, och planen tar högst 15 bilder per produkt, så sidan kan inte gå genom skrivverktyget
  utan att bildlistan kapas. Se även 987dd4a1 i `runda-stadning-16`.
