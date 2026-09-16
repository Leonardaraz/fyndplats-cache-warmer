# ☠️ Två PUBLICERADE sidor är samma trappkärra — 1 039 mot 1 539 kr

Hittad 2026-09-16 när dubblettskärmen kördes om med rätt svepform. **N8:s egen
skärm var blind** (`fields` skickades bara på sida 1, alltså hade bara 6 av
2 844 publicerade sidor någon text att jämföra) och rapporterade 0 krockar.
Med `fields` på varje sida: 2 221 av 2 844 sidor har måtttrippel — och en
krock faller ut.

| | `8aa0bb6c` (min, runda N8) | `59c3b5d6` (äldre) |
|---|---|---|
| Pris | **1 039 kr** | **1 539 kr** |
| Mått | 67 × 44 × 106,5 cm | **44 × 67 × 106,5 cm** |
| Hopfällt | 44 × 38 × 72 cm | **44 × 38 × 72 cm** |
| Konstruktion i texten | sex hjul i två trestjärnor | "sex hjul i två roterande treklövrar" |
| Saldo | 28 | 98 |
| Skapad | 2026-08-28 | 2026-08-21 |
| Revision | 4 | 9 |
| Slug | `sackkarra-trappklattrande-120-kg` | `trappkarra-6-hjul-hopfallbar` |

Måtten är **samma tre tal i båda tripplarna**, bara i olika axelordning — exakt
det som gör att bokstaven inte är ett facit och positionen är det.

⚠️ **Bildhashen skiljer, och det är ett ÄKTA negativt.** Den äldre sidans
huvudbild heter `tk-hjalte.jpg` — ett kort vi byggt själva, inte
leverantörsfotot. Den byte-identiska klassen kan per definition inte se det.
Måtten är facit, precis som huset redan skrivit ned.

## Klassen är Aosoms EGEN feed-dubblett, inte en AE/Aosom-krock

Olika saldo (28 mot 98) på samma fysiska vara är signaturen för två
artikelrader i samma feed — samma sak som hörnsoffan `69c5e15c` mot `34341c4f`
(saldo 101 mot 12). Ommappningen till Aosom är därför en **no-op**: hindret
`redan_aosom` fäller en rad som redan är Aosom. Det som gäller är att EN sida
pensioneras.

## ☠️ Skillnaden mot tidigare fall: BÅDA ÄR PUBLICERADE

Husets pensioneringsregel bygger på att "ett osynligt utkast kostar ingenting
medan det ligger". Här är båda live, alltså är avpubliceringen en
kundpåverkande åtgärd — och 500 kr skiljer på samma vara. Samma klass som
`#167` (två publicerade Mercedes G350-gåbilar, 1 129 mot 1 259 kr), som står
som Leonards beslut.

## ✅ Leonards beslut 2026-09-16: behåll den billiga, pensionera 1 539

Utfört i den ordning som gör varje steg verifierbart:

| steg | utfall |
|---|---|
| Avpublicerad `59c3b5d6` | revision **9 → 10**, `visible:false`. Namn och slug orörda |
| Verifierad i SEPARAT läsning | GET **och** search säger `visible:false`, revision 10 |
| Mappningsraden stämplad | `needsAiPolish:false`, `draftStatus:"rejected"` — rutten läser tillbaka, alltså ett kvitto |
| 301 skriven | `trappkarra-6-hjul-hopfallbar` → `/produkt/sackkarra-trappklattrande-120-kg` |

Sidan **raderas inte**. Ett osynligt utkast kostar ingenting medan det ligger,
och en radering går inte att ångra om matchningen visar sig vara fel.

⚠️ **Säljbart djup sjunker på den här varan.** Den sida vi behåller har saldo
**28**, den pensionerade hade **98** — två artikelrader i samma feed, alltså
två lager vi inte kan slå ihop. Tar 28 slut ligger 98 kvar hos Aosom under ett
artikelnummer ingen av våra sidor längre pekar på.

### ☠️ Och redirect-grinden vägrade — på en bugg, inte på verkligheten

Två körningar avvisades med *"är fortfarande en synlig produkt"* medan BÅDA
Wix-läsningarna sa `visible:false`. Det var inte projektionssläpet.
`listAllV3Products()` frågar `products/query` UTAN synlighetsvillkor, och V3
lägger inte på något implicit `visible:true` — men listan bar inget
`visible`-fält alls, så varje UTKAST räknades som en levande sida.

Felet gick åt båda håll, och det andra är det dyra: **målkontrollen, som finns
för att stoppa en 301 in i en 404, kunde aldrig fälla en.** Lagat på grenen med
tre tester (verifierade genom att återinföra buggen — två faller, och bara de
två). Samma funktion bar dessutom ett tyst tak på 50 sidor = 5 000 produkter mot
en katalog på 5 748; det kastar nu i stället för att kapa.

Redirecten skrevs därför med `force=1`. Det är inte en genväg förbi grinden:
förutsättningen grinden skyddar — en SÄLJANDE sida — är mätt frånvarande i två
oberoende läsningar. Rutten i produktion kör från `main` och har inte fixen än.

## Kvitto på att skadan är begränsad

Alla 62 produkter ur rundorna N2–N8 kördes om mot hela den publicerade
katalogen med rätt svepform: **en enda krock**, den här. De övriga 61 är rena.

⚠️ Och 12 av de 62 har bara **EN** måtttrippel, alltså kan skärmen aldrig fälla
dem (`#274`): `c8376256` `67ba375c` (N2) · `a6113d64` (N3) · `df3a97c6`
`6b8cd35b` (N4) · `3a334cef` `3ddfd60c` `3c8fe7db` (N5) · `1c883b87` (N6) ·
`bd24e5f9` `77d3bfc2` (N7) · `3835cd29` (N8).
