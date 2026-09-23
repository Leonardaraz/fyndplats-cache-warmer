# -*- coding: utf-8 -*-
"""Runda 89 — sex sparkcyklar för barn i tre modeller.

☠️ Batch 64 mätte skillnaden: fem produkter skrivna inline i API-anropet gav
NIO fel som nådde Wix, tre skrivna via fil gav noll. Texten skrivs därför HÄR.

☠️ RUNDANS FÖRSTA GRIND: FOTBOLLSMÖNSTRET FINNS INTE. F:s tyska text lovar
   "Gummiräder im Fußballdesign". Zoomat på `4fd26086-3` är framhjulet ett
   vanligt grovmönstrat gummidäck på ekerfälg i aluminium. Inget mönster i
   någon av de tio F-bilderna. ORDET FOTBOLL FÅR INTE FÖREKOMMA.

☠️ RUNDANS ANDRA GRIND: STYRHÖJDEN, INTE ÅLDERN. Alla tre modellerna anges
   "ab 5 Jahren", men A2:s LÄGSTA styrläge (92 cm) är högre än D:s HÖGSTA
   (80 cm). Samma åldersuppgift kan inte vara vägledande för båda. Texterna
   anger åldern som källan gör och låter styrhöjden vara det kunden mäter mot
   — samma lösning som runda 88 gav modell B.

☠️ RUNDANS TREDJE GRIND: MÅTTEN FÅR INTE LÅNAS. Tre modeller, tre uppsättningar:
   A2 143 × 58 × 92–100 · D 120 × 58 × 75–80 · F 135 × 58 × 88–94.
   Att kopiera grannens tal är rundans naturligaste fel.

☠️ INGEN STANDARD FÅR NÄMNAS. Källan anger ingen för någon av de sex.
   "Godkänd", "certifierad", "CE-märkt" och "testad enligt" är lika obelagda.
   ⚠️ Den publicerade `sparkcykel-barn-5-12-ar` bär "EN71-1-2-3" i sin spec —
   den publicerades före den här grinden fanns och rättas separat.

☠️ FORDONSKLASSEN. En vanlig sparkcykel är ett LEKFORDON, och
   trafikförordningen 1 kap 4 § gör föraren till GÅENDE. Elsparkcykelns
   regler gäller en annan fordonsklass. Hjälm skrivs som en rekommendation,
   ALDRIG som lag. ORDET "ELSPARKCYKEL" FÅR INTE FÖREKOMMA.

⚠️ FÄRGNAMNEN KOMMER FRÅN BILDEN, INTE FRÅN KÄLLAN. Källan säger "Blau" om
   två ramar som är turkosa i bild, och "Schwarz" om en ram vars framgaffel
   och fälg är röda. Texten beskriver det som syns.

⚠️ ALLA SEX HAR LUFTDÄCK. Runda 88:s modeller hade massiva EVA-hjul och fick
   rådet "ingenting att pumpa". Här gäller motsatsen, och det är en av de få
   platser där ett kopierat skötselråd hade blivit direkt fel.
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


# ── Delade stycken ─────────────────────────────────────────────────────────
GAENDE = ("Ett barn på sparkcykel räknas som gående i trafiken. Trottoaren "
          "och gångbanan är alltså där sparkcykeln hör hemma, och samma "
          "regler gäller som när barnet går: håll till höger och sakta ner "
          "där folk möts.")

SKYDD = ("Hjälm och knäskydd är klokt, särskilt de första veckorna när "
         "barnet lär sig bromsa. Något lagkrav på hjälm finns det inte för "
         "en sparkcykel, men de flesta olyckorna sker tidigt i inlärningen.")

# ⚠️ Luftdäck kräver motsatt skötsel mot runda 88:s massiva EVA-hjul.
LUFT = ("Känn på däcken innan säsongens första tur. Luftdäck tappar tryck "
        "av att stå still, och ett mjukt däck rullar tyngre och punkterar "
        "lättare mot en trottoarkant än ett rätt pumpat gör.")

RAM = ("Dra åt skruvarna i styrstammen och på fotplattan efter första "
       "veckans åkande och sedan någon gång per säsong. Det är vibrationerna "
       "från underlaget som lossar dem, inte slarv vid monteringen.")

VAJER = ("Kontrollera bromsvajrarna med jämna mellanrum. Två bromsar betyder "
         "två vajrar som töjer sig, och den som töjt sig märks först när den "
         "behövs.")

FORVARING = ("Förvara den torrt över vintern. Stålramen är pulverlackerad, "
             "och en lackskada som får stå fuktig blir en rostfläck till våren.")


# ── Modell A2: 143 cm, 16-tumshjul fram och bak, V-bromsar ────────────────
A2_EG = [
    "V-broms på både fram- och bakhjul, manövrerade från styret",
    "16-tumshjul med luftdäck fram och bak, på ekerfälg",
    "Kullagrat styre som ställs mellan 92 och 100 cm",
    "Halkfri fotplatta, 36 × 12 cm och 11 cm över marken",
    "Metallstöd att parkera på, så den inte behöver läggas ner",
    "Stålram, maxlast 100 kg",
    "Väger 10,6 kg",
]
A2_SPEC = [
    "Mått: 143 × 58 × 92–100 cm (L × B × styrhöjd)",
    "Styrbredd: 56 cm",
    "Fotplatta: 36 × 12 cm, 11 cm över marken",
    "Hjul: 16 tum fram och bak, luftdäck på ekerfälg",
    "Bromsar: V-broms fram och bak",
    "Ram: stål",
    "Maxlast: 100 kg",
    "Rekommenderad ålder: från 5 år",
    "Vikt: 10,6 kg",
    "Paketmått: 99 × 17 × 52 cm",
]
A2_SKOTSEL = [RAM, LUFT, VAJER, FORVARING]


def a2_villkor(syskon_slug, syskon_ord):
    return ("Familjens största — och därför inte till en femåring", [
        "Med <strong>143 cm</strong> i längd och <strong>16-tumshjul fram "
        "och bak</strong> är det här den största sparkcykeln vi har. Två lika "
        "stora luftdäck rullar jämnare över grus och trottoarkanter än ett "
        "litet hjul gör, och det är hela skillnaden mot en sparkcykel som "
        "hakar upp sig i varje skarv.",

        "Den är avsedd från 5 år. <strong>Titta på styret i "
        "stället.</strong> Det går inte lägre än 92 cm, vilket är högre än "
        "vad en femåring når bekvämt — den här passar barnet som redan vuxit "
        "ur en liten sparkcykel. Behöver ni en som börjar lägre finns "
        + lank("sparkcykel-barn-120-cm-lagt-styre-svart",
               "modellen med styre från 75 cm") + ".",

        "Maxlasten är <strong>100 kg</strong>, så en tonåring eller en vuxen "
        "kan låna den utan att det blir dumt. Fotplattan på 36 × 12 cm ger "
        "plats för en hel vuxenfot.",

        GAENDE, SKYDD,
    ])


A2_FAQ_GEMENSAM = [
    ("Vad är en V-broms?",
     "Det är samma bromstyp som sitter på de flesta cyklar: två armar som "
     "klämmer på fälgen när du drar i handtaget. Här finns en på varje hjul, "
     "och båda manövreras från styret."),
    ("Behöver däcken pumpas?",
     "Ja. Det är riktiga luftdäck på ekerfälg, precis som på en cykel, och de "
     "tappar tryck av att stå still. Kontrollera trycket inför säsongen och "
     "någon gång under den."),
    ("Hur stor är den ihopfälld?",
     "Den fälls inte ihop. Styret går att sänka till 92 cm, men ramen är hel "
     "och sparkcykeln tar 143 cm i längd även när den står undan."),
    ("Måste den monteras?",
     "Ja. Styre och framhjul ska sättas på och dras åt, och en vuxen ska göra "
     "det. Räkna med en halvtimme, och åk inte förrän allt sitter fast."),
]


# ── Modell D: 120 cm, lågt styre, Ø12-tumshjul ────────────────────────────
D_EG = [
    "Broms på både fram- och bakhjul",
    "Höjdjusterbart styre, 75 till 80 cm över marken",
    "Ø12-tumshjul med uppblåsbara gummidäck",
    "Bred halkfri fotplatta",
    "Mjukt omlindat styre som är skonsamt mot händerna",
    "Pulverlackerad stålram, maxlast 100 kg",
    "Väger 8,2 kg — familjens lättaste",
]
D_SPEC = [
    "Mått: 120 × 58 × 75–80 cm (L × B × styrhöjd)",
    "Hjul: Ø12 tum, uppblåsbara gummidäck",
    "Bromsar: fram och bak",
    "Material: stål, aluminium och gummi",
    "Ram: pulverlackerat stål",
    "Maxlast: 100 kg",
    "Rekommenderad ålder: från 5 år",
    "Vikt: 8,2 kg",
    "Montering krävs",
]
D_SKOTSEL = [RAM, LUFT, VAJER, FORVARING]


def d_villkor(syskon_slug, syskon_ord):
    return ("Lägst styre och lägst vikt i familjen", [
        "Styret går från <strong>75 till 80 cm</strong>, och det är det "
        "lägsta vi har. Det är också hela poängen: en sparkcykel med för "
        "högt styre får barnet att sträcka sig uppåt i stället för att "
        "trycka framåt, och då blir varje spark kortare.",

        "Med <strong>8,2 kg</strong> är den dessutom familjens lättaste. Ett "
        "barn på sju år lyfter in den i en bagagelucka själv, vilket avgör "
        "om den följer med till badet eller stannar hemma.",

        "Maxlasten är ändå <strong>100 kg</strong>. Det låga styret gör den "
        "obekväm för en vuxen att åka på, men konstruktionen håller — och "
        "det betyder att den inte växer ur sin bärighet när barnet växer. "
        "Behöver ni en som börjar högre finns "
        + lank("sparkcykel-barn-stort-framhjul-orange",
               "modellen med styre 88–94 cm") + ".",

        GAENDE, SKYDD,
    ])


D_FAQ_GEMENSAM = [
    ("Hur stora är hjulen?",
     "Ø12 tum, alltså ungefär 30 centimeter i diameter. Det är stort nog att "
     "rulla över en trottoarkant, och små nog att sparkcykeln blir kort och "
     "lätt att svänga med."),
    ("Behöver däcken pumpas?",
     "Ja. Det är uppblåsbara gummidäck, inte massiva plasthjul, så de tappar "
     "tryck av att stå still. Ett mjukt däck rullar tyngre och tar stryk mot "
     "trottoarkanter."),
    ("Är den för liten för en tioåring?",
     "Det beror på längden, inte åldern. Styret går till 80 cm — når barnet "
     "det bekvämt med lätt böjda armar passar den, annars är den för låg."),
    ("Måste den monteras?",
     "Ja, enkel montering krävs. Styret ska sättas på och dras åt; resten "
     "kommer hopsatt. En vuxen ska göra det och kontrollera att bromsarna "
     "tar innan barnet åker."),
]


# ── Modell F: 135 cm, stort framhjul Ø41 cm, mindre bakhjul Ø30 cm ────────
F_EG = [
    "Broms på både fram- och bakhjul",
    "Stort framhjul Ø41 cm och mindre bakhjul Ø30 cm",
    "Uppblåsbara gummidäck på ekerfälg",
    "Höjdjusterbart styre, 88 till 94 cm över marken",
    "Bred halkfri fotplatta lågt över marken",
    "Mjukt omlindat styre",
    "Pulverlackerad stålram, maxlast 100 kg",
]
F_SPEC = [
    "Mått: 135 × 58 × 88–94 cm (L × B × styrhöjd)",
    "Framhjul: Ø41 cm, uppblåsbart gummidäck",
    "Bakhjul: Ø30 cm, uppblåsbart gummidäck",
    "Bromsar: fram och bak",
    "Material: stål, aluminium och gummi",
    "Ram: pulverlackerat stål",
    "Maxlast: 100 kg",
    "Rekommenderad ålder: från 5 år",
    "Vikt: 9,5 kg",
    "Montering krävs",
]
F_SKOTSEL = [RAM, LUFT, VAJER, FORVARING]


def f_villkor(syskon_slug, syskon_ord):
    return ("Stort fram, mindre bak — och varför det spelar roll", [
        "Framhjulet är <strong>Ø41 cm</strong> och bakhjulet "
        "<strong>Ø30 cm</strong>. Det är inte en slump: det stora framhjulet "
        "är det som möter trottoarkanten och grusfläcken först, och ett stort "
        "hjul rullar över det ett litet fastnar i. Det mindre bakhjulet håller "
        "samtidigt fotplattan låg, så steget ner blir kort.",

        "Styret ställs mellan <strong>88 och 94 cm</strong>, alltså mitt "
        "emellan familjens lägsta och högsta. Den är avsedd från 5 "
        "år, men det är styrhöjden som avgör: når barnet 88 cm bekvämt "
        "passar den.",

        "Maxlasten är <strong>100 kg</strong>, och bromsen sitter på båda "
        "hjulen. Två bromsar stannar kortare än en, och det är den skillnaden "
        "som märks i en nedförsbacke. Vill ni ha en med ännu större hjul finns "
        + lank("sparkcykel-barn-143-cm-16-tum-svart",
               "modellen med 16 tum fram och bak") + ".",

        GAENDE, SKYDD,
    ])


F_FAQ_GEMENSAM = [
    ("Varför är hjulen olika stora?",
     "Framhjulet tar stöten först, och Ø41 cm rullar över en kant som ett "
     "mindre hjul hakar upp sig i. Bakhjulet på Ø30 cm låter fotplattan "
     "sitta lågt, vilket gör det kortare att sparka ifrån."),
    ("Behöver däcken pumpas?",
     "Ja. Båda hjulen har uppblåsbara gummidäck på ekerfälg. Kontrollera "
     "trycket inför säsongen — ett mjukt framdäck tar udden av hela poängen "
     "med ett stort hjul."),
    ("Hur bromsar barnet?",
     "Med handtagen på styret, som tar på var sitt hjul. Låt barnet öva båda "
     "på en plan yta innan första turen — bromsen är det enda som inte går "
     "att lära sig i efterhand."),
    ("Måste den monteras?",
     "Ja, enkel montering krävs. Styret och framhjulet ska sättas på och dras "
     "åt av en vuxen. Räkna med en halvtimme."),
]


# ── De sex produkterna ────────────────────────────────────────────────────
PRODUKTER = [
    {
        "kort": "c4375606",
        "sku": "FP-sparkcykel-143-cm-svart",
        "name": "Sparkcykel barn 143 cm i svart – 16 tum fram och bak, V-bromsar",
        "slug": "sparkcykel-barn-143-cm-16-tum-svart",
        "title": "Sparkcykel barn 143 cm, svart | Fyndplats",
        "meta": ("Svart sparkcykel 143 cm med 16-tumshjul och luftdäck fram "
                 "och bak, V-broms på båda hjulen och styre 92–100 cm. "
                 "Maxlast 100 kg."),
        "ingress": ("<p><strong>Svart ram, kromat styre och två lika stora "
                    "16-tumshjul.</strong> Den ser mer ut som en cykel utan "
                    "sadel än som en trottoarsparkcykel, och det är precis "
                    "vad den är byggd för.</p>"
                    "<p><strong>Luftdäck på ekerfälg, fram och bak.</strong> "
                    "Luft dämpar där massivt skum studsar, så grus och "
                    "kullersten känns i fötterna i stället för i knäna. "
                    "Priset är att däcken ska pumpas som en cykels.</p>"
                    "<p><strong>V-broms på båda hjulen.</strong> Samma "
                    "bromstyp som på en vanlig cykel, med ett handtag var på "
                    "styret — inte ett fotstöd att trampa på.</p>"),
        "eg": A2_EG, "spec": A2_SPEC[:8] + ["Färg: svart ram"] + A2_SPEC[8:],
        "villkor": a2_villkor("sparkcykel-barn-143-cm-16-tum-rosa", "rosa"),
        "skotsel": A2_SKOTSEL,
        "faq": A2_FAQ_GEMENSAM + [
            ("Finns den i en annan färg?",
             "Ja, samma sparkcykel finns i "
             + lank("sparkcykel-barn-143-cm-16-tum-rosa", "rosa") + ". En "
             "något kortare modell med lika stora hjul finns som "
             + lank("sparkcykel-barn-luftdack-40-cm", "blå på 139 cm") + "."),
        ],
    },
    {
        "kort": "79186373",
        "sku": "FP-sparkcykel-143-cm-rosa",
        "name": "Sparkcykel barn 143 cm i rosa – 16 tum fram och bak, V-bromsar",
        "slug": "sparkcykel-barn-143-cm-16-tum-rosa",
        "title": "Sparkcykel barn 143 cm, rosa | Fyndplats",
        "meta": ("Rosa sparkcykel 143 cm med 16-tumshjul och luftdäck fram "
                 "och bak, V-broms på båda hjulen och styre 92–100 cm. "
                 "Maxlast 100 kg."),
        "ingress": ("<p><strong>Rosa ram med svarta däck och kromat "
                    "styre.</strong> Den rosa lacken sitter på hela ramen, "
                    "inte bara som en dekal på styrstammen, och det är det "
                    "som gör att den ser genomtänkt ut i stället för "
                    "påklistrad.</p>"
                    "<p><strong>Två lika stora 16-tumshjul med "
                    "luftdäck.</strong> Stora hjul rullar över det små hjul "
                    "fastnar i, och luft i däcken tar upp skarvar som ett "
                    "massivt hjul skickar rakt upp i fötterna.</p>"
                    "<p><strong>Fotplattan är 36 × 12 cm.</strong> Det är "
                    "plats för en hel vuxenfot, vilket är ovanligt på en "
                    "sparkcykel som säljs till barn.</p>"),
        "eg": A2_EG, "spec": A2_SPEC[:8] + ["Färg: rosa ram"] + A2_SPEC[8:],
        "villkor": a2_villkor("sparkcykel-barn-143-cm-16-tum-svart", "svart"),
        "skotsel": A2_SKOTSEL,
        "faq": A2_FAQ_GEMENSAM + [
            ("Finns den i en annan färg?",
             "Ja, samma sparkcykel finns i "
             + lank("sparkcykel-barn-143-cm-16-tum-svart", "svart") + ". En "
             "rosa modell finns dessutom som "
             + lank("sparkcykel-barn-rosa-16-tum-luftdack",
                    "egen sida med 16 tum fram och 12 tum bak") + "."),
        ],
    },
    {
        "kort": "479e9c2e",
        "sku": "FP-sparkcykel-120-cm-svart",
        "name": "Sparkcykel barn 120 cm med lågt styre, svart och röd – 100 kg",
        "slug": "sparkcykel-barn-120-cm-lagt-styre-svart",
        "title": "Sparkcykel barn 120 cm, svart och röd | Fyndplats",
        "meta": ("Svart sparkcykel 120 cm med röd framgaffel, Ø12-tumshjul "
                 "med luftdäck, broms på båda hjulen och styre 75–80 cm. "
                 "Maxlast 100 kg, väger 8,2 kg."),
        "ingress": ("<p><strong>Svart ram med röd framgaffel.</strong> "
                    "Gaffeln är röd, fälgarna silverfärgade och resten "
                    "svart — den är inte enfärgad, och det syns direkt i "
                    "bild.</p>"
                    "<p><strong>Styret börjar på 75 cm.</strong> Det är "
                    "familjens lägsta, och det är avsiktligt: ett barn som "
                    "får sträcka sig uppåt tappar kraft i varje spark.</p>"
                    "<p><strong>Ø12-tumshjul med luftdäck.</strong> Stora nog "
                    "att ta en trottoarkant, små nog att sparkcykeln stannar "
                    "på 120 cm och 8,2 kg.</p>"),
        "eg": D_EG, "spec": D_SPEC[:7] + ["Färg: svart ram med röd framgaffel"]
              + D_SPEC[7:],
        "villkor": d_villkor("sparkcykel-barn-120-cm-lagt-styre-turkos", "turkos"),
        "skotsel": D_SKOTSEL,
        "faq": D_FAQ_GEMENSAM + [
            ("Finns den i en annan färg?",
             "Ja, samma sparkcykel finns i "
             + lank("sparkcykel-barn-120-cm-lagt-styre-turkos", "turkos") + "."),
        ],
    },
    {
        "kort": "d9239c8e",
        "sku": "FP-sparkcykel-120-cm-turkos",
        "name": "Sparkcykel barn 120 cm med lågt styre, turkos – 100 kg",
        "slug": "sparkcykel-barn-120-cm-lagt-styre-turkos",
        "title": "Sparkcykel barn 120 cm, turkos | Fyndplats",
        "meta": ("Turkos sparkcykel 120 cm med Ø12-tumshjul och luftdäck, "
                 "broms på båda hjulen och styre 75–80 cm. Maxlast 100 kg, "
                 "väger 8,2 kg."),
        "ingress": ("<p><strong>Turkos ram med svart styre och svarta "
                    "däck.</strong> Färgen ligger mellan blått och grönt och "
                    "är ljusare än den ser ut på en liten bild — hela ramen "
                    "är lackad, inklusive framgaffeln.</p>"
                    "<p><strong>Lägsta styret i familjen, 75 till 80 "
                    "cm.</strong> Den är gjord för barnet som just klivit "
                    "över från en liten trottoarsparkcykel och ännu inte når "
                    "ett högt styre.</p>"
                    "<p><strong>8,2 kg.</strong> Familjens lättaste, och det "
                    "är den siffran som avgör om sparkcykeln följer med "
                    "hemifrån eller blir stående i garaget.</p>"),
        "eg": D_EG, "spec": D_SPEC[:7] + ["Färg: turkos ram"] + D_SPEC[7:],
        "villkor": d_villkor("sparkcykel-barn-120-cm-lagt-styre-svart", "svart"),
        "skotsel": D_SKOTSEL,
        "faq": D_FAQ_GEMENSAM + [
            ("Finns den i en annan färg?",
             "Ja, samma sparkcykel finns i "
             + lank("sparkcykel-barn-120-cm-lagt-styre-svart",
                    "svart med röd framgaffel") + "."),
        ],
    },
    {
        "kort": "4fd26086",
        "sku": "FP-sparkcykel-framhjul-orange",
        "name": "Sparkcykel barn med stort framhjul Ø41 cm, orange – broms på båda hjulen",
        "slug": "sparkcykel-barn-stort-framhjul-orange",
        "title": "Sparkcykel barn med stort framhjul, orange | Fyndplats",
        "meta": ("Orange sparkcykel 135 cm med framhjul Ø41 cm och bakhjul "
                 "Ø30 cm, luftdäck, broms på båda hjulen och styre 88–94 cm. "
                 "Maxlast 100 kg."),
        "ingress": ("<p><strong>Orange ram, svart styre och ett framhjul som "
                    "är märkbart större än bakhjulet.</strong> Ø41 cm fram "
                    "mot Ø30 cm bak — skillnaden syns på tio meters "
                    "håll.</p>"
                    "<p><strong>Det stora hjulet möter kanten först.</strong> "
                    "Det är hela idén med olika hjulstorlekar: framhjulet "
                    "rullar över det som stoppar ett litet hjul, medan det "
                    "mindre bakhjulet håller fotplattan låg.</p>"
                    "<p><strong>Broms på båda hjulen.</strong> Två handtag på "
                    "styret, ett per hjul, och två vajrar att hålla efter.</p>"),
        "eg": F_EG, "spec": F_SPEC[:8] + ["Färg: orange ram"] + F_SPEC[8:],
        "villkor": f_villkor("sparkcykel-barn-stort-framhjul-turkos", "turkos"),
        "skotsel": F_SKOTSEL,
        "faq": F_FAQ_GEMENSAM + [
            ("Finns den i en annan färg?",
             "Ja, samma sparkcykel finns i "
             + lank("sparkcykel-barn-stort-framhjul-turkos", "turkos") + "."),
        ],
    },
    {
        "kort": "89deaca7",
        "sku": "FP-sparkcykel-framhjul-turkos",
        "name": "Sparkcykel barn med stort framhjul Ø41 cm, turkos – broms på båda hjulen",
        "slug": "sparkcykel-barn-stort-framhjul-turkos",
        "title": "Sparkcykel barn med stort framhjul, turkos | Fyndplats",
        "meta": ("Turkos sparkcykel 135 cm med framhjul Ø41 cm och bakhjul "
                 "Ø30 cm, luftdäck, broms på båda hjulen och styre 88–94 cm. "
                 "Maxlast 100 kg."),
        "ingress": ("<p><strong>Turkos ram med svart styre och två olika "
                    "stora hjul.</strong> Den ljusa ramen mot de svarta "
                    "däcken gör storleksskillnaden mellan hjulen ännu "
                    "tydligare än på den orange.</p>"
                    "<p><strong>Framhjulet är Ø41 cm.</strong> Elva "
                    "centimeter större än bakhjulet, och det är de elva "
                    "centimetrarna som avgör om en trottoarkant blir ett gupp "
                    "eller ett stopp.</p>"
                    "<p><strong>Fotplattan sitter lågt.</strong> Det mindre "
                    "bakhjulet är vad som gör det möjligt — kort väg ner för "
                    "foten som sparkar ifrån.</p>"),
        "eg": F_EG, "spec": F_SPEC[:8] + ["Färg: turkos ram"] + F_SPEC[8:],
        "villkor": f_villkor("sparkcykel-barn-stort-framhjul-orange", "orange"),
        "skotsel": F_SKOTSEL,
        "faq": F_FAQ_GEMENSAM + [
            ("Finns den i en annan färg?",
             "Ja, samma sparkcykel finns i "
             + lank("sparkcykel-barn-stort-framhjul-orange", "orange") + "."),
        ],
    },
]
