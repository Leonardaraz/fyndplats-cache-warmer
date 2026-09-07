# -*- coding: utf-8 -*-
"""Runda 96 — familjens fyra SISTA reservtak, och de ar fyra olika saker.

☠️ TVA AV FYRA AR FARGSYSKON TILL EN SIDA JAG PUBLICERADE I RUNDA 95.
   `3f9fda98` och `2bfaf6dd` bar tysk brodtext som ar ORDAGRANT densamma som
   `271327e1`:s — samma 86 x 86 cm lilla tak, samma 68 x 68 cm oppning, samma
   18 cm kanthojd, samma 2,5 kg, samma 32 x 7 x 42 cm, samma 180 g/m2, atta
   dranhal, kardborreband. Bara `Farbe` skiljer. Det ar alltsa EN duk i TRE
   farger, och den publicerade sidan sager "finns i en farg till" — den maste
   rattas i samma runda (uppgift skapad).

☠️ `b6ebc5ba` (morkgron) ar DAREMOT en annan duk trots samma familj: 88 x 88 cm,
   2,6 kg, 32 x 43 x 7 cm. Runda 95:s beslut att inte lana matt mellan de tva
   star alltsa kvar — och blir tydligare nu.

✅ SNEDSTALLDA KANTEN 174 cm AR BEKRAFTAD TVA GANGER for den har duken:
   `3f9fda98`:s ritning skriver "(174 cm)" och `2bfaf6dd`:s ritning "1,74 m".
   Talet saknades pa `271327e1`:s egen ritning och publicerades darfor inte da.
   Nu bar TVA syskonritningar det, och de tva nya sidorna far skriva det.

☠️ MIN EGEN FARGMATNING VAR FEL EN GANG, OCH FELET VAR METODEN. Sonden tar
   dominerande RGB bland icke-vita pixlar i BILD 1 och forutsatter en render pa
   vit botten. `2bfaf6dd`:s bild 1 ar en MILJObild — sonden svarade
   RGB 144,180,72 (H 80 grader = GRONT), vilket var GRASET. Matt om pa ritningen,
   som har vit botten: RGB 144,120,96, H 30 grader, S 20 %, L 47 % = KAFFEBRUN,
   precis vad tyskan sager. Regel: mat fargen pa en bild med vit botten, och
   kontrollera att bilden faktiskt har en.

   | id8 | tyskan | matt (vit botten) | dom |
   |---|---|---|---|
   | `3f9fda98` | Kohlegrau | 72,72,72   S 0 %, L 28 % | morkgra ✓ |
   | `2bfaf6dd` | Kaffee    | 144,120,96 H 30°, L 47 % | kaffebrun ✓ |
   | `9a3600f8` | Dunkelgrau| 72,72,96   H 240°, L 32 % | morkgra ✓ |
   | `22dbd372` | Dunkelgrau| 96,96,96   S 0 %, L 37 %  | morkgra ✓ |

☠️ "WASSERDICHT" I `3f9fda98`:s NAMN AR FALSKT, och det gar att BEVISA har.
   Dess egen brodtext sager "Polyester mit PA-Beschichtung" och "8
   Kunststofflocher fur Wasserabfluss" — aldrig vattentat. Den byte-identiska
   tvillingen `2bfaf6dd` har inget vattenpastaende alls i namnet, och
   `271327e1`, publicerad ur samma text, sager vattenAVVISANDE. Namnet ar
   alltsa den enda kallan som sager vattentat, mot tre som inte gor det.

☠️ `9a3600f8`:s BRODTEXT NAMNGER ARTIKELNUMREN TVA GANGER: "Artikelnummer:
   84C-175, 84C-175BK" och "Geeignet fur Sku: 84C-175, 84C-175BK". De far
   aldrig na sidan — de star i leverantorens egen URL och hos konkurrenten.

⚠️ `9a3600f8`:s BREDD PUBLICERAS INTE. Brodtexten och spec-tabellen sager
   "286L x 245B cm", ritningen sager "231 cm x 286 cm". Langden 286 cm ar
   overens; den andra siffran ar det inte. Sidan sager darfor 286 cm och
   beskriver passformen med stolpavstandet 2,85 x 2 m, som ritningens
   285 x 200 cm bekraftar.

⚠️ `22dbd372` AR SLUT I LAGER. Runda 93 publicerade `bef14fba` i samma lage och
   lat butiken visa den som slutsald. Samma linje har.

⚠️ INGEN LEVERANTOR, INGET HUSMARKE, INGET AVSANDARLAND i texten.
"""

BAS = "https://www.fyndplats.se/produkt/"

# Publicerade syskon i samma familj
ROSTROD = "paviljongtak-3x3-dubbeltak-rostrod"          # samma duk, runda 95
TREFYRA = "paviljongtak-3x4-dubbeltak-rostrod"          # samma slags tak, 3 x 4 m
INDRAGBART = "pergolatak-indragbart-250x255-beige"      # runda 93

PRODUKTER = ["3f9fda98", "2bfaf6dd", "9a3600f8", "22dbd372"]

GRUPP = {"3f9fda98": "A", "2bfaf6dd": "A", "9a3600f8": "P", "22dbd372": "Q"}

SLUGG = {
    "3f9fda98": "paviljongtak-3x3-dubbeltak-morkgra",
    "2bfaf6dd": "paviljongtak-3x3-dubbeltak-kaffebrun",
    "9a3600f8": "pergolamarkis-285x2-utdragbar-morkgra",
    "22dbd372": "pergolatak-298x293-vaggmonterat-morkgra",
}

FARG = {"3f9fda98": "mörkgrå", "2bfaf6dd": "kaffebrun",
        "9a3600f8": "mörkgrå", "22dbd372": "mörkgrå"}

FARG_I = {"mörkgrå": "mörkgrått", "kaffebrun": "kaffebrunt"}

SKU = {
    "3f9fda98": "FP-paviljongtak-3x3-morkgra",
    "2bfaf6dd": "FP-paviljongtak-3x3-kaffebrun",
    "9a3600f8": "FP-pergolamarkis-285x2-morkgra",
    "22dbd372": "FP-pergolatak-298x293-morkgra",
}


def lank(slug, text):
    return '<a href="%s%s">%s</a>' % (BAS, slug, text)


def bygg(ingress, egenskaper, spec, rubrik2, stycken2, skotsel, faq):
    d = ["<p>%s</p>" % ingress]
    d.append("<p><strong>Egenskaper</strong></p><ul>")
    d += ["<li>%s</li>" % e for e in egenskaper]
    d.append("</ul>")
    d.append("<h2>Tekniska specifikationer</h2><ul>")
    d += ["<li><strong>%s:</strong> %s</li>" % (k, v) for k, v in spec]
    d.append("</ul>")
    d.append("<h2>%s</h2>" % rubrik2)
    d += ["<p>%s</p>" % s for s in stycken2]
    d.append("<h2>Användning och skötsel</h2>")
    d += ["<p>%s</p>" % s for s in skotsel]
    d.append("<h2>Vanliga frågor</h2>")
    for f, s in faq:
        d.append("<p><strong>%s</strong></p><p>%s</p>" % (f, s))
    return "".join(d)


# ------------------------------------------------------------- spec-tabeller

def spec_a(farg):
    """☠️ Identisk for bada A-dukarna — det ar SAMMA duk i tva farger."""
    return [
        ("Stora duken", "300 × 300 cm"),
        ("Lilla taket", "86 × 86 cm"),
        ("Öppning i stora taket", "68 × 68 cm"),
        ("Snedställd kant, stora taket", "174 cm"),
        ("Kanthöjd", "18 cm"),
        ("Passar", "paviljong 3 × 3 m med tak i två nivåer"),
        ("Material", "polyester, 180 g/m², med PA-beläggning"),
        ("Dränering", "åtta hål"),
        ("Infästning", "kardborreband"),
        ("Färg", farg),
        ("Vikt", "2,5 kg"),
        ("Paketmått", "32 × 7 × 42 cm"),
        ("Ingår", "endast takduken"),
        ("Ingår inte", "stomme och sidoväggar"),
    ]


SPEC = {
    "9a3600f8": [
        ("Passar", "pergola med stolpavstånd 2,85 × 2 m"),
        ("Dukens längd", "286 cm"),
        ("Utförande", "veckad duk som dras ihop och ut längs balkarna"),
        ("Dränering", "åtta hål"),
        ("Solskydd", "UV 30+"),
        ("Material", "polyester med plastbeläggning"),
        ("Infästning", "monteringshål mot pergolans ram"),
        ("Färg", "mörkgrå"),
        ("Vikt", "1,9 kg"),
        ("Paketmått", "35 × 26 × 7 cm"),
        ("Ingår", "endast duken"),
        ("Ingår inte", "pergola och stomme"),
    ],
    "22dbd372": [
        ("Mått", "298 × 293 cm"),
        ("Passar", "pergola med stolpavstånd 3 × 3 m"),
        ("Dränering", "sexton hål"),
        ("Material", "polyester, 180 g/m², vattenavvisande"),
        ("Infästning", "kardborreband"),
        ("Färg", "mörkgrå"),
        ("Vikt", "3 kg"),
        ("Paketmått", "40 × 40 × 15 cm"),
        ("Ingår", "endast takduken"),
        ("Ingår inte", "stomme och stolpar"),
    ],
}


def spec(pid):
    return spec_a(FARG[pid]) if GRUPP[pid] == "A" else SPEC[pid]


# ------------------------------------------------------------------ innehåll

def ingress(pid):
    f = FARG[pid]
    if GRUPP[pid] == "A":
        return ("Taket tar hela vädret medan stommen står kvar helt fin, och därför "
                "är det taket som behöver bytas. Den här reservduken sätter en "
                "3 × 3 m paviljong i skick igen: stora duken mäter 300 × 300 cm, "
                "det lilla taket ovanpå 86 × 86 cm, och mellan dem sitter en "
                "öppning på 68 × 68 cm som släpper ut varmluften. Duken är %s "
                "polyester på 180 g/m² med PA-beläggning." % f)
    if pid == "9a3600f8":
        return ("En pergola utan duk är bara en ram. Den här reservduken är veckad "
                "och löper längs balkarna, så att du kan dra ihop den för sol och "
                "dra ut den för skugga utan att flytta något. Den är 286 cm lång, "
                "mörkgrå och passar en pergola med stolpavstånd 2,85 × 2 m.")
    return ("Ett pergolatak som hänger och samlar vatten drar i hela ramen och gör "
            "uteplatsen otrevlig att sitta på. Den här reservduken mäter "
            "298 × 293 cm, spänns med kardborreband och har sexton dräneringshål "
            "som leder bort regnet i stället för att låta det bli stående. Den är "
            "mörkgrå och passar en pergola med stolpavstånd 3 × 3 m.")


def egenskaper(pid):
    f = FARG[pid]
    if GRUPP[pid] == "A":
        return [
            "Passar paviljonger på 3 × 3 m där taket är byggt i två nivåer",
            "Öppningen mellan taknivåerna är 68 × 68 cm och släpper ut varmluften",
            "Åtta dräneringshål leder bort regnvattnet så att det inte blir stående",
            "Fästs med kardborreband — går att sätta upp och ta av utan verktyg",
            "Sydd i polyester på 180 g/m² med PA-beläggning",
            "Vattenavvisande, inte vattentät",
            "Stora duken mäter 300 × 300 cm, lilla taket 86 × 86 cm och den "
            "snedställda kanten 174 cm",
            "Kanthöjd 18 cm längs takfoten",
            "Färg: %s" % f,
            "Väger 2,5 kg och kommer i en förpackning på 32 × 7 × 42 cm",
            "Endast takduken ingår — stommen följer inte med",
        ]
    if pid == "9a3600f8":
        return [
            "Veckad duk som dras ihop och ut längs pergolans balkar",
            "Passar en pergola med stolpavstånd 2,85 × 2 m",
            "Duken är 286 cm lång",
            "Fästs i pergolans ram genom monteringshålen",
            "Åtta dräneringshål leder bort regnvattnet",
            "Polyester med plastbeläggning, UV-skydd 30+",
            "Vattenavvisande, inte vattentät",
            "Färg: mörkgrå",
            "Väger 1,9 kg och kommer i en förpackning på 35 × 26 × 7 cm",
            "Endast duken ingår — pergolan följer inte med",
        ]
    return [
        "Passar en pergola med stolpavstånd 3 × 3 m",
        "Duken mäter 298 × 293 cm",
        "Sexton dräneringshål leder bort regnvattnet så att duken inte hänger",
        "Fästs med kardborreband mot den ram du redan har — ingen montering behövs",
        "Sydd i polyester på 180 g/m², vattenavvisande",
        "Vattenavvisande, inte vattentät",
        "Färg: mörkgrå",
        "Väger 3 kg och kommer i en förpackning på 40 × 40 × 15 cm",
        "Endast takduken ingår — stommen följer inte med",
    ]


def rubrik2(pid):
    return ("Samma tak i tre färger" if GRUPP[pid] == "A"
            else "Andra tak till pergola")


def stycken2(pid):
    if GRUPP[pid] == "A":
        egen = FARG[pid]
        andra = "kaffebrun" if pid == "3f9fda98" else "mörkgrå"
        andra_slug = SLUGG["2bfaf6dd"] if pid == "3f9fda98" else SLUGG["3f9fda98"]
        return [
            "Duken är densamma i alla tre färgerna — samma mått, samma väv och "
            "samma infästning. Den här är %s; de andra två är %s och %s."
            % (egen,
               lank(andra_slug, "reservduken i %s" % FARG_I[andra]),
               lank(ROSTROD, "reservduken i rostrött")),
            "Är din stomme 3 × 4 m i stället för 3 × 3 m är det en annan duk du "
            "behöver — se " + lank(TREFYRA, "reservduken till 3 × 4 m") + ".",
        ]
    if pid == "9a3600f8":
        return [
            "Den här duken är veckad och rörlig. Behöver du i stället ett fast tak "
            "som spänns över hela ramen finns "
            + lank(SLUGG["22dbd372"], "pergolataket på 298 × 293 cm") + ".",
            "Ett indragbart pergolatak på 250 × 255 cm finns också i sortimentet: "
            + lank(INDRAGBART, "pergolatak till indragbart tak") + ".",
        ]
    return [
        "Den här duken spänns fast och sitter kvar. Vill du i stället kunna dra "
        "ihop taket för sol finns "
        + lank(SLUGG["9a3600f8"], "den veckade pergolamarkisen på 2,85 × 2 m") + ".",
        "Ett indragbart pergolatak på 250 × 255 cm finns också i sortimentet: "
        + lank(INDRAGBART, "pergolatak till indragbart tak") + ".",
    ]


def skotsel(pid):
    if GRUPP[pid] == "A":
        forsta = ("Mät stommen innan du beställer. Duken sitter på en paviljong på "
                  "3 × 3 m med tak i två nivåer, och stora duken mäter "
                  "300 × 300 cm, det lilla taket 86 × 86 cm och den snedställda "
                  "kanten 174 cm — jämför alla tre med din egen paviljong och med "
                  "måttbilden här i galleriet.")
    elif pid == "9a3600f8":
        forsta = ("Mät pergolan innan du beställer. Duken är gjord för ett "
                  "stolpavstånd på 2,85 × 2 m och är 286 cm lång — jämför med din "
                  "egen ram och med måttbilden här i galleriet.")
    else:
        forsta = ("Mät pergolan innan du beställer. Duken är 298 × 293 cm och gjord "
                  "för ett stolpavstånd på 3 × 3 m — jämför med din egen ram och "
                  "med måttbilden här i galleriet.")
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
    if g == "A":
        matt = ("Mät tre saker: stommen ska vara 3 × 3 m, stora duken 300 × 300 cm "
                "och det lilla taket 86 × 86 cm.")
    elif pid == "9a3600f8":
        matt = ("Mät stolpavståndet: det ska vara 2,85 × 2 m, och duken är 286 cm "
                "lång.")
    else:
        matt = ("Mät stolpavståndet: det ska vara 3 × 3 m, och duken är "
                "298 × 293 cm.")
    ut = [
        ("Ingår stommen?",
         "Nej. Du får bara duken — stomme och stolpar följer inte med."),
        ("Hur vet jag att duken passar?",
         "%s Jämför också med måttbilden i galleriet innan du beställer." % matt),
        ("Är den vattentät?",
         "Nej, den är vattenavvisande. Beläggningen håller undan regn och "
         "dräneringshålen leder bort vattnet, men duken är inte tät och ska inte "
         "behandlas som ett tak."),
    ]
    if g == "A":
        ut.append(("Vad är öppningen mellan taknivåerna till?",
                   "Den är 68 × 68 cm och släpper ut den varma luften som annars "
                   "samlas under taket. Samtidigt får vinden en väg igenom i "
                   "stället för att ta tag i duken."))
    if pid == "9a3600f8":
        ut.append(("Går den att dra ihop?",
                   "Ja. Duken är veckad och löper längs balkarna, så du kan dra "
                   "ihop den för sol och dra ut den för skugga utan att flytta "
                   "något."))
    ut += [
        ("Tål den snö?",
         "Nej. Duken är ett sommartak — ta ned den inför vintern."),
        ("Vilken färg är det?",
         ("Den här duken är %s. Samma tak finns i tre färger." % f) if g == "A"
         else "Den här duken är mörkgrå."),
    ]
    return ut


def beskrivning(pid):
    return bygg(ingress(pid), egenskaper(pid), spec(pid), rubrik2(pid),
                stycken2(pid), skotsel(pid), faq(pid))


def namn(pid):
    """☠️ Wix tar hogst 80 tecken i product.name (uppmatt runda 94)."""
    if GRUPP[pid] == "A":
        return "Paviljongtak 3 × 3 m dubbeltak – %s reservduk, utan stomme" % FARG[pid]
    if pid == "9a3600f8":
        return "Pergolamarkis 2,85 × 2 m – veckad reservduk, mörkgrå, utan stomme"
    return "Pergolatak 298 × 293 cm – reservduk mörkgrå, utan stomme"


def seo_titel(pid):
    if GRUPP[pid] == "A":
        return "Paviljongtak 3 × 3 m dubbeltak – %s reservduk" % FARG[pid]
    if pid == "9a3600f8":
        return "Pergolamarkis 2,85 × 2 m – veckad reservduk, mörkgrå"
    return "Pergolatak 298 × 293 cm – reservduk i mörkgrå polyester"


def seo_beskrivning(pid):
    if GRUPP[pid] == "A":
        return ("Reservduk till paviljong 3 × 3 m med tak i två nivåer. Stora duken "
                "300 × 300 cm, litet tak 86 × 86 cm, öppning 68 × 68 cm, kanthöjd "
                "18 cm, polyester 180 g/m². %s, utan stomme."
                % FARG[pid].capitalize())
    if pid == "9a3600f8":
        return ("Veckad reservduk till pergola med stolpavstånd 2,85 × 2 m. Duken är "
                "286 cm lång, går att dra ihop, har åtta dräneringshål och "
                "UV-skydd 30+. Mörkgrå, utan stomme.")
    return ("Reservduk till pergola med stolpavstånd 3 × 3 m. Duken mäter "
            "298 × 293 cm, fästs med kardborreband och har sexton dräneringshål. "
            "Polyester 180 g/m², mörkgrå, utan stomme.")


SOKORD = {
    "3f9fda98": "reservduk paviljong 3x3",
    "2bfaf6dd": "reservduk paviljong 3x3",
    "9a3600f8": "pergolamarkis reservduk",
    "22dbd372": "pergolatak reservduk",
}

KORT = {
    "3f9fda98": ("Paviljongtak 3 × 3 m", "Mörkgrå duk 300 × 300 cm med litet tak"),
    "2bfaf6dd": ("Paviljongtak 3 × 3 m", "Kaffebrun duk 300 × 300 cm med litet tak"),
    "9a3600f8": ("Pergolamarkis", "Mörkgrå veckad duk, 286 cm lång"),
    "22dbd372": ("Pergolatak", "Mörkgrå duk 298 × 293 cm"),
}


if __name__ == "__main__":
    for p in PRODUKTER:
        print("%s %s %-10s %2d tecken namn  %d tecken html"
              % (p, GRUPP[p], FARG[p], len(namn(p)), len(beskrivning(p))))
