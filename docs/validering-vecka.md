# Valideringsveckan — körbar playbook (EAA-grader)

> Mål: bevisa att svenska Wix-/webbutiker **betalar** för en EAA-åtgärd — innan vi
> bygger mer. Signalen vi jagar är **betalda förbokningar/audits**, inte klick.
> Faller signalen → pivotera till näst högst rankade idé (se `djupanalys-verktyg.md`)
> utan att ha bränt månader på kod.

## Vad som redan är byggt (i denna PR)
- ✅ Publik gratis-grader: `/grade` (URL → WCAG-betyg + topp-fel + svensk AI-förklaring)
- ✅ Betalflöde: `/api/checkout` (Stripe, engångs-audit + monitoring)
- ✅ Delbar landningssida med OG-metadata

## Engångsuppsättning (du, ~15 min — rör bara dina egna konton)
1. **Stripe** (börja i testläge): skapa två produkter i Stripe Dashboard
   - Engångs-audit, 1 495 kr → kopiera dess `price_...`
   - Bevakning, 299 kr/mån (recurring) → kopiera dess `price_...`
2. **Vercel env** (projektet): lägg in
   - `STRIPE_SECRET_KEY` (`sk_test_...` först)
   - `STRIPE_PRICE_AUDIT`, `STRIPE_PRICE_MONITORING`
   - `ANTHROPIC_API_KEY` (för svenska AI-förklaringar — valfritt, gradern funkar utan)
3. Klicka igenom hela köpet en gång i testläge. När det känns bra → byt till `sk_live_...`.

## Dag-för-dag

### Dag 1–2 — Få gradern live & vass
- [ ] Deploya branchen (preview-URL räcker för start).
- [ ] Testa gradern mot 5–10 riktiga svenska Wix-butiker, notera typiska fel.
- [ ] Justera ev. rubriker/copy på `/grade` efter vad som faktiskt hittas.

### Dag 3–4 — Skarpt erbjudande
- [ ] Sätt slutgiltig copy: "EAA-audit för din butik — komplett WCAG-genomgång +
      prioriterad fixlista, levererad inom 5 dagar."
- [ ] Bekräfta att success/cancel-sidorna känns trygga (`?betalning=klar`/`avbruten`).
- [ ] Förbered en enkel mall för hur den manuella auditen levereras (du gör de
      första för hand och mäter tiden — så vet vi om det är lönsamt).

### Dag 5–7 — Driv trafik mot de skarpaste leden
- [ ] Kör gratis-scan på 20–30 svenska Wix-butiker i förväg.
- [ ] Kall DM/mejl med **deras egen scan bifogad** ("hittade X fel som kan bryta mot
      EAA — vill du ha hela listan + fix?"). Personligt > massutskick.
- [ ] Posta gratis-gradern i 1–2 FB-grupper för svensk e-handel.
- [ ] Mät dagligen: scans, e-postleads, **betalda köp**.

## GO / NO-GO efter veckan
- **GO:** ≥3–5 betalda förbokningar ELLER ≥1 betald audit, ELLER lead→betald i nivå
  med 2–5 %-benchmarken. → Bygg vidare: full `axe-core`-audit, Wix App Market-paketering.
- **SVAGT men intressant:** många leads, få köp → testa lägre pris/annan vinkel en vecka till.
- **NO-GO:** låg scan→lead och inga köp → pivotera till Wix-app eller Nordisk
  dropship-tool (näst högst rankade i analysen).

## Mätvärden att logga (enkel tabell räcker)
| Dag | Scans | E-postleads | Audit-köp | Monitoring-köp | Kommentar |
|----|------|-------------|-----------|----------------|-----------|

## Vad vi medvetet INTE gör i valideringen
- Ingen full automatiserad remediering — auditen levereras manuellt först.
- Ingen overlay-widget (legalt/rykte-bakslag — se regulatorisk analys).
- Inga löften om juridisk efterlevnad; vi säljer audit + åtgärdsplan.
