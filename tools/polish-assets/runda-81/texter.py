# -*- coding: utf-8 -*-
"""Runda 81 — åtta hopfällbara utomhusstolar.

☠️ Batch 64 mätte skillnaden: fem produkter skrivna inline i API-anropet gav
NIO fel som nådde Wix, tre skrivna via fil gav noll. Texten skrivs därför HÄR.

☠️ RUNDANS HUVUDFYND: "2er Set" och "2 Sitzer" är INTE samma sak. Tre av
   utkasten heter `Faltstuhl 2 Sitzer` och är EN dubbelstol — leverantörens
   egen `Lieferumfang` säger `1 x Campingstuhl`. Två heter `2er Set` och är
   TVÅ stolar (`2 x Campingstuhl`). Fältet `antal` bär det, och linten fäller
   varje text som säger fel sak om det.

☠️ 250 KG ÄR TOTALT, INTE PER PERSON. Dubbelstolen bär 250 kg enligt källan
   och har två sitsar. Talet är alltså vad HELA stolen tål, och skrivs så.
   Att skriva det som en person-siffra hade fördubblat det som säkerhetstal.

☠️ INGEN AV DE ÅTTA HAR GASLYFT. Villkorsblocket från runda 80 pratar om
   gaslyft och trappsteg; det ersätts här av en egen text om att fälla ut
   helt och kontrollera låsningen. En stol som viks ihop under någon är
   familjens verkliga risk, inte att stå på sitsen.

☠️ `ergonomisk` FÅR INTE FÖREKOMMA. Källan kallar `bdb600fe` "ergonomischen
   Design" utan att bära någon norm.

☠️ HÄLSOPÅSTÅENDET PÅ `bdb600fe` ÄR STRUKET: att stolarna "Muskelschmerzen
   und Verspannungen reduzieren können". En stol lindrar inga besvär.

⚠️ `6307893c` ÄR FÄRGSYSKON TILL EN PUBLICERAD SIDA. Bild 1 är samma
   studiobild som `campingstol-fotstod-2-pack-fyra-lagen` (svart, 1 289 kr) —
   samma pose, samma två bärväskor, samma fotstöd. MEN leverantörens mått
   skiljer sig (hopfälld 104 mot 91 cm, nackstöd 27 × 12 × 5 mot 27 × 10 × 5).
   Texten länkar därför till den svarta som ett alternativ, men påstår ALDRIG
   att de är samma stol i en annan kulör — källan bär inte det påståendet.

⚠️ IMPORTENS SPEC-FLIK MOTSÄGER BRÖDTEXTEN på två produkter: `6307893c` säger
   `Edelstahl` i fliken och `Metall, 600D Oxford-Stoff, Schaumstoff` i texten;
   `cce86277` säger `Netz` i fliken och `Stahl, Texteline` i texten.
   Brödtexten gäller — fliken är maskinsatt.

⚠️ VIKTEN: källan ger både nettovikt och fraktvikt på `bdb600fe` (10,2 mot
   12,5 kg). Nettovikten är den kunden bär; fraktvikten står inte i texten.
"""

BAS = "https://www.fyndplats.se/produkt/"

# Publicerade sidor vi länkar till. Talen är LÄSTA på dem, inte gissade.
PUBL_CAMPING_SVART = ("campingstol-fotstod-2-pack-fyra-lagen", "120 kg per stol")
PUBL_CAMPING_ENKEL = ("hopfallbar-campingstol", "159 kg")
PUBL_CAMPING_ARM = ("campingstol-hopfallbar-armstod-2-pack", "130 kg per stol")


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


# ☠️ EGEN VILLKORSTEXT. Runda 80:s `maxlast()` talar om gaslyft; ingen av
#    rundans åtta har någon. Familjens verkliga risk är en stol som viks ihop
#    under någon som satt sig innan låsningen tog.
def maxlast(kg, per_stol, extra=None):
    vad = "per stol" if per_stol else "totalt"
    st = ["Stolen är provad för %d kg %s. Fäll ut den HELT innan du sätter "
          "dig och kontrollera att låsningen tagit — en fällstol som viks "
          "ihop under någon är familjens verkliga risk, inte överlast." % (kg, vad)]
    if extra:
        st.append(extra)
    st.append("Ställ stolen på plant underlag. På gräs och sand sjunker ett "
              "ben ner mer än de andra, och då hamnar hela lasten på tre ben "
              "i stället för fyra.")
    return ("Bär %d kg %s" % (kg, vad), st)


OXFORD_SKOTSEL = ("Oxford-väven borstas ren torr och tvättas vid behov med "
                  "ljummet vatten och lite diskmedel. Låt stolen torka helt "
                  "uppfälld innan den läggs i väskan — fuktig väv i en stängd "
                  "väska möglar på några dagar.")
TEXTILEN_SKOTSEL = ("Textilenväven torkas av med en fuktig trasa och torkar "
                    "på minuter. Den tål regn, men lämna inte stolarna ute "
                    "hela vintern: det är lederna och skruvarna som rostar, "
                    "inte väven.")
LEDER_SKOTSEL = ("Fäll och veckla ut stolen några gånger när den är ny så "
                 "går lederna mjukare. Kärvar en led senare räcker en droppe "
                 "olja i gångjärnet — smörj inte hela röret, oljan drar åt "
                 "sig sand.")

MONTERING_FAQ = ("Behöver den monteras?",
                 "Nej. Stolen kommer färdig och fälls ut på plats.")


# Dubbelstolens spec byggs EN gång och färgas per stol, så tre syskon inte
# kan glida isär på ett mått.
def dubbel_spec(farg):
    return [
        "Mått utfälld (L × B × H): 143 × 50 × 90 cm",
        "Hopfälld (L × B × H): 90 × 23 × 17 cm",
        "Sitthöjd: 44 cm",
        "Antal sitsar: 2 i samma stol",
        "Maxlast: 250 kg totalt",
        "Vikt: 6,8 kg",
        "Paketmått: 93 × 25 × 18 cm",
        "Klädsel: 600D Oxford-väv, 210 g/m²",
        "Stomme: metall",
        "Färg: %s" % farg,
        "Mugghållare: 2",
        "Montering: krävs inte",
        "Ingår: dubbelstol, bärväska och bruksanvisning",
    ]


def dubbel_eg(farg):
    return [
        "EN stol med två stoppade sitsar, inte två lösa stolar",
        "143 cm bred i ett stycke",
        "Armstöd och två mugghållare",
        "Sitthöjd 44 cm",
        "600D Oxford-väv, 210 g/m²",
        "Väger 6,8 kg med bärväska",
        "Färg: %s" % farg,
    ]


DUBBEL_SKOTSEL = [OXFORD_SKOTSEL, LEDER_SKOTSEL,
                  "Bärväskan följer med. Fäll ihop stolen tills den låser i "
                  "hopfällt läge innan du för in den — tvingas den in halvvikt "
                  "sliter dragkedjan mot rören."]


def dubbel_faq(farg, syskon):
    return [
        ("Är det två stolar eller en?",
         "En. Det är EN stol med två sitsar bredvid varandra under ett "
         "gemensamt tygstycke — 143 cm bred. Vill du kunna ställa sittplatserna "
         "på var sitt håll är "
         + lank(PUBL_CAMPING_ARM[0], "två fristående campingstolar i 2-pack")
         + " rätt val."),
        ("Vad betyder 250 kg?",
         "Det är vad hela stolen tål, alltså båda sitsarna tillsammans. Talet "
         "ska inte läsas som 250 kg per person."),
        ("Vilka färger finns den i?",
         "Tre: " + syskon + "."),
        MONTERING_FAQ,
    ]


PRODUKTER = [
    # ======================================= A · TVÅPACK CAMPINGSTOLAR (2) ===
    {
        "kort": "6307893c", "pris": 1079, "antal": 2,
        "slug": "campingstolar-2-pack-gra-fotstod",
        "name": "Campingstolar 2-pack grå med fotstöd – fyra rygglägen",
        "title": "Campingstolar 2-pack med fotstöd | Fyndplats",
        "meta": "Två hopfällbara campingstolar i grått med avtagbart fotstöd, "
                "nätsits och fyra rygglägen. Mugghållare, sidoficka och två "
                "bärväskor. Bär 120 kg per stol.",
        "ingress":
            "<p>Två <strong>campingstolar</strong> som går från sittande till "
            "nästan liggande i fyra lägen. Fotstödet är avtagbart, så samma stol "
            "fungerar både vid lägerbordet och framför utsikten.</p>"
            "<p>Sitsen är nätväv och släpper igenom luft — det är skillnaden mot "
            "en heltäckt stol när solen ligger på. Varje stol har mugghållare och "
            "en sidoficka, och båda ryms i var sin bärväska som följer med.</p>"
            "<p>Vi har också "
            + lank(PUBL_CAMPING_SVART[0], "ett svart tvåpack med fotstöd")
            + " och "
            + lank(PUBL_CAMPING_ENKEL[0], "en enkel campingstol som bär 159 kg")
            + ".</p>",
        "eg": [
            "Två stolar i leveransen",
            "Fyra rygglägen, från sittande till nästan liggande",
            "Avtagbart fotstöd",
            "Nätsits som släpper igenom luft",
            "Mugghållare och sidoficka på varje stol",
            "Två bärväskor ingår",
            "Bär 120 kg per stol",
        ],
        "spec": [
            "Antal: 2 stolar",
            "Mått utfälld (B × D × H): 80 × 125 × 92–100 cm",
            "Hopfälld (L × B × H): 104 × 18 × 18 cm",
            "Sits (B × D): 52 × 46 cm",
            "Sitthöjd: 42 cm",
            "Ryggstöd (B × L): 52 × 73 cm",
            "Nackstöd (L × B × D): 27 × 12 × 5 cm",
            "Rygglägen: 4",
            "Mugghållare: en per stol",
            "Sidoficka: en per stol",
            "Maxlast: 120 kg per stol",
            "Vikt: 8,5 kg för båda",
            "Paketmått: 103 × 38 × 20,5 cm",
            "Material: metall, 600D Oxford-väv och skum",
            "Färg: mörkgrå och svart",
            "Montering: krävs inte",
            "Ingår: 2 stolar, 2 fotstöd, 2 bärväskor och bruksanvisning",
        ],
        "villkor": maxlast(120, True,
            "Fotstödet är avtagbart och bär inte en person. Det är gjort för "
            "benen; sätt dig inte på det och lägg inte packningen där."),
        "skotsel": [OXFORD_SKOTSEL, LEDER_SKOTSEL,
                    "Nätsitsen torkar snabbast av alla delar men samlar sand i "
                    "väven. Skaka ur stolen upp och ned innan den viks ihop."],
        "faq": [
            ("Hur många stolar ingår?",
             "Två, med var sin bärväska och var sitt fotstöd."),
            ("Går fotstödet att ta bort?",
             "Ja. Det hakas av och stolen fungerar som en vanlig campingstol "
             "utan det."),
            ("Vad skiljer den från den svarta?",
             "Kulören, och måtten skiljer sig något mellan de två — "
             + lank(PUBL_CAMPING_SVART[0], "den svarta anges hopfälld till 91 cm")
             + " mot 104 cm här. Läs specen på den du väljer."),
            MONTERING_FAQ,
        ],
    },
    {
        "kort": "46d2c85a", "pris": 1099, "antal": 2,
        "slug": "campingstolar-2-pack-nackstod-kylficka",
        "name": "Campingstolar 2-pack med nackstöd och kylficka – bär 120 kg",
        "title": "Campingstolar 2-pack med nackstöd | Fyndplats",
        "meta": "Två stoppade campingstolar med inbyggt nackstöd, kylficka och "
                "mugghållare. Stomme i pulverlackerad metall, 600D Oxford-väv, "
                "bärväska ingår. Bär 120 kg per stol.",
        "ingress":
            "<p>Två stoppade <strong>campingstolar</strong> med nackstödet inbyggt "
            "i ryggen i stället för som en lös kudde. Det är skillnaden mot en "
            "enklare stol när man sitter en hel kväll.</p>"
            "<p>På sidan sitter en kylficka och en mugghållare, och armstöden "
            "ligger 74 cm över marken. Stommen är pulverlackerad metall och väven "
            "är 600D Oxford, som tål stänk.</p>"
            "<p>Vi har också "
            + lank(PUBL_CAMPING_ARM[0], "ett tvåpack som bär 130 kg per stol")
            + ".</p>",
        "eg": [
            "Två stolar i leveransen",
            "Nackstöd inbyggt i ryggen",
            "Kylficka, mugghållare och sidofickor",
            "Genomgående stoppning i sits och rygg",
            "Pulverlackerad metallstomme",
            "Bärväska ingår",
            "Bär 120 kg per stol",
        ],
        "spec": [
            "Antal: 2 stolar",
            "Mått utfälld (L × B × H): 94 × 62 × 100 cm",
            "Hopfälld (B × D × H): 103 × 16 × 18 cm",
            "Sits (B × D): 50 × 50 cm",
            "Sitthöjd: 45 cm",
            "Ryggstöd (B × H): 60 × 60 cm",
            "Armstödshöjd från marken: 74 cm",
            "Nackstöd: inbyggt i ryggen",
            "Mugghållare: en per stol",
            "Kylficka: en isolerad ficka per stol",
            "Maxlast: 120 kg per stol",
            "Vikt: 11 kg för båda",
            "Paketmått: 102 × 22 × 35 cm",
            "Material: metall och 600D Oxford-väv",
            "Färg: svart",
            "Montering: krävs inte",
            "Ingår: 2 stolar, bärväska och bruksanvisning",
        ],
        "villkor": maxlast(120, True,
            "Kylfickan är en isolerad ficka i tyget, inte en kylbox. Den håller "
            "en kall dryck kall en stund; den kyler ingenting som är varmt."),
        "skotsel": [OXFORD_SKOTSEL, LEDER_SKOTSEL,
                    "Stoppningen suger vatten om stolen står ute i regn. Ställ "
                    "den under tak eller vänd den upp och ned när ovädret kommer."],
        "faq": [
            ("Hur många stolar ingår?", "Två, i en gemensam bärväska."),
            ("Är nackstödet löst?",
             "Nej, det är sytt i ryggen och följer med när ryggen lutar."),
            ("Vad rymmer kylfickan?",
             "Den är gjord för ett par burkar eller en flaska. Den är isolerad, "
             "inte kyld."),
            MONTERING_FAQ,
        ],
    },
    # ============================================ B · DUBBELSTOLARNA (3) ===
    {
        "kort": "4401be4f", "pris": 999, "antal": 1,
        "slug": "dubbel-campingstol-bla-tva-sitsar",
        "name": "Dubbel campingstol blå – två sitsar i en stol, 143 cm bred",
        "title": "Dubbel campingstol blå, två sitsar | Fyndplats",
        "meta": "En campingstol med två stoppade sitsar under samma tygstycke, "
                "143 cm bred. Armstöd, två mugghållare, sitthöjd 44 cm och "
                "bärväska. Bär 250 kg totalt.",
        "ingress":
            "<p>En <strong>dubbel campingstol</strong> — alltså EN stol med två "
            "stoppade sitsar bredvid varandra, inte två lösa stolar. Hela möbeln "
            "är 143 cm bred och fälls ihop till ett paket på 90 cm.</p>"
            "<p>Mellan sitsarna och i ytterkanterna sitter armstöd, och två "
            "mugghållare är insydda. Väven är 600D Oxford på 210 g/m² och "
            "stommen är metall.</p>"
            "<p>Samma stol finns i "
            + lank("dubbel-campingstol-khaki-tva-sitsar", "khaki")
            + " och " + lank("dubbel-campingstol-gron-tva-sitsar", "grönt")
            + ".</p>",
        "eg": dubbel_eg("blå"),
        "spec": dubbel_spec("blå"),
        "villkor": maxlast(250, False,
            "Talet gäller stolen, inte en sits, och två vuxna ligger med god "
            "marginal under det."),
        "skotsel": DUBBEL_SKOTSEL,
        "faq": dubbel_faq("blå",
            "blå, " + lank("dubbel-campingstol-khaki-tva-sitsar", "khaki")
            + " och " + lank("dubbel-campingstol-gron-tva-sitsar", "grön")),
    },
    {
        "kort": "8b66533f", "pris": 999, "antal": 1,
        "slug": "dubbel-campingstol-khaki-tva-sitsar",
        "name": "Dubbel campingstol khaki – två sitsar i en stol, 143 cm bred",
        "title": "Dubbel campingstol khaki, två sitsar | Fyndplats",
        "meta": "En campingstol med två stoppade sitsar under samma tygstycke, "
                "143 cm bred. Armstöd, två mugghållare, sitthöjd 44 cm och "
                "bärväska. Bär 250 kg totalt.",
        "ingress":
            "<p>Den khakifärgade <strong>dubbla campingstolen</strong> — EN stol "
            "med två stoppade sitsar under ett gemensamt tygstycke. Kulören är "
            "den minst känsliga för damm och gräsfläckar av seriens tre.</p>"
            "<p>Bredden är 143 cm utfälld och 90 cm hopfälld, och stolen väger "
            "6,8 kg med bärväskan. Två mugghållare sitter insydda i armstöden.</p>"
            "<p>Samma stol finns i "
            + lank("dubbel-campingstol-bla-tva-sitsar", "blått")
            + " och " + lank("dubbel-campingstol-gron-tva-sitsar", "grönt")
            + ".</p>",
        "eg": dubbel_eg("khaki"),
        "spec": dubbel_spec("khaki"),
        "villkor": maxlast(250, False,
            "Talet gäller stolen, inte en sits, och två vuxna ligger med god "
            "marginal under det."),
        "skotsel": DUBBEL_SKOTSEL,
        "faq": dubbel_faq("khaki",
            lank("dubbel-campingstol-bla-tva-sitsar", "blå") + ", khaki och "
            + lank("dubbel-campingstol-gron-tva-sitsar", "grön")),
    },
    {
        "kort": "65c84a9b", "pris": 999, "antal": 1,
        "slug": "dubbel-campingstol-gron-tva-sitsar",
        "name": "Dubbel campingstol grön – två sitsar i en stol, 143 cm bred",
        "title": "Dubbel campingstol grön, två sitsar | Fyndplats",
        "meta": "En campingstol med två stoppade sitsar under samma tygstycke, "
                "143 cm bred. Armstöd, två mugghållare, sitthöjd 44 cm och "
                "bärväska. Bär 250 kg totalt.",
        "ingress":
            "<p>Den gröna <strong>dubbla campingstolen</strong> i seriens tre "
            "kulörer. EN stol med två stoppade sitsar, 143 cm bred, som fälls "
            "ihop till 90 × 23 × 17 cm.</p>"
            "<p>Grönt smälter in mot gräs och skog på ett sätt som blått och "
            "khaki inte gör — det är hela skillnaden mot syskonen, för mått, "
            "vikt och maxlast är desamma.</p>"
            "<p>Samma stol finns i "
            + lank("dubbel-campingstol-bla-tva-sitsar", "blått")
            + " och " + lank("dubbel-campingstol-khaki-tva-sitsar", "khaki")
            + ".</p>",
        "eg": dubbel_eg("grön"),
        "spec": dubbel_spec("grön"),
        "villkor": maxlast(250, False,
            "Talet gäller stolen, inte en sits, och två vuxna ligger med god "
            "marginal under det."),
        "skotsel": DUBBEL_SKOTSEL,
        "faq": dubbel_faq("grön",
            lank("dubbel-campingstol-bla-tva-sitsar", "blå") + ", "
            + lank("dubbel-campingstol-khaki-tva-sitsar", "khaki") + " och grön"),
    },
    # ======================================= C · TRÄDGÅRDSFÄLLSTOLAR (3) ===
    {
        "kort": "bdb600fe", "pris": 1059, "antal": 2,
        "slug": "fallstolar-2-pack-lag-sits-37-cm",
        "name": "Fällstolar 2-pack i textilen – låg sitthöjd 37 cm, bär 110 kg",
        "title": "Fällstolar 2-pack i textilen | Fyndplats",
        "meta": "Två hopfällbara stolar i väderbeständig textilen med hög rygg "
                "och armstöd. Låg sitthöjd 37 cm, hopfällda 17 cm tjocka. "
                "Bär 110 kg per stol.",
        "ingress":
            "<p>Två <strong>fällstolar</strong> i väderbeständig textilenväv med "
            "hög rygg och armstöd. Sitthöjden är 37 cm — lägre än en matstol och "
            "lägre än de andra fällstolarna vi har.</p>"
            "<p>Den låga sitsen gör dem till loungestolar snarare än bordsstolar: "
            "man sitter tillbakalutad, inte upprätt vid ett bord. Hopfällda är de "
            "17 cm tjocka och tar liten plats stående mot en vägg.</p>"
            "<p>Vill du sitta högre finns "
            + lank("tradgardsstolar-hog-rygg-2-pack",
                   "trädgårdsstolarna med sitthöjd 44 cm")
            + ".</p>",
        "eg": [
            "Två stolar i leveransen",
            "Låg sitthöjd, 37 cm",
            "Hög rygg, 45 × 57 cm",
            "Armstöd",
            "Väderbeständig textilenväv",
            "Hopfällda 17 cm tjocka",
            "Bär 110 kg per stol",
        ],
        "spec": [
            "Antal: 2 stolar",
            "Mått utfälld (B × D × H): 58 × 64 × 94 cm",
            "Hopfälld (L × B × H): 86 × 58 × 17 cm",
            "Sits (B × D): 45 × 47 cm",
            "Sitthöjd: 37 cm",
            "Ryggstöd (B × H): 45 × 57 cm",
            "Maxlast: 110 kg per stol",
            "Vikt: 10,2 kg för båda",
            "Paketmått: 90 × 27 × 60 cm",
            "Material: metall och textilenväv",
            "Färg: svart",
            "Montering: krävs inte",
            "Ingår: 2 stolar och bruksanvisning",
        ],
        "villkor": maxlast(110, True,
            "110 kg är seriens lägsta tal — de andra fällstolarna i sortimentet "
            "bär mer. Kontrollera siffran på just den stol du väljer."),
        "skotsel": [TEXTILEN_SKOTSEL, LEDER_SKOTSEL,
                    "Väven är spänd i ramen och tänjs med tiden. Blir sitsen "
                    "sladdrig är det väven som gett efter, inte ramen som "
                    "böjts — stolen är fortfarande hel."],
        "faq": [
            ("Hur många stolar ingår?", "Två."),
            ("Är 37 cm ovanligt lågt?",
             "Ja, för en stol med hög rygg. Man sitter tillbakalutad snarare än "
             "upprätt. Vid ett vanligt trädgårdsbord blir det lågt — mät ditt "
             "bord innan du beställer."),
            ("Tål de att stå ute?",
             "Väven tål väder. Låt dem inte övervintra ute ändå: det är lederna "
             "och skruvarna som rostar först, inte tyget."),
            MONTERING_FAQ,
        ],
    },
    {
        "kort": "cce86277", "pris": 1099, "antal": 2,
        "slug": "tradgardsstolar-hog-rygg-2-pack",
        "name": "Trädgårdsstolar 2-pack, hopfällbara med hög rygg – sitthöjd 44 cm",
        "title": "Trädgårdsstolar 2-pack, hög rygg | Fyndplats",
        "meta": "Två hopfällbara trädgårdsstolar i stål och textilen med 60 cm "
                "hög rygg, svängda armstöd och fottassar. Sitthöjd 44 cm, "
                "bär 120 kg per stol.",
        "ingress":
            "<p>Två hopfällbara <strong>trädgårdsstolar</strong> med 60 cm hög rygg och "
            "svängda armstöd. Sitthöjden är 44 cm, alltså ungefär en matstols — "
            "de fungerar vid ett bord, till skillnad från en låg loungestol.</p>"
            "<p>Stommen är pulverlackerat stål och väven är textilen, som torkar "
            "på minuter efter regn. Under benen sitter fottassar som skonar "
            "trätrall och plattor.</p>"
            "<p>Vill du sitta lägre och mer tillbakalutad finns "
            + lank("fallstolar-2-pack-lag-sits-37-cm",
                   "fällstolarna med sitthöjd 37 cm")
            + ".</p>",
        "eg": [
            "Två stolar i leveransen",
            "Ryggstöd 60 cm högt",
            "Svängda armstöd",
            "Sitthöjd 44 cm",
            "Fottassar som skonar underlaget",
            "Textilenväv som torkar snabbt",
            "Bär 120 kg per stol",
        ],
        "spec": [
            "Antal: 2 stolar",
            "Mått utfälld (B × D × H): 58 × 62 × 97 cm",
            "Hopfälld (L × B × H): 87 × 58 × 16 cm",
            "Sits (B × D): 45 × 43 cm",
            "Sitthöjd: 44 cm",
            "Ryggstöd (L × B): 60 × 45 cm",
            "Fottassar: en under varje ben",
            "Maxlast: 120 kg per stol",
            "Vikt: 12 kg för båda",
            "Paketmått: 89 × 25 × 58,5 cm",
            "Material: pulverlackerat stål och textilenväv",
            "Färg: svart",
            "Montering: krävs inte",
            "Ingår: 2 stolar och bruksanvisning",
        ],
        "villkor": maxlast(120, True,
            "Fottassarna är slitdelar. Går en av dem sönder står stolen på en "
            "vass rörände — byt tassen eller sätt en filttass under, annars "
            "repas trätrallen på en säsong."),
        "skotsel": [TEXTILEN_SKOTSEL, LEDER_SKOTSEL,
                    "Sitter stolarna hopfällda i ett fuktigt förråd hela vintern "
                    "rostar lederna. Ställ dem torrt, eller fäll ut dem några "
                    "gånger under säsongen."],
        "faq": [
            ("Hur många stolar ingår?", "Två."),
            ("Är 60 cm stolens höjd?",
             "Nej. 60 cm är RYGGSTÖDETS höjd. Hela stolen är 97 cm hög."),
            ("Passar de vid ett vanligt trädgårdsbord?",
             "Sitthöjden är 44 cm, alltså ungefär som en matstol. Mät från "
             "marken till bordets underkant om du är osäker."),
            MONTERING_FAQ,
        ],
    },
    {
        "kort": "e39db7dd", "pris": 1549, "antal": 2,
        "slug": "tradgardsstolar-akacia-rotting-2-pack",
        "name": "Trädgårdsstolar 2-pack i akacia och konstrotting – bär 160 kg",
        "title": "Trädgårdsstolar i akacia 2-pack | Fyndplats",
        "meta": "Två hopfällbara trädgårdsstolar med ram i massiv akacia och "
                "flätad konstrotting i grått. Sitthöjd 46 cm, färdigmonterade, "
                "bär 160 kg per stol.",
        "ingress":
            "<p>Två hopfällbara <strong>trädgårdsstolar</strong> med ram i massiv akacia "
            "och flätad konstrotting i grått. De kommer färdigmonterade och fälls "
            "ut på några sekunder.</p>"
            "<p>Rottingflätningen ger efter under kroppen på ett sätt en spänd "
            "duk inte gör, och den släpper igenom luft. Sitthöjden är 46 cm och "
            "varje stol bär 160 kg — seriens högsta tal.</p>"
            "<p>Vill du ha metall och textilen i stället finns "
            + lank("tradgardsstolar-hog-rygg-2-pack",
                   "trädgårdsstolarna med hög rygg")
            + ".</p>",
        "eg": [
            "Två stolar i leveransen",
            "Ram i massiv akacia",
            "Flätad konstrotting i grått",
            "Sitthöjd 46 cm",
            "Färdigmonterade",
            "Hopfällda 10 cm tjocka",
            "Bär 160 kg per stol",
        ],
        "spec": [
            "Antal: 2 stolar",
            "Mått utfälld (B × D × H): 47,5 × 56 × 88 cm",
            "Hopfälld (L × B × H): 100 × 48 × 10 cm",
            "Sits (B × D): 38 × 40 cm",
            "Sitthöjd: 46 cm",
            "Ryggstöd (B × H): 43 × 34 cm",
            "Maxlast: 160 kg per stol",
            "Vikt: 13 kg för båda",
            "Paketmått: 106 × 53 × 24,5 cm",
            "Material: akaciaträ och konstrotting av polyeten",
            "Färg: naturträ och grått",
            "Montering: krävs inte",
            "Ingår: 2 stolar och bruksanvisning",
        ],
        "villkor": maxlast(160, True,
            "160 kg är seriens högsta tal, och det är den massiva träramen som "
            "bär det. Rottingen är sittyta, inte bärande — kliv inte på "
            "flätningen när du reser dig."),
        "skotsel": [
            "Akacian är obehandlad eller lätt oljad och grånar i väder. Vill du "
            "behålla den varma tonen olja träet en gång per säsong; låter du bli "
            "blir stolen silvergrå utan att bli svagare.",
            "Konstrottingen torkas av med en fuktig trasa. Den tål sol och regn, "
            "men inte lösningsmedel — de gör plasten spröd.",
            "Ställ inte stolarna direkt på blöt mark hela säsongen. Träet suger "
            "vatten underifrån, och det är benändarna som ruttnar först.",
        ],
        "faq": [
            ("Hur många stolar ingår?", "Två, färdigmonterade."),
            ("Behöver de monteras?",
             "Nej. De kommer hopfällda och färdiga — du fäller bara ut dem."),
            ("Tål de att stå ute?",
             "Ja, både akacian och konstrottingen är gjorda för utomhusbruk. "
             "Träet grånar med tiden, vilket är normalt och inte en skada."),
            ("Vad är konstrotting?",
             "Flätade band av polyeten som ser ut som naturrotting men tål "
             "regn och sol. Naturrotting hade mörknat och blivit skör ute."),
        ],
    },
]
