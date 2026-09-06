# -*- coding: utf-8 -*-
"""Runda 83 — åtta mobila massagebänkar.

☠️ Batch 64 mätte skillnaden: fem produkter skrivna inline i API-anropet gav
NIO fel som nådde Wix, tre skrivna via fil gav noll. Texten skrivs därför HÄR.

☠️ RUNDANS LAGLIGHETSGRIND: en massagebänk är INGEN medicinteknisk produkt.
   Ingen text får antyda behandling, lindring, rehabilitering eller effekt på
   besvär. Ordet massage beskriver MÖBELN, aldrig ett resultat. Linten fäller
   på `behandl|terapi|rehab|lindr|smärt|besvär|läker` utöver husets vanliga
   hälsogrind.

☠️ 81 CM ÄR INTE BÄDDENS BREDD. Källan anger `81B` på tre bänkar; ritningen
   visar att 81 är bredden ÖVER ARMHYLLORNA och att liggytan är 60 cm. En
   köpare jämför på bäddens bredd. Vi skriver 60 som B och redovisar
   totalbredden som en egen rad där armhyllor finns.

☠️ `d7eca2ba` FÅR INGEN HÖJDRAD OCH INGEN HOPFÄLLD TJOCKLEK. Dess tyska text
   är ordagrant syskonets (`2cfd373a`), medan dess EGEN måttritning säger
   58–81 cm och 13 cm mot textens 61–87 och 17. Renderingarna visar dessutom
   två olika underreden. Samma regel som runda 82:s `2a16c507`: när källan
   motsäger sig själv utelämnar man raden.

☠️ MAXLASTENS KVALIFICERING FÖLJER MED. `2cfd373a` och `d7eca2ba` säger
   `Maximal empfohlene Belastung` — REKOMMENDERAD maxlast. På en möbel någon
   ligger på är det inte en nyans, och ordet står kvar i vår spec.

⚠️ TRÄSLAGET UTELÄMNAS PÅ FYRA. Brödtexten säger `Buchenholz`, den maskinsatta
   spec-fliken säger `Kunststoff` respektive `Pappelholz`. Två källor, två
   svar — vi skriver "stomme i trä" och väljer inte.

⚠️ INGEN NORM ÄR ANGIVEN. Leverantören citerar ingen EN-standard och ingen
   CE-märkning för någon av de åtta. Vi påstår därför ingen.
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


# ── Villkorsblocket: rundans säkerhetstext ─────────────────────────────────
# ☠️ Ordet massage beskriver MÖBELN. Ingen mening här får antyda ett resultat.
def maxlast(kg, rekommenderad=False):
    # ☠️ Ordet "leverantören" är förbjudet — mot kunden är VI leverantören.
    #    Uppgiften står därför utan avsändare, precis som runda 82 löste det.
    ord_ = "Rekommenderad maxlast %d kg" % kg if rekommenderad else "Bär %d kg" % kg
    forsta = ("Bänken anges tåla %d kg%s." % (
        kg, " som rekommenderad maxlast" if rekommenderad else ""))
    return (ord_, [
        forsta + " Talet gäller den utfällda bänken på plant golv. Läs det "
        "som en konstruktionsuppgift och inte som ett provningsresultat — "
        "ingen provningsnorm anges för bänken.",
        "Kontrollera att BÅDA benparen är låsta i samma hål innan någon "
        "lägger sig. En hopfällbar bänk med ett ben ett steg fel står snett "
        "och tar hela lasten på tre punkter — det är den verkliga risken, "
        "inte överlast.",
        "Ansiktsöppningen ska vara fri. Lägg inget under den och ställ inte "
        "bänken så att öppningen hamnar över en kant eller ett bordsben; den "
        "som ligger på mage ska kunna andas obehindrat och komma upp själv.",
    ])


PVC_SKOTSEL = ("Klädseln torkas av med en fuktig trasa och mild såpa, och "
               "eftertorkas. Använd inte sprit, aceton eller slipande medel — "
               "ytan är ett tunt skikt och krackelerar när det torkar ut.")
FALL_SKOTSEL = ("Fäll ihop bänken med klädseln inåt så skyddas ytan av sig "
                "själv under transport. Dra åt spännvajrarna under bädden om "
                "de börjat ge efter; det är de som håller benen i vinkel.")
FORVAR_SKOTSEL = ("Förvara den stående på högkant, inte liggande under något. "
                  "En vikt bänk med tryck ovanpå får märken i skummet som "
                  "inte går ur.")

MONTERING_FAQ = ("Behöver den monteras?",
                 "Nej. Bänken kommer hopfälld och viks ut på plats; höjden "
                 "ställs med sprintar i benen.")


def bank_spec(rader):
    return rader


PRODUKTER = [
    # ── Två aluminiumbänkar i tre zoner ─────────────────────────────────────
    {
        "kort": "a353ea02", "pris": 1629,
        "name": "Massagebänk 3 zoner i aluminium, vit – 185 × 60 cm bädd, 225 kg",
        "slug": "massagebank-vit-3-zoner-aluminium",
        "title": "Massagebänk 3 zoner i aluminium, vit – 225 kg | Fyndplats",
        "meta": ("Vit hopfällbar massagebänk med tre zoner och aluminiumram. "
                 "Bädd 185 × 60 cm, höjd 61–84 cm, bär 225 kg och väger "
                 "17,5 kg."),
        "ingress": (
            "<p>En massagebänk i <strong>tre zoner</strong> — rygg, mittdel och "
            "bendel viks var för sig, så bänken kan ställas i halvsittande läge "
            "och inte bara plant. Ramen är aluminium, vilket är skillnaden mot "
            "en trämodell när den ska bäras.</p>"
            "<p>Liggytan är 185 × 60 cm och höjden ställs mellan 61 och 84 cm. "
            "Med armhyllorna utfällda är bänken 81 cm bred; hopfälld är den "
            "91 × 60 cm och väger 17,5 kg.</p>"
            "<p>Samma bänk finns " +
            lank("massagebank-svartrod-3-zoner", "i svart och rött") +
            ". Vill du ha träställ i stället har vi " +
            lank("massagebank-bok-creme-barvaska", "en bänk i trä som bär 250 kg") +
            ", och för den som bär ofta " +
            lank("massagebank-cremevit-2-zoner", "en lättare tvåzonsmodell på 13 kg") +
            ".</p>"),
        "eg": [
            "Tre zoner — rygg, mittdel och bendel viks var för sig",
            "Ram i aluminium",
            "Höjden ställs mellan 61 och 84 cm",
            "Liggyta 185 × 60 cm",
            "Ansiktsöppning i rygg­delen",
            "Fälls ihop till 91 × 60 cm",
            "Bär 225 kg",
        ],
        "spec": [
            "Totallängd med ansiktsstöd: 215 cm",
            "Liggyta (L × B): 185 × 60 cm",
            "Totalbredd med armhyllor: 81 cm",
            "Höjd: 61–84 cm",
            "Hopfälld (L × B): 91 × 60 cm",
            "Maxlast: 225 kg",
            "Vikt: 17,5 kg",
            "Paketmått: 94,5 × 62 × 20,5 cm",
            "Stomme: aluminium",
            "Klädsel: PVC över skum",
            "Färg: vit",
            "Antal zoner: 3",
            "Montering: krävs inte",
            "Ingår: massagebänk",
        ],
        "villkor": maxlast(225),
        "skotsel": [PVC_SKOTSEL, FALL_SKOTSEL, FORVAR_SKOTSEL],
        "faq": [
            ("Vad betyder tre zoner?",
             "Bänken är delad i tre sektioner som viks oberoende av varandra: "
             "ryggdel, mittdel och bendel. Med ryggen uppfälld går den att "
             "använda halvsittande, inte bara plant."),
            ("Hur bred är själva liggytan?",
             "60 cm. De 81 centimetrarna som ibland anges är bredden över "
             "armhyllorna, alltså bänkens totala fotavtryck — inte ytan man "
             "ligger på."),
            ("Går den att bära?",
             "Ja, den fälls till 91 × 60 cm och väger 17,5 kg. Aluminiumramen "
             "är det som gör den lättare än en trämodell av samma storlek."),
            MONTERING_FAQ,
        ],
    },
    {
        "kort": "5078bedf", "pris": 1639,
        "name": "Massagebänk 3 zoner svart och röd – 185 × 60 cm bädd, 225 kg",
        "slug": "massagebank-svartrod-3-zoner",
        "title": "Massagebänk 3 zoner svart och röd – 225 kg | Fyndplats",
        "meta": ("Massagebänk i svart och rött med tre zoner och aluminiumram. "
                 "Bädd 185 × 60 cm, höjd 61–84 cm, bär 225 kg och väger "
                 "17,5 kg."),
        "ingress": (
            "<p>Samma treszonsbänk som den vita, i <strong>svart med röd "
            "mittzon</strong>. Mörk klädsel är den mindre känsliga av de två "
            "för olja och fläckar — det är hela skillnaden mot syskonet, för "
            "mått, vikt och maxlast är desamma.</p>"
            "<p>Liggytan är 185 × 60 cm, höjden ställs mellan 61 och 84 cm, "
            "och med armhyllorna ute är bänken 81 cm bred.</p>"
            "<p>Samma bänk finns " +
            lank("massagebank-vit-3-zoner-aluminium", "i vitt") +
            ". Vill du ha träställ har vi " +
            lank("massagebank-bok-svart-barvaska", "en svart bänk i trä som bär 250 kg") +
            ".</p>"),
        "eg": [
            "Tre zoner — rygg, mittdel och bendel viks var för sig",
            "Ram i aluminium",
            "Höjden ställs mellan 61 och 84 cm",
            "Liggyta 185 × 60 cm",
            "Mörk klädsel som tål olja och fläckar bättre",
            "Fälls ihop till 91 × 61 cm",
            "Bär 225 kg",
        ],
        "spec": [
            "Totallängd med ansiktsstöd: 215 cm",
            "Liggyta (L × B): 185 × 60 cm",
            "Totalbredd med armhyllor: 81 cm",
            "Höjd: 61–84 cm",
            "Hopfälld (L × B): 91 × 61 cm",
            "Maxlast: 225 kg",
            "Vikt: 17,5 kg",
            "Paketmått: 94,5 × 62 × 20 cm",
            "Stomme: aluminium",
            "Klädsel: PVC över skum",
            "Färg: svart med röd mittzon",
            "Antal zoner: 3",
            "Montering: krävs inte",
            "Ingår: massagebänk",
        ],
        "villkor": maxlast(225),
        "skotsel": [PVC_SKOTSEL, FALL_SKOTSEL, FORVAR_SKOTSEL],
        "faq": [
            ("Vad är skillnaden mot den vita?",
             "Kulören. Liggyta, höjd, vikt och maxlast är desamma; det "
             "hopfällda måttet skiljer sig med en centimeter på bredden."),
            ("Hur bred är själva liggytan?",
             "60 cm. De 81 centimetrarna är bredden över armhyllorna, alltså "
             "bänkens fotavtryck — inte ytan man ligger på."),
            ("Syns oljefläckar på den?",
             "Mindre än på en ljus klädsel, men olja ska ändå torkas av direkt "
             "med en fuktig trasa. PVC-ytan tar inte skada av vatten, men "
             "olja som får ligga kvar drar åt sig damm."),
            MONTERING_FAQ,
        ],
    },
]

PRODUKTER += [
    # ── Två träbänkar med bärväska ─────────────────────────────────────────
    {
        "kort": "a9555a7d", "pris": 1679,
        "name": "Massagebänk i trä, creme – bär 250 kg, bärväska ingår",
        "slug": "massagebank-bok-creme-barvaska",
        "title": "Massagebänk i trä, creme – 250 kg, bärväska | Fyndplats",
        "meta": ("Cremefärgad hopfällbar massagebänk med träställ och "
                 "bärväska. Bädd 185 × 60 cm, höjd 67–92 cm, 4 cm skum och "
                 "250 kg maxlast."),
        "ingress": (
            "<p>Familjens <strong>starkaste bänk</strong> — 250 kg mot de "
            "andras 130 till 225 — och den enda där en bärväska följer med i "
            "kartongen.</p>"
            "<p>Stommen är trä, klädseln 0,8 mm konstläder över 4 cm skum. "
            "Liggytan är 185 × 60 cm och höjden ställs mellan 67 och 92 cm, "
            "alltså högre än rundans övriga bänkar. Med armhyllorna ute är "
            "den 81 cm bred.</p>"
            "<p>Samma bänk finns " +
            lank("massagebank-bok-svart-barvaska", "i svart") +
            ". Vill du ha aluminium i stället för trä har vi " +
            lank("massagebank-vit-3-zoner-aluminium",
                 "en treszonsbänk i aluminium") + ".</p>"),
        "eg": [
            "Bär 250 kg — rundans högsta uppgift",
            "Bärväska ingår",
            "Stomme i trä",
            "0,8 mm konstläder över 4 cm skum",
            "Höjden ställs mellan 67 och 92 cm",
            "Liggyta 185 × 60 cm",
            "Fälls ihop till 91 × 60 × 16 cm",
        ],
        "spec": [
            "Totallängd med ansiktsstöd: 210 cm",
            "Liggyta (L × B): 185 × 60 cm",
            "Totalbredd med armhyllor: 81 cm",
            "Höjd: 67–92 cm",
            "Hopfälld (L × B × H): 91 × 60 × 16 cm",
            "Maxlast: 250 kg",
            "Vikt: 15,5 kg",
            "Paketmått: 93,5 × 18,5 × 62 cm",
            "Stomme: trä",
            "Klädsel: konstläder 0,8 mm över 4 cm skum",
            "Färg: creme",
            "Montering: krävs inte",
            "Ingår: massagebänk och bärväska",
        ],
        "villkor": maxlast(250),
        "skotsel": [PVC_SKOTSEL, FALL_SKOTSEL,
                    "Träställets sprintar ska sitta i samma hål på båda "
                    "benparen. Kontrollera dem varje gång bänken flyttats — "
                    "trä ger efter något mer än aluminium när det belastas "
                    "snett."],
        "faq": [
            ("Vilket träslag är stommen?",
             "Det står inte här med flit. Produkttexten och den maskinsatta "
             "spec-fliken anger olika material för just den här bänken, och "
             "vi skriver hellre ”stomme i trä” än ett träslag vi inte "
             "kan stå för."),
            ("Vad ingår i bärväskan?",
             "Väskan är till bänken själv. Den fälls till 91 × 60 × 16 cm och "
             "ryms i väskan tillsammans med ansiktsstödet."),
            ("Varför bär den mer än de andra?",
             "250 kg är den uppgift som följer med den här konstruktionen. "
             "Ingen provningsnorm anges för någon av bänkarna, så talen går "
             "att jämföra sinsemellan men inte mot en officiell mätning."),
            MONTERING_FAQ,
        ],
    },
    {
        "kort": "754a4749", "pris": 1599,
        "name": "Massagebänk i trä, svart – bär 250 kg, bärväska ingår",
        "slug": "massagebank-bok-svart-barvaska",
        "title": "Massagebänk i trä, svart – 250 kg, bärväska | Fyndplats",
        "meta": ("Svart hopfällbar massagebänk med träställ och bärväska i "
                 "kartongen. Bädd 185 × 60 cm, höjd 67–92 cm, 4 cm skum och "
                 "250 kg maxlast."),
        "ingress": (
            "<p>Den svarta av familjens två <strong>250-kilosbänkar</strong>, "
            "med bärväska i kartongen. Mörk klädsel tål olja och fläckar "
            "bättre — det är hela skillnaden mot syskonet, för mått, vikt och "
            "maxlast är desamma.</p>"
            "<p>Stommen är trä, klädseln 0,8 mm konstläder över 4 cm skum, och "
            "höjden ställs mellan 67 och 92 cm.</p>"
            "<p>Samma bänk finns " +
            lank("massagebank-bok-creme-barvaska", "i creme") +
            ". Vill du ha en bredare liggyta har vi " +
            lank("massagebank-70-cm-trastall", "en bänk med 70 cm bädd") +
            ".</p>"),
        "eg": [
            "Bär 250 kg — rundans högsta uppgift",
            "Bärväska ingår",
            "Stomme i trä",
            "0,8 mm konstläder över 4 cm skum",
            "Höjden ställs mellan 67 och 92 cm",
            "Mörk klädsel som tål olja och fläckar bättre",
            "Fälls ihop till 91 × 60 × 16 cm",
        ],
        "spec": [
            "Totallängd med ansiktsstöd: 210 cm",
            "Liggyta (L × B): 185 × 60 cm",
            "Totalbredd med armhyllor: 81 cm",
            "Höjd: 67–92 cm",
            "Hopfälld (L × B × H): 91 × 60 × 16 cm",
            "Maxlast: 250 kg",
            "Vikt: 15,5 kg",
            "Paketmått: 93 × 18,5 × 62 cm",
            "Stomme: trä",
            "Klädsel: konstläder 0,8 mm över 4 cm skum",
            "Färg: svart",
            "Montering: krävs inte",
            "Ingår: massagebänk och bärväska",
        ],
        "villkor": maxlast(250),
        "skotsel": [PVC_SKOTSEL, FALL_SKOTSEL,
                    "Träställets sprintar ska sitta i samma hål på båda "
                    "benparen. Kontrollera dem varje gång bänken flyttats — "
                    "trä ger efter något mer än aluminium när det belastas "
                    "snett."],
        "faq": [
            ("Vad är skillnaden mot den cremefärgade?",
             "Kulören. Liggyta, höjd, skumtjocklek, vikt och maxlast är "
             "desamma, och bärväskan ingår i båda."),
            ("Vilket träslag är stommen?",
             "Det står inte här med flit. Produkttexten och den maskinsatta "
             "spec-fliken anger olika material för den här bänken, och vi "
             "skriver hellre ”stomme i trä” än ett träslag vi inte kan "
             "stå för."),
            ("Hur högt går den?",
             "92 cm som högst och 67 cm som lägst — rundans högsta spann. "
             "Aluminiumbänkarna slutar lägre, till exempel "
             + lank("massagebank-vit-3-zoner-aluminium",
                    "treszonsbänken som går till 84 cm") + "."),
            MONTERING_FAQ,
        ],
    },
]

PRODUKTER += [
    # ── Två breda enskilda modeller ────────────────────────────────────────
    {
        "kort": "251f0429", "pris": 1629,
        "name": "Massagebänk 70 cm bred med träställ – 215 cm, bär 225 kg",
        "slug": "massagebank-70-cm-trastall",
        "title": "Massagebänk 70 cm bred med träställ – 225 kg | Fyndplats",
        "meta": ("Svart hopfällbar massagebänk med träställ och extra bred "
                 "liggyta på 70 cm. Totallängd 215 cm, höjd 61–86 cm och "
                 "225 kg maxlast."),
        "ingress": (
            "<p>Den <strong>bredaste liggytan</strong> i rundan tillsammans med "
            + lank("massagebank-armstod-handbrador", "modellen med armstöd")
            + ". Tio centimeter mer än rundans smalare bänkar låter lite och "
            "är det inte — det är skillnaden mellan att armarna får plats "
            "längs kroppen och att de hänger utanför.</p>"
            "<p>Liggytan är 185 × 70 cm och totallängden 215 cm med "
            "ansiktsstödet på. Höjden ställs mellan 61 och 86 cm, och stommen "
            "är trä.</p>"
            "<p>Behöver du inte bredden finns " +
            lank("massagebank-bok-svart-barvaska",
                 "en smalare träbänk som bär 250 kg") + ", och den lättaste i "
            "rundan är " + lank("massagebank-svart-2-zoner",
                                "tvåzonsmodellen på 13 kg") + ".</p>"),
        "eg": [
            "70 cm bred liggyta — rundans bredaste",
            "Stomme i trä",
            "Höjden ställs mellan 61 och 86 cm",
            "Ansiktsstöd 29 × 29 cm",
            "Fälls ihop till 91,5 × 70 × 17 cm",
            "Bär 225 kg",
        ],
        "spec": [
            "Totallängd med ansiktsstöd: 215 cm",
            "Liggyta (L × B): 185 × 70 cm",
            "Höjd: 61–86 cm",
            "Ansiktsstöd (L × B): 29 × 29 cm",
            "Hopfälld (L × B × H): 91,5 × 70 × 17 cm",
            "Maxlast: 225 kg",
            "Vikt: 15 kg",
            "Paketmått: 94,5 × 18,5 × 73,5 cm",
            "Stomme: trä",
            "Klädsel: konstläder över skum",
            "Färg: svart",
            "Montering: krävs inte",
            "Ingår: massagebänk och bruksanvisning",
        ],
        "villkor": maxlast(225),
        "skotsel": [PVC_SKOTSEL, FALL_SKOTSEL, FORVAR_SKOTSEL],
        "faq": [
            ("Hur mycket bredare är 70 cm i praktiken?",
             "Tio centimeter mer än rundans smalare bänkar, till exempel "
             + lank("massagebank-cremevit-2-zoner", "tvåzonsmodellen på 60 cm")
             + ". Det märks mest på armarna: på den smalare bädden hamnar de "
             "ofta utanför kanten, på 70 cm får de plats längs kroppen."),
            ("Tar den mer plats hopfälld?",
             "Ja. Hopfälld är den 91,5 × 70 × 17 cm mot de smalare bänkarnas "
             "91 × 60. Bredden följer med in i väskan."),
            ("Hur stort är ansiktsstödet?",
             "29 × 29 cm. Det sitter i änden av bänken och räknas in i "
             "totallängden 215 cm — utan det är liggytan 185 cm."),
            MONTERING_FAQ,
        ],
    },
    {
        "kort": "ed7a86fd", "pris": 1539,
        "name": "Massagebänk med armstöd och handbrädor – 70 cm bred, 130 kg",
        "slug": "massagebank-armstod-handbrador",
        "title": "Massagebänk med armstöd och handbrädor – 130 kg | Fyndplats",
        "meta": ("Svart hopfällbar massagebänk i aluminium med armstöd, "
                 "handbrädor och ansiktsöppning. Liggyta 185 × 70 cm, 9 cm "
                 "dyna och 130 kg maxlast."),
        "ingress": (
            "<p>Den enda i rundan med <strong>armstöd och två handbrädor</strong>, "
            "och den med <strong>tjockast dyna: 9 cm</strong> mot de andras 4. "
            "Handbrädorna på 40,5 × 20 cm ger armarna någonstans att vila när "
            "man ligger på mage.</p>"
            "<p>Och den bär minst i rundan: <strong>130 kg</strong>. Den "
            "skillnaden står här och inte längre ned, för den är det första "
            "man behöver veta om bänken.</p>"
            "<p>Behöver du högre maxlast finns " +
            lank("massagebank-bok-svart-barvaska", "en träbänk som bär 250 kg") +
            " och " + lank("massagebank-70-cm-trastall",
                           "en lika bred bänk som bär 225 kg") + ".</p>"),
        "eg": [
            "Armstöd och två handbrädor på 40,5 × 20 cm",
            "9 cm dyna — rundans tjockaste",
            "Ansiktsöppning med kudde 27 × 27 cm",
            "Ram i aluminium",
            "Höjden ställs i sju steg",
            "Liggyta 185 × 70 cm",
            "Bär 130 kg — lägst i rundan",
        ],
        "spec": [
            "Totalmått (L × B): 185 × 70 cm",
            "Höjdlägen: 7",
            "Dynans tjocklek: 9 cm",
            "Ansiktsstöd (L × B × H): 27 × 27 × 7 cm",
            "Armstöd: ja, fällbara",
            "Handbräda (L × B × H): 40,5 × 20 × 1,5 cm",
            "Hopfälld (L × B × H): 92,5 × 70 × 18 cm",
            "Maxlast: 130 kg",
            "Vikt: 16,5 kg",
            "Paketmått: 96 × 19 × 76 cm",
            "Stomme: aluminium",
            "Klädsel: PU över skum",
            "Färg: svart",
            "Montering: krävs inte",
            "Ingår: massagebänk och bruksanvisning",
        ],
        "villkor": maxlast(130),
        "skotsel": [PVC_SKOTSEL, FALL_SKOTSEL,
                    "Handbrädorna och armstödet fälls in innan bänken viks "
                    "ihop. Viks den med dem utfällda tar gångjärnen lasten "
                    "från fel håll."],
        "faq": [
            ("Varför bär den bara 130 kg?",
             "130 kg är den uppgift som följer med den här konstruktionen, "
             "och den är lägst i rundan. Behöver du mer finns "
             + lank("massagebank-bok-svart-barvaska", "en träbänk som anges för 250 kg")
             + " och " + lank("massagebank-70-cm-trastall",
                              "en lika bred bänk som anges för 225 kg") + "."),
            ("Vad är handbrädorna till för?",
             "De sitter vid ansiktsöppningen och ger armarna någonstans att "
             "vila när man ligger på mage. Var och en är 40,5 × 20 cm."),
            ("Är 9 cm dyna mycket?",
             "Det är rundans tjockaste. Tjockare dyna känns mjukare men gör "
             "också bänken tyngre att bära, och den här väger 16,5 kg."),
            ("Vilken höjd går den att ställa på?",
             "Sju steg — men de två uppgifter vi har om SPANNET säger olika "
             "saker, och vi skriver hellre inget tal än fel tal. Behöver du "
             "veta höjden på centimetern innan du köper har "
             + lank("massagebank-70-cm-trastall", "träställsbänken") +
             " ett spann båda källorna är eniga om."),
            MONTERING_FAQ,
        ],
    },
]

PRODUKTER += [
    # ── Två tvåzonsbänkar, rundans lättaste ────────────────────────────────
    {
        "kort": "2cfd373a", "pris": 1499,
        "name": "Massagebänk 2 zoner cremevit – 13 kg, höjd 61–87 cm",
        "slug": "massagebank-cremevit-2-zoner",
        "title": "Massagebänk 2 zoner cremevit – 13 kg, 61–87 cm | Fyndplats",
        "meta": ("Cremevit hopfällbar massagebänk i två zoner med träställ. "
                 "Bädd 186 × 60 cm, höjd 61–87 cm, väger 13 kg och "
                 "rekommenderad maxlast 150 kg."),
        "ingress": (
            "<p><strong>Rundans lättaste bänk: 13 kg.</strong> Ett par kilo "
            "under de andra bänkarna här, och skillnaden märks varje gång "
            "bänken ska upp för en trappa.</p>"
            "<p>Två zoner i stället för tre, träställ, och en liggyta på "
            "186 × 60 cm. Höjden ställs mellan 61 och 87 cm, alltså rundans "
            "högsta topp efter träbänkarna. Ansiktskudden är 17 × 12 cm och "
            "4 cm tjock.</p>"
            "<p>Samma bänk finns " + lank("massagebank-svart-2-zoner", "i svart") +
            ". Behöver du högre maxlast har vi " +
            lank("massagebank-bok-creme-barvaska", "en träbänk som bär 250 kg") +
            ", och för bredare liggyta " +
            lank("massagebank-70-cm-trastall", "en bänk på 70 cm") + ".</p>"),
        "eg": [
            "13 kg — rundans lättaste",
            "Två zoner, träställ",
            "Höjden ställs mellan 61 och 87 cm",
            "Liggyta 186 × 60 cm",
            "4 cm skum under klädseln",
            "Ansiktskudde 17 × 12 cm",
            "Fälls ihop till 93 × 60 × 17 cm",
        ],
        "spec": [
            "Totalmått (L × B × H): 186 × 60 × 61–87 cm",
            "Hopfälld (L × B × H): 93 × 60 × 17 cm",
            "Skummets tjocklek: 4 cm",
            "Ansiktskudde (L × B): 17 × 12 cm, 4 cm tjock",
            "Rekommenderad maxlast: 150 kg",
            "Vikt: 13 kg",
            "Paketmått: 95 × 19 × 62,5 cm",
            "Stomme: trä",
            "Klädsel: PVC över skum",
            "Färg: cremevit",
            "Antal zoner: 2",
            "Montering: krävs inte",
            "Ingår: massagebänk och bruksanvisning",
        ],
        "villkor": maxlast(150, rekommenderad=True),
        "skotsel": [PVC_SKOTSEL, FALL_SKOTSEL, FORVAR_SKOTSEL],
        "faq": [
            ("Varför står det ”rekommenderad” maxlast?",
             "För att det är ordet som står i underlaget för just den här "
             "bänken. På de flesta andra bänkar i rundan står talet som "
             "maxlast rakt av, och vi behåller skillnaden i stället för att "
             "jämna ut den."),
            ("Vad skiljer två zoner från tre?",
             "En tvåzonsbänk viks på mitten och ligger plant. En treszonsbänk "
             "har en ryggdel som går att fälla upp, så den kan användas "
             "halvsittande."),
            ("Hur mycket lättare är 13 kg?",
             "Rundans övriga bänkar väger mer, till exempel "
             + lank("massagebank-vit-3-zoner-aluminium",
                    "treszonsbänken på 17,5 kg") + ". Ett par kilo mindre att "
             "bära är mest märkbart i trappor och kollektivtrafik."),
            MONTERING_FAQ,
        ],
    },
    {
        "kort": "d7eca2ba", "pris": 1449,
        "name": "Massagebänk 2 zoner svart – 186 × 60 cm bädd, 13 kg",
        "slug": "massagebank-svart-2-zoner",
        "title": "Massagebänk 2 zoner svart – 186 × 60 cm, 13 kg | Fyndplats",
        "meta": ("Svart hopfällbar massagebänk i två zoner med träställ. "
                 "Bädd 186 × 60 cm, väger 13 kg och rekommenderad maxlast "
                 "150 kg. Rundans lägsta pris."),
        "ingress": (
            "<p>Rundans <strong>lägsta pris</strong> och delad lättast med "
            "syskonet: 13 kg. Två zoner, träställ och en liggyta på "
            "186 × 60 cm.</p>"
            "<p>Ansiktsöppning i bäddens ena ände, 4 cm skum under klädseln "
            "och rekommenderad maxlast 150 kg.</p>"
            "<p>Samma bänk finns " +
            lank("massagebank-cremevit-2-zoner", "i cremevitt") +
            " — och där stämmer höjduppgiften mot måttritningen, vilket den "
            "inte gör här. Behöver du högre maxlast har vi " +
            lank("massagebank-bok-svart-barvaska", "en träbänk som bär 250 kg") +
            ".</p>"),
        "eg": [
            "13 kg — delad lättast i rundan",
            "Två zoner, träställ",
            "Liggyta 186 × 60 cm",
            "4 cm skum under klädseln",
            "Ansiktsöppning i bäddens ena ände",
            "Mörk klädsel som tål olja och fläckar bättre",
        ],
        # ☠️ INGEN höjdrad och ingen hopfälld tjocklek — se filens docstring.
        "spec": [
            "Liggyta (L × B): 186 × 60 cm",
            "Hopfälld (L × B): 93 × 60 cm",
            "Skummets tjocklek: 4 cm",
            "Rekommenderad maxlast: 150 kg",
            "Vikt: 13 kg",
            "Paketmått: 95 × 19 × 62,5 cm",
            "Stomme: trä",
            "Klädsel: PVC över skum",
            "Färg: svart",
            "Antal zoner: 2",
            "Montering: krävs inte",
            "Ingår: massagebänk och bruksanvisning",
        ],
        "villkor": maxlast(150, rekommenderad=True),
        "skotsel": [PVC_SKOTSEL, FALL_SKOTSEL, FORVAR_SKOTSEL],
        "faq": [
            ("Hur högt går bänken?",
             "Det talet står inte här med flit. Underlaget för just den här "
             "kulören anger två olika höjdspann — produkttexten säger ett och "
             "måttritningen ett annat — och vi skriver hellre inget mått än "
             "ett vi inte kan stå för. Behöver du veta höjden exakt är "
             + lank("massagebank-cremevit-2-zoner",
                    "den cremevita systerbänken entydig: 61–87 cm") + "."),
            ("Varför står det ”rekommenderad” maxlast?",
             "Det är ordet som står i underlaget för den här modellen. På de "
             "flesta andra bänkar i rundan står talet som maxlast rakt av, och "
             "vi behåller skillnaden i stället för att jämna ut den."),
            ("Vad skiljer den från den cremevita?",
             "Kulören, priset och att höjduppgiften är entydig på den "
             "cremevita men inte här. Liggyta, vikt, skumtjocklek och "
             "rekommenderad maxlast är desamma."),
            MONTERING_FAQ,
        ],
    },
]
