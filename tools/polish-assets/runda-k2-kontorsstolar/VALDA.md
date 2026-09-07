# Runda K2 — åtta kontorsstolar 1 039–2 099 kr

Fortsättning på K1 i samma familj. `Bürostuhl` hade **91 utkast**; efter K1 och
K2 återstår **75**. Katalogen har 61 publicerade kontorsstolar sedan tidigare,
plus K1:s åtta, så urvalet är gjort mot båda.

| id | pris | vad som skiljer den från de andra sju |
|---|---:|---|
| `db13253d` | 2 099 | Nättyg, **tre LÅSTA ryggpositioner** till 135°, justerbart svankstöd, fotstöd |
| `3cdf4bf3` | 2 099 | **Fickfjädrar** i sitsen, reptåligt konstläder, 155°, 156 cm nedfälld |
| `09167ea9` | 1 899 | **Högsta sitsen** (55–63 cm), 135 kg, steglöst 155°, 120 cm nedfälld |
| `f530ef48` | 1 799 | **Djupast** (78 cm), 57 cm bred sits, ren arbetsstol utan liggläge |
| `8017140b` | 1 619 | Rosa och vit hela vägen, utdragbart fotstöd, 135° |
| `dd90cdd8` | 1 559 | **173 cm utfälld**, 160°, avtagbar nack- OCH ryggkudde, lägsta sitsen (41 cm) |
| `1bc3adc4` | 1 399 | Linnelook, 69 cm rygg, **inga extrafunktioner** — den enkla i klassen |
| `da5668cb` | 1 039 | Retrodesign, rutsömmad, krom, **46–61 cm** och bara 9,7 kg |

## Massagestolarna valdes BORT med flit

Av de 83 kvarvarande utkasten är omkring tjugo `mit Massagefunktion`, och de
ligger dessutom i täta syskonkluster: `67 × 74 × 107–116 cm` är **fyra** olika
utkast i olika gråtoner. Att blanda in en av dem här hade gett en runda där
hälften av sidorna beskriver samma stol. De hör hemma i en egen runda där de
kan jämföras mot varandra — och mot de två massagestolar vi redan publicerat.

## ☠️ Kontaktarket fällde tre bilder och en färg

**Tre bilder med TYSK TEXT INBRÄND i pixlarna** ligger kvar bland de fem
importen behöll (`RENA_BILDPOSITIONER` fångar mönstret, inte varje fall):

| bild | vad som står i den |
|---|---|
| `db13253d` 4 | EINSTELLBARE LENDENWIRBELSTÜTZE UND RÜCKENHÖHE · Dreistufiges Heben |
| `db13253d` 5 | VERSTELLBARE KOPFSTÜTZE · Auf/Ab · Drehbar · Abnehmbar |
| `3cdf4bf3` 4 | SICHER FÜR ALLE BODENARTEN · Geeigneter Untergrund: Holzboden … |

De är borttagna ur Wix (`bilder-bort.tsv`), och antalet är återläst: 5 → 3
respektive 5 → 4.

☠️ **Och en färg som källtexten har fel om.** `da5668cb`:s tyska brödtext säger
*"Der schöne, **weiße** Kunstlederbezug"* — men `Farbe` säger `Schwarz` och
fotot visar en svart stol. Texten är uppenbart återanvänd från det vita
syskonet. Hade texten skrivits ur källan ensam hade sidan sagt fel färg på det
kunden ser först. Kontaktarket före brödtexten, en gång till.

## ☠️ Två korslänkar var påhittade — och 404

Första utkastet av `db13253d` länkade till `ergonomisk-kontorsstol-nackstod-natrygg`
och `kontorsstol-i-nat-med-fotstod`. Båda gav **404**. De riktiga heter
`ergonomisk-kontorsstol-nackstod` och `kontorsstol-nat-fotstod-135-grader`.

En slug är en ADRESS och går inte att härleda ur produktnamnet. `gate.py`
kontrollerar bara FORMEN (absolut mot www.fyndplats.se). Därför finns nu
**`gate-lankar.py`**, som hämtar varje länkat mål före skrivningen och fäller på
allt som inte svarar 200. Rundans egna slugar hoppas över — de publiceras ju
i samma pass — och kontrolleras av `livegrind.py` efteråt.

## Grindar

| grind | utfall |
|---|---|
| `gate.py` | 0 fynd i 8 filer |
| `gate-alt.py` | 37 alt-texter (40 minus 3 borttagna), 0 fynd |
| `gate-seo.py` | 0 fynd i 8 rader |
| `gate-lager.py` | 0 fynd, lägsta saldo 48 |
| `gate-lankar.py` | 0 fynd, 2 unika mål hämtade |
| `livegrind.py` | se README-raden nedan |

Prisgrinden i `/api/admin/mapping`: **8 av 8 gröna** (workflowen avslutar med
`exit 1` på `stammer: false` och på `EJ AVGORBAR`, så en grön körning ÄR
verdikten).

## Skrivningarna

Samma form som K1: transkriptionshashen är en SPÄRR före skrivningen, inte en
kontroll efter. Åtta av åtta skrevs, och återläsningen bekräftade namn, slug,
hash, `visible`, variantens `visible`, SKU och två SEO-taggar per produkt.

Kategori: `Hem & Inredning`, 8 av 8 enligt bulk-svarets `bulkActionMetadata`.
