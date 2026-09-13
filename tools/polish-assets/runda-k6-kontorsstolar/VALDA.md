# Runda K6 — åtta kontorsstolar 1 639–2 239 kr

Sjätte kontorsstolsrundan. Alla åtta är **utan massagefunktion** med flit:
massagestolarna i samma familj är blockerade av #184 tills Leonard beslutat om
färgsyskonen.

| kort | pris | saldo | slug | SKU |
| :-- | --: | --: | :-- | :-- |
| `501ba88f` | 2 239 | 197 | `chefsstol-morkgra-snoflanell-fotstod` | `FP-chefsstol-morkgra-snoflanell` |
| `f3f45d87` | 1 969 | 70 | `kontorsstol-svart-nackkudde-fotstod-155-grader` | `FP-kontorsstol-svart-nackkudde` |
| `a3128b31` | 1 969 | 30 | `kontorsstol-ljusgra-nackkudde-fotstod-155-grader` | `FP-kontorsstol-ljusgra-nackkudde` |
| `91f0f3f8` | 1 929 | 58 | `kontorsstol-gra-linnetyg-135-kg` | `FP-kontorsstol-gra-linnetyg` |
| `0776fa7c` | 1 829 | 89 | `chefsstol-vit-konstlader-rutmonster-fotstod` | `FP-chefsstol-vit-rutmonster` |
| `1c635cfb` | 1 819 | 31 | `chefsstol-cremevit-konstlader-145-grader` | `FP-chefsstol-cremevit-145-grader` |
| `2b8b7297` | 1 759 | 48 | `kontorsstol-svart-130-cm-80-cm-rygg` | `FP-kontorsstol-svart-130-cm` |
| `62d67357` | 1 639 | 129 | `kontorsstol-cremevit-kupad-rygg-guldfot` | `FP-kontorsstol-cremevit-kupad-rygg` |

## ☠️ Urvalsmätningen var trasig innan den ens började (#191)

Kartläggningen av kvarvarande utkast gjordes först med
`POST /stores/v3/products/search`, filter **och** `cursorPaging.cursor` i samma
kropp. Den returnerar då SAMMA första sida om och om igen:

```
80 anrop  →  100 unika produkter, 7 900 dubbletter
rapporterade "6 000 utkast" där sanningen är 3 250
```

Enda spåret var att varje gruppantal blev en jämn multipel av 60. Offset-
paginering gav samma sak.

☠️ **Kontrasten är hela lärdomen.** `products/query` med exakt samma misstag
svarar **400 INVALID_CURSOR: "Sort or filter can not be specified together with
cursor"**. Samma felaktiga anrop — den ena API:t skriker, den andra ljuger.

> ☠️ **RÄTTAT 2026-09-13 — diagnosen ovan var FEL, och botemedlet fungerade
> aldrig.** Raden sa att rätt form är "filtret bara på första sidan, sedan
> markören ensam". Den formen är också trasig. Den verkliga orsaken är att
> `cursorPaging` måste ligga **INUTI `search`**, inte på toppnivån:
>
> ```
> fel:   { cursorPaging: { limit: 100, cursor } }              → sida 1 igen
> rätt:  { search: { cursorPaging: { limit: 100, cursor } } }  → nästa 100
> ```
>
> Uppmätt åt båda hållen 2026-09-13. `limit: 7` inuti `search` ger **7 rader**;
> samma `limit` på toppnivån ger **100** — alltså defaulten. Toppnivåfältet
> läses aldrig, och API:t säger ingenting: inget fel, ingen varning, bara
> första sidan om och om igen.
>
> Det är alltså INTE en bugg i Wix. Det är samma familj som `sku` under
> `physicalProperties` och `fields` i PATCH-kroppen: **en parameter på fel
> nivå städas bort tyst, och svaret ser felfritt ut.** Skriv aldrig om ett
> sådant utfall till "API:t ignorerar X" utan att först ha läst schemat —
> den slutsatsen låste den här raden i fel spår i en vecka.
>
> ⚠️ Och talet i tabellen ovan är därmed också misstänkt: "6 000 utkast där
> sanningen är 3 250" härleddes ur en trasig paginering. Mätt med rätt form
> 2026-09-13: **5 695 produkter, 3 011 utkast, 2 684 publicerade** över 57
> sidor.
>
> ✅ **Repots egen kod var aldrig drabbad.** Alla sex anropsställen
> (`media-cleanup`, `media-audit`, `text-repair`, `client`, `auction-seed`,
> `health-check`) nästlar redan `cursorPaging` inuti `search`. Kontrollerat
> rad för rad samma dag — det var värt att kontrollera, för
> `media-cleanup`:s referenslista RADERAR PERMANENT det den tror är
> föräldralöst, och hade den bara sett de första hundra produkterna vore
> varenda bild i resten av katalogen föräldralös.

## Dubblettgrinden på bilder, inte på spec-etiketter (#187)

89 publicerade stolar mot 16 kandidatbilder. Lägsta avstånd **11,54** mot
tröskeln 1,0, inget internt par under 6,0.

⚠️ `501ba88f` var en av de 21 måttmätta "tvillingarna" i #187. Bildgrinden ger
**16,47** mot närmaste publicerade — alltså en annan produkt. Det är ett svar
på den öppna punkten, inte bara ett urval.

## ⚠️ `f3f45d87` och `a3128b31` ÄR samma stol i två färger

Identisk tysk källtext, identiska mått (66 × 76 × 112–120, sits 54 × 51 × 12,
nackkudde 34 × 22 × 13, rygg 52 × 12 × 69, fotstöd 35 × 22 × 7, armstöd 21 cm,
120 kg). Det som skiljer är färgen och vikten (21,5 mot 22,3 kg). Båda 1 969 kr.

Bildgrinden skiljer dem (gråskalan skiljer sig med färgen), men de är ett
färgpar och behandlas som ett: **de korslänkar till varandra och säger rakt ut
att det är samma stol.** Det är samma mönster huset redan publicerat — bouclé i
tre färger, snurrstol i två, skrivbordsstol i tre.

## ☠️ `0776fa7c` har ett fotstöd som källtexten aldrig nämner

Den tyska texten listar vippfunktion, 360°, gaslyft och höjdinställning — inget
fotstöd. Bild 1, 2 och 4 visar ett stoppat fotstöd som dras fram under sitsen,
i bild 2 utfällt vid skrivbordet.

Fotot är facit för det som syns (regeln från J1). Samma familj som #189, men åt
motsatt håll: här UNDERdriver källan produkten i stället för att beskriva fel
material.

⚠️ Och en kontroll åt andra hållet: `91f0f3f8` såg i kontaktarket ut att ha ett
fotstöd i bild 2. Vid full upplösning är det sitsens tjocka framkant. Källan
stämmer, och specen säger `Fotstöd: Nej`. **Titta i full storlek innan du skriver
in en funktion som källan inte har.**

## ⚠️ `62d67357` kolliderade nästan i namn med K5:s `e134f532`

Båda är cremevita kontorsstolar med guldfot. De är olika stolar — 61 × 60 mot
57 × 64, 11,2 mot 15 kg, kupat skal mot separata guldarmstöd med fjäderpaket —
och bildgrinden håller isär dem. Lösningen är att namnge det som SKILJER
(`kupad rygg`) och låta sidorna korslänka till varandra i stället för att
konkurrera om samma sökord.

## Två tal i facit kommer ur ritningen, inte ur texten

`f3f45d87` och `a3128b31` anger sitsens mått men ingen sitthöjd i TEXTEN.
Måttritningen (bild 3) säger 47–55 cm. Talen är tillagda i `kallor-tal.json`
och det står i `FACIT-NOT.md` vilka de är och varför. Allt annat är utdraget
mekaniskt ur den levande källtexten med en regex.

## Grindarna före skrivningen

| grind | utfall |
| :-- | :-- |
| `gate.py` | 0 fynd (efter fyra rättade tal, se nedan) |
| `gate-alt.py` | 8 produkter, 39 alt-texter, 0 fynd |
| `gate-seo.py` | 0 fynd |
| `gate-lager.py` | 0 fynd, lägsta saldo 30 |
| `gate-lankar.py` | 0 fynd, 2 externa mål hämtade, 6 interna hoppades över |
| `las` (prisgrind) | 8/8 gröna, körningar 1955–1961 |

☠️ **Siffergrinden fällde fyra tal, och tre av dem var KORSREFERENSER.** Jag
hade skrivit en annan produkts sitthöjd, höjd och bärighet i den här produktens
text — sanna tal, sourcade i den ANDRA produktens facit men inte i den här.
Lagningen är att ta bort talen ur korslänkssatserna: länken namnger produkten,
och dess egen sida bär siffran. Grinden hålls sträng.

Det fjärde talet var ett rent marknadspåstående utan källa — "en stoppad
chefsstol i samma prisklass väger ofta över 20" — och togs bort helt.

## En tysk grafik borta

`501ba88f` bild 4 bar inbränd tysk text (`LEICHTE MOBILITÄT`, `Das Ein- und
Aussteigen ist problemlos`). Borttagen, 5 → 4, `visible: false` bevarad.
Måttritningen (bild 3) bär bara siffror och `120 kg` och behölls.

## Skrivningen

Fyra par, var och en med FNV-1a-grinden **före** skrivningen och en hash på det
Wix läste tillbaka:

```
hashLika  8/8      visible  8/8      variantVisible  8/8
namn      8/8      slug     8/8      seoTaggar       2 på alla åtta
```

39 alt-texter skrivna med `fieldMask: ["media"]`, `image.url` strippad och
`altText` satt både på posten och inuti `image`. Återläsning `altStammer: true`
på alla åtta, och både produktens och variantens `visible` överlevde.

Kategori: `Hem & Inredning`, **8 av 8** enligt bulk-svarets `bulkActionMetadata`.

Mappningsraderna stämplade i åtta `stampla`-körningar (1963–1970), alla med
`ref: claude/seo-polering-runbook-review-uq6fwl` (#181) — **8/8 success**.

## Live-verifieringen: 8/8 REN, orddiff 0

Ett svep, ingen ISR-omhämtning behövdes: alla åtta hämtades med `age: 100–101`,
alltså renderingar som skedde efter skrivningen.

```
501ba88f  ord=648  diff=0  REN     0776fa7c  ord=579  diff=0  REN
f3f45d87  ord=587  diff=0  REN     1c635cfb  ord=582  diff=0  REN
a3128b31  ord=596  diff=0  REN     2b8b7297  ord=580  diff=0  REN
91f0f3f8  ord=544  diff=0  REN     62d67357  ord=613  diff=0  REN
```

`REN` är hela problemlistan tom: sidsvep, alt-svep, SEO-svep mot `seo.tsv`, de
tre flikarna, kategorin i brödsmulan, köpbarheten (#148) och korslänkarna —
inklusive de sex interna som `gate-lankar` per konstruktion inte kunde nå före
skrivningen.
