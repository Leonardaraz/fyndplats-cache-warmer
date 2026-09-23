# -*- coding: utf-8 -*-
"""Runda 113 Steg 7 — åtta kylapparater i tre grupper.

☠️ FYRA PÅSTÅENDEN UR LEVERANTÖRENS TEXT FÅR INTE FÖLJA MED:

  1. `Weinkühlschrank, leise` — ordet står i produktnamnet på `480849a7`, som
     är 41 dB. Det är familjens HÖGSTA ljudnivå tillsammans med `15d30e23`,
     mot `47a91a17`:s 37 dB. Leverantören har alltså döpt den tystaste
     egenskapen på den minst tysta modellen. Ordet "tyst" skrivs inte ut på
     någon av de fyra vinkylarna; talet i dB står i spec-tabellen och får tala.
  2. `Mini-Gefrierschrank, 35 L Minikühlschrank` — `9a33e15f` kallas både frys
     och kylskåp i sitt eget namn. Den går till −24 °C och är en FRYS. Ett
     "minikylskåp" som fryser sönder mjölken är ett returärende.
  3. `AC 230V 60Hz` på `47a91a17`. Svenska nätet är 50 Hz och familjens sju
     andra rader säger 50 Hz. Sannolikt databladsfel — men "sannolikt" är
     ingen källa, och att skriva 50 Hz vore att hitta på. Frekvensen utelämnas.
  4. `Kühlmittel: R600` på `fdbfcea0` mot `R600a` på de sju andra. Samma
     resonemang: köldmediet utelämnas hellre än gissas.

☠️ OCH ETT PÅSTÅENDE SOM MÅSTE MED, av lag: (EU) 2019/2016 kräver att varje
   visuell annons för en specifik modell — uttryckligen inklusive på internet —
   bär energieffektivitetsklassen OCH skalan. Alla åtta sidorna skriver därför
   ut klassen med "skalan går från A till G". Det gäller vinkylar också.

⚠️ Flaskkapaciteten är leverantörens, räknad på Ø 7 × 31,5 cm-flaskor. En
   Bordeauxflaska är bredare än så, och en Burgundyflaska betydligt bredare.
   Talet skrivs därför alltid med sitt villkor och aldrig som ett löfte.
"""
import matt

BAS = "https://www.fyndplats.se/produkt/"


def tal(x):
    """Svensk sifferstil: decimalkomma, inga onödiga nollor."""
    if isinstance(x, float) and x == int(x):
        x = int(x)
    return str(x).replace(".", ",")


SLUG = {
    "8cfe5171": "minifrys-35-liter-lasbar-vit",
    "a33ece7a": "minifrys-35-liter-lasbar-gra",
    "9a33e15f": "minifrys-35-liter-silver",
    "b2c76518": "minifrys-35-liter-svart",
    "47a91a17": "vinkyl-12-flaskor-smal",
    "15d30e23": "vinkyl-16-flaskor-bankhojd",
    "480849a7": "vinkyl-18-flaskor-hog",
    "fdbfcea0": "vinkyl-20-flaskor-53-liter",
}

# ☠️ SKU:erna är HANDGJORDA. `PRODUCT_PART_MAX = 24` kapar på bindestreck, och
#    fyra av rundans slugs börjar `minifrys-35-liter` (17 tecken) medan fyra
#    börjar `vinkyl` — importen gav redan alla fyra frysarna SAMMA SKU
#    (`FP-mini-gefrierschrank-35-l`, mätt i Steg 3). Det som skiljer dem åt
#    ligger i svansen, och det är svansen 24 tecken klipper bort.
SKU = {
    "8cfe5171": "FP-minifrys-35-las-vit",
    "a33ece7a": "FP-minifrys-35-las-gra",
    "9a33e15f": "FP-minifrys-35-silver",
    "b2c76518": "FP-minifrys-35-svart",
    "47a91a17": "FP-vinkyl-12-flaskor",
    "15d30e23": "FP-vinkyl-16-flaskor",
    "480849a7": "FP-vinkyl-18-flaskor",
    "fdbfcea0": "FP-vinkyl-20-flaskor",
}

NAMN = {
    "8cfe5171": "Låsbar minifrys 35 liter – 47 × 44,2 × 48,8 cm, vit, med nyckellås",
    "a33ece7a": "Låsbar minifrys 35 liter – 47 × 44,2 × 48,8 cm, grå, med nyckellås",
    "9a33e15f": "Minifrys 35 liter – 47 × 44,2 × 48,8 cm, silver, vändbar dörr",
    "b2c76518": "Minifrys 35 liter – 47 × 44,2 × 48,8 cm, svart, vändbar dörr",
    "47a91a17": "Vinkyl 12 flaskor – 26,5 cm bred, 8–18 °C, 37 dB",
    "15d30e23": "Vinkyl 16 flaskor – 56,5 cm hög, får plats under bänken",
    "480849a7": "Vinkyl 18 flaskor – 34,5 cm bred och 78 cm hög, touchpanel",
    "fdbfcea0": "Vinkyl 20 flaskor – 53 liter, 43 × 45 × 64 cm, touchpanel",
}

TITEL = {
    "8cfe5171": "Låsbar minifrys 35 liter, vit | Fyndplats",
    "a33ece7a": "Låsbar minifrys 35 liter, grå | Fyndplats",
    "9a33e15f": "Minifrys 35 liter, silver | Fyndplats",
    "b2c76518": "Minifrys 35 liter, svart | Fyndplats",
    "47a91a17": "Vinkyl 12 flaskor, 26,5 cm bred | Fyndplats",
    "15d30e23": "Vinkyl 16 flaskor under bänken | Fyndplats",
    "480849a7": "Vinkyl 18 flaskor, smal och hög | Fyndplats",
    "fdbfcea0": "Vinkyl 20 flaskor, 53 liter | Fyndplats",
}

META = {
    "8cfe5171": "Låsbar minifrys 35 liter med nyckellås, −14 till −24 °C och "
                "5-stegs termostat. 47 × 44,2 × 48,8 cm, vit. Energiklass E (A–G).",
    "a33ece7a": "Låsbar minifrys 35 liter med nyckellås, −14 till −24 °C och "
                "5-stegs termostat. 47 × 44,2 × 48,8 cm, grå. Energiklass E (A–G).",
    "9a33e15f": "Minifrys 35 liter i silver med vändbar dörr, −14 till −24 °C och "
                "5-stegs termostat. 47 × 44,2 × 48,8 cm. Energiklass E (A–G).",
    "b2c76518": "Minifrys 35 liter i svart med vändbar dörr, −14 till −24 °C och "
                "5-stegs termostat. 47 × 44,2 × 48,8 cm. Energiklass E (A–G).",
    "47a91a17": "Vinkyl för 12 flaskor, bara 26,5 cm bred. 8–18 °C, 37 dB, "
                "75 kWh per år. Glasdörr med UV-skydd. Energiklass E (A–G).",
    "15d30e23": "Vinkyl för 16 flaskor, 56,5 cm hög och byggd för att stå under "
                "bänken. 5–18 °C, glasdörr med UV-skydd. Energiklass G (A–G).",
    "480849a7": "Vinkyl för 18 flaskor på 34,5 cm bredd och 78 cm höjd. 5–18 °C, "
                "touchpanel, glasdörr med UV-skydd. Energiklass G (A–G).",
    "fdbfcea0": "Vinkyl för 20 flaskor, 53 liter på 43 × 45 × 64 cm. 5–18 °C, "
                "39 dB, glasdörr med UV-skydd. Energiklass G (A–G).",
}

SOKORD = {
    "8cfe5171": ["låsbar minifrys", "minifrys 35 liter", "frysbox med lås", "minifrys vit"],
    "a33ece7a": ["låsbar minifrys", "minifrys 35 liter", "frysbox med lås", "minifrys grå"],
    "9a33e15f": ["minifrys", "minifrys 35 liter", "frysbox", "minifrys silver"],
    "b2c76518": ["minifrys", "minifrys 35 liter", "frysbox", "minifrys svart"],
    "47a91a17": ["vinkyl", "vinkyl 12 flaskor", "smal vinkyl", "vinkylskåp"],
    "15d30e23": ["vinkyl", "vinkyl 16 flaskor", "vinkyl under bänk", "vinkylskåp"],
    "480849a7": ["vinkyl", "vinkyl 18 flaskor", "hög vinkyl", "vinkylskåp"],
    "fdbfcea0": ["vinkyl", "vinkyl 20 flaskor", "vinkyl 53 liter", "vinkylskåp"],
}

# Korshänvisning: (nyckel eller None, text). En None-nyckel länkar till den
# PUBLICERADE syskonsidan i stället för till en av rundans egna.
SYSKON = {
    "8cfe5171": ("a33ece7a", "samma frys i grått"),
    "a33ece7a": ("8cfe5171", "samma frys i vitt"),
    "9a33e15f": ("b2c76518", "samma frys i svart"),
    "b2c76518": ("9a33e15f", "samma frys i silver"),
    "47a91a17": ("fdbfcea0", "vinkyl för 20 flaskor"),
    "15d30e23": ("fdbfcea0", "vinkyl för 20 flaskor"),
    "480849a7": ("47a91a17", "smalare vinkyl för 12 flaskor"),
    "fdbfcea0": ("15d30e23", "lägre vinkyl för 16 flaskor"),
}


# ── Byggstenar ───────────────────────────────────────────────────────────────
def P(s):
    return "<p>%s</p>" % s


def H(s):
    return "<h2>%s</h2>" % s


def LI(etikett, varde):
    return "<li><strong>%s:</strong> %s</li>" % (etikett, varde)


def lank(nyckel, text):
    # ☠️ ABSOLUT adress. En relativ href skrivs om av Wix till `https:/produkt/x`
    #    med ETT snedstreck — en absolut adress mot värden `produkt`, alltså död.
    slug = matt.SYSKON["slug"] if nyckel is None else SLUG[nyckel]
    return '<a href="%s%s">%s</a>' % (BAS, slug, text)


def yttre(k):
    b, d, h = matt.YTTRE[k]
    return "%s × %s × %s cm" % (tal(b), tal(d), tal(h))


def paket(k):
    b, d, h = matt.PAKET[k]
    return "%s × %s × %s cm" % (tal(b), tal(d), tal(h))


# ☠️ RUNDANS SIGNATURSTYCKE, och det som gör hela familjen jämförbar: klassen
#    OCH skalan. Det är inte en servicegest utan ett krav i (EU) 2019/2016 på
#    varje visuell annons för en specifik modell, internet inräknat. Stycket
#    körs på alla åtta och grinden fäller om någon sida saknar det.
def energistycke(k):
    klass = matt.ENERGIKLASS[k]
    rad = ("Skåpet har <strong>energiklass %s</strong> på skalan A till G, där A "
           "är effektivast." % klass)
    if k in matt.ARSFORBRUKNING:
        rad += (" Tillverkaren anger förbrukningen till %s kWh per år vid sina "
                "provförhållanden — din egen siffra beror på hur varmt rummet är "
                "och hur ofta dörren öppnas."
                % tal(matt.ARSFORBRUKNING[k]))
    else:
        rad += (" Årsförbrukningen i kWh finns inte i underlaget för just den "
                "här modellen, så vi skriver ingen — effekten är %s W när "
                "kompressorn går." % tal(matt.EFFEKT[k]))
    return P(rad)


# ── Grupp A och B: minifrysarna ─────────────────────────────────────────────
def frys_facken(k):
    (b1, d1, h1), (b2, d2, h2) = matt.INNERFACK[k]
    return P("Innanför dörren ligger två fack. Det övre är %s × %s × %s cm och "
             "det undre %s × %s × %s cm — tillsammans 35 liter. Hyllan mellan "
             "dem går att ta ut när du behöver höjden, och den bär %s kg."
             % (tal(b1), tal(d1), tal(h1), tal(b2), tal(d2), tal(h2),
                tal(matt.HYLLAST[k])))


def frys_temperatur(k):
    return P("Termostatvredet har fem lägen och spannet går från −14 till −24 °C. "
             "Det lägsta läget räcker till glass som ska hållas hård; det högsta "
             "är rimligt för matlådor och bröd som ändå omsätts. Frysen frostar "
             "av manuellt, alltså genom att stängas av och tömmas — det finns "
             "ingen automatik som gör det åt dig.")


def frys_las(k):
    return H("Nyckellås på dörren") + P(
        "Dörren har ett nyckellås mitt på fronten och två nycklar följer med. "
        "Det är skillnaden mot vår %s: samma skåp, samma 35 liter, men den här "
        "går att låsa. Det spelar roll i ett garage, ett kontorskök, en "
        "studentkorridor eller en uthyrd stuga — överallt där skåpet står "
        "framme och fler än ett hushåll rör sig runt det."
        % lank(None, "minifrys utan lås"))


def frys_dorr(k):
    v = matt.DORRVINKEL[k]
    extra = ("Dörren öppnar %s grader, alltså inte hela vägen ut till väggen — "
             "räkna med att stå snett framför skåpet när du plockar i det "
             "understa facket." % tal(v)) if v == 135 else (
            "Dörren öppnar %s grader, alltså rakt ut, så hela öppningen är fri "
            "när du plockar i facken." % tal(v))
    return H("Dörren kan hängas om") + P(
        "Gångjärnen går att flytta till andra sidan, så dörren kan öppnas åt "
        "det håll som passar rummet. Det avgörs vid uppställningen och kräver "
        "bara medföljande anvisning. " + extra)


# ── Grupp C: vinkylarna ─────────────────────────────────────────────────────
def vin_flaskor(k):
    n = matt.FLASKOR[k]
    return P("Kapaciteten är angiven till <strong>%s flaskor</strong>, "
             "räknat på standardflaskor om 750 ml med måtten %s. En Bordeauxflaska "
             "är bredare än så och en Burgundyflaska bredare än den — blandar du "
             "former får du plats med färre. Trådhyllorna går att ta ut, så höga "
             "flaskor kan ställas i ett fack utan hylla."
             % (tal(n), matt.FLASKMATT))


def vin_temperatur(k):
    lag = matt.TEMPERATUR[k].split("–")[0]
    text = ("Kompressorn håller %s och ställs med touchpanelen på fronten. "
            "Rött vin serveras typiskt kring 16–18 °C och vitt kring 8–12 °C, "
            "så spannet täcker båda — men skåpet har EN zon, inte två, så det "
            "håller en temperatur i taget." % matt.TEMPERATUR[k])
    if lag == "8":
        text += (" Lägsta läget är 8 °C, vilket är några grader varmare än de "
                 "andra vinkylarna vi säljer. Ska du servera ett vitt vin riktigt "
                 "kallt är det inte den här modellen.")
    return H("Temperaturen") + P(text)


def vin_dorr(k):
    return H("Glasdörren") + P(
        "Dörren är dubbelglasad och filtrerar UV-ljus, så flaskorna kan stå "
        "framme utan att ljuset bryter ner vinet. Innanför sitter en blå LED "
        "som går att släcka från panelen. Dörren är %s cm tjock och glaset är "
        "härdat." % tal(4))


def vin_placering(k):
    b, d, h = matt.YTTRE[k]
    if k == "47a91a17":
        s = ("Skåpet är bara %s cm brett — familjens smalaste — och %s cm högt. "
             "Det är måttet som avgör: en lucka på 30 cm mellan en bänk och en "
             "vägg räcker, och där passar ingen av våra andra vinkylar."
             % (tal(b), tal(h)))
    elif k == "15d30e23":
        s = ("Skåpet är %s cm högt, alltså lägre än en standardbänk på 90 cm, "
             "och %s cm brett. Det är byggt för att stå under en bänkskiva eller "
             "på ett barskåp utan att ta höjden i rummet." % (tal(h), tal(b)))
    elif k == "480849a7":
        s = ("Skåpet är %s cm brett och %s cm högt — det tar flaskorna på höjden "
             "i stället för på bredden — smalare än %s, och med två flaskor till."
             % (tal(b), tal(h), lank("15d30e23", "vinkylen för 16 flaskor")))
    else:
        s = ("Skåpet är %s × %s × %s cm och rymmer familjens flesta flaskor. Det "
             "är högre än %s men lika brett och lika djupt, så det ryms på samma "
             "plats om takhöjden i nischen tillåter."
             % (tal(b), tal(d), tal(h),
                lank("15d30e23", "vinkylen för 16 flaskor")))
    s += (" Det står fritt och ska inte byggas in — kompressorn behöver luft "
          "runt sig, och fötterna går att justera så skåpet står plant på ett "
          "ojämnt golv.")
    return H("Var det får plats") + P(s)


def vin_ljud(k):
    db = matt.LJUD[k]
    jamforelse = ("Det är familjens lägsta tal och hörs ungefär som ett tyst "
                  "rum." if db == 37 else
                  "Det är ungefär som ett kylskåp i ett kök." if db == 39 else
                  "Kompressorn hörs, och i ett sovrum eller ett tyst arbetsrum "
                  "märks den.")
    return H("Ljudnivån") + P(
        "Tillverkaren anger %s dB. %s Det är en kompressorkyl, inte en "
        "termoelektrisk — den kyler bättre och blir aldrig helt ljudlös."
        % (tal(db), jamforelse))


# ── Spec-tabellen ───────────────────────────────────────────────────────────
def spec(k):
    g = matt.GRUPPER[k]
    r = [LI("Yttermått", yttre(k) + " (B × D × H)")]
    if g in "AB":
        (b1, d1, h1), (b2, d2, h2) = matt.INNERFACK[k]
        r.append(LI("Innermått", "%s × %s × %s cm (övre fack), %s × %s × %s cm "
                                 "(undre fack)"
                    % (tal(b1), tal(d1), tal(h1), tal(b2), tal(d2), tal(h2))))
    r.append(LI("Volym", "%s liter" % tal(matt.VOLYM[k])))
    if g == "C":
        r.append(LI("Flaskkapacitet", "%s flaskor à 750 ml (%s)"
                    % (tal(matt.FLASKOR[k]), matt.FLASKMATT)))
    r.append(LI("Temperaturområde", matt.TEMPERATUR[k]
                + (", fem steg" if g in "AB" else "")))
    # ☠️ LAGKRAV: klass OCH skala, (EU) 2019/2016.
    r.append(LI("Energiklass", "%s (skalan går från A till G)" % matt.ENERGIKLASS[k]))
    if k in matt.ARSFORBRUKNING:
        r.append(LI("Årsförbrukning", "%s kWh" % tal(matt.ARSFORBRUKNING[k])))
    r.append(LI("Effekt", "%s W" % tal(matt.EFFEKT[k])))
    # ☠️ 47a91a17 saknar spänningsrad med flit — leverantören anger 60 Hz.
    if k in matt.SPANNING:
        r.append(LI("Spänning", matt.SPANNING[k]))
    r.append(LI("Ljudnivå", "%s dB%s" % (tal(matt.LJUD[k]),
                ", ljudklass %s" % matt.LJUDKLASS[k] if k in matt.LJUDKLASS else "")))
    # ☠️ fdbfcea0 saknar köldmedierad med flit — leverantören anger R600.
    if k in matt.KOLDMEDIUM:
        r.append(LI("Köldmedium", matt.KOLDMEDIUM[k]))
    if g in "AB":
        r.append(LI("Avfrostning", "manuell"))
        r.append(LI("Dörröppning", "%s°, dörren kan hängas om"
                    % tal(matt.DORRVINKEL[k])))
    r.append(LI("Hyllast", "%s kg per hyllplan" % tal(matt.HYLLAST[k])))
    r.append(LI("Sladdlängd", "%s m" % tal(matt.SLADD[k])))
    r.append(LI("Material", " och ".join(matt.MATERIAL[k])))
    r.append(LI("Färg", matt.FARG[k]))
    r.append(LI("Vikt", "%s kg" % tal(matt.VIKT[k])))
    r.append(LI("Paketmått", paket(k)))
    if k in matt.INGAR:
        r.append(LI("Ingår", " och ".join(matt.INGAR[k])))
    r.append(LI("Montering", "ingen – skåpet ställs på plats och kopplas in"))
    return H("Tekniska specifikationer") + "<ul>" + "".join(r) + "</ul>"


SKOTSEL = {
    "A": P("Låt skåpet stå upprätt några timmar efter transporten innan du "
           "startar det, så att oljan hinner rinna tillbaka i kompressorn. "
           "Frosta av manuellt när islagret börjar ta av utrymmet: stäng av, "
           "töm, låt isen smälta av sig själv och torka ur. Bänd aldrig loss is "
           "med något vasst — innerväggen är tunn och en punktering tar "
           "köldmediet med sig. Förvara nycklarna på ett annat ställe än i låset."),
    "B": P("Låt skåpet stå upprätt några timmar efter transporten innan du "
           "startar det, så att oljan hinner rinna tillbaka i kompressorn. "
           "Frosta av manuellt när islagret börjar ta av utrymmet: stäng av, "
           "töm, låt isen smälta av sig själv och torka ur. Bänd aldrig loss is "
           "med något vasst — innerväggen är tunn och en punktering tar "
           "köldmediet med sig."),
    "C": P("Låt skåpet stå upprätt några timmar efter transporten innan du "
           "startar det. Torka glaset med en fuktig trasa utan lösningsmedel, "
           "och damma av gallret på baksidan ett par gånger om året — dammar det "
           "igen får kompressorn arbeta hårdare och ljudnivån stiger. Ställ "
           "flaskorna liggande så att korken hålls fuktig."),
}


def faq(k):
    g = matt.GRUPPER[k]
    f = []
    if g in "AB":
        f.append(("Hur kallt blir det?",
                  "Från −14 till −24 °C, ställt i fem steg med termostatvredet. "
                  "Lägsta läget håller glass hård; högsta räcker för matlådor "
                  "och bröd."))
        f.append(("Kan den stå i ett garage eller ett förråd?",
                  "Ja, så länge utrymmet är torrt och frostfritt. En frys som "
                  "står i ett kallt rum arbetar sämre, inte bättre: termostaten "
                  "mäter luften runt sig, och i ett rum som redan är kallt "
                  "startar kompressorn för sällan för att hålla facket "
                  "tillräckligt kallt."))
        f.append(("Avfrostar den själv?",
                  "Nej, avfrostningen är manuell. Du stänger av skåpet, tömmer "
                  "det och låter isen smälta av sig själv. En isskopa och en "
                  "istärningsform följer med."))
        if g == "A":
            f.append(("Vad låser låset?",
                      "Dörren. Ett nyckellås sitter mitt på fronten och två "
                      "nycklar följer med. Det är det som skiljer den här "
                      "modellen från vår %s — i övrigt är skåpen lika stora."
                      % lank(None, "minifrys utan lås")))
        f.append(("Kan dörren öppnas åt andra hållet?",
                  "Ja. Gångjärnen flyttas till motsatt sida enligt medföljande "
                  "anvisning, så skåpet kan ställas i ett hörn åt det håll som "
                  "passar. Gör det vid uppställningen, innan skåpet fyllts."))
    else:
        f.append(("Hur många flaskor får plats på riktigt?",
                  "Det angivna talet är %s flaskor och gäller standardflaskor på "
                  "750 ml med måtten %s. Bordeaux- och Burgundyflaskor är "
                  "bredare, så en blandad samling ger färre. Hyllorna går att ta "
                  "ut om du behöver höjden."
                  % (tal(matt.FLASKOR[k]), matt.FLASKMATT)))
        f.append(("Håller den både rött och vitt samtidigt?",
                  "Nej. Skåpet har en zon och håller en temperatur i taget, "
                  "inom %s. Vill du servera rött och vitt vid sina egna "
                  "temperaturer behöver du två zoner, och det har den här inte."
                  % matt.TEMPERATUR[k]))
        f.append(("Kan den byggas in?",
                  "Nej, den ska stå fritt. Kompressorn och gallret på baksidan "
                  "behöver luft, och byggs skåpet in stiger både förbrukningen "
                  "och ljudnivån. Fötterna justeras så att det står plant."))
        f.append(("Hörs den?",
                  "Tillverkaren anger %s dB. Det är en kompressorkyl — den kyler "
                  "bättre än en termoelektrisk och blir aldrig helt tyst. I ett "
                  "vardagsrum försvinner den i bakgrunden; i ett sovrum märks den."
                  % tal(matt.LJUD[k])))
    f.append(("Vilken energiklass har den?",
              "Energiklass %s på skalan A till G, där A är effektivast.%s"
              % (matt.ENERGIKLASS[k],
                 " Tillverkaren anger %s kWh per år." % tal(matt.ARSFORBRUKNING[k])
                 if k in matt.ARSFORBRUKNING else "")))
    f.append(("Vad väger den?",
              "%s kg. Bär den upprätt och till två personer om trappan är brant "
              "— läggs en kompressorkyl ner på sidan måste den stå och vila "
              "innan den startas." % tal(matt.VIKT[k])))
    return H("Vanliga frågor") + "".join(
        # ☠️ Wix STRIPPAR <br>. Fråga och svar skrivs som TVÅ <p>.
        P("<strong>%s</strong>" % q) + P(a) for q, a in f)


INGRESS = {
    "A": lambda k: "En låsbar <strong>minifrys</strong> på 35 liter som håller "
                   "−14 till −24 °C. Skåpet är %s, står fritt på golvet och har "
                   "ett nyckellås mitt på dörren." % yttre(k),
    "B": lambda k: "En <strong>minifrys</strong> på 35 liter som håller −14 till "
                   "−24 °C. Skåpet är %s, står fritt på golvet och dörren kan "
                   "hängas om åt det håll rummet kräver." % yttre(k),
    "C": lambda k: "En <strong>vinkyl</strong> för %s flaskor med kompressor, "
                   "glasdörr med UV-skydd och touchpanel. Skåpet är %s och "
                   "håller %s." % (tal(matt.FLASKOR[k]), yttre(k),
                                   matt.TEMPERATUR[k]),
}


def bygg(k):
    g = matt.GRUPPER[k]
    syskon, syskontext = SYSKON[k]
    if g in "AB":
        kropp = (H("Två fack på 35 liter")
                 + frys_facken(k)
                 + H("Temperaturen")
                 + frys_temperatur(k)
                 + (frys_las(k) if g == "A" else "")
                 + frys_dorr(k)
                 + H("Energiklass")
                 + energistycke(k))
    else:
        kropp = (H("Flaskorna")
                 + vin_flaskor(k)
                 + vin_temperatur(k)
                 + vin_dorr(k)
                 + vin_placering(k)
                 + vin_ljud(k)
                 + H("Energiklass")
                 + energistycke(k))
    html = (P(INGRESS[g](k))
            + kropp
            + P("Finns också som %s." % lank(syskon, syskontext))
            + spec(k)
            + H("Användning och skötsel")
            + SKOTSEL[g]
            + faq(k))
    return {"k": k, "id": matt.WIX[k], "namn": NAMN[k], "slug": SLUG[k],
            "titel": TITEL[k], "meta": META[k], "sku": SKU[k],
            "sokord": [{"term": t, "isMain": i == 0}
                       for i, t in enumerate(SOKORD[k])],
            "html": html}


ALLA = {k: bygg(k) for k in matt.WIX}

if __name__ == "__main__":
    for k, d in ALLA.items():
        print("%s  %-28s  %5d tecken  namn %d  titel %d  meta %d"
              % (k, d["slug"], len(d["html"]), len(d["namn"]),
                 len(d["titel"]), len(d["meta"])))
