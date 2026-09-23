# -*- coding: utf-8 -*-
"""Runda 94 — fyra reservtak till paviljong 3 x 3 m, i tva skilda modeller.

☠️ TEXTEN SKRIVS I FIL, ALDRIG INLINE. Batch 64 matte skillnaden: fem
   produkter skrivna direkt i API-anropet gav NIO fel som nadde Wix, tre
   skrivna via fil och grep-grind gav noll.

☠️ GRUPP B:S TYSKA TEXT NAMNGER LEVERANTORENS SERIE SOM PASSFORMSNYCKEL:
   "Passend NUR fur 3 x 3(m) Pavillons, 01-0867 Serie". Serienumret ar exakt
   den strang dealproffsen.se publicerar som `sku`/`mpn` — det far aldrig in
   i var text. Passformen uttrycks i MATT: duken 298 x 298 cm, snedstalld
   kant 218 cm, ETT taksteg utan liten topp, och en uppmaning att mata.

☠️ TVA MODELLER, INTE EN FAMILJ I FYRA FARGER. Grupp C ar ett DUBBELTAK
   (stor duk 300 x 300 + liten topp 90 x 90 med natvavd springa emellan),
   grupp B ar ett ENKELT tak (298 x 298, ingen topp). Bilderna visar det
   entydigt. Att slappa ihop dem hade gett fyra sidor som lovar samma sak.

☠️ FARGERNA AR MATTA I BILDEN, inte lanade fran tyskan. Dominerande RGB i
   produktpixlarna pa bild 1 (vit botten):
   · df5a7190 "Hellgrau+Dunkelgrau"  96, 84, 84  L 35 % → GRA, topp L 19 %
   · 60eaf40e "Khaki+Braun"         144,120,108  L 49 % → GRABRUN, topp mork
   · d52c6d1d "Beige"               228,204,168  L 78 % → beige
   · d01a6d2b "Grau"                 72, 72, 72  L 28 % → MORKGRA
   "Hellgrau" och "Grau" ar bada MORKA i verkligheten. Att skriva "ljusgra"
   hade varit en logn kunden ser i forsta bilden.

☠️ 1,65 m PUBLICERAS INTE. Mattritningen bar tre tal tyskan saknar: 1,65 m,
   1,73 m och 0,2 m. Bara 1,73 gar att para ihop med en tysk etikett
   ("abgeschragte Kantenlange, grosses Dach: 173 cm"). 1,65 loper fran ett
   ANNAT horn till samma topp och kan inte vara samma matt — vad den mater
   gar inte att avgora ur ritningen. Kappans 0,2 m saknar likasa etikett.
   Bada utelamnas: ett omarkt matt som far en etikett ar ett pahittat matt.

⚠️ VATTENAVVISANDE, ALDRIG VATTENTAT. Kallan sager "wasserabweisend" och
   "PA-beschichtet". Bada modellerna far dranering — det ar just for att
   vattnet INTE stannar pa duken.

⚠️ INGET TIDSLOFTE. Grupp B:s tyska lovar "Aufbau innerhalb von 5 Minuten".
   Det ar ett loften vi inte matt; kardborrefastet skrivs som ett faktum
   i stallet ("gar att satta upp och ta av utan verktyg").

⚠️ INGEN LEVERANTOR, INGET HUSMARKE, INGET AVSANDARLAND i texten.
"""

BAS = "https://www.fyndplats.se/produkt/"

# Publicerade sidor i samma familj (svep over sitemapens 2 197 produktsidor).
CREME = "paviljongtak-3x3-dubbeltak-creme"
POLYESTER = "paviljongtak-3x3-m-reservtak-polyester"

GRUPP = {"df5a7190": "C", "60eaf40e": "C", "d52c6d1d": "B", "d01a6d2b": "B"}

SLUGG = {
    "df5a7190": "paviljongtak-3x3-tvafargat-dubbeltak-gra",
    "60eaf40e": "paviljongtak-3x3-tvafargat-dubbeltak-brun",
    "d52c6d1d": "paviljongtak-3x3-oxfordvav-370-beige",
    "d01a6d2b": "paviljongtak-3x3-oxfordvav-370-morkgra",
}

# (duken, toppen) for grupp C; (duken, None) for grupp B.
FARG = {
    "df5a7190": ("grå", "mörkgrå"),
    "60eaf40e": ("gråbrun", "mörkbrun"),
    "d52c6d1d": ("beige", None),
    "d01a6d2b": ("mörkgrå", None),
}

# Farg i "i ..."-form: svenskan tar neutrum nar fargen ar ett substantiv
# ("reservduk i grATT"), inte adjektivets grundform.
FARG_I = {"grå": "grått", "gråbrun": "gråbrunt", "beige": "beige",
          "mörkgrå": "mörkgrått"}

PRODUKTER = ["df5a7190", "60eaf40e", "d52c6d1d", "d01a6d2b"]

SKU = {
    "df5a7190": "FP-paviljongtak-tvafarg-gra",
    "60eaf40e": "FP-paviljongtak-tvafarg-brun",
    "d52c6d1d": "FP-paviljongtak-oxford-beige",
    "d01a6d2b": "FP-paviljongtak-oxford-morkgra",
}


def lank(slug, text):
    return '<a href="%s%s">%s</a>' % (BAS, slug, text)


def syskon(pid):
    """Farsyskonet inom samma modell."""
    par = [p for p in PRODUKTER if GRUPP[p] == GRUPP[pid] and p != pid]
    return par[0]


def bygg(ingress, egenskaper, spec, syskonrad, annan, skotsel, faq):
    d = ["<p>%s</p>" % ingress]
    d.append("<p><strong>Egenskaper</strong></p><ul>")
    d += ["<li>%s</li>" % e for e in egenskaper]
    d.append("</ul>")
    d.append("<h2>Tekniska specifikationer</h2><ul>")
    d += ["<li><strong>%s:</strong> %s</li>" % (k, v) for k, v in spec]
    d.append("</ul>")
    d.append("<h2>Samma duk i två färger</h2><p>%s</p>" % syskonrad)
    d.append("<h2>Ser ditt tak annorlunda ut?</h2>")
    d += ["<p>%s</p>" % a for a in annan]
    d.append("<h2>Användning och skötsel</h2>")
    d += ["<p>%s</p>" % s for s in skotsel]
    d.append("<h2>Vanliga frågor</h2>")
    for f, s in faq:
        d.append("<p><strong>%s</strong></p><p>%s</p>" % (f, s))
    return "".join(d)


# ---------------------------------------------------------------- grupp C

def ingress_c(duk, topp):
    return ("Duken är den del av paviljongen som tar allt väder, och den är också "
            "den enda del som brukar behöva bytas. Den här reservduken sitter på en "
            "stomme på 3 × 3 m där taket är byggt i två nivåer: en stor duk på "
            "300 × 300 cm och ett litet tak på 90 × 90 cm ovanpå. Mellan dem sitter "
            "en nätvävd springa som släpper ut den varma luften och låter vinden "
            "passera i stället för att lyfta i duken. Den här duken är %s med %s topp." 
            % (duk, topp))


def egenskaper_c(duk, topp):
    return [
        "Passar paviljonger på 3 × 3 m där taket är byggt i två nivåer",
        "Nätvävd springa mellan de två taknivåerna släpper ut varmluft och låter "
        "vinden passera",
        "Åtta öljetter leder av regnvattnet, så att det inte blir stående och tynger "
        "ned duken",
        "Fästs med kardborreband — går att sätta upp och ta av utan verktyg",
        "Sydd i 100 % polyester på 180 g/m² med PA-beläggning, vattenavvisande och "
        "klassad UPF 30+",
        "Vågskuren kappa längs kanten, i samma väv som resten av duken",
        "Tvåfärgad: %s duk med %s topp" % (duk, topp),
        "Väger 2,9 kg och kommer i en förpackning på 50 × 29 × 8 cm",
        "Endast takduken ingår — stommen följer inte med",
    ]


def spec_c(duk, topp):
    return [
        ("Stora duken", "300 × 300 cm (L × B)"),
        ("Lilla taket", "90 × 90 cm (L × B)"),
        ("Öppning i stora taket", "59 × 59 cm"),
        ("Snedställd kant, stora taket", "173 cm"),
        ("Snedställd kant, lilla taket", "51 cm"),
        ("Passar", "paviljong 3 × 3 m med tak i två nivåer"),
        ("Material", "100 % polyester, 180 g/m², PA-belagd"),
        ("Solskydd", "UPF 30+"),
        ("Öljetter", "8"),
        ("Infästning", "kardborreband"),
        ("Färg", "%s med %s topp" % (duk, topp)),
        ("Vikt", "2,9 kg"),
        ("Paketmått", "50 × 29 × 8 cm"),
        ("Ingår", "takduken, båda nivåerna"),
        ("Ingår inte", "stomme och stänger"),
    ]


SKOTSEL_C = [
    "Mät stommen innan du beställer. Stora duken är 300 × 300 cm, det lilla taket "
    "90 × 90 cm och den snedställda kanten på stora taket 173 cm — jämför alla tre "
    "med din egen paviljong, för utförandet skiljer sig mellan modeller.",
    "Ta ned duken vid storm och kraftigt oväder. Väven på 180 g/m² är gjord för sol "
    "och regn, inte för att sitta kvar i hård vind.",
    "Spola av den med vatten och låt den torka helt innan du viker ihop den. Lägg "
    "undan den torr inför vintern — den är ett sommartak och ska inte bära snö.",
]


def faq_c(duk, topp):
    return [
        ("Ingår stommen?",
         "Nej. Du får takduken i båda nivåerna och ingenting annat — stomme och "
         "stänger följer inte med."),
        ("Hur vet jag att duken passar?",
         "Mät tre saker på din paviljong: stommen ska vara 3 × 3 m, det lilla taket "
         "90 × 90 cm och den snedställda kanten på stora taket 173 cm."),
        ("Vad är springan mellan taknivåerna till?",
         "Den är nätvävd och släpper ut varmluften som annars samlas under taket. "
         "Samtidigt får vinden en väg igenom i stället för att ta tag i duken."),
        ("Är den vattentät?",
         "Nej, den är vattenavvisande. Polyestern har en PA-beläggning som håller "
         "undan regn, och åtta öljetter leder bort vattnet så att det inte blir "
         "stående på duken."),
        ("Tål den snö?",
         "Nej. Väven på 180 g/m² är gjord för sommarhalvåret — ta ned duken inför "
         "vintern."),
        ("Vilken färg är det?",
         "Den här duken är %s med %s topp. Samma modell finns i två färgställningar."
         % (duk, topp)),
    ]


# ---------------------------------------------------------------- grupp B

def ingress_b(duk):
    return ("Ett tak som blivit blekt eller trasigt gör hela paviljongen oanvändbar, "
            "men stommen står oftast kvar helt fin. Den här reservduken byter ut "
            "taket på en paviljong på 3 × 3 m med ett enda taksteg: duken mäter "
            "298 × 298 cm och är sydd i Oxfordväv på 370 g/m², en märkbart tyngre "
            "väv än den som sitter på de flesta paviljongtak. Den är %s, "
            "vattenavvisande och klassad UPF 30+." % duk)


def egenskaper_b(duk):
    return [
        "Passar paviljonger på 3 × 3 m med ett enda taksteg, utan liten topp",
        "Oxfordväv på 370 g/m² med PA-beläggning — en tyngre och styvare väv",
        "Klassad UPF 30+, så att solen silas i stället för att gå rakt igenom",
        "Dräneringshål leder bort regnvattnet i stället för att låta det bli stående",
        "Fästs med kardborreband — går att sätta upp och ta av utan verktyg",
        "Duken mäter 298 × 298 cm och den snedställda kanten 218 cm",
        "Väger 4,8 kg och kommer i en förpackning på 42 × 35 × 9 cm",
        "Takduk och monteringsanvisning ingår — stommen följer inte med",
        "Färg: %s" % duk,
    ]


def spec_b(duk):
    return [
        ("Mått", "298 × 298 cm (L × B)"),
        ("Snedställd kant", "218 cm"),
        ("Passar", "paviljong 3 × 3 m med ett taksteg"),
        ("Material", "Oxfordväv i polyester, 370 g/m², PA-belagd"),
        ("Solskydd", "UPF 30+"),
        ("Dränering", "hål i duken"),
        ("Infästning", "kardborreband"),
        ("Färg", duk),
        ("Vikt", "4,8 kg"),
        ("Paketmått", "42 × 35 × 9 cm"),
        ("Ingår", "takduk och monteringsanvisning"),
        ("Ingår inte", "stomme och stänger"),
    ]


SKOTSEL_B = [
    "Mät stommen innan du beställer. Duken är 298 × 298 cm och den snedställda "
    "kanten 218 cm — mät båda på din egen paviljong, för samma yttermått kan sitta "
    "på tak med olika lutning.",
    "Ta ned duken vid storm och kraftigt oväder. Väven på 370 g/m² är tät och styv, "
    "men den är fäst med kardborreband och ska inte belastas av hård vind.",
    "Spola av den med vatten och låt den torka helt innan du viker ihop den. Lägg "
    "undan den torr inför vintern — den är ett sommartak och ska inte bära snö.",
]


def faq_b(duk):
    return [
        ("Ingår stommen?",
         "Nej. Du får takduken och en monteringsanvisning — stomme och stänger "
         "följer inte med."),
        ("Hur vet jag att duken passar?",
         "Mät två saker på din paviljong: duken ska vara 298 × 298 cm och den "
         "snedställda kanten 218 cm. Taket ska dessutom vara i ett enda steg."),
        ("Vad betyder 370 g/m²?",
         "Det är vävens ytvikt. Paviljongdukarna i vårt eget sortiment ligger "
         "annars på 180 g/m², så den här väven väger drygt dubbelt så mycket "
         "per kvadratmeter — styvare i handen och mindre genomskinlig."),
        ("Är den vattentät?",
         "Nej, den är vattenavvisande. PA-beläggningen håller undan regn, och "
         "dräneringshålen leder bort vattnet så att det inte blir stående på duken."),
        ("Tål den snö?",
         "Nej. Duken är ett sommartak, hur tät väven än är — ta ned den inför "
         "vintern."),
        ("Vilken färg är det?",
         "Den här duken är %s. Samma modell finns i två färger." % duk),
    ]


# ---------------------------------------------------------------- gemensamt

def syskonrad(pid):
    s = syskon(pid)
    egen = FARG[pid][0]
    andra = FARG[s][0]
    if GRUPP[pid] == "C":
        topp = FARG[s][1]
        return ("Duken är densamma i båda färgställningarna — samma mått, samma väv "
                "och samma infästning. Den här är %s; den andra är %s."
                % (egen, lank(SLUGG[s], "%s med %s topp" % (andra, topp))))
    return ("Duken är densamma i båda färgerna — samma mått, samma väv och samma "
            "infästning. Den här är %s; den andra är %s."
            % (egen, lank(SLUGG[s], andra)))


def annanrad(pid):
    if GRUPP[pid] == "C":
        enkel = [p for p in PRODUKTER if GRUPP[p] == "B"][0]
        return [
            "Sitter ditt tak i ett enda steg, utan en liten topp ovanpå, är det en "
            "annan duk du behöver — se " + lank(SLUGG[enkel], "reservduken i Oxfordväv") + ".",
            "Det finns också ett dubbeltak i creme i sortimentet: " +
            lank(CREME, "paviljongtak 3 × 3 m med dubbeltak, creme") + ". Måtten på "
            "den lilla toppen och den snedställda kanten skiljer sig från den här "
            "duken, så jämför spec-tabellerna innan du väljer.",
        ]
    dubbel = [p for p in PRODUKTER if GRUPP[p] == "C"][0]
    return [
        "Har din paviljong ett tak i två nivåer, med en liten topp ovanpå den stora "
        "duken, är det en annan duk du behöver — se " +
        lank(SLUGG[dubbel], "reservduken med dubbeltak") + ".",
        "Ett tunnare reservtak med ventilerad topp finns också: " +
        lank(POLYESTER, "paviljongtak 3 × 3 m i polyester") + ".",
    ]


def beskrivning(pid):
    duk, topp = FARG[pid]
    if GRUPP[pid] == "C":
        return bygg(ingress_c(duk, topp), egenskaper_c(duk, topp), spec_c(duk, topp),
                    syskonrad(pid), annanrad(pid), SKOTSEL_C, faq_c(duk, topp))
    return bygg(ingress_b(duk), egenskaper_b(duk), spec_b(duk),
                syskonrad(pid), annanrad(pid), SKOTSEL_B, faq_b(duk))


def namn(pid):
    """☠️ WIX TAR HOGST 80 TECKEN I `product.name`.

    Uppmatt 2026-09-07: 400 INVALID_ARGUMENT, "has size 91, expected 80 or
    less". Forsta namnet bar bada fargerna OCH "tvafargat" och sprangde taket.
    Toppfargen bars nu av seo-titeln och kortet i stallet; "utan stomme" star
    kvar, for det ar den dyraste missuppfattningen pa den har sidan.
    """
    duk, topp = FARG[pid]
    if GRUPP[pid] == "C":
        return ("Paviljongtak 3 × 3 m dubbeltak – %s duk med %s topp, utan stomme"
                % (duk, topp))
    return ("Paviljongtak 3 × 3 m Oxfordväv 370 g/m² – reservduk i %s, utan stomme"
            % FARG_I[duk])


def seo_titel(pid):
    duk, topp = FARG[pid]
    if GRUPP[pid] == "C":
        return "Paviljongtak 3 × 3 m dubbeltak – %s duk med %s topp" % (duk, topp)
    return "Paviljongtak 3 × 3 m i Oxfordväv 370 g/m² – %s duk" % duk


def seo_beskrivning(pid):
    duk, topp = FARG[pid]
    if GRUPP[pid] == "C":
        return ("Reservduk till paviljong 3 × 3 m med tak i två nivåer. "
                "300 × 300 cm plus en topp på 90 × 90 cm, nätvävd springa, åtta "
                "öljetter och kardborrefäste. %s duk med %s topp, utan stomme."
                % (duk.capitalize(), topp))
    return ("Reservduk till paviljong 3 × 3 m med ett taksteg. 298 × 298 cm i "
            "Oxfordväv på 370 g/m², PA-belagd och klassad UPF 30+. %s duk, utan "
            "stomme." % duk.capitalize())


SOKORD = {
    "df5a7190": "paviljongtak 3x3 dubbeltak",
    "60eaf40e": "paviljongtak 3x3 dubbeltak",
    "d52c6d1d": "paviljongtak 3x3 oxfordväv",
    "d01a6d2b": "paviljongtak 3x3 oxfordväv",
}

# Kortets rubrik + underrad bor HAR och lintas har (runda 91:s lardom).
KORT = {
    "df5a7190": ("Paviljongtak 3 × 3 m", "Grå duk med mörkgrå topp"),
    "60eaf40e": ("Paviljongtak 3 × 3 m", "Gråbrun duk med mörkbrun topp"),
    "d52c6d1d": ("Paviljongtak 3 × 3 m", "Beige duk i Oxfordväv"),
    "d01a6d2b": ("Paviljongtak 3 × 3 m", "Mörkgrå duk i Oxfordväv"),
}


if __name__ == "__main__":
    for p in PRODUKTER:
        print(p, GRUPP[p], FARG[p][0], len(beskrivning(p)), "tecken html")
