# Runda 147 — Steg 3–5: källäsning, syskonutredning och bildgranskning

## Steg 3 — alla tolv lästa (revision, variant, kategori, prisgrind)

Alla tolv: `visible:false` vid inläsning, en variant vardera,
`variantVisible:true`. Prisgrinden gav `stämmer:true` på samtliga.

## ☠️ Tre artikelnummerbaser pekade mot redan publicerade runda
## 146-sidor — utrett per produkt, inte antaget

Tre av de tolv kandidaterna delar artikelnummerbas med en sida runda
146 redan publicerat. Samma mekaniska syskonregel som task #275/#61
("artikelnumrets BAS är modellen, suffixet/färgkoden är varianten")
gav den första ledtråden, men själva domen — syskon eller dubblett —
kräver alltid källtextens färgfält OCH en oberoende bildkontroll (task
#532: mått och artikelnummer ensamma är inget bevis).

- **`cc2add44` (grönt) ↔ runda 146:s `be595bfd` (vitt).** Samma
  bas-artikelnummer `[artikelnr]`, identiska mått 200×75×188 cm, samma
  konstruktion (foliehus med rullbar dörr och nätfönster). Källtextens
  färgfält skiljer entydigt (Grön mot Weiß→"Vit"), och bilderna visar
  samma konstruktion i olika färg. Genuint färgsyskon, ingen dubblett.
- **`87485b8a` (grå) ↔ runda 146:s `6e60b45a` (orange).** Samma
  bas-artikelnummer `[artikelnr]`, identiska mått 90×46×40 cm (liten
  drivbänk i trä/polykarbonat). Till skillnad från `6e60b45a`, vars
  brödtext och strukturerade data motsade varandra om färgen (se runda
  146:s STEG3-5.md), är `87485b8a`s egen brödtext och Technische Daten
  **eniga**: grått trä genomgående. Ingen färgkontradiktion att lösa
  här — bara ett rent färgsyskon.
- **`1a46d2af` (grönt+transparent) ↔ runda 146:s `b5ba12b8`
  (grått/transparent).** Samma bas-artikelnummer `845-059`, identiska
  mått 190×252×201 cm (premiumväxthus med takfönster och skjutdörr).
  `1a46d2af` **ärver samma Lieferumfang-kontradiktion** som `b5ba12b8`
  redan hade (task #468-familjen): brödtexten lovar "4 Pflöcke … im
  Lieferumfang enthalten" (fyra markpluggar ingår), men den
  strukturerade Lieferumfang-listan visar bara växthus + anvisning —
  noll pluggar. Löst på exakt samma sätt som för `b5ba12b8`: den
  svenska texten nämner markförankring som en rekommendation (i linje
  med källans egen säkerhetsnotis), men lovar inte att pluggar medföljer.

Alla tre bekräftades genom att jämföra det fullständiga källtextfältet
för färg **och** en oberoende bildläsning — aldrig genom att bara
matcha artikelnumret. Korslänkar läggs till på båda sidor i alla tre
paren (samma regel som task #480 och #585 väntar redan på: "korslänken
ska gå åt båda håll").

## Steg 4 — bildgranskning: noll logotyper, noll legal-fynd

Samtliga tolv produkters bilder granskades (nedladdade till
sessionens scratchpad och lästa via multimodalt verktyg), med fokus på
leverantörslogotyp i övre vänstra hörnet och på färg-/materialpåståenden
som inte håller vid zoom — samma metod som runda 144–146.

**Ingen logotyp hittad på någon av de granskade bilderna.** De tre
troliga färgsyskonen ovan bekräftades dessutom oberoende i bild: rätt
konstruktion, rätt färg för respektive variant, ingen bildmässig
avvikelse som hade talat emot syskonslutsatsen.

## Steg 5 — genomgående särdrag i batchen

- **"Stufe"-vindtalet förekommer på flera produkter i batchen**
  (`75b88995`, `b8496223`, `ad667726`, `3e60d4ee`, `cc2add44`) — citerat
  som leverantörens egen skala ("nivå 4"), samma hantering som runda
  146:s blandade vindtalsformat.
- **`75b88995`/`b8496223` är samma konstruktion i två storlekar**, inte
  färgsyskon — samma polytunnel-familj, skalad. Texterna nämner
  storleksskillnaden ("samma konstruktion som vår större/mindre
  modell") i stället för att upprepas identiskt.
- **`ad667726`/`3e60d4ee` och `e0b85bb6`/`83a5fc0e` är interna
  färgsyskonpar** inom rundan själv (grön/transparent respektive
  grå/brun) — samma mönster som runda 144–146:s interna syskonpar,
  ingen extern korslänk behövs för dessa två.

Ingen av de tolv nämner glas eller härdat glas; ingen anger en
snölastsiffra. Steg 2:s regler håller oförändrat på alla tolv. Inget av
de tolv faller på bildgranskningen — alla går vidare till Steg 7 med
ovanstående precisionspunkter som facit.
