# Menyns underkategorier: länkarna Google inte såg (2026-09-24)

Semrush visar samma mönster över hela domänen. Av 187 sökord med mer än 200
sökningar i månaden ligger 97 på plats 11–30, och bara 4 på första sidan.
Sidorna är relevanta men för svaga. Den här katalogen mäter en orsak som går
att laga i koden: **sajten länkade nästan inte till sina underkategorier.**

## Vad som var fel

Mega-menyn (`components/meganav.tsx` i butiken) renderade bara panelen man
hovrar över, och Googlebot hovrar aldrig. Mätt i produktion 2026-09-24, både i
server-HTML (curl) och renderat i Chromium utan interaktion (`rendera.cjs`):

| sida | länkar till underkategorier (av 105) |
|---|--:|
| startsidan | **0** |
| en produktsida | 1 (bläddringsraden) |
| /butik | 48 |
| en avdelningssida (Möbler) | 0 i server-HTML, 25 renderad (Förfina-chipsen ligger bakom en Suspense-gräns) |

Mobilmenyn och kategori-dropdownen på kategorisidan har samma egenskap:
mobilmenyn renderas först efter mount, och dropdownens underkategorier först
vid klick. De är bekvämligheter för kunden och lämnas som de är. Det räcker
att desktopmenyn ligger i HTML:en, eftersom den finns i samma HTML på mobilen
(dold med CSS), och Google indexerar mobilversionen.

Det är startsidan som räknas mest. Semrush `backlinks_pages` ger 62
refererande domäner till `https://fyndplats.se/` och 23 till
`http://fyndplats.se/`, och **ingen annan sida på domänen har en enda extern
länk**. Allt värde utifrån landar alltså på startsidan, och därifrån gick inte
en enda länk till en underkategori.

Domänens auktoritet (Semrush Authority Score) är 8, med 224 refererande
domäner. Som jämförelse har dealproffsen.se 14 och 456, och costway.se har 25
och 221. När det mesta av värdet utifrån kommer in på en enda sida avgör de
interna länkarna vilka sidor som kan ranka.

## PageRank-modellen

`pagerank.py` bygger sajtens interna länkgraf ur kategorisidorna
(`hamta-kategorier.py` → `kategorier.json`) och de uppmätta mönstren: menyn
och sidfoten på varje sida, startsidans avdelnings- och produktlänkar, varje
kategorisidas produktlista (rutnät och A–Ö-index), /butiks underkategorier
(`butik-underkat.txt`) och produktsidans brödsmula, bläddringsrad, avdelningschips
och sex liknande produkter. PageRank räknas med dämpning 0,85 i två varianter:
jämn teleport, och 85 % av teleporten till startsidan (där de externa länkarna
landar).

| läge | underkategori, median, gånger en medianprodukt | mot i dag |
|---|--:|--:|
| A — produktion i dag | 0,9 / 0,8 | 1 |
| A+ — med Förfina-chipsen efter JS | 1,5 / 1,8 | 1,29 / 1,92 |
| B — #647:s brödsmula | 1,5 / 1,5 | 1,40 / 1,84 |
| **C — B + menyns paneler i HTML** | **47 / 84** | **45 / 86** |

Talen står som jämn teleport / teleport till startsidan. Bläddringsraden
modelleras som butiken bygger den: produktens första underkategori i
menyordningen (`menyordning.txt`, läst ur menypanelerna).

Per sökordskategori, med teleport till startsidan:

| kategori | i dag, gånger en medianprodukt | med menyn i HTML |
|---|--:|--:|
| TV-bänkar | 0,80 | 83 |
| Byråer | 0,15 | 83 |
| Golvlampor | 0,11 | 83 |
| Hantlar & hantelset | 0,11 | 83 |
| Massagebänkar | 0,11 | 83 |
| Snurrfåtöljer | 0,11 | 83 |

Hantlar & hantelset, sidan som ska ta *hantlar* (12 100 sökningar i månaden),
hade alltså en tiondel av en vanlig produktsidas interna värde. TV-bänkar
ligger högre eftersom den är först i menyordningen för sina produkter, så att
bläddringsraden länkar dit.

⚠️ **En första version av modellen** räknade bläddringsraden i alfabetisk
ordning och gav 43–80 gånger. Det talet står i butikens `CLAUDE.md` och i
commit-meddelandet för `57582434`. Storleksordningen är densamma.

**Kostnaden:** en medianprodukt behåller 77–82 % av sitt interna värde, och
produkternas andel av det totala går från 28 % till 19 % (teleport till
startsidan) eller från 39 % till 31 % (jämn teleport). Det är avvägningen
e-handel brukar göra: kategorisidorna ska ta huvudorden med tiotusentals
sökningar, och produktsidorna långsvansen.

**Förkastat, läge D:** att korta avdelningssidornas A–Ö-index till de
produkter som inte ligger i någon underkategori. Det gav underkategorierna
7 % till, men en medianprodukt sjönk till 0,66 respektive 0,48 gånger dagens
värde. Det är inte med.

Modellen är grov. Google väger menylänkar lägre än länkar i brödtexten, medan
modellen räknar varje länk lika. Storleksordningen är ändå entydig:
underkategorierna går från under en produktsidas interna värde till ungefär en
fjärdedel av en avdelningssidas (84 mot 325 gånger en medianprodukt).

## Lagningen

Butiks-PR #647 (`2513ae85`, `57582434`): alla tio paneler renderas, dolda med
`hidden` tills man hovrar. Byte mellan två öppna paneler animeras inte,
precis som förut. Fyra källtester i `lib/meganav-ssr.test.ts`.

Verifierat i förhandsbygget `dpl_DviRgU1qZU8Yu8sQeMUWKTpbWiU8` (`57582434`),
mot bygget före menyändringen (`ae95508e`), med `menykoll.py`:

| sida | kategorilänkar | underkategorier | paneler, varav dolda | gzip kB |
|---|--:|--:|--:|--:|
| / | 14 → 143 | 0 → 109 | 10, 10 | 32,8 → 35,4 |
| /kategori/mobler | → 148 | → 109 | 10, 10 | → 166,2 |
| /kategori/tv-bankar | 20 → 149 | 0 → 109 | 10, 10 | 31,0 → 34,0 |
| /produkt/agilityset-hund-3-delar | 22 → 151 | 1 → 109 | 10, 10 | 28,6 → 31,8 |
| /butik | 132 → 261 | 95 → 109 | 10, 10 | 48,7 → 51,6 |
| /blogg | 10 → 139 | 0 → 109 | 10, 10 | 33,7 → 36,3 |
| /vanliga-fragor | 10 → 139 | 0 → 109 | 10, 10 | 20,9 → 24,5 |

Möbler-sidan svarade inte på det gamla bygget inom 90 sekunder, därför saknas
före-talen på den raden. Rå HTML växer med 21 kB per sida.

Menyn har 109 underkategorier och sitemapen 105. Alla 105 indexerbara finns i
menyn. De fyra extra har 1–4 produkter och är noindex (Pälsvård & Skötsel,
Mobiltillbehör, Keps, Väskor & Necessärer). Menyn visade dem redan för den som
hovrade.

I Chromium (`hovertest.cjs`), på startsidan och en produktsida:

- tio paneler och 109 underkategorilänkar i DOM, ingen synlig vid laddning
- hovring över Möbler visar bara Möbler, med 25 underkategorier, samma som i
  produktion, och skärmbilden är identisk med produktionens
- byte till Hem visar bara Hem, med klassen `byte` och utan animering
- musen bort stänger, och nästa öppning animeras igen
- på mobilen är menyn dold, som förut
- inga konsolfel utom en enstaka 502 från sessionens proxy, som också syns mot
  produktion och går över vid omkörning

`previewkoll_curl.py` mot samma bygge: 63 av 63 kategorisidor för S6–S13 lika
källan, kontrollsidorna svarar 200, och sitemapen har 115 kategori-URL:er.

## Mät efter mergen

1. `menykoll.py https://www.fyndplats.se <förra produktionsdeployens adress>`: startsidan
   ska ha 10 paneler och drygt hundra underkategorilänkar.
2. `hovertest.cjs https://www.fyndplats.se prod-efter`: hovring, byte, stängning
   och konsolfel, med skärmbilder.
3. Semrush-omätningen 2026-10-30 (`../sokord-kategorier/README.md`). Menyn,
   brödsmulan och texterna går live i samma deploy, så mätningen kan inte
   skilja dem åt.

`rendera.cjs` och `hovertest.cjs` kör Chromium genom sessionens proxy. Chromium
har ingen flagga för en CA-fil, så skripten litar på proxyns CA via dess
publika nyckel (`--ignore-certificate-errors-spki-list`, räknad ur
`/root/.ccr/agent-proxy-ca.crt`). Ingenting annat släpps igenom.
