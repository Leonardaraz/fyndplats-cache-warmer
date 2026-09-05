# -*- coding: utf-8 -*-
"""Runda 62 — åtta knästolar. Texten skrivs HÄR, inte inline i API-anropet.

Batch 64 mätte skillnaden: fem produkter skrivna inline gav nio fel som nådde
Wix, tre skrivna via fil gav noll. En sträng i ett JSON-anrop kan inte grep:as
innan den lämnar chatten, och API-svaret ekar tillbaka exakt det man skrev.

Alla siffror kommer ur leverantörens Technische Daten eller ur måttritningen
(bild 3). Ingenting är påhittat, och ingenting av leverantörens hälsopåståenden
har följt med — se LAGE.md, Steg 2.
"""

# Gemensamt för modell D — gungande knästol.
# Måtten är den TYSKA axelmärkningen (55B x 85T x 55H), bekräftad på
# måttritningen. Spec-tabellens "55L x 85B x 55H" kallar djupet för bredd.
D = {
    "matt": "55 × 85 × 55 cm",
    "sits": "41 × 28 cm",
    "sitthojd": "54 cm",
    "knadyna": "48 × 24 cm",
    "knahojd": "33 cm",
    "dyna": "7,5 cm",
    "skrivbord": "75–90 cm",
    "maxlast": "120 kg",
    "vikt": "8,5 kg",
    "paket": "86,5 × 50 × 13 cm",
}

# Gemensamt för modell G — knästol i björk.
G = {
    "matt": "51 × 69 × 58 cm",
    "sits": "39 × 30 cm",
    "sitthojd": "51–58 cm",
    "knadyna": "13 × 25,5 cm",
    "dyna": "10 cm",
    "maxlast": "120 kg",
    "paket": "51 × 75 × 11 cm",
}

VANJ = ("Knästolen aktiverar andra muskler än en vanlig stol. Leverantörens råd "
        "är att vänja sig stegvis och resa på sig var 15–30:e minut i början.")

# Korshänvisning till den enda publicerade knästolen. ABSOLUT adress — en
# relativ blir https:/produkt/… med ETT snedstreck och är död.
RYGG = ('<a href="https://www.fyndplats.se/produkt/knastol-ryggstod-manchester">'
        'knästol med ryggstöd</a>')


def spec_d(farg, vikt):
    return (
        "<h2>Tekniska specifikationer</h2>"
        "<ul>"
        "<li>Mått (B × D × H): %s</li>"
        "<li>Sittyta: %s, sitthöjd %s</li>"
        "<li>Knädyna: %s, %s över golvet</li>"
        "<li>Dynstjocklek: %s</li>"
        "<li>Passar skrivbordshöjd: %s</li>"
        "<li>Maxlast: %s</li>"
        "<li>Färg: %s</li>"
        "<li>Stomme: formpressad plywood i ljust trä</li>"
        "<li>Klädsel: linnelook, 100 %% polyester, över skumstoppning</li>"
        "<li>Vikt: %s</li>"
        "<li>Paketmått: %s</li>"
        "</ul>"
    ) % (D["matt"], D["sits"], D["sitthojd"], D["knadyna"], D["knahojd"],
         D["dyna"], D["skrivbord"], D["maxlast"], farg, vikt, D["paket"])


def spec_g(farg, vikt):
    return (
        "<h2>Tekniska specifikationer</h2>"
        "<ul>"
        "<li>Mått (B × D × H): %s</li>"
        "<li>Sittyta: %s</li>"
        "<li>Sitthöjd: %s</li>"
        "<li>Knädyna: %s</li>"
        "<li>Dynstjocklek: %s på både sits och knädynor</li>"
        "<li>Maxlast: %s</li>"
        "<li>Färg: %s</li>"
        "<li>Stomme: björkplywood</li>"
        "<li>Klädsel: polyester över skumstoppning</li>"
        "<li>Vikt: %s</li>"
        "<li>Paketmått: %s</li>"
        "</ul>"
    ) % (G["matt"], G["sits"], G["sitthojd"], G["knadyna"], G["dyna"],
         G["maxlast"], farg, vikt, G["paket"])


SKOTSEL_D = (
    "<h2>Användning och skötsel</h2>"
    "<p>Ställ knästolen framför skrivbordet, sätt dig på sitsen och låt "
    "smalbenen vila mot den breda knädynan. Vikten fördelas då mellan sits och "
    "smalben i stället för att ligga helt på svanken, och vinkeln mellan lår "
    "och rygg öppnas. Medarna är böjda, så stolen vaggar med när du flyttar "
    "tyngdpunkten.</p>"
    "<p>%s</p>"
    "<p>Klädseln borstas av eller torkas med en lätt fuktad trasa och mild "
    "tvållösning. Låt torka innan du sätter dig igen. Träramen torkas torr och "
    "tål inte att stå blött. Dra åt skruvarna efter de första veckornas "
    "användning och därefter någon gång per år.</p>"
) % VANJ

SKOTSEL_G = (
    "<h2>Användning och skötsel</h2>"
    "<p>Sitsen lutar framåt och de två knädynorna tar upp smalbenen, så "
    "tyngden delas mellan sittbenen och underbenen i stället för att samlas i "
    "svanken. Dynorna är %s tjocka på båda ställena, vilket märks tydligast på "
    "knädynorna där benen vilar mot träet.</p>"
    "<p>%s</p>"
    "<p>Klädseln borstas av eller torkas med en lätt fuktad trasa och mild "
    "tvållösning. Björkramen torkas torr. Stolen levereras omonterad och sätts "
    "ihop med den bifogade nyckeln; dra åt skruvarna igen efter någon vecka.</p>"
) % (G["dyna"], VANJ)


def faq(gemensam, extra):
    rader = ["<h2>Vanliga frågor</h2>"]
    for f, s in gemensam + extra:
        rader.append("<p><strong>%s</strong></p><p>%s</p>" % (f, s))
    return "".join(rader)


FAQ_D = [
    ("Kan jag använda den som kontorsstol hela arbetsdagen?",
     "Nej. Knästolen har inget ryggstöd och är tänkt som omväxling i pass, inte "
     "som enda stol vid ett heldagsarbete. Leverantören anger själv 15–30 "
     "minuter i taget som utgångspunkt. Vill du ha ryggstöd finns en " + RYGG +
     " i samma stil."),
    ("Vilken skrivbordshöjd passar den till?",
     "Sitsen ligger på %s och stolen är avsedd för skrivbord mellan %s. Har du "
     "ett höj- och sänkbart bord ställer du in det i den nedre delen av "
     "intervallet." % (D["sitthojd"], D["skrivbord"])),
    ("Hur mycket tål den?",
     "Maxlasten är %s." % D["maxlast"]),
    ("Vaggar den hela tiden?",
     "Medarna är böjda, så stolen följer med när du flyttar tyngdpunkten. Den "
     "står stilla när du sitter still."),
    ("Behöver den monteras?",
     "Ja, stolen levereras platt i ett paket på %s och skruvas ihop. "
     "Bruksanvisning ingår." % D["paket"]),
]

FAQ_G = [
    ("Kan jag använda den som kontorsstol hela arbetsdagen?",
     "Nej. Knästolen har inget ryggstöd och är tänkt som omväxling i pass, inte "
     "som enda stol vid ett heldagsarbete. Leverantören anger själv 15–30 "
     "minuter i taget som utgångspunkt. Vill du ha ryggstöd finns en " + RYGG +
     " i samma stil."),
    ("Hur tjocka är dynorna?",
     "%s på sitsen och %s på knädynorna. Det är den tjockleken som gör att "
     "smalbenen inte känner träet under." % (G["dyna"], G["dyna"])),
    ("Hur mycket tål den?",
     "Maxlasten är %s." % G["maxlast"]),
    ("Hur stor plats tar den?",
     "%s. Den är smalare än en kontorsstol och saknar hjulkryss, så den tar "
     "mindre golvyta i ett trångt arbetshörn." % G["matt"]),
    ("Behöver den monteras?",
     "Ja, stolen levereras platt i ett paket på %s och skruvas ihop. "
     "Bruksanvisning ingår." % G["paket"]),
]


def egenskaper(rader):
    return ("<p><strong>Egenskaper</strong></p><ul>"
            + "".join("<li>%s</li>" % r for r in rader) + "</ul>")


# ---------------------------------------------------------------- modell D ---
_D_EG = [
    "Böjda medar — stolen vaggar med när du flyttar tyngdpunkten",
    "Framåtlutande sits på %s, knädyna %s bred" % (D["sitthojd"], "48 cm"),
    "Dynor på %s under klädsel i linnelook" % D["dyna"],
    "Stomme av formpressad plywood i ljust trä",
    "Maxlast %s, egen vikt %s" % (D["maxlast"], D["vikt"]),
]

# ---------------------------------------------------------------- modell G ---
_G_EG = [
    "Framåtlutande sits som delar tyngden mellan sittben och smalben",
    "Två separata knädynor, %s" % G["knadyna"],
    "%s dynor på både sits och knädynor" % G["dyna"],
    "Stomme av björkplywood",
    "Maxlast %s, %s bred" % (G["maxlast"], "51 cm"),
]


PRODUKTER = [
    # ---- modell D: gungande knästol -----------------------------------------
    {
        "kort": "67bd3628",
        "id": "67bd3628-2264-4c56-a4d0-36df40759c66",
        "modell": "D",
        "farg": "Ljusgrå",
        "vikt": "8,5 kg",
        "name": "Gungande knästol ljusgrå – vaggar på böjda medar, 120 kg",
        "slug": "gungande-knastol-ljusgra",
        "title": "Gungande knästol i ljusgrått | Fyndplats",
        "sokord": "gungande knästol",
        "meta": ("Knästol med böjda medar som vaggar med rörelsen. Sits på 54 cm, "
                 "knädyna 48 cm, maxlast 120 kg. Ljusgrå linnelook på ljus plywood."),
        "ingress": ("<p>Den här knästolen står på böjda medar i stället för ben, så "
                    "den följer med när du flyttar tyngdpunkten i stället för att "
                    "låsa dig i ett läge. Sitsen lutar framåt och smalbenen vilar "
                    "mot den breda knädynan, vilket öppnar vinkeln mellan lår och "
                    "rygg. Den ljusgrå linnelooken är tillräckligt neutral för att "
                    "smälta in i ett hemmakontor som redan har en färg för mycket.</p>"),
    },
    {
        "kort": "b97ac1d8",
        "id": "b97ac1d8-072c-45a2-87bc-ec9a3b2b5dec",
        "modell": "D",
        "farg": "Grå",
        "vikt": "8,5 kg",
        "name": "Gungande knästol grå – bred knädyna 48 cm för smalbenen",
        "slug": "gungande-knastol-gra",
        "title": "Gungande knästol i grått | Fyndplats",
        "sokord": "gungande knästol",
        "meta": ("Knästol i grått med 48 cm bred knädyna och 7,5 cm stoppning. "
                 "Vaggar på böjda medar, passar skrivbord 75–90 cm. Maxlast 120 kg."),
        "ingress": ("<p>Knädynan är 48 cm bred och går tvärs över hela stolen, så "
                    "smalbenen får plats sida vid sida i stället för att pressas "
                    "ihop. Ovanför ligger en framåtlutande sits på 54 cm, och "
                    "under alltihop böjda medar som gör att stolen vaggar med "
                    "rörelsen. Den mellangrå klädseln är den av de tre färgerna "
                    "som syns minst på ett hemmakontor med mörkt golv.</p>"),
    },
    {
        "kort": "b5d8eb9c",
        "id": "b5d8eb9c-1cb9-4259-841a-71503e09111f",
        "modell": "D",
        "farg": "Kräm",
        "vikt": "8,5 kg",
        "name": "Gungande knästol i kräm – 7,5 cm dynor, ljus plywoodram",
        "slug": "gungande-knastol-kram",
        "title": "Gungande knästol i krämvitt | Fyndplats",
        "sokord": "gungande knästol",
        "meta": ("Knästol i kräm med 7,5 cm dynor och ram i ljus formpressad "
                 "plywood. Böjda medar, sits 54 cm, knädyna 48 cm, maxlast 120 kg."),
        "ingress": ("<p>Dynorna är 7,5 cm tjocka på både sits och knädyna, och det "
                    "är det måttet som avgör om en knästol går att sitta på längre "
                    "än en kvart. Ramen är formpressad plywood i ljust trä, och "
                    "med krämfärgad klädsel blir stolen den ljusaste av de tre — "
                    "den syns, men tar inte över ett rum som redan är mörkt.</p>"),
    },
    # ---- modell G: knästol i björk -------------------------------------------
    {
        "kort": "6d64de9b",
        "id": "6d64de9b-0933-4dde-9137-3b6b66b46465",
        "modell": "G",
        "farg": "Kräm",
        "vikt": "7,68 kg",
        "name": "Knästol björk kräm – 10 cm dynor på sits och knädynor",
        "slug": "knastol-bjork-kram",
        "title": "Knästol i björk, krämvit | Fyndplats",
        "sokord": "knästol björk",
        "meta": ("Knästol i björk med 10 cm tjocka dynor på både sits och knädynor. "
                 "Framåtlutande sits, sittyta 39 × 30 cm, maxlast 120 kg."),
        "ingress": ("<p>Tio centimeter stoppning på både sitsen och de två "
                    "knädynorna är ovanligt mycket för en knästol, och det märks "
                    "framför allt på knädynorna — det är där en tunn stol låter "
                    "träet gå igenom efter en kvart. Stommen är björkplywood och "
                    "klädseln krämfärgad, så stolen blir ljus rakt igenom.</p>"),
    },
    {
        "kort": "9d626528",
        "id": "9d626528-c897-4512-a54a-942691cc4f17",
        "modell": "G",
        "farg": "Mörkgrå",
        "vikt": "7,68 kg",
        "name": "Knästol björk mörkgrå – framåtlutande sits, 120 kg maxlast",
        "slug": "knastol-bjork-morkgra",
        "title": "Knästol i björk, mörkgrå | Fyndplats",
        "sokord": "knästol björk",
        "meta": ("Mörkgrå knästol i björk med framåtlutande sits och två knädynor. "
                 "10 cm stoppning, sittyta 39 × 30 cm, maxlast 120 kg."),
        "ingress": ("<p>Sitsen lutar framåt och de två knädynorna tar upp "
                    "smalbenen, så tyngden delas i stället för att samlas i "
                    "svanken. Stolen tål 120 kg och väger själv under åtta kilo, "
                    "vilket gör den lätt att flytta undan när skrivbordet ska "
                    "användas på vanligt sätt. Den mörkgrå klädseln är den "
                    "mörkaste av de ljusa tonerna i serien.</p>"),
    },
    {
        "kort": "c3e0af3f",
        "id": "c3e0af3f-5aa9-45ce-879e-0357cb4188fc",
        "modell": "G",
        "farg": "Blå",
        "vikt": "7,68 kg",
        "name": "Knästol björk blå – 51 cm bred, smalare än en kontorsstol",
        "slug": "knastol-bjork-bla",
        "title": "Knästol i björk, blå | Fyndplats",
        "sokord": "knästol björk",
        "meta": ("Blå knästol i björk, 51 × 69 cm. Smalare än en kontorsstol och "
                 "utan hjulkryss. 10 cm dynor, två knädynor, maxlast 120 kg."),
        "ingress": ("<p>Stolen är 51 cm bred och 69 cm djup — smalare än en "
                    "kontorsstol och utan hjulkryss som sticker ut åt sidorna, "
                    "vilket gör skillnad i ett arbetshörn där bordet redan står "
                    "tätt mot väggen. Den blå klädseln är seriens enda med "
                    "kulör; de övriga är gråskala och kräm.</p>"),
    },
    {
        "kort": "05cc1f9c",
        "id": "05cc1f9c-5f90-4e7c-b307-fa8c36958c08",
        "modell": "G",
        "farg": "Svart",
        "vikt": "7,7 kg",
        "name": "Knästol björk svart – två knädynor, sittyta 39 × 30 cm",
        "slug": "knastol-bjork-svart",
        "title": "Knästol i björk, svart | Fyndplats",
        "sokord": "knästol björk",
        "meta": ("Svart knästol i björk med två separata knädynor och sittyta "
                 "39 × 30 cm. 10 cm stoppning, framåtlutande sits, maxlast 120 kg."),
        "ingress": ("<p>Knädynorna är två separata kuddar i stället för en genomgående "
                    "list, så benen står i sin naturliga bredd och inte pressade mot "
                    "varandra. Sittytan mäter 39 × 30 cm och lutar framåt. Klädseln "
                    "är seriens mörkaste mot den ljusa "
                    "björkstommen.</p>"),
    },
    {
        "kort": "9e656e81",
        "id": "9e656e81-7cbc-4470-8c30-448f84fc7db5",
        "modell": "G",
        "farg": "Ljusgrå",
        "vikt": "7,7 kg",
        "name": "Knästol björk ljusgrå – 7,7 kg, lätt att flytta undan",
        "slug": "knastol-bjork-ljusgra",
        "title": "Knästol i björk, ljusgrå | Fyndplats",
        "sokord": "knästol björk",
        "meta": ("Ljusgrå knästol i björk som väger 7,7 kg och går att lyfta med "
                 "en hand. 10 cm dynor, sittyta 39 × 30 cm, maxlast 120 kg."),
        "ingress": ("<p>Stolen väger 7,7 kg och går att lyfta undan med en hand när "
                    "arbetsplatsen ska bli matbord igen — en knästol används oftast "
                    "i pass, inte hela dagen, och då spelar det roll att den inte "
                    "behöver stå framme. Den ljusgrå klädseln mot björkstommen "
                    "håller uttrycket ljust.</p>"),
    },
]


def bygg(p):
    """Sätter ihop hela plainDescription för en produkt."""
    if p["modell"] == "D":
        return (p["ingress"] + egenskaper(_D_EG) + spec_d(p["farg"], p["vikt"])
                + SKOTSEL_D + faq(FAQ_D, []))
    return (p["ingress"] + egenskaper(_G_EG) + spec_g(p["farg"], p["vikt"])
            + SKOTSEL_G + faq(FAQ_G, []))


if __name__ == "__main__":
    import re
    for p in PRODUKTER:
        h = bygg(p)
        synlig = re.sub(r"<[^>]+>", " ", h)
        synlig = re.sub(r"\s+", " ", synlig).strip()
        print("%s  namn %2d  titel %2d  meta %3d  html %4d  synlig %4d  %s"
              % (p["kort"], len(p["name"]), len(p["title"]), len(p["meta"]),
                 len(h), len(synlig), p["slug"]))
