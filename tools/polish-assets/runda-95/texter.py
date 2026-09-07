# -*- coding: utf-8 -*-
"""Runda 95 — fyra reservtak med DUBBELTAK, i tva storlekar.

☠️ TEXTEN SKRIVS I FIL, ALDRIG INLINE — och filen racker inte. Runda 94 matte
   att JSON-kroppen skrivs FOR HAND ur filen och att den kopieringen ar
   ogrindad. Live-grinden jamfor darfor varje mening ordagrant mot den
   publicerade sidan.

☠️ TYSKAN HAR FEL OM FARGEN PA TVA AV FYRA. Dominerande RGB bland
   produktpixlarna pa bild 1 (vit botten bortfiltrerad):

   · b6ebc5ba  tyskan "Kohlegrau", feeden "Grun"  →  24, 72, 36
     H 135°, S 50 %, L 19 % = MORKGRON. Tyskan ar rakt av fel.
   · 271327e1  "Rostrot"        → 216, 72, 36  H 12°, S 71 %, L 49 % = ROSTROD
   · ef0a812d  NAMNET "Kaffee"  → 180, 36,  0  H 12°, S 100 %, L 35 % = ROSTROD
     Bade tyskan och feeden sager Rostrot; det ar produktnamnet som ljuger.
   · dc7d2513  "Cremeweiss"     → 216,216,204  H 60°, S 13 %, L 82 % = CREMEVIT

☠️ DE TVA 3 x 3-TAKEN HAR OLIKA MATT — de ar INTE samma duk i tva farger.
   Varje produkt har sin EGEN mattritning, och de sager olika saker:

   | vad              | b6ebc5ba (gron) | 271327e1 (rostrod) |
   |------------------|-----------------|--------------------|
   | stomme           | 3 x 3 m         | 300 x 300 cm       |
   | lilla taket      | **88 x 88 cm**  | **86 x 86 cm**     |
   | snedstalld kant  | 174 cm          | —                  |
   | oppning          | —               | 68 x 68 cm         |
   | kanthojd         | 18 cm           | 18 cm              |

   Varje sida publicerar darfor BARA sin egen ritnings tal. Att lana grannens
   ar precis den forvaxling runbooken kallar "syskonets matt i sin egen
   spec-tabell". Korslanken sager uttryckligen att matten skiljer sig.

☠️ YTVIKTEN AR UTELAMNAD PA 271327e1. Kallan motsager sig sjalv i SAMMA
   dokument: punktlistan sager "Polyester (170 g/m2)", Technische Daten sager
   "180g/m2". Grannen (b6ebc5ba) sager 180 pa bada stallen och far darfor
   publicera talet. Ett tal kallan bråkar med sig sjalv om publiceras inte.

⚠️ 1,45 / 1,75 / 1,85 / 0,64 / 0,45 / 0,9 m PUBLICERAS INTE. Grupp E:s ritning
   bar sex tal till som saknar etikett och inte gar att para ihop med tyskan.
   Samma disciplin som runda 94:s 1,65 m: ett omarkt matt som far en etikett ar
   ett pahittat matt.

✅ KANTHOJDEN ar dock etiketterad har, till skillnad fran i runda 94. Grupp E:s
   tyska sager ordagrant "Randhohe: 20 cm" OCH ritningen visar 0,2 m pa samma
   stalle. Grupp D:s ritningar visar 18 cm / 0,18 m pa motsvarande kant.

⚠️ VATTENAVVISANDE, ALDRIG VATTENTAT. Grupp D:s tyska sager det sjalv rakt ut:
   "wasserabweisendes Dach, NICHT wasserdicht".

⚠️ "geeignet fur UNSERE Gartenpavillons" — passformen ar uttryckt mot
   leverantorens eget sortiment och betyder ingenting hos oss. Den uttrycks i
   MATT plus kallans egen uppmaning att jamfora med bilden.

⚠️ INGEN LEVERANTOR, INGET HUSMARKE, INGET AVSANDARLAND i texten.
"""

BAS = "https://www.fyndplats.se/produkt/"

# Publicerad sida i samma familj: 3 x 3 m dubbeltak, 86 x 86 cm liten topp.
CREME = "paviljongtak-3x3-dubbeltak-creme"

GRUPP = {"b6ebc5ba": "D", "271327e1": "D", "ef0a812d": "E", "dc7d2513": "E"}

SLUGG = {
    "b6ebc5ba": "paviljongtak-3x3-dubbeltak-morkgron",
    "271327e1": "paviljongtak-3x3-dubbeltak-rostrod",
    "ef0a812d": "paviljongtak-3x4-dubbeltak-rostrod",
    "dc7d2513": "paviljongtak-3x4-dubbeltak-cremevit",
}

FARG = {"b6ebc5ba": "mörkgrön", "271327e1": "roströd",
        "ef0a812d": "roströd", "dc7d2513": "cremevit"}

# Farg i "i ..."-form (neutrum, som substantiv)
FARG_I = {"mörkgrön": "mörkgrönt", "roströd": "rostrött", "cremevit": "cremevitt"}

PRODUKTER = ["b6ebc5ba", "271327e1", "ef0a812d", "dc7d2513"]

SKU = {
    "b6ebc5ba": "FP-paviljongtak-3x3-morkgron",
    "271327e1": "FP-paviljongtak-3x3-rostrod",
    "ef0a812d": "FP-paviljongtak-3x4-rostrod",
    "dc7d2513": "FP-paviljongtak-3x4-cremevit",
}

STORLEK = {"D": "3 × 3 m", "E": "3 × 4 m"}


def lank(slug, text):
    return '<a href="%s%s">%s</a>' % (BAS, slug, text)


def syskon(pid):
    return [p for p in PRODUKTER if GRUPP[p] == GRUPP[pid] and p != pid][0]


def bygg(ingress, egenskaper, spec, syskonrad, annan, skotsel, faq):
    d = ["<p>%s</p>" % ingress]
    d.append("<p><strong>Egenskaper</strong></p><ul>")
    d += ["<li>%s</li>" % e for e in egenskaper]
    d.append("</ul>")
    d.append("<h2>Tekniska specifikationer</h2><ul>")
    d += ["<li><strong>%s:</strong> %s</li>" % (k, v) for k, v in spec]
    d.append("</ul>")
    d.append("<h2>Samma tak i en annan färg</h2><p>%s</p>" % syskonrad)
    d.append("<h2>Har du en annan storlek?</h2>")
    d += ["<p>%s</p>" % a for a in annan]
    d.append("<h2>Användning och skötsel</h2>")
    d += ["<p>%s</p>" % s for s in skotsel]
    d.append("<h2>Vanliga frågor</h2>")
    for f, s in faq:
        d.append("<p><strong>%s</strong></p><p>%s</p>" % (f, s))
    return "".join(d)


# ------------------------------------------------------------- spec-tabeller

SPEC = {
    "b6ebc5ba": [
        ("Passar", "paviljong 3 × 3 m med tak i två nivåer"),
        ("Lilla taket", "88 × 88 cm"),
        ("Snedställd kant, stora taket", "174 cm"),
        ("Kanthöjd", "18 cm"),
        ("Material", "polyester, 180 g/m², med PA-beläggning på baksidan"),
        ("Infästning", "remmar med kardborreband"),
        ("Färg", "mörkgrön"),
        ("Vikt", "2,6 kg"),
        ("Paketmått", "32 × 43 × 7 cm"),
        ("Ingår", "endast takduken"),
        ("Ingår inte", "stomme och stänger"),
    ],
    "271327e1": [
        ("Stora duken", "300 × 300 cm"),
        ("Lilla taket", "86 × 86 cm"),
        ("Öppning i stora taket", "68 × 68 cm"),
        ("Kanthöjd", "18 cm"),
        ("Passar", "paviljong 3 × 3 m med tak i två nivåer"),
        ("Material", "polyester med PA-beläggning på baksidan"),
        ("Infästning", "remmar med kardborreband"),
        ("Färg", "roströd"),
        ("Vikt", "2,5 kg"),
        ("Paketmått", "32 × 7 × 42 cm"),
        ("Ingår", "endast takduken"),
        ("Ingår inte", "stomme och stänger"),
    ],
}

def spec_e(farg, vikt="2,7 kg"):
    return [
        ("Passar", "paviljong 3 × 4 m med tak i två nivåer"),
        ("Lilla taket", "94 × 47 cm"),
        ("Kanthöjd", "20 cm"),
        ("Material", "polyester, 180 g/m², med PA-beläggning"),
        ("Färg", farg),
        ("Vikt", vikt),
        ("Paketmått", "35 × 9 × 42 cm"),
        ("Ingår", "endast takduken"),
        ("Ingår inte", "stomme och stänger"),
    ]


def spec(pid):
    return SPEC[pid] if GRUPP[pid] == "D" else spec_e(FARG[pid])


# ------------------------------------------------------------------ innehåll

def ingress(pid):
    f = FARG[pid]
    if pid == "b6ebc5ba":
        return ("Taket är den del av paviljongen som får ta hela vädret — sol, regn "
                "och vind — och det är därför taket ger upp långt före stommen. Den "
                "här reservduken sätter en 3 × 3 m paviljong i skick igen: ett tak i "
                "två nivåer med ett litet tak på 88 × 88 cm ovanpå det stora, i "
                "%s polyester på 180 g/m² med PA-beläggning på baksidan." % f)
    if pid == "271327e1":
        return ("Taket är den del av paviljongen som får ta hela vädret — sol, regn "
                "och vind — och det är därför taket ger upp långt före stommen. Den "
                "här reservduken sätter en 3 × 3 m paviljong i skick igen: stora "
                "duken mäter 300 × 300 cm, det lilla taket ovanpå 86 × 86 cm, och "
                "mellan dem sitter en öppning på 68 × 68 cm som släpper ut "
                "varmluften. Duken är %s." % f)
    return ("Ett slitet paviljongtak betyder inte att hela paviljongen är slut — "
            "stommen står oftast kvar helt fin. Den här reservduken byter ut taket "
            "på en paviljong på 3 × 4 m: ett tak i två nivåer med ett litet tak på "
            "94 × 47 cm ovanpå det stora, i %s polyester på 180 g/m² med "
            "PA-beläggning." % f)


def egenskaper(pid):
    f = FARG[pid]
    if GRUPP[pid] == "D":
        e = ["Passar paviljonger på 3 × 3 m där taket är byggt i två nivåer",
             "Fast tak — duken spänns över stommen och sitter kvar, den dras inte in",
             "Fästs med remmar och kardborreband, utan verktyg",
             "Kanthöjd 18 cm längs takfoten"]
        if pid == "b6ebc5ba":
            e += ["Sydd i polyester på 180 g/m² med PA-beläggning på baksidan",
                  "Lilla taket mäter 88 × 88 cm och den snedställda kanten på stora "
                  "taket 174 cm"]
        else:
            e += ["Sydd i polyester med PA-beläggning på baksidan",
                  "Stora duken mäter 300 × 300 cm, lilla taket 86 × 86 cm och "
                  "öppningen mellan dem 68 × 68 cm"]
        e += ["Vattenavvisande, inte vattentät",
              "Färg: %s" % f,
              "Väger %s och kommer i en förpackning på %s"
              % (dict(spec(pid))["Vikt"], dict(spec(pid))["Paketmått"]),
              "Endast takduken ingår — stommen följer inte med"]
        return e
    return [
        "Passar paviljonger på 3 × 4 m där taket är byggt i två nivåer",
        "Fast tak — duken spänns över stommen och sitter kvar, den dras inte in",
        "Lilla taket mäter 94 × 47 cm och sitter höjt över den stora duken",
        "Kanthöjd 20 cm längs takfoten",
        "Sydd i polyester på 180 g/m² med PA-beläggning",
        "Vattenavvisande, inte vattentät",
        "Färg: %s" % f,
        "Väger 2,7 kg och kommer i en förpackning på 35 × 9 × 42 cm",
        "Endast takduken ingår — stommen följer inte med",
    ]


def skotsel(pid):
    if GRUPP[pid] == "D":
        matt = ("det lilla taket mäter 88 × 88 cm och den snedställda kanten på "
                "stora taket 174 cm" if pid == "b6ebc5ba" else
                "stora duken mäter 300 × 300 cm och det lilla taket 86 × 86 cm")
        forsta = ("Mät stommen innan du beställer. Duken sitter på en paviljong på "
                  "3 × 3 m med tak i två nivåer, och %s — jämför med din egen "
                  "paviljong och med måttbilden här i galleriet, för utförandet "
                  "skiljer sig mellan modeller." % matt)
    else:
        forsta = ("Mät stommen innan du beställer. Duken sitter på en paviljong på "
                  "3 × 4 m med tak i två nivåer, och det lilla taket mäter "
                  "94 × 47 cm — jämför med din egen paviljong och med måttbilden "
                  "här i galleriet.")
    return [
        forsta,
        "Ta ned duken vid storm och kraftigt oväder. Den är gjord för sol och regn, "
        "inte för att sitta kvar i hård vind.",
        "Spola av den med vatten och låt den torka helt innan du viker ihop den. "
        "Lägg undan den torr inför vintern — den är ett sommartak och ska inte "
        "bära snö.",
    ]


def faq(pid):
    f = FARG[pid]
    g = GRUPP[pid]
    matt = ("Mät tre saker: stommen ska vara 3 × 3 m, det lilla taket 88 × 88 cm "
            "och den snedställda kanten på stora taket 174 cm."
            if pid == "b6ebc5ba" else
            "Mät tre saker: stommen ska vara 3 × 3 m, stora duken 300 × 300 cm och "
            "det lilla taket 86 × 86 cm." if pid == "271327e1" else
            "Mät två saker: stommen ska vara 3 × 4 m och det lilla taket "
            "94 × 47 cm.")
    ut = [
        ("Ingår stommen?",
         "Nej. Du får takduken och ingenting annat — stomme och stänger följer "
         "inte med."),
        ("Hur vet jag att duken passar?",
         "%s Jämför också med måttbilden i galleriet innan du beställer." % matt),
        ("Är den vattentät?",
         "Nej, den är vattenavvisande. Baksidan har en PA-beläggning som håller "
         "undan regn, men duken är inte tät och ska inte behandlas som ett tak."),
    ]
    if g == "D":
        ut.append(("Hur sitter duken fast?",
                   "Med remmar som knäpps runt stommen och stängs med kardborreband. "
                   "Inga verktyg behövs, och duken går lika enkelt att ta av inför "
                   "vintern."))
    ut += [
        ("Tål den snö?",
         "Nej. Duken är ett sommartak — ta ned den inför vintern."),
        ("Vilken färg är det?",
         "Den här duken är %s. Samma tak finns i en färg till." % f),
    ]
    return ut


def syskonrad(pid):
    s = syskon(pid)
    egen, andra = FARG[pid], FARG[s]
    if GRUPP[pid] == "D":
        return ("Den här duken är %s; samma slags tak finns också i %s. Måtten på "
                "det lilla taket skiljer sig två centimeter mellan de två, så jämför "
                "spec-tabellerna innan du väljer: %s."
                % (egen, andra, lank(SLUGG[s], "reservduken i %s" % FARG_I[andra])))
    return ("Den här duken är %s; samma tak finns också i %s: %s."
            % (egen, andra, lank(SLUGG[s], "reservduken i %s" % FARG_I[andra])))


def annanrad(pid):
    if GRUPP[pid] == "D":
        e = [p for p in PRODUKTER if GRUPP[p] == "E"][0]
        return [
            "Är din stomme 3 × 4 m i stället för 3 × 3 m är det en annan duk du "
            "behöver — se " + lank(SLUGG[e], "reservduken till 3 × 4 m") + ".",
            "Det finns också ett dubbeltak i creme i samma storlek: " +
            lank(CREME, "paviljongtak 3 × 3 m med dubbeltak, creme") + ".",
        ]
    d = [p for p in PRODUKTER if GRUPP[p] == "D"][0]
    return [
        "Är din stomme 3 × 3 m i stället för 3 × 4 m är det en annan duk du "
        "behöver — se " + lank(SLUGG[d], "reservduken till 3 × 3 m") + ".",
        "I den mindre storleken finns taket också i creme: " +
        lank(CREME, "paviljongtak 3 × 3 m med dubbeltak, creme") + ".",
    ]


def beskrivning(pid):
    return bygg(ingress(pid), egenskaper(pid), spec(pid), syskonrad(pid),
                annanrad(pid), skotsel(pid), faq(pid))


def namn(pid):
    """☠️ Wix tar hogst 80 tecken i product.name (uppmatt runda 94)."""
    return ("Paviljongtak %s dubbeltak – %s reservduk, utan stomme"
            % (STORLEK[GRUPP[pid]], FARG[pid]))


def seo_titel(pid):
    return "Paviljongtak %s dubbeltak – %s reservduk" % (STORLEK[GRUPP[pid]], FARG[pid])


def seo_beskrivning(pid):
    f = FARG[pid].capitalize()
    if pid == "b6ebc5ba":
        return ("Reservduk till paviljong 3 × 3 m med tak i två nivåer. Litet tak "
                "88 × 88 cm, snedställd kant 174 cm, kanthöjd 18 cm, polyester "
                "180 g/m². %s, utan stomme." % f)
    if pid == "271327e1":
        return ("Reservduk till paviljong 3 × 3 m med tak i två nivåer. Stora duken "
                "300 × 300 cm, litet tak 86 × 86 cm, öppning 68 × 68 cm, kanthöjd "
                "18 cm. %s, utan stomme." % f)
    return ("Reservduk till paviljong 3 × 4 m med tak i två nivåer. Litet tak "
            "94 × 47 cm, kanthöjd 20 cm, polyester 180 g/m² med PA-beläggning. "
            "%s, utan stomme." % f)


SOKORD = {
    "b6ebc5ba": "reservduk paviljong 3x3",
    "271327e1": "reservduk paviljong 3x3",
    "ef0a812d": "paviljongtak 3x4 dubbeltak",
    "dc7d2513": "paviljongtak 3x4 dubbeltak",
}

KORT = {
    "b6ebc5ba": ("Paviljongtak 3 × 3 m", "Mörkgrön duk med litet tak 88 × 88 cm"),
    "271327e1": ("Paviljongtak 3 × 3 m", "Roströd duk 300 × 300 cm med litet tak"),
    "ef0a812d": ("Paviljongtak 3 × 4 m", "Roströd duk med litet tak 94 × 47 cm"),
    "dc7d2513": ("Paviljongtak 3 × 4 m", "Cremevit duk med litet tak 94 × 47 cm"),
}


if __name__ == "__main__":
    for p in PRODUKTER:
        print("%s %s %-9s %2d tecken namn  %d tecken html"
              % (p, GRUPP[p], FARG[p], len(namn(p)), len(beskrivning(p))))
