# ASO-sökord

## Apple App Store – Keywords-fält

Apple har ett dedikerat, dolt sökordsfält (visas inte för användaren). Max
**100 tecken**, kommaseparerat, **inga mellanslag efter komman** (mellanslag
äter av teckenbudgeten).

```
fynd,shopping,kläder,hem,kök,deals,butik,sverige,klarna,kampanj
```

| | |
|---|---|
| Tecken | 62 / 100 |
| Antal ord | 10 |

**Regler vi följer:**
- Upprepa **inte** ord som redan finns i App Name eller Subtitle (`fyndplats`,
  `utvalda`) – Apple indexerar de fälten ändå, dubbletter slösar budget.
- Inga mellanslag efter komma (`fynd,shopping` inte `fynd, shopping`).
- Singularformer räcker – Apples sök matchar böjningar.
- Använd inte konkurrenters varumärken eller "gratis"/"bästa" (kan avvisas).

**Outnyttjad budget (38 tecken kvar)** – kandidater att lägga till om du vill
fylla på: `mode,inredning,rea,present,barn,skönhet`. Lägg bara till det som är
relevant; full budget är inte ett mål i sig.

## Google Play – inga sökordsfält

Google Play har **inget** separat sökordsfält. Sök-relevansen dras automatiskt
ur:
1. App-titeln ([`app-name.md`](app-name.md))
2. Kort beskrivning ([`short-description-sv.md`](short-description-sv.md))
3. Fullständig beskrivning ([`full-description-sv.md`](full-description-sv.md))

Därför är de viktigaste orden medvetet invävda i den löpande texten där. Stoppa
**inte** in keyword-listor i Play-beskrivningen ("keyword stuffing") – Google
straffar det.

**Prioriterade Play-sökord (täckta i beskrivningstexten):**
`fynd`, `fyndplats`, `smarta priser`, `kläder`, `mode`, `hem`, `inredning`,
`kök`, `skönhet`, `Klarna`, `fri frakt`, `öppet köp`, `kampanjer`,
`orderspårning`, `svensk e-handel`.
