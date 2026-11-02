## ☠️ Butikens sidovagnar läste bara de 1 200 nyaste produkterna (2026-09-24)

Tre hämtningar i butiken gick nyast först och slutade efter 12 sidor om 100.
De 1 200 nyaste produkterna är Aosom-varor utan färgval, och drygt hälften är
dolda utkast. Färgfiltret visade därför aldrig en färg (alla 239 produkter
med optioner låg bakom taket), och Google-flödet hade extrabilder på 557 av
3 393 produkter. Variantsvepet till flödet hade kapat tyst vid 10 000 i
mitten av november.

Lagat i #647: färgfrågan filtrerar på `options.id`, flödet faller tillbaka på
produktens galleri, och varianttaket loggar ett fel. Detaljerna står i
butikens `CLAUDE.md`. **Ett tak räknat nyast först ser inte katalogen**, och
`filter` går bara med på första sidan, eftersom filter plus markör svarar
`400 INVALID_CURSOR` även på `products/query`.
