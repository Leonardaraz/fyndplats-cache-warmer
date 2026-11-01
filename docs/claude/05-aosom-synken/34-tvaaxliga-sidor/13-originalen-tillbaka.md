#### Originalen tillbaka: inga Fyndplats-kort där leverantören har en måttbild (Leonards svar 11, 2026-10-24)

Leonard 2026-10-24, efter att ha sett de färgneutrala korten: *"Jag vill inte ha
Fyndplats-kort egentligen, varje produkt har ju sin egen original-specifikationsbild,
varje en ska vara kopplad till rätt variant."* De färgneutrala korten (föregående
avsnitt) ersattes därför på 17 sidor av leverantörens egna måttbilder, var och en
länkad till sin färg OCH storlek: 37 original tillbaka, 23 kort borttagna, 77 kombinationer
mätta live i en webbläsare utan avvikelse. Rundan, planerna och utfallet står i
`tools/polish-assets/runda-bilder-originalen-tillbaka/README.md`. Hamsterburen
`13fe619f` skrevs samma dag (Leonard: *Fixa*) och visar fem bilder i alla tre kombinationer.

☠️ **Skärpt 2026-10-27: inga Fyndplats-kort alls.** Leonard: *"I seo polering guiden du
följer står det att man ska göra sån där fyndplatskort bilder? Om det gör det, ta bort det
vi slutar med det"*. Guiden sa det (kortbygge i `bildmetoder.md` och `varianter.md`, steg 3d
i `agent-handoff.md` och ett färgkort i runbooken), och undantagen i punkt 1 och 2 nedan,
som tillät ett kort när leverantören saknar en måttbild eller originalet bär en logotyp,
är därför borta. Saknas en bild stryks den eller beskärs enligt runbookens undantag, och
finns inget användbart flaggas varianten till Leonard i `FLAGGADE.md`. Kortavsnitten och
listans ursprungliga ordalydelse ligger ordagrant i `docs/arkiv/fyndplats-kort.md`. De kort
som redan ligger på publicerade sidor ligger kvar: Leonard 2026-10-27, *låt de som är gjort
ligga kvar som det är* (ingen listning och ingen borttagning).

Regeln framåt, och den ersätter *ett kort per storlek*:

1. **Originalet först.** En måttbild som leverantören har för en färg och storlek ligger
   kvar och länkas till exakt den kombinationen. Saknar leverantören måttbilden för
   varianten, eller bär originalet en logotyp eller en text som inte får synas och inte går
   att beskära bort utan att måtten försvinner, byggs inget kort (2026-10-27). Före det
   byggdes kort i de fallen: hammockens 177 cm, kantskyddens Ø305 och Ø366, hundbäddens
   107 × 61 × 20 cm, kistans M och L och den svarta bänken `7b818c3b` (kortet i
   `runda-bilder-bank-svart-kort`, Leonards *Okej* på fråga 2b). De ligger kvar.
2. **De reservkort som finns kvar ägs av de färger och storlekar som saknar eget original,
   aldrig av storleken** (`ändra.json`: `["Vit", "Brun", "60 × 40 cm"]`). Fyra sådana finns
   kvar, på kattrappan, hundsängen och bokhyllan, och bara där en borttagning hade lämnat en
   vy med färre bilder än före. Nya reservkort byggs inte.
3. ☠️ **Färgens första foto länkas också till färgens storlekar.** Kombinationens första
   bild och variantTable-bilden är kandidaten som passar och är kopplad i flest optioner,
   och lika antal ger den tidigaste (`lib/variant-price.ts`). Ett original länkat till färg
   OCH storlek slår därför ett foto länkat bara till färgen och blir första bild: på
   skrivbordet började Vit × 80 cm med Vits måttbild och Svart × 63 cm med Svarts, tills
   fotot länkades också till storlekarna. Kontrollen är `bygg-forsta-koll.py` (ren
   läsning ur Wix, butikens regel): ett original eller kort får aldrig vara första bild.
4. ☠️ **Ett borttaget original läggs tillbaka vid samma fil-id** så länge bildstädningens
   karenstid inte gått ut. Fil-id:n står i `BILDER:`-raden i `bilder-bort`-körningens
   logg. Kör aldrig två `kor_wf.py` samtidigt (`kedja.sh` kör sidorna en och en).
5. ☠️ **En kortrunda ligger direkt under `tools/polish-assets/`.** Ignoreringen
   `*/orig/` gäller bara en nivå ned (nu även `**/orig/`), och kortets fotokälla är
   leverantörens foto. Kontrollera med `git check-ignore -v` före `git add`.

Efter varje skrivning på en sida med två val: `kolla-agare.py` (butikens sidodata),
`live-alla-kombinationer.sh` (webbläsaren) och `variantbild-farg.js` (Wix variantbild).
