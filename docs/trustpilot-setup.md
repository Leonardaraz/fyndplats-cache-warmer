# Trustpilot-integration — uppsättning (Leonard)

## Läget 2026-10-22: bara gratisdelen är på

Kontot finns, på gratisplanen. Omdömessidan (`/omdomen`) visar en länk till
profilen och Trustpilots egen knapp för att lämna ett omdöme (Review Collector).
ID:t och adresserna bor i `lib/trustpilot-profil.ts`, så ingen miljövariabel
behövs. Knappen visas bara med samtycke till alla cookies. Utan samtycke är den
en vanlig länk (`components/trustpilot-insamling.tsx`).

☠️ **Sätt inte `TRUSTPILOT_BUSINESS_UNIT_ID` på gratisplanen.** Variabeln slår
på de betalda widgetarna och döljer samtidigt våra egna omdömen på
produktsidorna och korten (`lib/rating.ts`, `ownReviewsHidden`). Mätt mot
Trustpilots widgetserver 2026-10-22: insamlingsknappen svarar 200 för vårt
konto, sidfotens Mini svarar 400 *"BusinessUnit does not have access to that
trustbox"*. Butiken hade alltså tappat sina egna omdömen och fått tomma
widgetar i stället.

Vad planerna ger enligt Trustpilots svenska plansida 2026-10-22 (pris per månad
vid årsbetalning):

| Plan | Pris från | Widgetar på webbplatsen |
|---|--:|---|
| Gratis | 0 kr | insamlingsknappen |
| Starter | 899 kr | och 1 som visar betyget |
| Plus | 1 999 kr | och 9 som visar betyget |
| Premium | 4 999 kr | och 10 som visar själva omdömena |

Omdömena får bara visas med Trustpilots egna widgetar. Villkoren förbjuder att
kopiera in dem.

Tre saker att göra innan en betald widget slås på:

- **Samtycke.** Sidfotens och produktsidans widgetar grindar inte på samtycke,
  till skillnad från omdömessidans knapp.
- **Egna omdömen.** Ska de ligga kvar bredvid Trustpilots, måste
  `ownReviewsHidden` frikopplas från variabeln.
- **Inbjudningarna** efter leverans (steg 5) är avstängda sedan 2026-08-17
  (Leonards beslut, #444). Cronet läser samma variabel, så det går inte att
  slå på utan att egna omdömen döljs.

Stegen nedan skrevs 2026-07 för den betalda vägen. Påståendet att gratiskontot
räcker för widgetarna stämmer inte längre.

---

## Vad som aktiveras av vilken variabel

| Env-variabel | Aktiverar |
|---|---|
| `TRUSTPILOT_VERIFICATION_ID` | Domän-verifierings-`<meta>`-taggen i `<head>` (engångs). |
| `TRUSTPILOT_BUSINESS_UNIT_ID` | Mini TrustBox i footern **+** Product Reviews-widget på PDP **+** review-request-cronet, **och döljer egna omdömen** på PDP och korten. Kräver betald plan. |
| `TRUSTPILOT_API_KEY` | (Valfritt) AFS-inbjudningar via Trustpilots API i stället för egna mejl. |

Tom variabel = den delen renderas/körs inte. Omdömessidans knapp och länk
läser ingen variabel.

---

## Steg 1 — Skapa Trustpilot Business-konto (gratis)

1. Gå till <https://www.trustpilot.com/business> och registrera Fyndplats.
2. Ange domänen `fyndplats.se` som ditt företags webbplats.
3. Verifiera din e-post och logga in i Business-dashboarden.

## Steg 2 — Verifiera fyndplats.se via meta-tag

1. I Business-dashboarden: **Settings → Integrations → Domain verification**
   (eller "Verify your domain") → välj **Meta tag**.
2. Trustpilot ger dig en sträng (t.ex. `abc123...`). Det är värdet, **inte** hela
   taggen.
3. Lägg in den i Vercel som `TRUSTPILOT_VERIFICATION_ID` (se steg 4). Efter
   redeploy renderar `app/layout.tsx`:

   ```html
   <meta name="trustpilot-one-time-domain-verification-id" content="abc123...">
   ```

4. Tryck **Verify** i Trustpilot. När den är grön kan du ta bort variabeln igen
   (det är en engångskontroll) — eller låta den ligga, den är ofarlig.

## Steg 3 — Hämta Business Unit ID

1. I dashboarden: **Settings → Integrations → TrustBox** (eller skapa en valfri
   TrustBox-widget).
2. I widget-koden Trustpilot visar finns `data-businessunit-id="...."` — kopiera
   den strängen. Det är ditt **Business Unit ID** (ser ut som
   `5f...e1c9`).
3. Alternativt: **Settings → Public business information** → ID:t står i URL:en
   till din publika profil.

## Steg 4 — Lägg in i Vercel

Projekt `fyndplats-headless` → **Settings → Environment Variables** (sätt i alla
tre Environments: Production, Preview, Development):

```
TRUSTPILOT_BUSINESS_UNIT_ID = <ditt business unit-ID>
TRUSTPILOT_VERIFICATION_ID  = <meta-värdet från steg 2>   # kan tas bort efter verifiering
TRUSTPILOT_API_KEY          = <valfritt, se steg 5>
```

**Redeploy** efter att värdena sparats — env-ändringar slår igenom först vid ny
deploy. Verifiera sedan:

- Footern visar Mini TrustBox (★ + "Trustpilot" + antal recensioner).
- En produktsida (`/produkt/...`) visar Product Reviews-widgeten i stället för de
  egna importerade recensionerna.

## Steg 5 — (Valfritt) AFS-API för auto-inbjudningar

Cronet `/api/cron/trustpilot-invite` körs **dagligen 09:00 svensk tid** och ber
kunder som fick sin order levererad för 7 dagar sedan om ett omdöme.

- **Utan `TRUSTPILOT_API_KEY`** (gratis): vi skickar ett eget branded mejl via
  Resend (`emails/trustpilot-review-request.tsx`) med en Trustpilot
  evaluate-länk som för-fyller order-ID + e-post → omdömet blir verifierat. Detta
  kräver bara `TRUSTPILOT_BUSINESS_UNIT_ID` + befintlig `RESEND_API_KEY`.
- **Med `TRUSTPILOT_API_KEY`** (Automatic Feedback Service): vi anropar i stället
  Trustpilots API så att Trustpilot mejlar inbjudan.

  AFS-API:t är OAuth2-skyddat. Skaffa access via Business-dashboarden →
  **Settings → Integrations → API** (kräver en betald plan). Lägg den giltiga
  **access-token** i `TRUSTPILOT_API_KEY`. Misslyckas AFS-anropet faller cronet
  automatiskt tillbaka på Resend-mejlet.

Idempotens: varje order bjuds in **max en gång** (DB-tabell `trustpilot_invites`),
så cronet kan köras om utan dubbletter.

### Testa cronet manuellt

`force=1` förbigår tidszons-grinden, `days=N` styr hur många dagar bakåt vi
letar fulfillade ordrar (0 = idag):

```
GET https://www.fyndplats.se/api/cron/trustpilot-invite?force=1&days=0
```

Svaret är alltid 200 med en summary (`scanned`, `candidates`, `sent`, `skipped`,
`failed`). Utan konfig svarar den `{ ok: true, skipped: "not_configured" }`.

---

## Var widgets syns när env är ifyllt

| Plats | Widget | Fil |
|---|---|---|
| Footer (alla sidor) | Mini TrustBox | `components/site.tsx` → `components/trustpilot.tsx` |
| PDP `/produkt/[slug]` | Product Reviews (per SKU) | `app/produkt/[slug]/page.tsx` |
| `<head>` (alla sidor) | Domän-verifierings-meta | `app/layout.tsx` |
| Mejl 7 dgr efter leverans | Review-request | `emails/trustpilot-review-request.tsx` |

Omdömessidans insamlingsknapp syns utan variabeln, för besökare som godkänt
alla cookies (`app/omdomen/page.tsx` → `components/trustpilot-insamling.tsx`).

Trustpilots bootstrap-script (`tp.widget.bootstrap.min.js`) laddas **bara** när en
widget faktiskt renderas, och delas (dedupas på src) mellan footer och PDP.
