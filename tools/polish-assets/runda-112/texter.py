# -*- coding: utf-8 -*-
"""Runda 112 Steg 7 — nio projektordukar i fem konstruktioner.

☠️ TRE PÅSTÅENDEN UR LEVERANTÖRENS TEXT FÅR INTE FÖLJA MED:

  1. `Dreischichtiges Material blockiert Licht und dient auch als
     Verdunkelungsvorhang` — en projektorduk är inte en mörkläggningsgardin.
     Samma löftesklass som rumsavdelarnas i runda 108–111, och lika lätt att
     skriva av misstag: leverantören säger det på FYRA av nio produkter.
  2. `4K/8K`, `Ultra HD`, `HD Ready` — en duk har ingen upplösning. Skärpan
     kommer ur projektorn kunden redan äger. Det ärliga påståendet är att ytan
     är matt och slät nog att inte lägga en struktur över bilden.
  3. `160-Grad-Weitwinkel` — betraktningsvinkeln är en egenskap hos dukens yta
     och anges av leverantören, men den säger inget som kunden kan pröva. Den
     står i spec-tabellen med sitt tal och byggs inte om till ett löfte.

☠️ OCH ETT TAL SOM MÅSTE SKRIVAS UT ÄRLIGT: tumtalet räknas på DUKEN, bilden
   är mindre. Sju av nio har en synlig bildyta som är 3–6 cm mindre per led.
   Båda talen står i spec-tabellen med etiketter som säger vilket är vilket.
"""
import re
import matt

BAS = "https://www.fyndplats.se/produkt/"


def tal(x):
    """Svensk sifferstil: decimalkomma, inga onödiga nollor."""
    if isinstance(x, float) and x == int(x):
        x = int(x)
    return str(x).replace(".", ",")


SLUG = {
    "1b87909f": "projektorduk-120-tum-stativ",
    "422ab1bd": "projektorduk-92-tum-motor",
    "a8c82049": "projektorduk-85-tum-motor",
    "ddca577d": "projektorduk-84-tum-manuell",
    "77d2b35c": "projektorduk-99-tum-manuell",
    "0370673c": "projektorduk-84-tum-stativ-svart",
    "fe11166f": "projektorduk-84-tum-stativ-vit",
    "623b6504": "projektorduk-84-tum-motor-svart",
    "77e4a558": "projektorduk-84-tum-motor-vit",
}

# ☠️ SKU:erna är HANDGJORDA, och det är inte en smaksak. `PRODUCT_PART_MAX = 24`
#    kapar på bindestreck, och FEM av rundans slugs börjar `projektorduk-84-tum`
#    (19 tecken). Nästa bindestreck spränger 24, så regeln som den står ger
#    `FP-projektorduk-84-tum` FEM GÅNGER. Exakt hundvagnsfallet i runbooken:
#    det som skiljer produkterna åt ligger i svansen, och det är svansen 24
#    tecken klipper bort. Behåll svansen, kapa mitten.
SKU = {
    "1b87909f": "FP-projektorduk-120-stativ",
    "422ab1bd": "FP-projektorduk-92-motor",
    "a8c82049": "FP-projektorduk-85-motor",
    "ddca577d": "FP-projektorduk-84-manuell",
    "77d2b35c": "FP-projektorduk-99-manuell",
    "0370673c": "FP-projektorduk-84-stativ-svart",
    "fe11166f": "FP-projektorduk-84-stativ-vit",
    "623b6504": "FP-projektorduk-84-motor-svart",
    "77e4a558": "FP-projektorduk-84-motor-vit",
}

NAMN = {
    "1b87909f": "Projektorduk 120 tum på stativ – 263 × 148 cm, 16:9, för utomhusbruk",
    "422ab1bd": "Projektorduk 92 tum motoriserad – 165 × 165 cm, 1:1, med fjärrkontroll",
    "a8c82049": "Projektorduk 85 tum motoriserad – 152 × 152 cm, 1:1, med fjärrkontroll",
    "ddca577d": "Projektorduk 84 tum manuell – 171 × 128 cm, 4:3, med autolås",
    "77d2b35c": "Projektorduk 99 tum manuell – 178 × 178 cm, 1:1, med autolås",
    "0370673c": "Projektorduk 84 tum på trebent stativ – 171 × 131 cm, 4:3, svart",
    "fe11166f": "Projektorduk 84 tum på trebent stativ – 171 × 131 cm, 4:3, vit",
    "623b6504": "Projektorduk 84 tum motoriserad – 171 × 130 cm, 4:3, svart",
    "77e4a558": "Projektorduk 84 tum motoriserad – 171 × 130 cm, 4:3, vit",
}

TITEL = {
    "1b87909f": "Projektorduk 120 tum på stativ | Fyndplats",
    "422ab1bd": "Motoriserad projektorduk 92 tum | Fyndplats",
    "a8c82049": "Motoriserad projektorduk 85 tum | Fyndplats",
    "ddca577d": "Projektorduk 84 tum med autolås | Fyndplats",
    "77d2b35c": "Projektorduk 99 tum med autolås | Fyndplats",
    "0370673c": "Projektorduk 84 tum på stativ, svart | Fyndplats",
    "fe11166f": "Projektorduk 84 tum på stativ, vit | Fyndplats",
    "623b6504": "Motoriserad projektorduk 84 tum, svart | Fyndplats",
    "77e4a558": "Motoriserad projektorduk 84 tum, vit | Fyndplats",
}

SOKORD = {
    "1b87909f": ["projektorduk", "projektorduk stativ", "projektionsduk", "filmduk utomhus"],
    "422ab1bd": ["projektorduk", "motoriserad projektorduk", "projektionsduk", "eldriven filmduk"],
    "a8c82049": ["projektorduk", "motoriserad projektorduk", "projektionsduk", "eldriven filmduk"],
    "ddca577d": ["projektorduk", "manuell projektorduk", "projektionsduk", "rullduk projektor"],
    "77d2b35c": ["projektorduk", "manuell projektorduk", "projektionsduk", "rullduk projektor"],
    "0370673c": ["projektorduk", "projektorduk stativ", "projektionsduk", "filmduk på stativ"],
    "fe11166f": ["projektorduk", "projektorduk stativ", "projektionsduk", "filmduk på stativ"],
    "623b6504": ["projektorduk", "motoriserad projektorduk", "projektionsduk", "eldriven filmduk"],
    "77e4a558": ["projektorduk", "motoriserad projektorduk", "projektionsduk", "eldriven filmduk"],
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
    return '<a href="%s%s">%s</a>' % (BAS, SLUG[nyckel], text)


def duk(k):
    b, h = matt.RUNDAN[k][2], matt.RUNDAN[k][3]
    return "%s × %s cm" % (tal(b), tal(h))


def bild(k):
    b, h = matt.BILDYTA[k]
    return "%s × %s cm" % (tal(b), tal(h))


# ☠️ RUNDANS SIGNATURSTYCKE, och det enda som är gemensamt för alla nio: vilket
#    av två tal som är vilket. Tumtalet räknas på DUKEN; det kunden projicerar
#    på är bildytan innanför den svarta kanten. Sju av nio skiljer sig 3–6 cm
#    per led. Att bara skriva det ena vore inte osant — men det vore att välja
#    vilket tal kunden får mäta sin vägg mot, och då ska det vara det som gäller.
def bildyta_stycke(k):
    tum = matt.RUNDAN[k][0]
    if matt.BILDYTA[k] == (matt.RUNDAN[k][2], matt.RUNDAN[k][3]):
        return P("Duken mäter %s, och hela den ytan är bild — det är den siffran "
                 "%s tum räknas på. Den svarta kanten ligger utanför måttet och "
                 "ramar in bilden i stället för att äta av den."
                 % (duk(k), tal(tum)))
    return P("Duken mäter %s och tumtalet räknas på den. Innanför den ligger en "
             "svart maskeringskant, så den yta du faktiskt projicerar på är "
             "%s. Det är det måttet du ska jämföra med väggen — kanten gör "
             "bilden skarpare i konturen, men den är inte bild."
             % (duk(k), bild(k)))


def projektor_stycke():
    # ☠️ Leverantören säljer duken på `4K/8K` och `Ultra HD`. En duk har ingen
    #    upplösning — skärpan kommer ur projektorn kunden redan äger. Det ärliga
    #    påståendet är vad YTAN gör: den är matt och slät.
    return P("Skärpan i bilden kommer ur projektorn, inte ur duken. Det duken "
             "gör är att ge en jämn, matt yta utan struktur eller glans, så att "
             "ingenting i underlaget lägger sig över bilden och inga reflexer "
             "kastas tillbaka mot tittaren.")


DRIFT = {
    "B": lambda k: H("Går upp och ner med fjärrkontroll") + P(
        "Duken sitter i en kassett som skruvas i vägg eller tak, och motorn "
        "rullar ut och in den. Du styr den med den medföljande fjärrkontrollen "
        "eller med väggpanelen på sladden. Kassetten är %s och kabeln 2,1 meter."
        % matt.YTTRE[k].split(", kassett ")[1]),
    "E": lambda k: H("Går upp och ner med fjärrkontroll") + P(
        "Duken sitter i ett metallhölje på %s som skruvas i vägg eller tak. "
        "Motorn rullar ut och in den, och fjärrkontrollen är trådlös med en "
        "räckvidd på upp till 30 meter — tvärs över ett vardagsrum, utan att "
        "du behöver rikta den mot höljet."
        % matt.YTTRE[k].replace("hölje ", ""),
    ),
    "C": lambda k: H("Dras ner för hand och låser sig själv") + P(
        "Kassetten skruvas i vägg eller tak. Du drar ner duken i handtaget och "
        "släpper — mekanismen låser i det läge du släppte den, och ett nytt "
        "lätt drag frigör den så att den rullar upp igen. Ingen sladd, ingen "
        "ström, ingenting som kan gå sönder elektriskt."),
    "D": lambda k: H("Står på egna ben, inget att skruva") + P(
        "Höljet vilar på ett trebent stativ och duken dras upp ur det. "
        "Överkanten går till 2,03 meter över golvet, och stativet fälls ihop "
        "när du är klar. Den kan därför flyttas mellan rum — eller ställas undan "
        "helt mellan gångerna, vilket en väggmonterad duk inte kan."),
    "A": lambda k: H("Ram i delar, duk som viks") + P(
        "Ramen kommer i sektioner och skruvas ihop, duken spänns i den och två "
        "aluminiumstativ bär upp det hela. Uppställd mäter den %s. Åtta "
        "markankare och två stormlinor på fem meter ingår, så den kan förankras "
        "i gräs. Efteråt viks tyget och stativbenen fälls in — hela paketet är "
        "%s × %s × %s cm."
        % (matt.YTTRE[k].replace(" uppställd", ""),
           tal(matt.RUNDAN[k][5][0]), tal(matt.RUNDAN[k][5][1]),
           tal(matt.RUNDAN[k][5][2]))),
}

YTA = {
    "A": P("Duken är vävd polyester spänd i en ram av aluminium. Tyget är "
           "tvättbart och skrynklar inte, och ramen håller det plant över hela "
           "ytan — det är spänningen som avgör om bilden blir rak, inte tyget."),
    "B": P("Duken är matt vit plast i tre lager på en kärna som håller den plan. "
           "Ytan är slät och tål att torkas av, och materialet lägger sig platt "
           "utan veck när det rullats ut."),
    "C": P("Duken är matt vit plast i tre lager på en kärna som håller den plan. "
           "Ytan är slät och tål att torkas av, och materialet lägger sig platt "
           "utan veck när det rullats ut."),
    "D": P("Duken är en förstärkt väv i en ram av metall. Höljet och stativet är "
           "lackad metall, och stativbenen låses i utfällt läge."),
    "E": P("Duken är en nätväv med matt vit yta, spänd i ett hölje av metall. "
           "Väven är styvare än ett rent folieskikt och hänger därför rakt även "
           "när den varit upprullad länge."),
}

# Korshänvisningar: storlekssyskon, färgsyskon eller samma storlek i en annan
# konstruktion. ⚠️ En länk per sida — inte en lista.
SYSKON = {
    "1b87909f": ("0370673c", "vår trebenta stativduk på 84 tum utan markankare"),
    "422ab1bd": ("a8c82049", "samma motorduk i 85 tum"),
    "a8c82049": ("422ab1bd", "samma motorduk i 92 tum"),
    "ddca577d": ("77d2b35c", "samma manuella duk i 99 tum och kvadratiskt format"),
    "77d2b35c": ("ddca577d", "samma manuella duk i 84 tum och 4:3-format"),
    "0370673c": ("fe11166f", "samma stativduk i vitt"),
    "fe11166f": ("0370673c", "samma stativduk i svart"),
    "623b6504": ("77e4a558", "samma motorduk i vitt"),
    "77e4a558": ("623b6504", "samma motorduk i svart"),
}


def spec(k):
    tum, form, b, h, vikt, paket, pris = matt.RUNDAN[k]
    r = [LI("Dukstorlek", "%s (%s tum)" % (duk(k), tal(tum))),
         LI("Synlig bildyta", bild(k)),
         LI("Bildformat", form),
         LI("Yttermått", matt.YTTRE[k])]
    if k in matt.RAMOPPNING:
        r.append(LI("Ramöppning", "%s × %s cm"
                    % (tal(matt.RAMOPPNING[k][0]), tal(matt.RAMOPPNING[k][1]))))
    if k in matt.SVARTKANT:
        r.append(LI("Svart kant", "%s cm" % tal(matt.SVARTKANT[k])))
    if k in matt.NAT:
        v, hz, w, varv = matt.NAT[k]
        r += [LI("Anslutning", "%s V / %s Hz" % (tal(v), tal(hz))),
              LI("Effekt", "%s W" % tal(w)),
              LI("Rullhastighet", "%s varv/min" % tal(varv))]
    r += [LI("Material", " och ".join(matt.MATERIAL[k])),
          LI("Färg", matt.FARG[k]),
          LI("Vikt", "%s kg" % tal(vikt)),
          LI("Paketmått", "%s × %s × %s cm"
             % (tal(paket[0]), tal(paket[1]), tal(paket[2])))]
    montering = {"A": "ram i delar, skruvas ihop",
                 "B": "skruvas i vägg eller tak",
                 "C": "skruvas i vägg eller tak",
                 "D": "ingen — står på stativ",
                 "E": "skruvas i vägg eller tak"}[matt.GRUPPER[k]]
    r.append(LI("Montering", montering))
    # ☠️ RADEN FÅR INTE SÄGA EMOT SIDANS EGEN BILD. `0370673c-5` visar
    #    golvstativet på en gräsmatta under ljusslingor — leverantörens egen
    #    bild — medan ett tidigare utkast av den här raden skrev `inomhus` på
    #    alla utom A. Det som SKILJER A från D är mätt och står i A:s egen
    #    ritning: åtta markankare och två stormlinor ingår där, D får inga.
    r.append(LI("Användning", {"A": "utomhus och inomhus",
                               "D": "inomhus, och utomhus i uppehållsväder"}
                .get(matt.GRUPPER[k], "inomhus")))
    return H("Tekniska specifikationer") + "<ul>" + "".join(r) + "</ul>"


SKOTSEL = {
    "A": P("Torka duken med en fuktig trasa och låt den torka helt innan du "
           "viker ihop den — tyget är tvättbart, men det ska inte packas fuktigt. "
           "Ta in den när den inte används; den är gjord för att stå ute en kväll, "
           "inte en säsong. Ramdelarna torkas torrt innan de läggs i paketet."),
    "B": P("Torka duken med en lätt fuktad trasa och låt den hänga ute tills den "
           "torkat innan du kör upp den. Kassetten dammas torr. Rulla upp duken "
           "när den inte används — då håller sig ytan plan och dammfri."),
    "C": P("Torka duken med en lätt fuktad trasa och låt den hänga tills den "
           "torkat innan du rullar upp den. Kassetten dammas torr. Dra alltid "
           "ner duken hela vägen till ett låsläge i stället för att hålla emot "
           "på vägen upp."),
    "D": P("Torka duken med en lätt fuktad trasa och låt den torka innan du rullar "
           "ner den i höljet. Fäll ihop stativet först när duken är nere. Förvaras "
           "stående eller liggande — inte lutad mot en vägg, där stativbenen kan "
           "glida isär."),
    "E": P("Torka väven med en lätt fuktad trasa och låt den torka innan du kör upp "
           "den. Höljet dammas torrt. Dra ur kontakten om duken inte ska användas "
           "under en längre tid."),
}


def faq(k):
    g = matt.GRUPPER[k]
    tum = matt.RUNDAN[k][0]
    f = [("Hur stor blir bilden?",
          "Bildytan är %s. Duken är %s — mellanskillnaden är den svarta kanten, "
          "som ramar in bilden utan att vara bild." % (bild(k), duk(k))
          if matt.BILDYTA[k] != (matt.RUNDAN[k][2], matt.RUNDAN[k][3])
          else "Bildytan är %s, alltså hela duken. %s tum räknas på det måttet."
               % (bild(k), tal(tum))),
         ("Vilken projektor passar?",
          "Alla. Duken har ingen egen elektronik som behöver matcha projektorn — "
          "det som avgör är att projektorns bild ryms inom %s. Ställ den på det "
          "avstånd som ger den bildbredden, så fyller den duken." % bild(k))]
    if g == "A":
        f.append(("Kan den stå utomhus?",
                  "Ja, den är byggd för det: åtta markankare och två stormlinor "
                  "ingår och förankrar stativen i gräs. Den ska ändå tas in efter "
                  "kvällen — ram och tyg är inte gjorda för att stå ute i väder "
                  "över tid."))
    elif g == "D":
        f.append(("Kan den stå utomhus?",
                  "Den går att bära ut en torr kväll — den står på sitt eget "
                  "stativ och behöver ingen ström. Men den har inga markankare "
                  "och inga linor, till skillnad från %s, så den ska inte "
                  "användas i blåst och inte lämnas ute. Regn och fukt tål "
                  "varken duk eller stativ."
                  % lank("1b87909f", "vår 120-tumsduk med ram och två stativ")))
    else:
        f.append(("Kan den stå utomhus?",
                  "Nej. Den skruvas i vägg eller tak och är gjord för "
                  "inomhusbruk — den tål varken regn eller fukt."))
    if k in matt.NAT:
        v, hz, w, _ = matt.NAT[k]
        f.append(("Behöver den ström?",
                  "Ja. Motorn går på %s V och drar %s W när duken rör sig. "
                  "Det behövs alltså ett uttag inom räckhåll för den plats du "
                  "monterar den på." % (tal(v), tal(w))))
    else:
        f.append(("Behöver den ström?",
                  "Nej. Den fungerar helt mekaniskt och behöver inget uttag."))
    f.append(("Hur monteras den?", {
        "A": "Ramen skruvas ihop av sina delar efter medföljande anvisning, "
             "duken spänns i ramen och stativen fälls ut. Inga verktyg mot vägg "
             "eller tak behövs.",
        "B": "Kassetten skruvas i vägg eller tak med de medföljande fästena. "
             "Anvisning ingår.",
        "C": "Kassetten skruvas i vägg eller tak med de medföljande fästena. "
             "Anvisning ingår.",
        "D": "Ingen montering. Stativet fälls ut, höljet vilar på det och duken "
             "dras upp.",
        "E": "Höljet skruvas i vägg eller tak med de medföljande fästena. "
             "Anvisning ingår.",
    }[g]))
    f.append(("Vad väger den?",
              "%s kg. En person hanterar den utan problem — lyft i %s, inte i duken."
              % (tal(matt.RUNDAN[k][4]),
                 "ramen" if g == "A" else ("stativet" if g == "D" else "höljet"))))
    return H("Vanliga frågor") + "".join(
        # ☠️ Wix STRIPPAR <br>. Fråga och svar skrivs som TVÅ <p>.
        P("<strong>%s</strong>" % q) + P(a) for q, a in f)


def bygg(k):
    g = matt.GRUPPER[k]
    tum, form, b, h, vikt, paket, pris = matt.RUNDAN[k]
    syskon, syskontext = SYSKON[k]
    ingress = {
        "A": "En <strong>projektorduk</strong> på %s tum med en bildyta på %s i "
             "formatet %s. Ramen skruvas ihop, duken spänns i den och två stativ "
             "bär upp den — den kan därför ställas var som helst, också på en "
             "gräsmatta." % (tal(tum), bild(k), form),
        "B": "En motoriserad <strong>projektorduk</strong> på %s tum med en bildyta "
             "på %s i formatet %s. Kassetten skruvas i vägg eller tak och duken "
             "går upp och ner med fjärrkontroll." % (tal(tum), bild(k), form),
        "C": "En <strong>projektorduk</strong> på %s tum med en bildyta på %s i "
             "formatet %s. Den dras ner för hand och låser sig i det läge du "
             "släpper den." % (tal(tum), bild(k), form),
        "D": "En <strong>projektorduk</strong> på %s tum med en bildyta på %s i "
             "formatet %s, på ett trebent stativ. Ingenting ska skruvas i väggen "
             "— den ställs där den behövs och fälls ihop efteråt."
             % (tal(tum), bild(k), form),
        "E": "En motoriserad <strong>projektorduk</strong> på %s tum med en bildyta "
             "på %s i formatet %s. Höljet skruvas i vägg eller tak och duken körs "
             "ut och in med trådlös fjärrkontroll." % (tal(tum), bild(k), form),
    }[g]
    html = (P(ingress)
            + H("Så stor blir bilden")
            + bildyta_stycke(k)
            + projektor_stycke()
            + DRIFT[g](k)
            + H("Ytan")
            + YTA[g]
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


# ⚠️ Meta ≤155 tecken, och den ska bära nyttan + sökordet. Den är ett EGET fält:
#    ändras brödtexten senare lever den gamla formuleringen kvar här och går ut
#    i meta description, og:description och JSON-LD:ns description.
META = {
    "1b87909f": "Projektorduk 120 tum på stativ med bildyta 263 × 148 cm i 16:9. "
                "Ram i delar, vikbar duk, markankare och linor ingår. 4 kg.",
    "422ab1bd": "Motoriserad projektorduk 92 tum med bildyta 162 × 162 cm i 1:1. "
                "Fjärrkontroll och väggpanel, monteras i vägg eller tak.",
    "a8c82049": "Motoriserad projektorduk 85 tum med bildyta 149 × 149 cm i 1:1. "
                "Fjärrkontroll och väggpanel, monteras i vägg eller tak.",
    "ddca577d": "Projektorduk 84 tum med bildyta 165 × 124 cm i 4:3. Dras ner för "
                "hand och låser i valfri höjd. Ingen ström, ingen sladd.",
    "77d2b35c": "Projektorduk 99 tum med bildyta 172 × 172 cm i 1:1. Dras ner för "
                "hand och låser i valfri höjd. Ingen ström, ingen sladd.",
    "0370673c": "Projektorduk 84 tum på trebent stativ, bildyta 165 × 125 cm i 4:3. "
                "Svart. Inget att skruva — ställs upp och fälls ihop.",
    "fe11166f": "Projektorduk 84 tum på trebent stativ, bildyta 165 × 125 cm i 4:3. "
                "Vit. Inget att skruva — ställs upp och fälls ihop.",
    "623b6504": "Motoriserad projektorduk 84 tum med bildyta 171 × 130 cm i 4:3, "
                "svart. Trådlös fjärrkontroll, monteras i vägg eller tak.",
    "77e4a558": "Motoriserad projektorduk 84 tum med bildyta 171 × 130 cm i 4:3, "
                "vit. Trådlös fjärrkontroll, monteras i vägg eller tak.",
}
