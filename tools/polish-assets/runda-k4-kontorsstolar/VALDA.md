# Runda K4 — åtta kontorsstolar 1 799–3 239 kr

Urvalet är inte gjort ur prislistan. Det är gjort ur de **59 dimensionellt
unika** utkasten (#187): 128 kontorsstolsutkast jämfördes rad för rad mot 90
publicerade kontorsstolar, med måtten normaliserade så ett axelbyte inte gömmer
en tvilling. Åtta av utkasten har en publicerad tvilling och 59 ligger i
syskonkluster inom utkasten — de rördes inte.

| id | pris | vad som skiljer den från de andra sju |
|---|---:|---|
| `127b4726` | 3 239 | **113–132 cm — högst i katalogen.** Nackstöd, ryggens två zoner, svankstöd, sittdjup OCH 4D-armstöd ställs var för sig |
| `4de34dce` | 2 169 | **Bär 135 kg** och är **80 cm djup** — mest av alla. Steglöst till liggläge, sitthöjd 56–62 cm |
| `39c93316` | 2 059 | **72 cm rygg** i mikrofiber och **sitthöjd från 44 cm** — lägst i rundan. Enda med angiven certifiering |
| `14b36590` | 2 039 | **18 cm rygg** — tjockast. Låser i VALFRI vinkel, vattenavvisande konstläder |
| `6f8700db` | 1 859 | **155°** — djupast. Fickfjädrar i sitsen, reptåligt konstläder, 151 cm utfälld |
| `79be8409` | 1 819 | **Svankstöd i tre zoner** + 3D-armstöd + 2D-nackstöd + **inbyggd klädhängare** |
| `61dfad38` | 1 819 | **56 cm djup — grundast i sortimentet** och **18,5 kg — lättast**. Gaskolv klass 4 |
| `2caa0197` | 1 799 | **Chenille** — enda i sortimentet. Rygg i tre segment, 15 cm sits, **inget fotstöd** |

## ☠️ Lagergrinden fällde en kandidat innan en rad text skrevs

`d9f4c334` (1 879 kr, 67 × 65 × 120–128) var med i urvalet tills `lager.tsv`
skulle skrivas: **saldo 0, OUT_OF_STOCK**. Den byttes mot `2caa0197`. Det är
tredje rundan i rad grinden gör jobbet i URVALSSTEGET i stället för att felet
ska fångas av en slump i prisgrinden efter att texten är skriven (#173).

Lägsta saldo i den publicerade åttan är 12 (`6f8700db`), högsta 133.

## ☠️ Kontaktarket: källtexten har fel om materialet på `4de34dce`

Den tyska texten säger `Kunstlederbezug` i brödtexten OCH `Kunstleder` i
Technische Daten. Närbilderna 4 och 5, förstorade, visar enskilda varp- och
väfttrådar, slubbig linnestruktur och en VÄVD passpoal längs sömmen — det är
tyg, inte konstläder. Alla fem produktbilder visar samma matta väv.

**Tredje gången källtexten har fel om material eller färg**, och alla tre
hittades av kontaktarket före brödtexten (K2 `da5668cb`, K3 `2a046f66`, nu den
här). Skrivet: fotot som facit för YTAN, källan för stommen. Uppgift #189.

⚠️ Samma rad har ett importfel till som INTE når kunden eftersom spec-tabellen
skrivs om vid poleringen: svenska spec-blocket har
`Material: L68 x B80 x H120–126 cm` — måtten hamnade i materialfältet.

## Fem tyska grafiker bort

| bild | vad som står i den |
|---|---|
| `14b36590` 4 | KUNSTLEDER · Leicht zu reinigen · Stilvoll |
| `79be8409` 4 | GEPOLSTERTE KISSEN · Hochdichter Schaumstoff · Stabile Planke |
| `79be8409` 5 | SICHER FÜR ALLE ARTEN VON BÖDEN · PU-Räder · 360° drehbar |
| `61dfad38` 4 | SICHER FÜR ALLE ARTEN VON BÖDEN |
| `61dfad38` 5 | SAMTARTIGER STOFF · Elegant · Hautverträglich |

Fem av 40 — mot K3:s tio och K1:s noll på samma urvalsregel. Antalen är
återlästa: 5 → 4, 5 → 3, 5 → 3.

## ☠️ EN-normen skrevs ALDRIG ut

`39c93316`:s källa anger `Zertifizierung: EN16599`. Husregeln är att ingen
EN-norm får skrivas ut utan källa, och `gatelib.NORM` (`\bEN\s?\d{3,5}\b`)
fäller på formen oavsett. Certifieringen är ett verkligt säljargument och den
ENDA i rundan, så den står med — men som *"europeisk certifiering för
kontorsstolar"* utan nummer. Grinden respekteras, inte luckras upp.

## Grindar

| grind | utfall |
|---|---|
| `gate.py` | 0 fynd i 8 filer, första körningen |
| `gate-alt.py` | 8 produkter, 35 alt-texter, 0 fynd |
| `gate-seo.py` | 0 fynd i 8 rader |
| `gate-lager.py` | 0 fynd, lägsta saldo 12 |
| `gate-lankar.py` | 0 fynd — men **0 mål hämtade** |
| `livegrind.py` | se README-raden nedan |

⚠️ **`gate-lankar` kunde inte fälla i den här rundan.** Alla åtta korslänkar går
till rundans egna slugar, som per konstruktion hoppas över (de publiceras i
samma pass). Grinden rapporterar det ärligt — `0 unika mål hämtade` — och
kontrollen ligger därmed helt på `livegrind.py` efteråt. Värt att veta: en
runda vars länkar bara går inåt får ingen förhandskontroll av dem.

Prisgrinden i `/api/admin/mapping`: **8 av 8 gröna**. Samtliga körningar
startade med `ref: claude/seo-polering-runbook-review-uq6fwl` — aldrig `main`
(#181).

## Skrivningarna

Transkriptionshashen som SPÄRR före skrivningen. Åtta av åtta skrevs;
återläsningen bekräftade namn, slug, hash, `visible`, variantens `visible`,
SKU och två SEO-taggar per produkt. 35 av 35 alt-texter skrivna och återlästa.

Kategori: `Hem & Inredning`, **8 av 8** enligt bulk-svarets
`bulkActionMetadata` — trädet har inget möbellöv, samma som K1 och K2.
