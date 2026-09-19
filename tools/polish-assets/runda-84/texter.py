# -*- coding: utf-8 -*-
"""Runda 84 — sju sensorsoptunnor, 20 till 60 liter.

☠️ Batch 64 mätte skillnaden: fem produkter skrivna inline i API-anropet gav
NIO fel som nådde Wix, tre skrivna via fil gav noll. Texten skrivs därför HÄR.

☠️ RUNDANS GRIND ÄR MATERIALET. Varenda tunna har lock i plast och stomme i
   stål, men den maskinsatta svenska fliken skriver "Edelstahl" rakt av på
   flera av dem. Runda 57 kallade det den ROSTFRIA LÖGNEN: ett material som
   stämmer på delen kunden ser och inte på delen som går sönder. Ingen text
   här får säga att en tunna ÄR rostfri — den har stomme i rostfritt stål
   och lock i plast, och det står så.

☠️ TVÅ TUNNOR SKA MONTERAS. `4ef74d40` och `96beca79` levereras som lösa
   stålpaneler ("werkzeugfreie Montage" respektive "schnelle, einfache
   Montage" i källans punktlista). Paketmåtten bekräftar det: 15 och 18 cm
   tjocka paket för tunnor som är 26,5–27 cm djupa. De fem övriga är hela,
   och `aabcd677` säger uttryckligen "Keine Montage erforderlich".

☠️ 60-LITERSMODELLENS DOFTBLOCK INGÅR INTE. Aktivt kolfiber sitter i tunnan
   och följer med; hållaren för ett doftblock är TOM. Att slå ihop dem till
   "luktfilter" vore runda 52:s sandlådefel.

☠️ BATTERITYPEN ÄR INTE SAMMA. Fem tunnor går på 4 × AA, `0cc5c634` och
   `dcd756bd` på 4 × D. D-celler kostar mer och finns inte i varje butik.
   Ingen av dem har batterier i kartongen.

⚠️ `466e799a`:s "Öffnung der Abdeckung: 59 cm" står INTE på sidan. Ett
   lockmått på 59 cm är omöjligt som linjärt mått på en 42,5 cm hög tunna,
   och källan säger inte om det är en vinkel eller höjden med locket uppe.
"""

BAS = "https://www.fyndplats.se/produkt/"


def lank(slug, text):
    return '<a href="%s%s">%s</a>' % (BAS, slug, text)


def egenskaper(rader):
    return ("<p><strong>Egenskaper</strong></p><ul>"
            + "".join("<li>%s</li>" % r for r in rader) + "</ul>")


def rubrikblock(rubrik, stycken):
    return "<h2>%s</h2>" % rubrik + "".join("<p>%s</p>" % s for s in stycken)


def spec(rader):
    return ("<h2>Tekniska specifikationer</h2><ul>"
            + "".join("<li>%s</li>" % r for r in rader) + "</ul>")


def faq(rader):
    # ☠️ Wix STRIPPAR <br>. Fråga och svar måste vara TVÅ <p>.
    ut = ["<h2>Vanliga frågor</h2>"]
    for f, s in rader:
        ut.append("<p><strong>%s</strong></p><p>%s</p>" % (f, s))
    return "".join(ut)


def bygg(p):
    return "".join([p["ingress"], egenskaper(p["eg"]), spec(p["spec"]),
                    rubrikblock(p["villkor"][0], p["villkor"][1]),
                    rubrikblock("Användning och skötsel", p["skotsel"]),
                    faq(p["faq"])])


# ── Villkorsblocket: batterier och sensorplacering ─────────────────────────
# ☠️ Rundans verkliga risk är inte att tunnan går sönder — den är att locket
#    öppnas hela natten för att sensorn ser en gardin, och att batterierna
#    är slut på en vecka. Blocket handlar därför om placering och ström.
def batteriblock(typ, antal=4, cykler=None):
    ord_ = "%d × %s — ingår inte" % (antal, typ)
    stycken = [
        "Tunnan drivs av %d %s-batterier och de <strong>ingår inte</strong>. "
        "Köp dem samtidigt som tunnan; utan batterier går locket bara att "
        "öppna för hand." % (antal, typ),
        "Sensorn läser av ett par decimeter framför locket. Ställ inte tunnan "
        "där något rör sig hela tiden — en gardin som fladdrar, en stolsrygg "
        "som passeras eller en hundsvans räcker för att locket ska öppnas i "
        "onödan, och det är så batterierna tar slut i förtid.",
        "Locket går att öppna manuellt med knappen, och sensorn kan stängas "
        "av helt. Ska tunnan stå oanvänd en längre tid: ta ur batterierna, "
        "annars läcker de förr eller senare i batterifacket.",
    ]
    if cykler:
        stycken.insert(1, "Ett nytt batterisats anges räcka till omkring "
                          "%s öppningar under gynnsamma förhållanden. Läs det "
                          "som en storleksordning och inte som en garanti — "
                          "kyla, fukt och hur ofta locket öppnas påverkar "
                          "allt tillsammans." % cykler)
    return (ord_, stycken)


STAL_SKOTSEL = ("Torka av stålet med en mjuk, fuktig trasa och torka efter. "
                "Rostfritt får fläckar av vattendroppar som får torka in, och "
                "det är det som ser ut som smuts på en tunna som egentligen "
                "är ren.")
PLAST_SKOTSEL = ("Locket är plast och tål inte skursvamp eller lösningsmedel. "
                 "Diskmedel och ljummet vatten räcker; repor i plasten samlar "
                 "smuts och går inte att polera bort.")
SENSOR_SKOTSEL = ("Håll sensorögat rent. Ett lager damm eller en fettfläck "
                  "räcker för att locket ska sluta reagera, och det misstas "
                  "lätt för slut batteri.")


def monterings_faq(verktygsfritt=True):
    return ("Behöver den monteras?",
            "Ja, den monteras hemma. Tunnan levereras som lösa stålpaneler, "
            "en lockram och ett lock som klickas ihop kring innerbehållaren "
            "— det är därför kartongen är så platt. Monteringen är "
            "verktygsfri: ingen skruv och ingen mejsel."
            if verktygsfritt else
            "Nej. Tunnan kommer hel och behöver bara batterier.")


INGEN_MONTERING_FAQ = ("Behöver den monteras?",
                       "Nej. Tunnan kommer hel; sätt i batterierna och ställ "
                       "den på plats.")

MATERIAL_FAQ = ("Är hela tunnan i rostfritt stål?",
                "Nej, och det är värt att veta innan man köper. Stommen är "
                "rostfritt stål — locket är plast. Det är locket som tar "
                "smällarna och som slits, så räkna med en plastyta där och "
                "en stålyta på resten.")


PRODUKTER = [
    # ── Den lilla: 20 liter ─────────────────────────────────────────────────
    {
        "kort": "466e799a", "pris": 859, "volym": 20,
        "name": "Soptunna med sensor 20 liter – innerhink, 42,5 cm hög",
        "slug": "soptunna-sensor-20-liter-innerhink",
        "title": "Soptunna med sensor 20 liter med innerhink | Fyndplats",
        "meta": ("Liten soptunna med rörelsesensor och 20 liters volym. "
                 "Uttagbar innerhink med handtag, manuell knapp på locket och "
                 "strömbrytare på baksidan. 33 × 25 × 42,5 cm."),
        "ingress": (
            "<p><strong>Bara 20 liter och 42,5 cm hög.</strong> "
            "Den är gjord för de platser där en kökstunna inte får plats — "
            "under ett skrivbord, bredvid en toalett, i ett sovrum.</p>"
            "<p>Locket öppnas av en infraröd sensor när handen närmar sig och "
            "stängs av sig självt en stund senare. Det finns en knapp på "
            "locket för den som hellre öppnar själv, och en strömbrytare på "
            "baksidan som stänger av sensorn helt.</p>"
            "<p>Innerhinken har handtag och lyfts ur när påsen ska bytas. "
            "Behöver du mer volym på samma lilla yta finns " +
            lank("soptunna-sensor-42-liter-rund", "en rund tunna på 42 liter") +
            ", och i den publicerade delen av sortimentet " +
            lank("soptunna-med-sensor", "en sensortunna på 30 liter") + ".</p>"),
        "eg": [
            "20 liter — för trånga platser",
            "42,5 cm hög, 33 × 25 cm på golvet",
            "Infraröd sensor öppnar locket beröringsfritt",
            "Knapp på locket för manuell öppning",
            "Strömbrytare på baksidan stänger av sensorn",
            "Uttagbar innerhink med handtag",
            "Stomme i rostfritt stål, lock i plast",
        ],
        "spec": [
            "Volym: 20 liter",
            "Mått (L × B × H): 33 × 25 × 42,5 cm",
            "Innerhinkens mått (L × B × H): 29 × 19 × 29,5 cm",
            "Sensoravstånd: 15–20 cm",
            "Batterier: 4 × AA, ingår inte",
            "Manuell öppning: knapp på locket",
            "Strömbrytare: på baksidan",
            "Stomme: rostfritt stål",
            "Lock: plast",
            "Färg: silver med svart lock",
            "Vikt: 3,3 kg",
            "Paketmått: 48,5 × 36,5 × 28,5 cm",
            "Montering: krävs inte",
            "Ingår: soptunna och bruksanvisning",
        ],
        "villkor": batteriblock("AA"),
        "skotsel": [STAL_SKOTSEL, PLAST_SKOTSEL, SENSOR_SKOTSEL],
        "faq": [
            ("Hur liten är den egentligen?",
             "42,5 cm hög och 33 × 25 cm på golvet — ungefär en halv "
             "kökstunna. Den går in under de flesta skrivbord och bredvid en "
             "toalettstol utan att ta hela gången."),
            ("Går locket att öppna utan sensorn?",
             "Ja. Det sitter en knapp på locket, och en strömbrytare på "
             "baksidan som stänger av sensorn helt om du hellre öppnar för "
             "hand eller vill spara batteri."),
            MATERIAL_FAQ,
            INGEN_MONTERING_FAQ,
        ],
    },
    # ── Den runda: 42 liter ─────────────────────────────────────────────────
    {
        "kort": "7846d05f", "pris": 859, "volym": 42,
        "name": "Soptunna med sensor 42 liter – rund, påshållare ingår",
        "slug": "soptunna-sensor-42-liter-rund",
        "title": "Rund soptunna med sensor 42 liter | Fyndplats",
        "meta": ("Rund soptunna med rörelsesensor, 42 liter och 68 cm hög. "
                 "Locket öppnas på 0,5 sekunder, står öppet i fem sekunder "
                 "och stängs mjukt. Påshållare ingår."),
        "ingress": (
            "<p>En <strong>rund tunna</strong> på 42 liter, 30,5 cm i diameter "
            "och 68 cm hög. En cylinder tar mindre plats i ett hörn "
            "än en rektangulär tunna med samma volym, och den har inga kanter "
            "att slå i.</p>"
            "<p>Sensorn öppnar locket på 0,5 sekunder, det står öppet i fem "
            "sekunder och stängs sedan mjukt i stället för att smälla. En "
            "påshållare följer med och håller påsens kant nere så den inte "
            "syns över kanten.</p>"
            "<p>Behöver du mindre finns " +
            lank("soptunna-sensor-20-liter-innerhink", "en tunna på 20 liter") +
            ", och mer volym i " +
            lank("soptunna-sensor-55-liter-fjarilslock",
                 "55-litersmodellen med fjärilslock") + ".</p>"),
        "eg": [
            "42 liter i rund form — tar hörnet",
            "68 cm hög, 30,5 cm i diameter",
            "Locket öppnas på 0,5 sekunder",
            "Står öppet i fem sekunder, stängs sedan mjukt",
            "Påshållare ingår",
            "Fingeravtrycksmotståndig yta",
            "Stomme i rostfritt stål, lock i plast",
        ],
        "spec": [
            "Volym: 42 liter",
            "Mått (B × D × H): 30,5 × 30,5 × 68 cm",
            "Form: rund",
            "Sensoravstånd: 15 cm",
            "Öppningstid: 0,5 sekunder",
            "Locket står öppet: 5 sekunder",
            "Batterier: 4 × AA, ingår inte",
            "Påshållare: ingår",
            "Stomme: rostfritt stål",
            "Lock: plast",
            "Färg: silver med svart lock",
            "Vikt: 3,2 kg",
            "Paketmått: 32 × 32 × 72 cm",
            "Montering: krävs inte",
            "Ingår: soptunna och bruksanvisning",
        ],
        "villkor": batteriblock("AA"),
        "skotsel": [STAL_SKOTSEL, PLAST_SKOTSEL, SENSOR_SKOTSEL],
        "faq": [
            ("Varför rund i stället för fyrkantig?",
             "En cylinder står bättre i ett hörn och har inga kanter att slå "
             "i när man går förbi. Nackdelen är att den inte kan stå tätt mot "
             "en vägg på samma sätt som en rak tunna."),
            ("Vad gör påshållaren?",
             "Den klämmer fast påsens kant innanför tunnan, så att plasten "
             "inte hänger över kanten. Det är mest en fråga om hur tunnan ser "
             "ut, men det håller också påsen på plats när man trycker ner "
             "något i den."),
            MATERIAL_FAQ,
            INGEN_MONTERING_FAQ,
        ],
    },
    # ── 45 liter med innerhink ──────────────────────────────────────────────
    {
        "kort": "aabcd677", "pris": 1099, "volym": 45,
        "name": "Soptunna med sensor 45 liter – uttagbar innerhink",
        "slug": "soptunna-sensor-45-liter-innerhink",
        "title": "Soptunna med sensor 45 liter, innerhink | Fyndplats",
        "meta": ("Soptunna med rörelsesensor och 45 liters volym. Uttagbar "
                 "innerhink på 62 cm, mjukstängande lock och smal stomme på "
                 "38 × 25,5 cm. Kräver ingen montering."),
        "ingress": (
            "<p>En <strong>smal 45-litare</strong>: 38 × 25,5 cm på golvet men "
            "67,5 cm hög. Volymen ligger på höjden i stället för på bredden, "
            "vilket är skillnaden mellan att tunnan får plats bredvid ett "
            "köksskåp och att den inte gör det.</p>"
            "<p>Sensorn öppnar locket inom 15 cm och det stängs mjukt på fem "
            "sekunder. Innerhinken är 62 cm hög och lyfts ur i handtaget när "
            "påsen ska bytas — och det är den som gör tunnan tung: 7,8 kg.</p>"
            "<p>Med locket uppfällt är tunnan 88 cm hög, så mät under en hylla "
            "innan du bestämmer plats. Behöver du bredare finns " +
            lank("soptunna-sensor-48-liter-oval", "en oval tunna på 48 liter") +
            ".</p>"),
        "eg": [
            "45 liter på bara 38 × 25,5 cm golvyta",
            "67,5 cm hög — 88 cm med locket uppfällt",
            "Uttagbar innerhink, 62 cm hög",
            "Sensorn öppnar inom 15 cm",
            "Locket stängs mjukt på fem sekunder",
            "Kräver ingen montering",
            "Stomme i rostfritt stål, lock i plast",
        ],
        "spec": [
            "Volym: 45 liter",
            "Mått (L × B × H): 38 × 25,5 × 67,5 cm",
            "Höjd med locket uppfällt: 88 cm",
            "Innerhinkens mått (B × D × H): 25 × 37,5 × 62 cm",
            "Lockets öppning (L × B): 38 × 25,5 cm",
            "Sensoravstånd: 15 cm",
            "Locket stängs: mjukt, på 5 sekunder",
            "Stomme: rostfritt stål",
            "Lock: plast",
            "Färg: silver med svart lock",
            "Vikt: 7,8 kg",
            "Paketmått: 75 × 44 × 31 cm",
            "Montering: krävs inte",
            "Ingår: soptunna och bruksanvisning",
        ],
        "villkor": batteriblock("AA"),
        "skotsel": [STAL_SKOTSEL, PLAST_SKOTSEL, SENSOR_SKOTSEL],
        "faq": [
            ("Varför väger den mer än de större tunnorna?",
             "För innerhinken. Den är 62 cm hög och en egen behållare som "
             "lyfts ur, och den väger en del i sig. Vikten sitter alltså i "
             "en funktion och inte i tjockare plåt — tunnor utan innerhink, "
             "som " + lank("soptunna-sensor-58-liter-oval",
                          "den ovala 58-litaren") + ", väger betydligt "
             "mindre trots att de rymmer mer."),
            ("Hur högt behöver jag ovanför tunnan?",
             "88 cm, för locket fälls upp. Står den under en hylla eller en "
             "bänkskiva på 67,5 cm går locket emot."),
            ("Vilka batterier går den på?",
             "Storleken anges inte i underlaget för just den här tunnan, så vi "
             "skriver ingen. Titta i batterifacket under locket innan du "
             "handlar — de flesta sensortunnor i den här storleken tar fyra "
             "AA eller fyra D."),
            INGEN_MONTERING_FAQ,
        ],
    },
    # ── 48 liter, oval, utan innerhink ──────────────────────────────────────
    {
        "kort": "0cc5c634", "pris": 919, "volym": 48,
        "name": "Soptunna med sensor 48 liter – oval, utan innerhink",
        "slug": "soptunna-sensor-48-liter-oval",
        "title": "Oval soptunna med sensor 48 liter | Fyndplats",
        "meta": ("Oval soptunna med rörelsesensor och 48 liters volym på bara "
                 "57 cm höjd. Avtagbart lock i plast, manuell knapp och "
                 "strömbrytare. Drivs av fyra D-batterier."),
        "ingress": (
            "<p>Den <strong>lägsta stora tunnan</strong> här: 48 liter på "
            "57 cm höjd. Den ovala formen gör att volymen ligger i bredden "
            "i stället för på höjden, så tunnan går in under en bänkskiva "
            "där en hög tunna inte kommer åt.</p>"
            "<p>Den har <strong>ingen innerhink</strong> — påsen sitter direkt "
            "i stommen. Det är därför hela volymen är användbar och tunnan "
            "bara väger runt fyra kilo, men det betyder också att stommen "
            "måste torkas ur när något läcker.</p>"
            "<p>Den går på <strong>fyra D-batterier</strong>, inte AA. De "
            "är dyrare och finns inte i varje butik. Vill du ha AA i stället "
            "finns " + lank("soptunna-sensor-55-liter-fjarilslock",
                            "55-litersmodellen") + " och " +
            lank("soptunna-sensor-60-liter-kolfilter", "60-litersmodellen") +
            ".</p>"),
        "eg": [
            "48 liter på bara 57 cm höjd",
            "Oval form — går in under en bänkskiva",
            "Ingen innerhink: påsen sitter direkt i stommen",
            "Avtagbart lock med infraröd sensor",
            "Manuell knapp och strömbrytare",
            "Drivs av 4 × D-batterier",
            "Stomme i rostfritt stål, lock i plast",
        ],
        "spec": [
            "Volym: 48 liter",
            "Mått (L × B × H): 40,5 × 29,5 × 57 cm",
            "Form: oval",
            "Innerhink: nej, påsen sitter i stommen",
            "Batterier: 4 × D (1,5 V), ingår inte",
            "Manuell öppning: knapp på locket",
            "Locket: avtagbart",
            "Stomme: rostfritt stål",
            "Lock: plast",
            "Färg: silver med svart lock",
            "Vikt: 3,8 kg",
            "Paketmått: 43,5 × 32 × 52 cm",
            "Montering: krävs inte",
            "Ingår: soptunna",
        ],
        "villkor": batteriblock("D"),
        "skotsel": [STAL_SKOTSEL, PLAST_SKOTSEL, SENSOR_SKOTSEL],
        "faq": [
            ("Varför D-batterier och inte AA?",
             "Det är vad den här modellen tar. D-celler håller längre men "
             "kostar mer och finns inte i varje mataffär — räkna med att "
             "handla dem på nätet eller i en järnaffär. Tunnorna här som går "
             "på AA är " + lank("soptunna-sensor-55-liter-fjarilslock",
                                "55-litersmodellen") + " och " +
             lank("soptunna-sensor-42-liter-rund", "den runda 42-litaren") + "."),
            ("Vad betyder att den saknar innerhink?",
             "Påsen hängs direkt i stommen i stället för i en lös hink. Hela "
             "volymen blir användbar och tunnan väger mindre, men läcker en "
             "påse får du torka ur själva tunnan i stället för att lyfta ut "
             "en hink."),
            MATERIAL_FAQ,
            INGEN_MONTERING_FAQ,
        ],
    },
    # ── 55 liter med fjärilslock, monteras ──────────────────────────────────
    {
        "kort": "4ef74d40", "pris": 1039, "volym": 55,
        "name": "Soptunna med sensor 55 liter – fjärilslock som öppnas från mitten",
        "slug": "soptunna-sensor-55-liter-fjarilslock",
        "title": "Soptunna med sensor 55 liter, fjärilslock | Fyndplats",
        "meta": ("Soptunna med rörelsesensor och 55 liters volym. Fjärilslock "
                 "som delar sig i mitten och behöver ingen höjd ovanför. "
                 "Monteras verktygsfritt av lösa paneler."),
        "ingress": (
            "<p><strong>Fjärilslocket är hela poängen.</strong> Det delar sig "
            "på mitten och viker undan åt sidorna i stället för att fällas "
            "upp bakåt — tunnan behöver alltså ingen fri höjd ovanför sig och "
            "kan stå under en hylla eller i ett skåp.</p>"
            "<p>55 liter på 41 × 26,5 cm golvyta och 59 cm höjd. Locket "
            "öppnas på 0,5 sekunder, sluter tätt när det är stängt och går "
            "att köra manuellt. En ring döljer påsens kant.</p>"
            "<p><strong>Tunnan monteras.</strong> Den kommer som fyra lösa "
            "stålpaneler, en lockram och ett lock som klickas ihop utan "
            "verktyg — det är därför kartongen bara är 18 cm tjock. Vill du "
            "ha en färdig tunna direkt ur lådan finns " +
            lank("soptunna-sensor-48-liter-oval", "den ovala 48-litaren") +
            " och " + lank("soptunna-sensor-45-liter-innerhink",
                           "45-litaren med innerhink") + ".</p>"),
        "eg": [
            "55 liter, 59 cm hög",
            "Fjärilslock som delar sig i mitten — kräver ingen höjd ovanför",
            "Locket öppnas på 0,5 sekunder",
            "Tätslutande lock håller lukten inne",
            "Ring som döljer påsens kant",
            "Automatiskt och manuellt läge",
            "Monteras verktygsfritt av lösa paneler",
        ],
        "spec": [
            "Volym: 55 liter",
            "Mått (L × B × H): 41 × 26,5 × 59 cm",
            "Lockets öppning (L × B): 28,5 × 19,2 cm",
            "Locktyp: fjärilslock, öppnas från mitten",
            "Sensoravstånd: 15–20 cm",
            "Öppningstid: 0,5 sekunder",
            "Batterier: 4 × AA, ingår inte",
            "Batteritid: cirka 10 000 öppningar per sats",
            "Stomme: rostfritt stål 430",
            "Lock: ABS-plast",
            "Färg: silver med svart lock",
            "Vikt: 5,3 kg",
            "Paketmått: 33 × 18 × 59,5 cm",
            "Montering: krävs, verktygsfri",
            "Ingår: soptunna och bruksanvisning",
        ],
        "villkor": batteriblock("AA", cykler="10 000"),
        "skotsel": [STAL_SKOTSEL, PLAST_SKOTSEL, SENSOR_SKOTSEL],
        "faq": [
            ("Vad är ett fjärilslock?",
             "Locket är delat i mitten och de två halvorna viker undan åt "
             "sidorna när sensorn löser ut. Ett vanligt lock fälls upp bakåt "
             "och behöver fri höjd ovanför tunnan; det här behöver ingen — "
             "därför går tunnan att ställa under en hylla."),
            monterings_faq(True),
            ("Hur länge räcker batterierna?",
             "Cirka 10 000 öppningar per sats anges under gynnsamma "
             "förhållanden. Det är en storleksordning och ingen garanti — "
             "kyla, fukt och hur ofta locket öppnas spelar in. Står tunnan i "
             "ett kök som används dagligen ligger det på ett år eller mer."),
            MATERIAL_FAQ,
        ],
    },
    # ── 58 liter, oval, utan innerhink ──────────────────────────────────────
    {
        "kort": "dcd756bd", "pris": 1059, "volym": 58,
        "name": "Soptunna med sensor 58 liter – oval, utan innerhink",
        "slug": "soptunna-sensor-58-liter-oval",
        "title": "Oval soptunna med sensor 58 liter | Fyndplats",
        "meta": ("Oval soptunna med rörelsesensor och 58 liters volym, 68 cm "
                 "hög. Avtagbart lock i plast, manuell knapp och "
                 "strömbrytare. Drivs av fyra D-batterier."),
        "ingress": (
            "<p><strong>58 liter i oval form.</strong> Samma ovala "
            "form som " + lank("soptunna-sensor-48-liter-oval",
                               "48-litersmodellen") + ", men elva centimeter "
            "högre och tio liter rymligare — samma golvyta, mer volym.</p>"
            "<p>Ingen innerhink: påsen sitter direkt i stommen, så hela "
            "volymen går att använda. Locket är avtagbart, har en manuell "
            "knapp och en strömbrytare som stänger av sensorn.</p>"
            "<p>Den går på <strong>fyra D-batterier</strong>. Vill du ha AA "
            "i samma storleksklass finns " +
            lank("soptunna-sensor-60-liter-kolfilter",
                 "60-litersmodellen med kolfilter") + ".</p>"),
        "eg": [
            "58 liter",
            "68 cm hög, 40,9 × 28,9 cm på golvet",
            "Oval form",
            "Ingen innerhink: påsen sitter direkt i stommen",
            "Avtagbart lock med infraröd sensor",
            "Manuell knapp och strömbrytare",
            "Drivs av 4 × D-batterier",
        ],
        "spec": [
            "Volym: 58 liter",
            "Mått (L × B × H): 40,9 × 28,9 × 68 cm",
            "Form: oval",
            "Innerhink: nej, påsen sitter i stommen",
            "Batterier: 4 × D (1,5 V), ingår inte",
            "Manuell öppning: knapp på locket",
            "Locket: avtagbart",
            "Stomme: rostfritt stål",
            "Lock: plast",
            "Färg: silver med svart lock",
            "Vikt: 4,3 kg",
            "Paketmått: 44 × 33 × 63 cm",
            "Montering: krävs inte",
            "Ingår: soptunna",
        ],
        "villkor": batteriblock("D"),
        "skotsel": [STAL_SKOTSEL, PLAST_SKOTSEL, SENSOR_SKOTSEL],
        "faq": [
            ("Vad skiljer den från 48-litersmodellen?",
             "Höjden. Golvytan är nästan identisk, men den här är 68 cm hög "
             "och rymmer mer — " + lank("soptunna-sensor-48-liter-oval",
                                        "48-litaren är 57 cm hög") + ". Allt "
             "annat är detsamma, inklusive D-batterierna."),
            ("Varför D-batterier?",
             "Det är vad modellen tar. D-celler håller längre men kostar mer "
             "och säljs inte överallt. Tunnorna här som går på AA är " +
             lank("soptunna-sensor-60-liter-kolfilter", "60-litaren") + " och " +
             lank("soptunna-sensor-42-liter-rund", "den runda 42-litaren") + "."),
            MATERIAL_FAQ,
            INGEN_MONTERING_FAQ,
        ],
    },
    # ── 60 liter med kolfilter, monteras ────────────────────────────────────
    {
        "kort": "96beca79", "pris": 1219, "volym": 60,
        "name": "Soptunna med sensor 60 liter – kolfilter mot lukt",
        "slug": "soptunna-sensor-60-liter-kolfilter",
        "title": "Soptunna med sensor 60 liter, kolfilter | Fyndplats",
        "meta": ("Soptunna med rörelsesensor och 60 liters volym. Aktivt "
                 "kolfiber i locket binder lukt. Monteras "
                 "verktygsfritt av lösa paneler."),
        "ingress": (
            "<p><strong>60 liter</strong> på 39 × 27 cm "
            "golvyta och 66 cm höjd. Locköppningen är 34,8 × 17,7 cm, alltså "
            "bred nog för en matkasse som ska ner på höjden.</p>"
            "<p>Ett lager <strong>aktivt kolfiber</strong> sitter i locket och "
            "binder lukt. Det följer med tunnan. I locket finns dessutom en "
            "hållare för ett doftblock — <strong>blocket ingår inte</strong>, "
            "så räkna med att köpa det separat om du vill ha den delen.</p>"
            "<p><strong>Tunnan monteras.</strong> Den kommer som fyra lösa "
            "stålpaneler plus lockram och lock, som klickas ihop utan "
            "verktyg — kartongen är bara 15 cm tjock. Vill du ha en färdig "
            "tunna finns " + lank("soptunna-sensor-58-liter-oval",
                                  "den ovala 58-litaren") + ", och i den "
            "publicerade delen av sortimentet " +
            lank("soptunna-med-sensor-68-liter", "en sensortunna på 68 liter") +
            ".</p>"),
        "eg": [
            "60 liter",
            "66 cm hög, 39 × 27 cm på golvet",
            "Aktivt kolfiber i locket binder lukt (ingår)",
            "Hållare för doftblock — blocket ingår inte",
            "Bred locköppning: 34,8 × 17,7 cm",
            "Ring som säkrar påsen",
            "Monteras verktygsfritt av lösa paneler",
        ],
        "spec": [
            "Volym: 60 liter",
            "Mått (L × B × H): 39 × 27 × 66 cm",
            "Lockets öppning (L × B): 34,8 × 17,7 cm",
            "Luktfilter: aktivt kolfiber, ingår",
            "Hållare för doftblock: ja, blocket ingår inte",
            "Sensoravstånd: 15–20 cm",
            "Sensortid: 0,5 sekunder",
            "Batterier: 4 × AA, ingår inte",
            "Påshållare: ring i lockramen",
            "Stomme: borstat rostfritt stål",
            "Lock: plast",
            "Färg: silver",
            "Vikt: 5,6 kg",
            "Paketmått: 42,5 × 15 × 65,5 cm",
            "Montering: krävs, verktygsfri",
            "Ingår: soptunna och bruksanvisning",
        ],
        "villkor": batteriblock("AA"),
        "skotsel": [STAL_SKOTSEL, PLAST_SKOTSEL, SENSOR_SKOTSEL],
        "faq": [
            ("Ingår luktfiltret?",
             "Kolfibret gör det — det sitter i locket och följer med tunnan. "
             "Doftblocket gör det inte. Locket har en hållare för ett sådant "
             "block, men hållaren är tom när tunnan kommer."),
            monterings_faq(True),
            ("Hur stor är öppningen?",
             "34,8 × 17,7 cm. Det är brett nog för att tömma ner en matkasse "
             "utan att vinkla den, men en pizzakartong går inte ner platt."),
            MATERIAL_FAQ,
        ],
    },
]
