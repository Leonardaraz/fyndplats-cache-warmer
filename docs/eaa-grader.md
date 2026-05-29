# EAA/WCAG-grader — teknisk översikt

Validerings-spjutet för det rekommenderade verktyget (se `djupanalys-verktyg.md`).
Kör-checklista för en skarp vecka finns i `validering-vecka.md`.

## Flöde
1. Besökare klistrar in URL på `/grade`.
2. `POST /api/grade` hämtar sidans HTML **en gång** och kör fyra analyser på den:
   tillgänglighet (EAA/WCAG, huvudkategori + betald audit), SEO/teknik,
   AI-synlighet (AEO) och prestanda. De tre senare är gratis värde-höjare.
3. Resultat (totalbetyg + per kategori + valfri svensk AI-förklaring) visas direkt.
4. Köp-CTA → `POST /api/checkout` → Stripe Checkout (engångs-audit eller monitoring).
5. Efter köp genererar du leveransen på `/grade/rapport?url=...` — denna kör i
   **djup-läge** (`deep:true`): startsidan + upp till 3 viktiga undersidor,
   sammanslaget. Gratis-gradern på `/grade` kör snabbt enkel-sid.

## Filer
| Fil | Roll |
|-----|------|
| `lib/accessibility/scanner.ts` | Hämtar HTML, WCAG-regelmotor (17 kontroller), poäng A–F |
| `lib/accessibility/remediation.ts` | Åtgärdsförklaringar per feltyp (svenska) |
| `lib/seo/analyzer.ts` | SEO/teknik-kontroller (gratis värde-höjare) |
| `lib/aeo/analyzer.ts` | AI-synlighet/AEO-signaler (gratis värde-höjare) |
| `lib/perf/analyzer.ts` | Prestanda & best practices (gratis värde-höjare) |
| `lib/scan/types.ts` | Gemensamma typer + poängsättning för alla kategorier |
| `lib/scan/crawl.ts` | Hittar viktiga undersidor (djup granskning) |
| `lib/scan/aggregate.ts` | Slår ihop flersidiga resultat |
| `lib/payments/stripe.ts` | Checkout Session via Stripe REST (beroendefri) |
| `app/grade/page.tsx` | Publik landningssida + grader |
| `app/grade/layout.tsx` | SEO/OG-metadata |
| `app/grade/opengraph-image.tsx` | Genererad delningsbild |
| `app/grade/rapport/page.tsx` | Utskriftsvänlig rapport (den betalda leveransen) |
| `app/api/grade/route.ts` | Scan-endpoint + lead-fångst |
| `app/api/checkout/route.ts` | Skapar Stripe-betalning |
| `app/api/stripe-webhook/route.ts` | Verifierar betalningar (signaturkollad) |
| `app/api/compare/route.ts` | Jämför din butik mot konkurrenter |
| `app/api/history/route.ts` | Skanningshistorik + förändring över tid |
| `app/api/cron/rescan/route.ts` | Övervakning: re-skannar bevakade URL:er + larmar |
| `lib/scan/history.ts` | Snapshot-lagring, diff, regressionsdetektering |
| `lib/scan/compare.ts` | Jämförelselogik (rangordning, vinnare per kategori) |
| `lib/scan/prioritize.ts` | Snabba vinster + EAA-risknivå |

## Miljövariabler (se `.env.example`)
| Variabel | Krävs för | Notis |
|----------|-----------|-------|
| `ANTHROPIC_API_KEY` | AI-förklaring | Valfri — gradern funkar utan |
| `STRIPE_SECRET_KEY` | Checkout | `sk_test_…` först, sen `sk_live_…` |
| `STRIPE_PRICE_AUDIT` | Engångs-audit | `price_…` från Stripe Dashboard |
| `STRIPE_PRICE_MONITORING` | Monitoring | `price_…` (recurring) |
| `STRIPE_WEBHOOK_SECRET` | Betalningsverifiering | `whsec_…` — krävs för skarp drift |
| `LEAD_WEBHOOK_URL` | Lead-lagring | Valfri (Zapier/Make/egen) |
| `RESEND_API_KEY` / `EMAIL_FROM` / `EMAIL_OWNER` | Mejl vid köp | Valfria — utan dem skickas inga mejl |

## Köra lokalt
```bash
pnpm install
pnpm dev          # http://localhost:3000/grade
pnpm test         # enhetstester (scanner, remediation, stripe-kodning)
```

## Begränsningar / nästa steg
- Scannern är **statisk** (HTML utan rendering): fångar saknad alt-text, språk,
  titel, generiska/ tomma länkar, etiketter, iframe-titlar, autoplay, tabindex,
  rubriker. Den fångar **inte** kontrast, fokusordning eller JS-renderat innehåll
  — det kräver en uppgradering till `axe-core` med renderad DOM (headless-browser).
- **Historik & övervakning** sparas via en snapshot-lagring som default är
  **in-memory** (försvinner vid serverless-omstart). För varaktig historik/övervakning
  i produktion: backa `getSnapshotStore()` med en databas/Wix Data. Cron-jobbet
  `/api/cron/rescan` (dagligen, se vercel.json) kräver `CRON_SECRET` och larmar
  ägaren (`EMAIL_OWNER`) vid försämring.
- **Konkurrentjämförelse** (`/api/compare`) är helt stateless.
- Lead-fångst loggar + skickar valfri webhook; ingen inbyggd DB.
- Betalningar verifieras via `/api/stripe-webhook` (signaturkollad). Koppla på
  leverans-/orderlogik i händelsehanteraren `checkout.session.completed` innan
  skarp drift — just nu loggas bara köpet.
