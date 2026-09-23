# Steg 7 — texten skriven till Wix

Tio produkter. Alla tio skrivna, alla tio kvitterade byte-identiskt mot
`grindar.wix_normalisera(källa)`.

| id | rev före → efter | slug | visible |
|---|---|---|---|
| 1467588a | 1 → 2 | klostrad-92-cm-hangande-boll | false |
| 27b607dc | 1 → 2 | klospelare-80-cm-ek-och-cremevit | false |
| 3a96740e | 2 → 3 | klostrad-153-cm-hala-och-hangmatta | false |
| 3addfbf8 | 4 → 5 | klostrad-76-cm-badd-och-klosbrada | false |
| 4faf9f4c | 2 → 3 | klostrad-113-cm-hala-badd-ramp | false |
| 8d074911 | 1 → 2 | vaggklostrad-moln-hala-och-stege | false |
| 90573e36 | 1 → 2 | klostrad-220-240-cm-gront-och-rosa | false |
| a4d8feca | 2 → 3 | klostunna-60-cm-brun | false |
| b04b5375 | 2 → 3 | vaggklostrad-73-cm-tre-klivsteg | false |
| b813d037 | 2 → 3 | klostrad-104-cm-fyra-plan-grat | false |

`05c91630` är inte med — slutsåld hos Aosom (Steg 1).

## Kvittot

Återläsningen gick med `?fields=PLAIN_DESCRIPTION` och jämförde **hash på den
LAGRADE strängen** mot hash på `wix_normalisera(källa)`, inte mot vad PATCH-svaret
ekade tillbaka. Fem fält per produkt: brödtext, namn, slug, titel, meta — plus
antal sökord och `visible`.

```
kvitto: 10/10 byte-identiska
avvik: []
```

`visible` var `false` före OCH efter på alla tio. Ingen PATCH bar fältet.

## ☠️ Klistra-grinden täckte TEXTEN men inte ID:T

Första skrivomgången (tre produkter) gav två skrivna och **en 404**:

```
4faf9f4c   Wix API error (404): Entity not found
           entityId: 4faf9f4c-9e8a-4b59-8a97-1ab3ad0a9a3e
```

Det id:t finns inte. Rätt id står i `ids.json` och i `steg7.json`:
`4faf9f4c-36df-49eb-950b-5c18c3a37f8d`. Filen hade alltså rätt hela tiden — det
var KLISTRINGEN som var fel, och det är exakt vad hash-grinden finns för att
fånga. Den fångade den inte, för den hashade bara `brod`.

☠️ **404:an var tur, inte grind.** Ett påhittat id som råkar vara ett VERKLIGT
id skriver i stället en annan produkts text över den. Wix svarar 200. Samma
klass som `sku`-förväxlingen och som #536:s påhittade fil-id — och samma sak
inline-regeln finns för att förhindra.

Grinden hashar sedan dess **id:t också**, mot `H(id)` räknad ur filen:

```js
if (H(p.id)   !== p.idhash) avvikande.push({id: p.kort, falt: "id"});
if (H(p.brod) !== p.hash)   avvikande.push({id: p.kort, falt: "brod"});
if (avvikande.length) return {AVBRUTET: "klistra-hash stämmer inte", avvikande};
```

De sju följande skrivningarna gick med `hashgrind: "id+brod 4/4 ok"` respektive
`"id+brod 2/2 ok"` och noll fel.

**Regeln: allt som klistras ska hashas — inte bara det som är långt.** Ett
36-teckens id är lättare att skriva fel än 3 000 tecken brödtext, för brödtexten
kopieras medan id:t "kommer ihåg sig".

## Revisionerna var inte 1

Fyra av tio stod på revision 2 och en på 4 när rundan började, trots att Steg 3
läste dem som 1. En annan session rör samma katalog. Därför läses revisionen
in-sandbox omedelbart före varje PATCH, aldrig ur en fil.
