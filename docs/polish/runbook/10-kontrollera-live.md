## 10. Kontrollera live

☠️ **Hämta aldrig en produktsida medan produkten är ett utkast.** Butiken cachar svaret,
som då är en 404, och visar det en god stund efter publiceringen. Därför görs ingen
förhandsvisning före skrivningen.

Efter `skriv`:

```bash
bash ../../polish-gates/hamta-live.sh 130   # väcker ISR, väntar 130 s och hämtar varje sida till live/
python3 ../../polish-gates/livegrind.py      # orddiff mot källfilen, homoglyfer, svep av sida, alt och SEO, flikar, kategori
python3 ../../polish-gates/livekoll.py       # InStock, brödsmula, <title> och meta mot seo.tsv, varje alt-text på sidan
```

- Läs HTTP-koderna som `hamta-live.sh` skriver ut. Koden `000` ger en tom fil som ser ren
  ut, och en enstaka 403 betyder ingenting. Hämta om det som faller innan du drar
  slutsatsen att sidan är trasig.
- `age` ska vara ungefär lika lång som pausen. `?cb=` hjälper inte på produktsidan. Har en
  sida nyss renderats väntar skriptet ut den först, alltså upp till fem minuter extra.
- Hämta från `https://www.fyndplats.se`, inte från adressen utan www. Den svarar med 308,
  och utan `-L` får du en tom sida.
- Sidhuvudet (`<title>` och meta) och brödtexten cachas var för sig och kan skilja sig åt i
  samma svar. Har Wix rätt värde men sidan fel, vänta en kvart och läs om sidan: butikens
  cron bygger om en ändrad sida inom fem minuter, men sidan cachas annars i sex timmar.
  Är sidan fortfarande fel efter det, jämför med Wix.
- Slår `livegrind.py` till på något som inte står i dina filer, jämför med en publicerad
  sida som rundan inte rört. Finns det där hör det till butikens ram.
- På en sida med flera färger ritar butiken bara den förvalda färgens bilder som
  alt-attribut i HTML:en. De andra färgernas alt-texter ligger i sidans data, i en karta
  fil → alt. `livekoll.py` letar där också och skriver i summeringen hur många alt-texter
  som bara sågs där (T1: 46 av 84). En alt-text som saknas på båda ställena är ett fel.
- Recensionerna: varje produkt ska visa de som steg 7 översatte. Saknas de, läs raden
  `recensioner: butiken` i steg 9:s körning. Föll anropet till butiken syns de först när dess cache gått ut,
  efter sex timmar.
- Öppna till sist en av rundans sidor och läs den som kund. Var avsnitten och bilderna
  hamnar syns bara där.
