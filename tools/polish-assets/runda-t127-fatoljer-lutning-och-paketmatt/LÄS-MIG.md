# runda-t127-fatoljer-lutning-och-paketmatt — två publicerade fåtöljsidor rättas

Leonard 2026-11-20: "dubbelkolla felen du hittade så du är helt säker på dom, och fixa alla".
Två publicerade, sammanslagna sidor hade uppgifter som inte stämmer med varan. Ögonblicksbilden i
`fore/` är hämtad direkt ur Wix före bygget. Allt som inte står här är orört. Namn, adresser,
titlar, bilder, kategorier och varianter är oförändrade.

## Vad som ändrades

För hand (`handrattelser.tsv`, före och efter ordagrant): html × 15, SEO-beskrivning × 1, alt × 1.

| sida | felet | rättelsen |
|---|---|---|
| d34f6bab, elektrisk massagefåtölj med uppresning (gråbrun, beige, grå) | Fraktvikten "46,5 kg, den grå 55 kg" och paketmåttet "den grå 77 × 61 × 48 cm" gällde artikeln som färgen Grå hade före T126. Färgen pekades om till en ny artikel (FLAGGADE 357), och den väger 46,5 kg som de andra två. Dess paketmått går inte att läsa ur flödet | Fraktvikt: 46,5 kg. Paketmått: 76 × 58 × 49 cm för gråbrun och beige, och inget mått för grå |
| e5be35a4, snurrbar massagefåtölj i chenille (beige, mörkgrå) | Texten sa tre styrkor, värme i tre steg och fjärrkontroll, och sa inte att lutningen är manuell | Lutningen är manuell med ett handtag vid sidan. Handkontrollen har sladd och två styrkor (hög och låg), fem lägen (puls, tryck, våg, auto, normal), fyra områden (rygg, ländrygg, lår, ben) och timer 15, 30 och 60 minuter. Värmen slås på och av. Nätadapter, montering och vad som ingår står i specen, och frågorna "Är lutningen elektrisk?" och "Behövs ett eluttag?" är nya. Skrynklor försvinner inom 72 timmar. Metabeskrivningen säger inte längre "i 3 steg". Alt-texten på bild 3 säger handkontroll |

## Så kontrollerades det

- Tillverkarens bruksanvisning för e5be35a4 lästes sida för sida som bilder: monteringen (sidorna
  11–12, delar och kablar), handtaget som fäller ryggen och fotstödet och svängen 360° (sidan 13),
  packlistan med två kartonger, handkontroll med sladd och nätadapter (sidan 10),
  handkontrollens knappar och funktioner (sidorna 14 och 17–19), skrynklor och dynor (sidan 9)
  och adapterns tabell (sidan 21). Inget av det är läst ur en sammanfattning.
- Fraktvikten för den nya grå artikeln på d34f6bab är läst ur ett färskt flödessvar
  (`aosom-feed-search.yml`, krypterat svar). Den gamla artikelns 55 kg stod kvar i texten.
- `python3 ../../polish-gates/diffgrind.py` kör hela grindkedjan före (ur `fore/`) och efter. Den
  går REN: inga nya fynd och inga fynd i målklasserna.
- `grind-undantag.txt` kvitterar de två äldre avvikelserna som fanns före rundan: bildnumret i
  alt-texter från sammanslagningen och att `kallor.json` är sidans publicerade svenska text, där
  måtten står i spec-raderna.
- Varje ersättning byggdes ur den publicerade texten och krävde exakt en träff i den. Annars
  avbröts bygget, så ingen text är avskriven för hand.
- De nya talen i texten ur bruksanvisningen (nätadapterns 100–240 V, 50–60 Hz, 12 V och 1 A, de
  fem lägena och 72 timmar) står i `foto-tal.txt` med sida.

## Så körs den

Workflowen **"Polering — skriv en runda till Wix"** med `ref` satt till poleringsgrenen:

- `runda`: `runda-t127-fatoljer-lutning-och-paketmatt`
- `plan_sha256`: se `FLAGGADE.md` (358), eller kör `bygg-skrivplan.py` igen
- lägen i ordning: `torr` → `skriv` → `verifiera` → `stampla`

Aldrig inne i Aosoms synkfönster (:12–:29 UTC var tredje timme).
