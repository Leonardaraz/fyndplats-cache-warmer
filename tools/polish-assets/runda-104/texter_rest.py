# -*- coding: utf-8 -*-
"""Runda 104:s tre sista utkast: två Aprilia-motorcyklar och en fyrhjuling.

☠️ TEXTEN SKRIVS I EN FIL FÖRST. Batch 64 mätte 9 fel mot 0 mellan inline-
   skrivning och fil + grind. En sträng i ett JSON-anrop kan inte grepas innan
   den lämnar chatten, och API-svaret ekar tillbaka exakt det man skrev.

Verifierade fakta:

  MOTORCYKLARNA (samma modell, två färger)
    Måttritningen (bild 3) bekräftar 106,5 × 56 × 80 cm, sits 35 × 14 cm och
    sitthöjd 48 cm — samma tal som leverantörens spec. Förstoringen av
    ritningens sitsruta avgjorde 35 mot den 36:a jag först läste av på ett
    kontaktark i 300 px.
    ☠️ 1e27f7e0 anges som "Gelb" i källan. Bilen är SVART med gula dekaler.

  FYRHJULINGEN
    ☠️ INGEN MÅTTRITNING FINNS. Måtten vilar därför på leverantörens spec
    ensam — precis det läge där runda 103 hittade ett spec-block KOPIERAT från
    en annan modell (#366). Kontrollen blev i stället fotot: hjulet spänner
    41–88 % av produktens höjd i studiobilden, alltså ~47 %, mot specens
    36/73 = 49 %. Talen hör ihop, så blocket är inte hämtat från en annan
    modell.
    ☠️ Leverantören motsäger sig själv om laddaren: punktlistan säger
    "Ladegerät im Lieferumfang enthalten", Lieferumfang listar bara quad +
    anvisning. Sidan påstår därför INGENTING om en laddare.
"""

# ── gemensamt ───────────────────────────────────────────────────────────────
MC_SPEC = ('<h2>Tekniska specifikationer</h2><ul>'
'<li><p><span style="font-weight: 700">Mått:</span> 106,5 × 56 × 80 cm (L × B × H)</p></li>'
'<li><p><span style="font-weight: 700">Sits:</span> 35 cm lång, 14 cm bred</p></li>'
'<li><p><span style="font-weight: 700">Sitthöjd:</span> 48 cm över marken</p></li>'
'<li><p><span style="font-weight: 700">Hjul:</span> Ø 33,5 cm i plast</p></li>'
'<li><p><span style="font-weight: 700">Platser:</span> 1</p></li>'
'<li><p><span style="font-weight: 700">Rekommenderad ålder:</span> 3–8 år</p></li>'
'<li><p><span style="font-weight: 700">Maxvikt:</span> 30 kg</p></li>'
'<li><p><span style="font-weight: 700">Hastighet:</span> 6 km/h</p></li>'
'<li><p><span style="font-weight: 700">Motorer:</span> Två, 12 V och 25 W</p></li>'
'<li><p><span style="font-weight: 700">Batteri:</span> 12 V, 4,5 Ah</p></li>'
'<li><p><span style="font-weight: 700">Laddtid:</span> 4–6 timmar första gången, 8–12 timmar därefter</p></li>'
'<li><p><span style="font-weight: 700">Körtid:</span> Upp till 1 timme</p></li>'
'<li><p><span style="font-weight: 700">Stödhjul:</span> Två, avtagbara</p></li>'
'<li><p><span style="font-weight: 700">Fjädring:</span> Stötdämpare vid bakhjulet</p></li>'
'<li><p><span style="font-weight: 700">Ljud och ljus:</span> Strålkastare, musik och USB</p></li>'
'<li><p><span style="font-weight: 700">Övrigt:</span> Batteriindikator</p></li>'
'<li><p><span style="font-weight: 700">Material:</span> Plast och metall</p></li>'
'<li><p><span style="font-weight: 700">Färg:</span> {FARG}</p></li>'
'<li><p><span style="font-weight: 700">Montering:</span> Krävs, av en vuxen</p></li>'
'<li><p><span style="font-weight: 700">Ingår:</span> Elmotorcykel, två stödhjul och bruksanvisning</p></li>'
'</ul>')

MC_SAKERHET = ('<h2>Innan barnet kör</h2><p>'
'<span style="font-weight: 700">Ålder 3–8 år. Maxvikt 30 kg.</span> '
'Motorcykeln är en åkleksak avsedd för lek på privat mark — trädgård, '
'gårdsplan eller inomhus på jämnt underlag. Den är inte gjord för allmän väg, '
'cykelbana eller trottoar. Ett barn ska alltid ha en vuxen inom syn- och '
'hörhåll, och hjälm hör till även när farten bara är 6 km/h. Låt stödhjulen '
'sitta kvar tills barnet håller balansen av sig självt; att ta bort dem för '
'tidigt är den vanligaste anledningen till att en tvåhjuling blir stående. '
'Laddningen sköts av en vuxen: låt motorcykeln och batteriet vila en stund '
'efter körning innan de laddas, och dra ur laddningen när den är klar. Torka '
'av med en fuktig trasa — spola aldrig av den och ställ den inte ute i regn. '
'Kontrollera hjulmuttrar och stödhjulens fästen innan säsongens första '
'körning.</p>')

MC_FAQ = ('<h2>Vanliga frågor</h2>'
'<p><span style="font-weight: 700">Vilken ålder passar den?</span> 3–8 år, '
'med en vuxen i närheten.</p>'
'<p><span style="font-weight: 700">Hur mycket bär den?</span> 30 kg, och det '
'är plats för ett barn.</p>'
'<p><span style="font-weight: 700">Hur fort går den?</span> 6 km/h, alltså '
'något snabbare än gångtakt.</p>'
'<p><span style="font-weight: 700">Går stödhjulen att ta bort?</span> Ja, '
'båda är avtagbara när barnet håller balansen själv.</p>'
'<p><span style="font-weight: 700">Hur länge går den på en laddning?</span> '
'Upp till en timme. Batteriindikatorn visar hur mycket som är kvar.</p>'
'<p><span style="font-weight: 700">Får den köras på trottoaren?</span> Nej — '
'den är avsedd för privat mark.</p>'
'<p><span style="font-weight: 700">Behöver den monteras?</span> Ja, en vuxen '
'sätter ihop den vid uppackning.</p>'
'<p><span style="font-weight: 700">Kan man spela egen musik?</span> Ja, via '
'USB.</p>')

MC_S = {
 "vit":   ("aprilia-elmotorcykel-barn-12v-vit",       "vitt"),
 "svart": ("aprilia-elmotorcykel-barn-12v-svart-gul", "svart och gult"),
}


def mc_syskon(nyckel):
    slug, namn = MC_S[nyckel]
    return ('Samma motorcykel finns också i <a href="https://www.fyndplats.se/produkt/%s" '
            'target="_self">%s</a>.' % (slug, namn))


def mc(farg_adj, farg_spec, h3_rubrik, h3_text, syskon_html):
    return (
    '<p>En ' + farg_adj + ' eldriven motorcykel för barn med avtagbara '
    'stödhjul, stötdämpare bak och strålkastare. Den mäter 106,5 × 56 cm och '
    'är 80 cm hög, går i 6 km/h och bär 30 kg. Rekommenderad ålder 3–8 år.</p>'

    '<h3>Stödhjulen är hela poängen med en tvåhjuling för treåringar</h3>'
    '<p>De två stödhjulen håller motorcykeln upprätt medan barnet lär sig gasa '
    'och styra, och skruvas av när balansen sitter. Det är därför samma '
    'motorcykel fungerar för en treåring och för en sjuåring: den växer med '
    'barnet i stället för att bli för lätt. Toppfarten är 6 km/h, alltså '
    'något snabbare än en vuxen som går.</p>'

    '<h3>Stötdämpare bak och 33,5 cm stora hjul</h3>'
    '<p>Bakhjulet sitter på en stötdämpare, och hjulen är 33,5 cm i diameter '
    'med mönstrad slitbana. Kombinationen är det som gör att den tar en '
    'gruskant utan att stanna tvärt — en slät plasthjulsmodell utan fjädring '
    'gör inte det. Framgaffeln är av metall, resten av kaross och skärmar är '
    'plast.</p>'

    '<h3>' + h3_rubrik + '</h3><p>' + h3_text + '</p>'

    '<h3>Sitsen sitter 48 cm över marken</h3>'
    '<p>Sitsen är 35 cm lång och 14 cm bred och ligger 48 cm över marken. Det '
    'är höjden som avgör om en treåring når ner med fötterna när den står '
    'still — mät barnets innerbenslängd innan du väljer, så slipper ni '
    'överraskningen vid uppackningen.</p>'

    '<h3>Strålkastare, musik och batteriindikator</h3>'
    '<p>Framlyktan tänds med en knapp, och via USB spelar barnet sina egna '
    'låtar. Batteriindikatorn visar hur mycket som är kvar, så du slipper '
    'gissa när det är dags att ladda. En laddning räcker upp till en timme; '
    'första laddningen tar 4–6 timmar och de följande 8–12.</p>'

    '<h3>Så här kommer den och vad du gör först</h3>'
    '<p>Motorcykeln levereras nedmonterad — en vuxen sätter ihop den och '
    'skruvar fast stödhjulen innan första körningen. ' + syskon_html + '</p>'

    + MC_SPEC.replace("{FARG}", farg_spec) + MC_SAKERHET + MC_FAQ)


VIT = mc(
    "vit och svart", "Vit och svart",
    "Vit kaross med röd och blå dekor",
    "Karossen är vit med svart sadel, svart ram och en röd-blå dekor längs "
    "tanken och sidokåporna. Det är den ljusare av de två färgerna — den mörka "
    "syns i länken längst ned.",
    mc_syskon("svart"))

SVART = mc(
    "svart och gul", "Svart och gul",
    "Svart kaross med gula dekaler",
    "Karossen är svart rakt igenom, med gula dekaler längs tanken, framskärmen "
    "och sidokåporna och gula fälgdetaljer. Den ljusare färgen finns i länken "
    "längst ned.",
    mc_syskon("vit"))

# ── fyrhjulingen ────────────────────────────────────────────────────────────
QUAD = (
'<p>En orange och svart eldriven fyrhjuling för barn med framåt- och '
'backläge, strålkastare och fjädring. Den mäter 100 × 65 cm och är 73 cm hög, '
'går i 3–8 km/h och bär 30 kg. Rekommenderad ålder 3–5 år.</p>'

'<h3>Back är det som gör att barnet inte fastnar</h3>'
'<p>Fyrhjulingen har både framåt- och backläge. Det låter som en detalj tills '
'ett femårigt barn kör in i ett hörn mellan altanen och häcken — utan back '
'måste en vuxen lyfta ut den, med back backar barnet själv. Farten ligger '
'mellan 3 och 8 km/h, alltså från gångtakt till lätt jogg.</p>'

'<h3>Fyra grova hjul och fjädring</h3>'
'<p>Hjulen är 36 cm i diameter och 15 cm breda med mönstrad slitbana, och '
'sitter på fjädrade ben. Det är den kombinationen som gör att den tar gräs, '
'grus och en gårdsplan i stället för att bara rulla på asfalt. Med 65 cm '
'bredd står den brett i förhållande till sin höjd på 73 cm.</p>'

'<h3>Sitsen är 37 cm lång och har ryggstöd</h3>'
'<p>Sitsen är 37 cm lång och 17 cm bred med ett ryggstöd bakom. Barnet sitter '
'grensle som på en riktig fyrhjuling och håller i styret med båda händerna, '
'och fotstegen på sidorna ger stöd åt fötterna under körning.</p>'

'<h3>Strålkastare och musik via USB</h3>'
'<p>Fyrhjulingen har strålkastare fram och en inbyggd MP3-spelare med '
'USB-ingång, så barnet kan spela sina egna låtar. En laddning räcker '
'45 minuter beroende på hur hårt den körs, och laddtiden är 8–12 timmar.</p>'

'<h3>Så här kommer den och vad du gör först</h3>'
'<p>Fyrhjulingen levereras nedmonterad — en vuxen sätter ihop den innan '
'första körningen. Ladda batteriet fullt innan barnet kör första gången.</p>'

'<h2>Tekniska specifikationer</h2><ul>'
'<li><p><span style="font-weight: 700">Mått:</span> 100 × 65 × 73 cm (L × B × H)</p></li>'
'<li><p><span style="font-weight: 700">Sits:</span> 37 cm lång, 17 cm bred</p></li>'
'<li><p><span style="font-weight: 700">Hjul:</span> Ø 36 cm, 15 cm breda</p></li>'
'<li><p><span style="font-weight: 700">Platser:</span> 1</p></li>'
'<li><p><span style="font-weight: 700">Rekommenderad ålder:</span> 3–5 år</p></li>'
'<li><p><span style="font-weight: 700">Maxvikt:</span> 30 kg</p></li>'
'<li><p><span style="font-weight: 700">Hastighet:</span> 3–8 km/h</p></li>'
'<li><p><span style="font-weight: 700">Körlägen:</span> Framåt och back</p></li>'
'<li><p><span style="font-weight: 700">Batteri:</span> 12 V, 10 Ah</p></li>'
'<li><p><span style="font-weight: 700">Laddtid:</span> 8–12 timmar</p></li>'
'<li><p><span style="font-weight: 700">Körtid:</span> 45 minuter</p></li>'
'<li><p><span style="font-weight: 700">Fjädring:</span> Ja</p></li>'
'<li><p><span style="font-weight: 700">Ljud och ljus:</span> Strålkastare, MP3-spelare och USB</p></li>'
'<li><p><span style="font-weight: 700">Material:</span> Metall och plast</p></li>'
'<li><p><span style="font-weight: 700">Färg:</span> Orange och svart</p></li>'
'<li><p><span style="font-weight: 700">Montering:</span> Krävs, av en vuxen</p></li>'
'<li><p><span style="font-weight: 700">Ingår:</span> Fyrhjuling och bruksanvisning</p></li>'
'</ul>'

'<h2>Innan barnet kör</h2><p>'
'<span style="font-weight: 700">Ålder 3–5 år. Maxvikt 30 kg.</span> '
'Fyrhjulingen är en åkleksak avsedd för lek på privat mark — trädgård, '
'gårdsplan eller inomhus på jämnt underlag. Den är inte gjord för allmän väg, '
'cykelbana eller trottoar. Ett barn ska alltid ha en vuxen inom syn- och '
'hörhåll, och hjälm hör till även i gångtakt. Backläget ska visas för barnet '
'innan första körningen, annars används det inte när det behövs. Laddningen '
'sköts av en vuxen: låt fyrhjulingen och batteriet vila en stund efter '
'körning innan de laddas, och dra ur laddningen när den är klar. Torka av med '
'en fuktig trasa — spola aldrig av den och ställ den inte ute i regn. '
'Kontrollera hjulmuttrar och styrets fäste innan säsongens första körning.</p>'

'<h2>Vanliga frågor</h2>'
'<p><span style="font-weight: 700">Vilken ålder passar den?</span> 3–5 år, '
'med en vuxen i närheten.</p>'
'<p><span style="font-weight: 700">Hur mycket bär den?</span> 30 kg, och det '
'är plats för ett barn.</p>'
'<p><span style="font-weight: 700">Hur fort går den?</span> 3–8 km/h — från '
'gångtakt till lätt jogg.</p>'
'<p><span style="font-weight: 700">Kan den backa?</span> Ja, den har både '
'framåt- och backläge.</p>'
'<p><span style="font-weight: 700">Hur länge går den på en laddning?</span> '
'45 minuter, beroende på hur hårt den körs. Laddtiden är 8–12 timmar.</p>'
'<p><span style="font-weight: 700">Får den köras på trottoaren?</span> Nej — '
'den är avsedd för privat mark.</p>'
'<p><span style="font-weight: 700">Behöver den monteras?</span> Ja, en vuxen '
'sätter ihop den vid uppackning.</p>'
'<p><span style="font-weight: 700">Kan man spela egen musik?</span> Ja, via '
'USB och den inbyggda MP3-spelaren.</p>')

SIDOR = {
 "5e9cc2d2-f709-44a8-a3e7-7d3824141ba8": {
   "namn": "Aprilia elmotorcykel för barn 12 V – stödhjul, USB och musik, vit",
   "slug": "aprilia-elmotorcykel-barn-12v-vit",
   "sku": "FP-aprilia-12v-vit",
   "variantId": "f4a0e1ab-d201-4ed9-85f8-2a5291fec066",
   "seoTitle": "Aprilia elmotorcykel för barn 12 V, vit | Fyndplats",
   "seoDesc": "Eldriven barnmotorcykel för 3–8 år. 12 V, 6 km/h, avtagbara stödhjul, stötdämpare bak, strålkastare och USB-musik. Maxvikt 30 kg, sitthöjd 48 cm.",
   "brod": VIT,
 },
 "1e27f7e0-e304-4104-a417-8562a2176fd5": {
   "namn": "Aprilia elmotorcykel för barn 12 V – stödhjul, USB och musik, svart",
   "slug": "aprilia-elmotorcykel-barn-12v-svart-gul",
   "sku": "FP-aprilia-12v-svart-gul",
   "variantId": "48e7f9d8-5a2f-440b-b714-e5b21549499b",
   "seoTitle": "Aprilia elmotorcykel för barn 12 V, svart | Fyndplats",
   "seoDesc": "Eldriven barnmotorcykel för 3–8 år. 12 V, 6 km/h, avtagbara stödhjul, stötdämpare bak, strålkastare och USB-musik. Maxvikt 30 kg, sitthöjd 48 cm.",
   "brod": SVART,
 },
 "883db249-fa84-4836-b7ff-6bba71d6b596": {
   "namn": "Eldriven fyrhjuling för barn 12 V – back, strålkastare och MP3, orange",
   "slug": "elfyrhjuling-barn-12v-back-mp3-orange",
   "sku": "FP-elfyrhjuling-12v-orange",
   "variantId": "834ed9dd-d51c-49ca-8791-626c63069e2a",
   "seoTitle": "Eldriven fyrhjuling för barn 12 V, orange | Fyndplats",
   "seoDesc": "Eldriven barnfyrhjuling för 3–5 år. 12 V, 3–8 km/h, framåt och back, fjädring, strålkastare och MP3 via USB. Maxvikt 30 kg, 100 × 65 × 73 cm.",
   "brod": QUAD,
 },
}
