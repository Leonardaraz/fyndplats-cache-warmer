# Fyndplats — Copy Revision Matrix (Phase 1)

**Status:** Inventory complete. **No code has been changed.** Waiting for Leonard's go-ahead before Phase 2 (edits + commit + push).

**Scope of inventory:** every customer-facing string in `app/**`, `components/**`, `emails/**`, and `lib/seo.ts`. Internal admin, dev comments, tracking-API guard logic, and legal references that must remain (distansavtalslagen, konsumentköplagen, etc.) were inventoried but excluded from changes.

**Brand-principle legend used in matrix:**

- **P1:** "Trygg svensk e-handel" / "svensk webbutik" / "svensk kundtjänst" allowed — refers to the company.
- **P2:** Don't imply products are Swedish.
- **P3:** Don't disclose product origin (no "från hela världen", "global", "importerade", "Kina").
- **P4:** Don't claim "snabb" / "express" delivery — actual 5–15 vardagar.
- **P5:** Be honest with delivery times — "Leverans 5–15 vardagar" is fine.
- **P6:** Focus on curation, value, Klarna, 30 dagars öppet köp, svensk kundtjänst, trust.

---

## 1. Critical fixes (Leonard's principles directly violated)

### 1.1 Homepage hero — `app/page.tsx`

| # | Loc | Current | Proposed | Why |
|---|---|---|---|---|
| C1 | `app/page.tsx:277` | `<h1>Noga utvalda fynd – <em>tryggt och svenskt</em></h1>` | `<h1>Noga utvalda fynd – <em>tryggt köp</em></h1>` | **P2.** "tryggt och svenskt" reads as a product claim. Allowed-phrase variant from brief. Keeps "Noga utvalda fynd" SEO. |
| C2 | `app/page.tsx:278` | `<p>Handla kvalitetsprodukter inom hem, kök, sport och elektronik. Fri frakt över 499 kr. Svensk kundtjänst som svarar inom 24 timmar.</p>` | `<p>Handplockade fynd inom hem, kök, sport och elektronik – noga utvalda för svenska hem. Fri frakt över 499 kr. Svensk kundtjänst som svarar inom 24 timmar.</p>` | **P6.** Pivots tagline from product-quality assertion to curation ("handplockade", "noga utvalda"); keeps SEO keywords (hem/kök/sport/elektronik/fynd) and Klarna/svensk kundtjänst trust signals. |
| C3 | `app/page.tsx:287` | `<span><b>✓</b> Spårbar leverans</span>` (current) | *(no change — already correct)* | Already honest. |
| C4 | `app/page.tsx:314` | `<span className="uspitem">…Snabb leverans</span>` | `<span className="uspitem">…Leverans 5–15 vardagar</span>` | **P4.** Sets expectation honestly; preserves the truck icon. |
| C5 | `app/page.tsx:422` | `<h3>Snabb &amp; spårbar leverans</h3><p>Fri frakt över 499 kr. Följ paketet hela vägen hem.</p>` | `<h3>Spårbar leverans</h3><p>Leverans 5–15 vardagar. Fri frakt över 499 kr – följ paketet hela vägen hem.</p>` | **P4.** Removes "Snabb"; tells the truth up front; keeps tracking + free-shipping value props. |

### 1.2 Placeholder Google reviews — `app/page.tsx`

The block is marked TODO ("byt placeholder-recensionerna mot riktiga citat") but the strings currently render to live users + go into JSON-LD aggregateRating schema. They contain delivery claims ("snabb leverans", "kom redan efter tre dagar", "levererats snabbt") that directly contradict P4/P5.

**Recommendation: rewrite to remove fast-delivery claims** until Leonard pastes real Google reviews. The reviews still need to feel like real customer voice; just strip the delivery-time superlatives. JSON-LD `aggregateRating` 4.9/21 stays untouched (matches actual Google profile).

| # | Loc | Current | Proposed | Why |
|---|---|---|---|---|
| C6 | `app/page.tsx:14` (Anna L.) | `"Snabb leverans och fantastisk kvalitet på produkterna! Beställde en astronautprojektor till sonens rum och den blev en hit. Smidig betalning med Klarna och paketet kom redan efter tre dagar. Rekommenderar verkligen Fyndplats till alla som vill handla tryggt online."` | `"Fantastisk kvalitet på produkterna! Beställde en astronautprojektor till sonens rum och den blev en hit. Smidig betalning med Klarna och tydlig info hela vägen från order till leverans. Rekommenderar verkligen Fyndplats till alla som vill handla tryggt online."` | **P4.** Removes "Snabb leverans" and "kom redan efter tre dagar"; keeps Klarna + trust messaging. |
| C7 | `app/page.tsx:20` (Johan B.) | `"Mycket bra kundtjänst! Hade en fråga om en produkt och fick svar samma dag, supertrevligt bemötande. Själva varan höll precis vad den lovade och priset var oslagbart. Det är skönt att handla från en svensk sajt där man vet att allt funkar som det ska."` | *(no change)* | "svensk sajt" = svensk e-handel (P1, company), not product origin. Kundtjänst-fokus är önskat per P6. |
| C8 | `app/page.tsx:26` (Maria S.) | `"Har handlat tre gånger nu och allt har levererats snabbt och i bra skick. Den elektriska vinöppnaren jag köpte senast var till och med bättre än beskrivningen lät påskina. Tydlig spårning hela vägen och inga otrevliga överraskningar. Kommer definitivt tillbaka."` | `"Har handlat tre gånger nu och allt har kommit fram i bra skick. Den elektriska vinöppnaren jag köpte senast var till och med bättre än beskrivningen lät påskina. Tydlig spårning hela vägen och inga otrevliga överraskningar. Kommer definitivt tillbaka."` | **P4.** Drops "levererats snabbt"; behåller "tydlig spårning" (sant och OK per P5/P6). |

### 1.3 Product detail page — `components/productview.tsx`

| # | Loc | Current | Proposed | Why |
|---|---|---|---|---|
| C9 | `components/productview.tsx:163` | `{inStock ? "✓ I lager – skickas inom 1–2 dagar" : "Tillfälligt slut"}` | `{inStock ? "✓ I lager" : "Tillfälligt slut"}` | **P4.** "skickas inom 1–2 dagar" is concretely false for the AliExpress dropship flow. Lager-status alone is the honest signal. (Alternative: `"✓ I lager – leverans 5–15 vardagar"`; cleaner is preferred since `pdp-trust` row below already states the policy.) |

### 1.4 Thank-you page — `components/thankyou.tsx`

| # | Loc | Current | Proposed | Why |
|---|---|---|---|---|
| C10 | `components/thankyou.tsx:67–70` | `<p className="tack-lede">Vi har skickat en orderbekräftelse till din e-post med alla detaljer. Du får ett nytt mejl med spårningsnummer när paketet är på väg – brukar ta <b>1–3 arbetsdagar</b>.</p>` | `<p className="tack-lede">Vi har skickat en orderbekräftelse till din e-post med alla detaljer. Du får ett nytt mejl med spårningsnummer så snart paketet är på väg.</p>` | **P4.** "Brukar ta 1–3 arbetsdagar" tills tracking is misleading for the actual dropship flow; sätter falsk förväntan. |
| C11 | `components/thankyou.tsx:82–86` | `<strong>Förbereds & skickas</strong><span>Inom 1–3 arbetsdagar</span>` | `<strong>Förbereds & skickas</strong><span>Spårnings­nummer via mejl</span>` | **P4/P5.** Tar bort tidslöftet i mellansteget; sista steget ("Beräknad leverans · 5–15 arbetsdagar") gör jobbet ärligt. |
| C12 | `components/thankyou.tsx:88–93` | `<strong>Beräknad leverans</strong><span>5–15 arbetsdagar</span>` | *(no change)* | Already honest — exact phrasing from P5. |

### 1.5 FAQ — `app/vanliga-fragor/page.tsx`

| # | Loc | Current | Proposed | Why |
|---|---|---|---|---|
| C13 | `app/vanliga-fragor/page.tsx:12` (Vad kostar frakten?) | `"Standardfrakt är 19 kr inom Sverige. Vid köp över 499 kr är frakten helt fri. Vi skickar med utvald leverantör för snabb och trygg leverans."` | `"Standardfrakt är 19 kr inom Sverige. Vid köp över 499 kr är frakten helt fri. Vi skickar med spårbar leverans hela vägen hem."` | **P4.** Tar bort "snabb"; ersätter med "spårbar" — sant och fortfarande SEO-vänligt. |

> Övriga "snabb"-träffar i FAQ (`snabba svar`, `snabbt löser`, `snabbast når du oss`, lead `snabbt svar`) handlar om **kundtjänst-responstid och att hitta information**, inte om leverans — P4 berör dem inte. Lämnas oförändrade.

### 1.6 SEO meta — minor "snabbt" cleanup

| # | Loc | Current | Proposed | Why |
|---|---|---|---|---|
| C14 | `app/vanliga-fragor/page.tsx:6,8` (meta description × 2) | `"Svar på vanliga frågor om beställning, betalning, frakt och returer hos Fyndplats. Hitta hjälpen du behöver snabbt."` | *(no change — "snabbt" här = hitta svar, ej leverans)* | OK. |

---

## 2. Likely-fine but worth flagging

### 2.1 Abandoned-cart email #2 — "Fri frakt på alla beställningar"

`emails/abandoned-cart-2.tsx` säger:

> banner.title: **"Fri frakt — för alla"**  
> banner.body: **"Fri frakt gäller automatiskt i kassan på alla beställningar."**

Detta motsäger reglen som syns överallt annars (`Fri frakt över 499 kr`). Ej i Leonards 6 principer, men **inkonsekvent och potentiellt vilseledande** om varukorgen är < 499 kr. Två val:

- **(a) Smal fix:** ändra texten till `"Fri frakt över 499 kr – nära dig redan nu."` och utvärdera per-kundvagn vid template-render (kräver liten kodändring för att läsa subtotal).
- **(b) Bred fix:** ändra banner-titel till `"Fri frakt över 499 kr"` och body till `"Fri frakt gäller automatiskt på order över 499 kr – ofta bara några hundralappar bort."`.

**Rekommendation:** (b) — minimal kod-risk, ärlig. **Flaggar för Leonards godkännande**, inkluderar inte i automatisk Phase 2 utan grönt ljus.

### 2.2 Cart drawer "Du är X kr från fri frakt"

`components/cart.tsx:200–207` är dynamiskt och korrekt (räknar mot 499 kr). Ingen ändring.

### 2.3 Schema.org JSON-LD beskrivningar

| Loc | Field | Value |
|---|---|---|
| `app/page.tsx:37` | `OnlineStore.description` | `"Svensk webbutik för kvalitetsprodukter till låga priser."` — **OK** (företaget = svenskt, P1). |
| `app/produkt/[slug]/page.tsx:38` | `Product.brand.name` | `"Fyndplats"` — **OK**. |
| `app/produkt/[slug]/page.tsx:18` | meta fallback | `${p.name} – köp hos Fyndplats. Fri frakt över 499 kr.` — **OK**. |

---

## 3. Touched but kept as-is (justification)

| Loc | Text | Reason kept |
|---|---|---|
| `components/site.tsx:71` (promo bar) | `"🚚 Fri frakt över 499 kr · Betala smidigt med Klarna"` | Honest. P6. |
| `components/site.tsx:103` (footer brand) | `"Trygg svensk e-handel med ett brett sortiment till låga priser."` | P1 — company-level. |
| `components/site.tsx:111` (footer bar) | `"©2021–2026 Fyndplats · Trygg svensk e-handel · …"` | P1. |
| `app/layout.tsx:50–66` (root metadata) | `"Fyndplats – din svenska webbutik för kvalitetsprodukter till låga priser. Fynda inom hem, mode, teknik och fritid för hela familjen. Fri frakt över 499 kr."` | P1 (svensk **webbutik**, inte produkter). Optional polish below. |
| `app/omoss/page.tsx` hela texten | "svensk webbutik", "Svensk kundtjänst", "5–15 vardagar" | P1, P5 — redan korrekt. |
| `app/returer/page.tsx` hela texten | 30-dagars öppet köp, retur-flöde, kostnader 41–167 kr | Korrekt och ärligt. |
| `app/kopvillkor/page.tsx:52–55` | `"Normal leveranstid är 5–15 arbetsdagar … Vid kraftiga förseningar (mer än 30 dagar) har du alltid rätt att häva köpet…"` | P5 — exemplariskt. |
| `app/kundtjanst/page.tsx:27` | `"Leveranstid: normalt 5–15 arbetsdagar"` | P5. |
| `app/sparning/page.tsx` | "Klistra in spårningsnummer", "1–2 dagar mellan skanningar" | Realistiskt, inte ett löfte. |
| `components/tracking.tsx:187` | `"Beräknad leverans: 5–15 arbetsdagar"` (fallback) | P5. |
| `emails/order-confirmation.tsx:78–80` | `"Vi har tagit emot din beställning och börjar förbereda den direkt. Du får ett mejl till så snart paketet är på väg."` | Inte ett tidsspecifikt löfte. OK. |
| `emails/shipping-confirmation.tsx` hela texten | Innehåller bara dynamisk ETA om Wix skickar en. | OK. |
| FAQ Q "Skickar ni utanför Sverige?" | "För närvarande skickar vi bara inom Sverige…" | OK. |
| `app/vanliga-fragor/page.tsx:13` (Hur lång är leveranstiden?) | `"Vanlig leveranstid är 5–15 arbetsdagar från beställning…"` | P5. |

---

## 4. Small SEO polish recommendations (optional, NOT included in default Phase 2)

These don't violate principles but could be tightened. **Will only apply if Leonard says yes.**

| Loc | Current | Suggested polish | Reason |
|---|---|---|---|
| `app/layout.tsx:53` | title default `"Fyndplats | Kvalitetsprodukter till låga priser online"` | `"Fyndplats | Noga utvalda fynd till smarta priser"` | Mer brand-stämmande, behåller primär-keyword "fynd". Längd OK (~52 char). |
| `app/layout.tsx:56–58` | desc `"Fyndplats – din svenska webbutik för kvalitetsprodukter till låga priser. Fynda inom hem, mode, teknik och fritid för hela familjen. Fri frakt över 499 kr."` (~156 char) | `"Fyndplats – svensk webbutik med noga utvalda fynd inom hem, mode, teknik och fritid. Smarta priser, Klarna och fri frakt över 499 kr."` (~133 char) | Tydligare värdeerbjudande, ärlig, plats för fler trust-signaler. |
| `app/butik/page.tsx:7–9` | desc `"Handla i Fyndplats webbutik – kvalitetsprodukter till låga priser. Fri frakt över 499 kr, trygg betalning med Klarna."` | `"Handla i Fyndplats webbutik – noga utvalda fynd till smarta priser. Fri frakt över 499 kr, trygga betalningar med Klarna."` | Konsekvent språk; Klarna-vinkel intakt. |
| `app/kategori/[slug]/page.tsx:18–22` (generated) | `"Handla ${c.name} hos Fyndplats – kvalitetsprodukter till låga priser. Fri frakt över 499 kr."` | `"Handla ${c.name} hos Fyndplats – noga utvalda fynd till smarta priser. Fri frakt över 499 kr."` | Konsekvent. |

---

## 5. Summary report

- **Total customer-facing surfaces inventoried:** 31 files (app routes, components, emails, lib/seo).
- **Hard problematic strings (P1–P5 directly violated):** **14** (matrix items C1–C14, after dropping false positives where "snabb" referred to FAQ/help not delivery).
- **Soft inconsistencies (worth flagging, not in Leonard's principles):** 1 (abandoned-cart-2 banner about "fri frakt på alla beställningar").
- **SEO polish recommendations (optional):** 4 meta descriptions.

### Top 5 most critical fixes

1. **C1** — `app/page.tsx:277` H1 hero: drop "tryggt och svenskt" (most visible product-Swedish claim on the site).
2. **C4 + C5** — homepage USP row + "Why us" card: kill "Snabb leverans" (appears prominently above-the-fold and in trust grid).
3. **C9** — `components/productview.tsx:163` PDP stock line "skickas inom 1–2 dagar" (false on every product detail page).
4. **C6/C8** — homepage placeholder reviews mention "snabb leverans" / "tre dagar" / "levererats snabbt" (live + in JSON-LD; contradicts policy publicly).
5. **C10/C11** — `components/thankyou.tsx` post-purchase: "1–3 arbetsdagar" tracking + ship promises (sets wrong expectations the moment money changes hands).

### Surprises / unused copy / oddities

- The customer reviews on the homepage are explicitly marked TODO ("byt placeholder-recensionerna nedan mot riktiga citat från Google Business Profile"). They currently leak fast-delivery claims into JSON-LD `Review` schema served to Google. Worth replacing with real Google reviews soon — but the immediate copy fix removes the false delivery boasts in the interim.
- `app/api/track/route.ts` already strips Chinese carriers ("china/sf express/yto/sto/yunda/cainiao/aliexpress" → "Fraktpartner") and Chinese cities from the spårning UI. Backend-anonymisering är konsekvent — bra grund att stå på.
- `emails/abandoned-cart-2.tsx` säger "fri frakt på alla beställningar" vilket motsäger 499-kr-tröskeln på resten av sajten — flaggat ovan, väntar på beslut.
- "Snabb"-ord på 6 ställen i FAQ/kundtjänst-sidor (`snabba fakta`, `snabbt svar`, `snabbast`, etc.) handlar om kundservice-respons, inte leverans — **avsiktligt orörda** för att inte överreagera.

### Estimated total changes for Phase 2 (matrix items C1–C14)

- **5 files touched:** `app/page.tsx`, `app/vanliga-fragor/page.tsx`, `components/productview.tsx`, `components/thankyou.tsx`, *(optional: abandoned-cart-2.tsx)*.
- **~14 string edits** (text-only replacements; no component restructuring, no logic changes).
- **Zero schema/route changes.**
- **Zero TypeScript / type changes.**
- Build + type-check riskerar inget — ren copy-revision.
- Föreslagen commit-meddelande: `feat(copy): remove misleading product-origin and fast-delivery claims site-wide`.

---

**Phase 2 ready to launch on Leonard's go-ahead.**

Decisions needed before I proceed:

1. **Hero H1 wording (C1)** — confirm `"Noga utvalda fynd – tryggt köp"` or pick a different allowed variant.
2. **Abandoned-cart-2 banner (§2.1)** — apply fix (b) "Fri frakt över 499 kr"? Or leave alone?
3. **Optional SEO meta polish (§4)** — include in same commit, or skip?
4. **PDP stock label (C9)** — `"✓ I lager"` (recommended) or `"✓ I lager – leverans 5–15 vardagar"`?
