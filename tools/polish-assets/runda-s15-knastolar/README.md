# Runda S15: Knästolar får en egen kategori (2026-10-03)

Leonards beslut: knästolarna passar inte i Kontorsstolar och ska ha en egen
kategori, och den ska vara 10/10 SEO. Butiksändringen (PR #726 mot
`headless-site`) skulle mergas kl. 03:00 svensk tid 2026-10-04, på hans uppdrag.
Det blev inte av, eftersom sessionen stoppades av användningsgränsen 3 oktober
kl. 17:28 svensk tid och inte kom igång igen förrän 6 oktober. Mergen flyttades till
kl. 03:00 natten mot 7 oktober och tar #704 (srsltid) med sig i samma bygge.

## 1. Wix (gjort 2026-10-03, live direkt)

- **Kategorin** `Knästolar`, slug `knastolar`, id `4653b0d6`, under Möbler.
- **Åtta knästolar kopplade**, inte bara de fyra Leonard länkade, för att
  alla åtta är knästolar: `d2fb42b1`, `3ee7a87a`, `b97ac1d8`, `2876122a`,
  `231202df`, `c3e0af3f`, `9e656e81`, `2326c742`. Bulk-svaret 8 av 8.
- **Borttagna ur Kontorsstolar**, 8 av 8. Återläsning: Knästolar 8 produkter,
  Kontorsstolar 174 → 166 (utkasten räknas med).
- Inte med: den hopfällbara knäpallen `0d09a845`, som är en trädgårdspall.
- **Brödsmulan** är Hem › Möbler › Knästolar så snart produktsidan renderats om.
  `valjBrodsmula` tar den smalaste indexerbara underkategorin, och 8 produkter
  ligger i bandet `bedom` (5–9), som indexeras.

Runbooken väljer kategori genom att läsa trädet och ta det smalaste lövet, så
en knästol som poleras härnäst hamnar i Knästolar utan någon ändring där.

## 2. Texterna

`knastolar-text.json` och `kontorsstolar-text.json`, båda RENT genom
`gate-kategori.py`:

| | titel | beskrivning | intro | frågor |
|---|--:|--:|--:|--:|
| knastolar | 46 | 153 | 216 ord | 4 |
| kontorsstolar | 39 | 130 | 217 ord | 2 |

- **Varje påstående är avstämt** mot alla åtta produktbeskrivningar, och
  `facit` i filen säger vilka produkter som bär det. "Alla bär 120 kg",
  "alla levereras omonterade" och rådet om 15–30 minuters pass står i alla
  åtta.
- **Inga superlativ om sortimentet.** "De tjockaste dynorna" blev "10 cm
  tjocka dynor", så meningen inte blir fel när en ny knästol kommer in.
- **Balansstol** står i beskrivningen och första stycket. Det är stoltypens
  andra namn, efter den norska Balans-stolen (1979).
- **Kontorsstolar släpper knästolarna.** Titeln tappar "& knästol", texten
  säger att knästolar har en egen kategori, och frågan om skillnaden mellan en
  knästol och en kontorsstol flyttar ordagrant till Knästolar. Testet för unika
  huvudsökord har nu `/knästol/i`, så två titlar kan inte dela ordet igen.

`infoga.py` lägger in posterna i butikens filer och `jamfor.mts` jämför dem
mot källan: knastolar och kontorsstolar LIKA, Möbler nämner Knästolar.

## 3. Butiken (PR #726, gren `claude/knastolar-kategori-uq6fwl`)

| fil | ändring |
|---|---|
| `lib/category-seo.ts` | knastolar ny, kontorsstolar utan knästol |
| `lib/category-content.ts` | knastolar ny, kontorsstolar utan knästol, Möbler räknar upp Knästolar |
| `lib/meny-grupper.ts` | knastolar under Kontor & gaming (låg annars under "Mer") |
| `lib/category-groups.ts` | Knästolar bland Möblers underkategorier på /butik, hero `gungande-knastol-gra` |
| `lib/spec-config.ts` | `STOLAR`, samma filter som kontorsstolarna |
| `app/feed/google.xml/route.ts` | `2045` Furniture > Office Furniture > Office Chairs |
| `lib/category-seo.test.ts` | `/knästol/i` i testet för unika huvudsökord |

Googles taxonomi har ingen nod för knästolar (kontrollerad i
`taxonomy-with-ids` sv-SE och en-US 2026-10-03). Kontorsstolarnas nod är den
närmaste. Utan raden hade knästolarna ärvt Möblers `436`.

`npm test` gav 1047 av 1048. Samma test faller på basen `bd5638ed`
(`review-image-metadata`), så det är inte den här ändringen. Med #704 inslagen
(2026-10-06) gav samma svit 1 061 av 1 062, med samma test rött.

## 4. Inte gjort, och varför

- **Den blå knästolen `c3e0af3f` är samma modell som `9e656e81`** (ljusgrå,
  svart, kräm, mörkgrå): samma mått, samma dynor och samma paket, och den blå
  sidan kallar sig själv seriens enda med kulör. Den borde bli ett femte
  färgval. Sammanslagningens plan stoppade på `galleriet_fullt`: sidan har
  redan 15 bilder, Wix tak, och den blå färgen behöver en egen bild. Planen
  varnade också för att sidans text nämner färgerna och för att den blå
  sidans pris följer konkurrentregeln, medan det nya valet skulle följa husets
  regel. Det är Leonards beslut.
- **`b97ac1d8` och `231202df` har samma mått** (55 × 85 × 55 cm, sits 41 × 28,
  knädyna 48 × 24) men är olika stolar på bilderna: den ena har vred för sex
  lägen och en annan ram. De får stå kvar som två sidor.
- **Sökvolymerna är inte mätta.** Semrush-kontot saknade API-enheter
  2026-10-03. Mät *knästol*, *ergonomisk knästol*, *knästol med ryggstöd* och
  *balansstol* i omätningen 2026-10-30.

## 5. Mät efter mergen

1. `/kategori/knastolar`: titel, metabeskrivning, fyra stycken och FAQPage
   med fyra frågor, lika `knastolar-text.json`.
2. `/kategori/kontorsstolar`: ny titel, ingen knästol i FAQ.
3. Startsidans meny: Knästolar under Kontor & gaming.
4. Google-flödet: en knästol bär `2045`.
5. Produktionsbygget finns för merge-commiten (se CLAUDE.md om den uteblivna
   push-händelsen 2026-09-25).
