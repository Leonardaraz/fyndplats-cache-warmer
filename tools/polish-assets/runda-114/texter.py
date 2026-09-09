# -*- coding: utf-8 -*-
"""Runda 114 — de nio sidornas text. Skriven i EN FIL, aldrig inline.

☠️ FIL FÖRST, SEDAN GRIND, SEDAN ANROP. Runda 64 mätte skillnaden: fem
   produkter skrivna direkt i API-anropet gav NIO fel som nådde Wix, tre
   skrivna via fil gav noll. En sträng i ett JSON-anrop kan inte grep:as innan
   den lämnar chatten, och svaret ekar tillbaka exakt det man skrev.

Fyra saker den här rundan bär som Steg 2 och Steg 5 avgjorde:

  ENERGIKLASS   Två av nio är elnätsdrivna kylapparater över tio liter och
                bär därför klassen OCH skalan — (EU) 2019/2016 artikel 1.
                De sju andra får den INTE, för de har ingen.
  KYLINTERVALL  De fyra små kylarnas tal är avlästa ur MÅTTBILDEN. Spec-
                blockets "2 °C" ensamt var oanvändbart mot "omgivning
                10–30 °C"; intervallet 2–17 respektive 2–16 °C är svaret.
  INGEN MJÖLK   4-litersmodellen säljs i källan för "Muttermilch und
                Medikamenten". En Peltier-kyl med tillåten omgivning upp till
                30 °C kan inte garantera kylkedjan, och mot kunden är VI
                leverantören. Varken texten eller bilderna bär den användningen.
  INGET LÅS     `e6d2e70b`:s marknadsföringsgrafik säger "Schloss & Schlüssel".
                Den tyska brödtexten nämner inget lås och inget foto visar ett.
                En ikon ensam är inget underlag.
"""
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HAR)
import matt                                                     # noqa: E402

BAS = "https://www.fyndplats.se/produkt/"


def tal(x):
    """Svensk sifferstil: decimalkomma, inga onödiga nollor."""
    s = ("%g" % x)
    return s.replace(".", ",")


SLUG = {
    "397b845e": "kylvagn-56-liter-84-cm-bred",
    "412c9f43": "kosmetikkyl-6-liter-spegel-rosa",
    "d754d015": "kosmetikkyl-6-liter-spegel-vit",
    "758f0a80": "minikyl-4-liter-kyler-och-varmer-rosa",
    "d5cc9efa": "minikyl-4-liter-kyler-och-varmer-cremevit",
    "b3e3aac8": "kylbox-42-6-liter-utan-el",
    "b815de72": "kylbox-70-liter-pa-hjul",
    "e6d2e70b": "kylskap-91-liter-frysfack",
    "ef0fa603": "dryckeskyl-44-liter-svart",
}

# ☠️ HANDGJORDA. Den mekaniska regeln kapar vid 24 tecken och hade gett samma
#    SKU åt färgtvillingarna — precis den krock IMPORTEN redan skapat två av.
SKU = {
    "397b845e": "FP-kylvagn-56l-84cm",
    "412c9f43": "FP-kosmetikkyl-6l-rosa",
    "d754d015": "FP-kosmetikkyl-6l-vit",
    "758f0a80": "FP-minikyl-4l-rosa",
    "d5cc9efa": "FP-minikyl-4l-cremevit",
    "b3e3aac8": "FP-kylbox-42l-passiv",
    "b815de72": "FP-kylbox-70l-hjul",
    "e6d2e70b": "FP-kylskap-91l-frysfack",
    "ef0fa603": "FP-dryckeskyl-44l",
}

FOKUS = {
    "397b845e": "kylvagn", "412c9f43": "kosmetikkyl", "d754d015": "kosmetikkyl",
    "758f0a80": "minikyl", "d5cc9efa": "minikyl", "b3e3aac8": "kylbox",
    "b815de72": "kylbox", "e6d2e70b": "kylskåp", "ef0fa603": "dryckeskyl",
}

NAMN = {
    "397b845e": "Kylvagn 56 liter, 84 cm bred – fällbart lock och underhylla",
    "412c9f43": "Kosmetikkyl 6 liter med spegel och LED – rosa",
    "d754d015": "Kosmetikkyl 6 liter med spegel och LED – vit",
    "758f0a80": "Minikyl 4 liter som kyler och värmer – rosa",
    "d5cc9efa": "Minikyl 4 liter som kyler och värmer – crèmevit",
    "b3e3aac8": "Kylbox 42,6 liter utan el – håller kylan i 72 timmar",
    "b815de72": "Kylbox 70 liter på hjul – håller kylan i 72 timmar",
    "e6d2e70b": "Kylskåp 91 liter med frysfack – 84 cm högt, vändbar dörr",
    "ef0fa603": "Dryckeskyl 44 liter – 4–18 °C, LED-belysning, svart",
}

TITEL = {
    "397b845e": "Kylvagn 56 liter, 84 cm bred med underhylla",
    "412c9f43": "Kosmetikkyl 6 liter med spegel, rosa",
    "d754d015": "Kosmetikkyl 6 liter med spegel, vit",
    "758f0a80": "Minikyl 4 liter, kyler och värmer, rosa",
    "d5cc9efa": "Minikyl 4 liter, kyler och värmer, crèmevit",
    "b3e3aac8": "Kylbox 42,6 liter utan el, 72 timmar",
    "b815de72": "Kylbox 70 liter på hjul, 72 timmar",
    "e6d2e70b": "Kylskåp 91 liter med frysfack, 84 cm",
    "ef0fa603": "Dryckeskyl 44 liter, 4–18 °C, svart",
}

META = {
    "397b845e": ("Kylvagn på hjul med 56 liters isolerad box, 84 cm bred. Fällbart "
                 "lock, flasköppnare med kapsyluppsamlare, underhylla och "
                 "dräneringsplugg. Utan ström."),
    "412c9f43": ("Kosmetikkyl på 6 liter med spegel, LED-ljus i tre steg och två "
                 "hyllplan. Kyler till 2–17 °C, 26 dB, 24,3 × 19,4 × 35,6 cm."),
    "d754d015": ("Kosmetikkyl på 6 liter med spegel, LED-ljus i tre steg och två "
                 "hyllplan. Kyler till 2–17 °C, 26 dB, 24,3 × 19,4 × 35,6 cm."),
    "758f0a80": ("Minikyl på 4 liter som både kyler till 2–16 °C och värmer till "
                 "50–65 °C. 26 dB, avtagbar hylla, bärhandtag. 20,3 × 26,3 × 28 cm."),
    "d5cc9efa": ("Minikyl på 4 liter som både kyler till 2–16 °C och värmer till "
                 "50–65 °C. 26 dB, avtagbar hylla, bärhandtag. 20,3 × 26,3 × 28 cm."),
    "b3e3aac8": ("Kylbox på 42,6 liter med PU-skum i väggarna, avtappningsventil och "
                 "två sidhandtag. Bär 70 kg. 66,6 × 38,5 × 40 cm. Kräver ingen ström."),
    "b815de72": ("Kylbox på 70 liter med hjul, dragbygel, två spännlås och "
                 "avtappningsventil. Locket öppnar 90°. Bär 70 kg. 84 × 42,2 × 44,3 cm."),
    "e6d2e70b": ("Kylskåp på 91 liter med frysfack på 10 liter, vändbar dörr och "
                 "justerbara hyllplan. Energiklass E, 41 dB. 47,5 × 44,2 × 84 cm."),
    "ef0fa603": ("Dryckeskyl på 44 liter med termostat 4–18 °C, LED-belysning och två "
                 "uttagbara hyllplan. Energiklass E, 35 dB, 73 kWh per år."),
}

SOKORD = {
    "397b845e": ["kylvagn", "kylvagn på hjul", "serveringsvagn med kylbox",
                 "kylbox med hjul", "flasköppnare"],
    "412c9f43": ["kosmetikkyl", "kylskåp för hudvård", "minikyl med spegel",
                 "skincare-kyl", "kosmetikkyl rosa"],
    "d754d015": ["kosmetikkyl", "kylskåp för hudvård", "minikyl med spegel",
                 "skincare-kyl", "kosmetikkyl vit"],
    "758f0a80": ["minikyl", "minikyl som värmer", "kyl och värmebox",
                 "beautykyl", "minikyl rosa"],
    "d5cc9efa": ["minikyl", "minikyl som värmer", "kyl och värmebox",
                 "beautykyl", "minikyl crèmevit"],
    "b3e3aac8": ["kylbox", "passiv kylbox", "kylbox camping", "termobox",
                 "kylbox 42 liter"],
    "b815de72": ["kylbox", "kylbox på hjul", "kylbox camping", "termobox",
                 "kylbox 70 liter"],
    "e6d2e70b": ["kylskåp", "litet kylskåp", "kylskåp med frysfack",
                 "kylskåp 91 liter", "kylskåp vändbar dörr"],
    "ef0fa603": ["dryckeskyl", "dryckeskylskåp", "minibar", "dryckeskyl 44 liter",
                 "kylskåp för drycker"],
}

# (nyckel eller rå slug, länktext). ☠️ `397b845e` länkar till en PUBLICERAD
# sida som inte ingår i rundan — den andra kylvagnen. Att inte länka dem hade
# lämnat två nästan lika sidor utan förklaring av vad som skiljer.
SYSKON = {
    "397b845e": ("kylvagn-56-liter-hjul-flaskoppnare",
                 "en smalare kylvagn på 67 cm med tvådelat lock"),
    "412c9f43": ("d754d015", "samma kosmetikkyl i vitt"),
    "d754d015": ("412c9f43", "samma kosmetikkyl i rosa"),
    "758f0a80": ("d5cc9efa", "samma minikyl i crèmevitt"),
    "d5cc9efa": ("758f0a80", "samma minikyl i rosa"),
    "b3e3aac8": ("b815de72", "en större kylbox på 70 liter med hjul"),
    "b815de72": ("b3e3aac8", "en mindre kylbox på 42,6 liter utan hjul"),
    "e6d2e70b": ("ef0fa603", "en dryckeskyl på 44 liter"),
    "ef0fa603": ("e6d2e70b", "ett kylskåp på 91 liter med frysfack"),
}


# ── Byggstenar ───────────────────────────────────────────────────────────────
def P(s):
    return "<p>%s</p>" % s


def H(s):
    return "<h2>%s</h2>" % s


def LI(etikett, varde):
    return "<li><strong>%s:</strong> %s</li>" % (etikett, varde)


def lank(mal, text):
    # ☠️ ABSOLUT adress. En relativ href skrivs om av Wix till `https:/produkt/x`
    #    med ETT snedstreck — en absolut adress mot värden `produkt`, alltså död.
    slug = SLUG.get(mal, mal)
    return '<a href="%s%s">%s</a>' % (BAS, slug, text)


def yttre(k):
    b, d, h = matt.YTTERMATT[k]
    return "%s × %s × %s cm" % (tal(b), tal(d), tal(h))


def inre(k):
    b, d, h = matt.INNERMATT[k]
    return "%s × %s × %s cm" % (tal(b), tal(d), tal(h))


def kylrad(k):
    lo, hi = matt.KYLINTERVALL[k]
    return "%s–%s °C" % (tal(lo), tal(hi))


def varmerad(k):
    lo, hi = matt.VARMEINTERVALL[k]
    return "%s–%s °C" % (tal(lo), tal(hi))


# ☠️ LAGKRAV, INTE STIL. (EU) 2019/2016 artikel 1 gäller elnätsdrivna
#    kylapparater över tio liter; för dem kräver förordningen klassen OCH
#    skalan i varje visuell annons för en specifik modell, internet inräknat.
#    Stycket körs därför på exakt två av nio, och grinden fäller åt BÅDA håll:
#    saknas det på en av de två, eller står det på någon av de sju andra.
def energistycke(k):
    klass = matt.ENERGIKLASS[k]
    rad = ("Skåpet har <strong>energiklass %s</strong> på skalan A till G, där A "
           "är effektivast." % klass)
    if k in matt.ARSFORBRUKNING:
        rad += (" Vid provförhållandena motsvarar det %d kWh per år — din egen "
                "siffra beror på hur varmt rummet är och hur ofta du öppnar dörren."
                % matt.ARSFORBRUKNING[k])
    else:
        rad += (" Någon årsförbrukning i kilowattimmar följer inte med underlaget "
                "för den här modellen, så vi anger ingen.")
    return P(rad)


# ── Grupp V: kylvagnen ───────────────────────────────────────────────────────
def kropp_v(k):
    return (
        H("84 cm bred, och det är hela poängen")
        + P("Vagnen är %s. Bredden ger plats åt en isolerad box på %s liter OCH "
            "en underhylla under den, så glas, servetter och det som inte ska "
            "kylas har en egen yta. Invändigt mäter boxen %s."
            % (yttre(k), tal(matt.VOLYM[k]), inre(k)))
        + H("Locket fälls upp i ett stycke")
        + P("Du öppnar hela kylutrymmet på en gång och stänger det lika snabbt. "
            "Locket bär 10 kg, underhyllan 10 kg och vagnen 65 kg totalt.")
        + H("Flasköppnare med kapsyluppsamlare")
        + P("Öppnaren sitter monterad på sidan och kapsylerna hamnar i en behållare "
            "under. Ingen som letar öppnare, inga kapsyler i gräset.")
        + H("Fyra hjul, två med broms")
        + P("Vagnen rullar dit sällskapet är och står stilla när den kommit fram — "
            "också på en altan som lutar.")
        + H("Dräneringsplugg i botten")
        + P("När isen har smält skruvar du upp pluggen och tömmer vagnen där den "
            "står. Ingen lyftning av 56 liter vatten.")
        + H("Kylan kommer från is, inte från el")
        + P("Vagnen har varken sladd eller kompressor. Du fyller på is eller "
            "kylklampar, och de ingår inte. Med boxen fylld håller kylan i upp "
            "till 36 timmar.")
    )


# ── Grupp P: passiva kylboxar ────────────────────────────────────────────────
def kropp_p(k):
    hjul = k == "b815de72"
    ut = (H("72 timmar på is, utan sladd")
          + P("Väggarna är gjutna med PU-skum mellan två skal av HDPE-plast. Det "
              "är isoleringen som gör jobbet: fylld med is håller boxen kylan i "
              "upp till 72 timmar. Ingen ström, inget batteri, ingenting att ladda.")
          + H("%s liter, %s utvändigt" % (tal(matt.VOLYM[k]), yttre(k)))
          + P("Invändigt mäter boxen %s. Locket öppnas uppåt%s."
              % (inre(k), " i 90 grader" if hjul else "")))
    if hjul:
        ut += (H("Hjul och dragbygel")
               + P("Två hjul i bakkanten och en bygel att dra i — 70 liter fyllt "
                   "med is och dryck är inget man bär. Två spännlås håller locket "
                   "stängt på ojämnt underlag."))
    else:
        ut += (H("Två sidhandtag")
               + P("Handtagen sitter på kortsidorna och är 16 cm långa, så två "
                   "personer kan lyfta boxen tillsammans utan att komma i vägen "
                   "för varandra."))
    ut += (H("Avtappningsventil i botten")
           + P("Smältvattnet tappas av utan att boxen behöver tippas. Skruva upp, "
               "låt rinna, torka ur.")
           + H("Locket bär 70 kg")
           + P("Boxen är byggd för att sitta på. Det är samma tal som "
               "konstruktionens maxlast, alltså en vuxen med marginal."))
    return ut


# ── Grupp K: kosmetikkylen 6 L ───────────────────────────────────────────────
def kropp_k(k):
    lo, hi = matt.OMGIVNING[k]
    return (
        H("6 liter på två hyllplan")
        + P("Serum, ampuller, ansiktsmasker och ögonkräm får en egen plats i "
            "stället för att samsas med matvarorna. Invändigt mäter skåpet %s, "
            "och hyllan delar utrymmet i två våningar." % inre(k))
        + H("Spegel med LED i tre steg")
        + P("Hela dörren är en spegel med en ljusram runt. Du trycker på "
            "touchsymbolen för att växla mellan tre ljusstyrkor, så att sminket "
            "går att lägga på samma ljus som du kommer att synas i.")
        + H("Kyler till %s" % kylrad(k))
        + P("Termoelementet arbetar mot rumstemperaturen, så hur långt ned skåpet "
            "kommer beror på hur varmt du har det. Det är byggt för ett rum mellan "
            "%s och %s °C." % (tal(lo), tal(hi)))
        + H("26 dB och 18 W")
        + P("Skåpet har ingen kompressor utan ett termoelement, och det hörs på "
            "ljudnivån: 26 dB. Effekten är 18 W.")
        + H("Bärhandtag och skyddade fötter")
        + P("Handtaget sitter på ovansidan och fötterna har skyddsdynor, så skåpet "
            "kan flyttas mellan sovrum och badrum utan att lämna märken.")
    )


# ── Grupp B: minikylen 4 L som också värmer ──────────────────────────────────
def kropp_b(k):
    lo, hi = matt.OMGIVNING[k]
    return (
        H("Kyler %s — och värmer %s" % (kylrad(k), varmerad(k)))
        + P("Samma skåp gör båda. Du väljer läge på baksidan: kyla för hudvård och "
            "dryck, värme för handdukar och ansiktsmasker. Kylsidan arbetar mot "
            "rumstemperaturen och är byggd för ett rum mellan %s och %s °C."
            % (tal(lo), tal(hi)))
        + H("4 liter med avtagbar hylla")
        + P("Invändigt mäter skåpet %s. Hyllan går att lyfta ur när något är för "
            "högt — en serumflaska står upp lika bra som en burk ligger ner." % inre(k))
        + H("26 dB")
        + P("Det finns ingen kompressor i skåpet utan ett termoelement, och "
            "ljudnivån är 26 dB. Effekten är 18 W.")
        + H("Handtag i konstläder")
        + P("Handtaget är klätt i konstläder och sitter på ovansidan. Fyra "
            "halkskydd under skåpet håller det på plats.")
        + H("I lådan")
        + P("Skåpet, hyllan, en nätadapter och en bruksanvisning.")
    )


# ── Grupp E: de två elnätsdrivna skåpen ──────────────────────────────────────
def kropp_e(k):
    if k == "e6d2e70b":
        return (
            H("81 liter kyl och 10 liter frys")
            + P("Frysfacket sitter överst med en egen lucka, kyldelen under. "
                "Tillsammans blir det 91 liter i ett skåp som är %s." % yttre(k))
            + H("Vändbar dörr")
            + P("Gångjärnen går att flytta till andra sidan, så dörren öppnas åt "
                "det håll ditt kök faktiskt har plats för. Dörren öppnar 180 grader.")
            + H("Justerbara hyllplan och dörrfack")
            + P("Hyllplanen flyttas i höjdled efter vad som ska in, och varje plan "
                "bär 15 kg. I dörren finns fack för flaskor och burkar.")
            + H("Termostat 0–10 °C")
            + P("Temperaturen ställs med en vridratt. Manuell avfrostning — "
                "frysfacket ska frostas av när islagret börjar ta plats.")
            + H("41 dB")
            + P("Skåpet har en kompressor, och den hörs när den går igång. "
                "Ljudnivån är 41 dB.")
            + H("Med i lådan")
            + P("Skåpet, en isbehållare, en isskopa och en bruksanvisning. "
                "Sladden är 1,5 m.")
            + H("Energiklass")
            + energistycke(k)
        )
    return (
        H("44 liter för dryck, inte för färskvaror")
        + P("Termostaten går mellan 4 och 18 °C, alltså dryckestemperatur snarare "
            "än kylskåpstemperatur. Det är ett skåp för läsk, öl, vin och "
            "hudvård — inte ett skåp att flytta över kylvarorna till. Utvändigt "
            "är det %s." % yttre(k))
        + H("Två uttagbara hyllplan")
        + P("Hyllplanen lyfts ur när något är för högt, och dörren har egna fack. "
            "Hyllhöjden är 10 cm och skåpet bär 10 kg.")
        + H("135 graders dörröppning och LED inuti")
        + P("Dörren svänger upp 135 grader, så du kommer åt hela djupet även när "
            "skåpet står i ett hörn. Innerbelysningen är LED.")
        + H("Justerbar framfot")
        + P("Foten fram skruvas upp eller ner tills skåpet står stadigt, också på "
            "ett golv som lutar.")
        + H("35 dB")
        + P("Skåpet har en kompressor. Ljudnivån är 35 dB, och sladden är 1,7 m.")
        + H("Energiklass")
        + energistycke(k)
    )


KROPP = {"V": kropp_v, "P": kropp_p, "K": kropp_k, "B": kropp_b, "E": kropp_e}

INGRESS = {
    "V": lambda k: ("En kylvagn som rullar dit sällskapet är. Boxen rymmer %s liter, "
                    "locket fälls upp i ett stycke och på sidan sitter en "
                    "flasköppnare med kapsyluppsamlare. Under boxen finns en hylla "
                    "till glasen. Den behöver ingen ström — du fyller på is."
                    % tal(matt.VOLYM[k])),
    "P": lambda k: ("En kylbox som håller kylan i upp till 72 timmar på is, utan "
                    "sladd och utan batteri. %s liter mellan väggar av HDPE-plast "
                    "med PU-skum emellan, och en avtappningsventil i botten när "
                    "isen har smält." % tal(matt.VOLYM[k])),
    "K": lambda k: ("En kosmetikkyl på %s liter med spegel i dörren och LED-ljus i "
                    "tre steg. Hudvården får en egen plats i stället för att stå i "
                    "köket, och spegeln gör skåpet till en sminkplats i sig."
                    % tal(matt.VOLYM[k])),
    "B": lambda k: ("En minikyl på %s liter som gör två saker: kyler hudvård och "
                    "dryck, eller värmer handdukar och ansiktsmasker. Ett handtag i "
                    "konstläder på ovansidan gör att den följer med dit du är."
                    % tal(matt.VOLYM[k])),
    "E": lambda k: ("Ett kylskåp på 91 liter där frysfacket sitter överst med egen "
                    "lucka. Dörren går att vända, hyllplanen att flytta, och skåpet "
                    "är bara 47,5 cm brett." if k == "e6d2e70b" else
                    "En dryckeskyl på 44 liter med termostat mellan 4 och 18 °C, "
                    "LED-belysning och en dörr som öppnar 135 grader. Byggd för "
                    "dryck och hudvård, inte för färskvaror."),
}


def spec(k):
    r = [LI("Yttermått", yttre(k) + " (B × D × H)")]
    if k in matt.INNERMATT:
        r.append(LI("Invändigt", inre(k)))
    r.append(LI("Volym", "%s liter" % tal(matt.VOLYM[k])))
    if k in matt.KYLINTERVALL:
        r.append(LI("Kyler till", kylrad(k)))
    if k in matt.VARMEINTERVALL:
        r.append(LI("Värmer till", varmerad(k)))
    if k in matt.OMGIVNING:
        lo, hi = matt.OMGIVNING[k]
        r.append(LI("Lämplig rumstemperatur", "%s–%s °C" % (tal(lo), tal(hi))))
    if k in matt.ENERGIKLASS:
        r.append(LI("Energiklass", "%s på skalan A till G" % matt.ENERGIKLASS[k]))
    if k in matt.ARSFORBRUKNING:
        r.append(LI("Energiförbrukning", "%d kWh per år" % matt.ARSFORBRUKNING[k]))
    if k in matt.LJUD:
        r.append(LI("Ljudnivå", "%d dB" % matt.LJUD[k]))
    if matt.GRUPPER[k] in ("K", "B"):
        r.append(LI("Effekt", "18 W"))
    if k == "ef0fa603":
        r.append(LI("Effekt", "65 W"))
    if matt.GRUPPER[k] in ("V", "P"):
        r.append(LI("Max belastning", "70 kg" if matt.GRUPPER[k] == "P" else "65 kg"))
    r.append(LI("Material", matt.MATERIAL[k]))
    r.append(LI("Färg", matt.FARG[k]))
    r.append(LI("Vikt", "%s kg" % tal(matt.VIKT[k])))
    if k == "397b845e":
        r.append(LI("Montering", "krävs"))
    if matt.GRUPPER[k] in ("V", "P"):
        r.append(LI("Kylning", "is eller kylklampar, ingår inte"))
    return H("Tekniska specifikationer") + "<ul>%s</ul>" % "".join(r)


SKOTSEL = {
    "V": P("Töm smältvattnet genom dräneringspluggen och torka ur boxen efter varje "
           "användning — vatten som blir stående en vecka luktar unket, och lukten "
           "sitter i. Töm kapsyluppsamlaren under öppnaren. Lås de två bromsade "
           "hjulen när vagnen står på ett lutande underlag."),
    "P": P("Skölj ur boxen och låt locket stå på glänt tills insidan är torr — en "
           "stängd fuktig box luktar illa nästa gång du öppnar den. Tappa av "
           "smältvattnet genom ventilen i botten. Ställ inte boxen i direkt solljus "
           "när du vill att isen ska räcka; skuggan är värd flera timmar."),
    "K": P("Dra ur sladden och torka ur skåpet med en fuktig trasa några gånger per "
           "år. Spegeln tål glasrengöring på trasan, inte sprutad direkt på ramen. "
           "Ställ skåpet så att luften kommer åt baksidan — ett termoelement gör sig "
           "av med värmen där, och står det tätt mot väggen kyler det sämre."),
    "B": P("Dra ur adaptern och torka ur skåpet med en fuktig trasa. Handtaget i "
           "konstläder torkas av torrt. Kör inte kyla och värme växelvis flera gånger "
           "i rad — låt skåpet komma i kapp mellan lägena. Baksidan behöver luft."),
    "E": P("Frosta av när islagret i frysfacket börjar ta plats: stäng av, ställ ett "
           "kärl under och låt isen smälta av sig själv — skrapa aldrig med något "
           "vasst. Torka ur med ljummet vatten och lite diskmedel. Låt skåpet stå "
           "upprätt i några timmar efter en transport innan du sätter i sladden."),
}


def faq(k):
    g = matt.GRUPPER[k]
    f = []
    if g == "V":
        f = [("Behöver den ström?",
              "Nej. Du fyller på is eller kylklampar, och de ingår inte."),
             ("Hur länge håller kylan?",
              "Upp till 36 timmar med boxen fylld. Skuggan hjälper, direkt sol gör "
              "det sämre."),
             ("Hur tömmer man smältvattnet?",
              "Genom dräneringspluggen i botten. Vagnen behöver inte tippas."),
             ("Måste den monteras?",
              "Ja. Vagnen kommer i delar och monteras enligt anvisningen.")]
    elif g == "P":
        f = [("Behöver den ström?",
              "Nej. Isoleringen gör hela jobbet — du fyller på is eller kylklampar, "
              "och de ingår inte."),
             ("Gäller 72 timmar alltid?",
              "Nej. Talet förutsätter att boxen är full, att locket hålls stängt och "
              "att den inte står i solen. Halvfull box i solsken är en helt annan "
              "siffra."),
             ("Går det att sitta på locket?",
              "Ja, konstruktionen bär 70 kg."),
             ("Hur får jag ut smältvattnet?",
              "Genom avtappningsventilen i botten, utan att tippa boxen.")]
    elif g == "K":
        f = [("Hur kallt blir det?",
              "%s. Skåpet kyler mot rummet det står i, så en varm sommardag når det "
              "inte lika lågt som en sval höstkväll." % kylrad(k)),
             ("Kan den ersätta ett kylskåp för mat?",
              "Nej. Det här är ett skåp för hudvård och smink."),
             ("Hörs den?",
              "26 dB. Det finns ingen kompressor som slår på och av, utan ett "
              "termoelement och en liten fläkt."),
             ("Ingår batteri?",
              "Nej, skåpet drivs från vägguttaget.")]
    elif g == "B":
        f = [("Kyler och värmer den samtidigt?",
              "Nej, du väljer ett läge i taget med omkopplaren på baksidan."),
             ("Hur kallt och hur varmt blir det?",
              "%s i kylläge och %s i värmeläge. Kylsidan arbetar mot "
              "rumstemperaturen." % (kylrad(k), varmerad(k))),
             ("Kan den ersätta ett kylskåp för mat?",
              "Nej. Det här är ett skåp för hudvård, smink och enstaka burkar."),
             ("Vad ingår?",
              "Skåpet, en hylla, en nätadapter och en bruksanvisning.")]
    elif k == "e6d2e70b":
        f = [("Hur mycket rymmer frysfacket?",
              "10 liter av de 91. Kyldelen är 81 liter."),
             ("Går dörren att vända?",
              "Ja, gångjärnen flyttas till andra sidan."),
             ("Har den automatisk avfrostning?",
              "Nej, avfrostningen är manuell."),
             ("Vad drar den?",
              "Skåpet har energiklass E på skalan A till G. Någon årsförbrukning i "
              "kilowattimmar följer inte med underlaget, så vi anger ingen.")]
    else:
        # ⚠️ Sista ledet bar tidigare "Kylvaror hör hemma i ett kylskåp." Det är
        #    sant och välmenat, men det är ett ONEGERAT påstående med två
        #    grindade ord i sig — och en grind kan inte läsa välmening. Samma
        #    innebörd, nu med nekandet i meningen där orden står.
        f = [("Kan jag förvara färskvaror i den?",
              "Nej. Termostaten går mellan 4 och 18 °C, alltså dryckestemperatur "
              "— det är inte kallt nog för mat som måste hållas kall."),
             ("Hur många burkar får plats?",
              "Volymen är 44 liter fördelat på två uttagbara hyllplan och fack i "
              "dörren."),
             ("Hörs den?",
              "35 dB. Skåpet har en kompressor som slår till och från."),
             ("Vad drar den?",
              "Energiklass E på skalan A till G, och 73 kWh per år vid "
              "provförhållandena.")]
    ut = H("Vanliga frågor")
    for q, a in f:
        ut += P("<strong>%s</strong>" % q) + P(a)
    return ut


def bygg(k):
    g = matt.GRUPPER[k]
    mal, syskontext = SYSKON[k]
    html = (P(INGRESS[g](k))
            + KROPP[g](k)
            + P("Finns också som %s." % lank(mal, syskontext))
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
        print("%s  %-42s namn %2d  titel %2d  meta %3d  html %5d"
              % (k, d["slug"], len(d["namn"]), len(d["titel"]),
                 len(d["meta"]), len(d["html"])))
