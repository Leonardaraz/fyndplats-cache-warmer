@AGENTS.md

# Så här jobbar vi: bunta ihop deploys

**Högst en deploy till produktion per dag** (Leonards beslut 2026-09-30; förut
"en eller två"). Samla dagens ändringar på grenen och merga när de hänger
ihop — merga inte varje fix för sig så fort den är grön. **Pusha också sällan:**
varje push bygger en testversion, i båda Vercel-projekten. `[skip ci]` fungerar
inte här.

## Mätt 2026-09-30: vad som kostade, och vad som ändrades

Fakturan låg 2,4 dygn in i cykeln i en takt nästan tre gånger förra periodens.
Fyra rader stod för det mesta:

| Rad | Mängd | Orsak (mätt) |
| :-- | --: | :-- |
| Build CPU | 17 h 36 min | "On-Demand Concurrent Builds" stod på *Run all builds immediately* i båda projekten, så varje bygge debiterades per påbörjad minut — även de som avbryts efter en halv minut. **Avstängt 2026-09-30** (Leonards ja): på Standard-maskinen är byggen i den inkluderade platsen gratis. Byggen köar nu; produktion går först. |
| Fluid CPU + minne | 12 h 30 min, 130 GB-h | Produktsidor som byggdes om (nedan) och de 40 förbyggda sidorna: de körs som egna funktioner som kallstartar, och varje kallstart hämtade hela Wix-katalogen (~60 anrop i rad, ~1 min). Loggen `[wix] live products loaded` kom på 40 sökvägar på tre timmar, nästan bara de förbyggda. |
| ISR Writes | 692K enheter | `/produkt/[slug]` stod för 126K av 163K skrivenheter på 12 h: ~12 000 ombyggnader, och varje gav en skrivning eftersom menysiffror, datum och varukorgsförslag ändrats. |
| Observability Plus | 1,58 M händelser | Tillägget var på. **Avstängt 2026-10-02** av Leonard. Loggar och fel syns fortfarande i Vercels vanliga vy. |

**Varför produktsidorna byggdes om hela tiden:** sidan sade `revalidate = 3600`,
men V3-hämtningen i `lib/products.ts` hade `revalidate: 300`, och Next sänker hela
rutten till den lägsta fetch-tiden. Sidorna byggdes alltså om var femte minut så
fort någon tittade (kund, sökmotor, länkförladdning).

**Så fungerar det nu** (`lib/produkt-cache.ts` har detaljerna):

- Produktsidan och varje hämtning på dess väg lever **sex timmar** — ett
  säkerhetsnät, inte färskheten. `lib/produkt-cache.test.ts` fäller en ny modul
  i `lib/` eller `components/` med kortare `revalidate` som inte står på den
  granskade listan.
- **En ändring tömmer bara sin egen produkt.** `/api/cron/uppdatera-andrade`
  (var femte minut, fönster elva minuter) läser Wix `updatedDate`, nya ordrar
  och motorns `/api/review-andringar`, tömmer `produkt-<id>` eller
  `recensioner-<id>` och sidan, och värmer sidan. Motorn säger dessutom till
  direkt vid fyndauktionens prissteg via `/api/admin/uppdatera-produkter`
  (nyckeln som kakan `fp_admin` eller Bearer — aldrig i adressen).
- ☠️ **Cronen kräver `CRON_SECRET`.** Saknas den svarar
  `/api/cron/uppdatera-andrade` 503 och ingenting töms — då gäller bara
  säkerhetsnätet på sex timmar.
- ☠️ **Töm aldrig med en global tagg** (`reviews`, `gpsr`): den sitter på varje
  produktsida och tömmer alla ~3 700 på en gång.
- ☠️ **Aldrig `cache: "no-store"` i en sidrendering** — det gör ISR-sidan
  dynamisk och Next svarar 500 (se `lib/popularity.ts`).
- En sida byggd på reservdata (Wix eller motorn svarade inte, en kapad katalog,
  tomma kategorier) lever fem minuter, inte sex timmar: `kortLivslangd()` i
  `lib/kort-livslangd.ts`.
- En produkt som raderas i Wix utan att döljas först syns inte i `updatedDate`
  och töms inte — dess sida ligger kvar tills säkerhetsnätet går ut. Dölj först.
- **Inga produktsidor förbyggs.** Efter en deploy värmer
  `/api/cron/varm-katalogen` katalogen.
- Menyns siffror hämtas från `/api/meny-antal` och varukorgens förslag från
  `/api/kundvagn-forslag`, i webbläsaren. Länkarna ligger kvar i HTML:en.
- `priceValidUntil` är sista dagen i nästa månad (`lib/pris-giltig.ts`), inte
  i dag + 30 dagar.

**En deploy kostar fortfarande två gånger:** den tömmer ISR-cachen, så alla
~3 700 produktsidor byggs om. Därav en deploy per dag.

## Varför — mätt, inte antaget (2026-09-04)

Vercel-fakturan 2026-09-04, sju dagar in i cykeln, 11,84 av 20 dollars
inkluderad kredit förbrukad:

| Rad | Belopp | Andel |
| :-- | --: | --: |
| **Build CPU Minutes** | **$5,80** | **49 %** |
| Observability Events | $1,88 | 16 % |
| ISR Writes | $1,80 | 15 % |
| Fluid Provisioned Memory | $0,78 | 7 % |
| Fluid Active CPU | $0,51 | 4 % |

Byggen är alltså halva notan. Den veckan innehöll en dag med **fem merges**
(#607, #610, #611, #612 plus mellanpushar) — fem byggen för arbete som hade
rymts i ett eller två.

**Och en deploy kostar två gånger.** Den tömmer ISR-cachen, så ~1 580 av
1 622 produktsidor (då) blev kalla; första besökaren på varje sida betalade en
rendering på 0,86–1,52 s i stället för 0,15. `/api/cron/varm-katalogen` värmer
upp dem igen, men det är ytterligare en rendering per produkt och deploy. Färre
deploys är alltså både billigare OCH snabbare för kunden.

## Undantaget

En bugg som skadar kunder just nu får sin egen deploy direkt. Det är
kostnaden värd. Allt annat — refaktoreringar, prestandaarbete, innehåll,
SEO — väntar in sina syskon.

## Det praktiska

- Flera relaterade ändringar → samma gren, samma PR, en merge.
- Är de orelaterade men klara samma dag → merga dem i följd med kort
  mellanrum hellre än utspritt över dagen; Vercel hinner då slå ihop
  köandet, och katalogen behöver bara värmas en gång.
- Skriv PR-texten så den bär flera ändringar. Det gör inte historiken
  sämre — varje commit är fortfarande sin egen berättelse.

## Särskilt för SEO- och produktpolering

Den som polerar produkttexter, bilder, titlar eller metadata rör ofta
dussintals produkter under en session. **Det ska bli EN PR, och den ska
mergas sällan.**

- Öppna en gren för hela poleringspasset och lägg alla produkter där.
  Öppna inte en PR per produkt.
- Merga när passet är klart — inte efter varje produkt som blivit bra.
  En halvfärdig gren skadar ingen; den ligger bara och väntar.
- Går arbetet över flera dagar: låt grenen leva och merga när den är klar,
  hellre än att merga varje dags skörd.
- Poleringen är dessutom sällan brådskande. Ingen kund väntar på en
  omskriven produkttitel — det är precis den sortens arbete som ska samlas
  ihop.

Ett polerpass som blir tjugo PR:ar kostar tjugo byggen och tjugo
katalogvärmningar för arbete som ingen kund märker snabbare.

## Wix-hämtningar: ett sidtak räknat nyast först ser inte katalogen

Katalogen har över 6 000 produkter, och de nyaste tusentalen är Aosom-varor:
en variant, inga optioner och till hälften dolda utkast. En hämtning som går
nyast först och slutar efter N sidor läser alltså bara dem. Uppmätt
2026-09-24 på tre sidovagnar med tak på 12 sidor (1 200 produkter):

- **Färgfiltret** hittade 0 färger. Alla 239 produkter med optioner låg bakom
  taket. Nu filtrerar frågan på `options.id` (`lib/product-colors-paging.ts`).
- **Google-flödets gallerier** gav extrabilder till 557 av 3 393 produkter.
  Svepet har kvar sitt tak, men flödet faller nu tillbaka på produktens eget
  galleri.
- **Variantsvepet** till flödet hade kapat tyst vid 10 000 varianter runt
  mitten av november. Nu är taket 30 000, och slår det i loggas ett fel.

Tre regler:

1. **Filtrera i frågan** på det du behöver, i stället för att svepa och
   hoppas att det ligger tidigt.
2. **Filtret går bara med på första sidan.** Filter plus markör svarar
   400 INVALID_CURSOR på products/query, inventory-items/query och
   categories/query. Markören bär frågan själv.
3. **Ett tak ska kasta eller logga ett fel, aldrig kapa tyst.** En avkortad
   lista ser frisk ut.

## Länkar som bara renderas vid hovring finns inte för Google (2026-09-24)

Mega-menyn renderade bara den hovrade panelen. Googlebot hovrar och klickar
aldrig, så de 105 underkategorierna saknade länkar från nästan hela sajten.
Uppmätt i produktion, både i server-HTML och renderat i Chromium utan
interaktion:

| sida | länkar till underkategorier |
|---|--:|
| startsidan | 0 |
| en produktsida | 1 (bläddringsraden) |
| /butik | 48 |
| en avdelningssida | bara efter JS (Förfina-chipsen ligger bakom en Suspense-gräns) |

En PageRank-modell över sajtens egna länkar gav underkategorierna ungefär
samma interna värde som en medianprodukt. Med panelerna i HTML
(`components/meganav.tsx`) blir det 43–80 gånger mer.

Regeln: **en länk som ska räknas ska finnas i HTML:en från början.** Dölj den
med `hidden` eller CSS, men rendera den inte villkorligt vid hovring, klick
eller först efter mount. Mobilmenyn (portal efter mount) och
kategori-dropdownen (`{open && …}`) är bekvämligheter för kunden, inte länkar
för Google. `lib/meganav-ssr.test.ts` fäller om desktopmenyns paneler blir
villkorliga igen.

## Listsidor: HTML:en ska vara det kunden ser (2026-09-27)

Kategorisidorna skickade sina kort i katalogordning, och ShopBrowser sorterade
om dem i webbläsaren. När sidan laddat klart stod 0 av 24 kort kvar på
/kategori/husdjur. Sökmotorn läste alltså andra produkter än kunden såg, och
rutnätet blinkade om. Samtidigt låg hela produktlistan i sidan: 1,3 MB av
/alla-produkters 2,8 MB. Bing flaggade tre sidor som över 1 MB.

Tre regler (`lib/list-pages.ts`, vaktas av `lib/listsidor.test.ts`):

1. **Ordna listan på servern** med `ordnaLista` och skicka samma `dayMs` till
   ShopBrowser.
2. **Skicka bara början av listan.** `listaForSidan` ger de första 48 korten
   plus en sammanfattning för filtren. Resten hämtar ShopBrowser från
   `/api/lista`, som räknar samma lista med samma funktion.
3. **A–Ö-listorna stannar på kategorisidorna.** Enligt en PageRank-modell över
   sajtens egna 4 015 sidor halveras produkternas interna värde utan dem
   (median 0,320 → 0,170), och sidnumrering var sämre (0,175). De skickas som
   färdig HTML-sträng, eftersom en JSX-lista ligger en gång till, dubbelt så
   stor, i React-datan.

## Måttfilter på kategorisidorna (2026-09-27)

Kategorisidorna filtrerar på bredd, djup, höjd, sitthöjd, maxlast, vikt,
effekt, volym, ålder och material, utöver pris, färg och rea. Värdena läses ur
produktbeskrivningens spec-rader (`lib/spec-facets.ts`). Wix har inga fält för
dem. Uppmätt på 3 783 produkter: bredd 80 %, höjd 78 %, djup 75 %, material
84 %, vikt 62 %, maxlast 43 %. 112 av 114 kategorier får minst ett filter.

Fyra regler:

1. **Hellre tomt än fel.** Kartongens mått läses aldrig. Två mått utan
   förklaring ger bara bredden. Ett ensamt mått i namnet ("bred sits på
   79 cm") räknas inte. Justerbar höjd sparas som ett intervall. En produkt
   utan värde försvinner bara när just det filtret används, och det skrivs
   inte ut hur många det gäller (Leonard).
2. **Kategorin föreslår, datan avgör.** `lib/spec-config.ts` säger vilka
   filter kategorin erbjuder och vad de heter, och underkategorier ärver.
   Nycklarna är butikens slugar (`asciiSlug` av namnet, t.ex.
   `koksmaskiner-apparater`), inte Wix (`köksmaskiner-apparater`); med Wix
   slugar gick 16 kategorier utan filter första kvällen.
   Ett filter visas bara när minst 60 % av listan har värdet
   (`specOversikt`).
3. **Hela sortimentet får inga måttfilter.** Det gäller /alla-produkter, /rea,
   /populara och /sok. En bredd som gäller både soffor och vattenkokare säger
   ingenting.
4. **Måtten följer bara med där de filtreras.** Bara kategorins nycklar
   skickas (`specFor`), och bara med `/api/lista` eller korta listor, aldrig
   med sidans första kort. `/api/lista` växte 6–10 % komprimerat.

Beskrivningarnas format styr täckningen: "Mått: 82 × 35 × 76 cm (B × D × H)",
"Maxlast: 120 kg" och "Material: stål och MDF" läses alltid.

### Knappgrupperna: klädsel, djur, form, antal, egenskaper (2026-09-27)

Utöver reglagen finns knappar för klädsel, djur, bränsle, form, placering,
antal (lådor, sittplatser, våningar, sängbredd) och egenskaper (hjul, höj- och
sänkbar, vattenavvisande, UV-skydd, LED, batteri, solcell, fjärrkontroll,
timer). De läses ur produktens EGEN text: namnet, spec-raderna, ingressen,
punktlistorna och rubrikerna. Brödtexten, "Vanliga frågor", "Passar inte den
här?" och länkar räknas inte, för där jämförs det med andra varor ("motpolen
till våra höj- och sänkbara bord"). Stickprov per kategori hittade och
låste (`lib/spec-facets.test.ts`):

- **JavaScripts `\b` räknar inte å, ä, ö som bokstäver.** `/\bträ\b/` hittade
  aldrig "Material: trä", `/\båtta/` aldrig "åtta lådor". Alla mönster med
  svenska ord går genom `sv()`.
- **Nekat räknas inte**: "inte hjul", "utan batteri", "Batteri: tutan kräver
  inget batteri". Batterierna till fjärrkontrollen gör inte lampan
  batteridriven.
- **Delar är inte varan**: "höjdjusterbart styre", "löphjul", "rullbar dörr",
  "två fotpallar" (inga sittplatser), tippskyddet i väggen (inte vägghängd),
  ett vedställ (inget bränsle), stolar (ingen form).

### Panelens utseende (jämfört med IKEA, Chilli, Mio, JYSK m.fl., 2026-09-27)

- **Mobil:** filtren i ett lager över sidan med fast fot, "Rensa alla" och
  "Visa N produkter". Inline sköt panelen ner produkterna nästan 3 000 px.
- **Valda filter** står som chips med kryss ovanför rutnätet, plus "Rensa
  alla". Det är den enda rensa-knappen på dator.
- **Antal** står på varje knapp och färg, räknat på de ANDRA filtren; noll
  tonas ned. Det är något annat än "12 st saknar uppgift", som inte visas.
- **Färg** är rutor med namn, flera kan väljas (`?farg=svart,gra`). Skenan
  valde bara en.
- **Reglagen** har Min/Max-rutor att skriva i; en inskriven gräns står kvar
  exakt (1 499 kr), den rundas inte till reglagets steg.

Knapparna visas vid 40 % täckning och minst två val, egenskaperna när minst
tre produkter har dem men inte nästan alla (90 %). Kategorin kan begränsa
egenskaperna ("eg:hj" i `lib/spec-config.ts`). Rumsstorlek för värmare
byggdes inte: texterna anger medvetet inte tillverkarnas m²-siffror.

## Kategoriträdet: tio avdelningar, rubriker i menyn (2026-09-30)

Granskningen hittade 519 felplaceringar. Den största: Elektronik & Tillbehör
bestod till mer än hälften av kontorsstolar och skrivbord. Dator & Gaming var
deras första underkategori, så 20 av dem gick ut i Google Shopping som 222
Electronics. Andra fel:
- Hem & Inredning bar 759 möbler som också låg under Möbler.
- Julgranar och kaminer låg under Dekoration.
- Kalas & Fest var till 70 % jul och halloween.

Trädet jämfördes med 25 butiker, bland dem IKEA, JYSK, vidaXL, Aosom, Rusta,
Jula och Zooplus, och byggdes om efter det:

- **Avdelningar:** Möbler, Hem & Inredning, Kök & Husgeråd, Trädgård &
  Utemöbler, Jul & Högtider, Barn & Familj, Husdjur, Sport & Fritid, Skönhet &
  Hälsa, Verktyg & Fordon. Elektronik och Mode är dolda i Wix och har
  301-omdirigeringar i `next.config.ts`.
- **Jul & Högtider** står i menyn och på /butik bara september–januari
  (`avdelningIHuvudmenyn` i `lib/meny-grupper.ts`). Sidan finns kvar året runt.
- **Rubrikerna i menyn** (Vardagsrum, Hund, Kontor & gaming …) ligger i
  `MENY_GRUPPER` i `lib/meny-grupper.ts`, inte i Wix. Wix har kvar två nivåer,
  så ingen adress flyttas. En ny kategori som saknas där hamnar under "Mer".
- **En produkt hör hemma i en avdelning.** Möbler ligger inte också direkt i
  Hem & Inredning. Förvaring får innehålla byråer och garderober, som hos alla
  möbelkedjor, men inte redskapsbodar eller sängramar.
- **Döljs en kategori i Wix** (hellre än att den raderas), då försvinner den
  för butiken och för importens kategoriförslag. Sidan svarar då 404 tills
  den har en omdirigering. Lägg därför omdirigeringen i samma deploy.

Flytten gjordes med namnregler över alla synliga produkter, med torrkörning
först: 330 tillägg och 1 261 borttag. Ingen produkt blev utan underkategori.


- **Vercel Web Analytics** (`@vercel/analytics/next`) and **Speed Insights**
  (`@vercel/speed-insights/next`) are mounted in `app/layout.tsx`. Both are
  cookie-free / privacy-friendly, so they render unconditionally (outside the
  `CookieConsent` gate) and require no GDPR consent. Beacons hit
  `/_vercel/insights/view` and `/_vercel/speed-insights/vitals`.
- **GA4** (`G-W6NZ87CX2Q`) also runs, loaded `lazyOnload` via `next/script`
  with a synchronous inline `gtag` stub. The two analytics stacks are
  independent.

# Meta Pixel + Conversions API (CAPI)

Facebook/Instagram-annonsspårning med **dubbel signal**: webbläsarens Pixel
(`fbq`) + server-side **Conversions API**. CAPI når fram även när iOS/Safari/
adblock blockerar Pixeln (~30–40 % av trafiken), och de två deduplicerar mot
varandra via en delad `event_id`.

### Filer
- `components/metapixel.tsx` — Pixel base-snippet (`fbq('init')` + `PageView`).
  Renderas från `app/layout.tsx` med `pixelId` ur `process.env.META_PIXEL_ID`.
  **Consent-gated**: laddas bara efter "Godkänn alla" (se nedan). Fyrar även
  `PageView` på SPA-navigeringar.
- `lib/meta.ts` — klientens `metaTrack()`: fyrar Pixel + POSTar `/api/meta/capi`
  med samma `event_id`. `keepalive` så InitiateCheckout överlever kassa-redirect.
- `lib/meta-capi.ts` — server-sändaren (delad). Hashar e-post/telefon med
  SHA-256, berikar med IP/UA, POSTar till Graph API.
- `app/api/meta/capi/route.ts` — POST-endpoint klienten anropar. `GET` =
  health-check (`{ configured: bool }`).
- `lib/analytics.ts` — fyrar Meta-event jämsides med GA4 (en enda källa).
- `app/api/wix-webhook/route.ts` — server-autoritativt **Purchase** vid
  `order_created` (med hashad kund-e-post/telefon), dedupat mot klientens
  `/tack`-Purchase via `event_id = purchase_<orderId>`.

### Event-mappning (Pixel + CAPI, delad event_id)
| Meta-event | Trigger | GA4-motsvarighet |
|---|---|---|
| `PageView` | varje sida (snippet + SPA-route) | — |
| `ViewContent` | PDP laddas | `view_item` |
| `AddToCart` | "Lägg i kundvagn" | `add_to_cart` |
| `InitiateCheckout` | "Till kassan" | `begin_checkout` |
| `Purchase` | `/tack` **+** Wix `order_created`-webhook | `purchase` |

**`AddPaymentInfo` saknas avsiktligt:** Klarna-steget körs inne i den
Wix-hostade kassan (`checkout.fyndplats.se`), som inte är denna kodbas. Det går
inte att instrumentera därifrån. Vill man ha eventet får det läggas via Wix egen
Pixel-/Custom-code-integration i kassan.

### Samtycke (GDPR)
Pixeln + CAPI fyrar **bara** när `localStorage.fp_cookie_consent === "all"`
(`lib/consent.ts`). Detta är striktare än GA4 (som körs ogated) — medvetet, då
annons-pixeln matchar besökaren mot ett Facebook-konto. `CookieConsent`
dispatchar `fp-consent-change` så Pixeln startar direkt vid "Godkänn alla", utan
sidladdning. Vill du köra ogated som GA4: ta bort `hasMarketingConsent()`-grinden
i `lib/meta.ts` + `lib/use-marketing-consent.ts` (hooken som `metapixel.tsx`
använder sedan 2026-08-19, när Google-modulen behövde samma lyssnare).

Samma val speglas dessutom i en **cookie** med samma namn. Skälet är att
`/tack` måste veta valet *server-side*: Google Customer Reviews-modulen
(`components/google-customer-reviews-optin.tsx`) får kundens e-postadress som
prop, och en prop till en klientkomponent hamnar i sidans RSC-payload oavsett
vad komponenten renderar. Utan cookien låg adressen alltså i HTML:en även för
den som valt "bara nödvändiga". `CookieConsent` speglar om cookien vid **varje**
besök — annars hade ingen som samtyckt före den deployen fått någon, och Safari
kapar `document.cookie`-satta cookies till 7 dagar.

### Google Customer Reviews (`GOOGLE_MERCHANT_ID`)

Opt-in-modulen på `/tack` (`lib/gcr.ts` + `components/google-customer-reviews-optin.tsx`)
visar Googles egen enkät-dialog efter köp. Den är gatad på samma marknadssamtycke
som Meta Pixel, både server-side (cookien) och i komponenten.

`GOOGLE_MERCHANT_ID` överstyr Merchant Center-ID:t; utan env används
`MERCHANT_ID_DEFAULT` i `lib/gcr.ts`. **Sätt env om kontot roteras** — Google
avvisar ett felaktigt ID *tyst*, så symptomet blir "modulen fungerar inte".

Övriga tysta felkällor att känna till vid felsökning: saknad e-post eller
leveransland i Wix-ordern, och att modulen bara visas de första `FRESH_HOURS`
(48 h) efter köpet. Alla vägar loggar med prefixen `[tack]` och `[gcr]`.

Tröskeln för att "Butikens betyg" ska synas i annonser är ~100 **färdiga**
recensioner per land på 12 månader — inte 100 opt-ins.

### Så här aktiverar du den (Leonard) — steg för steg
1. **Skapa Pixel/Dataset** i Meta Events Manager:
   <https://business.facebook.com/events_manager2/> → *Connect data sources* →
   *Web* → skapa en Pixel. Kopiera **Pixel-ID:t** (numerisk sträng).
2. **Generera CAPI-token**: i Events Manager → din Pixel → **Settings** →
   *Conversions API* → **Generate access token**. Kopiera token (visas en gång).
3. **Lägg in i Vercel** → projektet `fyndplats-headless` →
   *Settings → Environment Variables* (alla tre Environments: Production,
   Preview, Development):
   - `META_PIXEL_ID` = ditt Pixel-ID
   - `META_CAPI_ACCESS_TOKEN` = din CAPI-token
   - `META_TEST_EVENT_CODE` = (valfri) koden från Events Manager → *Test Events*
     — attacheras bara när `VERCEL_ENV !== "production"` (preview-deploys + lokalt).
   Redeploy:a efter att värdena sparats (env-ändringar slår igenom först vid ny
   deploy). Tills variablerna är ifyllda renderar Pixeln inget och CAPI svarar
   `{ skipped: "not_configured" }` — sajten fungerar oförändrat.
4. **Test Events**: Events Manager → din Pixel → **Test Events**. Sätt
   `META_TEST_EVENT_CODE` (+ Pixel-ID + CAPI-token) i **Preview** och surfa på en
   preview-deploy — events dyker upp i panelen i realtid (gaten är `VERCEL_ENV`,
   så preview funkar men prod rör aldrig test-koden). Verifiera att Pixel- och
   CAPI-raden för samma sidladdning **deduplicerar** (visas som *ett* event med
   "Deduplicated"). Se den detaljerade testplanen nedan.
5. Health-check när som helst: `GET https://www.fyndplats.se/api/meta/capi`
   → `{ "configured": true }` när env är satt.

### Testplan: verifiera Purchase-dedup (kör detta när Pixel-ID fylls i)

Purchase fyras från **två** håll med samma `event_id` (`purchase_<order-GUID>`):
klienten på `/tack` (Pixel + CAPI) och webhooken vid `order_created` (CAPI). De
ska deduplicera till **ETT** event i Meta. Det vilar på att båda använder Wix
order-**GUID** (`order._id`) — webhooken tar `_id` först, och klienten fyrar
*bara* om `/tack`-redirectens id är ett GUID (annars hoppar den över och låter
webhooken vara enda källan; den loggar `[meta] Klient-Purchase hoppades över …`).

Gör så här innan du går till produktion:

1. Fyll i `META_PIXEL_ID` + `META_CAPI_ACCESS_TOKEN` på **Preview** (och valfritt
   Production senare). Sätt även `META_TEST_EVENT_CODE` (Events Manager → din
   Pixel → *Test Events* → koden visas överst) på **Preview** —
   `lib/meta-capi.ts` attacherar `test_event_code` bara när `VERCEL_ENV !==
   "production"` (dvs på preview-deploys + lokalt, ALDRIG i prod), så skarp data
   smutsas aldrig ner. (NODE_ENV duger inte — Vercel bygger preview som
   production.)
2. Redeploy:a Preview. Öppna Events Manager → din Pixel → **Test Events** och
   håll den öppen.
3. På preview-URL:en: acceptera cookies med **"Godkänn alla"** (Purchase är
   consent-gated på `fp_cookie_consent === "all"`), lägg en produkt i kundvagnen
   och slutför ett **testköp** hela vägen till `/tack`.
4. I Test Events ska du se **ett** `Purchase`-event märkt **"Deduplicated"** —
   det betyder att klientens Pixel/CAPI och webhookens CAPI slogs ihop på samma
   `event_id`. Ser du **två** separata Purchase → dedup brister.
5. Om dedup brister, kolla loggarna (Vercel → Preview-deployen → *Functions*):
   - `/tack` (browser-konsol): `[meta] Klient-Purchase hoppades över: orderId=… `
     → `/tack`-redirecten gav inget GUID. Kolla vilken query-param Wix faktiskt
     skickar (DevTools → Network → redirecten till `/tack`) och utöka
     `params.get(...)`-listan i `components/thankyou.tsx` så GUID:t plockas upp.
   - `[wix-webhook] Meta Purchase event_id=purchase_… (guid=…)` → bekräftar vilket
     id webhooken använde. `guid=false` = ordern saknade `_id` (ska inte hända)
     → matchar inte klienten.
   Jämför de två event_id:na: de **måste** vara identiska (`purchase_<samma-GUID>`).
6. Verifiera att webhook-Purchase fungerar **utan** `/tack` (iOS/adblock-fallet):
   gör ett köp, blockera/stäng fliken före `/tack` laddar — Test Events ska ändå
   visa ett `Purchase` (bara CAPI-raden, från webhooken).
7. När allt deduplicerar korrekt: lägg `META_PIXEL_ID` + `META_CAPI_ACCESS_TOKEN`
   på **Production**, men sätt **INTE** `META_TEST_EVENT_CODE` där. Redeploy.

# Package manager

This repo has **both** `pnpm-lock.yaml` (v9) and `package-lock.json` committed.
The canonical manager is **pnpm** (Vercel detects `pnpm-lock.yaml` first, and
local `node_modules` carries pnpm's `.modules.yaml`). When adding deps: run
`pnpm add <pkg>`, then `npm install --package-lock-only` to keep
`package-lock.json` in sync. Don't `npm install` packages directly — it leaves
`pnpm-lock.yaml` stale and the dep won't install on deploy.

## Fyndauktionen läses och avslutas via motorn (2026-09-29)

Wix CMS har ett globalt tak på 4 000 rader, och auktionskön (`FyndplatsAuctions`)
var 3 561 av dem. Raderna flyttar till Postgres i motorn (`AUCTIONS_BACKEND`, se
motorns `CLAUDE.md`). Butiken läser inte längre Wix Data för auktionerna:

- `/fyndauktion` och startsidans banner läser `GET /api/auctions/rader` hos motorn.
- Webhookens direktavslut (`order_created`) postar till `POST /api/auctions/avsluta`.
  Motorn återställer priset först och sparar sedan sold.

Båda går genom `lib/auction-motor.ts`, med `REVIEW_INGEST_SECRET` som
hemlighet (samma värde i båda projekten). Motorn svarar ur det lager växeln
pekar på, så butiken byter lager samtidigt med motorn och behöver ingen egen
deploy vid växlingen.

☠️ **Läs aldrig auktionerna ur Wix Data igen.** Efter raderingen är kollektionen
tom, och en läsning därifrån ger en tom `/fyndauktion` utan ett enda fel.
`lib/auction-store-access.test.ts` fäller om en fil nämner kollektionen
tillsammans med ett Wix Data-anrop.

## Googles ?srsltid= tas bort ur adressfältet (2026-09-30)

Merchant Centers automatiska taggning lägger `?srsltid=…` på varje länk från
Googles sökresultat. Leonard ville ha bort den ("det ser fult ut"), utan att
något annat påverkas. `components/rensa-srsltid.tsx` tar bort den ur
adressfältet, logiken bor i `lib/srsltid.ts` och är testad där.

Fyra egenskaper som inte ska tas bort:

1. ☠️ **Koden står kvar tills Googles tagg är klar med den.** Städningen väntar
   på att gtag.js laddats (den laddas med `lazyOnload`) OCH att besökaren valt
   i cookiebannern, och sedan tre sekunder till. Uppmätt mot den skarpa sidan:
   när besökaren klickar "Godkänn alla" skickar Ads-taggen sin
   `consent_update` med koden i adressen. Städas den före valet går den
   kopplingen förlorad. Väljer besökaren aldrig står koden kvar, som förut.
2. ☠️ **`History.prototype.replaceState`, inte `window.history.replaceState`.**
   Både Next och Googles tagg lägger sig runt metoden på `window.history`.
   Uppmätt: via `window.history` skickade Ads-taggen två extra `page_view`
   för varje städning, via prototypen ingen. Next:s `state` följer med, så
   bakåtknappen fungerar (provat: nästa produkt och tillbaka gav rätt sida med
   ren adress).
3. **Next vet inte om bytet**, så en `router.refresh()` (auktionsklockan) skriver
   tillbaka den gamla adressen. Loopen tar då bort koden igen inom en sekund.
4. **Andra parametrar lämnas tecken för tecken** (`?variant=` och filtren).
   Strängen delas för hand, eftersom `URLSearchParams` kodar om `,` och `+`.

Sidans canonical pekar redan på den rena adressen, så för Google är inget nytt.
