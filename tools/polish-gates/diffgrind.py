#!/usr/bin/env python3
"""Differentialgrind för en STÄDRUNDA — rättelser på redan publicerade sidor.

En städrunda skriver om sidor som polerades före dagens grindar. De bär
äldre avvikelser som rundan inte är till för att laga: flikar som saknas,
titlar över 60 tecken, korslänkar. Kör man kedjan rakt på dem faller den på
det gamla, och då finns bara två utvägar, och båda är dåliga: kvittera hela
grinden i `grind-undantag.txt` (och då ser den inte heller ett NYTT fel),
eller skriva om hela sidan (och då är det ingen städning längre).

Den här grinden jämför i stället grindutfallet FÖRE och EFTER rättelsen,
per produkt:

  1. ☠️ Inget nytt fynd. Varje fynd efter rättelsen måste ha funnits före.
     En rättelse som inför ett fel fäller rundan, i vilken grind det än är.
  2. ☠️ Noll fynd i målklasserna. Det rundan finns till för (tyska rester,
     arbetsord, leverantörsord, fraktland, symboler, osynliga tecken,
     superlativ om sortimentet, tomma alt-texter) ska vara BORTA, inte färre.

Det som återstår är de gamla avvikelserna, och de skrivs ut per skript som
underlag till `grind-undantag.txt`. Bygget kör kedjan en gång till och
kvitteringen gäller bara de skript som listas där.

☠️ FÖRE-TILLSTÅNDET ÄR DET PUBLICERADE, inte en tidigare version av filerna.
`fore/` skrivs när rundan skapas, direkt ur Wix, och ändras aldrig: texterna
(`fore/<kort>.html`) och `fore/namn.tsv`, `fore/seo.tsv`, `fore/alt.tsv`,
`fore/sku.tsv`. Rundans `kallor.json` är samma publicerade innehåll, så
siffergrinden mäter att rättelsen inte påstår något sidan inte redan sa.

Jämförelsen går på (skript, produkt, klass, träff), inte på hela raden:
utdragen runt en träff ändras när texten intill rättas, och då hade ett
gammalt fynd sett nytt ut.

ANVÄNDNING (från rundans katalog):  python3 ../../polish-gates/diffgrind.py
"""
import collections, io, os, re, shutil, subprocess, sys, tempfile

HAR = os.path.dirname(os.path.abspath(__file__))
KEDJA = ("gate.py", "gate-alt.py", "gate-seo.py", "gate-sku.py", "gate-lager.py",
         "gate-superlativ.py", "bygg-axelfacit.py", "gate-axel.py", "bygg-media.py")
FORE_FILER = ("namn.tsv", "seo.tsv", "alt.tsv", "sku.tsv")

# Det rundan finns till för. Ett enda fynd i någon av dem efter rättelsen fäller.
#
# ⚠️ `SIFFRA UTAN KÄLLA` och `OVÄNTAT TECKEN` står INTE här, med flit. Facit
# är den publicerade sidan, så ett nytt tal fälls redan av regel 1. Det som
# återstår är äldre avvikelser mellan titeln och brödtexten ("3 hyllplan" i
# titeln, "tre hyllplan" i texten) och minustecknet i "−18 °C" — sanna
# uppgifter som rundan inte är till för att skriva om.
MALKLASSER = {"HUSMÄRKE", "ARTIKELNUMMER", "FRAKTLAND", "LEVERANTÖR", "TYSK REST", "STAVNING",
              "HOMOGLYF", "INTERNT ORD", "SYMBOL", "OSYNLIGT TECKEN", "SUPERLATIV OM SORTIMENTET",
              "tom alt-text", "RELATIV LÄNK", "DUBBLETT",
              "NAMN HUSMÄRKE", "NAMN ARTIKELNUMMER", "NAMN FRAKTLAND", "NAMN LEVERANTÖR",
              "NAMN TYSK REST", "NAMN STAVNING", "NAMN HOMOGLYF", "NAMN INTERNT ORD", "NAMN SYMBOL",
              "NAMN OSYNLIGT TECKEN", "SLUG HUSMÄRKE"}

KORT = r"[0-9a-f]{8}"
MONSTER = [
    # gate.py, gate-seo.py, gate-lager.py, gate-superlativ.py:  "  kort: [KLASS] rest"
    (re.compile(rf"^\s*({KORT}): \[([^\]]+)\]\s*(.*)$"), lambda m: (m[1], m[2], m[3])),
    # gate-alt.py:  "alt.tsv:12  KLASS: 'träff'  (kort)"
    (re.compile(rf"^alt\.tsv:\d+\s+([^:]+): (.+?)\s+\(({KORT})\)$"), lambda m: (m[3], m[1], m[2])),
    # bygg-media.py:  "alt.tsv:12  kort position 3: tom alt-text"
    (re.compile(rf"^\s*alt\.tsv:\d+\s+({KORT}) position (\d+): (.+)$"), lambda m: (m[1], m[3], m[2])),
    # gate-sku.py:  "sku.tsv:3  [KLASS] … (kort)"
    (re.compile(rf"^sku\.tsv:\d+\s+\[([^\]]+)\]\s*(.*?)\s*\(({KORT})\)?$"), lambda m: (m[3], m[1], m[2])),
    # gate-alt.py, bygg-media.py:  "ANTAL: kort …"
    (re.compile(rf"^\s*(ANTAL|DUBBLETT|DUBBEL POSITION|STRUKEN BILD): ({KORT})\b(.*)$"),
     lambda m: (m[2], m[1], m[3])),
    # gate-sku.py:  "  [SAKNAS] kort finns i ids.tsv …"
    (re.compile(rf"^\s*\[(SAKNAS)\] ({KORT})\b(.*)$"), lambda m: (m[2], m[1], "")),
    # gate-axel.py:  "  kort: 242 cm är produktens B …"
    (re.compile(rf"^\s*({KORT}): ([\d,]+) cm är produktens\b(.*)$"), lambda m: (m[1], "AXEL", m[2])),
]
# gate-sku.py:  "sku.tsv:3  [DUBBLETT] 'FP-x' används av både a och b" — två produkter på en rad.
SKU_DUBBLETT = re.compile(rf"^sku\.tsv:\d+\s+\[DUBBLETT\] '([^']+)'.*?({KORT}).*?({KORT})")
AVBRYT_AXEL = re.compile(r"\[AVBRYT\] ingen måttrad hittad för: (.+)$")


def trafft(rest):
    """Träffen i en rad: det första citerade, annars raden fram till utdraget."""
    m = re.search(r"'([^']*)'", rest)
    if m:
        return m.group(1)
    return re.split(r" …| — ", rest.strip())[0][:80]


def fynd(katalog, skript):
    r = subprocess.run([sys.executable, os.path.join(HAR, skript)], cwd=katalog,
                       capture_output=True, text=True)
    ut = collections.Counter()
    for rad in (r.stdout + r.stderr).splitlines():
        m = SKU_DUBBLETT.match(rad)
        if m:
            for k in (m[2], m[3]):
                ut[(k, "DUBBLETT", m[1])] += 1
            continue
        m = AVBRYT_AXEL.search(rad)
        if m:
            for k in re.findall(KORT, m.group(1)):
                ut[(k, "INGEN MÅTTRAD", "")] += 1
            continue
        for rx, delar in MONSTER:
            m = rx.match(rad)
            if m:
                k, klass, rest = delar(m)
                ut[(k, klass.strip(), trafft(rest))] += 1
                break
    return ut, r.returncode


def kopia(src, dst, fore):
    shutil.copytree(src, dst, ignore=shutil.ignore_patterns("fore", "live", "ark", "orig", "skrivplan.json"))
    if fore:
        for f in os.listdir(os.path.join(src, "fore")):
            if f.endswith(".html") or f in FORE_FILER:
                shutil.copy(os.path.join(src, "fore", f), os.path.join(dst, f))


def main():
    if not os.path.isdir("fore"):
        sys.exit("[AVBRYT] fore/ saknas — differentialgrinden behöver det publicerade tillståndet")
    tmp = tempfile.mkdtemp(prefix="diffgrind-")
    fore_dir, efter_dir = os.path.join(tmp, "fore"), os.path.join(tmp, "efter")
    kopia(".", fore_dir, True)
    kopia(".", efter_dir, False)

    fel, arv = 0, collections.OrderedDict()
    for skript in KEDJA:
        fore, _ = fynd(fore_dir, skript)
        efter, kod = fynd(efter_dir, skript)
        nya = efter - fore
        mal = [x for x in efter.elements() if x[1] in MALKLASSER]
        rest = efter - collections.Counter(mal)
        print(f"{skript:20} före {sum(fore.values()):4}  efter {sum(efter.values()):4}  "
              f"nya {sum(nya.values()):3}  målklass kvar {len(mal):3}  kvar {sum(rest.values()):4}  exit {kod}")
        for x in sorted(nya.elements()):
            print(f"    NYTT  {x[0]}: [{x[1]}] {x[2]!r}")
        for x in sorted(set(mal)):
            print(f"    KVAR  {x[0]}: [{x[1]}] {x[2]!r}")
        fel += sum(nya.values()) + len(mal)
        if kod and not efter:
            # Skriptet föll utan ett enda tolkbart fynd — det är inget arv, det är ett okänt fel.
            print(f"    OTOLKAT  {skript} föll (exit {kod}) utan fynd som grinden kan läsa")
            fel += 1
        elif kod and not nya and not mal:
            arv[skript] = collections.Counter(x[1] for x in rest.elements())
    shutil.rmtree(tmp)

    if arv:
        print("\nÄldre avvikelser (fanns före rättelsen, inget nytt):")
        for skript, c in arv.items():
            print(f"  {skript}: " + ", ".join(f"{k} × {n}" for k, n in c.most_common()))
    print(f"\nDIFFGRIND: {'REN' if not fel else 'FÄLLER'} — {fel} nya fynd eller fynd i målklasserna")
    sys.exit(1 if fel else 0)


if __name__ == "__main__":
    main()
