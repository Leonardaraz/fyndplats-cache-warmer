# Runda 139 — Steg 10: kategori

Tio utkast, badad kategori skriven pa alla tio. Kvitto: `10/10 har BADA kategorierna`.

| kategori | id |
|---|---|
| Husdjur | `a2b4369f-50dc-49c4-b1d2-4367cf7f3692` |
| Lek & Tillbehor for husdjur | `ea1313f5-b60d-4264-b44b-76e83e96168c` |

`All Products` (`05e96cd6-...`) skickas ALDRIG — den agas externt och gar inte att skriva till.

## Valet ar MATT, inte ihagkommet

Trädet lastes (54 kategorier) och sedan mattes var de REDAN PUBLICERADE klosmoblerna
faktiskt sitter. Under `Husdjur` finns fem lov:

```
Burar Klader & Tillbehor · Selar Koppel & Transport · Mat & Vattenskalar
Palsvard & Skotsel · Lek & Tillbehor for husdjur
```

Fem publicerade klosmobler, alla i samma lov:

```
klostunna-60-cm-ljusgra          [All Products, Husdjur, Lek & Tillbehor for husdjur]
klostrad-104-cm-tunnel           [All Products, Husdjur, Lek & Tillbehor for husdjur]
klostrad-takspant-220-265-cm     [Lek & Tillbehor for husdjur, Husdjur, All Products]
klostrad-53-cm-tradstamsform     [Lek & Tillbehor for husdjur, Husdjur, All Products]
vaggklostrad-4-delar-...-stege   [All Products, Lek & Tillbehor for husdjur, Husdjur]
```

Ordningen i listan ar inte betydelsebarande — mangden ar det.

## FYND: den inre nyckeln heter `directCategoryIds`, inte `categoryIds`

Forsta lasningen gav TOMMA listor for publicerade sidor som ar korrekt kategoriserade.
Det sag ut som uppgift #313/#390 ("list-categories-for-items svarar tomt"), men ar en
nyckelforvaxling ETT LAGER IN.

Mätt genom att kora BADA lasarna mot SAMMA produkt:

```
listNycklar: ["item","directCategoryIds","indirectCategoryIds"]

klostunna-60-cm-ljusgra   direct: [All Products, Husdjur, Lek & Tillbehor]   listCall: []
```

Raden ar alltsa inte tom — `categoryIds` finns bara inte pa den. Runbokens Steg 10A
varnar for WRAPPER-nyckeln (`categoriesForItems`) men ar tyst om den inre. Bada maste
stamma; en ratt wrapper med fel inre nyckel ser ut exakt som ett tomt svar.

Detta ar en MÄTBAR korrigering till oppen uppgift #390.

## Skrivningen laser per rad, inte pa totalen

`POST /categories/v1/bulk/categories/add-item` tar ETT `item` och MANGA `categoryIds`,
bada med `treeReference: {appNamespace: "@wix/stores"}`.

Utfallet lastes ur `results[].itemMetadata` per `originalIndex` — inte ur
`totalSuccesses` ensamt. Samma skal som `tolkaBulkUtfall` i Aosom-synken: en aggregerad
siffra kan inte saga VILKEN rad som foll.

`ALREADY_EXISTS` behandlas som "malslaget haller redan" — inte som fel. En produkt som
en tidigare runda redan lagt i Husdjur ska inte rapporteras som misslyckad.

Resultat per produkt: `lyckade 2, misslyckade 0, satta ["Husdjur","Lek & Tillbehor for husdjur"]`.

## Ordningen mot Steg 14

Steg 14 (live-grinden) kors EFTER kategorierna — uppgift #443. En sida som saknar
kategori later sig inte hittas i butikens navigation, och live-grinden laser sidan som
en kund gor det.
