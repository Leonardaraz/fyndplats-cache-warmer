# T113 – rosenträdets adress utan `2-pack` (2026-11-04)

Leonard 2026-11-04 (*"3 fixa"*, svar på punkt 3 i rapporten): rosenträdets adress innehöll fortfarande `2-pack`,
fast sidan sedan sammanslagningen (T112) säljer både ett och två träd. Värden är `9eec6413`.

- **Före:** `konstgjorda-rosentrad-vita-rosor-kruka-2-pack-90-cm`
- **Efter:** `konstgjorda-rosentrad-vita-rosor-kruka-90-cm` (ledig, ingen annan produkt bar den)

## Hur

En liten runda med bara värden: filerna är T112-rundans, filtrerade till kortet `9eec6413`, med en enda ändring
(`slugs.txt`). `bygg-skrivplan.py`: alla grindar rena, plan `3567ca2b…` (1 produkt). Texten, bilderna, kategorierna
och priserna är oförändrade, så `skriv` gör samma sak som T112 och rättar bara adressen.

1. **Torr** (18:19 UTC, körning 1313): text, media, kategorier och SKU 1 av 1, recensioner fel 0.
2. **301 från den gamla adressen FÖRE skrivningen** (`redirect-add`, `force`, 18:30 UTC, utanför Aosoms synkfönster
   :12–:29): `…-2-pack-90-cm` → `/produkt/konstgjorda-rosentrad-vita-rosor-kruka-90-cm`. Raden återläst i
   Wix Data innan skrivningen startade.
3. **Skriv** (18:33–18:34 UTC, körning 1315): text, media, kategorier och SKU ok, variantbilderna rättade (1 sida,
   0 avvikelser), 1 av 1 helt verifierad och stämplad, recensioner fel 0.
4. **Givarens 301 flyttad** (`redirect-add`, normalt läge, 18:35 UTC): `konstgjord-stamros-vita-rosor-kruka` pekar
   nu rakt på den nya adressen med `?variant=42aed61e-…` (1 träd), så ingen kedja av två 308:or uppstår. Det var den enda
   rad av 566 som pekade på den gamla adressen.

## Återläst i Wix (18:36 UTC)

Slugen ny (revision 12 → 15), namn, galleriet (9 bilder, samma ordning), länkarna (`2 träd` plats 1–2, `1 träd`
plats 5–8), varianternas bilder, SKU:er, priserna (979 och 599 kr) och lagret är oförändrade. Ingen produkt har den gamla
slugen, och den nya är synlig.

## Live (18:36 UTC)

- Nya adressen svarar 200; canonical, `og:url` och erbjudandena i JSON-LD bär den nya adressen.
- Gamla adressen svarar 308 till den nya. Givarens adress svarar 308 direkt till `…-90-cm?variant=42aed61e-…`.
- `live-bilder.mjs`: `2 träd` visar 5 bilder (979 kr), `1 träd` 7 (599 kr), 9 unika, som före bytet.

## Att veta

- Butikens cache av listorna är gammal en stund: *Liknande produkter* på sidan listade sidan själv under den gamla
  adressen (länken ger 308 till sidan). Det rättar sig när listorna räknas om.
- Flöden och sitemap som byggs ur butikens produktlista byter adress när listorna räknas om (inte mätt här). Tills
  dess följer de gamla länkarna 301:an.
- `slugs.txt` i T112-rundan bär fortfarande den gamla adressen. Den rundans plan ska inte köras om; den här är
  facit för sidan nu.
