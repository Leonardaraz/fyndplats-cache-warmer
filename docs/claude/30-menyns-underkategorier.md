## ☠️ Menyns underkategorier syntes inte för Google (2026-09-24)

Mega-menyn renderade bara panelen man hovrar över, och Googlebot hovrar
aldrig. Mätt i produktion, både i server-HTML och renderat i Chromium utan
interaktion: **startsidan länkade till 0 av 105 underkategorier**, en
produktsida till 1 (bläddringsraden). Bara /butik (48) och avdelningssidornas
Förfina-chips, som syns först när JS har kört, länkade dit. Startsidan är den
enda sidan med externa länkar (Semrush: 62 + 23 refererande domäner, ingen
annan sida har någon).

En PageRank-modell över sajtens egna länkar gav därför varje
sökordskategori ungefär samma interna värde som en medianprodukt. Kategorin
fanns, med text och FAQ, men sajten pekade inte på den.

Lagat i #647 (`2513ae85`): alla tio paneler ligger i HTML:en, dolda med
`hidden`. Modellen ger underkategorierna 45–86 gånger mer, och en
medianprodukt behåller 77–82 %. Underlaget och skripten står i
`tools/polish-assets/meny-underkategorier/`.

**En ny kategori får sina länkar från menyn, och menyn läser Wix.** Den som
skapar en kategori behöver alltså inte lägga in en länk någonstans. Men den
som bygger en länk som bara renderas vid hovring, klick eller efter mount har
byggt en länk som Google inte ser. Regeln och testet står i butikens
`CLAUDE.md` (`lib/meganav-ssr.test.ts`).
