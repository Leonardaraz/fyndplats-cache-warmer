# Steg 9 — två KONSTRUKTIONSFEL som bara bilden kunde hitta

Steg 9 börjar med att man tittar på bilderna igen, för alt-texterna och för
kortens rubriker. Den genomgången fällde två påståenden som redan stod live i
Wix — båda gröna i textgrinden, båda osanna om produkten.

## ☠️ `3addfbf8`: U-stället är TOPPBÄDDEN, inte ett ställ för den runda bädden

Texten sa:

> Bädden är rund på Ø34 cm och **vilar i ett U-format ställ**

Måttritningen visar tre skilda delar ovanpå varandra:

| del | mått | var |
|---|---|---|
| U-formad bädd | 45 × 25 × 12,5 cm | **överst** |
| Mellanplan med hål | 45 × 30 cm, hål Ø15,5 | mitten |
| Rund bädd | Ø34 cm, 7 cm kant | **på bottenplattan** |

Leverantörens egen tyska tabell listar dem som tre rader:
`Abmessungen Bett: Ø34 x 7H cm`, `Zweite Plattform: 45L x 30B cm. Bohrung:
Ø15,5 cm` och `U-förmiges Gestell Abmessungen: 45L x 25B x 12,5H cm`.

Min text slog ihop rad ett och rad tre till en enda möbel. Följden var inte
bara en felaktig relation: sidan **räknade en liggplats för lite** — den U-
formade toppbädden nämndes aldrig som något att ligga i.

## ☠️ `90573e36`: planen är BLOMFORMADE, och de är TVÅ

Texten sa:

> en ramp, en hängmatta och en **rund hoppyta på Ø30 cm**

Hjältebilden visar två plan med **skurna, blomlika kanter** — och leverantörens
egen beskrivningsrad säger ordagrant `blomform`. `Ø` påstår dessutom en cirkel
som inte finns. Talet 30 cm är rätt; formen och antalet var fel.

## Regeln

☠️ **Ett mått är inte en form.** Leverantörens `Sprungplattformgröße: Ø30 cm`
är ETT tal om en sak, och när jag skrev ut talet skrev jag omedvetet ut `Ø` som
en formuppgift också. Samma sak med `U-förmiges Gestell`: jag läste måttet men
gissade var delen satt.

☠️ **Och ingen textgrind kan fånga det.** Inget ord är förbjudet, ingen siffra
är ohärledd, ingen ton är fel — det är RELATIONEN mellan delarna som är osann.
Exakt samma klass som runda 138:s kortrubrik (*"under den nedre hålan"*), och
den fångades också på ett kontaktark, inte i kod.

⚠️ **Rättat per ORD, inte per förekomst.** `rund` söktes i ALLA tio produkters
färdiga HTML innan något skrevs — femton träffar, granskade mot var sin bild:

| produkt | påstående | dom |
|---|---|---|
| `27b607dc` | "fyrkantig, inte rund" | ✅ stolpen ÄR fyrkantig |
| `3a96740e` | "rund korg på ena sidan" | ✅ |
| `3addfbf8` | "rund bädd Ø34" | ✅ talet rätt, PLACERINGEN fel |
| `4faf9f4c` | "rund hoppyta Ø30" | ✅ ritningen visar en rund skiva |
| `8d074911` | "rund öppning 16 cm" | ✅ |
| `90573e36` | "rund hoppyta Ø30" | ☠️ **blomformad, och två** |
| `a4d8feca` | "väggarna är runda" | ✅ tunna |
| `b04b5375` | "rundade kanter" | ✅ |
| `b813d037` | "rund bas Ø48" | ✅ |

Två fel av femton. De tretton övriga rördes inte.

## Skrivningen

Grinden grön (`självtest 11/11 ok`, `10 produkter, 0 fel`), `steg7.json`
regenererad, och bara de två produkterna skrivna om:

```
3addfbf8  rev 6→7  visible false  kvitto: byte-identisk
90573e36  rev 3→4  visible false  kvitto: byte-identisk
```

PATCH:en bar bara `plainDescription`. Kvittot är en EGEN GET med
`?fields=PLAIN_DESCRIPTION` jämförd mot `wix_normalisera(källan)`.
