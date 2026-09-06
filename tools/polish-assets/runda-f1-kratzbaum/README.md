# Runda F1 — klösträd (`^Kratzbaum`)

✅ **ÅTTA PUBLICERADE, STÄMPLADE OCH LIVE-VERIFIERADE.** Tre kluster hållna
ihop: tre takhöga, tre i fem plan, två klöstunnor. Priserna orörda.

## Varför just den här familjen

Fåtöljbanan är slut för min del: `FORDELNING.md` (den andra sessionens gren)
ger **"Fåtöljresten" till runda 62–73-sessionen**, status *"pågår (runda 74)"*.
Det stod där sedan `072f212` kl 10:20 den 2026-09-06 — och att jag inte läste om
filen innan runda E3 är vad som orsakade kollisionen samma dag (#144).

`^Kratzbaum` nämns inte någonstans i fördelningen, ligger utanför hela
`Sessel`-rymden och har varken elsäkerhets- eller hälsopåståendegrind. Den är
dessutom den största rena familjen i utkastfloran efter `^Bürostuhl`.

☠️ **Jag kan inte skriva in mitt anspråk i `FORDELNING.md`** — filen ligger bara
på den andra sessionens gren. Det är precis problemet #144 beskriver. Anspråket
står därför här, och filen bör flyttas till `main` så båda arbetsträden ser den.

## Katalogmätningen (2026-09-06)

Läst i ETT svep: **5 502 produkter, `unika == lästa`, `avhuggen: false`** —
3 485 utkast, 2 017 publicerade.

⚠️ **Fördelningens histogram undermäter grovt** (bekräftar #134):

| familj | fördelningen sa | uppmätt |
|---|--:|--:|
| `^Bürostuhl` | 13 | **100** |
| `^Schaukelstuhl` | 13 | **35** |

Största utkastfamiljerna utanför fåtöljerna: `Bürostuhl` 100, `2er-Set` 66,
**`Kratzbaum` 40**, `Sitzbank` 40, `Gewächshaus` 36, `Schaukelstuhl` 35.

## Läget: 40 utkast mot 28 redan publicerade klösträd

Batch 34 polerade sju klösträd; totalt ligger **28 publicerade** sidor ute,
519–2 099 kr. Dubblettgrinden i Steg 1 ska mäta mot dem, inte mot namnen.

## ☠️ Fyra kluster: tio utkast är fem produkter

Grupperat på **vikt + paketmått**, inte på namn. Husets egen regel: två olika
möbler kan råka dela ett yttermått, men inte vikten på hektogrammet OCH
kartongens tre sidor.

| fingeravtryck | antal | id | prisspann |
|---|--:|---|--:|
| 8,8 kg / 58 × 29 × 28 cm | **3** | `75391d11` 899 · `8db487c1` 839 · `6f0b43f0` 799 | **100 kr** |
| 8,6 kg / 43,5 × 36 × 28 cm | **3** | `62f7cf98` 899 · `75293096` 849 · `8ab169e8` 839 | **60 kr** |
| 11 kg / 64 × 41 × 36 cm | 2 | `c802ac19` 1099 · `cc31a73b` 1079 | 20 kr |
| 7 kg / 48 × 23 × 52 cm | 2 | `f489937f` 859 · `5616c567` 819 | 40 kr |

**10 av 40 ligger i ett kluster; 30 är unika på fingeravtrycket.**

Namnen döljer det: de tre i första klustret heter alla *"Kratzbaum Deckenhoch
höhenverstellbar, stabiler Katzenbaum mit"* — men det gör även `75293096` och
`8ab169e8`, som ligger i ETT ANNAT kluster. **Namnet grupperar fel åt båda
hållen.** Samma fynd som runda 70 och 72, och som E3:s manchesterfåtöljer.

⚠️ Om klustren är färgsyskon (troligast, samma mönster som E3) ska de poleras i
samma runda och slugga in i en gemensam familj — annars blir "finns i fler
färger" ofullständig på varje sida som publiceras först. Det är INTE bevisat
ännu: färg är omätt, och feedens färgetikett är enligt E3 fel i 4 fall av 10.
**Mät på pixlar innan rundan låses.**

## ☠️ Dubblettmätningen gick INTE att köra — och det är fyndet

Resultatet blev `kollisioner: []`. **Det betyder inte "inga dubbletter".** Det
betyder att jämförelsen inte kunde göras:

| | |
|---|--:|
| Utkast med läsbart trippelmått | **5 av 40** |
| Publicerade med läsbart trippelmått | **4 av 28** |

Skälet är att **varje poleringsrunda har hittat på sin egen spec-etikett**.
Alla 40 utkast bär `Mått` — importens fem svenska etiketter är fasta. De 28
publicerade bär sex olika ord för samma sak, vart och ett på exakt EN sida:

```
Yttermått · Totalmått · Totala mått · Mått totalt · Basmått · Basens mått
```

Och `Vikt` finns på 7 av 28, `Paketmått` på **1 av 28** — trots att båda är
importens egna etiketter och står på alla utkast. Poleringen har alltså
konsekvent kastat bort det bästa dubblett-fingeravtrycket huset har.

☠️ **Följden: dubblettdetektering mellan rundor är mekaniskt omöjlig.**
Runbookens egen regel säger att vikt plus kartongens tre sidor är det som
skiljer två möbler åt — men den uppgiften finns inte på sidorna. Varje
framtida dubblettkoll måste läsas för hand, precis som den här.

Det är samma klass som `SHIP_AXIS_RE` och `EU_TULL_CODES`: **en uppgift utan
en enda definition glider isär.** Här har den glidit isär i sex riktningar.

⚠️ Mina egna rundor (D, E) skriver konsekvent `Mått (B × D × H)`, `Vikt` och
`Paketmått`. Klösträden är äldre rundor. Se #146.

## Utfallet

| | |
|---|--:|
| Publicerade | **8** |
| Filgrindens fynd | **0** (7/7 mutationer fångade) |
| Checksummor som stämde | **8 / 8** |
| Alt-texter skrivna | **37** |
| Tyska jämförelsegrafiker bortplockade | 3 produkter |
| Unika SKU:er | **8 / 8** |
| Prisändringar | **0** |
| Stämplingar bekräftade i loggen | **8 / 8** |
| SEO-titel + metabeskrivning omskrivna | **8 / 8** |

| kluster | id | pris | SKU |
|---|---|--:|---|
| A takhögt 228–260 | `75391d11` beige | 899 | `FP-klostrad-takhogt-228-beige` |
| | `8db487c1` grå | 839 | `FP-klostrad-takhogt-228-gra` |
| | `6f0b43f0` ljusbrun | 799 | `FP-klostrad-takhogt-228-ljusbrun` |
| B fem plan 230–260 | `62f7cf98` beige | 899 | `FP-klostrad-fem-plan-beige` |
| | `75293096` grå | 849 | `FP-klostrad-fem-plan-gra` |
| | `8ab169e8` mörkbrun | 839 | `FP-klostrad-fem-plan-morkbrun` |
| C klöstunna 100 | `c802ac19` cremevit | 1099 | `FP-klostunna-100-cremevit` |
| | `cc31a73b` grå | 1079 | `FP-klostunna-100-gra` |

☠️ **Materialpåståendet i kluster A var fel, och bara bilderna visade det.**
Min första text sa att stolpen är plyschklädd — det är vad den tyska
materiallistan räknar upp. En zoomad beskärning av bild 4–5 visar tätlindat
naturfiberrep, alltså **sisal**, på en sektion av stolpen. Listan nämner det
inte. Alla tre A-texterna säger nu *"en sektion av stolpen är lindad med sisal
att klösa på"*, en `Klösyta`-rad är tillagd i specen, och fotobevisningen står
i `kallor.json`. **En specifikationslista är inte en produktbeskrivning** —
den räknar upp vad som finns, inte vad kunden ser.

⚠️ **"Tillverkaren rekommenderar" ströks ur C-texten.** Samma klass som
"leverantören anger": mot kunden är **vi** leverantören. Står nu som
*"Klöstunnan är gjord för katter under 5 kg."*

## ☠️ Poleringen har ALDRIG rört SEO-titeln — åtta tyska sidor, och 49 i katalogen

Live-grinden fällde de tre A-sidorna på `SIDA/ARTIKELNUMMER 228-260`. Det såg ut
som ett falskt larm — `228–260 cm` är ju en takhöjd. Det var det inte. Träffen
låg i sidans **`<title>`**, och titeln var tysk:

```
<title>Kratzbaum Deckenhoch, 228-260 cm Höhenverstellbarer Katzenbaum</title>
<meta name="description" content="Verwandeln Sie Ihr Zuhause in ein Paradies…">
```

Brödtexten var invändningsfri svenska — orddiffen mot källfilen var **0 på alla
åtta**. Men `<title>` och metabeskrivningen är det Google VISAR i sökresultatet,
och de var tyska på alla åtta. Uppmätt i Wix: `seoData.tags` bar tysk `title`,
`og:title`, `description` och `og:description`, plus ett tyskt huvudnyckelord
med `origin: "USER"`.

**Orsaken är att poleringen inte har något SEO-steg.** Den skriver `name` och
beskrivningen; `seoData` sattes vid importen från den tyska feeden och har
aldrig skrivits över. Runbooken nämner det inte, och ingen rundas README gör det.

### Två blinda fläckar som gjorde det osynligt

1. ☠️ **Metabeskrivningen ligger i ett ATTRIBUT.** Sidsvepet kör `brodtext`,
   som strippar taggar — attributinnehåll är därför osynligt för det. Exakt
   samma blinda fläck som alt-texterna hade efter batch 66.
2. ☠️ **`<title>` fastnade bara av en slump.** Texten syns i sidsvepet, men det
   som fällde var artikelnummer-mönstret som råkade träffa `228-260`. Runda D1:s
   *"Schlafsessel, Gästebett, verstellbare Rückenlehne"* hade gått rakt igenom:
   inga siffror, och inget av orden fanns i den tyska ordlistan.

### Åtgärdat

- `gate-seo.py` — filgrind för titel och metabeskrivning, med siffergrind mot
  produktens egen källtext, längdtak (60/160) och krav på `| Fyndplats`-suffix.
  **8 av 8 mutationer fälls**, var och en av rätt regel.
- `livegrind.py` fick ett **SEO-svep**: läser `<title>`, `description`,
  `og:title` och `og:description` och jämför dem EXAKT mot `seo.tsv` när filen
  finns. En mekanisk jämförelse bryr sig inte om vilket språk felet är på.
- De åtta sidornas `seoData` omskriven till svenska, tyska nyckelord rensade,
  `visible` oförändrad, varje rad återläst efter skrivningen.

☠️ **Formen är TVÅ taggar, inte fem.** Runda A och C2 har den formen, och
butiken härleder `og:title`, `og:description` och `twitter:title` ur den —
uppmätt på båda. Importens fem taggar bar tyska og-värden som måste bort, inte
skrivas om.

### ⚠️ 49 publicerade sidor till bär tysk SEO-titel

Mätt över hela katalogen (2 032 publicerade, 21 sidor, inte avhuggen):

| | |
|---|--:|
| Publicerade | 2 032 |
| **Tysk SEO-titel** | **49** |
| Svensk titel med `\| Fyndplats` | 1 443 |
| Svensk titel utan suffix (autohärledd) | 540 |

De 49 ligger i mina egna rundor D1–E3 — bäddfåtöljer, Polstersessel,
Relaxsessel. **Talet är ett GOLV, inte ett tak:** klassificeraren kräver ett
tyskt funktionsord eller ett listat substantiv, så en tysk titel utan sådana
räknas inte. Se #147.

## ☠️ `0908bbf0` publicerades INTE — intern dubblett

Tre delade måtttripplar mot den redan publicerade `klostrad-morkgra-173-cm`.
Båda sidorna är **Aosom** (`aosom:D30-050V00CG`), så det här är inte ett
ommappningsfall utan ett pensioneringsfall: den behållna sidan pekar redan
rätt, och dubbletten ska få `draftStatus: "rejected"`.

## Kvar

- `0908bbf0` ska pensioneras (`draftStatus: "rejected"`, `needsAiPolish: false`).
- Klösträdsfamiljen har **32 utkast kvar** av 40.
- Spec-ordlistan (#146) är fortfarande osammanhängande på de 28 äldre sidorna;
  den här rundans åtta bär `Mått (B × D × H)`, `Vikt` och `Paketmått`.

## Egna Fyndplats-kort (Steg 9) — och vad kontaktarket fällde

Åtta spec-kort, ett per produkt, byggda av `bygg-kort.py` ur produktens EGEN
huvudbild (`live/<id>.html` → `og:image`) och familjens verifierade mått.

☠️ **Kontaktarket fällde de tre första rubrikerna, och det var rätt.**
Rubriken löd *"Fyra plan, 43 × 27 cm golvyta"* — men fotot visar **tre**
plattformar över golvplattan. Runbookens regel är att rubriken ska bäras av
FOTOT under den, och en rubrik som bjuder in till att räkna måste tåla att
räknas.

Talet är ändå inte fel: leverantören räknar golvplattan som ett plan. Det
går att BEVISA ur familj B:s egen spec, som räknar upp planen ett och ett och
låter *"Plan 1 (nederst)"* mäta 40 × 34 cm — exakt hela möbelns golvyta.
Golvplattan ÄR plan 1 hos dem.

Så rubriken byttes i stället för siffran:

| | före | efter |
|---|---|---|
| Familj A | Fyra plan, 43 × 27 cm golvyta | **Golv till tak på 43 × 27 cm golvyta** |
| Familj B | Fem plan, sisalstam och tippskydd | **Fem plan mellan golv och tak** |
| spec-raden | `Plattformar 4 st` | **`Plan, inkl. golvplattan 4 st`** |

Fotot bär båda de nya rubrikerna utan att någon behöver räkna rätt på
leverantörens vis. Familj C (`Två grottor och en bädd överst`) klarade sig —
två grottöppningar och en rund bädd syns direkt i bilden.

⚠️ **Och samma överkomplettering står i den PUBLICERADE texten på familj A:**
*"Fyra plattformar sitter fördelade längs stolpen."* Golvplattan sitter inte
längs stolpen, den ligger på golvet. Meningen ska rättas — det är den enda
formuleringen i rundan som påstår mer än bilden visar.

### Uppladdningen och galleriordningen

Korten är uppe: åtta filer i Media Manager, ett per produkt, inlagda på
**plats 3** enligt Steg 9. Måttritningen låg på plats 3 i alla åtta och är
flyttad **sist**, dit den hör.

`8/8 totalSuccesses, 0 totalFailures` — och hela `itemsInfo.items` skickades
tillbaka med varje alt-text, eftersom arrayen ersätts i sin helhet.

Vägen in är husets dokumenterade: en isolerad `git worktree` med en
orphan-gren `claude/f1-kortbilder`, pushad, och sedan
`UploadImageToWixSite` med `imageUrls` mot `raw.githubusercontent.com` —
alla åtta i ETT anrop. Base64 var inte möjligt: korten är 1,4–2,4 MB styck.

⚠️ **`imageUrls`, inte `image`.** Verktygets `image`-array kräver både
`download_url` OCH `file_id`; en rå GitHub-URL har inget `file_id`.
`imageUrls` finns just för adresser utan bifogning.

Passade på i samma skrivning: familj A:s huvudbild hade alt-texten *"med
fyra plattformar"* på en bild som visar tre. Rättad till *"med tre
plattformar på stolpen"* på alla tre.

### Live-verifierat — och ISR-fällan slog till en tredje gång

Grinden: **8/8 REN**, orddiff 0 mot källfilerna. Korten: **8/8** ligger på
plats 3 i den renderade sidan med rätt `Faktakort:`-alt.

⚠️ Men svepet sa först 7 av 8. Den åttonde (`75391d11`) fick `HTTP 000`,
gjorde ett omförsök — och omförsöket serverade en rendering med **`age: 495`**,
alltså åtta minuter gammal och äldre än mediaskrivningen. Samma filstorlek
som föregående cykel, 151 198 byte, ned till byten.

En omläsning av den sidan ensam gav `age: 29`, 155 532 byte och kortet på
plats. Ingenting var fel med skrivningen.

☠️ **Tredje gången samma sak i den här rundan, och rundan hade redan skrivit
ned regeln:** *en sida i taget är facit, ett svep är ett stickprov med
tidsberoende.* Läs `age` innan du kallar en sida trasig. Det som gjorde det
extra lömskt här är att felet kom via ett OMFÖRSÖK — `HTTP 000` gav en tom
fil, och återförsöket hann inte in i samma renderingsfönster som de sju
andra.
