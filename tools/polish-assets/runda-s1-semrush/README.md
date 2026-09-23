# Runda S1 — Semrush: sökord på plats 4–20, 16 sidor rättade

Första rundan styrd av Semrush-kopplingen (2026-09-23). Underlaget är
`semrush-plats-4-20.csv`: alla sökord där fyndplats.se låg på plats 4–20 i
Semrushs svenska databas — **164 sökord på 113 adresser**, varav 101
produktsidor.

## Utfallet

| | |
|---|--:|
| Produktsidor i underlaget | 101 |
| — hittade i katalogen | 96 |
| — ersättare bakom en redirect | 3 |
| Sidor som hämtades och lästes (`kallsidor.txt`) | 99 |
| **Sidor där `seoData` skrevs om** | **16** |
| — varav produktnamnet också rättades | 1 |
| Beskrivningar lagade efter live-grinden (se nedan) | 9 |
| Filgrind (`gate-seo.py`) | 0 fynd |
| Återläsning mot filens kontrollsumma | **16/16 LIKA** |
| Varianter synliga efter skrivningen | 16/16 |
| **Live: `<title>`, meta och `og:title` exakt lika `seo.tsv`** | **16/16** |

☠️ **De flesta sidorna rördes INTE, med flit.** 78 av 99 bar redan sökordet i
titeln och i H1 — poleringen hade gjort sitt jobb. Plats 11–20 på ett
lågkonkurrensord (KD 5–20) med en redan riktig titel är inte ett titelproblem,
och en titel som skrivs om i onödan kan kosta den placering den har. Rundan
skrev bara där sökordet faktiskt SAKNADES, eller där sidan bröt mot en husregel.

Varje ändring kontrollerades mot sidans egna Semrush-rankningar först
(`resource_organic` per URL), så att inget ord som redan låg högre tappades:

- `stapelbara-pallar` ligger **2:a** på *stapelbara pallar* — inledningen står
  kvar, *stoppad sits* lades till efter.
- Reparationsstället rankar 24:e på **mekställ cykel (880/mån)** — större än
  sökordet i underlaget, så det fick leda titeln.
- Stafflit rankar också på *ritstativ barn* (140/mån) — ordet kom med.
- 20-tumscykeln syns inte alls på *barncykel 20 tum*, men på *mountainbike
  20 tum*, *mtb 20 tum* och *20 tum mtb* — den vinkeln fick leda.

## Fynd som inte var sökordsfrågor

1. ☠️ **21 av 99 rankande sidor är slutsålda** — bland dem de TRE största:
   trumset barn (1 300/mån), barncykel 16 tum (980) och aktivitetstavla/busy
   board (830). Kontrollerat i Wix: saldo 0 och varianterna SYNLIGA, alltså
   verklig slutförsäljning och inte variantfelet från #148. Det är ett
   inköpsbeslut, inte en SEO-åtgärd.
2. ☠️ **En titel som är identisk med namnet stänger av HELA seoData.** Butiken
   (`lib/products.ts` på `headless-site`) använder den sparade
   metabeskrivningen bara när titeln skiljer sig från namnet. Racingstativet
   och svarvstålen hade välskrivna metabeskrivningar som aldrig renderats —
   live stod beskrivningens första mening, och titlarna var 69 och 65 tecken.
   **Katalogsvep samma dag: 78 av 3 319 publicerade produkter har titel = namn**
   (plus 9 utan titel, 23 utan metabeskrivning). Deras sparade
   metabeskrivningar är aldrig visade och därmed aldrig granskade mot senare
   texträttelser — att slå på dem i klump vore att publicera ogranskad text.
   Eget jobb.
3. **Elcrossens metabeskrivning sa *Skickas från EU-lager*** — lagerlandsregeln.
   Borttaget.
4. **Skrivbordet hette *Skrivbord i ek* men skivan är ekfärgad melamin.**
   Namn, titel och metabeskrivning rättade (`namn.tsv`); sluggen står kvar.
5. **Hamsterburen** (46 × 30 cm = 0,138 m²) klarar guldhamsterns 0,12 m² men
   är ingen *stor* bur. Titeln säger redan "Stor hamsterbur" — den förstärktes
   inte. **Fågelburen** 40 × 40 cm (0,16 m² mot kravets 0,31 m²) är redan
   borttagen och ger 404; den får med flit ingen redirect.
6. **Bäst i test-sidorna heter /kopguider/ sedan tidigare** — Semrush visar
   gamla adresser. *massageapparat bäst i test* (880/mån) lämnas: vi testar
   inte, och ordet ska inte tillbaka.

## Live-grinden fällde nio sidor — på text rundan inte rört

SEO-svepet var rent (16/16, och en egen jämförelse av `<title>`, meta och
`og:title` gav samma svar; ett planterat fel fälldes). Men den breda grinden
ställer alla runbook-krav, och nio av de sexton sidorna föll på
BESKRIVNINGEN — äldre brister som ingen SEO-mätning hade letat efter:

| fynd | sidor |
|---|--:|
| Fliken `Användning och skötsel` saknas (obligatorisk sedan 2026-08-30) | 8 |
| *"Tillverkaren anger …"* — mot kunden är VI leverantören | 1 (4 ställen) |

Lagat samma kväll, med husets metod från `reparation-flikar` (`skotsel/`):

- Skötseltexten skriven **per vara**, ur produktens egen spec — bara det sidan
  redan säger. Dammsugarens filter kallas aldrig tvättbart, för sidan säger
  inte att det är det; dieselavskiljarens filterinsats nämns inte, för sidan
  beskriver ingen.
- `gate-fragment.py` 0 fynd, `gate-superlativ.py` ren.
- **Sammanfogningen skedde server-side**: den gamla texten lästes och fick
  fragmentet inskjutet FÖRE `<h2>Vanliga frågor</h2>` inne i anropet, och
  passerade aldrig chatten. Förhandsvillkor per produkt: FAQ-rubriken exakt en
  gång, ingen skötselflik sedan tidigare, spec-fliken före FAQ.
- Vinkylens fyra ställen byttes som exakta strängar, var och en krävd exakt en
  gång: *Skåpet går på 37 dB*, *Förbrukningen är 75 kWh per år enligt
  energimärkningen(s provförhållanden)*.
- Återläsning i eget anrop: **9/9 LIKA** mot den skickade textens
  kontrollsumma, flikarna i ordningen spec → skötsel → FAQ, varianterna
  synliga. `skotsel/skrivlogg.txt` bär längd och kontrollsumma före och efter.

## Redirects: en rad skriven, men den BITER INTE förrän butiken ändras

`/produkt/sladdlos-handdammsugare-bil` rankade för *handdammsugare bil*
(390/mån) och pekade mot `/alla-produkter` — en soft 404. Det finns en
direkt efterträdare, `sladdlos-handdammsugare-30000pa-borstlos-bil`.

Redirect-workflowen skrev raden (`written: ["sladdlos-handdammsugare-bil"]`,
grönt jobb) — och live svarade fortfarande `/alla-produkter`. ☠️ Sluggen
ligger i butikens `data/retired-china-slugs.json`, och de redirects som byggs
därifrån i `next.config.ts` går FÖRE `FyndplatsRedirects`, som bara läses på
404-vägen. Ett grönt jobb är inget kvitto.

`butik-redirects.patch` (mot `next.config.ts` på `headless-site`) lägger tre
rader i `RETIRED_REDIRECT_OVERRIDES`:

| gammal slug | nu | föreslaget |
|---|---|---|
| `sladdlos-handdammsugare-bil` | `/alla-produkter` | efterträdaren |
| `uppvarmd-ogonmask` | `/alla-produkter` | `/kategori/kropp-valbefinnande` |
| `robust-paraply-med-uv-skydd` | `/kategori/tradgard-utemobler` | `/kategori/solskydd-paviljonger` |

Båda kategorierna svarar 200. Butiken saknar paraply och ögonmask, så de två
sista är närmaste hylla. Patchen bygger en butiksdeploy — den ska samåka med
nästa butiksändring, inte gå ensam.

## Filerna

| fil | vad |
|---|---|
| `semrush-plats-4-20.csv` | Semrush-exporten, ordagrant |
| `sidor.tsv` | sökorden grupperade per produktsida |
| `ids.txt` · `kallsidor.txt` | wix-id och slug för de 99 lästa sidorna |
| `nulage.json` | titel, meta, H1, lagerstatus och ingress före rundan |
| `fore-seodata.json` | **återställningen** — exakt `seoData` och namn före skrivningen |
| `seo.tsv` · `namn.tsv` | det som skrevs (källan för grindarna) |
| `skrivplan.json` | skrivplanen med kontrollsumma per rad |
| `slugs.txt` | de 16 skrivna sidorna (för `hamta-live.sh`/`livegrind.py`) |
| `butik-redirects.patch` | butiksändringen ovan |
| `skotsel/` | skötselfragmenten, facit (`kallor.json`), vinkylens byten och skrivloggen |

Semrush-kostnad för rundan: ~2 200 API-enheter.

⚠️ **Rundans första push byggde** (`dpl_855UqFc6…`, `READY` på ~50 s) trots
att den bara rörde `tools/`. Det är läkningsbygget CLAUDE.md beskriver: grenen
återskapades efter förra mergen, pekaren till förra byggda SHA:n låg utanför
den grunda klonen, och `git cat-file` ger då `exit 1` med flit. Butiksprojektet
hoppades över som det ska.
