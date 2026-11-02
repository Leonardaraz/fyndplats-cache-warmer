### Nattens utkast blev sju sammanslagna sidor: mät varje vy live (2026-10-22)

Nattimporten 2026-10-22 skapade 40 utkast (04:40–04:44 UTC). 27 blev egna sidor (N294–N298), 10 blev färg eller storlek på publicerade sidor
(T84, T86 och T87) och 3 pensionerades: en ommappad hundbädd (T85, som också fick en publicerad brun sida som färg) och två dubbletter.
Rundorna, tiderna och utfallen står i `tools/polish-gates/FLAGGADE.md`. Det som gäller framöver:

1. ☠️ **Efter varje sammanslagning mäts varje färg- och storleksvy live** (`node tools/polish-gates/live-galleri.mjs <slug>`, ett val i taget).
   `katalogkontroll-farger.js` ser bara varje vals första länkade bild och var ren på alla sju sidorna, medan butikens vyer visade foton av fel färg eller
   storlek på fyra av dem (hinderset, sminkpallen, spegelskåpet och matstationen). Ett olänkat foto visas under en färg det inte hör till.
2. **Länka dem med `tools/polish-gates/bygg-lank.py`.** Fotona anges som de sex första tecknen i fil-id:t efter `b379ce_` (exakt en träff i galleriet).
   `lank-om-bilder.js` släpper aldrig en gammal länk och rör aldrig galleriet; kör sedan `variantbild.yml` med `ids` och mät om. Högst tre sidor per
   ExecuteWixAPI-körning.
3. **Resultatet ska vara en vy per färg med sina egna foton plus de gemensamma korten.** Efter länkningen visar matstationen Vit 8, Grå 10 och Espresso 9
   bilder (båda storlekarna delar färgens vy), och katalogkontrollen gav 0 val med samma första bild.
4. ☠️ **Ett kedjeskript som kopierats från förra rundan ska få rundnamnet bytt i `ghw.py write`-raden.** N298:s skript pekade först på N297 med N298:s
   sha. Det stoppades efter tolv sekunder och inget skrevs, men det var sha-kontrollen som hade fällt körningen och inte raden som var rätt.
