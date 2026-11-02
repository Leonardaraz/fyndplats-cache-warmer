## 9. Skriv till Wix

1. Har rundan tagit flera timmar kör du om krock- och dubblettkontrollen först, eftersom en
   annan session kan ha publicerat under tiden. Committa sedan rundans filer och pusha
   grenen. Workflowen läser planen ur grenen.
2. Kör **"Polering — skriv en runda till Wix"** med `ref` satt till poleringsgrenen,
   `runda` satt till katalogens namn, `plan_sha256` från bygget och läget `torr`.
   Körningen prövar planen och recensionerna (steg 7) utan att skriva något.
3. Kör samma sak med läget `skriv`. Workflowen prövar recensionerna först och skriver
   ingenting om en produkt har väntande recensioner utan beslut. Sedan skriver den texten,
   som också publicerar produkten, och därefter bilderna, kategorierna och SKU:n, i den
   ordningen. Faller en
   produkt i ett steg stannar den efter det steget. Sedan väntar den 90 sekunder, läser tillbaka varje produkt separat och
   stämplar mappningsraden (`needsAiPolish: false`, `draftStatus: published`) för varje
   produkt som är helt verifierad. Sist skriver den recensionerna ur `recensioner.json`.

**Stannar körningen** har den skrivit alla produkter i det steg som föll, och textsteget har
redan publicerat dem, med importens bilder tills bildsteget körts. Rätta och kör `skriv`
igen direkt; alla steg tål omkörning. Faller bara återläsningen, stämpeln eller
recensionerna kör du läget `stampla`, som också skriver recensionerna. Kontrollera att körningen slutade `success` och inte `cancelled`: workflowen har
en gemensam kö, och en väntande körning avbryts när en annan session startar sin.

☠️ `ref` är `main` om du inte anger något, och där finns inte planen, så körningen stoppar
innan något skrivs. Flera sessioner kör samma workflow, så känn igen din körning på gren
och commit, inte på var den står i listan.

Ska något rättas efteråt: sök felet i alla rundans filer (`<kort>.html`, `namn.tsv`,
`seo.tsv`, `alt.tsv`) och i syskonens texter, rätta, bygg om planen och kör workflowen
igen. En omkörning lägger till kategorier men tar aldrig bort en felkopplad; det är en
egen åtgärd. Skriv aldrig för hand i Wix. En handbyggd PATCH tappar fält utan att säga
något (variantens `visible`, alt-texter, SKU), och svaret ser ändå lyckat ut.

**Pusha sällan.** Pushar som bara rör `tools/` och `docs/` bygger inte på Vercel
(`ignoreCommand` i `vercel.json`), men en lång rad sådana pushar ger till slut ett bygge
ändå, eftersom Vercels referenspunkt inte flyttas fram. Pusha när planen är klar och när
rundan är dokumenterad, inte efter varje fil. Undantaget är steg 7: `ids.tsv` ska vara
pushad före `las`, och `recensioner.json` före `torr`.
