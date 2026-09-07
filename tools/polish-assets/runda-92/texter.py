# -*- coding: utf-8 -*-
"""Runda 92 — sparkcykelfamiljens sista Tretroller-utkast.

☠️ TEXTEN SKRIVS I FIL, ALDRIG INLINE. Batch 64 mätte skillnaden: fem
   produkter skrivna direkt i API-anropet gav NIO fel som nådde Wix, tre
   skrivna via fil och grep-grind gav noll.

☠️ DEN HÄR SIDAN ÄR FÄRGSYSKON TILL EN PUBLICERAD. `4080448d` (rosa) är
   samma modell in i minsta mått — 135 × 58 × 92–100, 16"/12", 9,8 kg,
   fotplatta 36 × 12 cm, 11 cm över marken, paketmått 98 × 16 × 52. Texten
   ska därför INTE motsäga syskonets, och båda ska korslänka.

☠️ MÅTTEN FÅR INTE LÅNAS FRÅN 143 CM-MODELLERNA. Katalogen har två
   publicerade svarta/rosa 16-tumssidor på 143 cm med lika stora hjul och
   10,6 kg. Den här är 135 cm, har ett MINDRE bakhjul och väger 9,8 kg.
   Att blanda ihop dem är rundans naturligaste fel.

☠️ "ROSTFRI" FÅR INTE SKRIVAS. Källan säger bara `Material: Stahl, Gummi`.

☠️ "SÄKER" FÅR INTE SKRIVAS SOM EGENSKAP. Källan lovar "Hochwertige und
   sichere Scooter" och ingen standard nämns någonstans (uppgift #252).

☠️ ARTIKELNUMRET FÅR ALDRIG SKRIVAS, under någon etikett.

☠️ FORDONSKLASSEN. En vanlig sparkcykel är ett LEKFORDON, och
   trafikförordningen 1 kap 4 § gör föraren till GÅENDE. Hjälm skrivs som en
   rekommendation, ALDRIG som lag. ORDET "ELSPARKCYKEL" FÅR INTE FÖREKOMMA.

⚠️ HJULMÅTTET SKRIVS SOM SYSKONET SKRIVER DET. Källan säger `16" (ca. 41 cm)`,
   syskonsidan säger "drygt 40 cm". 16 tum är 40,64 cm — samma tal, två
   avrundningar. Talet 41 är alltså FÖRBJUDET här: två sidor för samma hjul
   får inte ange olika mått.

⚠️ RANDBANDET ÄR GULD OCH VITT — mätt i 3× zoom på ritningen, guld/vitt/guld
   på svart ram. Samma band som runda 91:s modell E. Ingen svart rand finns
   (den syns inte mot en svart ram, och den finns inte).
"""

BAS = "https://www.fyndplats.se/produkt/"

# Publicerade syskon som texten länkar till — kontrollerade i katalogsvepet.
SYSKON_ROSA = "sparkcykel-barn-rosa-16-tum-luftdack"
SYSKON_143 = "sparkcykel-barn-143-cm-16-tum-svart"


def lank(slug, text):
    return '<a href="%s%s">%s</a>' % (BAS, slug, text)


def bygg(ingress, egenskaper, spec, syskon, skotsel, faq):
    d = ["<p>%s</p>" % ingress]
    d.append("<p><strong>Egenskaper</strong></p><ul>")
    d += ["<li>%s</li>" % e for e in egenskaper]
    d.append("</ul>")
    d.append("<h2>Tekniska specifikationer</h2><ul>")
    d += ["<li><strong>%s:</strong> %s</li>" % (k, v) for k, v in spec]
    d.append("</ul>")
    d.append("<h2>Samma modell och närmaste släkting</h2><p>%s</p>" % syskon)
    d.append("<h2>Användning och skötsel</h2>")
    d += ["<p>%s</p>" % s for s in skotsel]
    d.append("<h2>Vanliga frågor</h2>")
    for f, s in faq:
        d.append("<p><strong>%s</strong></p><p>%s</p>" % (f, s))
    return "".join(d)


EGENSKAPER = [
    "Luftdäck på ekerfälg i silver: 16 tum fram, drygt 40 cm, och 12 tum bak",
    "V-broms på både fram- och bakhjulet, båda med handtag på styret",
    "Styret ställs mellan 92 och 100 cm och följer med när barnet växer",
    "Stödben under ramen, så att den parkeras stående i stället för att läggas ner",
    "Halkmönstrad fotplatta, 36 × 12 cm och 11 cm över marken",
    "Stålram med kromat styre, byggd för upp till 100 kg",
    "Väger 9,8 kg",
]

SPEC = [
    ("Mått", "135 × 58 × 92–100 cm (L × B × styrhöjd)"),
    ("Hjul", "16 tum fram och 12 tum bak, luftdäck på ekerfälg i silver"),
    ("Bromsar", "V-broms fram och bak, manövrerade från styret"),
    ("Fotplatta", "36 × 12 cm, 11 cm över marken"),
    ("Styrhöjd", "92–100 cm, justerbar"),
    ("Ram", "stål, kromat styre"),
    ("Maxlast", "100 kg"),
    ("Rekommenderad ålder", "från 5 år"),
    ("Vikt", "9,8 kg"),
    ("Paketmått", "98 × 16 × 52 cm"),
    ("Färg", "svart ram med randband i guld och vitt"),
    ("Montering", "krävs, och ska göras av en vuxen"),
]

SKOTSEL = [
    "Däcken är luftfyllda och ska hållas hårda. Ett mjukt däck rullar trögt, "
    "styr vagt och riskerar att gå av fälgen i en sväng, så känn efter med "
    "tummen med jämna mellanrum och pumpa med en vanlig cykelpump.",
    "Kläm på båda bromshandtagen före första turen och sedan då och då. "
    "Vajrar töjer sig de första veckorna, och den vajer som töjt sig märks "
    "först när bromsen behövs — justera med skruven vid handtaget.",
    "Dra åt skruvarna i styrstammen och på fotplattan efter första veckans "
    "åkande och sedan någon gång per säsong. Det är vibrationerna från "
    "underlaget som lossar dem, inte slarv vid monteringen.",
    "Torka av ramen efter regn och olja vajrarna någon gång per säsong. "
    "Stål rostar där lacken slagits av, och den skadan kommer oftast vid "
    "stödbenet. Ställ den inomhus över vintern.",
    "Hjälm och skydd för knän, armbågar och handleder är ett gott råd på "
    "varje tur, och särskilt de första månaderna när barnet lär sig bromsa. "
    "På vått underlag tar bromsarna längre tid på sig.",
]

FAQ = [
    ("Vad är en V-broms?",
     "Det är samma bromstyp som sitter på de flesta cyklar: två armar som "
     "klämmer på fälgen när du drar i handtaget. Här finns en på varje hjul, "
     "och båda sköts med handtag på styret — det är alltså ingen fotbroms att "
     "trampa på över bakhjulet."),
    ("Varför är hjulen olika stora?",
     "Framhjulet på 16 tum rullar över kanter och gropar som ett litet hjul "
     "hakar upp sig i. Bakhjulet är 12 tum, och det är just därför fotplattan "
     "kan ligga så lågt som 11 cm över marken. Låg fot betyder kortare "
     "sparktag och mindre jobb för benet."),
    ("Från vilken ålder passar den?",
     "Den är byggd från 5 år, men mät mot barnet i stället för mot åldern. "
     "Styret går inte lägre än 92 cm, så barnet ska nå det med lätt böjda "
     "armar när det står på fotplattan."),
    ("Behöver däcken pumpas?",
     "Ja. Det är riktiga luftdäck på ekerfälg, precis som på en cykel, och de "
     "tappar tryck av att stå still. Kontrollera trycket inför säsongen och "
     "någon gång under den."),
    ("Måste den monteras?",
     "Ja, och en vuxen ska göra det. Styre och framhjul sätts på och dras åt, "
     "och bromsarna justeras. Åk inte förrän allt sitter fast."),
]


def syskontext():
    return ("Samma sparkcykel finns i " +
            lank(SYSKON_ROSA, "rosa") + ". Vill ni ha en större modell med två "
            "lika stora 16-tumshjul finns " +
            lank(SYSKON_143, "143 cm-versionen i svart") + " — den är åtta "
            "centimeter längre, väger 10,6 kg och har samma styrhöjd.")


P = {}

P["ea013fde"] = dict(
    id="ea013fde-ff23-4cad-8d8b-192221007be1",
    variantId="dddbfd48-673b-49a9-b2d7-d2fd32056bda",
    namn="Sparkcykel barn 135 cm, svart – 16 tum fram och 12 tum bak",
    slug="sparkcykel-barn-135-cm-16-tum-svart",
    titel="Sparkcykel barn 135 cm, svart – 16 tum och V-bromsar",
    meta="Svart sparkcykel 135 cm med luftdäck 16 tum fram och 12 tum bak, "
         "V-broms på båda hjulen och styre 92–100 cm. Maxlast 100 kg, 9,8 kg.",
    sokord=["sparkcykel barn", "sparkcykel barn 16 tum", "sparkcykel svart"],
    sku="FP-sparkcykel-135-cm-svart",
    ingress=(
        "En sparkcykel för barn som har vuxit ur de små hjulen. Framhjulet är "
        "16 tum, drygt 40 cm, och bakhjulet 12 tum — båda med luftdäck på "
        "ekerfälg i silver. Styret ställs mellan 92 och 100 cm, det sitter "
        "V-broms på båda hjulen, och ramen är svart med ett randband i guld "
        "och vitt."),
    spec=SPEC,
)


# ☠️ KORTRUBRIKEN BOR HÄR och lintas — inte i kort.py. Runda 91 flyttade hit
# den efter att både runda 90 och 91 skrivit fel färg i just en kortrubrik.
KORT = {
    "ea013fde": ("Sparkcykel barn, 135 cm",
                 "Svart ram, 16 tum fram och 12 tum bak"),
}


def html(pid):
    p = P[pid]
    return bygg(p["ingress"], EGENSKAPER, p["spec"], syskontext(), SKOTSEL, FAQ)


if __name__ == "__main__":
    for pid, p in P.items():
        h = html(pid)
        print("%-9s namn %d  titel %d  meta %d  sku %d  html %d"
              % (pid, len(p["namn"]), len(p["titel"]), len(p["meta"]),
                 len(p["sku"]), len(h)))
        assert p["titel"] != p["namn"], "titel får inte vara samma som namnet"
