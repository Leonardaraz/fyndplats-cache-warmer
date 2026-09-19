# -*- coding: utf-8 -*-
"""Runda 93 — tre reservdukar till pergola med indragbart tak.

☠️ TEXTEN SKRIVS I FIL, ALDRIG INLINE. Batch 64 mätte skillnaden: fem
   produkter skrivna direkt i API-anropet gav NIO fel som nådde Wix, tre
   skrivna via fil och grep-grind gav noll.

☠️ KÄLLAN NAMNGER LEVERANTÖRENS ARTIKELNUMMER SOM PASSFORMSNYCKEL. Den tyska
   texten säger "Nur geeignet für 3 x 3 m Pavillons (Sku: 84C-054GY,
   84C-054BK)". Numret är det farligaste vi har att läcka — dealproffsen.se
   publicerar samma sträng som `sku`/`mpn`. Passformen uttrycks därför med
   MÅTT i stället: 250 × 255 cm, 3 × 3 m stomme, indragbart tak, mät själv.

☠️ ENDAST DUKEN INGÅR. Källan är entydig: varken stomme, takskenor eller
   stänger följer med. Det måste stå i klartext — det är den dyraste
   missuppfattningen en kund kan göra på den här sidan.

☠️ FÄRGERNA ÄR MÄTTA I BILDEN, inte lånade från tyskan. Median-RGB i
   mittfältet på huvudbilden:
   · 8ea111a2 "Beige"  189,177,147 → beige
   · 9304f8b8 "Kaffee"  89, 63, 52 → MÖRKBRUN (mörkast av de tre)
   · bef14fba "Braun"  146,122, 99 → brun
   Kaffee är alltså mörkare än Braun. Att skriva "brun" på båda hade gjort
   två skilda artiklar omöjliga att skilja åt.

⚠️ SEX STÅNGFICKOR är en gräns, inte en förmån. Källan: "hat nur Taschen für
   sechs Stangen". Den skrivs som ett mått kunden ska räkna med.

⚠️ VÄDERBEGRÄNSNINGEN ÄR KÄLLANS EGEN och skrivs som en skötselanvisning,
   aldrig som en säkerhetsgaranti. Ingen standard nämns någonstans.

⚠️ INGEN LEVERANTÖR, INGET HUSMÄRKE, INGET AVSÄNDARLAND i texten.
"""

BAS = "https://www.fyndplats.se/produkt/"

# Publicerad sida för den som mätt fel och har en paviljong med FAST tak.
PAVILJONG = "paviljongtak-3x3-m-reservtak-polyester"

SLUGG = {
    "8ea111a2": "pergolatak-indragbart-250x255-beige",
    "9304f8b8": "pergolatak-indragbart-250x255-morkbrun",
    "bef14fba": "pergolatak-indragbart-250x255-brun",
}

FARG = {"8ea111a2": "beige", "9304f8b8": "mörkbrun", "bef14fba": "brun"}

PRODUKTER = ["8ea111a2", "9304f8b8", "bef14fba"]


def lank(slug, text):
    return '<a href="%s%s">%s</a>' % (BAS, slug, text)


def bygg(ingress, egenskaper, spec, syskon, paviljong, skotsel, faq):
    d = ["<p>%s</p>" % ingress]
    d.append("<p><strong>Egenskaper</strong></p><ul>")
    d += ["<li>%s</li>" % e for e in egenskaper]
    d.append("</ul>")
    d.append("<h2>Tekniska specifikationer</h2><ul>")
    d += ["<li><strong>%s:</strong> %s</li>" % (k, v) for k, v in spec]
    d.append("</ul>")
    d.append("<h2>Samma duk i tre färger</h2><p>%s</p>" % syskon)
    d.append("<h2>Har du en paviljong med fast tak?</h2><p>%s</p>" % paviljong)
    d.append("<h2>Användning och skötsel</h2>")
    d += ["<p>%s</p>" % s for s in skotsel]
    d.append("<h2>Vanliga frågor</h2>")
    for f, s in faq:
        d.append("<p><strong>%s</strong></p><p>%s</p>" % (f, s))
    return "".join(d)


def egenskaper(farg):
    return [
        "Passar pergolor och paviljonger på 3 × 3 m där taket dras in på skenor",
        "Tio dräneringshål på 14 mm, så att regnvattnet rinner av i stället för att samlas i vecken",
        "Färdiga hål i duken för infästning i stommen",
        "Fickor för sex stänger — duken har inte fler",
        "Sydd i 100 %% polyester på 180 g/m², i %s" % farg,
        "Väger 2 kg och kommer i en förpackning på 36 × 35 × 9 cm",
        "Endast takduken ingår — stomme, takskenor och stänger följer inte med",
    ]


def spec(farg):
    return [
        ("Mått", "250 × 255 cm (L × B)"),
        ("Passar", "pergola eller paviljong 3 × 3 m med indragbart tak"),
        ("Material", "100 % polyester, 180 g/m²"),
        ("Dräneringshål", "10 st, 14 mm"),
        ("Stångfickor", "6"),
        ("Färg", farg),
        ("Vikt", "2 kg"),
        ("Paketmått", "36 × 35 × 9 cm"),
        ("Ingår", "endast takduken"),
        ("Ingår inte", "stomme, takskenor och stänger"),
    ]


SKOTSEL = [
    "Mät stommen innan du beställer. Duken är 250 × 255 cm och är gjord för pergolor "
    "och paviljonger på 3 × 3 m med indragbart tak, men utförandet skiljer sig mellan "
    "modeller — jämför måtten med din egen stomme.",
    "Ta in duken vid storm, hård vind och kraftigt regn. Den är gjord för sol och lätt "
    "nederbörd, inte för att sitta kvar i oväder.",
    "Spola av den med vatten och låt den torka helt innan du viker ihop den. Lägg undan "
    "den torr inför vintern, så håller väven längre.",
]


def faq(farg):
    return [
        ("Ingår stommen?",
         "Nej. Du får takduken och ingenting annat — stomme, takskenor och stänger "
         "följer inte med."),
        ("Hur vet jag att duken passar?",
         "Den är gjord för stommar på 3 × 3 m med indragbart tak och mäter 250 × 255 cm. "
         "Mät din egen stomme och jämför innan du beställer."),
        ("Tål den regn?",
         "Duken har tio dräneringshål så att vattnet rinner av i stället för att bli "
         "stående i vecken. Vid storm eller kraftigt regn ska den tas in."),
        ("Hur många stänger finns det plats för?",
         "Sex. Duken är sydd med fickor för sex stänger, inte fler."),
        ("Vilken färg är det?",
         "Den här duken är %s. Samma modell finns i tre färger." % farg),
    ]


def syskonrad(pid):
    andra = [p for p in PRODUKTER if p != pid]
    bitar = [lank(SLUGG[p], FARG[p]) for p in andra]
    return ("Duken är densamma i alla tre färgerna — samma mått, samma väv och samma "
            "infästning. Den här är %s; de andra två är %s och %s."
            % (FARG[pid], bitar[0], bitar[1]))


PAVILJONGRAD = ("Den här duken kräver en stomme där taket dras in på skenor. Sitter taket "
                "fast på din paviljong är det en annan duk du behöver — se "
                + lank(PAVILJONG, "reservtaket till paviljong") + ".")


def ingress(farg):
    return ("Duken är den del av pergolan som tar allt väder, och den är också den enda "
            "del som brukar behöva bytas. Den här reservduken sitter på pergolor och "
            "paviljonger på 3 × 3 m där taket dras in på skenor: du byter duken och "
            "låter stommen stå kvar. Den mäter 250 × 255 cm, väger 2 kg och är sydd i "
            "%s polyester på 180 g/m² med tio dräneringshål." % farg)


def namn(pid):
    return "Pergolatak till indragbart tak 250 × 255 cm, %s" % FARG[pid]


def seo_titel(pid):
    return "Pergolatak 250 × 255 cm till indragbart tak – %s" % FARG[pid]


def seo_beskrivning(pid):
    return ("Reservduk till pergola eller paviljong 3 × 3 m med indragbart tak. "
            "250 × 255 cm i %s polyester, 180 g/m², med tio dräneringshål. "
            "Endast duken ingår." % FARG[pid])


SOKORD = "pergolatak reservduk indragbart tak"

SKU = {
    "8ea111a2": "FP-pergolatak-250x255-beige",
    "9304f8b8": "FP-pergolatak-250x255-morkbrun",
    "bef14fba": "FP-pergolatak-250x255-brun",
}

# Kortets rubrik + underrad bor HÄR och lintas här (runda 91:s lärdom).
KORT = {
    "8ea111a2": ("Pergolatak 250 × 255 cm", "Beige duk till indragbart tak"),
    "9304f8b8": ("Pergolatak 250 × 255 cm", "Mörkbrun duk till indragbart tak"),
    "bef14fba": ("Pergolatak 250 × 255 cm", "Brun duk till indragbart tak"),
}


def beskrivning(pid):
    f = FARG[pid]
    return bygg(ingress(f), egenskaper(f), spec(f), syskonrad(pid),
                PAVILJONGRAD, SKOTSEL, faq(f))


if __name__ == "__main__":
    for p in PRODUKTER:
        print(p, FARG[p], len(beskrivning(p)), "tecken html")
