# -*- coding: utf-8 -*-
SPEC = """<h2>Tekniska specifikationer</h2><ul><li><p><span style="font-weight: 700">Mått:</span> 82 × 99 × 103 cm (B × D × H)</p></li><li><p><span style="font-weight: 700">Mått utfälld:</span> 82 × 165 × 78 cm</p></li><li><p><span style="font-weight: 700">Sits:</span> 54 cm bred, 57 cm djup, sitthöjd 49 cm</p></li><li><p><span style="font-weight: 700">Ryggstöd:</span> 61 × 70 cm, 22 cm tjockt</p></li><li><p><span style="font-weight: 700">Massage:</span> Åtta punkter — rygg, ländrygg, lår och vader</p></li><li><p><span style="font-weight: 700">Värme:</span> Ländvärme</p></li><li><p><span style="font-weight: 700">Inställningar:</span> Tre lägen, timer 15, 30 eller 60 minuter</p></li><li><p><span style="font-weight: 700">Funktioner:</span> 145° ryggläge, vippfunktion, snurrbar, fotstöd</p></li><li><p><span style="font-weight: 700">Förvaring:</span> Två sidofickor och två mugghållare, Ø 9 cm</p></li><li><p><span style="font-weight: 700">Fjädring:</span> Pocketfjädrar</p></li><li><p><span style="font-weight: 700">Maxlast:</span> 135 kg</p></li><li><p><span style="font-weight: 700">Material:</span> Konstläder, skum, stål och plast</p></li><li><p><span style="font-weight: 700">Färg:</span> {FARG_SPEC}</p></li><li><p><span style="font-weight: 700">Kabellängd:</span> 1,8 m</p></li><li><p><span style="font-weight: 700">Effekt:</span> 12 W</p></li><li><p><span style="font-weight: 700">Vikt:</span> 50 kg</p></li><li><p><span style="font-weight: 700">Paketmått:</span> 80 × 57 × 47 cm</p></li><li><p><span style="font-weight: 700">Montering:</span> Krävs</p></li><li><p><span style="font-weight: 700">Ingår:</span> Massagefåtölj och fjärrkontroll</p></li></ul>"""

FAQ = """<h2>Vanliga frågor</h2><p><span style="font-weight: 700">Hur många massagepunkter?</span> Åtta — rygg, ländrygg, lår och vader.</p><p><span style="font-weight: 700">Har den värme?</span> Ja, ländvärme.</p><p><span style="font-weight: 700">Hur långt går ryggen bakåt?</span> 145°, manuellt.</p><p><span style="font-weight: 700">Hur fäller jag in fotstödet?</span> Tryck med hälarna mot mitten av fotdelen.</p><p><span style="font-weight: 700">Vippar och snurrar den?</span> Ja, båda.</p><p><span style="font-weight: 700">Hur mycket bär den?</span> 135 kg.</p><p><span style="font-weight: 700">Får en vanlig mugg plats?</span> Hållarna är 9 cm i diameter.</p><p><span style="font-weight: 700">Krävs montering?</span> Ja.</p>"""

SYSKON = ('Samma fåtölj finns också i '
  '<a href="https://www.fyndplats.se/produkt/{a}" target="_self">{an}</a>, '
  '<a href="https://www.fyndplats.se/produkt/{b}" target="_self">{bn}</a> och '
  '<a href="https://www.fyndplats.se/produkt/{c}" target="_self">{cn}</a>.')

S = {
 "gra":  ("massagefatolj-ljusgra-vippfunktion-landvarme",  "ljusgrått"),
 "brun": ("massagefatolj-morkbrun-vippfunktion-landvarme", "mörkbrunt"),
 "crem": ("massagefatolj-cremevit-vippfunktion-landvarme", "cremevitt"),
 "svart":("massagefatolj-svart-vippfunktion-landvarme",    "svart"),
}
def syskon(*keys):
    a,b,c = [S[k] for k in keys]
    return SYSKON.format(a=a[0],an=a[1],b=b[0],bn=b[1],c=c[0],cn=c[1])

# ---------------- LJUSGRÅ ----------------
GRA = (
'<p>En massagefåtölj i ljusgrått konstläder med åtta massagepunkter, ländvärme, '
'vippfunktion och två mugghållare. Fåtöljen mäter 82 × 99 cm och är 103 cm hög. '
'Sitsen är 54 cm bred och 57 cm djup på 49 cm höjd. Maxlast 135 kg.</p>'
'<h3>Åtta punkter ner till vaderna</h3>'
'<p>Massagen arbetar mot rygg, ländrygg, lår och vader, med tre lägen och tid på '
'15, 30 eller 60 minuter. Att punkterna når vaderna och inte stannar vid låren är '
'det som gör skillnad efter en dag i stillasittande — det är där blodet står still.</p>'
'<h3>Ljusgrått syns mot mörka golv</h3>'
'<p>Den ljusgrå tonen är den ljusaste av de fyra utan att vara vit, vilket gör den '
'lättare att placera i ett rum med mörkt golv eller mörka möbler än den svarta. '
'Konstlädret är slätt och matt, inte blankt, så det speglar inte fönstret bakom '
'sig på samma sätt som en glansig yta gör.</p>'
'<h3>Ländvärme ovanpå vibrationen</h3>'
'<p>Utöver massagen finns en separat värmefunktion i ländryggen. Värme och '
'vibration gör olika saker: vibrationen arbetar mekaniskt mot muskeln, värmen ökar '
'genomblödningen så att den ger efter snabbare.</p>'
'<h3>Fotstödet fälls in med hälarna</h3>'
'<p>Ryggen fälls för hand till 145° och fotstödet följer med upp. För att fälla in '
'det igen trycker du med hälarna mot mitten av fotdelen — inget handtag, ingen '
'spak. Utfälld mäter fåtöljen 82 × 165 cm och sjunker till 78 cm i höjd, så räkna '
'med en dryg halvmeter fritt framför den.</p>'
'<h3>Vippa, snurra och två mugghållare</h3>'
'<p>Fåtöljen vippar mjukt bakåt och snurrar fritt. Ryggen är 61 × 70 cm och 22 cm '
'tjock, sitsen byggd på pocketfjädrar för ett mer fjädrande sittande än ett '
'massivt skumblock ger. Armstöden har varsin infälld mugghållare på 9 cm i '
'diameter, och två sidofickor tar fjärrkontrollen. Kabeln är 1,8 m, effekten 12 W, '
'fåtöljen väger 50 kg och montering krävs. ' + syskon("brun","crem","svart") + '</p>'
+ SPEC.replace("{FARG_SPEC}","Ljusgrå") +
'<h2>Användning och skötsel</h2>'
'<p>Konstläder torkas av med en mjuk, väl urvriden trasa och ljummet vatten '
'varannan vecka och eftertorkas torrt så ingen fukt blir kvar i sömmarna. '
'☞ Ljusgrått är den ton där avfärgning från mörka jeans syns tidigast, och den '
'sätter sig i sitsens främre kant där tyget nöts mest. Torka den kanten varje '
'vecka i stället för varannan, så hinner färgen inte fastna i ytskiktet. Använd '
'aldrig sprit, aceton eller allrengöring med lösningsmedel, som löser ytskiktet — '
'konstläder behöver varken olja eller vax. Torka ur mugghållarna varje vecka så '
'spill inte rinner ner i armstödets stoppning. Dra ur kontakten före rengöring och '
'efterdra skruvarna efter första månaden.</p>' + FAQ)

# ---------------- MÖRKBRUN ----------------
BRUN = (
'<p>En massagefåtölj i mörkbrunt konstläder med åtta massagepunkter, ländvärme, '
'vippfunktion och två mugghållare. Fåtöljen mäter 82 × 99 cm och är 103 cm hög. '
'Sitsen är 54 cm bred och 57 cm djup på 49 cm höjd. Maxlast 135 kg.</p>'
'<h3>Ländvärmen är det som skiljer den från en vanlig recliner</h3>'
'<p>Utöver de åtta vibrationspunkterna finns en separat värmefunktion i '
'ländryggen. Värme och vibration gör olika saker: vibrationen arbetar mekaniskt '
'mot muskeln, värmen ökar genomblödningen så att den ger efter snabbare. Det är '
'kombinationen som är poängen — en fåtölj med bara vibration känns hårdare.</p>'
'<h3>Mörkbrunt är den mest förlåtande tonen</h3>'
'<p>Mörkbrunt döljer märken bättre än de ljusa tonerna i serien och drar mindre '
'uppmärksamhet till sig än den svarta, som blir en tydlig mörk fläck i ett ljust '
'rum. Ytan är matt och slät, med sömmar i samma ton som lädret.</p>'
'<h3>Åtta punkter, tre lägen, tre tider</h3>'
'<p>Massagen arbetar mot rygg, ländrygg, lår och vader. Tre lägen och timer på 15, '
'30 eller 60 minuter — att punkterna når hela vägen ner till vaderna är det som '
'gör skillnad efter en dag i stillasittande.</p>'
'<h3>145° för hand, fotstödet in med hälarna</h3>'
'<p>Ryggen fälls manuellt till 145° och fotstödet följer med upp. För att fälla in '
'det igen trycker du med hälarna mot mitten av fotdelen — inget handtag, ingen '
'spak. Utfälld mäter fåtöljen 82 × 165 cm och sjunker till 78 cm i höjd.</p>'
'<h3>Pocketfjädrar, vippa och snurra</h3>'
'<p>Fåtöljen vippar mjukt bakåt och snurrar fritt. Ryggen är 61 × 70 cm och 22 cm '
'tjock, sitsen byggd på pocketfjädrar i stället för ett massivt skumblock, vilket '
'ger ett fjädrande sittande som håller formen längre. Armstöden har varsin infälld '
'mugghållare på 9 cm i diameter, och två sidofickor tar fjärrkontrollen. Kabeln är '
'1,8 m, effekten 12 W, fåtöljen väger 50 kg och montering krävs. '
+ syskon("gra","crem","svart") + '</p>'
+ SPEC.replace("{FARG_SPEC}","Mörkbrun") +
'<h2>Användning och skötsel</h2>'
'<p>Konstläder torkas av med en mjuk, väl urvriden trasa och ljummet vatten '
'varannan vecka och eftertorkas torrt så ingen fukt blir kvar i sömmarna. '
'☞ Mörkbrunt döljer smuts, och det är just därför dammet får ligga kvar för länge '
'i sömmarna och nöta inifrån. Gå längs sömmarna med en mjuk borste en gång i '
'månaden, inte bara över de släta ytorna. Använd aldrig sprit, aceton eller '
'allrengöring med lösningsmedel, som löser ytskiktet — konstläder behöver varken '
'olja eller vax. Torka ur mugghållarna varje vecka så spill inte rinner ner i '
'armstödets stoppning. Dra ur kontakten före rengöring och efterdra skruvarna '
'efter första månaden.</p>' + FAQ)

# ---------------- CREMEVIT ----------------
CREM = (
'<p>En massagefåtölj i cremevitt konstläder med åtta massagepunkter, ländvärme, '
'vippfunktion och två mugghållare. Fåtöljen mäter 82 × 99 cm och är 103 cm hög. '
'Sitsen är 54 cm bred och 57 cm djup på 49 cm höjd. Maxlast 135 kg.</p>'
'<h3>Cremevitt gör fåtöljen mindre tung i rummet</h3>'
'<p>En recliner på 82 × 99 cm tar plats oavsett färg, men den cremevita tonen '
'gör att den läses som en ljus möbel i stället för ett mörkt block. Det är den '
'ljusaste av seriens fyra toner — och den som kräver mest av skötseln, vilket '
'stycket längst ner går igenom.</p>'
'<h3>Åtta punkter ner till vaderna</h3>'
'<p>Massagen arbetar mot rygg, ländrygg, lår och vader, med tre lägen och tid på '
'15, 30 eller 60 minuter. Att punkterna når vaderna och inte stannar vid låren är '
'det som gör skillnad efter en dag i stillasittande — det är där blodet står still.</p>'
'<h3>Ländvärme ovanpå vibrationen</h3>'
'<p>Utöver massagen finns en separat värmefunktion i ländryggen. Värme och '
'vibration gör olika saker: vibrationen arbetar mekaniskt mot muskeln, värmen ökar '
'genomblödningen så att den ger efter snabbare.</p>'
'<h3>Fotstödet fälls in med hälarna</h3>'
'<p>Ryggen fälls för hand till 145° och fotstödet följer med upp. För att fälla in '
'det igen trycker du med hälarna mot mitten av fotdelen — inget handtag, ingen '
'spak. Utfälld mäter fåtöljen 82 × 165 cm och sjunker till 78 cm i höjd.</p>'
'<h3>Vippa, snurra och två mugghållare</h3>'
'<p>Fåtöljen vippar mjukt bakåt och snurrar fritt. Ryggen är 61 × 70 cm och 22 cm '
'tjock, sitsen byggd på pocketfjädrar för ett mer fjädrande sittande än ett '
'massivt skumblock ger. Armstöden har varsin infälld mugghållare på 9 cm i '
'diameter, och två sidofickor tar fjärrkontrollen. Kabeln är 1,8 m, effekten 12 W, '
'fåtöljen väger 50 kg och montering krävs. ' + syskon("gra","brun","svart") + '</p>'
+ SPEC.replace("{FARG_SPEC}","Cremevit") +
'<h2>Användning och skötsel</h2>'
'<p>Konstläder torkas av med en mjuk, väl urvriden trasa och ljummet vatten '
'varannan vecka och eftertorkas torrt så ingen fukt blir kvar i sömmarna. '
'☞ På en cremevit yta är avfärgning från mörka jeans det som märks först, och den '
'går inte att tvätta bort när den väl dragit in i ytskiktet — den måste torkas '
'bort medan den är ny. Torka sitsen och sitsens främre kant varje vecka i stället '
'för varannan, och lägg en pläd över sitsen om någon sitter i nya mörka jeans. '
'Använd aldrig sprit, aceton eller allrengöring med lösningsmedel, som löser '
'ytskiktet — konstläder behöver varken olja eller vax. Torka ur mugghållarna varje '
'vecka så spill inte rinner ner i armstödets stoppning. Dra ur kontakten före '
'rengöring och efterdra skruvarna efter första månaden.</p>' + FAQ)

SIDOR = {
 "c396356f-ad67-4b33-8477-6c7da3439756": {
   "namn": "Massagefåtölj i ljusgrått konstläder – ländvärme, vippfunktion och 145°",
   "slug": "massagefatolj-ljusgra-vippfunktion-landvarme",
   "sku": "FP-massagefatolj-ljusgra-vippfunktion",
   "seoTitle": "Massagefåtölj ljusgrå, ländvärme | Fyndplats",
   "seoDesc": "Ljusgrå massagefåtölj i konstläder med åtta punkter mot rygg, ländrygg, lår och vader. Ländvärme, vippfunktion, 145° och två mugghållare.",
   "brod": GRA, "farg": "Ljusgrå",
   "alt": ["Ljusgrå massagefåtölj i konstläder med två mugghållare",
           "Fåtöljen sedd snett framifrån i ett ljust rum",
           "Måttritning över fåtöljen upprätt och nedfälld med maxlast",
           "Fåtöljen upprätt med fotstödet infällt",
           "Fåtöljen nedfälld med fotstödet ute"],
 },
 "a7f029bf-29b1-4a60-ba87-6c99fb28cb78": {
   "namn": "Massagefåtölj i mörkbrunt konstläder – ländvärme, vippfunktion och 145°",
   "slug": "massagefatolj-morkbrun-vippfunktion-landvarme",
   "sku": "FP-massagefatolj-morkbrun-vippfunktion",
   "seoTitle": "Massagefåtölj mörkbrun, ländvärme | Fyndplats",
   "seoDesc": "Mörkbrun massagefåtölj i konstläder med åtta punkter mot rygg, ländrygg, lår och vader. Ländvärme, vippfunktion, 145° och två mugghållare.",
   "brod": BRUN, "farg": "Mörkbrun",
   "alt": ["Mörkbrun massagefåtölj i konstläder med två mugghållare",
           "Fåtöljen sedd snett framifrån i ett ljust rum",
           "Måttritning över fåtöljen upprätt och nedfälld med maxlast",
           "Fåtöljen upprätt med fotstödet infällt",
           "Fåtöljen nedfälld med fotstödet ute"],
 },
 "7e84e482-8201-4104-a614-06c227d8f8e3": {
   "namn": "Massagefåtölj i cremevitt konstläder – ländvärme, vippfunktion och 145°",
   "slug": "massagefatolj-cremevit-vippfunktion-landvarme",
   "sku": "FP-massagefatolj-cremevit-vippfunktion",
   "seoTitle": "Massagefåtölj cremevit, ländvärme | Fyndplats",
   "seoDesc": "Cremevit massagefåtölj i konstläder med åtta punkter mot rygg, ländrygg, lår och vader. Ländvärme, vippfunktion, 145° och två mugghållare.",
   "brod": CREM, "farg": "Cremevit",
   "alt": ["Cremevit massagefåtölj i konstläder med två mugghållare",
           "Fåtöljen sedd snett framifrån i ett ljust rum",
           "Måttritning över fåtöljen upprätt och nedfälld med maxlast",
           "Fåtöljen upprätt med fotstödet infällt",
           "Fåtöljen nedfälld med fotstödet ute"],
 },
}
