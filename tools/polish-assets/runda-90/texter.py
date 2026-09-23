# -*- coding: utf-8 -*-
"""Runda 90 — sju sparkcyklar i tre modeller plus en hopfällbar cityscooter.

☠️ TEXTEN SKRIVS I FIL, ALDRIG INLINE. Batch 64 mätte skillnaden: fem
   produkter skrivna direkt i API-anropet gav NIO fel som nådde Wix, tre
   skrivna via fil och grep-grind gav noll.

☠️ RUNDANS FÖRSTA GRIND: PUNKTERINGSFRI ÄR PER PRODUKT, INTE PER RUNDA.
   Modell A och C har massiva EVA-däck och ÄR punkteringsfria. Modell G har
   LUFTFYLLDA gummidäck på ekerfälg och kan gå platt. Den hopfällbara har
   massiva PU-hjul. Ett kopierat skötselråd blir direkt fel åt båda hållen.

☠️ RUNDANS ANDRA GRIND: "ROSTFRI" FÅR INTE SKRIVAS. Modell G:s källa säger
   "Rostfreier Stahlrahmen". En lackerad stålram på en barnsparkcykel är inte
   rostfritt stål — samma påstående som runda 57 fällde. Ramen är stål och
   aluminium, punkt.

☠️ RUNDANS TREDJE GRIND: TVÅ TAL FÖR SAMMA SAK SKRIVS INTE ALLS.
   `eb4418ad`s markfrigång är 9 cm i brödtexten och 11 cm på måttskissen.
   Modell G:s hjul är Ø40 i texten och 41 cm på skissen — där vinner
   spec-tabellens Ø40, eftersom det är talet synken bär. Markfrigången har
   ingen sådan tiebreak och utelämnas.

☠️ RUNDANS FJÄRDE GRIND: MÅTTEN FÅR INTE LÅNAS. Fyra uppsättningar:
   G 139 × 58 × 90–96 · C 115 × 50 × 80–88 · A 120 × 52 × 80–88 ·
   hopfällbar 94 × 36 × 88–103. Modell B (publicerad) är 118 × 52 och ligger
   3 cm från C — att kopiera grannens tal är rundans naturligaste fel.

☠️ INGEN STANDARD FÅR NÄMNAS. Källan anger ingen för någon av de sju.
   "Godkänd", "certifierad", "CE-märkt" och "testad enligt" är lika obelagda.

☠️ FORDONSKLASSEN. En vanlig sparkcykel är ett LEKFORDON, och
   trafikförordningen 1 kap 4 § gör föraren till GÅENDE. Hjälm skrivs som en
   rekommendation, ALDRIG som lag. ORDET "ELSPARKCYKEL" FÅR INTE FÖREKOMMA.

☠️ ARTIKELNUMRET FÅR ALDRIG SKRIVAS, under någon etikett.

⚠️ FÄRGNAMNEN KOMMER FRÅN BILDEN. Källan säger "Rosa+Schwarz" om en ram som
   är rosa mot vitt, och "Weiß+Schwarz" om en som är vit mot svart. Texten
   beskriver det som syns.

⚠️ `eb4418ad`s ålder anges "6-12 Jahre" men kroppslängden "110-130 cm". En
   tolvåring är omkring 150 cm. Texten skriver "från 6 år" och låter
   kroppslängden vara det som avgör. "Till 12 år" skrivs inte.
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


# ─────────────────────────────────────────────────────────────────────────
# MODELL G — 139 × 58 × 90–96 cm, Ø40 cm LUFTDÄCK på ekerfälg, 100 kg
# ─────────────────────────────────────────────────────────────────────────

G_EGENSKAPER = [
    "Ø40 cm luftfyllda gummidäck på ekerfälg rullar mjukt över grus, gräs och kantsten",
    "Broms på både fram- och bakhjulet, manövrerad från styret",
    "Styret ställs steglöst mellan 90 och 96 cm och följer med när barnet växer",
    "Vadderad tvärstång på styret ger ett mjukare grepp",
    "Bred fotplatta, 36 cm lång, med gott om plats för hela foten",
    "Stödben så att den kan parkeras stående i stället för att läggas ner",
    "Ram i stål och aluminium, byggd för upp till 100 kg",
    "Levereras omonterad — enklare montering krävs",
]

G_SKOTSEL = [
    "Däcken är luftfyllda och ska hållas hårda. Ett mjukt däck rullar trögt, "
    "sliter snett och gör styrningen vag, så känn efter med tummen med jämna "
    "mellanrum och fyll på med en vanlig cykelpump när det behövs.",
    "Gå igenom bromsarna före första turen och sedan då och då: de ska ta "
    "jämnt på båda hjulen utan att ligga an mot fälgen när du släpper. "
    "Kontrollera samtidigt att styrets snabbfäste sitter fast och att inga "
    "skruvar har vandrat.",
    "Torka av ram och fotplatta med en fuktig trasa efter turer i lera eller "
    "på saltad väg, och låt den torka inomhus. Hjul och lager slits med tiden "
    "— byt dem när de börjar kärva eller glappa.",
    "Hjälm och skydd för knän, armbågar och handleder är ett gott råd på "
    "varje tur, och särskilt de första månaderna när barnet lär sig hålla "
    "farten. På vått underlag tar bromsarna längre tid på sig.",
]

G_FAQ_GEMENSAM = [
    ("Från vilken ålder passar den?",
     "Den är byggd från 5 år, men det som avgör är längden. Styret står "
     "mellan 90 och 96 cm, så barnet ska kunna hålla i det med lätt böjda "
     "armar när det står på fotplattan. Är styret för högt blir styrningen "
     "stum, och för lågt blir hållningen krokig."),
    ("Går den att använda på grus och gräs?",
     "Ja, och det är precis vad de stora luftdäcken är till för. Ø40 cm och "
     "luft i däcket tar upp gropar och kanter som mindre hjul fastnar i. På "
     "lös sand och djup lera blir det tungt oavsett hjulstorlek."),
    ("Måste den monteras?",
     "Ja, men det är ett enkelt jobb: styret sätts på framgaffeln, hjulen "
     "skruvas fast och bromsarna justeras. Räkna med en halvtimme med "
     "verktygen som följer med, och låt en vuxen göra det."),
    ("Tål den en vuxen?",
     "Maxlasten är 100 kg, så en förälder kan provåka. Den är ändå ritad för "
     "barn — styrhöjden går inte över 96 cm."),
]

G_SPEC_BAS = [
    ("Mått", "139 × 58 × 90–96 cm (L × B × styrhöjd)"),
    ("Fotplatta", "36 cm lång"),
    ("Hjul", "Ø40 cm, luftfyllda gummidäck på ekerfälg"),
    ("Broms", "broms på både fram- och bakhjulet"),
    ("Ram", "stål och aluminium"),
    ("Maxlast", "100 kg"),
    ("Rekommenderad ålder", "från 5 år"),
    ("Vikt", "9,5 kg"),
    ("Paketmått", "99 × 16 × 52 cm"),
]

# ─────────────────────────────────────────────────────────────────────────
# MODELL C — 115 × 50 × 80–88 cm, Ø30 cm EVA, 50 kg, stödben
# ─────────────────────────────────────────────────────────────────────────

C_EGENSKAPER = [
    "Ø30 cm massiva EVA-hjul som aldrig behöver pumpas och inte kan punktera",
    "Handbroms på bakhjulet, förmonterad och injusterad från fabrik",
    "Styret ställs mellan 80 och 88 cm och räcker från 5 till 12 år",
    "Stödben så att den kan parkeras stående i stället för att läggas ner",
    "Fotplatta 31 × 10,8 cm med halkmönster, 11 cm över marken",
    "Stålram med plastdetaljer, byggd för upp till 50 kg",
    "Väger 6,5 kg — lätt nog att bäras uppför en trappa",
    "Levereras omonterad — montering krävs",
]

C_SKOTSEL = [
    "Hjulen är massiva och behöver varken pumpas eller lagas. Det som slits "
    "är däckbanan och lagren: rullar den trögt eller låter det skrapigt är "
    "det lagren som ska bytas, inte hjulet.",
    "Kontrollera bromsen före första turen och sedan med jämna mellanrum. "
    "Den ska ta jämnt och släppa helt när greppet lossas. Se samtidigt efter "
    "att styrets snabbfäste är åtdraget och att inga skruvar har vandrat.",
    "Torka av ram och fotplatta med en fuktig trasa när den varit ute i lera "
    "eller på saltad väg, och låt den torka inomhus. Halkmönstret på "
    "fotplattan tappar greppet om det får ligga igensatt.",
    "Hjälm och skydd för knän, armbågar och handleder är ett gott råd på "
    "varje tur, och särskilt de första månaderna när barnet lär sig hålla "
    "farten. På vått underlag tar bromsen längre tid på sig.",
]

C_FAQ_GEMENSAM = [
    ("Vilken ålder passar den för?",
     "Den räcker från 5 till 12 år. Det som avgör är längden: styret står "
     "mellan 80 och 88 cm, och barnet ska nå det med lätt böjda armar när det "
     "står på fotplattan."),
    ("Kan hjulen punktera?",
     "Nej. De är massiva EVA-hjul utan luft och utan innerslang, så det finns "
     "ingenting att pumpa och ingenting som kan gå platt. Priset för det är "
     "att de är hårdare än ett luftdäck och tar upp mindre av ojämnheterna."),
    ("Vad är stödbenet till för?",
     "Det fälls ner och håller sparkcykeln upprätt när den står stilla, så "
     "den inte behöver läggas på marken vid varje paus. Det fälls upp igen "
     "med foten innan man kör vidare."),
    ("Måste bromsen justeras vid monteringen?",
     "Nej, den kommer förmonterad och injusterad. Kontrollera ändå att den "
     "tar innan första turen — vajrar kan sätta sig under transporten."),
]

C_SPEC_BAS = [
    ("Mått", "115 × 50 × 80–88 cm (L × B × styrhöjd)"),
    ("Styrbredd", "50 cm"),
    ("Fotplatta", "31 × 10,8 cm, 11 cm över marken"),
    ("Hjul", "Ø30 cm, massiv EVA"),
    ("Broms", "handbroms på bakhjulet, förmonterad"),
    ("Material", "stål och plast"),
    ("Maxlast", "50 kg"),
    ("Rekommenderad ålder", "5–12 år"),
    ("Vikt", "6,5 kg"),
    ("Paketmått", "102 × 14 × 45 cm"),
]


# ─────────────────────────────────────────────────────────────────────────
# PRODUKTERNA
# ─────────────────────────────────────────────────────────────────────────

P = {}

# ---- Modell G, vit -------------------------------------------------------
P["5129f6b0"] = dict(
    id="5129f6b0-5711-4ae2-ac39-4b1e2767fd16",
    namn="Sparkcykel barn 139 cm i vitt – luftdäck Ø40 cm och två bromsar",
    slug="sparkcykel-barn-139-cm-luftdack-vit",
    titel="Sparkcykel barn 139 cm, vit – luftdäck och två bromsar",
    meta="Sparkcykel för barn från 5 år med Ø40 cm luftdäck, broms fram och bak "
         "och styre 90–96 cm. Vit ram i stål och aluminium, maxlast 100 kg.",
    sokord=["sparkcykel barn", "sparkcykel luftdäck", "sparkcykel 139 cm"],
    sku="FP-sparkcykel-139-cm-vit",
    ingress=(
        "En sparkcykel i full storlek för barn som vuxit ur de små hjulen. "
        "Ø40 cm luftfyllda däck på ekerfälg rullar över grus, gräs och "
        "kantsten utan att haka upp sig, och bromsen sitter på båda hjulen så "
        "att farten går att ta ner kontrollerat i en utförsbacke. Ramen är vit "
        "med en röd bromsvajer som löper längs röret, styret svart med vadderad "
        "tvärstång."),
    egenskaper=G_EGENSKAPER,
    # ☠️ FÄLGEN ÄR VIT, inte silverfärgad. Zoomat på hjältebilden i Steg 9:
    # fälgbandet är vitlackerat, ekrarna är silver. Ett första utkast skrev
    # "silverfärgade fälgar" efter att ha läst kontaktarket i miniatyr — samma
    # klass som runda 89:s "röda fälg", som också var silver och också togs
    # från en för liten bild.
    spec=G_SPEC_BAS + [("Färg", "vit ram, svart styre och framgaffel, vita fälgar")],
    skotsel=G_SKOTSEL,
    faq=G_FAQ_GEMENSAM,
    syskon=(
        "Samma sparkcykel finns i " + lank("sparkcykel-barn-139-cm-luftdack-svart", "svart") +
        ". Vill du ha 16-tumsdäck och färgvalet blått eller grönt finns " +
        lank("sparkcykel-barn-luftdack-40-cm", "den här modellen från 5 år") +
        ", och behöver barnet packutrymme har vi samma längd " +
        lank("sparkcykel-barn-bla-korg-stankskarmar", "med korg och stänkskärmar") + "."),
)

# ---- Modell G, svart -----------------------------------------------------
P["50b28808"] = dict(
    id="50b28808-5e86-49d3-8f95-b0293776f065",
    namn="Sparkcykel barn 139 cm i svart – luftdäck Ø40 cm och två bromsar",
    slug="sparkcykel-barn-139-cm-luftdack-svart",
    titel="Sparkcykel barn 139 cm, svart – luftdäck och två bromsar",
    meta="Sparkcykel för barn från 5 år med Ø40 cm luftdäck, broms fram och bak "
         "och styre 90–96 cm. Svart ram i stål och aluminium, maxlast 100 kg.",
    sokord=["sparkcykel barn", "sparkcykel luftdäck", "sparkcykel svart"],
    sku="FP-sparkcykel-139-cm-svart",
    ingress=(
        "En sparkcykel i full storlek för barn som vuxit ur de små hjulen. "
        "Ø40 cm luftfyllda däck på ekerfälg rullar över grus, gräs och "
        "kantsten utan att haka upp sig, och bromsen sitter på båda hjulen så "
        "att farten går att ta ner kontrollerat i en utförsbacke. Ramen är "
        "svart med röd framgaffel, och fotplattan lika bred som på den vita."),
    egenskaper=G_EGENSKAPER,
    # ☠️ FÄLGEN ÄR VIT — samma hjul som på den vita modellen. Bara ramen och
    # gaffeln skiljer de två åt. "Svarta fälgar" var läst ur miniatyren, där
    # det svarta DÄCKET dominerar; fälgbandet under är vitt.
    spec=G_SPEC_BAS + [("Färg", "svart ram, röd framgaffel, vita fälgar")],
    skotsel=G_SKOTSEL,
    faq=G_FAQ_GEMENSAM,
    syskon=(
        "Samma sparkcykel finns i " + lank("sparkcykel-barn-139-cm-luftdack-vit", "vitt") +
        ". Vill du ha 16-tumsdäck och färgvalet blått eller grönt finns " +
        lank("sparkcykel-barn-luftdack-40-cm", "den här modellen från 5 år") +
        ", och behöver barnet packutrymme har vi samma längd " +
        lank("sparkcykel-barn-rosa-korg-stankskarmar", "med korg och stänkskärmar") + "."),
)

# ---- Modell C ------------------------------------------------------------
C_SYSKON = {
    "9518db1e": ("473084eb", "85be4535"),
    "473084eb": ("9518db1e", "85be4535"),
    "85be4535": ("9518db1e", "473084eb"),
}
C_SLUG = {"9518db1e": "sparkcykel-barn-115-cm-stodben-bla",
          "473084eb": "sparkcykel-barn-115-cm-stodben-rosa",
          "85be4535": "sparkcykel-barn-115-cm-stodben-vit"}
C_ORD = {"9518db1e": "blått", "473084eb": "rosa", "85be4535": "vitt"}


def c_syskon(pid):
    a, b = C_SYSKON[pid]
    return ("Samma sparkcykel finns också i " + lank(C_SLUG[a], C_ORD[a]) +
            " och " + lank(C_SLUG[b], C_ORD[b]) +
            ". Behöver barnet en bit större hjul och lite längre ram finns " +
            lank("sparkcykel-barn-bla-hjul-30-cm", "den här modellen för 6–12 år") + ".")


P["9518db1e"] = dict(
    id="9518db1e-94c2-4566-95c5-1fe43728a1fe",
    namn="Sparkcykel barn 115 cm i blått – handbroms, stödben och Ø30 cm hjul",
    slug=C_SLUG["9518db1e"],
    titel="Sparkcykel barn 115 cm, blå – handbroms och stödben",
    meta="Sparkcykel för barn 5–12 år med Ø30 cm EVA-hjul som inte kan punktera, "
         "handbroms bak och styre 80–88 cm. Blå ram, stödben, maxlast 50 kg.",
    sokord=["sparkcykel barn", "sparkcykel med handbroms", "sparkcykel 5-12 år"],
    sku="FP-sparkcykel-115-cm-bla",
    ingress=(
        "En sparkcykel som räcker i flera år: styret ställs mellan 80 och "
        "88 cm, hjulen är Ø30 cm och kan inte punktera, och handbromsen på "
        "bakhjulet kommer färdigt injusterad. Ramen är blå, fälgarna blå med "
        "fem ekrar och fotplattan svart med halkmönster. Stödbenet gör att den "
        "kan ställas ifrån sig i stället för att läggas på marken."),
    egenskaper=C_EGENSKAPER,
    spec=C_SPEC_BAS + [("Färg", "blå ram, blå fälgar, svart styre och fotplatta")],
    skotsel=C_SKOTSEL,
    faq=C_FAQ_GEMENSAM,
    syskon=c_syskon("9518db1e"),
)

P["473084eb"] = dict(
    id="473084eb-a8fd-48cf-b7aa-fab0616832e1",
    namn="Sparkcykel barn 115 cm i rosa – handbroms, stödben och Ø30 cm hjul",
    slug=C_SLUG["473084eb"],
    titel="Sparkcykel barn 115 cm, rosa – handbroms och stödben",
    meta="Sparkcykel för barn 5–12 år med Ø30 cm EVA-hjul som inte kan punktera, "
         "handbroms bak och styre 80–88 cm. Rosa ram, stödben, maxlast 50 kg.",
    sokord=["sparkcykel barn", "sparkcykel rosa", "sparkcykel 5-12 år"],
    sku="FP-sparkcykel-115-cm-rosa",
    ingress=(
        "En sparkcykel som räcker i flera år: styret ställs mellan 80 och "
        "88 cm, hjulen är Ø30 cm och kan inte punktera, och handbromsen på "
        "bakhjulet kommer färdigt injusterad. Ramen går från rosa upptill till "
        "vitt nedtill, fälgarna är rosa med fem ekrar och fotplattan svart med "
        "halkmönster. Stödbenet gör att den kan ställas ifrån sig i stället "
        "för att läggas på marken."),
    egenskaper=C_EGENSKAPER,
    spec=C_SPEC_BAS + [("Färg", "rosa och vit ram, rosa fälgar, svart styre och fotplatta")],
    skotsel=C_SKOTSEL,
    faq=C_FAQ_GEMENSAM,
    syskon=c_syskon("473084eb"),
)

P["85be4535"] = dict(
    id="85be4535-94d4-449d-adb2-7df734e2283c",
    namn="Sparkcykel barn 115 cm i vitt – handbroms, stödben och Ø30 cm hjul",
    slug=C_SLUG["85be4535"],
    titel="Sparkcykel barn 115 cm, vit – handbroms och stödben",
    meta="Sparkcykel för barn 5–12 år med Ø30 cm EVA-hjul som inte kan punktera, "
         "handbroms bak och styre 80–88 cm. Vit ram, stödben, maxlast 50 kg.",
    sokord=["sparkcykel barn", "sparkcykel vit", "sparkcykel 5-12 år"],
    sku="FP-sparkcykel-115-cm-vit",
    ingress=(
        "En sparkcykel som räcker i flera år: styret ställs mellan 80 och "
        "88 cm, hjulen är Ø30 cm och kan inte punktera, och handbromsen på "
        "bakhjulet kommer färdigt injusterad. Ramen går från vitt upptill till "
        "svart nedtill, och till skillnad från syskonen är fälgarna svarta i "
        "stället för färgade. Stödbenet gör att den kan ställas ifrån sig i "
        "stället för att läggas på marken."),
    egenskaper=C_EGENSKAPER,
    spec=C_SPEC_BAS + [("Färg", "vit och svart ram, svarta fälgar, svart styre och fotplatta")],
    skotsel=C_SKOTSEL,
    faq=C_FAQ_GEMENSAM,
    syskon=c_syskon("85be4535"),
)

# ---- Modell A, rosa ------------------------------------------------------
P["68f8f1a7"] = dict(
    id="68f8f1a7-27ca-4350-a7d9-fa02af2bdc94",
    namn="Sparkcykel barn 12 tum i rosa – bakbroms och styre 80–88 cm",
    slug="sparkcykel-barn-12-tum-rosa",
    titel="Sparkcykel barn 12 tum, rosa – bakbroms och stödben",
    meta="Sparkcykel för barn 5–12 år med 12-tumshjul fram och bak, handbroms "
         "på bakhjulet och styre 80–88 cm. Rosa stålram, stödben, maxlast 50 kg.",
    sokord=["sparkcykel barn", "sparkcykel rosa", "sparkcykel 12 tum"],
    sku="FP-sparkcykel-12-tum-rosa",
    ingress=(
        "Rosa version av vår 12-tumssparkcykel. Hjulen är lika stora fram och "
        "bak, så den rullar jämnt över grus och trottoarkanter i stället för "
        "att stanna i varje spricka. Handbromsen sitter på bakhjulet och nås "
        "utan att släppa styret, och det kullagrade styret ställs mellan 80 "
        "och 88 cm. Ramen är ljust rosa, fälgarna svarta med fem ekrar."),
    egenskaper=[
        "12-tumshjul fram och bak med massiva EVA-däck på plastfälg — inget att pumpa",
        "Handbroms på bakhjulet plus ett fotstöd att bromsa mot",
        "Kullagrat styre som ställs mellan 80 och 88 cm",
        "Halkmönstrad fotplatta, 32 × 11 cm, 11 cm över marken",
        "Stödben i metall så att den kan parkeras stående",
        "Stålram byggd för upp till 50 kg",
        "Väger 6,7 kg — lätt nog att bäras uppför en trappa",
        "Levereras omonterad — en vuxen ska montera den före första turen",
    ],
    spec=[
        ("Mått", "120 × 52 × 80–88 cm (L × B × styrhöjd)"),
        ("Styrbredd", "52 cm"),
        ("Fotplatta", "32 × 11 cm, 11 cm över marken"),
        ("Hjul", "12 tum fram och bak, EVA-däck på plastfälg"),
        ("Broms", "handbroms på bakhjulet"),
        ("Ram", "stål"),
        ("Maxlast", "50 kg"),
        ("Rekommenderad ålder", "5–12 år"),
        ("Vikt", "6,7 kg"),
        ("Paketmått", "88 × 16 × 45 cm"),
        ("Färg", "rosa ram, svarta hjul"),
    ],
    skotsel=[
        "Hjulen är massiva och behöver varken pumpas eller lagas. Det som "
        "slits är däckbanan och lagren: rullar den trögt eller låter det "
        "skrapigt är det lagren som ska bytas, inte hjulet.",
        "Kontrollera bromsen före första turen och sedan med jämna mellanrum. "
        "Den ska ta jämnt och släppa helt när greppet lossas. Se samtidigt "
        "efter att styrets snabbfäste är åtdraget och att inga skruvar har "
        "vandrat.",
        "Torka av ram och fotplatta med en fuktig trasa när den varit ute i "
        "lera eller på saltad väg, och låt den torka inomhus.",
        "Hjälm och skydd för knän, armbågar och handleder är ett gott råd på "
        "varje tur, och särskilt de första månaderna när barnet lär sig hålla "
        "farten. På vått underlag tar bromsen längre tid på sig.",
    ],
    faq=[
        ("Vilken ålder passar den för?",
         "Den räcker från 5 till 12 år. Det som avgör är längden: styret "
         "står mellan 80 och 88 cm, och barnet ska nå det med lätt böjda armar "
         "när det står på fotplattan."),
        ("Kan hjulen punktera?",
         "Nej. EVA-däcken är massiva, utan luft och utan innerslang, så det "
         "finns ingenting att pumpa och ingenting som kan gå platt. Priset för "
         "det är att de är hårdare än ett luftdäck."),
        ("Hur bromsar man?",
         "Med handbromsen på styret, som verkar på bakhjulet. Bakskärmen "
         "fungerar dessutom som fotstöd att trycka mot när det behöver gå "
         "fort. På vått underlag krävs längre förvarning."),
        ("Måste en vuxen montera den?",
         "Ja. Sparkcykeln ska vara helt färdigmonterad innan den används, och "
         "bromsen ska kontrolleras. Det är ett enkelt jobb med verktygen som "
         "följer med."),
    ],
    syskon=(
        "Samma sparkcykel finns i " + lank("sparkcykel-barn-12-tum-bla", "blått") +
        ", " + lank("sparkcykel-barn-12-tum-svart", "svart") + " och " +
        lank("sparkcykel-barn-12-tum-vinrod", "vinrött") + "."),
)

# ---- Hopfällbar cityscooter ---------------------------------------------
P["eb4418ad"] = dict(
    id="eb4418ad-7896-40fa-baf9-0004cdf12db4",
    namn="Hopfällbar sparkcykel barn 94 cm – stötdämpning och styre i fyra lägen",
    slug="sparkcykel-barn-hopfallbar-stotdampning",
    titel="Hopfällbar sparkcykel barn – stötdämpning och Ø20 cm hjul",
    meta="Hopfällbar sparkcykel för barn från 6 år med stötdämpning, broms "
         "fram och bak och styre i fyra lägen 88–103 cm. Hopfälld 85 × 15 × 31 cm.",
    sokord=["hopfällbar sparkcykel", "sparkcykel barn", "sparkcykel stötdämpning"],
    sku="FP-sparkcykel-hopfallbar-svart",
    ingress=(
        "En sparkcykel för asfalt som fälls ihop på några sekunder och blir "
        "85 × 15 × 31 cm — liten nog att bära in på bussen eller ställa i en "
        "hall. Ø20 cm hjul i massiv PU och en fjädrande stötdämpare i orange "
        "under styrstammen tar upp skarvar och kullersten, och bromsar sitter "
        "på både fram- och bakhjulet. Styret klickar i fyra lägen mellan 88 "
        "och 103 cm."),
    egenskaper=[
        "Fälls ihop till 85 × 15 × 31 cm för att bäras eller ställas undan",
        "Stötdämpning under styrstammen jämnar ut skarvar och kullersten",
        "Broms på både fram- och bakhjulet",
        "Styret klickar i fyra lägen: 88/93/98/103 cm",
        "Ø20 cm hjul i massiv PU — inget att pumpa och ingen punktering",
        "ABEC-7-lager för mjuk och tyst rullning",
        "Lång fotplatta, 45,5 × 14 cm, med plats för båda fötterna",
        "Ram i metall, byggd för upp till 100 kg",
    ],
    spec=[
        ("Mått", "94 × 36 × 88–103 cm (L × B × styrhöjd)"),
        ("Hopfälld", "85 × 15 × 31 cm"),
        ("Styrhöjd", "88/93/98/103 cm"),
        ("Fotplatta", "45,5 × 14 cm"),
        ("Hjul", "Ø20 cm, massiv PU"),
        ("Broms", "broms på både fram- och bakhjulet"),
        ("Lager", "ABEC-7"),
        ("Material", "metall, plast och PU"),
        ("Maxlast", "100 kg"),
        ("Rekommenderad kroppslängd", "110–130 cm"),
        ("Rekommenderad ålder", "från 6 år"),
        ("Vikt", "8 kg"),
        ("Paketmått", "87 × 15,5 × 32 cm"),
        ("Färg", "svart med orange stötdämpare"),
    ],
    skotsel=[
        "Hjulen är massiv PU och behöver varken pumpas eller lagas. De slits "
        "däremot snett om barnet bromsar mycket med bakskärmen — vänd eller "
        "byt dem när banan blivit ojämn.",
        "Kontrollera hopfällningslåset varje gång den fälls upp: spaken ska gå "
        "hela vägen ner och sitta stumt innan någon ställer sig på plattan. "
        "Ett halvstängt lås är den enda delen på den här sparkcykeln som är "
        "värd att titta två gånger på.",
        "Gå igenom båda bromsarna med jämna mellanrum och se efter att inga "
        "skruvar har vandrat. Torka av ram och fotplatta med en fuktig trasa "
        "efter turer i väta, och låt den torka inomhus — fälld eller uppfälld, "
        "men inte hopfälld och blöt.",
        "Hjälm och skydd för knän, armbågar och handleder är ett gott råd på "
        "varje tur. De små hjulen gör den snabb och lättstyrd på slät asfalt, "
        "och just därför är den känsligare för grus än en sparkcykel med stora "
        "hjul.",
    ],
    faq=[
        ("Hur vet jag om barnet får plats?",
         "Gå på längden. Styret klickar i fyra lägen mellan 88 och 103 cm och "
         "är gjort för en kroppslängd på 110–130 cm. Barnet ska nå styret med "
         "lätt böjda armar när det står på fotplattan."),
        ("Hur fälls den ihop?",
         "Med en spak vid framgaffeln: lossa spaken, fäll ner styrstammen mot "
         "fotplattan och lyft. Hopfälld är den 85 × 15 × 31 cm. Kontrollera "
         "alltid att spaken är helt stängd innan den används igen."),
        ("Vad gör stötdämparen?",
         "Den fjädrar under styrstammen och tar upp skarvar, kullersten och "
         "trottoarkanter innan de når händerna. Skillnaden märks mest på "
         "ojämn asfalt; på en slät cykelbana gör den ingenting."),
        ("Passar den på grus?",
         "Den är byggd för asfalt och slät mark. Ø20 cm hjul tar sig fram på "
         "hårt packat grus men fastnar i löst underlag — vill du ha en som "
         "klarar gräs och grus är stora hjul rätt väg."),
    ],
    syskon=(
        "Vill du ha en sparkcykel som klarar grus och gräs har vi " +
        lank("sparkcykel-barn-12-tum-svart", "samma svarta färg med 12-tumshjul") +
        ". Till yngre barn finns " +
        lank("sparkcykel-barn-trehjulig-led", "en trehjulig modell för 2–6 år") + "."),
)


def html(pid):
    p = P[pid]
    return bygg(p["ingress"], p["egenskaper"], p["spec"], p["skotsel"], p["faq"], p["syskon"])
