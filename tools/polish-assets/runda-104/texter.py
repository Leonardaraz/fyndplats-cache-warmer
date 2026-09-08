# -*- coding: utf-8 -*-
# Modell B — tre eldrivna barnbilar i UTV-stil, 96 x 61 x 56 cm.
# Alla tal ur källans spec-block OCH bekräftade på måttritningen (bild 3).
# ☠️ Åldern är 3-5 år enligt spec OCH ritning. Bildernas alt-text säger 3-8;
#    den siffran har inget stöd och används INTE.

SPEC = """<h2>Tekniska specifikationer</h2><ul><li><p><span style="font-weight: 700">Mått:</span> 96 × 61 × 56 cm (L × B × H)</p></li><li><p><span style="font-weight: 700">Sits:</span> 36 cm bred, 18 cm djup</p></li><li><p><span style="font-weight: 700">Hjul:</span> Ø 24 cm</p></li><li><p><span style="font-weight: 700">Rekommenderad ålder:</span> 3–5 år</p></li><li><p><span style="font-weight: 700">Maxvikt:</span> 30 kg</p></li><li><p><span style="font-weight: 700">Hastighet:</span> 3–7 km/h</p></li><li><p><span style="font-weight: 700">Körlägen:</span> Två hastigheter med pedalen, tre med fjärrkontrollen</p></li><li><p><span style="font-weight: 700">Fjärrkontrollens räckvidd:</span> 15 m</p></li><li><p><span style="font-weight: 700">Motorer:</span> 2 × 12 V, 25 W</p></li><li><p><span style="font-weight: 700">Batteri:</span> 12 V, 4,5 Ah</p></li><li><p><span style="font-weight: 700">Laddare:</span> 12 V / 0,5 A</p></li><li><p><span style="font-weight: 700">Laddtid:</span> 8–12 timmar</p></li><li><p><span style="font-weight: 700">Körtid:</span> 45 minuter</p></li><li><p><span style="font-weight: 700">Fjädring:</span> Fyrhjulsfjädring</p></li><li><p><span style="font-weight: 700">Säkerhet:</span> Säkerhetsbälte och mjukstart</p></li><li><p><span style="font-weight: 700">Ljud och ljus:</span> Strålkastare, tuta, musik och USB</p></li><li><p><span style="font-weight: 700">Material:</span> Plast och metall</p></li><li><p><span style="font-weight: 700">Färg:</span> {FARG}</p></li><li><p><span style="font-weight: 700">Vikt:</span> 15,6 kg</p></li><li><p><span style="font-weight: 700">Paketmått:</span> 90 × 53 × 29 cm</p></li><li><p><span style="font-weight: 700">Ingår:</span> Elbil, fjärrkontroll, laddare och bruksanvisning</p></li></ul>"""

SAKERHET = """<h2>Innan barnet kör</h2><p><span style="font-weight: 700">Ålder 3–5 år. Maxvikt 30 kg.</span> Bilen är en åkleksak avsedd för lek på privat mark — trädgård, gårdsplan eller inomhus på jämnt underlag. Den är inte gjord för allmän väg, cykelbana eller trottoar. Ett barn ska alltid ha en vuxen inom syn- och hörhåll, och fjärrkontrollen finns just för att du ska kunna ta över när barnet kör mot något det inte ser. Laddningen sköts av en vuxen: anslut laddaren först till bilen och sedan till vägguttaget, och dra ur den när den 8–12 timmar långa laddningen är klar. Låt bilen och batteriet vila en stund innan de laddas efter körning. Torka av karossen med en fuktig trasa — spola aldrig av den och ställ den inte ute i regn. Kontrollera hjulmuttrar och bältesfäste innan säsongens första körning.</p>"""

FAQ = """<h2>Vanliga frågor</h2><p><span style="font-weight: 700">Vilken ålder passar den?</span> 3–5 år, med en vuxen i närheten.</p><p><span style="font-weight: 700">Hur mycket bär den?</span> 30 kg.</p><p><span style="font-weight: 700">Hur fort går den?</span> 3–7 km/h — två hastigheter med pedalen och tre med fjärrkontrollen.</p><p><span style="font-weight: 700">Hur långt räcker fjärrkontrollen?</span> 15 meter.</p><p><span style="font-weight: 700">Hur länge går den på en laddning?</span> 45 minuter. Laddtiden är 8–12 timmar.</p><p><span style="font-weight: 700">Får den köras på trottoaren?</span> Nej — den är avsedd för privat mark.</p><p><span style="font-weight: 700">Kan man spela egen musik?</span> Ja, via USB.</p><p><span style="font-weight: 700">Ingår batteri och laddare?</span> Ja, båda.</p>"""

SYSKON = ('Samma bil finns också i <a href="https://www.fyndplats.se/produkt/{a}" '
  'target="_self">{an}</a> och <a href="https://www.fyndplats.se/produkt/{b}" '
  'target="_self">{bn}</a>.')
S = {"rosa":  ("elbil-barn-12v-utv-fjarrkontroll-rosa",   "rosa"),
     "orange":("elbil-barn-12v-utv-fjarrkontroll-orange", "orange"),
     "bla":   ("elbil-barn-12v-utv-fjarrkontroll-bla",    "blått")}
def syskon(a, b):
    x, y = S[a], S[b]
    return SYSKON.format(a=x[0], an=x[1], b=y[0], bn=y[1])

def bygg(farg_adj, farg_spec, ingress2, h3_farg, h3_fargtext, sysk):
    return (
    '<p>En ' + farg_adj + ' eldriven barnbil i UTV-stil med fjärrkontroll för föräldern, '
    'säkerhetsbälte och fyrhjulsfjädring. Bilen mäter 96 × 61 cm och är 56 cm '
    'hög, går i 3–7 km/h och bär 30 kg. Rekommenderad ålder 3–5 år.</p>'
    '<h3>Fjärrkontrollen är det som gör den köpbar för en treåring</h3>'
    '<p>Barnet kör själv med pedal och ratt, men du har en fjärrkontroll med 15 '
    'meters räckvidd som tar över när som helst. Det är skillnaden mot en bil '
    'utan: en treåring hinner inte alltid bromsa för en trappkant, och då '
    'behöver någon annan kunna göra det. Pedalen ger två hastigheter, '
    'fjärrkontrollen tre — alla inom 3–7 km/h, ungefär rask gångtakt.</p>'
    '<h3>Mjukstart och bälte mot det plötsliga ryckit</h3>'
    '<p>Bilen drar igång mjukt i stället för att rycka till när pedalen trycks '
    'ner. Det låter litet, men ryck framåt är det som får små barn att tappa '
    'ratten. Sitsen har säkerhetsbälte, och fyrhjulsfjädringen tar upp '
    'gruskanter och gräsklackar så att bilen inte studsar.</p>'
    '<h3>' + h3_farg + '</h3><p>' + h3_fargtext + '</p>'
    '<h3>Strålkastare, tuta, musik och USB</h3>'
    '<p>Strålkastarna lyser på riktigt, tutan fungerar, och det finns musik '
    'inbyggd. Via USB spelar du barnets egna låtar i stället för de fem '
    'melodier som följer med — den detaljen avgör ofta hur länge bilen används '
    'innan ljudet stängs av permanent.</p>'
    '<h3>45 minuters körning per laddning</h3>'
    '<p>Batteriet är 12 V och 4,5 Ah och räcker omkring 45 minuter, sedan tar '
    'laddningen 8–12 timmar med laddaren som ingår. Två motorer på 12 V och '
    '25 W driver bakhjulen. Bilen väger 15,6 kg och sitsen är 36 cm bred och '
    '18 cm djup. ' + sysk + '</p>'
    + SPEC.replace("{FARG}", farg_spec) + SAKERHET + FAQ)

ROSA = bygg("rosa", "Rosa",
  None,
  "Rosa som syns i gräset",
  "Den rosa karossen är kraftigt mättad, inte pastell, och skiljer sig tydligt "
  "från både gräs och grus. Fälgringarna går i samma ton mot svarta däck. Att "
  "barnets fordon syns på håll är en praktisk sak när flera barn kör samtidigt "
  "på en gårdsplan.",
  syskon("orange", "bla"))

ORANGE = bygg("orange", "Orange",
  None,
  "Orange, vitt och svart",
  "Karossen är orange med vita och svarta partier och orange detaljer på "
  "fälgarna. Det är seriens mest kontrastrika färgställning och den som ser "
  "mest ut som ett tävlingsfordon.",
  syskon("rosa", "bla"))

BLA = bygg("blå", "Blå",
  None,
  "Blått med svarta detaljer",
  "Karossen är blå med svarta detaljer och blå fälgringar. Blått är den "
  "färgställning som smutsar minst synligt av de tre — jord och gräs syns "
  "tydligare på den rosa och den orange.",
  syskon("rosa", "orange"))

SIDOR = {
 "f15febb2-2ba4-478b-8d61-bd07a418153d": {
   "namn": "Elbil för barn 12 V i UTV-stil – fjärrkontroll, bälte och musik, rosa",
   "slug": "elbil-barn-12v-utv-fjarrkontroll-rosa",
   "sku": "FP-elbil-barn-12v-utv-rosa",
   "variant": "12124341-9834-4ec6-8a33-efe43762fe5f",
   "pris": "2229", "revision": "3",
   "seoTitle": "Elbil för barn 12 V med fjärrkontroll, rosa | Fyndplats",
   "seoDesc": "Eldriven barnbil i UTV-stil för 3–5 år. 12 V, 3–7 km/h, fjärrkontroll 15 m, säkerhetsbälte, mjukstart, fyrhjulsfjädring och musik. Maxvikt 30 kg.",
   "brod": ROSA, "farg": "Rosa",
   "alt": ["Rosa elbil för barn i UTV-stil med tända strålkastare",
           "Barn som kör bilen på en grusstig med en vuxen bakom",
           "Måttritning med bilens längd, bredd, höjd och sitsmått",
           "Bilen sedd framifrån, från sidan och bakifrån",
           "Närbild på framhjulet med mönstrat däck och fjädring"],
 },
 "3d9dff8a-a91e-42fc-9d5b-2ae2473b8b6c": {
   "namn": "Elbil för barn 12 V i UTV-stil – fjärrkontroll, bälte och musik, orange",
   "slug": "elbil-barn-12v-utv-fjarrkontroll-orange",
   "sku": "FP-elbil-barn-12v-utv-orange",
   "variant": None, "pris": "2069", "revision": None,
   "seoTitle": "Elbil för barn 12 V med fjärrkontroll, orange | Fyndplats",
   "seoDesc": "Eldriven barnbil i UTV-stil för 3–5 år. 12 V, 3–7 km/h, fjärrkontroll 15 m, säkerhetsbälte, mjukstart, fyrhjulsfjädring och musik. Maxvikt 30 kg.",
   "brod": ORANGE, "farg": "Orange",
   "alt": ["Orange elbil för barn i UTV-stil sedd snett framifrån",
           "Barn som kör bilen på en grusstig med en vuxen bakom",
           "Måttritning med bilens längd, bredd och höjd",
           "Bilen bakifrån med fjädringen markerad",
           "Bilen sedd framifrån, från sidan och bakifrån"],
 },
 "2f6ff71c-fac2-4e55-be3e-9e121e500ed2": {
   "namn": "Elbil för barn 12 V i UTV-stil – fjärrkontroll, bälte och musik, blå",
   "slug": "elbil-barn-12v-utv-fjarrkontroll-bla",
   "sku": "FP-elbil-barn-12v-utv-bla",
   "variant": None, "pris": "2159", "revision": None,
   "seoTitle": "Elbil för barn 12 V med fjärrkontroll, blå | Fyndplats",
   "seoDesc": "Eldriven barnbil i UTV-stil för 3–5 år. 12 V, 3–7 km/h, fjärrkontroll 15 m, säkerhetsbälte, mjukstart, fyrhjulsfjädring och musik. Maxvikt 30 kg.",
   "brod": BLA, "farg": "Blå",
   "alt": ["Blå elbil för barn i UTV-stil med tända strålkastare",
           "Pojke som kör bilen på en grusväg mellan sädesfält",
           "Måttritning med bilens längd, bredd och höjd",
           "Barn som kör bilen på en villagata",
           "Närbild på framhjulet med mönstrat däck och fjädring"],
 },
}
