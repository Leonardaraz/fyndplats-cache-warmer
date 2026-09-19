# -*- coding: utf-8 -*-
"""Runda 88 — åtta sparkcyklar för barn i tre modeller.

☠️ Batch 64 mätte skillnaden: fem produkter skrivna inline i API-anropet gav
NIO fel som nådde Wix, tre skrivna via fil gav noll. Texten skrivs därför HÄR.

☠️ RUNDANS FÖRSTA GRIND ÄR MAXLASTEN, OCH DEN FÄLLER LEVERANTÖRENS EGET
   SÄLJARGUMENT. Modell A säljs på tyska som "ein Tretroller für die ganze
   Familie… auch Geschwister, ELTERN und Freunde" och "für eine kurze Fahrt
   zur Schule oder ZUR ARBEIT" — tre rader ovanför "Belastbarkeit: 50 kg".
   50 kg är ett barns vikt. ORDEN "HELA FAMILJEN", "FÖRÄLDRAR", "VUXEN" OCH
   "TILL JOBBET" FÅR INTE FÖREKOMMA PÅ MODELL A ELLER B.

   Inversionen: modellen som FAKTISKT klarar en vuxen är modell I — 100 kg
   och kroppslängd 120–170 cm. Den får säga det de andra inte får.

☠️ RUNDANS ANDRA GRIND ÄR FORDONSKLASSEN. En vanlig sparkcykel är ett
   LEKFORDON, och trafikförordningen 1 kap 4 § gör föraren till GÅENDE.
   Elsparkcykelns regler — förbud mot trottoar, hjälmkrav under 15 år, krav
   på ringklocka och lysen — gäller en ANNAN fordonsklass och får aldrig
   kopieras hit. Hjälm skrivs som en rekommendation, aldrig som lag.
   ORDET "ELSPARKCYKEL" FÅR INTE FÖREKOMMA.

☠️ INGEN STANDARD FÅR NÄMNAS. EN 14619 gäller 20–100 kg, EN 71-1 under 20 kg,
   och i spannet 20–50 kg finns BÅDA klassningarna. Produkterna anges för
   5–12 år, alltså mitt i det spannet, och leverantören säger inte vilken som
   gäller. "Godkänd", "certifierad", "CE-märkt" och "testad enligt" är lika
   obelagda.

☠️ ÅLDERN FÅR INTE LÅNAS MELLAN MODELLERNA. A säger 5–12 år, B säger 6–12 år
   OCH 100–150 cm, I säger 5–12 år och 120–170 cm. Att kopiera grannens
   spann är rundans naturligaste fel — samma regel som runda 87:s snölast.

☠️ BROMSEN SKILJER SIG. A och B har broms på BAKHJULET (en). I har broms på
   BÅDA hjulen (två). "Dubbla bromsar" på A eller B vore ett påhitt.

⚠️ Modell I:s fotplattelängd 37 cm står BARA på måttritningen, inte i den
   tyska texten. Bilden är en giltig källa (runbokens Steg 5) och talet
   används — men det är värt att veta var det kommer ifrån.
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
# ⚠️ Skötseln av en stålram med EVA- eller gummihjul är densamma för alla
#    åtta, och att skriva åtta varianter av samma råd hade varit åtta
#    tillfällen att skriva ett fel. Det som SKILJER — maxlast, ålder,
#    bromsar, korg — står per produkt.
RAM_SKOTSEL = ("Dra åt skruvarna i styrstammen och på fotplattan efter första "
               "veckans åkande och sedan någon gång per säsong. Det är "
               "vibrationerna från underlaget som lossar dem, inte slarv vid "
               "monteringen.")
LAGER_SKOTSEL = ("Torka av hjullagren när sparkcykeln varit ute i väta och "
                 "sand. Grus som ligger kvar mot lagret sliter fortare än "
                 "regnet gör.")
FORVARING = ("Förvara den torrt över vintern. Stålramen är lackerad, och en "
             "lackskada som får stå fuktig blir en rostfläck till våren.")

# Den skyddsutrustning som syns på leverantörens egna livsstilsbilder —
# hjälm och knäskydd. Texten säger samma sak som bilden, aldrig emot den.
SKYDD = ("Hjälm och knäskydd är klokt, särskilt de första veckorna när "
         "barnet lär sig bromsa. Något lagkrav på hjälm finns det inte för "
         "en sparkcykel, men de flesta olyckorna sker tidigt i inlärningen.")

# Fordonsklassen — sann för alla åtta, och den upplysning en förälder
# faktiskt undrar över.
GAENDE = ("Ett barn på sparkcykel räknas som gående i trafiken. Trottoaren "
          "och gångbanan är alltså där sparkcykeln hör hemma, och samma "
          "regler gäller som när barnet går: håll till höger och sakta ner "
          "där folk möts.")


# ── Modell A: BMX-styre, svarta hjul, 120 cm, 50 kg, 5–12 år ───────────────
# Tre färgsyskon. Det som skiljer sidorna är FÄRGEN och ingenting annat —
# därför står färgen i namn, slug OCH titel, och varje sida länkar till de
# två andra. Måtten är identiska med flit: de ÄR identiska.
A_EG = [
    "Handbroms på bakhjulet, manövrerad från styret",
    "Fotstöd bakom fotplattan att bromsa mot",
    "Höjdjusterbart styre, 80 till 88 cm över marken",
    "12-tumshjul med EVA-däck fram och bak — inget att pumpa",
    "Halkfri fotplatta, 32 × 11 cm",
    "Metallstöd att parkera på, så den inte behöver läggas ner",
    "Maxlast 50 kg, rekommenderad ålder 5–12 år",
]
A_SPEC = [
    "Mått: 120 × 52 × 80–88 cm (L × B × styrhöjd)",
    "Styrbredd: 52 cm",
    "Fotplatta: 32 × 11 cm, 11 cm över marken",
    "Hjul: 12 tum fram och bak, EVA-däck på plastfälg",
    "Broms: handbroms på bakhjulet",
    "Ram: stål",
    "Maxlast: 50 kg",
    "Rekommenderad ålder: 5–12 år",
]
A_SKOTSEL = [RAM_SKOTSEL, LAGER_SKOTSEL, FORVARING]


def a_villkor(annan):
    return ("Vem den är byggd för", [
        "Maxlasten är <strong>50 kg</strong>, och det talet är hela svaret på "
        "vem som kan åka. Femtio kilo är ett barn — ungefär en tolvåring. En "
        "vuxen ska inte ställa sig på den, hur frestande det än ser ut när "
        "barnet rullar iväg.",
        "Styret går från 80 till 88 cm och följer med en bit av uppväxten, "
        "men åtta centimeter är åtta centimeter: den växer inte med barnet "
        "hela vägen. Behöver ni en som en tonåring eller en vuxen också kan "
        "låna, är det " + annan + " som gäller.",        GAENDE,
        SKYDD,
    ])


A_FAQ_GEMENSAM = [
    ("Behöver hjulen pumpas?",
     "Nej. EVA är ett massivt skummaterial utan innerslang, så det finns "
     "ingenting att pumpa och ingenting som kan punktera. Priset man betalar "
     "är att de dämpar sämre än luftdäck på grus och kullersten."),
    ("Hur bromsar barnet?",
     "Med handbromsen på styret, som tar på bakhjulet. Bakom fotplattan "
     "sitter dessutom ett fotstöd att trampa på. Låt barnet öva båda på en "
     "plan yta innan första turen — bromsen är det enda som inte går att "
     "lära sig i efterhand."),
    ("Är den ihopfällbar?",
     "Nej. Styret går att sänka till 80 cm, men ramen är hel och sparkcykeln "
     "tar 120 cm i längd även när den står undan."),
    ("Måste den monteras?",
     "Styret ska sättas på och skruvas fast, resten kommer hopsatt. Räkna "
     "med en kvart och en insexnyckel."),
]


PRODUKTER = [
    # ══ 1. b1dcd424 — modell A, blå ═══════════════════════════════════════
    {
        "kort": "b1dcd424",
        "sku": "FP-sparkcykel-12-tum-bla",
        "name": "Sparkcykel barn 12 tum i blått – bakbroms och styre 80–88 cm",
        "slug": "sparkcykel-barn-12-tum-bla",
        "title": "Sparkcykel barn 12 tum, blå | Fyndplats",
        "meta": ("Blå sparkcykel för barn 5–12 år med 12-tumshjul i EVA, "
                 "handbroms på bakhjulet och styre som ställs 80–88 cm. "
                 "Maxlast 50 kg."),
        "ingress":
            "<p><strong>Blå ram, svarta hjul och ett styre med tvärstag.</strong> "
            "Formen är lånad från BMX-cykeln, och det är den som gör att den "
            "ser ut som något ett barn vill ha och inte som ett "
            "transportmedel.</p>"
            "<p><strong>12-tumshjulen är det som skiljer den från en "
            "trottoarsparkcykel.</strong> Små hårda hjul fastnar i varje "
            "trottoarkant och varje grusfläck; de här rullar över dem. "
            "Däcken är EVA-skum, alltså massiva — de punkterar aldrig och "
            "behöver aldrig pumpas.</p>"
            "<p><strong>Fotplattan sitter 11 cm över marken.</strong> Det är "
            "lågt nog att barnet inte behöver sträcka sig ner för att sparka "
            "ifrån, vilket är hela skillnaden mellan en sparkcykel som "
            "används och en som står i garaget.</p>",
        "eg": A_EG,
        "spec": A_SPEC + ["Färg: blå ram, svarta hjul"],
        "villkor": a_villkor(
            lank("sparkcykel-barn-bla-korg-stankskarmar", "modellen med korg och stänkskärmar")),
        "skotsel": A_SKOTSEL,
        "faq": A_FAQ_GEMENSAM + [
            ("Finns den i andra färger?",
             "Ja, samma sparkcykel finns i "
             + lank("sparkcykel-barn-12-tum-vinrod", "vinrött")
             + " och " + lank("sparkcykel-barn-12-tum-svart", "svart") + "."),
        ],
    },
    # ══ 2. 41269686 — modell A, vinröd ════════════════════════════════════
    {
        "kort": "41269686",
        "sku": "FP-sparkcykel-12-tum-vinrod",
        "name": "Sparkcykel barn 12 tum i vinrött – bakbroms och styre 80–88 cm",
        "slug": "sparkcykel-barn-12-tum-vinrod",
        "title": "Sparkcykel barn 12 tum, vinröd | Fyndplats",
        "meta": ("Vinröd sparkcykel för barn 5–12 år med 12-tumshjul i EVA, "
                 "handbroms på bakhjulet och styre som ställs 80–88 cm. "
                 "Maxlast 50 kg."),
        "ingress":
            "<p><strong>Vinröd ram med svarta hjul och svart styre.</strong> "
            "Den mörkare rödtonen är mindre skrikig än en klarröd och drar "
            "mindre uppmärksamhet till repor — vilket en sparkcykel som "
            "läggs ner på asfalt får gott om.</p>"
            "<p><strong>Samma 12-tumshjul i EVA-skum som resten av "
            "modellen.</strong> Massiva däck utan innerslang: de punkterar "
            "inte, de behöver inte pumpas, och de rullar över en trottoarkant "
            "utan att stanna.</p>"
            "<p><strong>Styret ställs mellan 80 och 88 cm</strong> och sitter "
            "på kullager, så det svänger jämnt i hela varvet i stället för "
            "att kärva åt ett håll.</p>",
        "eg": A_EG,
        "spec": A_SPEC + ["Färg: vinröd ram, svarta hjul"],
        "villkor": a_villkor(
            lank("sparkcykel-barn-rosa-korg-stankskarmar", "modellen med korg och stänkskärmar")),
        "skotsel": A_SKOTSEL,
        "faq": A_FAQ_GEMENSAM + [
            ("Finns den i andra färger?",
             "Ja, samma sparkcykel finns i "
             + lank("sparkcykel-barn-12-tum-bla", "blått")
             + " och " + lank("sparkcykel-barn-12-tum-svart", "svart") + "."),
        ],
    },
    # ══ 3. 82b5a517 — modell A, svart ═════════════════════════════════════
    {
        "kort": "82b5a517",
        "sku": "FP-sparkcykel-12-tum-svart",
        "name": "Sparkcykel barn 12 tum i svart – bakbroms och styre 80–88 cm",
        "slug": "sparkcykel-barn-12-tum-svart",
        "title": "Sparkcykel barn 12 tum, svart | Fyndplats",
        "meta": ("Svart sparkcykel för barn 5–12 år med 12-tumshjul i EVA, "
                 "handbroms på bakhjulet och styre som ställs 80–88 cm. "
                 "Maxlast 50 kg."),
        "ingress":
            "<p><strong>Helsvart, från styret till fälgarna.</strong> Det är "
            "den av de tre färgerna som åldras snyggast: svart lack visar "
            "varken damm eller de småskavanker en sparkcykel samlar på sig "
            "under en säsong.</p>"
            "<p><strong>12-tumshjul med EVA-däck fram och bak.</strong> "
            "Massivt skum i stället för luft — ingenting att pumpa och "
            "ingenting som punkterar, och hjulen är stora nog att ta en "
            "trottoarkant utan att haka upp sig.</p>"
            "<p><strong>Metallstödet gör att den kan parkeras stående.</strong> "
            "En liten sak som avgör om sparkcykeln hamnar mot väggen eller "
            "liggande tvärs över garageuppfarten.</p>",
        "eg": A_EG,
        "spec": A_SPEC + ["Färg: svart ram, svarta hjul"],
        "villkor": a_villkor(
            lank("sparkcykel-barn-bla-korg-stankskarmar", "modellen med korg och stänkskärmar")),
        "skotsel": A_SKOTSEL,
        "faq": A_FAQ_GEMENSAM + [
            ("Finns den i andra färger?",
             "Ja, samma sparkcykel finns i "
             + lank("sparkcykel-barn-12-tum-bla", "blått")
             + " och " + lank("sparkcykel-barn-12-tum-vinrod", "vinrött") + "."),
        ],
    },
]

# ── Modell B: rakt styre, FÄRGADE maghjul, 118 cm, 50 kg, 6–12 år ──────────
# ☠️ Åldern är 6–12 år HÄR, inte 5–12 som på modell A, och leverantören
#    lägger till ett längdspann: 100–150 cm. Båda talen är modell B:s egna
#    och får inte lånas åt något håll.
B_EG = [
    "Bakbroms, förmonterad vid leverans",
    "Höjdjusterbart styre, 80 till 88 cm över marken",
    "Punkteringsfria EVA-hjul, Ø30 cm — färgade maghjul",
    "Halkfri fotplatta, 32 × 11 cm",
    "Stöd att parkera på",
    "Maxlast 50 kg, rekommenderad ålder 6–12 år och längd 100–150 cm",
    "Väger 7 kg",
]
B_SPEC = [
    "Mått: 118 × 52 × 80–88 cm (L × B × styrhöjd)",
    "Fotplatta: 32 × 11 cm, 11 cm över marken",
    "Hjul: Ø30 cm, punkteringsfri EVA på färgad fälg",
    "Broms: bakbroms",
    "Material: stål, TPR och EVA",
    "Maxlast: 50 kg",
    "Rekommenderad ålder: 6–12 år",
    "Rekommenderad längd: 100–150 cm",
    "Vikt: 7 kg",
    "Paketmått: 101 × 14 × 45 cm",
]
B_SKOTSEL = [RAM_SKOTSEL, LAGER_SKOTSEL, FORVARING]


def b_villkor(annan):
    return ("Längden avgör, inte åldern", [
        "Den här modellen anges för <strong>6–12 år</strong> och en längd på "
        "<strong>100–150 cm</strong>. Av de två talen är längden det "
        "användbara: styret går till 88 cm, och ett barn som är längre än "
        "150 cm får böja sig för att nå det.",
        "Maxlasten är <strong>50 kg</strong>. Det är ett barns vikt, inte en "
        "vuxens — den här sparkcykeln är inte till för att lånas av någon "
        "större. Behöver ni en som klarar mer finns " + annan + ".",        GAENDE,
        SKYDD,
    ])


B_FAQ_GEMENSAM = [
    ("Vad är skillnaden mot 12-tumsmodellen?",
     "Hjulen är lika stora — Ø30 cm är 12 tum. Det som skiljer är styret och "
     "hjulens utseende: den här har ett rakt styre med färgade handtag och "
     "maghjul i samma färg som ramen, medan "
     + lank("sparkcykel-barn-12-tum-svart", "12-tumsmodellen")
     + " har ett BMX-styre med tvärstag och helsvarta hjul. Den är också två "
     "centimeter kortare."),
    ("Behöver hjulen pumpas?",
     "Nej. EVA-hjulen är massiva och punkteringsfria. De rullar tystare än "
     "hårdplast och behöver ingen tillsyn alls, men de dämpar mindre än ett "
     "luftdäck skulle gjort."),
    ("Är bromsen monterad när den kommer?",
     "Ja, bromsen sitter på plats vid leverans. Det som återstår är att sätta "
     "på styret och dra åt det."),
    ("Hur mycket väger den?",
     "Sju kilo. Ett barn på åtta år bär den uppför en trappa, men motvilligt "
     "— räkna med att den blir stående nere."),
]

PRODUKTER += [
    # ══ 4. e9cfa7bf — modell B, vinröd med röda hjul ══════════════════════
    {
        "kort": "e9cfa7bf",
        "sku": "FP-sparkcykel-30-cm-rod",
        "name": "Sparkcykel barn 6–12 år, röda hjul – Ø30 cm och bakbroms",
        "slug": "sparkcykel-barn-roda-hjul-30-cm",
        "title": "Sparkcykel barn 6–12 år, röda hjul | Fyndplats",
        "meta": ("Sparkcykel för barn 6–12 år och 100–150 cm, med "
                 "punkteringsfria EVA-hjul på Ø30 cm, röda maghjul, bakbroms "
                 "och styre 80–88 cm."),
        "ingress":
            "<p><strong>Vinröd ram med röda maghjul och röda handtag.</strong> "
            "Färgen går igen på tre ställen i stället för att sitta på ramen "
            "ensam, och det är den detaljen som gör att den ser genomtänkt ut "
            "snarare än billig.</p>"
            "<p><strong>Hjulen är Ø30 cm och punkteringsfria.</strong> EVA-skum "
            "hela vägen igenom — ingen slang, ingen ventil, ingenting att "
            "pumpa. Trettio centimeter är stort nog att ta grus och "
            "trottoarkanter utan att haka upp sig.</p>"
            "<p><strong>Sju kilo och 118 cm lång.</strong> Den ryms i en "
            "bagagelucka och går att bära, vilket är hela skillnaden mellan "
            "en sparkcykel som följer med till badet och en som stannar "
            "hemma.</p>",
        "eg": B_EG,
        "spec": B_SPEC + ["Färg: vinröd ram, röda hjul och handtag"],
        "villkor": b_villkor(
            lank("sparkcykel-barn-bla-korg-stankskarmar", "modellen med korg och stänkskärmar, som tar 100 kg")),
        "skotsel": B_SKOTSEL,
        "faq": B_FAQ_GEMENSAM + [
            ("Finns den i andra färger?",
             "Ja, samma sparkcykel finns med "
             + lank("sparkcykel-barn-bla-hjul-30-cm", "blå hjul")
             + " och " + lank("sparkcykel-barn-grona-hjul-30-cm", "gröna hjul") + "."),
        ],
    },
    # ══ 5. 2b8297df — modell B, mörkblå med blå hjul ══════════════════════
    {
        "kort": "2b8297df",
        "sku": "FP-sparkcykel-30-cm-bla",
        "name": "Sparkcykel barn 6–12 år, blå hjul – Ø30 cm och bakbroms",
        "slug": "sparkcykel-barn-bla-hjul-30-cm",
        "title": "Sparkcykel barn 6–12 år, blå hjul | Fyndplats",
        "meta": ("Sparkcykel för barn 6–12 år och 100–150 cm, med "
                 "punkteringsfria EVA-hjul på Ø30 cm, blå maghjul, bakbroms "
                 "och styre 80–88 cm."),
        "ingress":
            "<p><strong>Mörkblå ram med blå maghjul och blå handtag.</strong> "
            "Den mörka ramen med de ljusare hjulen är den mest återhållsamma av de tre — den syns, men den skriker inte.</p>"
            "<p><strong>Punkteringsfria EVA-hjul på Ø30 cm.</strong> Massivt "
            "skum utan innerslang: ingenting att pumpa, ingenting som går "
            "sönder på en glasskärva, och tillräckligt stora för att rulla "
            "över grus i stället för att stanna i det.</p>"
            "<p><strong>Fotplattan ligger 11 cm över marken.</strong> Det är "
            "kort väg ner för foten som sparkar ifrån, och det är den höjden "
            "som avgör om barnet orkar hålla farten uppe hela vägen "
            "hem.</p>",
        "eg": B_EG,
        "spec": B_SPEC + ["Färg: mörkblå ram, blå hjul och handtag"],
        "villkor": b_villkor(
            lank("sparkcykel-barn-bla-korg-stankskarmar", "modellen med korg och stänkskärmar, som tar 100 kg")),
        "skotsel": B_SKOTSEL,
        "faq": B_FAQ_GEMENSAM + [
            ("Finns den i andra färger?",
             "Ja, samma sparkcykel finns med "
             + lank("sparkcykel-barn-roda-hjul-30-cm", "röda hjul")
             + " och " + lank("sparkcykel-barn-grona-hjul-30-cm", "gröna hjul") + "."),
        ],
    },
    # ══ 6. 9941383e — modell B, mörkgrön med gröna hjul ═══════════════════
    {
        "kort": "9941383e",
        "sku": "FP-sparkcykel-30-cm-gron",
        "name": "Sparkcykel barn 6–12 år, gröna hjul – Ø30 cm och bakbroms",
        "slug": "sparkcykel-barn-grona-hjul-30-cm",
        "title": "Sparkcykel barn 6–12 år, gröna hjul | Fyndplats",
        "meta": ("Sparkcykel för barn 6–12 år och 100–150 cm, med "
                 "punkteringsfria EVA-hjul på Ø30 cm, gröna maghjul, "
                 "bakbroms och styre 80–88 cm."),
        "ingress":
            "<p><strong>Mörkgrön ram med gröna maghjul och gröna "
            "handtag.</strong> Grönt är den ovanligaste av de tre färgerna, och den enda som inte går att förväxla med någon "
            "annans sparkcykel på skolgården.</p>"
            "<p><strong>Ø30 cm punkteringsfria hjul i EVA-skum.</strong> "
            "Massiva rakt igenom — det finns ingen slang att laga och ingen "
            "ventil att leta efter, och storleken gör att en trottoarkant "
            "blir ett gupp i stället för ett stopp.</p>"
            "<p><strong>Styret ställs 80 till 88 cm och bromsen sitter "
            "monterad.</strong> Det enda som ska göras vid uppackningen är "
            "att sätta på styret och dra åt det.</p>",
        "eg": B_EG,
        "spec": B_SPEC + ["Färg: mörkgrön ram, gröna hjul och handtag"],
        "villkor": b_villkor(
            lank("sparkcykel-barn-bla-korg-stankskarmar", "modellen med korg och stänkskärmar, som tar 100 kg")),
        "skotsel": B_SKOTSEL,
        "faq": B_FAQ_GEMENSAM + [
            ("Finns den i andra färger?",
             "Ja, samma sparkcykel finns med "
             + lank("sparkcykel-barn-roda-hjul-30-cm", "röda hjul")
             + " och " + lank("sparkcykel-barn-bla-hjul-30-cm", "blå hjul") + "."),
        ],
    },
]

# ── Modell I: korg, stänkskärmar, 139 cm, 100 kg, 120–170 cm ───────────────
# ☠️ DEN HÄR är modellen som faktiskt klarar en vuxen: 100 kg och en
#    kroppslängd upp till 170 cm. Leverantören lade familjeargumentet på
#    modell A (50 kg) i stället — det är den inversionen som gör att
#    påståendet hör hemma HÄR och ingen annanstans i rundan.
#
# ☠️ TVÅ PUBLICERADE SIDOR ÄR NÄRA SYSKON, och den ena är rosa och kostar
#    tio kronor mer. Skillnaden — korg, mugghållare och stänkskärmar — måste
#    stå i NAMNET, inte bara i brödtexten, och båda sidorna korslänkar.
I_EG = [
    "Broms på både fram- och bakhjul, manövrerade från styret",
    "Avtagbar plastkorg fram och mugghållare i metall",
    "Stänkskärmar fram och bak",
    "Stora gummidäck med mönstrad slitbana",
    "Bred halkfri fotplatta, 37 cm lång och 12,5 cm över marken",
    "Höjdjusterbart styre, 90 till 96 cm över marken",
    "Stålram, maxlast 100 kg",
    "Rekommenderad ålder 5–12 år, kroppslängd 120–170 cm",
]
I_SPEC = [
    "Mått: 139 × 58 × 90–96 cm (L × B × styrhöjd)",
    "Fotplatta: 37 cm lång, 12,5 cm över marken",
    "Hjul: stora gummidäck med mönstrad slitbana",
    "Bromsar: en på framhjulet och en på bakhjulet",
    "Korg: plast, avtagbar — mugghållare i metall",
    "Stänkskärmar: fram och bak",
    "Material: metall, plast, aluminiumlegering och gummi",
    "Maxlast: 100 kg",
    "Rekommenderad ålder: 5–12 år",
    "Rekommenderad längd: 120–170 cm",
    "Montering krävs",
]
I_SKOTSEL = [
    RAM_SKOTSEL,
    "Kontrollera bromsvajrarna med jämna mellanrum. Två bromsar betyder två "
    "vajrar som töjer sig, och den som töjt sig märks först när den behövs.",
    LAGER_SKOTSEL,
    FORVARING,
]
I_VILLKOR = ("Den enda som en vuxen kan låna", [
    "Maxlasten är <strong>100 kg</strong> och den angivna kroppslängden går "
    "till <strong>170 cm</strong>. Det är dubbelt så mycket som de mindre "
    "sparkcyklarna klarar, och det är därför den här är den enda en förälder kan ställa sig på utan att göra något dumt.",
    "Styret går bara till 96 cm, så en riktigt lång vuxen står böjd. Men för "
    "en tonåring, eller för en förälder som ska hämta barnet vid skolan, "
    "räcker den — och fotplattan på 37 cm ger plats för en hel vuxenfot.",
    "Stänkskärmarna är det som gör den användbar en regnig dag. Utan dem får "
    "man en våt rand längs ryggen efter varje pöl, och det är den detaljen "
    "som avgör om sparkcykeln används i september eller bara i juli.",    GAENDE,
    SKYDD,
])
I_FAQ_GEMENSAM = [
    ("Vad rymmer korgen?",
     "Den är gjord för en ryggsäck, en matlåda eller inköpen från kiosken. "
     "Något viktmått anges inte, så lasta den med förnuft: allt du lägger i "
     "korgen sitter framför styraxeln och gör styrningen tyngre."),
    ("Går korgen att ta bort?",
     "Ja, korgen är avtagbar. Mugghållaren i metall sitter kvar."),
    ("Hur skiljer den sig från de mindre sparkcyklarna?",
     "Tre saker: den tar 100 kg i stället för 50, den har broms på båda "
     "hjulen i stället för bara bakhjulet, och den har korg och "
     "stänkskärmar. Den är också 139 cm lång mot deras 118–120."),
    ("Måste den monteras?",
     "Ja, montering krävs. Styre, korg och hjulskärmar ska på — räkna med en "
     "halvtimme och att det går fortare med två personer."),
    ("Behöver däcken pumpas?",
     "Det är gummidäck med mönstrad slitbana, till skillnad från de massiva "
     "EVA-hjulen på de mindre modellerna. Kontrollera lufttrycket inför "
     "säsongen som på en cykel."),
]

PRODUKTER += [
    # ══ 7. e4e5a8ef — modell I, blå ═══════════════════════════════════════
    {
        "kort": "e4e5a8ef",
        "sku": "FP-sparkcykel-barn-bla-korg",
        "name": "Sparkcykel barn 139 cm med korg och stänkskärmar, blå – 100 kg",
        "slug": "sparkcykel-barn-bla-korg-stankskarmar",
        "title": "Sparkcykel barn med korg, blå | Fyndplats",
        "meta": ("Blå sparkcykel 139 cm med avtagbar korg, mugghållare, "
                 "stänkskärmar och broms på båda hjulen. Maxlast 100 kg, "
                 "kroppslängd 120–170 cm."),
        "ingress":
            "<p><strong>Blå ram, vit fotplatta och en svart korg "
            "fram.</strong> Den ser ut som en cykel utan sadel, och det är "
            "ungefär vad den är: stora gummidäck med mönster, skärmar över "
            "båda hjulen och bromshandtag på styret.</p>"
            "<p><strong>Maxlast 100 kg och kroppslängd upp till 170 "
            "cm.</strong> Det är dubbelt mot de mindre sparkcyklarna, och det gör den till den enda som ett större syskon "
            "eller en förälder också kan använda.</p>"
            "<p><strong>Korgen är avtagbar och mugghållaren sitter i "
            "metall.</strong> Ryggsäcken behöver alltså inte hänga på "
            "styret, där den annars drar hjulet åt sitt håll i varje "
            "sväng.</p>",
        "eg": I_EG,
        "spec": I_SPEC + ["Färg: blå ram med svart korg"],
        "villkor": I_VILLKOR,
        "skotsel": I_SKOTSEL,
        "faq": I_FAQ_GEMENSAM + [
            ("Finns den i fler utföranden?",
             "Ja, samma sparkcykel finns i "
             + lank("sparkcykel-barn-rosa-korg-stankskarmar", "rosa med vit korg")
             + ". Utan korg och skärmar finns dessutom "
             + lank("sparkcykel-barn-luftdack-40-cm", "en modell med Ø40 cm luftdäck")
             + " och " + lank("sparkcykel-barn-rosa-16-tum-luftdack",
                              "en rosa med 16 tum fram och 12 tum bak") + "."),
        ],
    },
    # ══ 8. b03784dc — modell I, rosa/vit ══════════════════════════════════
    {
        "kort": "b03784dc",
        "sku": "FP-sparkcykel-barn-rosa",
        "name": "Sparkcykel barn 139 cm med korg och stänkskärmar, rosa – 100 kg",
        "slug": "sparkcykel-barn-rosa-korg-stankskarmar",
        "title": "Sparkcykel barn med korg, rosa | Fyndplats",
        "meta": ("Rosa sparkcykel 139 cm med avtagbar vit korg, mugghållare, "
                 "stänkskärmar och broms på båda hjulen. Maxlast 100 kg, "
                 "kroppslängd 120–170 cm."),
        "ingress":
            "<p><strong>Rosa ram med vit korg, vita skärmar och vit "
            "fotplatta.</strong> Det tvåfärgade utförandet är hela "
            "skillnaden mot den blå — konstruktionen under är densamma.</p>"
            "<p><strong>Broms på båda hjulen och stänkskärmar över "
            "båda.</strong> Bromsarna gör att den stannar kortare än en "
            "sparkcykel med bara bakbroms, och skärmarna gör att den går att "
            "använda dagen efter regnet.</p>"
            "<p><strong>Maxlast 100 kg, angiven kroppslängd 120–170 cm.</strong> "
            "Den växer alltså med barnet betydligt längre än de mindre "
            "modellerna gör, och håller för ett större syskon som vill "
            "låna.</p>",
        "eg": I_EG,
        "spec": I_SPEC + ["Färg: rosa ram med vit korg och vita skärmar"],
        "villkor": I_VILLKOR,
        "skotsel": I_SKOTSEL,
        "faq": I_FAQ_GEMENSAM + [
            ("Finns den i fler utföranden?",
             "Ja, samma sparkcykel finns i "
             + lank("sparkcykel-barn-bla-korg-stankskarmar", "blått med svart korg")
             + ". Utan korg och skärmar finns dessutom "
             + lank("sparkcykel-barn-rosa-16-tum-luftdack",
                    "en rosa med 16 tum fram och 12 tum bak")
             + " och " + lank("sparkcykel-barn-luftdack-40-cm",
                              "en med Ø40 cm luftdäck") + "."),
        ],
    },
]
