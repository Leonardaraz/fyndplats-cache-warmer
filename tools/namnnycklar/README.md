# Namnnycklar: jämförelsesajtens namn på våra varor

Kunden som skriver eller klistrar in det namn PriceRunner eller Prisjakt visar
för en av våra varor ska få den varan först i sökningen, fast den heter något
annat här. Regeln och skälen står i butikens `CLAUDE.md`, "Jämförelsesajtens
namn på varan: nycklar", och koden i `lib/search.ts` (`namnnyckel`,
`medNamntraff`).

Verktyget här bygger `lib/namnnycklar-data.ts`: vår adress → nycklarna för
namnen som pekar på varan. En nyckel är en enkelriktad summa av namnets ord.

## ☠️ Filen med namnen checkas aldrig in

Namnen är jämförelsesajtens, och några bär leverantörens artikelnummer. Filen
ligger utanför repot. Verktyget tar den som argument, skriver bara nycklar och
våra egna adresser, och skriver aldrig ut ett namn: bara antal. Repot är
publikt.

## Så byggs filen om

```
curl -s https://www.fyndplats.se/api/search-index > /tmp/index.json
node --experimental-strip-types --no-warnings tools/namnnycklar/bygg.ts \
  <filen med namnen.csv> /tmp/index.json A
```

Filen med namnen är en CSV med kolumnerna `pr_namn` (jämförelsesajtens namn),
`sakerhet` (klassen, A är de säkraste paren) och `slug` (vår adress). Sista
argumentet är klasserna som ska med, med komma emellan. Utan det byggs bara A.

Sökindexet avgör vilka varor som finns: en nyckel till en vara som inte står i
indexet skrivs inte.

Utskriften är en räkning:

| | |
|---|---|
| `rader` | rader i de valda klasserna |
| `forFaOrd` | namn med färre än tre ord när märket är borta: de får ingen nyckel |
| `varanSaknas` | varan står inte i sökindexet |
| `nycklar` | nycklar som skrevs |
| `flertydiga` | nycklar som två eller tre varor delar: alla står först |
| `forMangaVaror` | namn som fler än tre varor delar: de stryks |
| `varor` | varor som fick minst en nyckel |

Kör proven efteråt (`lib/sok-2026-11-25.test.ts` läser den byggda filen rad för
rad och fäller på allt som inte är en adress och nycklar), och mät med
`tools/sok-matning/utfall.ts` att vanliga sökningar inte ändras.

## Mätt 2026-11-25

Filen hade 2 631 rader, parade på sannolikhet (bild, text, tal och pris), inte
på GTIN: 463 i klass A, 563 i B och 1 605 i C. Bara A är byggd.

| klass A, 463 namn | före | med nycklar |
|---|---:|---:|
| varan först | 94 | 427 |
| plats 2–4 | 35 | 4 |
| plats 5–12 | 15 | 1 |
| längre ner | 6 | 1 |
| träffar, men inte varan | 149 | 6 |
| noll träffar | 164 | 24 |

33 namn har färre än tre ord utan märket och fick ingen nyckel, och 3 namn
delas av flera varor. Av 8 336 vanliga sökningar ändrades ingen, och
sökindexet växte med 8 372 byte (5 623 byte packat, 0,9 %).
