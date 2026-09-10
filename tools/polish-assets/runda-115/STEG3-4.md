# Runda 115 Steg 3 + 4 — mappningsraderna och alla 35 bilder

## Steg 3: sju mappningsrader lästa via `polish-mapping.yml`

| nyckel | pris | prisgrind | lager | fraktandel | import-SKU |
|---|--:|---|--:|--:|---|
| `cc6b56f9` | 949 | ✅ | 197 | 0,381 | `FP-kinderbagger-rutscher` |
| `fb142c5c` | 839 | ✅ | 22 | 0,430 | `FP-kinderbagger-rutscher` |
| `738ca991` | 799 | ✅ | 197 | 0,443 | `FP-sitzbagger-aufsitzbagger` |
| `0c05c1a0` | 779 | ✅ | 197 | 0,461 | `FP-sitzbagger-aufsitzbagger` |
| `23ba27a5` | 929 | ✅ | 197 | 0,353 | `FP-sitzbagger-aufsitzbagger` |
| `39d85f18` | 799 | ✅ | 46 | 0,446 | `FP-rutsch-traktor-mit` |
| `389ac5ac` | 879 | ✅ | 25 | 0,408 | `FP-rutsch-traktor-mit` |

Alla sju: `supplier: aosom`, `hasEuWarehouse: true`, lager finns, prisgrinden
stämmer mot regeln (×1,2, charm99). Ingen fraktandel över 0,5, så ingen behöver
skjutas till sist.

### ☠️ SKU-krocken är TRE-VÄGS — sju produkter delar TRE SKU:er

`FP-sitzbagger-aufsitzbagger` sitter på **tre** produkter samtidigt, och de två
andra namnen på två var. Det är importen som skapar krocken (uppgift #272), inte
poleringen — men den ligger LIVE i mappningen just nu.

Steg 8 måste därför ge alla sju var sin svenska SKU. Grinden i `matt.py`
FÄLLER om krocken försvinner ur tabellen utan att någon mätt om — annars hade
en senare läsning kunnat tro att importen lagat sig själv.

## Steg 4: 35 bilder, granskade med tre frågor var

☠️ **Frågan ställdes rätt den här gången.** Runda 112 missade en sjunde tysk
bild för att den granskades med "är den snygg?". Arken byggdes per produkt med
positionsnummer, och varje bild prövades mot: *står det text i pixlarna? bär den
ett varumärke? visar den en annan variant än huvudbilden?*

### ✅ Noll tyska ord i 35 bilder

Ovanligt rent för familjen. Måttritningen (bild 3 på alla sju) bär rena siffror
och "cm" — inga rubriker, ingen tysk etikett.

Ritningarna **bekräftar dessutom yttermåtten** på alla sju, alltså är Steg 2:s
rättelse mätt två gånger oberoende.

### ☠️ Tre olika varumärken sitter fysiskt på varorna

| märke | på | i leverantörstexten |
|---|---|---|
| **CAT** | `cc6b56f9`, `fb142c5c`, `23ba27a5` | bara `23ba27a5` säger "Caterpillar-Lizenz" |
| **New Holland** | `39d85f18`, `389ac5ac` | **inte nämnt alls** |
| generiskt "TRUCK" | `738ca991`, `0c05c1a0` | inget märke |

Leonards linje gäller pixlarna: sitter märket på varan gör vi ingenting åt det.
Men i TEXTEN skrivs bara det ut som leverantören uttryckligen licensierat —
alltså Caterpillar på `23ba27a5` och ingenting annat. New Holland-emblemet
fyller `39d85f18` bild 4 och nämns ändå inte, för leverantören har inte uppgett
någon licens.

⚠️ **Och kontaktarkets egna etiketter var fel.** Jag kallade `738ca991` och
`0c05c1a0` "CAT-bandgrävare" och "CAT-frontlastare". Zoomen visar generiska
"TRUCK"-tryck. Rättat i `matt.py`. Att gissa märket ur färgen gul är precis
samma fel som att gissa produkttypen ur namnet.

### ☠️ Måttritningen MOTSÄGER textens förvaringsmått på två produkter

| produkt | text | ritning |
|---|---|---|
| `738ca991` | 20 × 15 × 9 | **22 × 16** |
| `0c05c1a0` | 25 × 15 × 9 | **22,5 × 15** |

Yttermåtten stämmer på alla sju; bara det här fältet spretar. Facket är
verkligt och nämns — måttet skrivs inte ut. `FORVARING` är tom med flit och
`FORVARING_MOTSAGT` bär båda talen, så nästa läsare ser varför.

Samma riktning som batterifrågan: ett okänt är inget nej, men det är inget tal.
