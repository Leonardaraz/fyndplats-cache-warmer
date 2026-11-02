## ☠️ Domänen saknar riktiga länkar — det är bromsen nu (2026-09-24)

Semrush räknar 224 länkande domäner till fyndplats.se. De 40 starkaste är
alla automatiska spamsajter (`bye.fyi`, `metamagic.top`, `byteshort.xyz` …),
alltså ingen enda riktig svensk sajt. dealproffsen har 456, varav ett
tjugotal äkta: Reco.se, Cuponation, forum som ifokus, en affiliatesajt och
köpta artiklar på Expressen och lokaltidningar. Tekniken är mätt frisk
(Lighthouse SEO 100, komplett Product-JSON-LD), så varken fler sidor eller
mer teknik flyttar oss förbi dem. Planen och underlaget står i
`tools/polish-assets/seo-granskning-2026-09-24/`.

☠️ **Köp inte följbara länkar**, även om konkurrenten gör det. Googles
spampolicy kräver `rel="sponsored"` på betalda länkar. Prisjämförelse,
rabattkodssajter, affiliate och digital PR med vår egen prisdata är vägarna,
och alla kräver Leonard.

⚠️ **Profilerna finns redan. Kolla butikens `sameAs` innan du föreslår en.**
Google Företagsprofil (4,9), hitta.se, Trustpilot och Reco finns alla.
`app/layout.tsx` på `headless-site` listar de flesta, och granskningen
föreslog ändå att skapa dem. Deras länkar är `nofollow`, och Trustpilot och
Reco har 0 omdömen. Reco är inte ens verifierad, och Trustpilots
inbjudningscron togs ur schemat 2026-08-17 på Leonards beslut.

☠️ **En adress som rankar får aldrig sluta på `/butik`.** `/basta-i-test/massagepistoler`
låg 18:e på *massageapparat bäst i test*. Köpguiden blev tunn när vi slutade
sälja massagepistoler, och koden skickade vidare med 307 till `/butik`, så
rankningen följde med dit. Den pekar nu på bloggens guide (#647, med test).
Före en omdirigering: kontrollera vad adressen rankar på
(`rankande-adresser.tsv` i granskningen) och välj en sida som svarar på
samma fråga. Finns ingen sådan är en ärlig 404 bättre än en irrelevant sida.
