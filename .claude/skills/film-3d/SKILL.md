---
name: film-3d
description: Reklamfilm i 3D på studionivå för Fyndplats, från plan till kontrollerade leveransfiler (Blender/Cycles som Python-modul i molnet, varorna som riktiga 3D-modeller byggda i kod, texter i Chromium, eget ljud). Använd när Leonard vill ha en animerad film, reel eller ett kampanjklipp i 3D. Bygger på verktygen i tools/film-black-friday/ och tools/film-fyndauktionen/. För enkla produktreels i CapCut på hans dator finns skillen fyndplats-video.
---

# Film i 3D

Två filmer finns som mallar, båda 25 s i 1080 × 1920 med strålföljd 3D:

- **`tools/film-black-friday/`:** Pristrappan (Black Friday 2026). Varan visas som ett foto på en
  bricka.
- **`tools/film-fyndauktionen/`:** Studion (Fyndauktionen året runt). Varorna själva är riktiga
  3D-modeller byggda i kod (`film/modeller/`), solen vandrar och det finns ett visningsrum.

Den nyaste mallen är den bästa utgångspunkten. Dess README beskriver delarna, kommandona och
lärdomarna, och den här filen säger i vilken ordning du gör saker.

## Först i varje ny chatt

1. Kör `installera.sh` i mallens mapp. Den installerar Blender (bpy) och biblioteken. Det tar
   några minuter, och molnmaskinen är tillfällig, så det behövs i varje ny chatt.
2. Läs båda README:erna, särskilt "Lärdomar".
3. En ny film får en egen kopia av mappen, `tools/film-<namn>/`, och mallarna lämnas orörda.

## Arbetsgång

1. **Plan med Leonards ja.** Idé, tidslinje i slag (120 BPM, `film/common.py`), texterna,
   vilka varor, vilka filer och när de publiceras. Allt filmen påstår ska gå att belägga.
2. **Varor och priser ur butiken**, aldrig för hand: `film.varudata <slug>` hämtar namn, pris,
   mått och alla bilder, och valet står i `assets/products/val.json`. Välj varor med tydlig form,
   utan märkesnamn och under auktionens pristak.
3. **Varorna som 3D-modeller:** en modul per vara i `film/modeller/` med produktsidans mått.
   `film.modellprov` visar varje modell från fyra vinklar bredvid produktbilden. Rätta tills
   den liknar produkten, och skicka arket till Leonard innan scenerna byggs.
4. **Nyckelrutor:** `film.provruta --tagning A --rutor ... --kvalitet utkast` bygger en tagning en
   gång och sätter ihop rutorna med texterna. Krockar mellan text och 3D, fel exponering och
   speglingar syns här.
5. **Skiss av hela filmen** med texter och ljud (`./kor.sh skiss A B C D E`, ca 1 s per ruta).
   Skicka den som provfilm, så att Leonard kan säga till om tempo, texter och innehåll.
6. **Slutrendering i delar:** `./kor_del.sh <kvalitet> <tagning> <från> <till> <bild|volym|bada>`
   i bakgrunden. Ett bakgrundsjobb stoppas efter två timmar, så varje del ska hinna klart på
   den tiden. Färdiga rutor hoppas över, så en stoppad del fortsätter där den slutade. Starta
   aldrig om samma långa jobb. Dela upp det.
7. **Granska i slutkvalitet, ruta för ruta:** ett kontaktark med var tolfte ruta och
   `film.koll` på den färdiga filmen. Förklara varje flaggad ruta innan du levererar. Ett menat
   ljushopp (stämpel, klipp, kamerasväng) ser i siffrorna ut precis som ett fel.
8. **Leverans:** `./leverans.sh`. Det kör prisvakten först och stoppar om ett pris inte är
   butikens eller en timpris-skylt inte är auktionens. Sedan gör det filmerna med och utan
   ljud, 4:5, kortversionen på 16 s i samma format, omslaget och kontrollen. Skicka filerna med
   SendUserFile och föreslå inläggstext.

## Regler som gäller filmen

- **Inga påhittade priser.** Startpriset är butikens ordinarie pris. Visas ett pris i en film
  som ska användas länge står det "Exempel" vid det. Aldrig "förr och nu".
- **Timpriser bara som auktionen ger dem** (Leonard 2026-11-27). Exempelvarans pris för varje
  timme får visas, räknat med auktionens egen formel och det tak som gäller i drift
  (`film/prisstege.py`). Stäm av mot varans stege i auktionens kö. Golvet kl 18 visas aldrig.
  Filmen visar aldrig större rabatt än en kund kan få, inte heller om Leonard ber om det: då blir
  reklamen vilseledande enligt marknadsföringslagen. Säg det och erbjud de riktiga stegen.
- **Inga leverantörsnamn.** Leverantörens varumärken och artikelnummer förekommer aldrig: inte
  i bild, text eller filnamn, och inte i commits eller loggar.
- **Märkets färger och typsnitt.** Svart #050505, guld #D9A53E–#F5DA98, kräm #FBF6EC. Orange
  bara på kuben och stämpeln. Typsnitten är Newsreader och Geist.
- **Text där den syns i apparna.** All text ligger inom y 290–1300, eftersom apparnas knappar
  täcker resten. Rubriken syns i första rutan. Omslagets text ligger inom 4:5-utsnittet
  (y 285–1635).
- **Pushar som inte bygger.** Bara `tools/`, `docs/` och markdown i pushen, så bygger Vercel
  inget. En gren som startats om efter en merge bygger ändå sin första push, och det är det
  kända läkningsbygget. Räkna efter i deployment-listan efter varje push.
- **Ljudet är bara mätt.** Be Leonard lyssna innan han publicerar.
