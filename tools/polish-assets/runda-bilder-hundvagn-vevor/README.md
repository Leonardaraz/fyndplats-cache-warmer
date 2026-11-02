# Hundvagnen `c21cf56b`: VEVOR:s rena originalbilder i galleriet (2026-11-02)

Leonard 2026-11-02: VEVOR-vagnen (4 hjul, svart, 66 lbs) är samma vara som vår hundvagn
`hundvagn-stor-hund-30-kg`, en äldre importerad sida. Sidan ommappas till VEVOR-artikeln (utkastet
`045bb40c` pensioneras) och får VEVOR:s rena bilder. Båda delarna är gjorda 2026-11-02 (se *Utfall*).

Samma vara är kontrollerat på bilderna: våra gamla bilder visar VEVOR-loggan på korgen, och
utkastets sex bilder är byte-lika med VEVOR:s original på plats 9, 8, 1, 10, 11 och 12
(importens regel). Plats 2–7 hos VEVOR (`f1`–`f6`) bär engelsk säljtext och används inte.

Galleriet efter skrivningen (bildplanen ersätter hela listan):

1. packshot snett framifrån, stängd sufflett (hero)
2. miljöbild med golden retriever-valp
3. packshot med öppen sufflett
4. vagnen med den avtagbara bärkorgen och djur
5. packshot från sidan
6. packshot snett bakifrån med öppningen
7. 8. Fyndplats-korten ligger kvar, sist (Leonard 2026-10-27: "låt de som är gjort ligga kvar")
9. måttbilden sist (siffror och enheter, ingen text), som alt-texten *Måttbild* styr

Borttagen: den första gamla bilden (en tidigare säljares sammansättning av VEVOR:s bilder, inte
ett original). Filerna ligger kvar i Media Manager.

Alla filer finns redan i Media Manager (id:n ur utkastet och sidan), så inget laddas upp. Skrivs
med workflowen "Polering — skriv bara bilderna" (`torr`, `skriv`, `verifiera`).

## Utfall (2026-11-02)

- Galleriet skrevs med bildplanen (plan-sha `eac0496f…b86f`). `verifiera` gav OK 16:31 UTC, och direkt i
  Wix och på livesidan ligger de nio bilderna i ordningen ovan med oförändrat pris (2 249 kr).
- Ommappningen är gjord: sidans mappningsrad bär nu VEVOR-artikeln och `prisLast`, så VEVOR-synken lämnar
  kundpriset i fred, och utkastet `045bb40c` är pensionerat (dolt, inte raderat). Märket VEVOR är satt på
  produkten. Hur och varför står i `tools/polish-gates/FLAGGADE-VEVOR.md` (cz–dd).
- Öppet: sidans text säger att bärkorgen kan spännas fast i bilen, men VEVOR:s sida nämner bara att den
  hopfällda vagnen får plats i bagageutrymmet. Texten är inte ändrad i den här rundan.
