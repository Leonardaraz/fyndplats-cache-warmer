#!/usr/bin/env python3
"""Filgrind för alt-texterna i runda G1.

☠️ VARFÖR DEN FINNS. gate.py läser bara *.html, så alt.tsv gick genom hela
kedjan ogrindad — och en dansk stavning ("rundt bord") nådde Wix. Den fångades
bara för att nyttolasten råkade skrivas om för hand, alltså av tur och inte av
en spärr. Huset har lärt sig samma sak en gång förut, ett steg senare i kedjan:
ett sidsvep som strippar taggar ser inte in i alt="". Här är samma blinda fläck
FÖRE skrivningen.

Samma mönstergrindar som gate.py, plus siffergrinden: varje tal i en alt-text
måste stå i produktens EGNA tyska källtext (kallor-tal.json). Måttskisserna är
det enda som bär siffror, och de siffrorna är produktens mått.
"""
import re, sys, json, collections

sys.path.insert(0, ".")
MARKEN = r"HOMCOM|Outsunny|PawHut|Aiyaplay|Aosom|SportNow|Vinsetto|Kleankin|Zonekiz|Durhand"
ARTNR  = r"\b\d{3}-\d{3}[A-Z0-9]*\b|\b\d{2}[A-Z]-\d{3}"
LAND   = r"\b(Tyskland|Deutschland|tysk[at]?|Spanien|spansk|Polen|polsk|Kina|kines|EU-lager|skickas fr[åa]n|lagerland)\b"
LEV    = r"\b([Ll]everant[öo]r\w*|[Tt]illverkaren anger|vi vet inte|enligt uppgift)\b"
TYSKA  = r"(?<![a-zåäöéü])(und|mit|für|der|die|das|ist|sind|Sessel|Stuhl|Bezug|Kufen|Polsterung|Schaukel|Farbe|Gewicht|Lieferumfang|Montage|Rückenlehne|weich|kuschelig|flauschig)(?![a-zåäöéü])"
# Danska/norska former som ser svenska ut nog att slinka förbi ögat.
STAV   = r"\b(rundt|hvid|sort|gul[vt]|blød|hjørne|stof|læder|siddehøjde|ryglæn|fod(?=en\b)|dögnsvarv|engangsjobb|ihopsattningen|hallbar|fatolj|hojd|langd|sakerhet)\b"
HOMO   = r"[Ѐ-ӿͰ-Ͽ]"
NORM   = r"\bEN\s?\d{3,5}\b"
GRINDAR = [("HUSMÄRKE", MARKEN), ("ARTIKELNUMMER", ARTNR), ("FRAKTLAND", LAND),
           ("LEVERANTÖR", LEV), ("TYSK REST", TYSKA), ("STAVNING", STAV),
           ("HOMOGLYF", HOMO), ("EN-NORM UTAN KÄLLA", NORM)]

def tal(text):
    return {t.replace(".", ",").rstrip(",") for t in re.findall(r"\d+(?:[.,]\d+)?", text)}

kallor = json.load(open("kallor-tal.json"))
rader = [l.rstrip("\n").split("\t") for l in open("alt.tsv", encoding="utf-8") if l.strip()]

fynd = 0
per = collections.Counter()
sedda = collections.defaultdict(set)
for nr, r in enumerate(rader, 1):
    if len(r) != 3:
        print(f"alt.tsv:{nr}  FORM: {len(r)} kolumner, väntade 3"); fynd += 1; continue
    kort, pos, alt = r
    per[kort] += 1
    if pos in sedda[kort]:
        print(f"alt.tsv:{nr}  DUBBEL POSITION: {kort} position {pos} två gånger"); fynd += 1
    sedda[kort].add(pos)
    for namn, m in GRINDAR:
        for t in re.findall(m, alt):
            t = t if isinstance(t, str) else t[0]
            print(f"alt.tsv:{nr}  {namn}: {t!r}  ({kort})"); fynd += 1
    facit = set(kallor.get(kort, []))
    for t in tal(alt) - facit:
        print(f"alt.tsv:{nr}  SIFFRA UTAN KÄLLA: {t}  ({kort})"); fynd += 1

for kort, n in sorted(per.items()):
    if n != 5:
        print(f"ANTAL: {kort} har {n} alt-texter, väntade 5"); fynd += 1

print(f"GRIND {'REN' if not fynd else 'FÄLLER'}: {len(per)} produkter, {len(rader)} alt-texter, {fynd} fynd")
sys.exit(1 if fynd else 0)
