# Runda 139 — Steg 1

Familj: **klösmöbler** (klösträd, klöstunnor, klöspelare, väggklösträd).
Mätt 2026-09-13 mot skarpa Wix.

## Katalogsvepet

| | |
|---|--:|
| `products/search`, sidor | 27 |
| lästa rader | 2 677 |
| unika id | **2 677** |
| `avhuggen` | **false** |

Svepet är alltså komplett, inte kapat — och `unika == lästa`, så markören
flyttade sig (jfr #373/#404).

## De elva kandidaterna

Fjorton tyska klösmöbelutkast fanns; tre är redan `draftStatus: "rejected"`
(`0908bbf0`, `ed8f0e56`, `fcfe68f1`). Kvar: elva.

| id8 | mått (cm) | prisgrind | saldo | fraktandel |
|---|---|---|--:|--:|
| `05c91630` | 40 × 40 × 132 | ✅ | **0** | 0,487 |
| `1467588a` | 48 × 48 × 92 | ✅ | 50 | 0,466 |
| `27b607dc` | 38 × 38 × 80 | ✅ | 64 | 0,464 |
| `3a96740e` | 65 × 50 × 153 | ✅ | 58 | 0,458 |
| `3addfbf8` | 60 × 30 × 76 | ✅ | 197 | 0,388 |
| `4faf9f4c` | 60 × 40 × 113 | ✅ | 45 | 0,482 |
| `8d074911` | 50 × 40 × 84 | ✅ | 86 | 0,392 |
| `90573e36` | 30 × 25 × 220–240 | ✅ | 197 | 0,411 |
| `a4d8feca` | Ø35 × 60 | ✅ | 74 | 0,450 |
| `b04b5375` | 40 × 28 × 73 | ✅ | 88 | 0,494 |
| `b813d037` | 48 × 48 × 104 | ✅ | 39 | 0,499 |

**Prisgrinden stämmer på 11 av 11.** Ingen rad stannar på pris.

### ☠️ `las` har en LAGERGRIND sedan runda 138 — och den fäller en

`05c91630` svarade `saldo: 0 — SLUTSALD hos Aosom` med en `::warning::`.
Priset stämmer; sidan säljer bara ingenting. **Den skjuts upp**, inte fälls.
Tio går vidare.

Ingen rad har fraktandel över 0,5 — men `b813d037` ligger på **0,499**,
alltså en tusendel under. Det är inget fel, men det är inte heller marginal.

## Dubblettgrinden, kord i BÅDA riktningar

`steg1-dubblettgrind.py` (5 självtestfall) mot `publicerade-matt.json`
(92 publicerade klösmöbelsidor: 83 tripplar + 9 runda baser).

**Riktning A — utkasten mot varandra: noll träffar.** De elva är elva produkter.

**Riktning B — utkasten mot familjen: två träffar.**

### ⚠️ Den första nollmätningen var MIN REGEX, inte sidorna

Första passet läste etiketten `Mått` och gav **41 av 92 som `null`**. Det såg ut
som att 41 publicerade sidor saknar mått. De gör inte det — en kontrollavläsning
av tre av dem visade `Mått` i texten på alla tre. Regexen krävde en siffra inom
12 tecken efter etiketten, och i den lagrade HTML:en ligger det mer än så
emellan.

Omlagd till att läsa ALLA måttripplar i texten: **83 av 92 svarar**. De nio som
inte gör det är RUNDA tunnor, vars mått är ett **par** (Ø × H), inte en trippel —
och deras par står i `par_rundabas`. Summan är 92, alltså hela familjen.

**Ett tomt svar är inget kvitto.** Nionde gången, och den här gången var det
grinden själv som ljög.

### Träff 1: `a4d8feca` ~ `klostunna-60-cm-ljusgra` (Ø35 × 60)

Redan avgjord i runda 135 (#518): **färgsyskon**, brunbeige mot ljusgrå.
Grinden bekräftar måttet; klassningen står. Poleras mot syskonets text och
korslänkas åt BÅDA håll (#480).

### Träff 2: `b04b5375` ~ `vaggklostrad-4-delar-plattformar-stege` (40 × 28 × 73)

Den här var ny, och den såg farlig ut:

| | utkastet `b04b5375` | publicerade `38c00989` |
|---|---|---|
| huvuddel | 40 × 28 × 73 | 40 × 28 × 73 |
| korg/hängmatta | Ø30 × 5 | Ø30 × 5 |
| antal delar | 4 | 4 |
| material | spånskiva, plysch, sisal | spånskiva, plysch, sisal |
| kattvikt | max 5 kg | — |
| **färg** | **beige + krämvit** | **grå** |
| **leverantör** | **aosom** | **`supplier: null` → AliExpress** |

Fyra fält identiska. Det är precis den interna AE-mot-Aosom-dubbletten som
`CLAUDE.md` varnar för — feed-importen kan inte se en AE-inköpt Aosom-vara.

**Men måtten är inget bevis (#532), och bilden avgjorde åt andra hållet.**
Fjärde delen skiljer sig:

- publicerade (grå): en **stege med tre cylindriska steg på en skena**
- utkastet (beige): **tre separata väggpinnar**, var och en en rund platta med
  en sisalcylinder

Huvuddelen är samma modell. Set-sammansättningen är det inte. **Ingen
ommappning, ingen pensionering** — två besläktade väggset som får ligga kvar
var för sig. De korslänkas som relaterade produkter, inte som färgsyskon.

## Batchen

**Tio produkter.** `05c91630` väntar på lager.
