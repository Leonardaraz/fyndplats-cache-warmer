---
name: film-3d
description: Reklamfilm i 3D på studionivå för Fyndplats, från plan till kontrollerade leveransfiler (Blender/Cycles som Python-modul i molnet, texter i Chromium, eget ljud). Använd när Leonard vill ha en animerad film, reel eller ett kampanjklipp i 3D. Bygger på verktyget i tools/film-black-friday/. För enkla produktreels i CapCut på hans dator finns skillen fyndplats-video.
---

# Film i 3D

Verktyget är `tools/film-black-friday/`: Pristrappan, Black Friday 2026, 25 s i 1080 × 1920
med strålföljd 3D. Dess README beskriver delarna, kommandona, vad som följer med till en ny
film och lärdomarna. Den här filen säger i vilken ordning du gör saker.

## Först i varje ny chatt

1. `tools/film-black-friday/installera.sh` installerar Blender (bpy) och biblioteken. Det tar
   några minuter, och molnmaskinen är tillfällig, så det behövs i varje ny chatt.
2. Läs `tools/film-black-friday/README.md`, särskilt "Ny film från mallen" och "Lärdomar".
3. En ny film får en egen kopia av mappen, `tools/film-<namn>/`. Pristrappan lämnas orörd som mall.

## Arbetsgång

1. **Plan med Leonards ja.** Idé, tidslinje i slag (120 BPM, `film/common.py`), texterna,
   vilka varor, vilka filer och när de publiceras. Allt filmen påstår ska gå att belägga.
2. **Varor och priser ur butiken**, aldrig för hand: `film.fetch_fynd` eller
   `film.hamta_kandidater`, och valet i `assets/products/val.json`. Titta på produktbilderna
   innan de används (`film/foton.py` gör bakgrunden vit och kan maska bort en infälld ruta).
3. **Skiss av hela filmen** med texter och ljud (`kvalitet skiss`, ca 1 s per ruta). Skicka den
   som provfilm, så att Leonard kan säga till om tempo, texter och innehåll.
4. **Stillbilder i slutkvalitet** av nyckelrutorna innan den långa renderingen. Krockar mellan
   text och 3D och fel exponering syns först här.
5. **Slutrendering i delar:** `./kor_del.sh <kvalitet> <tagning> <från> <till> <bild|volym|bada>`
   i bakgrunden. Ett bakgrundsjobb stoppas efter två timmar, så varje del ska hinna klart på
   den tiden. Färdiga rutor hoppas över, så en stoppad del fortsätter där den slutade. Starta
   aldrig om samma långa jobb. Dela upp det.
6. **Granska i slutkvalitet, ruta för ruta:** ett kontaktark med var tolfte ruta och
   `film.koll` på den färdiga filmen. Förklara varje flaggad ruta innan du levererar. Ett menat
   ljushopp (stämpel, klipp, kamerasväng) ser i siffrorna ut precis som ett fel.
7. **Leverans:** `./leverans.sh <antal>`. Det kör prisvakten först och stoppar om ett pris inte
   är butikens. Sedan gör det filmerna med och utan ljud, omslagen och kontrollen. Skicka
   filerna med SendUserFile och föreslå inläggstext.
8. **Avstämning nära publiceringen:** varor, antal och priser en gång till
   (`film.prisvakt`). Det som inte stämmer renderas om, och bara de tagningar som berörs.

## Regler som gäller filmen

- **Inga påhittade priser.** Bara butikens ordinarie pris, som "Startpris". Aldrig "förr och nu"
  och aldrig lägre priser. Auktionens golv och prisstege läses inte och visas inte.
- **Inga leverantörsnamn.** Leverantörens varumärken och artikelnummer förekommer aldrig: inte
  i bild, text eller filnamn, och inte i commits eller loggar.
- **Märkets färger och typsnitt.** Svart #050505, guld #D9A53E–#F5DA98, kräm #FBF6EC. Orange
  bara på kuben och stämpeln. Typsnitten är Newsreader och Geist.
- **Text där den syns i apparna.** All text ligger inom y 290–1300, eftersom apparnas knappar
  täcker resten. Rubriken syns i första rutan. Omslagets text ligger inom 4:5-utsnittet
  (y 285–1635).
- **Pushar som inte bygger.** Bara `tools/`, `docs/` och markdown i pushen, så bygger Vercel
  inget. Räkna efter i deployment-listan efter varje push.
- **Ljudet är bara mätt.** Be Leonard lyssna innan han publicerar.
