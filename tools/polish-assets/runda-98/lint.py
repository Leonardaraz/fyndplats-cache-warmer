# -*- coding: utf-8 -*-
"""Runda 98 — mekanisk grind mot texterna i filen.

☠️ REGEL 1 ÄR ÄRVD FRÅN RUNDA 97 OCH GÄLLER ORDAGRANT: INGA HÄLSOPÅSTÅENDEN.
   Alla sex utkast säljer den upphöjda skålen på hälsa, och den största
   studien pekar åt motsatt håll (se `texter.py`). Grinden är en ORDLISTA,
   inte en bedömning — en bedömning glider, en ordlista gör det inte.

☠️ REGEL 2: TALEN FÖRANKRAS I SPEC-TABELLEN. Vitlistan byggs ur `SPEC`, som
   är de MÄTTA värdena. Ett tal i brödtexten som inte står i spec-tabellen
   måste stå i `EXTRA` med en motivering (#326).

☠️ REGEL 3: MATERIALET SKA VARA TVÅDELAT. Alla sex är byggda i träfiberskiva
   men importens spec-rad säger "Holzwerkstoff/Edelstahl". Sidan ska säga
   BÅDA delarna, aldrig bara den ena. MDF är aldrig "massivt trä" (#259).

☠️ REGEL 4 ÄR NY OCH ÄR DEN HÄR RUNDANS EGEN: DÖRRTYPEN FÅR INTE LÄCKA
   MELLAN MODELLERNA. 143bef7b har SKJUTDÖRRAR, modell A och B har
   GÅNGJÄRN — mätt på bottenskenan, panelöverlappet och knopparnas
   placering, inte antaget ur syskonets text. Runda 97:s 868cc038 var samma
   fel åt andra hållet, och det satt då i namn, slug, SEO, ingress, en
   egenskapsrad, ett helt skötselstycke, kortrubriken, alt-texten och fyra
   syskonsidors korslänk. En sådan miss ska fällas av en regel, inte av tur.
"""
import re
import sys

import texter as T

# Giltiga korslänkmål: rundans egna sluggar PLUS runda 97:s publicerade syskon.
SLUGGAR = set(T.SLUGG.values()) | {s for s, _ in T.PUBLICERADE}

# ---------------------------------------------------------------- ordlistor

HALSA = [
    r"magomvridn", r"uppblåsthet", r"matsmältn", r"matspjälkn",
    r"nack(e|en|ar)", r"rygg(en|rad)?", r"led(er|erna)", r"artros",
    r"höftled", r"hållning", r"skonsam", r"skonar", r"avlastar",
    r"belastning", r"veterinär", r"hälsosam", r"nyttigare", r"bättre för",
    r"ergonomisk", r"kroppshållning", r"sväljer", r"äter långsammare",
]
FORBJUDET = [
    (r"aosom|outsunny|homcom|pawhut|vinsetto|aiyaplay", "leverantör/husmärke"),
    (r"leverantör|tillverkar|fabrikant|importör", "mot kunden är VI leverantören"),
    (r"tyskland|spanien|skickas från", "avsändarland"),
    (r"futterstation|n[äa]pf|edelstahl|schulterhöhe|hinweis|stauraum", "tyska"),
    (r"\b\d{2,3}[A-Za-z]?-\d{3,4}[A-Za-z]{0,3}\b", "artikelnummer"),
    (r"artikelnummer|modellreferens|artikelnr", "artikelnummer som etikett"),
    (r"[\U0001F300-\U0001FAFF☀-➿]", "emoji i kundtext"),
    (r"runda \d|steg \d", "intern jargong (#318)"),
]

# ⚠️ Tal som INTE står i spec-tabellen men ändå är riktiga. Varje rad är en
#    motivering; en tom motivering är inte tillåten.
EXTRA = {
    # A-modellerna: 44 L, 35,5 cm. Korslänkarna bär syskonens tal.
    "9cfc2f50": {"2": "två skålar/två luckor", "43": "korslänk", "37": "korslänk",
                 "46": "korslänk", "50": "korslänk", "34": "korslänk r97",
                 "30": "korslänk r97 + djupet", "42": "korslänk r97",
                 "5": "femkilossäck"},
    "18b9ec99": {"2": "två skålar/två luckor", "43": "korslänk", "37": "korslänk",
                 "46": "korslänk", "50": "korslänk", "34": "korslänk r97",
                 "30": "korslänk r97 + djupet", "42": "korslänk r97",
                 "5": "femkilossäck"},
    "f8594223": {"2": "två skålar/två luckor", "43": "korslänk", "37": "korslänk",
                 "46": "korslänk", "50": "korslänk", "34": "korslänk r97",
                 "30": "korslänk r97 + djupet", "42": "korslänk r97",
                 "5": "femkilossäck"},
    # B-modellerna: 37 L, 43 cm.
    "d362f9b3": {"2": "två skålar/två luckor", "35,5": "korslänk", "44": "korslänk",
                 "46": "korslänk", "50": "korslänk", "34": "korslänk r97",
                 "42": "korslänk r97", "5": "femkilossäck"},
    "9a600fda": {"2": "två skålar/två luckor", "35,5": "korslänk", "44": "korslänk",
                 "46": "korslänk", "50": "korslänk", "34": "korslänk r97",
                 "42": "korslänk r97", "5": "femkilossäck"},
    # C: 50 L, 46 cm, skjutdörrar.
    "143bef7b": {"2": "två skålar/två dörrar", "35,5": "korslänk", "44": "korslänk",
                 "43": "korslänk", "37": "korslänk", "34": "korslänk r97",
                 "42": "korslänk r97", "3": "de tre skåpen i serien"},
}


def tal_i(txt):
    return set(re.findall(r"\d+(?:[,.]\d+)?", txt))


def vitlista(pid):
    ut = set()
    for k, v in T.SPEC[pid]:
        ut |= tal_i(v)
    ut |= set(EXTRA[pid])
    return ut


def synlig(h):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()


def lasform(h):
    """Inline-taggar bort UTAN blanksteg — se runda 96:s lärdom."""
    h = re.sub(r"</?(?:a|span|strong|em|b|i)\b[^>]*>", "", h)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()


def granska(pid, h, namn, titel, meta):
    f = []
    txt = lasform(h)
    allt = (txt + " " + namn + " " + titel + " " + meta).lower()

    # 1 — hälsopåståenden
    for m in HALSA:
        tr = re.search(m, allt)
        if tr:
            f.append("HÄLSOPÅSTÅENDE %r — Steg 2-grinden" % tr.group(0))

    # 2 — förbjudna ord
    for m, vad in FORBJUDET:
        tr = re.search(m, allt)
        if tr:
            f.append("%s: %r" % (vad, tr.group(0)))

    # ☠️ DUBBELT BLANKSTEG MÅSTE MÄTAS PÅ RÅ HTML. Låg tidigare i FORBJUDET,
    #    som körs på lasform() — och lasform() normaliserar bort just det den
    #    letade efter. En regel som mäter sin egen normalisering fäller aldrig.
    if re.search(r"(?<!>)  (?!<)", re.sub(r"<[^>]+>", "", h)):
        f.append("dubbelt blanksteg i brödtexten")

    # ☠️ KOMMALISTA AV TAL MED ENHETEN SIST. Runbokens sifferstil förbjuder den
    #    ordagrant, och regeln fanns INTE i den här rundans lint — den fångades
    #    först av klart-kriteriet mot Wix, efter att texterna redan var skrivna.
    #    Fjorton förekomster, varav en i META-BESKRIVNINGEN, som är just den yta
    #    Google visar. En regel som bara står i runboken är ingen grind.
    #
    #    Skiljetecknet är MELLANSLAGET, inte kommat: listkommat har alltid ett
    #    mellanslag efter sig, decimalkommat aldrig. "13,5 kg" får inte fällas.
    #    Ytan är ALL text — namn, titel, meta och hela HTML:en — för regeln
    #    säger "aldrig", och en grind som täcker mindre är ett påstående om att
    #    resten är ren.
    #    ⚠️ Loopvariabeln får INTE heta `txt` — den skuggade den yttre `txt`
    #       (lasform(h)) och avväpnade material- och talgrinderna nedanför, som
    #       då mätte meta-beskrivningen i stället för brödtexten. Fyra falska
    #       brister på första körningen: en slarvigt tillagd regel kan tysta de
    #       regler som står efter den.
    #    ⚠️ Och den läser ARGUMENTEN, inte T.NAMN[pid] osv. Första versionen
    #       läste modulen direkt — då kunde ingen mutation nå de tre ytorna,
    #       och självtestet för meta rapporterade "FÄLLDE INTE" om en regel som
    #       i drift fungerade. En regel som inte går att mutera är otestad.
    for vad, yta in (("brödtext", re.sub(r"<[^>]+>", " ", h)),
                     ("namn", namn),
                     ("seo-titel", titel),
                     ("meta", meta)):
        tr = re.search(r"\d+(?:,\d+)?, \d", yta)
        if tr:
            f.append("kommalista av tal i %s: %r" % (vad, tr.group(0)))

    # 3 — ohärledda tal
    vit = vitlista(pid)
    for tal in tal_i(txt + " " + namn + " " + titel + " " + meta):
        if tal not in vit:
            f.append("ohärlett tal %r (står inte i spec och inte i EXTRA)" % tal)

    # 4 — materialet tvådelat
    if not re.search(r"skålar(na)?.{0,40}rostfritt", txt, re.S) and \
       not re.search(r"rostfria skålar", txt):
        f.append("skålarnas material sägs inte")
    stomme = dict(T.SPEC[pid]).get("Stomme", "")
    if "träfiberskiva" in stomme and "träfiberskiva" not in txt:
        f.append("stommen är träfiberskiva men ordet står inte i texten")
    if "träfiberskiva" in stomme and re.search(
            r"\bmöbel i (rostfritt|stål)\b", txt):
        f.append("möbeln kallas stål trots träfiberstomme")

    # ☠️ REGEL 4 — DÖRRTYPEN. 143bef7b har SKJUTDÖRRAR (bottenskena, två
    #    överlappande akrylpaneler, en knopp i var ytterände, och två OLIKA
    #    dörrbredder — 29,5 + 36 = 65,5 cm på en 60 cm bred front, alltså
    #    överlapp). Modell A och B har GÅNGJÄRN. Runda 97:s 868cc038 var
    #    exakt samma fel åt andra hållet, och det satt på tio ställen.
    #
    #    Grinden är tvåvägs med flit: den fäller BÅDE när fel ord finns OCH
    #    när rätt ord saknas. Ett ord som bara får finnas är en halv regel —
    #    en sida som inte säger något alls om dörrtypen är också fel.
    # ⚠️ Ytan är texten FÖRE syskonlistan. Korslänkarna namnger med rätta
    #    syskonens dörrtyp ("Matskåp 46 cm med skjutdörrar"), och en regel som
    #    läste dem hade fällt varje sida i familjen — en grind som alltid
    #    fyrar är samma sak som ingen grind (#318:s lärdom, andra hållet).
    kropp = lasform(h.split("<h2>Fler matskåp")[0])
    SKJUT = r"skjutd[öo]rr|glider i (en )?sk[ea]na|glid(er|ande) [åa]t sidan"
    GANG = r"g[åa]ngj[äa]rn|sv[äa]ng(er|ns|d|da)? ut|magnetst[äa]ngning|regelbeslag"
    if T.GRUPP[pid] == "C":
        if not re.search(SKJUT, kropp, re.I):
            f.append("skjutdörrarna nämns inte (regel 4)")
        tr = re.search(GANG, kropp, re.I)
        if tr:
            f.append("gångjärnsord %r på en skjutdörrsmodell (regel 4)" % tr.group(0))
        if "akryl" not in kropp.lower():
            f.append("akryldörrarna kallas inte akryl (regel 4)")
    else:
        if not re.search(GANG, kropp, re.I):
            f.append("dörrtypen sägs inte (regel 4)")
        tr = re.search(SKJUT, kropp, re.I)
        if tr:
            f.append("skjutdörrsord %r på en gångjärnsmodell (regel 4)" % tr.group(0))

    # ☠️ REGEL 5 — HÖJDEN ÄR MODELLENS, INTE SYSKONETS. Modell B:s alt-text
    #    bär 35,5 cm, som är modell A:s höjd. Att ärva den vore #266 igen.
    egen = dict(T.SPEC[pid])["Mått"]
    if egen not in txt:
        f.append("måttet %r står inte i brödtexten (regel 5)" % egen)

    # 5 — spec-tabellen ska stå ordagrant i html
    for k, v in T.SPEC[pid]:
        if ("<strong>%s:</strong> %s" % (k, v)) not in h:
            f.append("spec-raden %r saknas eller avviker" % k)

    # 6 — länkar
    for href in re.findall(r'href="([^"]+)"', h):
        if not href.startswith(T.BAS):
            f.append("icke-absolut länk %r" % href)
            continue
        slug = href[len(T.BAS):]
        if slug not in SLUGGAR:
            f.append("länk till okänd slug %r" % slug)
        if slug == T.SLUGG[pid]:
            f.append("länkar till sig själv")

    # 7 — längder
    if len(namn) > 80:
        f.append("namnet är %d tecken (max 80)" % len(namn))
    if len(titel) > 60:
        f.append("seo-titeln är %d tecken" % len(titel))
    if not (110 <= len(meta) <= 165):
        f.append("meta är %d tecken (110–165)" % len(meta))

    # 8 — sökordet ska stå i namn och meta
    huvud = T.SOKORD[pid].split()[0]
    if huvud not in namn.lower() or huvud not in meta.lower():
        f.append("sökordet %r saknas i namn eller meta" % huvud)

    # 9 — struktur
    for rubrik in ("Tekniska specifikationer", "Användning och skötsel",
                   "Vanliga frågor"):
        if ("<h2>%s</h2>" % rubrik) not in h:
            f.append("rubriken %r saknas" % rubrik)
    return f


# ------------------------------------------------------------- självtest

def sjalvtest():
    """Varje regel ska fälla när den bryts. En grind ingen testat är ingen."""
    pid = "d362f9b3"    # gångjärnsmodell (B)
    pid_c = "143bef7b"  # skjutdörrsmodell (C)
    h0 = T.beskrivning(pid)
    n0, t0, m0 = T.namn(pid), T.seo_titel(pid), T.seo_beskrivning(pid)

    def kor(h=h0, n=n0, t=t0, m=m0):
        return granska(pid, h, n, t, m)

    fall = [
        ("hälsa: nacke", "HÄLSOPÅSTÅENDE",
         lambda: kor(h=h0 + "<p>Skonar hundens nacke.</p>")),
        ("hälsa: magomvridning", "HÄLSOPÅSTÅENDE",
         lambda: kor(h=h0 + "<p>Minskar risken för magomvridning.</p>")),
        ("hälsa: bättre för", "HÄLSOPÅSTÅENDE",
         lambda: kor(h=h0 + "<p>Det är bättre för hunden.</p>")),
        ("hälsa: ergonomisk", "HÄLSOPÅSTÅENDE",
         lambda: kor(m=m0.replace("Matskåp", "Ergonomisk"))),
        ("husmärke", "leverantör/husmärke",
         lambda: kor(h=h0.replace("Matskåp", "PawHut matskåp"))),
        ("leverantören anger", "mot kunden är VI",
         lambda: kor(h=h0.replace("Två rostfria", "Leverantören anger två rostfria"))),
        ("avsändarland", "avsändarland",
         lambda: kor(h=h0 + "<p>Skickas från Tyskland.</p>")),
        ("tyska", "tyska",
         lambda: kor(h=h0.replace("skålar", "Näpfe"))),
        ("artikelnummer", "artikelnummer",
         lambda: kor(h=h0 + "<p>Artikelnummer: 845-030CG.</p>")),
        ("emoji", "emoji",
         lambda: kor(h=h0 + "<p>Bra val ✅</p>")),
        ("jargong", "intern jargong",
         lambda: kor(h=h0 + "<p>Se runda 4.</p>")),
        ("ohärlett tal", "ohärlett tal",
         lambda: kor(h=h0.replace("9 kg", "9,9 kg"))),
        ("ohärlett tal i meta", "ohärlett tal",
         lambda: kor(m=m0.replace("9 kg", "8,7 kg"))),
        ("spec-rad ändrad", "spec-raden",
         lambda: kor(h=h0.replace("<strong>Vikt:</strong> 9 kg",
                                  "<strong>Vikt:</strong> 9,7 kg"))),
        ("skålmaterial borta", "skålarnas material",
         lambda: kor(h=h0.replace("rostfri", "blank").replace("rostfritt", "blankt"))),
        ("relativ länk", "icke-absolut länk",
         lambda: kor(h=h0.replace('href="%s' % T.BAS, 'href="/'))),
        ("okänd slug", "okänd slug",
         lambda: kor(h=h0.replace(T.SLUGG["143bef7b"], "hittepa"))),
        ("självlänk", "länkar till sig själv",
         lambda: kor(h=h0.replace(T.SLUGG["143bef7b"], T.SLUGG[pid]))),
        ("för långt namn", "namnet är",
         lambda: kor(n=n0 + " " + "x" * 40)),
        ("för lång titel", "seo-titeln är",
         lambda: kor(t=t0 + " " + "x" * 40)),
        ("för kort meta", "meta är",
         lambda: kor(m="Kort.")),
        ("sökord borta ur namn", "sökordet",
         lambda: kor(n=n0.replace("Matskåp", "Möbel"))),
        ("rubrik borta", "rubriken",
         lambda: kor(h=h0.replace("<h2>Vanliga frågor</h2>", ""))),
        ("dubbelt blanksteg", "dubbelt blanksteg",
         lambda: kor(h=h0.replace("Matskåp", "Mat  skåp"))),
        # ☠️ Muteras genom att LÄGGA TILL, aldrig genom att byta ut ett uppmätt
        #    värde — annars fäller talgrinden först och den här kan vara helt
        #    avväpnad utan att testet märker något (runbokens m_kommalista).
        ("kommalista i brödtext", "kommalista av tal i brödtext",
         lambda: kor(h=h0 + "<p>Facken är 22, 22 och 16 cm.</p>")),
        ("kommalista i meta", "kommalista av tal i meta",
         lambda: kor(m="Matskåp för hund med fack på 22, 22 och 16 cm samt två "
                       "rostfria skålar i träfiberskiva, 9 kg, och "
                       "monteringsanvisning ingår i leveransen.")),
        # ☠️ REGEL 4 — fyra riktningar, för regeln är tvåvägs på två modeller.
        ("skjutdörrsord på B", "skjutdörrsord",
         lambda: kor(h=h0.replace("<h2>Fler matskåp",
                                  "<p>Dörrarna glider i en skena.</p><h2>Fler matskåp"))),
        ("dörrtypen borta på B", "dörrtypen sägs inte",
         lambda: kor(h=h0.replace("regelbeslag", "hakbeslag")
                          .replace("Regelbeslaget", "Hakbeslaget")
                          .replace("Gångjärn", "Beslagen"))),
        ("gångjärnsord på C", "gångjärnsord",
         lambda: granska(pid_c, T.beskrivning(pid_c).replace(
                             "<h2>Fler matskåp",
                             "<p>Luckorna har gångjärn.</p><h2>Fler matskåp"),
                         T.namn(pid_c), T.seo_titel(pid_c), T.seo_beskrivning(pid_c))),
        ("skjutdörrarna borta på C", "skjutdörrarna nämns inte",
         lambda: granska(pid_c,
                         T.beskrivning(pid_c).replace("skjutdörr", "lucka")
                           .replace("Skjutdörr", "Lucka")
                           .replace("glider i en skena", "sitter i en ram")
                           .replace("glider åt sidan", "öppnas"),
                         T.namn(pid_c), T.seo_titel(pid_c), T.seo_beskrivning(pid_c))),
        ("akryl borta på C", "akryldörrarna kallas inte akryl",
         lambda: granska(pid_c, T.beskrivning(pid_c).replace("akryl", "plast")
                           .replace("Akryl", "Plast"),
                         T.namn(pid_c), T.seo_titel(pid_c), T.seo_beskrivning(pid_c))),
        # ☠️ REGEL 5 — måttet ska vara modellens eget, inte syskonets.
        ("syskonets mått i brödtexten", "står inte i brödtexten",
         lambda: kor(h=h0.replace("60 × 30 × 43 cm", "60 × 30 × 35,5 cm"))),
    ]
    ok = 0
    for namn_t, vantat, f in fall:
        brister = f()
        traff = any(vantat in b for b in brister)
        print("  %s %-24s %s" % ("✓" if traff else "✗", namn_t,
                                 "" if traff else "FÄLLDE INTE"))
        ok += traff
    rent = granska(pid, h0, n0, t0, m0)
    print("  %s %-24s %s" % ("✓" if not rent else "✗", "ren text passerar",
                             "" if not rent else rent[:2]))
    ok += not rent

    # ☠️ EN RIKTNING TILL: decimalkommat får ALDRIG fällas. Utan det här fallet
    #    kunde mönstret skärpas till \d, \d och fälla varje decimaltal i
    #    katalogen — och alla fällande självtest hade fortsatt vara gröna.
    fria = [("decimaltal", h0 + "<p>Skåpet väger 13,5 kg.</p>"),
            ("uppräkning utan tal", h0 + "<p>Foder, koppel och godis.</p>")]
    for namn_t, h in fria:
        b = [x for x in granska(pid, h, n0, t0, m0) if "kommalista" in x]
        print("  %s %-24s %s" % ("✓" if not b else "✗", namn_t + " passerar",
                                 "" if not b else b))
        ok += not b
    n_fall = len(fall) + 1 + len(fria)
    print("\n%d/%d självtest" % (ok, n_fall))
    return ok == n_fall


if __name__ == "__main__":
    print("=== självtest ===")
    allt_ok = sjalvtest()
    print("\n=== granskning ===")
    fel = 0
    for pid in T.PRODUKTER:
        h = T.beskrivning(pid)
        b = granska(pid, h, T.namn(pid), T.seo_titel(pid), T.seo_beskrivning(pid))
        print("%s  %s  %4d tecken  %s" % (pid, T.GRUPP[pid], len(synlig(h)),
                                          "OK" if not b else "%d BRISTER" % len(b)))
        for x in b:
            print("    ✗", x)
            fel += 1
    print("\n%d brister" % fel)
    sys.exit(0 if (allt_ok and not fel) else 1)
