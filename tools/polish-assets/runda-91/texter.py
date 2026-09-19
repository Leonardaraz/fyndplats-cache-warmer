# -*- coding: utf-8 -*-
"""Runda 91 — modell E i fyra färger.

☠️ TEXTEN SKRIVS I FIL, ALDRIG INLINE. Batch 64 mätte skillnaden: fem
   produkter skrivna direkt i API-anropet gav NIO fel som nådde Wix, tre
   skrivna via fil och grep-grind gav noll.

☠️ ORDET FOTBOLL FÅR INTE FÖREKOMMA. Tre av fyra källtexter lovar
   "Gummiräder im Fußballdesign". Runda 89 fällde exakt samma påstående på
   modell F, och zoomen här visar samma sak: ett vanligt grovmönstrat
   offroad-däck.

☠️ "ROSTFRI" FÅR INTE SKRIVAS. Källan säger "rostbeständige
   Pulverbeschichtung" — pulverlackering, inte rostfritt stål. Beläggningen
   är ett faktum och skrivs; korrosionslöftet är marknadsföring och skrivs
   inte.

☠️ MODELL E HAR LUFTDÄCK. "Aufblasbare Reifen" på alla fyra. Ordet
   "punkteringsfri" och varje släkting till det är därför FÖRBJUDET här —
   samma per-produkt-grind som runda 90 byggde, och den pekar åt andra hållet
   för den här familjen.

☠️ MÅTTEN FÅR INTE LÅNAS. Publicerad modell D är 120 × 58 med styrhöjd
   75–80; den här är 120 × 58 med styrhöjd 85–95. Längden och bredden är
   IDENTISKA och styrhöjden är hela skillnaden — att blanda ihop dem är
   rundans naturligaste fel.

☠️ ARTIKELNUMRET FÅR ALDRIG SKRIVAS, under någon etikett.

☠️ INGEN STANDARD FÅR NÄMNAS. Källan anger ingen för någon av de fyra.

☠️ FORDONSKLASSEN. En vanlig sparkcykel är ett LEKFORDON, och
   trafikförordningen 1 kap 4 § gör föraren till GÅENDE. Hjälm skrivs som en
   rekommendation, ALDRIG som lag. ORDET "ELSPARKCYKEL" FÅR INTE FÖREKOMMA.

⚠️ FÄRGEN KOMMER FRÅN ZOOMEN, INTE FRÅN KÄLLAN. `feac1d03` heter "Hellblau"
   i källan och är klart TURKOS i bild. Runbookens Steg 4-regel sedan runda 90:
   ett färgpåstående om en detalj kräver minst 2× förstoring.

⚠️ PAKETMÅTTET SKILJER PÅ `c851d101` — 90 × 44,5 × 16 mot syskonens
   89 × 16 × 44. Varje sida bär sitt EGET tal, ordagrant. Att räkna om det
   till syskonens ordning vore tolkning.
"""

BAS = "https://www.fyndplats.se/produkt/"


def lank(slug, text):
    return '<a href="%s%s">%s</a>' % (BAS, slug, text)


def bygg(ingress, egenskaper, spec, skotsel, faq, syskon):
    d = ["<p>%s</p>" % ingress]
    d.append("<p><strong>Egenskaper</strong></p><ul>")
    d += ["<li>%s</li>" % e for e in egenskaper]
    d.append("</ul>")
    d.append("<h2>Tekniska specifikationer</h2><ul>")
    d += ["<li><strong>%s:</strong> %s</li>" % (k, v) for k, v in spec]
    d.append("</ul>")
    if syskon:
        d.append("<h2>Samma modell i andra utföranden</h2><p>%s</p>" % syskon)
    d.append("<h2>Användning och skötsel</h2>")
    d += ["<p>%s</p>" % s for s in skotsel]
    d.append("<h2>Vanliga frågor</h2>")
    for f, s in faq:
        d.append("<p><strong>%s</strong></p><p>%s</p>" % (f, s))
    return "".join(d)


EGENSKAPER = [
    "Ø30 cm luftfyllda gummidäck på ekerfälg i silver — rullar mjukt över grus och kantsten",
    "Broms på både fram- och bakhjulet",
    "Styret ställs mellan 85 och 95 cm och följer med när barnet växer",
    "Stödben i metall så att den kan parkeras stående i stället för att läggas ner",
    "Genomstegsram med högt böjt överrör — lätt att kliva på och av",
    "Halkmönstrad fotplatta, 30 × 11 cm",
    "Pulverlackerad stålram, byggd för upp till 100 kg",
    "Väger 8,2 kg — lätt nog att bäras uppför en trappa",
]

SKOTSEL = [
    "Däcken är luftfyllda och ska hållas hårda. Ett mjukt däck rullar trögt, "
    "sliter snett och gör styrningen vag, så känn efter med tummen med jämna "
    "mellanrum och fyll på med en vanlig cykelpump när det behövs.",
    "Gå igenom båda bromsarna före första turen och sedan då och då: de ska ta "
    "jämnt och släppa helt när greppet lossas. Kontrollera samtidigt att "
    "styrets snabbfäste sitter fast och att inga skruvar har vandrat.",
    "Torka av ram och fotplatta med en fuktig trasa efter turer i lera eller på "
    "saltad väg, och låt den torka inomhus. Lackeringen tål väder, men blöt "
    "smuts som får ligga kvar sliter på den i onödan.",
    "Hjälm och skydd för knän, armbågar och handleder är ett gott råd på varje "
    "tur, och särskilt de första månaderna när barnet lär sig hålla farten. På "
    "vått underlag tar bromsarna längre tid på sig.",
]

FAQ = [
    ("Från vilken ålder passar den?",
     "Den är byggd från 5 år, men det som avgör är längden. Styret står mellan "
     "85 och 95 cm, så barnet ska nå det med lätt böjda armar när det står på "
     "fotplattan. Är styret för högt blir styrningen stum, och för lågt blir "
     "hållningen krokig."),
    ("Vad skiljer den från er 120 cm med lågt styre?",
     "Längden och bredden är desamma; styret är hela skillnaden. Den här står "
     "mellan 85 och 95 cm, den andra mellan 75 och 80. De passar alltså inte "
     "samma barn — mät mot barnets höft och armbågar, inte mot åldern."),
    ("Går den att använda på grus och gräs?",
     "Ja. Luftfyllda Ø30 cm-däck med grovt mönster tar upp gropar och kanter "
     "som små hårda hjul fastnar i. På lös sand och djup lera blir det tungt "
     "oavsett hjulstorlek."),
    ("Måste den monteras?",
     "Ja, men det är ett enkelt jobb: styret sätts på framgaffeln, hjulen "
     "skruvas fast och bromsarna justeras. Låt en vuxen göra det, och "
     "kontrollera bromsarna innan barnet får åka."),
]

SPEC_BAS = [
    ("Mått", "120 × 58 × 85–95 cm (L × B × styrhöjd)"),
    ("Fotplatta", "30 × 11 cm"),
    ("Hjul", "Ø30 cm, luftfyllda gummidäck på ekerfälg i silver"),
    ("Broms", "broms på både fram- och bakhjulet"),
    ("Ram", "pulverlackerat stål, genomstegsmodell"),
    ("Maxlast", "100 kg"),
    ("Rekommenderad ålder", "från 5 år"),
    ("Vikt", "8,2 kg"),
]

SLUG = {"369b4b2c": "sparkcykel-barn-120-cm-hogt-styre-svart",
        "feac1d03": "sparkcykel-barn-120-cm-hogt-styre-turkos",
        "c851d101": "sparkcykel-barn-120-cm-hogt-styre-vit",
        "1b1d4842": "sparkcykel-barn-120-cm-hogt-styre-beige"}
ORD = {"369b4b2c": "svart", "feac1d03": "turkos",
       "c851d101": "vitt", "1b1d4842": "beige"}


def syskon(pid):
    """Länkar till de tre andra färgerna + den publicerade lågstyrda modellen."""
    andra = [k for k in SLUG if k != pid]
    delar = [lank(SLUG[k], ORD[k]) for k in andra]
    return ("Samma sparkcykel finns också i " + ", ".join(delar[:-1]) + " och " +
            delar[-1] + ". Är barnet mindre passar vår " +
            lank("sparkcykel-barn-120-cm-lagt-styre-turkos",
                 "120 cm med lågt styre, 75–80 cm") + " bättre — samma längd, "
            "men ett styre som går att komma åt för kortare armar.")


P = {}

P["369b4b2c"] = dict(
    id="369b4b2c-ef11-4795-adb0-2c5d4315901f",
    variantId="63a00f62-0675-4037-96f4-5f62ef834e62",
    namn="Sparkcykel barn 120 cm med högt styre, svart – luftdäck och stödben",
    slug=SLUG["369b4b2c"],
    titel="Sparkcykel barn 120 cm, svart – högt styre och luftdäck",
    meta="Sparkcykel för barn från 5 år med Ø30 cm luftdäck, broms fram och bak "
         "och styre 85–95 cm. Svart pulverlackerad stålram, stödben, 100 kg.",
    sokord=["sparkcykel barn", "sparkcykel luftdäck", "sparkcykel svart"],
    sku="FP-sparkcykel-120-cm-hog-svart",
    ingress=(
        "En sparkcykel för barn som redan kan köra och vill komma fram fortare. "
        "Styret står högt, mellan 85 och 95 cm, och de luftfyllda Ø30 cm-däcken "
        "rullar över grus och kantsten i stället för att haka upp sig. Ramen är "
        "svart med ett randband i guld och vitt, genomstegad så att barnet kliver "
        "på utan att lyfta benet över något."),
    spec=SPEC_BAS + [("Paketmått", "89 × 16 × 44 cm"),
                     ("Färg", "svart ram med randband i guld och vitt, styret är svart")],
    faerg="svart",
)

P["feac1d03"] = dict(
    id="feac1d03-4c7c-48d4-9c56-9d7cf9ef7144",
    variantId="10ad8ebe-3571-4f13-9787-8b902110ff9a",
    namn="Sparkcykel barn 120 cm med högt styre, turkos – luftdäck och stödben",
    slug=SLUG["feac1d03"],
    titel="Sparkcykel barn 120 cm, turkos – högt styre och luftdäck",
    meta="Sparkcykel för barn från 5 år med Ø30 cm luftdäck, broms fram och bak "
         "och styre 85–95 cm. Turkos pulverlackerad stålram, stödben, 100 kg.",
    sokord=["sparkcykel barn", "sparkcykel turkos", "sparkcykel luftdäck"],
    sku="FP-sparkcykel-120-cm-hog-turkos",
    ingress=(
        "En sparkcykel för barn som redan kan köra och vill komma fram fortare. "
        "Styret står högt, mellan 85 och 95 cm, och de luftfyllda Ø30 cm-däcken "
        "rullar över grus och kantsten i stället för att haka upp sig. Ramen är "
        "turkos med ett randband i guld, vitt och svart, genomstegad så att barnet "
        "kliver på utan att lyfta benet över något."),
    spec=SPEC_BAS + [("Paketmått", "89 × 16 × 44 cm"),
                     ("Färg", "turkos ram med randband i guld, vitt och svart, styret är svart")],
    faerg="turkos",
)

P["c851d101"] = dict(
    id="c851d101-11ec-4bab-b393-fb35880d76ae",
    variantId="14114f4d-30ca-4f4f-8842-655ec1b10937",
    namn="Sparkcykel barn 120 cm med högt styre, vit – luftdäck och stödben",
    slug=SLUG["c851d101"],
    titel="Sparkcykel barn 120 cm, vit – högt styre och luftdäck",
    meta="Sparkcykel för barn från 5 år med Ø30 cm luftdäck, broms fram och bak "
         "och styre 85–95 cm. Vit pulverlackerad stålram, stödben, 100 kg.",
    sokord=["sparkcykel barn", "sparkcykel vit", "sparkcykel luftdäck"],
    sku="FP-sparkcykel-120-cm-hog-vit",
    ingress=(
        "En sparkcykel för barn som redan kan köra och vill komma fram fortare. "
        "Styret står högt, mellan 85 och 95 cm, och de luftfyllda Ø30 cm-däcken "
        "rullar över grus och kantsten i stället för att haka upp sig. Ramen är "
        "vit med svarta ränder, genomstegad så att barnet kliver på utan att "
        "lyfta benet över något."),
    # ⚠️ EGET paketmått. Källraden säger 90 × 44,5 × 16 där syskonen säger
    # 89 × 16 × 44 — både talen och ordningen. Att räkna om det vore tolkning.
    spec=SPEC_BAS + [("Paketmått", "90 × 44,5 × 16 cm"),
                     ("Färg", "vit ram med svarta ränder, styret är svart")],
    faerg="vit",
)

P["1b1d4842"] = dict(
    id="1b1d4842-9cde-4845-bdb9-9d5bc0d19bbe",
    variantId="f0b9786c-0544-4a33-a35a-8182379a1a01",
    namn="Sparkcykel barn 120 cm med högt styre, beige – luftdäck och stödben",
    slug=SLUG["1b1d4842"],
    titel="Sparkcykel barn 120 cm, beige – högt styre och luftdäck",
    meta="Sparkcykel för barn från 5 år med Ø30 cm luftdäck, broms fram och bak "
         "och styre 85–95 cm. Beige pulverlackerad stålram, stödben, 100 kg.",
    sokord=["sparkcykel barn", "sparkcykel beige", "sparkcykel luftdäck"],
    sku="FP-sparkcykel-120-cm-hog-beige",
    ingress=(
        "En sparkcykel för barn som redan kan köra och vill komma fram fortare. "
        "Styret står högt, mellan 85 och 95 cm, och de luftfyllda Ø30 cm-däcken "
        "rullar över grus och kantsten i stället för att haka upp sig. Ramen har "
        "en dämpad gräddbeige ton med ett randband i guld, vitt och svart, "
        "genomstegad så att barnet kliver på utan att lyfta benet över något."),
    spec=SPEC_BAS + [("Paketmått", "89 × 16 × 44 cm"),
                     ("Färg", "gräddbeige ram med randband i guld, vitt och svart, styret är svart")],
    faerg="beige",
)


# ☠️ KORTRUBRIKEN BOR HÄR, inte i kort.py — så att den går genom SAMMA
# färggrind som brödtexten. Runda 90:s kortrubriker var ogranskade: bara
# produkttexten lintades, och ett kort är lika mycket ett påstående mot
# kunden som ett stycke är.
KORT = {
    "369b4b2c": ("Sparkcykel barn, 120 cm", "Svart ram med randband i guld och vitt"),
    "feac1d03": ("Sparkcykel barn, 120 cm", "Turkos ram med randband i guld, vitt och svart"),
    "c851d101": ("Sparkcykel barn, 120 cm", "Vit ram med svarta ränder"),
    "1b1d4842": ("Sparkcykel barn, 120 cm", "Gräddbeige ram med randband i guld, vitt och svart"),
}


def html(pid):
    p = P[pid]
    return bygg(p["ingress"], EGENSKAPER, p["spec"], SKOTSEL, FAQ, syskon(pid))
