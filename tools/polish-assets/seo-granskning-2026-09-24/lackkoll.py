"""Kontrollerar lagningarna i #647 (`f3c55cca`, `02f123f9`) mot ett bygge.

    python3 lackkoll.py <bas-URL> [kakburk]

1. Omdirigeringarna: källa → väntad slutadress, med 308 i första hoppet och
   200 på slutet.
2. Blogginläggen: varje ny kategorilänk finns i den renderade sidan,
   hemmakontorsinläggets gamla länk till Hem & Inredning är borta och
   tullinläggets källa syns (den stod efter `---` och renderades aldrig).

Kakburken behövs bara för ett skyddat förhandsbygge: hämta en delningslänk
med `get_access_to_vercel_url` och låt curl följa den med `-c <kakburk>`
först. Mot www.fyndplats.se behövs ingen.

Utfall 2026-09-24: förhandsbygget `02f123f9` (dpl_9GZzcjgKRY6zd7fDW8WRAQMTyghD)
gav 14 av 14, och produktion före mergen gav 14 fel av 14. Skriptet fäller
alltså på det gamla och går igenom på det nya.
"""
import re
import subprocess
import sys

BAS = sys.argv[1].rstrip("/")
JAR = sys.argv[2] if len(sys.argv) > 2 else None
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36"


def hamta(path, folj=False):
    args = ["curl", "-sS", "-A", UA, "--max-time", "40", "-o", "/tmp/lk.html", "-w", "%{http_code} %{url_effective} %{redirect_url}"]
    if folj:
        args.append("-L")
    if JAR:
        args += ["-b", JAR, "-c", JAR]
    for _ in range(3):
        r = subprocess.run(args + [BAS + path], capture_output=True, text=True)
        if r.returncode == 0:
            kod, eff, red = (r.stdout.split(" ") + ["", "", ""])[:3]
            return kod, eff, red, open("/tmp/lk.html", encoding="utf-8", errors="replace").read()
    return "000", "", "", ""


OMDIR = {
    "/basta-i-test/massagepistoler": "/blogg/massagepistol-kopguide-2026",
    "/kopguider/massagepistoler": "/blogg/massagepistol-kopguide-2026",
    "/konstgjordablommor": "/kategori/konstvaxter",
    "/kategori/datormus": "/kategori/dator-gaming",
}
fel = 0
for kalla, mal in OMDIR.items():
    kod, _, red, _ = hamta(kalla)
    kod2, eff, _, _ = hamta(kalla, folj=True)
    ok = kod == "308" and red.endswith(mal) and kod2 == "200" and eff.endswith(mal)
    fel += not ok
    print(("OK  " if ok else "FEL ") + f"{kalla}: {kod} → {red.replace(BAS, '')} | slut {kod2} {eff.replace(BAS, '')}")

LANKAR = {
    "halloweendekoration-kopguide-2026": ["/kategori/halloweendekoration"],
    "klostrad-kopguide-2026": ["/kategori/klostrad"],
    "elbil-akbil-barn-kopguide": ["/kategori/elbilar-for-barn", "/kategori/motorcyklar-for-barn"],
    "paviljong-kopguide-2026": ["/kategori/solskydd-paviljonger"],
    "terrassvarmare-kopguide-2026": ["/kategori/terrassvarmare-infravarmare"],
    "barbar-projektor-kopguide-2026": ["/kategori/projektordukar"],
    "hemmakontor-tips": ["/kategori/kontorsstolar"],
    "trana-hemma-utan-utrustning": ["/kategori/hantlar-hantelset"],
    "mysig-hostinredning": ["/kategori/golvlampor"],
}
LANKAR["nya-tullreglerna-2026-eu-lager"] = []
for slug, maste in LANKAR.items():
    kod, _, _, html = hamta(f"/blogg/{slug}")
    main = re.search(r"<main[^>]*>(.*?)</main>", html, re.S)
    kropp = main.group(1) if main else html
    saknas = [m for m in maste if f'href="{m}"' not in kropp]
    extra = []
    if slug == "hemmakontor-tips" and re.search(r'>Kontor &amp; arbetsplats</a>', kropp):
        extra.append("gamla länken 'Kontor & arbetsplats' finns kvar")
    if slug == "hemmakontor-tips" and 'href="/kategori/skrivbord"' not in kropp:
        saknas.append("/kategori/skrivbord")
    if slug == "nya-tullreglerna-2026-eu-lager" and "Källa: Europeiska kommissionen" not in re.sub(r"<[^>]+>", "", kropp):
        extra.append("källan syns inte")
    ok = kod == "200" and not saknas and not extra
    fel += not ok
    print(("OK  " if ok else "FEL ") + f"/blogg/{slug}: {kod}" + (f" saknar {saknas}" if saknas else "") + (f" {extra}" if extra else ""))

print("KLART:", "inga fel" if not fel else f"{fel} fel")
sys.exit(1 if fel else 0)
