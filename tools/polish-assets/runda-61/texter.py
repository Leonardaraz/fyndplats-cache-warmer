# -*- coding: utf-8 -*-
"""Runda 61 — texterna skrivs HÄR, aldrig inline i ett API-anrop.
Batch 64 mätte 9 fel mot 0 mellan de två sätten: en sträng i ett JSON-anrop
kan inte grep:as innan den lämnar chatten, och svaret ekar tillbaka exakt
det man skrev — det ser rätt ut för att det ÄR det man skrev."""

B = "https://www.fyndplats.se/produkt/"

P = {}

# ── f523b18d — 800-288V90GY, grått set med fyrskivig brödrost ───────────────
P["f523b18d"] = {
 "id": "f523b18d-c7a7-43f0-9c44-87da34dd037f",
 "ord": "frukostset i grått",
 "slug": "frukostset-gratt-fyrskivig",
 "name": "Frukostset i grått – vattenkokare 1,7 liter och brödrost för fyra skivor",
 "title": "Frukostset i grått, fyra skivor och 1,7 liter",
 "meta": "Frukostset i grått med vattenkokare på 1,7 liter och brödrost för fyra skivor med sju rostlägen. Avtagbart lock, kalkfilter och utdragbar smulbricka.",
 "html": (
  "<p>Ett <strong>frukostset i grått</strong> där kokaren och brödrosten har "
  "samma matta yta och samma polerade metalldetaljer. Vattenkokaren tar 1,7 "
  "liter och brödrosten har fyra fack, så flera portioner blir klara i samma "
  "omgång i stället för i tur och ordning.</p>"
  "<p><strong>Egenskaper</strong></p><ul>"
  "<li>Vattenkokare på 1,7 liter med avtagbart lock, så hela kannan går att fylla och skölja</li>"
  "<li>Brödrost med fyra separata fack och sju rostlägen</li>"
  "<li>Upptining, uppvärmning och stopp på brödrosten</li>"
  "<li>Termostat som stänger av kokaren vid kokpunkten, plus skydd mot torrkokning</li>"
  "<li>Facken är 3,5 cm breda och tar även tjockare skivor</li>"
  "<li>Avtagbart kalkfilter i kokaren och utdragbar smulbricka i rosten</li>"
  "</ul>"
  "<p>Vill du hellre ha höljet i stål finns ett fyrskivigt set till – "
  "<a href=\"https://www.fyndplats.se/produkt/frukostset-rostfritt-fyra-skivor\">"
  "frukostsetet i rostfritt</a> har dessutom två separata reglage.</p>"
  "<h2>Tekniska specifikationer</h2><ul>"
  "<li>Vattenkokarens volym: 1,7 liter</li>"
  "<li>Vattenkokarens effekt: 1850–2200 W</li>"
  "<li>Vattenkokarens mått: 23,6 × 16 × 27,6 cm</li>"
  "<li>Basplattan: Ø15,6 × 1,5 cm</li>"
  "<li>Brödrostens effekt: 1560–1860 W</li>"
  "<li>Brödrostens mått: 29,2 × 26,5 × 18,8 cm</li>"
  "<li>Rostfack: fyra, 13,5 × 3,5 × 13,5 cm styck</li>"
  "<li>Rostlägen: sju</li>"
  "<li>Spänning: 220–240 V, 50/60 Hz</li>"
  "<li>Sladdlängd: 0,7 m</li>"
  "<li>Färg: Grå med polerade metalldetaljer</li>"
  "<li>Material: Plast med metalldetaljer</li>"
  "<li>Vikt: 5,3 kg tillsammans</li>"
  "<li>Paketmått: 52 × 36 × 28 cm</li>"
  "</ul>"
  "<h2>Användning och skötsel</h2>"
  "<p>Ställ båda på en plan bänk med luft runt om. Vattenkokaren drar upp till "
  "2200 W och brödrosten upp till 1860 W, alltså <strong>4060 W</strong> om de "
  "går samtidigt — cirka 17,7 A, mer än en 16 A-grupp klarar. Kör dem en i "
  "taget, eller i uttag som sitter på var sin grupp.</p>"
  "<p>Dra ur sladden och låt svalna före rengöring. Smulbrickan dras ut "
  "underifrån och töms; kalkfiltret lyfts ur och sköljs under kranen. Torka "
  "höljena med fuktad trasa och milt diskmedel — ingen av delarna tål "
  "diskmaskin, och kokaren ska aldrig sänkas ned i vatten.</p>"
  "<h2>Vanliga frågor</h2>"
  "<p><strong>Hur många skivor tar brödrosten?</strong></p>"
  "<p>Fyra, i fyra separata fack. Varje fack är 3,5 cm brett.</p>"
  "<p><strong>Går det att rosta bara två skivor?</strong></p>"
  "<p>Ja. Facken fylls oberoende av varandra, så du behöver inte använda alla fyra.</p>"
  "<p><strong>Kan kokaren och brödrosten gå samtidigt?</strong></p>"
  "<p>Inte på samma säkringsgrupp. Tillsammans drar de 4060 W, vilket är mer än "
  "en vanlig 16 A-grupp är byggd för.</p>"
 ),
}

# ── 83d2db1a — 800-287V90CW, gräddvitt set med mekanisk termometer ──────────
P["83d2db1a"] = {
 "id": "83d2db1a-655c-4bf3-bef0-910b18935442",
 "ord": "frukostset i gräddvitt",
 "slug": "frukostset-graddvitt-termometer",
 "name": "Frukostset i gräddvitt – vattenkokare 1,7 liter och brödrost för två skivor",
 "title": "Frukostset i gräddvitt, 1,7 liter",
 "meta": "Frukostset i gräddvitt: vattenkokare på 1,7 liter med termometer på sidan och brödrost för två skivor med sju rostlägen och extra breda fack.",
 "html": (
  "<p>Ett <strong>frukostset i gräddvitt</strong> med rundade former och "
  "förkromade detaljer. Vattenkokaren bär en mekanisk termometer på sidan, så "
  "du ser hur långt vattnet kommit utan att lyfta på locket, och brödrosten "
  "har extra breda fack.</p>"
  "<p><strong>Egenskaper</strong></p><ul>"
  "<li>Vattenkokare på 1,7 liter med mekanisk termometer på sidan</li>"
  "<li>Brödrost för två skivor med sju rostlägen</li>"
  "<li>Extra breda fack som centrerar skivan av sig själva</li>"
  "<li>Uttagbar smulbricka och kalkfilter</li>"
  "<li>Kokaren och rosten har samma gräddvita yta och samma förkromade lister</li>"
  "</ul>"
  "<p>Samma set finns i svart – "
  "<a href=\"https://www.fyndplats.se/produkt/frukostset-termometer-svart\">"
  "frukostsetet med termometer</a> är identiskt så när som på färgen.</p>"
  "<h2>Tekniska specifikationer</h2><ul>"
  "<li>Vattenkokarens volym: 1,7 liter</li>"
  "<li>Vattenkokarens effekt: 1850–2200 W</li>"
  "<li>Vattenkokarens mått: 23,5 × 16 × 24,4 cm</li>"
  "<li>Brödrostens effekt: 780–930 W</li>"
  "<li>Brödrostens mått: 26,4 × 15,6 × 18,9 cm</li>"
  "<li>Rostfack: två, 13,5 × 3,5 × 13,5 cm styck</li>"
  "<li>Rostlägen: sju</li>"
  "<li>Spänning: 220–240 V</li>"
  "<li>Sladdlängd: 0,7 m</li>"
  "<li>Färg: Gräddvit med förkromade detaljer</li>"
  "<li>Material: Plast, stål och rostfritt stål</li>"
  "<li>Vikt: 3 kg tillsammans</li>"
  "<li>Paketmått: 54,5 × 23,5 × 26 cm</li>"
  "</ul>"
  "<h2>Användning och skötsel</h2>"
  "<p>Vattenkokaren drar upp till 2200 W och brödrosten upp till 930 W — "
  "tillsammans <strong>3130 W</strong>, alltså cirka 13,6 A. Det ryms på en "
  "16 A-grupp, men inte på en 10 A-grupp och inte i ett grenuttag som redan "
  "bär en annan effektstark maskin.</p>"
  "<p>Låt båda svalna och dra ur sladden före rengöring. Smulbrickan dras ut "
  "och töms, kalkfiltret sköljs under kranen. Torka höljena med fuktad trasa; "
  "kokaren ska aldrig sänkas ned i vatten och ingen del tål diskmaskin.</p>"
  "<h2>Vanliga frågor</h2>"
  "<p><strong>Vad visar termometern?</strong></p>"
  "<p>Den sitter på kokarens sida och visar hur varmt vattnet är medan det "
  "värms. Den ställer inte in någon temperatur — kokaren stänger av vid kokpunkten.</p>"
  "<p><strong>Hur breda är rostfacken?</strong></p>"
  "<p>3,5 cm, vilket rymmer både vanligt formbröd och tjockare skivor.</p>"
  "<p><strong>Kan kokaren och brödrosten gå samtidigt?</strong></p>"
  "<p>På en 16 A-grupp går det. Tillsammans drar de 3130 W, så undvik att "
  "dessutom koppla in en annan effektstark maskin i samma grenuttag.</p>"
 ),
}

# ── e7f69e8a — 800-287V90BK, svart syskon till 83d2db1a ─────────────────────
P["e7f69e8a"] = {
 "id": "e7f69e8a-3e3b-46e0-94ea-bd9bacae2c72",
 "ord": "frukostset med termometer",
 "slug": "frukostset-termometer-svart",
 "name": "Frukostset med termometer i svart – 1,7 liter och två rostfack",
 "title": "Frukostset med termometer, svart",
 "meta": "Svart frukostset med vattenkokare på 1,7 liter, mekanisk termometer på sidan och brödrost för två skivor med sju rostlägen och extra breda fack.",
 "html": (
  "<p>Ett <strong>frukostset med termometer</strong> i svart med förkromade "
  "lister. Termometern sitter på kokarens sida och visar hur varmt vattnet är "
  "medan det värms, och brödrostens fack är extra breda.</p>"
  "<p><strong>Egenskaper</strong></p><ul>"
  "<li>Vattenkokare på 1,7 liter med mekanisk termometer på sidan</li>"
  "<li>Brödrost för två skivor med sju rostlägen</li>"
  "<li>Extra breda fack som centrerar skivan av sig själva</li>"
  "<li>Uttagbar smulbricka och kalkfilter</li>"
  "<li>Svart yta på båda delarna, med förkromad list runt kokarens fot</li>"
  "</ul>"
  "<p>Samma set finns i ljust – "
  "<a href=\"https://www.fyndplats.se/produkt/frukostset-graddvitt-termometer\">"
  "frukostsetet i gräddvitt</a> har identiska mått och samma effekt.</p>"
  "<h2>Tekniska specifikationer</h2><ul>"
  "<li>Vattenkokarens volym: 1,7 liter</li>"
  "<li>Vattenkokarens effekt: 1850–2200 W</li>"
  "<li>Vattenkokarens mått: 23,5 × 16 × 24,4 cm</li>"
  "<li>Brödrostens effekt: 780–930 W</li>"
  "<li>Brödrostens mått: 26,4 × 15,6 × 18,9 cm</li>"
  "<li>Rostfack: två, 13,5 × 3,5 × 13,5 cm styck</li>"
  "<li>Rostlägen: sju</li>"
  "<li>Spänning: 220–240 V</li>"
  "<li>Sladdlängd: 0,7 m</li>"
  "<li>Färg: Svart med förkromade detaljer</li>"
  "<li>Material: Plast, stål och rostfritt stål</li>"
  "<li>Vikt: 2,98 kg tillsammans</li>"
  "<li>Paketmått: 54,5 × 23,5 × 26 cm</li>"
  "</ul>"
  "<h2>Användning och skötsel</h2>"
  "<p>Vattenkokaren drar upp till 2200 W och brödrosten upp till 930 W — "
  "tillsammans <strong>3130 W</strong>, alltså cirka 13,6 A. Det ryms på en "
  "16 A-grupp, men inte på en 10 A-grupp och inte i ett grenuttag som redan "
  "bär en annan effektstark maskin.</p>"
  "<p>Låt båda svalna och dra ur sladden före rengöring. Smulbrickan dras ut "
  "och töms, kalkfiltret sköljs under kranen. Torka höljena med fuktad trasa; "
  "kokaren ska aldrig sänkas ned i vatten och ingen del tål diskmaskin.</p>"
  "<h2>Vanliga frågor</h2>"
  "<p><strong>Vad visar termometern?</strong></p>"
  "<p>Vattnets temperatur medan det värms. Den ställer inte in något värde — "
  "kokaren stänger av av sig själv vid kokpunkten.</p>"
  "<p><strong>Vad väger setet?</strong></p>"
  "<p>2,98 kg tillsammans, alltså båda delarna räknade.</p>"
  "<p><strong>Kan kokaren och brödrosten gå samtidigt?</strong></p>"
  "<p>På en 16 A-grupp går det. Tillsammans drar de 3130 W, så undvik att "
  "dessutom koppla in en annan effektstark maskin i samma grenuttag.</p>"
 ),
}

# ── 375bb3c8 — 800-286V90CW, grädde med LED-display och 40–100 °C ───────────
P["375bb3c8"] = {
 "id": "375bb3c8-8ddd-4095-8ed3-913c77d7d6f9",
 "ord": "frukostset med LED-display",
 "slug": "frukostset-led-display-gradde",
 "name": "Frukostset med LED-display – vattenkokare 40–100 °C och brödrost",
 "title": "Frukostset med LED-display, 40–100 °C",
 "meta": "Frukostset med LED-display på vattenkokaren: välj mellan 40 och 100 °C och håll vattnet varmt i tre timmar. Brödrost för två skivor med sex rostlägen.",
 "html": (
  "<p>Ett <strong>frukostset med LED-display</strong> där du ställer vattnets "
  "temperatur mellan 40 och 100 °C i stället för att alltid koka fullt. "
  "Displayen visar både den temperatur vattnet har nu och den du ställt in, "
  "och kokaren håller kvar värmen i upp till tre timmar.</p>"
  "<p><strong>Egenskaper</strong></p><ul>"
  "<li>Temperaturval mellan 40 och 100 °C på vattenkokaren</li>"
  "<li>LED-display som visar både aktuell och inställd temperatur</li>"
  "<li>Varmhållning i upp till tre timmar</li>"
  "<li>Vattenkokare på 1,7 liter</li>"
  "<li>Brödrost för två skivor med sex rostlägen</li>"
  "<li>Upptining, uppvärmning och avbryt på brödrosten</li>"
  "<li>Automatisk avstängning och skydd mot torrkokning</li>"
  "<li>Uttagbar smulbricka</li>"
  "</ul>"
  "<p>Samma set finns i svart – "
  "<a href=\"https://www.fyndplats.se/produkt/frukostset-varmhallning-svart\">"
  "frukostsetet med varmhållning</a> har identiska mått och samma effekt.</p>"
  "<h2>Tekniska specifikationer</h2><ul>"
  "<li>Vattenkokarens volym: 1,7 liter</li>"
  "<li>Vattenkokarens effekt: 1850–2200 W</li>"
  "<li>Temperaturval: 40–100 °C</li>"
  "<li>Varmhållning: upp till 3 timmar</li>"
  "<li>Vattenkokarens mått: 23,2 × 15,9 × 24,8 cm</li>"
  "<li>Handtagets innermått: 12 × 3,2 cm</li>"
  "<li>Basplattan: Ø15,5 × 1,5 cm</li>"
  "<li>Brödrostens effekt: 750–900 W</li>"
  "<li>Brödrostens mått: 28,7 × 17 × 19,1 cm</li>"
  "<li>Rostlägen: sex</li>"
  "<li>Spänning: 220–240 V, 50/60 Hz</li>"
  "<li>Färg: Gräddfärgad med förkromade detaljer</li>"
  "<li>Material: Polypropen, stål och rostfritt stål</li>"
  "<li>Vikt: 4,17 kg tillsammans</li>"
  "<li>Paketmått: 54,5 × 23,5 × 26 cm</li>"
  "</ul>"
  "<h2>Användning och skötsel</h2>"
  "<p>Vattenkokaren drar upp till 2200 W och brödrosten upp till 900 W — "
  "tillsammans <strong>3100 W</strong>, alltså cirka 13,5 A. Det ryms på en "
  "16 A-grupp, men inte på en 10 A-grupp och inte i ett grenuttag som redan "
  "bär en annan effektstark maskin.</p>"
  "<p>Sätt en lägre temperatur när du brygger grönt te eller kaffe i "
  "pour over — vattnet behöver inte koka. Låt delarna svalna före rengöring, "
  "dra ut smulbrickan och töm den, och torka höljena med fuktad trasa. "
  "Kokaren ska aldrig sänkas ned i vatten.</p>"
  "<h2>Vanliga frågor</h2>"
  "<p><strong>Vad är den lägsta temperaturen?</strong></p>"
  "<p>40 °C. Därifrån går den att ställa upp till 100 °C.</p>"
  "<p><strong>Hur länge hålls vattnet varmt?</strong></p>"
  "<p>Upp till tre timmar efter att den inställda temperaturen nåtts.</p>"
  "<p><strong>Kan kokaren och brödrosten gå samtidigt?</strong></p>"
  "<p>På en 16 A-grupp går det. Tillsammans drar de 3100 W, så undvik att "
  "dessutom koppla in en annan effektstark maskin i samma grenuttag.</p>"
 ),
}

# ── 7805b8bc — 800-286V90BK, svart syskon med minnesfunktion ────────────────
P["7805b8bc"] = {
 "id": "7805b8bc-1f1b-4da1-9c4f-c52c8ff79e2c",
 "ord": "frukostset med varmhållning",
 "slug": "frukostset-varmhallning-svart",
 "name": "Frukostset med varmhållning – svart vattenkokare och brödrost",
 "title": "Frukostset med varmhållning, svart",
 "meta": "Svart frukostset: vattenkokaren håller vattnet varmt i tre timmar och minns inställningen när kannan lyfts av. Brödrost för två skivor, sex rostlägen.",
 "html": (
  "<p>Ett <strong>frukostset med varmhållning</strong> där kokaren håller "
  "vattnet varmt i upp till tre timmar och tar upp samma inställning igen när "
  "du lyfter av kannan och sätter tillbaka den. Brödrosten tar två skivor och "
  "har sex rostlägen.</p>"
  "<p><strong>Egenskaper</strong></p><ul>"
  "<li>Varmhållning i upp till tre timmar</li>"
  "<li>Minnesfunktion: inställningen ligger kvar i 300 sekunder när kannan lyfts av</li>"
  "<li>Temperaturval på vattenkokaren</li>"
  "<li>Vattenkokare på 1,7 liter</li>"
  "<li>Brödrost för två skivor med sex rostlägen</li>"
  "<li>Upptining, uppvärmning och avbryt på brödrosten</li>"
  "<li>Automatisk avstängning och skydd mot torrkokning</li>"
  "<li>Avtagbart lock och uttagbar smulbricka</li>"
  "</ul>"
  "<p>Samma set finns i ljust – "
  "<a href=\"https://www.fyndplats.se/produkt/frukostset-led-display-gradde\">"
  "frukostsetet med LED-display</a> har identiska mått och samma effekt.</p>"
  "<h2>Tekniska specifikationer</h2><ul>"
  "<li>Vattenkokarens volym: 1,7 liter</li>"
  "<li>Vattenkokarens effekt: 1850–2200 W</li>"
  "<li>Varmhållning: upp till 3 timmar</li>"
  "<li>Minnesfunktion: 300 sekunder</li>"
  "<li>Vattenkokarens mått: 23,2 × 15,9 × 24,8 cm</li>"
  "<li>Handtagets innermått: 12 × 3,2 cm</li>"
  "<li>Basplattan: Ø15,5 × 1,5 cm</li>"
  "<li>Brödrostens effekt: 750–900 W</li>"
  "<li>Brödrostens mått: 28,7 × 17 × 19,1 cm</li>"
  "<li>Rostlägen: sex</li>"
  "<li>Spänning: 220–240 V, 50/60 Hz</li>"
  "<li>Färg: Svart med förkromade detaljer</li>"
  "<li>Material: Plast, stål och rostfritt stål</li>"
  "<li>Vikt: 4,2 kg tillsammans</li>"
  "<li>Paketmått: 54,5 × 23,5 × 26 cm</li>"
  "</ul>"
  "<h2>Användning och skötsel</h2>"
  "<p>Vattenkokaren drar upp till 2200 W och brödrosten upp till 900 W — "
  "tillsammans <strong>3100 W</strong>, alltså cirka 13,5 A. Det ryms på en "
  "16 A-grupp, men inte på en 10 A-grupp och inte i ett grenuttag som redan "
  "bär en annan effektstark maskin.</p>"
  "<p>Låt delarna svalna och dra ur sladden före rengöring. Smulbrickan dras "
  "ut och töms, locket lyfts av så kannan går att skölja invändigt. Torka "
  "höljena med fuktad trasa; kokaren ska aldrig sänkas ned i vatten.</p>"
  "<h2>Vanliga frågor</h2>"
  "<p><strong>Vad gör minnesfunktionen?</strong></p>"
  "<p>Lyfter du av kannan från basen ligger inställningen kvar i 300 sekunder, "
  "så kokaren fortsätter på samma värde när du sätter tillbaka den.</p>"
  "<p><strong>Hur länge hålls vattnet varmt?</strong></p>"
  "<p>Upp till tre timmar.</p>"
  "<p><strong>Kan kokaren och brödrosten gå samtidigt?</strong></p>"
  "<p>På en 16 A-grupp går det. Tillsammans drar de 3100 W, så undvik att "
  "dessutom koppla in en annan effektstark maskin i samma grenuttag.</p>"
 ),
}

# ── 2f2c1c88 — 800-267V90CW, gräddvitt i rostfritt med fyra fack ────────────
P["2f2c1c88"] = {
 "id": "2f2c1c88-885e-49ad-97dd-572388c642dc",
 "ord": "frukostset i rostfritt",
 "slug": "frukostset-rostfritt-fyra-skivor",
 "name": "Frukostset i rostfritt – 1,7 liter och brödrost för fyra skivor",
 "title": "Frukostset i rostfritt, fyra skivor",
 "meta": "Frukostset i rostfritt stål med vattenkokare på 1,7 liter och brödrost med fyra fack och två separata reglage – sju rostlägen per fackpar.",
 "html": (
  "<p>Ett <strong>frukostset i rostfritt</strong> där brödrosten har fyra fack "
  "och två separata reglage. Två personer kan alltså rosta olika hårt i samma "
  "omgång. Vattenkokaren tar 1,7 liter, vilket räcker till sju koppar.</p>"
  "<p><strong>Egenskaper</strong></p><ul>"
  "<li>Brödrost med fyra fack och två separata reglage</li>"
  "<li>Sju rostlägen per fackpar, plus upptining, uppvärmning och avbryt</li>"
  "<li>Vattenkokare på 1,7 liter, som räcker till sju koppar</li>"
  "<li>Termostat, automatisk avstängning, skydd mot torrkokning och överhettningsskydd</li>"
  "<li>Hölje i rostfritt stål</li>"
  "<li>Basen vrids ett helt varv och har kabelförvaring undertill</li>"
  "<li>Fönster som visar vattennivån och halkfria fötter</li>"
  "<li>Uttagbar smulbricka och kalkfilter</li>"
  "</ul>"
  "<p>Vill du hellre ha en matt yta finns ett fyrskivigt set till – "
  "<a href=\"https://www.fyndplats.se/produkt/frukostset-gratt-fyrskivig\">"
  "frukostsetet i grått</a> har samma brödrostmått.</p>"
  "<h2>Tekniska specifikationer</h2><ul>"
  "<li>Vattenkokarens volym: 1,7 liter</li>"
  "<li>Vattenkokarens effekt: 1850–2200 W</li>"
  "<li>Vattenkokarens mått med bas: 21,1 × 16,5 × 25,2 cm</li>"
  "<li>Brödrostens effekt: 1560–1860 W</li>"
  "<li>Brödrostens mått: 29,2 × 26,5 × 18,8 cm</li>"
  "<li>Rostfack: fyra, 13,5 × 3,5 × 13,5 cm styck</li>"
  "<li>Rostlägen: sju per fackpar</li>"
  "<li>Spänning: 220–240 V, 50–60 Hz</li>"
  "<li>Sladdlängd: 0,7 m</li>"
  "<li>Färg: Gräddvit med rostfritt stål</li>"
  "<li>Material: Rostfritt stål, stål och plast</li>"
  "<li>Vikt: 4,4 kg tillsammans</li>"
  "<li>Paketmått: 54,5 × 35 × 27 cm</li>"
  "</ul>"
  "<h2>Användning och skötsel</h2>"
  "<p>Vattenkokaren drar upp till 2200 W och brödrosten upp till 1860 W, "
  "alltså <strong>4060 W</strong> om de går samtidigt — cirka 17,7 A, mer än "
  "en 16 A-grupp klarar. Kör dem en i taget, eller i uttag som sitter på var "
  "sin grupp.</p>"
  "<p>Torka det rostfria höljet med fuktad trasa och torka efter, så syns inga "
  "kalkränder. Smulbrickan dras ut och töms, kalkfiltret sköljs under kranen. "
  "Kokaren ska aldrig sänkas ned i vatten och ingen del tål diskmaskin.</p>"
  "<h2>Vanliga frågor</h2>"
  "<p><strong>Kan två personer rosta olika hårt samtidigt?</strong></p>"
  "<p>Ja. Facken sitter i två par med var sitt reglage, och varje par har sju lägen.</p>"
  "<p><strong>Hur många koppar räcker kokaren till?</strong></p>"
  "<p>Sju koppar på en full kanna om 1,7 liter.</p>"
  "<p><strong>Kan kokaren och brödrosten gå samtidigt?</strong></p>"
  "<p>Inte på samma säkringsgrupp. Tillsammans drar de 4060 W, vilket är mer "
  "än en vanlig 16 A-grupp är byggd för.</p>"
 ),
}

# ── 0ab3483a — 800-181V90PK, rosa bikakemönster (färgsyskon till b330de9c) ──
P["0ab3483a"] = {
 "id": "0ab3483a-e993-46ef-81f7-18502bb9f1cf",
 "ord": "rosa frukostset",
 "slug": "frukostset-rosa-bikakemonster",
 "name": "Rosa frukostset med bikakemönster – vattenkokare och brödrost",
 "title": "Rosa frukostset med bikakemönster",
 "meta": "Rosa frukostset med bikakemönster: vattenkokare på 1,7 liter med fönster för vattennivån och brödrost för två skivor med sju rostlägen.",
 "html": (
  "<p>Ett <strong>rosa frukostset</strong> där kokaren och brödrosten bär "
  "samma bikakemönster i reliefen. Vattenkokaren tar 1,7 liter, vilket räcker "
  "till sex koppar te, och brödrosten har sju rostlägen.</p>"
  "<p><strong>Egenskaper</strong></p><ul>"
  "<li>Vattenkokare på 1,7 liter — sex koppar te per kokning</li>"
  "<li>Fönster på sidan som visar hur mycket vatten som är kvar</li>"
  "<li>Brödrost för två skivor med sju rostlägen</li>"
  "<li>Skivorna centreras av sig själva och hoppar upp när de är klara</li>"
  "<li>Upptining och uppvärmning på brödrosten</li>"
  "<li>Termostat som stänger av kokaren vid kokpunkten</li>"
  "<li>Utdragbar smulbricka</li>"
  "</ul>"
  "<p>Samma set finns i mörkt – "
  "<a href=\"https://www.fyndplats.se/produkt/frukostset-bikakemonster-vattenkokare\">"
  "frukostsetet med bikakemönster</a> har samma mått i svart och koppar.</p>"
  "<h2>Tekniska specifikationer</h2><ul>"
  "<li>Vattenkokarens volym: 1,7 liter</li>"
  "<li>Vattenkokarens effekt: 1850–2200 W</li>"
  "<li>Vattenkokarens strömstyrka: 8,4–9,16 A</li>"
  "<li>Vattenkokarens mått med bas: 24,2 × 19,5 × 23,4 cm</li>"
  "<li>Brödrostens effekt: 780–930 W</li>"
  "<li>Brödrostens strömstyrka: 3,5–3,87 A</li>"
  "<li>Brödrostens mått: 27,4 × 17,7 × 18,8 cm</li>"
  "<li>Rostfack: två, 13,5 × 3,5 × 13,5 cm styck</li>"
  "<li>Rostlägen: sju</li>"
  "<li>Spänning: 220–240 V, 50/60 Hz</li>"
  "<li>Sladdlängd: 0,7 m</li>"
  "<li>Färg: Rosa</li>"
  "<li>Material: Polypropen och rostfritt stål</li>"
  "<li>Vikt: 3 kg tillsammans</li>"
  "<li>Paketmått: 56,7 × 22,6 × 27,1 cm</li>"
  "</ul>"
  "<h2>Användning och skötsel</h2>"
  "<p>Vattenkokaren drar upp till 2200 W och brödrosten upp till 930 W — "
  "tillsammans <strong>3130 W</strong>, alltså cirka 13,6 A. Det ryms på en "
  "16 A-grupp, men inte på en 10 A-grupp och inte i ett grenuttag som redan "
  "bär en annan effektstark maskin.</p>"
  "<p>Låt delarna svalna och dra ur sladden före rengöring. Smulbrickan dras "
  "ut underifrån och töms. Torka höljena med fuktad trasa och milt diskmedel; "
  "reliefen samlar damm och går lättast att torka med mjuk borste. Kokaren "
  "ska aldrig sänkas ned i vatten.</p>"
  "<h2>Vanliga frågor</h2>"
  "<p><strong>Hur många koppar räcker en kokning till?</strong></p>"
  "<p>Sex koppar te på en full kanna om 1,7 liter.</p>"
  "<p><strong>Vad är bikakemönstret?</strong></p>"
  "<p>Ett upphöjt sexkantsmönster i höljet, likadant på kokaren och brödrosten. "
  "Det är gjutet i materialet, inte tryckt.</p>"
  "<p><strong>Kan kokaren och brödrosten gå samtidigt?</strong></p>"
  "<p>På en 16 A-grupp går det. Tillsammans drar de 3130 W, så undvik att "
  "dessutom koppla in en annan effektstark maskin i samma grenuttag.</p>"
 ),
}
