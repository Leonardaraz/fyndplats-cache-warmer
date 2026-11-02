### Syskonsvepet: färg, storlek och samma vara i hela sortimentet (2026-09-27)

Leonards fråga: finns det fler färgdubbletter, och storleksdubbletter, alltså
samma artikel i olika storlekar? Poleringen har hittat syskonen ett i taget, med
måttsvep över polerade texter (runda N76). Feeden har svaret
strukturerat: färg, yttermått, material, vikt och paketmått är egna kolumner, och
mappningen säger vilken sida varje rad blev.

Workflowen **"Dubbletter — hitta färg- och storlekssyskon"** →
`/api/admin/aosom-familjer` → `lib/aosom/familjer.ts`. Den skriver ingenting.

| relation | kräver |
|---|---|
| färg | samma mått, paket och vikt, olika färg, samma modellnamn — eller samma klunga, material och kategori |
| samma vara | samma mått, paket och vikt, samma färg, samma modellnamn — eller samma klunga, material och kategori |
| storlek | samma klunga (`Psin`), olika mått, samma färg, material och kategori, samma modellnamn |

"Samma modellnamn" jämförs på feedens tyska namn efter att färgord, siffror,
enheter, storleksord och husmärken skalats bort. Kandidaterna kommer från
`Psin` och från den fysiska signaturen (mått plus paket), som täcker raderna
utan klunga.

Fem egenskaper som inte ska tas bort:

1. ☠️ **`Psin` väljer bara kandidater och avgör ingenting.** Klungan är ingen
   variantgrupp (se `feed.ts`), och en storleksrelation kräver ändå samma
   modellnamn, färg och material. Utan klungan räknas två olika mått inte som
   något alls.
2. ☠️ **Svaret bär aldrig artikelnummer, `Psin`, utkastens tyska namn eller
   kostnader.** Utkastens namn är Aosoms egna titlar, och en sökning på dem leder
   till Aosoms produktsida. Publicerade sidor visar sitt svenska namn, och all
   fritext går genom `redigera`. Ett test serialiserar svaret och letar.
3. **Familjens typ räknas på VÅRA sidors färger och mått**, inte på kanterna. En
   familj kan hålla ihop genom en feedrad vi inte har (`ejHosOss`).
4. ☠️ **Samma massfel-spärrar som synken** (`MIN_FEED_RADER`,
   `MIN_WIX_PRODUKTER`). En halvläst katalog hade fått publicerade sidor att se
   ut som saknade, och svaret hade sett komplett ut.
5. **Listan är ett underlag för en människa.** Varje familj ses med bilderna
   innan något slås ihop. `verktygetIdag` betyder bara att sammanslagningen
   *kan* lägga ett syskon som en ny kombination av färg och storlek på en
   publicerad sida, inte att den ska.

`?par=<id>,<id>` kalibrerar mot par som redan är granskade: svaret säger vad
jämförelsen såg (samma klunga, mått, färg, vikt och namnlikhet) utan att något
nummer skrivs ut.

**Första körningen i produktion (2026-09-27):** 679 familjer över 1 615 sidor
(722 publicerade, 893 utkast). Av dem är 570 färgfamiljer, 87 storleksfamiljer,
12 färg och storlek och 10 samma vara. 225 har en publicerad sida, 243 bara
utkast och 211 flera publicerade. Verktyget klarade minst ett par i 416. Underlag:
6 229 feedrader och 5 223 mappningar. 233 artiklar saknades i feeden, och noll
artiklar satt på två sidor.

☠️ **Kalibreringen mot N76 fann bara ett av åtta granskade par (hopphindren),
och `?par=` visade varför.** Tre skäl, och bara det första går att laga i svepet:

- **Aosom ger färgsyskon olika titlar.** A-hindret i grått och orange och
  agilitybågarna i gult och blått har samma klunga, mått, paket, vikt, material
  och kategori, men namnlikheten är **0 och 0,17**. Därför räcker nu samma klunga
  plus identisk fysik (mått, paket och vikt på båda, material och kategori inte
  olika) för en färg- eller samma-relation, oavsett namn. Utan klunga ligger
  namnkravet kvar. Talen ovan är uppmätta FÖRE lagningen.
- **Fyra av paren har en publicerad sida som är mappad mot AliExpress**
  (klättersetet två gånger, kattlådan och det ena agilitysetet i tre delar).
  Svepet ser bara Aosom-mappningar, och det är den blinda fläcken som står i
  "Vad spärren INTE ser".
- **Det sista paret skiljer sig i feeden:** agilitysetet i tre delar mot utkastet
  har olika klunga, andra mått och 32 % skillnad i vikt. Svepet gör rätt som
  inte slår ihop dem. Paret bör ses om med bilderna.

**Efter lagningen (samma dag, körning 3):** 777 familjer över 1 949 sidor (873
publicerade, 1 076 utkast): 666 färg, 84 storlek, 14 färg och storlek och 13 samma
vara. 277 har en publicerad sida, 254 bara utkast och 246 flera publicerade.
Verktyget klarar minst ett par i 512. Underlaget är detsamma, så skillnaden är
regeln: 96 färgfamiljer till. A-hindret och agilitybågarna står nu som färgfamiljer
med en publicerad sida var, och hopphindren som förut. Regeln är lösare, så varje
ny färgfamilj ses med bilderna innan något slås ihop (punkt 5 ovan).

När ett syskon ska bli ett val står i runbooken (Dubblettskärmen). Verktygets
referens står i **`docs/polish/syskon.md`**: inputs, lägen, arbetsgång, bilder,
hinder och färger som inte kom via verktyget.
