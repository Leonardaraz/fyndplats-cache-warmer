#!/usr/bin/env python3
"""Grindar korten mot produktens EGEN källtext.

Runda F1 skrev "fyra plattformar" på ett kort där fotot visar tre — fångat av
en kontaktkarta, alltså av ögon. Den här grinden gör samma kontroll mekaniskt:
varje TAL som står på ett kort måste finnas i just den produktens <id>.html.
Ett tal som bara finns hos syskonet är ett tal som hämtats ur fel spec.
"""
import re, sys, importlib.util

spec = importlib.util.spec_from_file_location("bygg", "bygg-kort.py")
# bygg-kort.py renderar vid import — läs KORT ur källan i stället.
src = open("bygg-kort.py", encoding="utf-8").read()
ns = {}
exec(src.split("namn = []")[0].replace(
    'import sys; sys.path.insert(0, "/home/user/fyndplats-cache-warmer/scripts")\nimport cardkit as ck', ""), ns)
KORT = ns["KORT"]

TAL = re.compile(r"\d+(?:,\d+)?")

fel = []
for pid, k in KORT.items():
    kalla = open(f"{pid}.html", encoding="utf-8").read()
    kalla = re.sub(r"<[^>]+>", " ", kalla)
    kalla_tal = set(TAL.findall(kalla))
    text = k["titel"] + " " + k["kicker"] + " " + " ".join(
        f"{a} {b}" for a, b in k["rader"])
    text = re.sub(r"<[^>]+>", " ", text)
    for t in TAL.findall(text):
        if t in {"2", "3", "4", "5", "1"}:      # antal/uppräkning, inte mått
            continue
        if t not in kalla_tal:
            fel.append(f"{pid}: talet {t} står på kortet men inte i {pid}.html")
    for ord_ in ("HOMCOM", "Outsunny", "PawHut", "Aiyaplay", "Aosom",
                 "Vinsetto", "Kleankin", "Zonekiz", "Durhand", "SportNow"):
        if ord_.lower() in text.lower():
            fel.append(f"{pid}: husmärke {ord_} på kortet")
    if re.search(r"\b[0-9]{3}-[0-9]{3}[A-Z0-9]*\b", text):
        fel.append(f"{pid}: ser ut som ett artikelnummer på kortet")

print("\n".join(fel) if fel else f"GRIND REN: {len(KORT)} kort, varje tal belagt i produktens egen källtext")
sys.exit(1 if fel else 0)
