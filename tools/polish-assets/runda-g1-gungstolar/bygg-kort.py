# Bygger runda G1:s åtta egna Fyndplats-kort (Steg 9, ett spec-kort per produkt).
#
# ☠️ RADERNA LÄSES UR PRODUKTENS EGEN SPEC-TABELL i <kort>.html, och slås upp
# på ETIKETT — aldrig på position. Två skäl, båda uppmätta i huset: en
# hårdkodad rad kan bli fel när spec-listorna är olika långa (runda 82), och en
# rad skriven för hand i kortet är ett värde till som kan säga emot sidan.
#
# ⚠️ RUNDANS SVÅRASTE DRAG: sex av åtta delar sina mått med ett syskon.
#   · 25405611 / 3b5a67d9 / 3dbd4f08 / 48432e48 — IDENTISKA tal, fyra färger
#   · dd4e1e06 / b4441140 — IDENTISKA tal, ljusgrå mot gräddvit
# Ett kort som upprepar det som är lika gör ingen nytta. Rubrikerna säger
# därför vad som SKILJER: tyget, ryggens behandling och färgen. Samma lärdom
# som F2:s 140/160 cm-par.
import sys, re, os
sys.path.insert(0, "/home/user/fyndplats-cache-warmer/scripts")
import cardkit as ck

U = lambda t, u: f'{t}&nbsp;<span class=u>{u}</span>'

def specrader(kort):
    """Etikett -> värde ur produktens egen spec-tabell."""
    h = open(f"{kort}.html", encoding="utf-8").read()
    block = re.search(r"<h2>Tekniska specifikationer</h2>(.*?)(?=<h2>|\Z)", h, re.S).group(1)
    ut = {}
    for li in re.findall(r"<li>(.*?)</li>", block, re.S):
        rent = re.sub(r"<[^>]+>", "\x00", li)
        bitar = [b.strip() for b in rent.split("\x00") if b.strip()]
        if len(bitar) == 2:
            # Måttraden bär en parentes som förklarar axlarna — den hör hemma på
            # sidan, inte på kortet, där utrymmet är åtta rader.
            ut[bitar[0].rstrip(":")] = re.sub(r"\s*\(.*?\)\s*$", "", bitar[1])
    return ut

def rad(s, etikett, visa=None):
    """Plocka en rad på etikett och dela av enheten så accenten kan sättas."""
    v = s[etikett]                      # KeyError om etiketten inte finns — med flit
    m = re.match(r"^(.*?)\s*(cm|kg|grader)$", v)
    return (visa or etikett, U(m.group(1), m.group(2)) if m else v)

# kicker, titel — det som SKILJER produkten från sina syskon.
RUBRIK = {
 "25405611": ("GUNGSTOL I GUL MANCHESTER",   "Bokmedar och rak rygg i manchester"),
 "3b5a67d9": ("GUNGSTOL I LJUSGRÅ MANCHESTER","Bokmedar och rak rygg i manchester"),
 "3dbd4f08": ("GUNGSTOL I BEIGE MANCHESTER", "Bokmedar och rak rygg i manchester"),
 "48432e48": ("GUNGSTOL I MÖRKGRÅ SAMMETSLOOK","Rutstickad rygg — samma stomme som manchesterstolarna"),
 "bde44d3c": ("GUNGSTOL I GRÅTT TEDDYTYG",   "Sidoficka och stativ helt i metall"),
 "4f98b924": ("GUNGSTOL I GRÄDDVITT TEDDYTYG","Knappad rygg och medar i gummiträ"),
 "dd4e1e06": ("GUNGSTOL I LJUSGRÅTT TEDDYTYG","Rutstickad rygg och medar i gummiträ"),
 "b4441140": ("GUNGSTOL I GRÄDDVITT TEDDYTYG","Rutstickad rygg och medar i gummiträ"),
}

def kort_rader(kort):
    """De ÅTTA rader kortet faktiskt renderar. Grinden anropar den här —
    inte en egen kopia av listan, för då gatas inte det som byggs."""
    s = specrader(kort)
    # ⚠️ Femte raden skiljer sig mellan de två familjerna, och det är RÄTT:
    # manchesterstolarnas källa anger dyntjocklek men ingen gungvinkel,
    # teddystolarnas tvärtom. Kortet tar den produktens egen källa har —
    # att tvinga in samma etikett på båda hade betytt ett påhittat värde.
    femte = "Gungvinkel" if "Gungvinkel" in s else "Dyntjocklek"
    return [rad(s, "Mått"), rad(s, "Sittyta"), rad(s, "Sitthöjd"),
            rad(s, "Ryggstöd"), rad(s, femte), rad(s, "Maxlast"),
            rad(s, "Vikt"), ("Material", s["Material"])], s

namn = []
for kort, (kicker, titel) in RUBRIK.items():
    rader, s = kort_rader(kort)
    ck.hero_white(f"orig/{kort}.jpg", f"out/{kort}-hjalte.jpg")
    ck.card_spec(f"{kort}-spec", f"out/{kort}-hjalte.jpg", kicker, titel, rader,
                 note=f'mätt på produkten · {s["Färg"].lower()}')
    namn.append(f"{kort}-spec")
print(ck.render(namn))
