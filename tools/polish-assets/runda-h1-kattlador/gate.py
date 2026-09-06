#!/usr/bin/env python3
"""Filgrind för runda G1 — mönster, siffror, taggar och flikar.

☠️ SIFFERGRINDEN är den som biter: varje tal i den svenska texten måste finnas
i produktens EGNA tyska källtext. Facit (`kallor-tal.json`) är hämtat mekaniskt
ur Wix, inte avskrivet.
"""
import re, sys, json, glob, os, collections

MARKEN = r"HOMCOM|Outsunny|PawHut|Aiyaplay|Aosom|SportNow|Vinsetto|Kleankin|Zonekiz|Durhand"
ARTNR  = r"\b\d{3}-\d{3}[A-Z0-9]*\b|\b\d{2}[A-Z]-\d{3}"
LAND   = r"\b(Tyskland|Deutschland|tysk[at]?|Spanien|spansk|Polen|polsk|Kina|kines|EU-lager|skickas fr[åa]n|lagerland)\b"
LEV    = r"\b([Ll]everant[öo]r\w*|[Tt]illverkaren anger|vi vet inte|enligt uppgift)\b"
TYSKA  = r"(?<![a-zåäöéü])(und|mit|für|der|die|das|ist|sind|Sessel|Stuhl|Bezug|Kufen|Polsterung|Schaukel|Farbe|Gewicht|Lieferumfang|Montage|Rückenlehne|weich|kuschelig|flauschig)(?![a-zåäöéü])"
STAV   = r"\b(dögnsvarv|engangsjobb|ihopsattningen|for hard|hallbar|fatolj|hojd|langd|sakerhet|gungstol(?=en\b)(?!))\b"
HOMO   = r"[Ѐ-ӿͰ-Ͽ]"
NORM   = r"\bEN\s?\d{3,5}\b"
GRINDAR = [("HUSMÄRKE", MARKEN), ("ARTIKELNUMMER", ARTNR), ("FRAKTLAND", LAND),
           ("LEVERANTÖR", LEV), ("TYSK REST", TYSKA), ("STAVNING", STAV),
           ("HOMOGLYF", HOMO), ("EN-NORM UTAN KÄLLA", NORM)]
FLIKAR = ("Tekniska specifikationer", "Användning och skötsel", "Vanliga frågor")

def kropp(html):
    html = re.sub(r'href="[^"]*"', 'href=""', html)   # slug bär mått — en adress, inte ett påstående
    return re.sub(r"<[^>]+>", " ", html)

def tal(text):
    return {t.replace(".", ",").rstrip(",") for t in re.findall(r"\d+(?:[.,]\d+)?", text)}

kallor = json.load(open("kallor-tal.json"))
slug2kort = {l.split()[1]: l.split()[0] for l in open("slugs.txt") if l.strip()}

# ☠️ TVÅ LEGITIMA KÄLLOR UTÖVER PRODUKTENS EGEN SPEC — båda smala med flit.
#
# 1. RÅD-TAL. "minst 20 cm fritt bakom ryggstödet" är VÅR placeringsanvisning,
#    inte leverantörens mått. Den står redan på den publicerade
#    gungstol-beige-boucle-bokmedar, alltså husets etablerade formulering.
#    Ett råd-tal måste stå med i den här listan för att slippa igenom — det
#    går inte att smyga in ett påhittat produktmått som "råd".
RAD_TAL = {"20"}
#
# 2. SYSKONETS TAL. En korslänk beskriver grannprodukten ("den andra har 50 cm
#    bred sits"), och det talet står i GRANNENS källa, inte i den här. Grinden
#    följer därför länkarna: bara produkter den här sidan faktiskt länkar till
#    inom rundan bidrar med sina tal.
def syskontal(html):
    ut = set()
    for m in re.finditer(r'href="[^"]*/produkt/([a-z0-9-]+)"', html):
        k = slug2kort.get(m.group(1))
        if k: ut |= set(kallor.get(k, []))
    return ut
fynd = 0
filer = sorted(glob.glob("*.html"))
for f in filer:
    kort = os.path.basename(f)[:-5]
    txt = open(f, encoding="utf-8").read()
    k = kropp(txt)
    for namn, m in GRINDAR:
        for x in re.finditer(m, k):
            print(f"  {kort}: [{namn}] {x.group(0)!r} …{k[max(0,x.start()-45):x.end()+45].strip()}…"); fynd += 1
    op = collections.Counter(re.findall(r"<(\w+)[^>]*>", txt))
    cl = collections.Counter(re.findall(r"</(\w+)>", txt))
    for t in set(op) | set(cl):
        if op[t] != cl[t]: print(f"  {kort}: [TAGG] {t}: {op[t]} öppna, {cl[t]} stängda"); fynd += 1
    for r in FLIKAR:
        if f"<h2>{r}</h2>" not in txt: print(f"  {kort}: [FLIK] saknar <h2>{r}</h2>"); fynd += 1
    facit = set(kallor.get(kort, []))
    if not facit:
        print(f"  {kort}: [KÄLLA SAKNAS]"); fynd += 1; continue
    facit |= RAD_TAL | syskontal(txt)
    for t in sorted(tal(k) - facit, key=lambda x: (len(x), x)):
        print(f"  {kort}: [SIFFRA UTAN KÄLLA] {t!r}"); fynd += 1

print(f"\nGRIND: {fynd} fynd i {len(filer)} filer")
sys.exit(1 if fynd else 0)
