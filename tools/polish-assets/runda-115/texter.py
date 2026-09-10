# -*- coding: utf-8 -*-
"""Runda 115 — de sju sparkfordonens texter.

☠️ INGA TAL SOM INTE STÅR I matt.py. Varje siffra härleds ur tabellerna där,
   och grind.py fäller på ett tal som inte finns i produktens egen uppsättning.

☠️ ORDET ÄR SPARKFORDON, ALDRIG TRAMPBIL. Leverantören kallar samma vara båda;
   bilden visar noll pedaler. Se STEG2.md punkt 1.
"""
import matt as M

BAS = "https://www.fyndplats.se/produkt/"

SLUG = {
    "cc6b56f9": "gravmaskin-att-sitta-pa-85-cm",
    "fb142c5c": "hjullastare-att-sitta-pa-78-cm",
    "738ca991": "bandgravare-att-sitta-pa-larvband",
    "0c05c1a0": "frontlastare-att-sitta-pa-80-cm",
    "23ba27a5": "sparktraktor-slap-skopa-grep",
    "39d85f18": "sparktraktor-slap-sandleksaker-gul",
    "389ac5ac": "sparktraktor-slap-sandleksaker-bla",
}
NAMN = {
    "cc6b56f9": "Grävmaskin att sitta på 85 cm – manövrerbar skopa och tippskydd",
    "fb142c5c": "Hjullastare att sitta på 78 cm – skopa fram och tippskydd",
    "738ca991": "Bandgrävare att sitta på 78 cm – larvband och grävarm",
    "0c05c1a0": "Frontlastare att sitta på 80 cm – stor skopa och växelspak",
    "23ba27a5": "Sparktraktor med släp, skopa och grep – ljus och musik",
    "39d85f18": "Sparktraktor med släp och sandleksaker – gul",
    "389ac5ac": "Sparktraktor med släp och sandleksaker – blå",
}
TITEL = {
    "cc6b56f9": "Grävmaskin att sitta på 85 cm, tippskydd",
    "fb142c5c": "Hjullastare att sitta på 78 cm, skopa",
    "738ca991": "Bandgrävare att sitta på, larvband",
    "0c05c1a0": "Frontlastare att sitta på 80 cm",
    "23ba27a5": "Sparktraktor med släp, skopa och grep",
    "39d85f18": "Sparktraktor med släp, sandleksaker, gul",
    "389ac5ac": "Sparktraktor med släp, sandleksaker, blå",
}
# Korslänkar: arbetsfordonen inom sin grupp, traktorerna inom sin.
SYSKON = {
    "cc6b56f9": ("fb142c5c", "en hjullastare med skopa fram"),
    # ☠️ KORSLÄNKEN FLYTTAD. `cc6b56f9` visade sig vara en BEVISAD DUBBLETT av
    #    den redan publicerade `akgravmaskin-barn` (8dd0fb8f) — samma render,
    #    och livsstilsbilden är samma foto av samma barn på samma gång.
    #    Utkastet publiceras därför inte, och en länk dit hade blivit en 404.
    #    Länken går i stället till den LEVANDE sidan, vilket dessutom är bättre
    #    för kunden.
    "fb142c5c": ("__akgravmaskin", "en grävmaskin med arm bakom sitsen"),
    "738ca991": ("0c05c1a0", "en frontlastare med stor skopa"),
    "0c05c1a0": ("738ca991", "en bandgrävare på larvband"),
    "23ba27a5": ("39d85f18", "samma traktor i gult med sandskyffel och kratta"),
    "39d85f18": ("389ac5ac", "samma traktor i blått"),
    "389ac5ac": ("39d85f18", "samma traktor i gult"),
}


def tal(x):
    return str(int(x)) if float(x) == int(x) else f"{x:.1f}".replace(".", ",")


def yttre(k):
    b, d, h = M.YTTRE[k]
    return f"{tal(b)} × {tal(d)} × {tal(h)} cm"


def paket(k):
    b, d, h = M.PAKET[k]
    return f"{tal(b)} × {tal(d)} × {tal(h)} cm"


def alder(k):
    a, b = M.ALDER[k]
    return f"{a}–{b} månader"


def ratten(k):
    """☠️ EN formulering, läst av både brödtexten och FAQ:n — se matt.RATTEN."""
    v = M.RATTEN[k]
    return " och ".join([", ".join(v[:-1]), v[-1]]) if len(v) > 1 else v[0]


def P(s):
    return f"<p>{s}</p>"


def H(s):
    return f"<h2>{s}</h2>"


def LI(e, v):
    return f"<li><strong>{e}:</strong> {v}</li>"


# Syskon som INTE ligger i rundan — en publicerad sida med känd slug.
UTANFOR = {"__akgravmaskin": "akgravmaskin-barn"}


def lank(k):
    m, txt = SYSKON[k]
    slug = UTANFOR.get(m) or SLUG[m]
    return P(f'Finns också som <a href="{BAS}{slug}">{txt}</a>.')


# ── Ingresser ───────────────────────────────────────────────────────────────
INGRESS = {
 "cc6b56f9":
   "En grävmaskin barnet sitter på och skjuter fram med fötterna. Skopan sitter "
   "på en arm bakom sitsen och styrs med två spakar, och under sitsen finns ett "
   "fack för det som ska följa med ut.",
 "fb142c5c":
   "En hjullastare barnet sitter på och skjuter fram med fötterna. Skopan sitter "
   "framtill där barnet ser den och lyfts med spakarna på sidorna — sand in, "
   "sand ut, och lasten hela tiden i blickfånget.",
 "738ca991":
   "En bandgrävare på larvband, byggd att sitta grensle på och skjuta fram med "
   "fötterna. Grävarmen har en spärr som måste vridas innan skopan går att röra, "
   "och sitsen fälls upp till ett tätt fack under.",
 "0c05c1a0":
   "En frontlastare barnet sitter på och skjuter fram med fötterna. Skopan är "
   "stor nog för riktig sand, växelspaken går att dra i på riktigt, och tutan "
   "fungerar utan batteri.",
 "23ba27a5":
   "En traktor barnet sitter på och skjuter fram med fötterna, med ett släp som "
   "kopplas på baktill. Ratten har tuta, ljus och musik, och i lådan följer en "
   "skopa och en grep med.",
 "39d85f18":
   "En gul traktor barnet sitter på och skjuter fram med fötterna, med ett släp "
   "baktill och sandleksaker i lådan. Sitsen går att lyfta av, och den breda "
   "ratten är lika mycket stöd som styrning.",
 "389ac5ac":
   "En blå traktor barnet sitter på och skjuter fram med fötterna, med ett släp "
   "baktill och sandleksaker i lådan. Sitsen går att lyfta av, och den breda "
   "ratten är lika mycket stöd som styrning.",
}


def kropp(k):
    d = []
    d.append(P(INGRESS[k]))

    # ── Så fungerar den: fötterna mot marken, ingen motor, inga pedaler ──────
    d.append(H("Fötterna mot marken — ingen motor, inga pedaler"))
    d.append(P(
        "Barnet sitter på fordonet och skjuter ifrån mot underlaget. Det finns "
        "ingen motor att ladda och inga pedaler att nå, så farten är precis den "
        "barnet självt orkar hålla."))

    # ── Arbetsredskapet ─────────────────────────────────────────────────────
    if k == "cc6b56f9":
        d.append(H("Skopan styrs med två spakar"))
        d.append(P(
            "Armen sitter bakom sitsen och skopan höjs och sänks med spakarna "
            "till höger och vänster. Barnet vrider sig om, gräver, och vänder "
            "tillbaka — hela rörelsen är samma sak en riktig maskinist gör."))
    elif k == "fb142c5c":
        d.append(H("Skopan sitter framtill"))
        d.append(P(
            "Lastaren har skopan rakt fram där barnet ser den, och spakarna på "
            "sidorna lyfter och sänker den. Skopan är djup nog för riktig sand "
            "och tippar av lasten där barnet vill ha den."))
    elif k == "738ca991":
        d.append(H("Grävarmen har en spärr"))
        d.append(P(
            "Skopan sitter på en arm med ett lås som måste vridas innan armen "
            "går att röra. Spärren finns för att armen inte ska svepa framåt av "
            "sig själv medan barnet sitter på."))
        d.append(H("Larvband i stället för hjul"))
        d.append(P(
            "Underredet är byggt som ett band runt om, precis som på en riktig "
            "bandgrävare. Fordonet rullar på hjul inuti bandet."))
    elif k == "0c05c1a0":
        d.append(H("Stor skopa och en växelspak som går att dra i"))
        d.append(P(
            "Skopan höjs och sänks och tar riktiga sandlaster. Växelspaken är "
            "till för känslan — den ger något att greppa och rycka i medan "
            "fötterna gör jobbet."))
    else:
        d.append(H("Släpet kopplas på och av"))
        s = M.SLAP[k]
        if s:
            d.append(P(
                f"Släpet mäter {tal(s[0])} × {tal(s[1])} × {tal(s[2])} cm och "
                "kopplas på baktill. Där får en matlåda, en vattenflaska eller "
                "sandleksakerna plats."))
        else:
            d.append(P(
                "Släpet kopplas på baktill och tar med det som ska följa med "
                "ut — leksaker, en vattenflaska eller dagens fynd."))

    # ── Tuta, ljud och ljus ─────────────────────────────────────────────────
    if k == "23ba27a5":
        d.append(H("Tuta, ljus och musik i ratten"))
        d.append(P(
            f"Ratten har {ratten(k)}. Underlaget säger inte hur den "
            "strömförsörjs, så vi anger varken att batterier ingår eller att "
            "de inte gör det."))
    elif k in ("39d85f18", "389ac5ac"):
        d.append(H("Tuta och strålkastare"))
        d.append(P(
            f"Ratten har {ratten(k)}, och de ger ljud när barnet trycker. "
            "Sitsen är bred och går att lyfta av."))
    elif M.BATTERI[k] and "ingår inte" in M.BATTERI[k]:
        d.append(H("Tutan går på batteri"))
        d.append(P(
            "Tutan drivs av två AAA-batterier. <strong>De ingår inte</strong> — "
            "räkna med att lägga dem i innan den första turen."))
    else:
        d.append(H("Tutan behöver inget batteri"))
        d.append(P(
            "Tutan låter när barnet trycker på den, utan batteri och utan "
            "laddning. Ingenting på fordonet behöver ström."))

    # ── Säkerhet och bärighet ───────────────────────────────────────────────
    d.append(H(f"Bär {tal(M.MAXLAST[k])} kg, {alder(k)}"))
    sak = []
    # ⚠️ EN post per sak — inte "a och b" i ett element. Slås de ihop i förväg
    #    blir uppräkningen "ryggstöd och tippskydd och halkmönstrade däck".
    if k in ("cc6b56f9", "fb142c5c"):
        sak += ["ryggstöd", "tippskydd", "halkmönstrade däck"]
    elif k in ("738ca991", "0c05c1a0"):
        sak += ["dubbelt skydd mot att tippa bakåt", "brett underrede"]
    else:
        sak.append("brett underrede")
    d.append(P(
        f"Konstruktionen bär {tal(M.MAXLAST[k])} kg, och åldern som anges är "
        f"{alder(k)}. Den har " + (", ".join(sak[:-1]) + " och " + sak[-1]
                                   if len(sak) > 1 else sak[0]) + ". "
        "Fordonet är byggt för hårt, jämnt underlag — asfalt, plattor eller "
        "ett golv inomhus."))
    if k == "23ba27a5":
        d.append(P(
            "☠"[:0] +
            "Två olika åldersuppgifter finns i underlaget. Vi anger den "
            "försiktigare av dem."))

    # ── Sits och mått ───────────────────────────────────────────────────────
    d.append(H(f"{yttre(k)} — och sitsen sitter lågt"))
    if M.SITS[k]:
        b, dj, h = M.SITS[k]
        d.append(P(
            f"Fordonet är {yttre(k)}. Sitsen mäter {tal(b)} × {tal(dj)} cm och "
            f"sitter {tal(h)} cm över golvet, så fötterna når ner utan att "
            "barnet behöver sträcka sig."))
    else:
        d.append(P(
            f"Fordonet är {yttre(k)} och sitsen sitter "
            f"{tal(M.SITSHOJD[k])} cm över golvet, så fötterna når ner utan "
            "att barnet behöver sträcka sig."))

    # ── Förvaring ───────────────────────────────────────────────────────────
    if k in M.FORVARING_MOTSAGT or k in ("cc6b56f9", "fb142c5c"):
        d.append(H("Fack under sitsen"))
        d.append(P(
            "Sitsen fälls upp och under den finns ett fack. Där ryms "
            "sandleksaker, en mugg eller det barnet vill ha med sig. "
            "Underlaget ger två olika invändiga mått, så vi anger inget."))

    # ── Montering ───────────────────────────────────────────────────────────
    if M.MONTERING[k]:
        d.append(H("Montering krävs"))
        d.append(P(
            "Fordonet levereras isärtaget och skruvas ihop hemma. Räkna med "
            "ratten, sitsen och hjulen."))

    d.append(lank(k))
    return "".join(d)


def spec(k):
    r = [LI("Yttermått", f"{yttre(k)} (L × B × H)")]
    if M.SITS[k]:
        b, dj, h = M.SITS[k]
        r.append(LI("Sits", f"{tal(b)} × {tal(dj)} cm, {tal(h)} cm över golvet"))
    else:
        r.append(LI("Sitshöjd", f"{tal(M.SITSHOJD[k])} cm över golvet"))
    if M.RYGGSTOD.get(k):
        b, h = M.RYGGSTOD[k]
        r.append(LI("Ryggstöd", f"{tal(b)} × {tal(h)} cm"))
    if k in M.SLAP and M.SLAP[k]:
        b, d2, h = M.SLAP[k]
        r.append(LI("Släp", f"{tal(b)} × {tal(d2)} × {tal(h)} cm"))
    if k in M.HJUL:
        h = M.HJUL[k]
        r.append(LI("Hjul", f"Ø{tal(h['alla'])} cm" if "alla" in h
                    else f"Ø{tal(h['fram'])} cm fram, Ø{tal(h['bak'])} cm bak"))
    r.append(LI("Max belastning", f"{tal(M.MAXLAST[k])} kg"))
    r.append(LI("Rekommenderad ålder", alder(k)))
    r.append(LI("Material", " och ".join(M.MATERIAL[k])))
    r.append(LI("Färg", M.FARG[k]))
    r.append(LI("Vikt", f"{tal(M.VIKT[k])} kg"))
    if M.BATTERI[k]:
        r.append(LI("Batteri", M.BATTERI[k]))
    r.append(LI("Montering", "krävs" if M.MONTERING[k] else "ingen"))
    r.append(LI("I lådan", ", ".join(M.INGAR[k])))
    r.append(LI("Paketmått", paket(k)))
    return H("Tekniska specifikationer") + "<ul>" + "".join(r) + "</ul>"


def skotsel(k):
    return H("Användning och skötsel") + P(
        "Torka av fordonet med en fuktig trasa och låt det torka innan det "
        "ställs undan — sand och grus sliter mest på hjullagren. Kör det på "
        "jämnt underlag; gräs och grov grus bromsar och gör att barnet inte "
        "kommer fram. Låt det inte stå ute i regn längre perioder, och dra åt "
        "skruvarna en gång om året." +
        (" Ta ur batterierna om det ska stå oanvänt en säsong."
         if M.BATTERI[k] and "ingår inte" in M.BATTERI[k] else ""))


def faq(k):
    q = []
    q.append(("Har den pedaler?",
              "Nej. Barnet sitter på och skjuter ifrån med fötterna mot marken. "
              "Det finns varken pedaler eller motor."))
    q.append((f"Hur mycket bär den?",
              f"Konstruktionen bär {tal(M.MAXLAST[k])} kg. Åldern som anges är "
              f"{alder(k)}."))
    if M.BATTERI[k] and "ingår inte" in M.BATTERI[k]:
        q.append(("Ingår batterier?",
                  "Nej. Tutan drivs av två AAA-batterier som du lägger i själv."))
    elif M.BATTERI[k]:
        q.append(("Behövs batterier?",
                  "Nej. Tutan låter utan batteri, och ingenting annat på "
                  "fordonet behöver ström."))
    else:
        # ☠️ FORMULERINGEN HÄRLEDS, den skrivs inte om. Stod den två gånger
        #    hamnade 23ba27a5:s "ljus och musik" på traktorer som bara har
        #    strålkastare — och det gjorde den, i sexton timmar.
        q.append(("Ingår batterier?",
                  f"Det vet vi inte. Ratten har {ratten(k)}, men underlaget "
                  "säger inget om strömförsörjningen — så vi påstår varken "
                  "det ena eller det andra."))
    if M.MONTERING[k]:
        q.append(("Kommer den färdigmonterad?",
                  "Nej, den skruvas ihop hemma. Bruksanvisningen följer med."
                  if "bruksanvisning" in M.INGAR[k] else
                  "Nej, den skruvas ihop hemma."))
    q.append(("Går den att köra inomhus?",
              "Ja, på ett jämnt golv. Den rullar bäst på hårt underlag — "
              "asfalt, plattor eller innegolv."))
    return H("Vanliga frågor") + "".join(
        f"<p><strong>{a}</strong></p><p>{b}</p>" for a, b in q)


def bygg(k):
    return kropp(k) + spec(k) + skotsel(k) + faq(k)


META = {
 "cc6b56f9": "Grävmaskin att sitta på, 85 × 27,5 × 47,5 cm. Skopan styrs med två "
             "spakar, ryggstöd och tippskydd, fack under sitsen. Bär 25 kg.",
 "fb142c5c": "Hjullastare att sitta på, 78 × 29,5 × 54 cm. Skopa framtill, "
             "ryggstöd och tippskydd, fack under sitsen. Bär 25 kg.",
 "738ca991": "Bandgrävare att sitta på med larvband och grävarm med spärr. "
             "78 × 24 × 58,5 cm, sits 22 cm över golvet. Bär 30 kg.",
 "0c05c1a0": "Frontlastare att sitta på, 80 × 26,5 × 39 cm. Stor skopa, "
             "växelspak och tuta utan batteri. Bär 30 kg.",
 "23ba27a5": "Sparktraktor med påkopplingsbart släp, skopa och grep. Tuta, ljus "
             "och musik i ratten. 91 × 29 × 44 cm, bär 25 kg.",
 "39d85f18": "Gul sparktraktor med släp 23 × 18 × 14 cm, sandskyffel och kratta. "
             "Avtagbar sits, tuta och strålkastare. Bär 25 kg.",
 "389ac5ac": "Blå sparktraktor med släp 23 × 18 × 14 cm, sandskyffel och kratta. "
             "Avtagbar sits, tuta och strålkastare. Bär 25 kg.",
}


def seo(k):
    return {"tags": [
        {"type": "title", "children": TITEL[k]},
        {"type": "meta", "props": {"name": "description", "content": META[k]}},
    ]}


if __name__ == "__main__":
    for k in M.YTTRE:
        t = bygg(k)
        print(f"{k}  namn {len(NAMN[k]):>3}  titel {len(TITEL[k]):>3}  "
              f"meta {len(META[k]):>3}  text {len(t):>5}")
