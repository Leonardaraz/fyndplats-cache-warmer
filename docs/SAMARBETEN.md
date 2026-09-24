# Samarbeten: märkta annonsinlägg i bloggen

Beslut 24 september 2026:

- Vi säljer märkta samarbetsinlägg i bloggen. Aldrig omärkta inlägg och aldrig vanliga dofollow-länkar mot betalning.
- Pris: 1 500 kr per inlägg inklusive text, före plattformens avgift. På Collaborator motsvarar det 135 euro.
- Vi skriver texten. Köparen godkänner den, och Leonard godkänner innan den publiceras.
- Märkningen görs för hand i varje inlägg. Testet `lib/local-blog.test.ts` stoppar inlägg där något steg har glömts.
- Moms och bokföring av intäkterna stäms av med redovisningskonsulten före första fakturan.

## Ämnen

Ja: hem och inredning, trädgård, husdjur, gör-det-själv och verktyg, friluftsliv, camping, resor och fritid, tjänster för hemmet (el, bredband, försäkring, hantverkare).

Nej, oavsett pris: casino och spel, lån och krediter, krypto, vuxeninnehåll, läkemedel och hälsopåståenden, butiker som konkurrerar med oss.

Varför nej: reklam för spel och krediter har egna lagkrav (licens, måttfullhet, obligatorisk information) och den som publicerar kan bli medansvarig. Tredjepartssidor om casino och lån på en sajt som handlar om något annat är dessutom Googles eget exempel på "site reputation abuse".

## Så ska ett annonsinlägg se ut

1. Rubriken börjar med "Annons:", både i `title` och `seo_title`.
2. Första raden i texten är annonsraden: `*Annons – i samarbete med Företaget AB. Länkarna till Företaget AB är betalda.*`
3. Partnerns länkar skrivs `[text](https://foretaget.se/sida "sponsored")`. Då får länken `rel="sponsored"`. Högst två partnerlänkar.
4. Inga andra externa länkar i ett annonsinlägg. Länkar till våra egna sidor går bra.
5. Texten ska vara användbar för våra läsare: 600–900 ord på svenska. Inga leverantörsnamn eller husmärken, inga påståenden vi inte kan stå för och inget som låtsas vara ett oberoende test.
6. Kör `npm test` innan inlägget publiceras.
7. Inlägget ligger kvar så länge sajten finns (Collaborators villkor).

Mall:

```md
---
title: "Annons: Rubrik"
seo_title: "Annons: Kort rubrik"
slug: rubrik-som-slug
meta_description: "…"
category: Samarbeten
publish_date: 2026-10-01
cover: /blog-rubrik.jpg
alt: "…"
---

# Annons: Rubrik

*Annons – i samarbete med Företaget AB. Länkarna till Företaget AB är betalda.*

Ingress …

## Mellanrubrik

… hos [Företaget AB](https://foretaget.se/sida "sponsored") …
```

## Collaborator

Leonard skapar kontot själv. Sedan:

1. Lägg till fyndplats.se som publicist (seller).
2. Verifiera ägarskapet med Google Analytics 4 eller Search Console. Det är Collaborators förstahandsval.
3. Länktyp: sponsored.
4. Pris: 135 euro, vi skriver texten. Collaborator tar 15 % när pengarna tas ut.
5. Ämnen enligt listan ovan. Neka allt annat.
6. När en beställning kommer: Claude skriver utkastet, köparen godkänner, Leonard godkänner, sedan publiceras inlägget. Köparen har 72 timmar på sig att godkänna det färdiga jobbet.

Profiltext på engelska (plattformen är internationell):

> Fyndplats.se is a Swedish online store for home, garden, pets, outdoor and leisure, with a blog of buying guides and seasonal tips for Swedish shoppers.
>
> We publish sponsored articles written in Swedish by our own team:
> - A 600–900 word article on a topic you choose within our niches, approved by you before publishing
> - Up to 2 links to your site, marked rel="sponsored"
> - Clearly labelled as advertising ("Annons"), as Swedish marketing law requires
> - Published on fyndplats.se/blogg and kept for the lifetime of the site
>
> Topics: home and interior, garden, pets, DIY and tools, outdoor, camping, travel, leisure and home services (electricity, broadband, insurance, tradespeople).
> Not accepted: gambling, loans and credit, crypto, adult content, pharmaceuticals and online stores competing with ours.

Samma text på svenska, till köpare som hör av sig direkt:

> Fyndplats.se är en svensk nätbutik för hem, trädgård, djur, friluftsliv och fritid, med en blogg med köpguider och säsongstips.
>
> Vi publicerar märkta samarbetsinlägg som vi skriver själva:
> - 600–900 ord på svenska om ett ämne du väljer inom våra områden. Du godkänner texten innan den publiceras.
> - Upp till två länkar till din sajt, märkta rel="sponsored".
> - Tydligt märkt som annons, som marknadsföringslagen kräver.
> - Publiceras på fyndplats.se/blogg och ligger kvar så länge sajten finns.
>
> Ämnen: hem och inredning, trädgård, husdjur, gör-det-själv och verktyg, friluftsliv, camping, resor, fritid och tjänster för hemmet.
> Vi tar inte emot: spel, lån och krediter, krypto, vuxeninnehåll, läkemedel och butiker som konkurrerar med oss.
