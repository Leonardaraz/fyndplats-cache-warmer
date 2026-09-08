# -*- coding: utf-8 -*-
"""Familjegrind: alla TRETTON massagefåtöljssidorna live, inte bara rundans fem.

Uppgift #361: måttgrinden — och varje annan familjegrind — ska köras mot HELA
familjen. Steg 12:s fynd var just familjebrett: åtta LIVE-sidor bar en kropp
identisk med ett syskons.
"""
import re, subprocess, sys

FAMILJ = {
 "massagefatolj-brun-vridbar-fotpall":            ("Brun",     "brunt konstläder där både"),
 "massagefatolj-cremevit-vridbar-fotpall":        ("Cremevit", "cremevitt konstläder där både"),
 "massagefatolj-svart-vridbar-fotpall":           ("Svart",    "svart konstläder där både"),
 "massagefatolj-konstlader-fotpall-forvaring":    ("Svart",    "svart konstläder på en stomme"),
 "massagefatolj-cremevit-fotpall-forvaring":      ("Cremevit", "cremevitt konstläder på en stomme"),
 "massagefatolj-brun-fotpall-forvaring":          ("Brun",     "brunt konstläder på en stomme"),
 "massagefatolj-tyg-fotpall-forvaring":           ("Svart",    "svart tyg på en stomme"),
 "massagefatolj-morkgra-tyg-forvaring":           ("Mörkgrå",  "mörkgrått tyg på en stomme"),
 "massagefatolj-160-kg-cremevit":                 ("Cremevit", "cremevitt konstläder med extra hög rygg"),
 "massagefatolj-morkgra-160-kg":                  ("Mörkgrå",  "mörkgrått konstläder med extra hög rygg"),
 "massagefatolj-brun-160-kg":                     ("Brun",     "brunt konstläder med extra hög rygg"),
 "massagefatolj-svart-160-kg":                    ("Svart",    "svart konstläder med extra hög rygg"),
 "massagefatolj-156-cm-utfalld-svart":            ("Svart",    None),
}

def hamta(slug, forsok=3):
    for _ in range(forsok):
        p = subprocess.run(["curl", "-sS", "-w", "\n%{http_code}",
                            "https://www.fyndplats.se/produkt/" + slug],
                           capture_output=True, text=True)
        rader = p.stdout.rsplit("\n", 1)
        if len(rader) == 2 and rader[1] == "200":
            return rader[0]
    return None

def synlig(h):
    h = re.sub(r"(?is)<(script|style|noscript)[^>]*>.*?</\1>", " ", h)
    return re.sub(r"\s+", " ", re.sub(r"(?s)<[^>]+>", " ", h)).replace("&nbsp;", " ")

fel, kroppar = 0, {}
for slug, (farg, ingress) in FAMILJ.items():
    html = hamta(slug)
    if html is None:
        print("FEL %-45s svarar inte 200" % slug); fel += 1; continue
    t = synlig(html)
    brist = []
    if ("Färg: " + farg) not in t: brist.append("Färg-rad saknas")
    if ingress and ingress not in t: brist.append("färgen saknas i ingressen")
    # kroppens fingeravtryck = texten mellan ingressen och syskonlistan
    i = t.find("Fler massagefåtöljer hos oss")
    kropp = t[:i] if i > 0 else t
    kroppar.setdefault(hash(kropp[-2500:]), []).append(slug)
    print("%s %-45s %s" % ("OK " if not brist else "FEL", slug, "; ".join(brist)))
    if brist: fel += 1

dubbletter = [g for g in kroppar.values() if len(g) > 1]
print()
print("identiska kroppar:", dubbletter or "inga")
print("SUMMA: %d av %d sidor med anmärkning" % (fel, len(FAMILJ)))
sys.exit(1 if fel or dubbletter else 0)
