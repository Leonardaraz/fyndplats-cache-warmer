# Bygger runda G2:s åtta egna Fyndplats-kort (Steg 9).
#
# ☠️ RADERNA LÄSES UR PRODUKTENS EGEN SPEC-LISTA i <kort>.html och slås upp på
# ETIKETT, aldrig på position — och listorna är OLIKA långa i den här rundan:
# chenillestolarna saknar gungvinkel, fotpallsmodellerna har en extra rad för
# pallen, och den armlösa har "Tjocklek sits och rygg" där andra har sitstjocklek.
# Kortet tar därför de åtta FÖRSTA raderna som produktens egen spec faktiskt har,
# ur en önskeordning. Att tvinga in samma åtta etiketter på alla hade betytt ett
# påhittat värde på minst tre av dem.
import sys, re, os
sys.path.insert(0, "/home/user/fyndplats-cache-warmer/scripts")
import cardkit as ck

U = lambda t, u: f'{t}&nbsp;<span class=u>{u}</span>'

ONSKAD = ["Mått", ("Fotpall", "Pall"), "Sittyta", "Sitthöjd",
          ("Gungvinkel", "Sitstjocklek", "Tjocklek sits och rygg"),
          "Ryggstöd", "Maxlast", "Vikt", "Material"]

def specrader(kort):
    h = open(f"{kort}.html", encoding="utf-8").read()
    block = re.search(r"<h2>Tekniska specifikationer</h2>(.*?)(?=<h2>|\Z)", h, re.S).group(1)
    ut = {}
    for li in re.findall(r"<li>(.*?)</li>", block, re.S):
        bitar = [b.strip() for b in re.sub(r"<[^>]+>", "\x00", li).split("\x00") if b.strip()]
        if len(bitar) == 2:
            ut[bitar[0].rstrip(":")] = re.sub(r"\s*\(.*?\)\s*$", "", bitar[1])
    return ut

def rad(etikett, varde):
    m = re.match(r"^(.*?)\s*(cm|kg|grader)$", varde)
    return (etikett, U(m.group(1), m.group(2)) if m else varde)

def kort_rader(kort):
    """De ÅTTA rader kortet renderar. Grinden anropar den här — inte en kopia."""
    s = specrader(kort)
    rader = []
    for post in ONSKAD:
        for e in (post if isinstance(post, tuple) else (post,)):
            if e in s:
                rader.append(rad(e, s[e]))
                break
        if len(rader) == 8:
            break
    return rader, s

RUBRIK = {
 "30069c15": ("GUNGSTOL I BEIGE CHENILLE",     "Bokmedar och 53 cm bred sits"),
 "081f82f1": ("GUNGSTOL I BRUN CHENILLE",      "Bokmedar och 53 cm bred sits"),
 "ceb8d80c": ("GUNGSTOL I GRÄDDVITT TEDDYTYG", "Sidofickor och 21 cm tjock sits"),
 "93144f85": ("GUNGSTOL MED FOTPALL, MÖRKGRÅ", "Öronlappsrygg, nackkudde och ben i bok"),
 "2c0f466e": ("GUNGSTOL MED FOTPALL, BEIGE",   "Öronlappsrygg, nackkudde och ben i bok"),
 "bbcb8f31": ("ARMLÖS GUNGSTOL I LJUSGRÅTT",   "72 cm bred sits och löstagbart överdrag"),
 "f642ba45": ("GUNGSTOL MED FOTPALL, VIT",     "Gungar 90 till 130 grader"),
 "3fb45f4f": ("GUNGSTOL MED PALL, GRÄDDVIT",   "Bär 150 kg och 18 cm tjock rygg"),
}

namn = []
for kort, (kicker, titel) in RUBRIK.items():
    rader, s = kort_rader(kort)
    ck.hero_white(f"orig/{kort}.jpg", f"out/{kort}-hjalte.jpg")
    ck.card_spec(f"{kort}-spec", f"out/{kort}-hjalte.jpg", kicker, titel, rader,
                 note=f'mätt på produkten · {s["Färg"].lower()}')
    namn.append(f"{kort}-spec")
print(ck.render(namn))
