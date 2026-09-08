# Runda K12 — åtta massagefåtöljer, 3 599–6 549 kr (2026-09-08)

Katalogvärde 38 182 kr. Alla åtta var tyska Aosom-utkast (`visible:false`).

| id | pris | slug |
|---|---:|---|
| `d3d7b291` | 6 549 | `massagefatolj-gra-8-zoner-mugghallare` |
| `505eb413` | 5 399 | `massagefatolj-beige-chenille-varme-145-grader` |
| `ed03b52f` | 5 399 | `uppresningsfatolj-massage-beige-linnelook` |
| `297d8979` | 4 979 | `massagefatolj-svart-vippfunktion-landvarme` |
| `c79c22f7` | 4 899 | `massagefatolj-svart-konstlader-8-punkter` |
| `7a4ec9c6` | 4 529 | `massagefatolj-svart-manuell-145-grader` |
| `522103fd` | 3 829 | `massagefatolj-gra-knadande-elektrisk-135-grader` |
| `e140f9ab` | 3 599 | `massagefatolj-svart-fotpall-tio-punkter` |

## ☠️ Ta ALDRIG ett tal ur produktnamnet

`c79c22f7` heter `Massagesessel … bis 150kg` i importen. Både beskrivningens
egen punkt (*"Stabile Struktur trägt bis zu 135 kg"*) och tekniska data
(*"Belastbarkeit: 135 kg"*) säger **135**, och måttritningen håller med.

Namnet är ett marknadsföringsfält som leverantören skriver fritt; specen är
det som mätts. Båda talen finns i facit, alltså hade siffergrinden släppt
igenom **endera** — den kontrollerar att ett tal FINNS i källan, inte att
källan är enig med sig själv. Samma klass som #210.

**Regeln: hämta tal ur `Technische Daten` och beskrivningens punkter, aldrig
ur `name`.**

## ☠️ 522103fd är läderblandning och KNÅDANDE — inget av det står i spec-fliken

Den svenska spec-fliken importen byggde säger bara `Kunstleder, Stahl`.
Källtexten säger **20 % nötläder / 80 % polyuretan** och att massagen KNÅDAR
i tre områden — inte vibrerar, som de sju andra i rundan gör.

Båda är köpargument, och det andra är dessutom ett skötselkrav: klädseln ska
skötas som läder och inte som plast. Hade texten skrivits ur spec-fliken hade
kunden fått fel råd om sin egen möbel.

## ⚠️ Fem av tolv bilder som ströks bar fakta som inte fanns någon annanstans

Sju tyska grafiker togs bort (40 → 33 bilder). Två av dem bar de starkaste
säljargumenten i hela rundan, inbrända i pixlarna:

- `522103fd` #4: *"Benötigt nur 20 cm Abstand zur Wand"*
- `522103fd` #5: *"Entfernen Sie während der Massage die Rückenpolsterung"*

Båda står nu i brödtexten, det andra som första meningen i skötselstycket.
Det är hela skälet till J1-regeln: **läs kontaktarket FÖRE brödtexten**, annars
raderas fakta man aldrig får veta att man förlorat.

## ☠️ Två SKU-par kolliderade — fjärde gången (#199/#200)

Importen härleder variant-SKU:n ur den tyska titelns första ord:

```
FP-massagesessel-mit-fu    d3d7b291  OCH  e140f9ab
FP-massagesessel-mit       ed03b52f  OCH  522103fd
```

Fyra av åtta produkter delade två strängar. Alla åtta har nu en egen svensk
SKU på BÅDA sidorna (Wix-variantens `sku` och mappningsraden), längst 35 tecken
mot Wix tak på 40.

## Kvittona

| steg | resultat |
|---|---|
| Filgrindar | `gate` · `gate-superlativ` · `gate-lager` · `gate-alt` · `gate-seo` · `gate-sku` · `gate-lankar` — alla REN |
| Hash före/efter skrivning | **8/8 LIKA** (FNV-1a över normaliserad text) |
| SEO | 2 taggar per sida, 0 nyckelord, 8/8 |
| Variantsynlighet | `visible: true` på alla åtta — #148:s fälla |
| Bilder | 40 → 33, alt 33/33 korrekta vid återläsning |
| Kategorier | `Hem & Inredning` 8/8 + `Massage & Återhämtning` 8/8, bulk-svarets facit |
| Prisgrind | 8/8 `stammer true`, fraktandel 0,227–0,438 |
| Stämpling | 8/8, oberoende omläsning på två rader |

Lägsta lagersaldo 13 (`522103fd`), högsta 197.
