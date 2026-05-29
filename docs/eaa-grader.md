# EAA/WCAG-grader — teknisk översikt

Validerings-spjutet för det rekommenderade verktyget (se `djupanalys-verktyg.md`).
Kör-checklista för en skarp vecka finns i `validering-vecka.md`.

## Flöde
1. Besökare klistrar in URL på `/grade`.
2. `POST /api/grade` hämtar sidans HTML och kör en statisk WCAG 2.1 AA-scan.
3. Resultat (betyg + topp-fel + valfri svensk AI-förklaring) visas direkt.
4. Köp-CTA → `POST /api/checkout` → Stripe Checkout (engångs-audit eller monitoring).
5. Efter köp genererar du leveransen på `/grade/rapport?url=...` (utskrift/PDF).

## Filer
| Fil | Roll |
|-----|------|
| `lib/accessibility/scanner.ts` | Hämtar HTML, regelmotor (13 kontroller), poäng A–F |
| `lib/accessibility/remediation.ts` | Åtgärdsförklaringar per feltyp (svenska) |
| `lib/payments/stripe.ts` | Checkout Session via Stripe REST (beroendefri) |
| `app/grade/page.tsx` | Publik landningssida + grader |
| `app/grade/layout.tsx` | SEO/OG-metadata |
| `app/grade/opengraph-image.tsx` | Genererad delningsbild |
| `app/grade/rapport/page.tsx` | Utskriftsvänlig rapport (den betalda leveransen) |
| `app/api/grade/route.ts` | Scan-endpoint + lead-fångst |
| `app/api/checkout/route.ts` | Skapar Stripe-betalning |

## Miljövariabler (se `.env.example`)
| Variabel | Krävs för | Notis |
|----------|-----------|-------|
| `ANTHROPIC_API_KEY` | AI-förklaring | Valfri — gradern funkar utan |
| `STRIPE_SECRET_KEY` | Checkout | `sk_test_…` först, sen `sk_live_…` |
| `STRIPE_PRICE_AUDIT` | Engångs-audit | `price_…` från Stripe Dashboard |
| `STRIPE_PRICE_MONITORING` | Monitoring | `price_…` (recurring) |
| `LEAD_WEBHOOK_URL` | Lead-lagring | Valfri (Zapier/Make/egen) |

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
- Lead-fångst loggar + skickar valfri webhook; ingen inbyggd DB.
- Betalningen verifieras inte via Stripe-webhook ännu (success-sidan litar på
  redirect); lägg till en webhook-bekräftelse innan skarp drift med riktiga pengar.
